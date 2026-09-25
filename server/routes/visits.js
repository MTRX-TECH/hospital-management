import { Router } from 'express'
import { VisitRecord } from '../models/VisitRecord.js'
import { Appointment } from '../models/Appointment.js'
import { Doctor } from '../models/Doctor.js'
import { Patient } from '../models/Patient.js'
import { Notification } from '../models/Notification.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = Router()

// GET /api/visits - Get visit records filtered by role
router.get('/', authenticateToken, async (request, response) => {
  const { patientId } = request.query

  try {
    const filter = {}

    if (request.user.role === 'patient') {
      const patient = await Patient.findOne({ user: request.user.id })
      if (!patient) return response.json([])
      filter.patient = patient._id
    } else if (request.user.role === 'doctor') {
      if (patientId) {
        // Doctor viewing specific patient's visit history
        filter.patient = patientId
      } else if (request.query.all !== 'true') {
        const doctor = await Doctor.findOne({ user: request.user.id })
        if (!doctor) return response.json([])
        filter.doctor = doctor._id
      }
    } else if (patientId) {
      filter.patient = patientId
    }

    const records = await VisitRecord.find(filter)
      .populate('appointment')
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name email phone' },
          { path: 'department', select: 'name' },
        ],
      })
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email phone' },
      })
      .sort({ createdAt: -1 })

    const formatted = records.map((rec) => ({
      id: rec._id,
      appointmentId: rec.appointment?._id,
      appointmentDate: rec.appointment?.appointmentDate || 'N/A',
      appointmentTime: rec.appointment?.appointmentTime || '',
      reason: rec.appointment?.reason || '',
      diagnosisSummary: rec.diagnosisSummary || 'General consultation',
      doctorNotes: rec.doctorNotes || 'No additional notes provided.',
      reportImageUrl: rec.reportImageUrl || '',
      doctorName: rec.doctor?.user?.name || 'Doctor',
      department: rec.doctor?.department?.name || 'General',
      patientName: rec.patient?.user?.name || 'Patient',
      patientPhone: rec.patient?.user?.phone || '',
      patientGender: rec.patient?.gender || '',
      patientBloodGroup: rec.patient?.bloodGroup || '',
      patientId: rec.patient?._id,
      preConsultation: rec.preConsultation || rec.appointment?.preConsultation || null,
      prescription: rec.prescription || rec.appointment?.prescription || null,
      totalFee: rec.totalFee || rec.appointment?.totalFee || 500,
      paymentStatus: rec.paymentStatus || rec.appointment?.paymentStatus || 'PAID',
      createdAt: rec.createdAt,
    }))

    response.json(formatted)
  } catch (error) {
    console.error('Fetch visits error:', error)
    response.status(500).json({ message: 'Visit history could not be loaded.' })
  }
})

// POST /api/visits - Doctor: Record diagnosis, notes, prescription, and Cloudinary report image
router.post('/', authenticateToken, authorizeRoles('doctor'), async (request, response) => {
  const { appointmentId, diagnosisSummary, doctorNotes, reportImageUrl, prescription } = request.body

  if (!appointmentId) {
    return response.status(400).json({ message: 'Appointment ID is required.' })
  }

  try {
    const doctor = await Doctor.findOne({ user: request.user.id }).populate('user', 'name')
    if (!doctor) {
      return response.status(404).json({ message: 'Doctor profile not found.' })
    }

    const appointment = await Appointment.findById(appointmentId).populate({
      path: 'patient',
      populate: { path: 'user' },
    })

    if (!appointment) {
      return response.status(404).json({ message: 'Appointment not found.' })
    }

    if (String(appointment.doctor) !== String(doctor._id)) {
      return response.status(403).json({ message: 'You are not assigned to this appointment.' })
    }

    // Automatically mark the appointment as COMPLETED if not already
    if (appointment.status !== 'COMPLETED') {
      appointment.status = 'COMPLETED'
    }

    // If prescription included, update appointment prescription too
    if (prescription && prescription.medicines) {
      appointment.prescription = {
        medicines: prescription.medicines,
        doctorAdvice: prescription.doctorAdvice || doctorNotes || '',
        followUpDate: prescription.followUpDate || '',
        prescribedAt: new Date(),
      }
    }
    await appointment.save()

    // Check if visit record already exists
    let record = await VisitRecord.findOne({ appointment: appointmentId })
    if (record) {
      record.diagnosisSummary = diagnosisSummary || record.diagnosisSummary
      record.doctorNotes = doctorNotes || record.doctorNotes
      if (reportImageUrl !== undefined) {
        record.reportImageUrl = reportImageUrl ? reportImageUrl.trim() : record.reportImageUrl
      }
      if (prescription) {
        record.prescription = appointment.prescription
      }
      record.preConsultation = appointment.preConsultation || record.preConsultation
      await record.save()
    } else {
      record = await VisitRecord.create({
        appointment: appointmentId,
        doctor: doctor._id,
        patient: appointment.patient._id,
        diagnosisSummary: diagnosisSummary ? diagnosisSummary.trim() : 'General consultation',
        doctorNotes: doctorNotes ? doctorNotes.trim() : '',
        reportImageUrl: reportImageUrl ? reportImageUrl.trim() : '',
        preConsultation: appointment.preConsultation || {},
        prescription: appointment.prescription || {},
        totalFee: appointment.totalFee || 500,
        paymentStatus: appointment.paymentStatus || 'PAID',
      })
    }

    // Notify patient that doctor notes were added
    if (appointment.patient?.user?._id) {
      await Notification.create({
        user: appointment.patient.user._id,
        title: 'Doctor Notes & Prescription Added',
        message: `${doctor.user?.name || 'Doctor'} has published visit notes and care summary for your visit.`,
        type: 'status',
      })
    }

    response.status(201).json({
      message: 'Visit record and clinical notes saved successfully.',
      id: record._id,
    })
  } catch (error) {
    console.error('Create visit record error:', error)
    response.status(500).json({ message: 'Visit record could not be saved.' })
  }
})

export default router