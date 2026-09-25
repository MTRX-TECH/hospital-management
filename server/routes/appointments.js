import { Router } from 'express'
import { Appointment } from '../models/Appointment.js'
import { Patient } from '../models/Patient.js'
import { Doctor } from '../models/Doctor.js'
import { DoctorSchedule } from '../models/DoctorSchedule.js'
import { VisitRecord } from '../models/VisitRecord.js'
import { Payment } from '../models/Payment.js'
import { Notification } from '../models/Notification.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = Router()
const validStatuses = [
  'REQUESTED',
  'PENDING_PAYMENT',
  'CONFIRMED',
  'CHECKED_IN',
  'WAITING',
  'IN_CONSULTATION',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]

// Helper to format appointment document
function formatAppointment(app) {
  return {
    id: app._id,
    appointmentDate: app.appointmentDate,
    appointmentTime: app.appointmentTime,
    reason: app.reason,
    status: app.status,
    createdAt: app.createdAt,
    patientId: app.patient?._id,
    patient: app.patient?.user?.name || 'Unknown Patient',
    patientEmail: app.patient?.user?.email || '',
    patientPhone: app.patient?.user?.phone || '',
    patientGender: app.patient?.gender || '',
    patientBloodGroup: app.patient?.bloodGroup || '',
    patientDOB: app.patient?.dateOfBirth || '',
    doctorId: app.doctor?._id,
    doctor: app.doctor?.user?.name || 'Unknown Doctor',
    doctorPhone: app.doctor?.user?.phone || '',
    department: app.doctor?.department?.name || 'General',
    specialization: app.doctor?.specialization || '',
    consultationFee: app.doctor?.consultationFee || 500,
    // Payment details
    paymentStatus: app.paymentStatus || 'UNPAID',
    totalFee: app.totalFee || 500,
    advancePaid: app.advancePaid || 0,
    remainingBalance: app.remainingBalance ?? 500,
    paymentMethod: app.paymentMethod || '',
    transactionReference: app.transactionReference || '',
    paidAt: app.paidAt || null,
    // OPD Queue & Token details
    checkInStatus: app.checkInStatus || 'NOT_CHECKED_IN',
    checkInTime: app.checkInTime || null,
    queueToken: app.queueToken || '',
    queueNumber: app.queueNumber || 0,
    calledAt: app.calledAt || null,
    isSkipped: app.isSkipped || false,
    noShowAt: app.noShowAt || null,
    // Clinical Integration
    preConsultation: app.preConsultation || null,
    prescription: app.prescription || null,
  }
}

// GET /api/appointments - List appointments based on role and filters
router.get('/', authenticateToken, async (request, response) => {
  const { status, date } = request.query

  try {
    const filter = {}

    if (status && validStatuses.includes(status)) {
      filter.status = status
    }

    if (date) {
      filter.appointmentDate = date
    }

    // Role-based restrictions
    if (request.user.role === 'patient') {
      const patient = await Patient.findOne({ user: request.user.id })
      if (!patient) return response.json([])
      filter.patient = patient._id
    } else if (request.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: request.user.id })
      if (!doctor) return response.json([])
      filter.doctor = doctor._id
    }

    const appointments = await Appointment.find(filter)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email phone' },
      })
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name email phone' },
          { path: 'department', select: 'name' },
        ],
      })
      .sort({ appointmentDate: -1, appointmentTime: 1 })

    response.json(appointments.map(formatAppointment))
  } catch (error) {
    console.error('Fetch appointments error:', error)
    response.status(500).json({ message: 'Appointments could not be loaded.' })
  }
})

// GET /api/appointments/:id - Single appointment details
router.get('/:id', authenticateToken, async (request, response) => {
  try {
    const appointment = await Appointment.findById(request.params.id)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email phone' },
      })
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name email phone' },
          { path: 'department', select: 'name' },
        ],
      })

    if (!appointment) {
      return response.status(404).json({ message: 'Appointment not found.' })
    }

    // Access control check
    if (request.user.role === 'patient') {
      const patient = await Patient.findOne({ user: request.user.id })
      if (!patient || String(appointment.patient._id) !== String(patient._id)) {
        return response.status(403).json({ message: 'You are not authorized to view this appointment.' })
      }
    } else if (request.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: request.user.id })
      if (!doctor || String(appointment.doctor._id) !== String(doctor._id)) {
        return response.status(403).json({ message: 'You are not authorized to view this appointment.' })
      }
    }

    response.json(formatAppointment(appointment))
  } catch (error) {
    console.error('Fetch appointment error:', error)
    response.status(500).json({ message: 'Appointment details could not be loaded.' })
  }
})

// POST /api/appointments - Patient: Book a new appointment
router.post('/', authenticateToken, authorizeRoles('patient'), async (request, response) => {
  const { doctorId, appointmentDate, appointmentTime, reason, preConsultation, advancePaid } = request.body

  if (!doctorId || !appointmentDate || !appointmentTime || !reason || !reason.trim()) {
    return response.status(400).json({ message: 'Doctor, appointment date, time, and reason are required.' })
  }

  // Prevent booking past dates
  const requestedDateTime = new Date(`${appointmentDate}T${appointmentTime}`)
  if (isNaN(requestedDateTime.getTime()) || requestedDateTime <= new Date()) {
    return response.status(400).json({ message: 'Appointment date and time must be set in the future.' })
  }

  try {
    const patient = await Patient.findOne({ user: request.user.id }).populate('user', 'name')
    if (!patient) {
      return response.status(404).json({ message: 'Patient profile not found.' })
    }

    const doctor = await Doctor.findById(doctorId).populate('user', 'name')
    if (!doctor) {
      return response.status(404).json({ message: 'Doctor not found.' })
    }

    // Verify day of week schedule
    const dayOfWeek = new Date(`${appointmentDate}T12:00:00`).getDay()
    const schedules = await DoctorSchedule.find({
      doctor: doctorId,
      dayOfWeek,
      isAvailable: true,
    })

    const inSchedule = schedules.some((s) => appointmentTime >= s.startTime && appointmentTime < s.endTime)
    if (!inSchedule) {
      return response.status(400).json({ message: 'The doctor is not available at the selected time.' })
    }

    // 1. Doctor Appointment Collision Prevention
    const existingBooking = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate,
      appointmentTime,
      status: { $nin: ['CANCELLED', 'NO_SHOW'] },
    })

    if (existingBooking) {
      return response.status(409).json({ message: 'This appointment slot is no longer available. Please select another slot.' })
    }

    // 2. Patient Time Conflict Prevention (Single patient cannot book two doctors at the exact same date & time)
    const existingPatientBooking = await Appointment.findOne({
      patient: patient._id,
      appointmentDate,
      appointmentTime,
      status: { $nin: ['CANCELLED', 'NO_SHOW'] },
    }).populate({
      path: 'doctor',
      populate: { path: 'user', select: 'name' },
    })

    if (existingPatientBooking) {
      const conflictingDoctorName = existingPatientBooking.doctor?.user?.name || 'another specialist'
      return response.status(409).json({
        message: `Scheduling Conflict: You already have an active consultation scheduled with ${conflictingDoctorName} on ${appointmentDate} at ${appointmentTime}. You cannot book two doctor appointments for the exact same time slot.`,
      })
    }

    const totalFee = doctor.consultationFee || 500
    const advanceAmount = Number(advancePaid) || 0
    const paymentStatus = advanceAmount >= totalFee ? 'PAID' : advanceAmount > 0 ? 'PARTIALLY_PAID' : 'UNPAID'
    const status = advanceAmount > 0 ? 'CONFIRMED' : 'CONFIRMED' // Confirmed upon completion

    // Create appointment with pre-consultation and billing info
    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      appointmentDate,
      appointmentTime,
      reason: reason.trim(),
      status,
      totalFee,
      advancePaid: advanceAmount,
      remainingBalance: Math.max(0, totalFee - advanceAmount),
      paymentStatus,
      preConsultation: preConsultation
        ? {
            reason: preConsultation.reason || reason.trim(),
            symptoms: Array.isArray(preConsultation.symptoms) ? preConsultation.symptoms : [],
            symptomDuration: preConsultation.symptomDuration || '',
            existingConditions: Array.isArray(preConsultation.existingConditions) ? preConsultation.existingConditions : [],
            currentMedications: preConsultation.currentMedications || '',
            knownAllergies: preConsultation.knownAllergies || '',
            additionalNotes: preConsultation.additionalNotes || '',
            submittedAt: new Date(),
          }
        : { reason: reason.trim() },
    })

    // If advance payment was made during checkout, log payment record
    let createdPayment = null
    if (advanceAmount > 0) {
      const count = await Payment.countDocuments()
      const currentYear = new Date().getFullYear()
      const receiptNumber = `REC-${currentYear}-${String(count + 1001).padStart(5, '0')}`
      const transactionReference = `TXN-AAROGYA-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`

      createdPayment = await Payment.create({
        appointment: appointment._id,
        patient: patient._id,
        doctor: doctor._id,
        amount: advanceAmount,
        totalFee,
        type: advanceAmount >= totalFee ? 'FULL_PAYMENT' : 'ADVANCE_BOOKING',
        paymentMethod: request.body.paymentMethod || 'UPI',
        transactionReference,
        receiptNumber,
        status: 'SUCCESS',
        paidAt: new Date(),
      })

      appointment.paymentId = createdPayment._id.toString()
      appointment.transactionReference = transactionReference
      appointment.paymentMethod = createdPayment.paymentMethod
      appointment.paidAt = new Date()
      await appointment.save()
    }

    // Create notification for patient
    await Notification.create({
      user: request.user.id,
      title: 'Appointment Confirmed',
      message: `Your appointment with ${doctor.user?.name || 'doctor'} on ${appointmentDate} at ${appointmentTime} has been confirmed.`,
      type: 'appointment',
    })

    // Create notification for doctor
    if (doctor.user?._id) {
      await Notification.create({
        user: doctor.user._id,
        title: 'New Appointment Scheduled',
        message: `New confirmed appointment scheduled by ${patient.user?.name || 'Patient'} on ${appointmentDate} at ${appointmentTime}.`,
        type: 'appointment',
      })
    }

    response.status(201).json({
      message: 'Appointment confirmed successfully.',
      id: appointment._id,
      status: appointment.status,
      paymentStatus: appointment.paymentStatus,
      advancePaid: appointment.advancePaid,
      totalFee: appointment.totalFee,
      remainingBalance: appointment.remainingBalance,
      transactionReference: appointment.transactionReference,
      receiptNumber: createdPayment?.receiptNumber,
      paymentMethod: appointment.paymentMethod,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
    })
  } catch (error) {
    console.error('Book appointment error:', error)
    response.status(500).json({ message: 'Appointment could not be booked.' })
  }
})

// POST /api/appointments/:id/pre-consultation - Submit / update pre-consultation questionnaire
router.post('/:id/pre-consultation', authenticateToken, async (request, response) => {
  const { reason, symptoms, symptomDuration, existingConditions, currentMedications, knownAllergies, additionalNotes } =
    request.body

  try {
    const appointment = await Appointment.findById(request.params.id)
    if (!appointment) return response.status(404).json({ message: 'Appointment not found.' })

    // Verify patient owns appointment
    if (request.user.role === 'patient') {
      const patient = await Patient.findOne({ user: request.user.id })
      if (!patient || String(appointment.patient) !== String(patient._id)) {
        return response.status(403).json({ message: 'Unauthorized.' })
      }
    }

    const symptomsList = Array.isArray(symptoms)
      ? symptoms
      : typeof symptoms === 'string'
      ? symptoms.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    const conditionsList = Array.isArray(existingConditions)
      ? existingConditions
      : typeof existingConditions === 'string'
      ? existingConditions.split(',').map((c) => c.trim()).filter(Boolean)
      : []

    appointment.preConsultation = {
      reason: reason || appointment.reason || '',
      symptoms: symptomsList,
      symptomDuration: symptomDuration || '',
      existingConditions: conditionsList,
      currentMedications: currentMedications || '',
      knownAllergies: knownAllergies || '',
      additionalNotes: additionalNotes || '',
      submittedAt: new Date(),
    }

    await appointment.save()

    response.json({
      message: 'Pre-consultation details saved successfully.',
      preConsultation: appointment.preConsultation,
    })
  } catch (error) {
    console.error('Save pre-consultation error:', error)
    response.status(500).json({ message: 'Could not save pre-consultation details.' })
  }
})

// GET /api/appointments/:id/pre-consultation - Retrieve pre-consultation questionnaire
router.get('/:id/pre-consultation', authenticateToken, async (request, response) => {
  try {
    const appointment = await Appointment.findById(request.params.id).select('preConsultation reason patient doctor')
    if (!appointment) return response.status(404).json({ message: 'Appointment not found.' })

    response.json(appointment.preConsultation || { reason: appointment.reason })
  } catch (error) {
    console.error('Get pre-consultation error:', error)
    response.status(500).json({ message: 'Could not load pre-consultation details.' })
  }
})

// POST /api/appointments/:id/check-in - Self or Reception Check-In (generates sequential queue token)
router.post('/:id/check-in', authenticateToken, async (request, response) => {
  try {
    const appointment = await Appointment.findById(request.params.id)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } })
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name email phone' },
          { path: 'department', select: 'name' },
        ],
      })

    if (!appointment) return response.status(404).json({ message: 'Appointment not found.' })

    // Check cancellation
    if (appointment.status === 'CANCELLED') {
      return response.status(400).json({ message: 'Cancelled appointments cannot be checked in.' })
    }

    // Already checked in
    if (appointment.checkInStatus === 'CHECKED_IN' && appointment.queueToken) {
      return response.json({
        message: 'Already checked in.',
        queueToken: appointment.queueToken,
        queueNumber: appointment.queueNumber,
        status: appointment.status,
      })
    }

    // Generate OPD Doctor Token (e.g. Dr. Rajesh -> 'R-001')
    let prefix = 'Q'
    const docName = appointment.doctor?.user?.name || ''
    const cleanName = docName.replace(/^dr\.?\s*/i, '').trim()
    if (cleanName.length > 0) {
      prefix = cleanName[0].toUpperCase()
    }

    // Count checked-in patients for this doctor on this appointment date
    const checkedInCount = await Appointment.countDocuments({
      doctor: appointment.doctor._id,
      appointmentDate: appointment.appointmentDate,
      checkInStatus: 'CHECKED_IN',
    })

    const queueNumber = checkedInCount + 1
    const queueToken = `${prefix}-${String(queueNumber).padStart(3, '0')}`

    appointment.checkInStatus = 'CHECKED_IN'
    appointment.checkInTime = new Date()
    appointment.queueToken = queueToken
    appointment.queueNumber = queueNumber
    appointment.status = 'WAITING'
    await appointment.save()

    // Notify patient
    if (appointment.patient?.user?._id) {
      await Notification.create({
        user: appointment.patient.user._id,
        title: 'Check-In Successful',
        message: `Your check-in is complete! Queue Token: ${queueToken}. Please take a seat in the waiting lounge.`,
        type: 'reminder',
      })
    }

    response.json({
      message: 'Check-in successful! Your queue token has been generated.',
      queueToken,
      queueNumber,
      status: appointment.status,
      checkInTime: appointment.checkInTime,
    })
  } catch (error) {
    console.error('Check-in error:', error)
    response.status(500).json({ message: 'Check-in failed. Please try again.' })
  }
})

// GET /api/appointments/:id/queue - Live waiting room data for patient
router.get('/:id/queue', authenticateToken, async (request, response) => {
  try {
    const appointment = await Appointment.findById(request.params.id)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name' },
          { path: 'department', select: 'name' },
        ],
      })

    if (!appointment) return response.status(404).json({ message: 'Appointment not found.' })

    const doctorId = appointment.doctor._id
    const targetDate = appointment.appointmentDate

    // Find currently active consultation for this doctor today
    const activeAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: targetDate,
      status: 'IN_CONSULTATION',
    })

    // Find all checked-in or waiting appointments for doctor today
    const waitingAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: targetDate,
      checkInStatus: 'CHECKED_IN',
      status: { $in: ['WAITING', 'IN_CONSULTATION'] },
    }).sort({ queueNumber: 1, appointmentTime: 1 })

    // Calculate patients ahead
    let patientsAhead = 0
    if (appointment.queueNumber > 0) {
      patientsAhead = waitingAppointments.filter(
        (a) => a.queueNumber < appointment.queueNumber && a.status === 'WAITING'
      ).length
      if (activeAppointment && String(activeAppointment._id) !== String(appointment._id)) {
        patientsAhead += 1
      }
    }

    const estimatedWaitMinutes = Math.max(0, patientsAhead * 10)

    response.json({
      appointmentId: appointment._id,
      patientName: appointment.patient?.user?.name,
      doctorName: appointment.doctor?.user?.name,
      department: appointment.doctor?.department?.name || 'OPD',
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      queueToken: appointment.queueToken || 'NOT_ASSIGNED',
      queueNumber: appointment.queueNumber || 0,
      checkInStatus: appointment.checkInStatus,
      status: appointment.status,
      currentToken: activeAppointment?.queueToken || (waitingAppointments[0]?.queueToken ?? 'None'),
      isCurrentPatientCalled: appointment.status === 'IN_CONSULTATION' || !!(appointment.calledAt && !appointment.consultationEndTime),
      patientsAhead,
      estimatedWaitMinutes,
      totalWaiting: waitingAppointments.length,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Queue status error:', error)
    response.status(500).json({ message: 'Could not fetch waiting room queue status.' })
  }
})

// POST /api/appointments/:id/prescription - Save doctor's digital prescription
router.post('/:id/prescription', authenticateToken, authorizeRoles('doctor'), async (request, response) => {
  const { medicines, doctorAdvice, followUpDate } = request.body

  try {
    const doctor = await Doctor.findOne({ user: request.user.id })
    if (!doctor) return response.status(404).json({ message: 'Doctor profile not found.' })

    const appointment = await Appointment.findById(request.params.id)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } })

    if (!appointment) return response.status(404).json({ message: 'Appointment not found.' })
    if (String(appointment.doctor) !== String(doctor._id)) {
      return response.status(403).json({ message: 'Unauthorized.' })
    }

    appointment.prescription = {
      medicines: Array.isArray(medicines) ? medicines : [],
      doctorAdvice: doctorAdvice || '',
      followUpDate: followUpDate || '',
      prescribedAt: new Date(),
    }
    appointment.status = 'COMPLETED'
    await appointment.save()

    // Sync visit record
    let visit = await VisitRecord.findOne({ appointment: appointment._id })
    if (visit) {
      visit.prescription = appointment.prescription
      visit.diagnosisSummary = visit.diagnosisSummary || 'Consultation Completed'
      visit.doctorNotes = doctorAdvice || visit.doctorNotes
      await visit.save()
    } else {
      visit = await VisitRecord.create({
        appointment: appointment._id,
        doctor: doctor._id,
        patient: appointment.patient._id,
        diagnosisSummary: 'Consultation Completed',
        doctorNotes: doctorAdvice || '',
        prescription: appointment.prescription,
        preConsultation: appointment.preConsultation || {},
        totalFee: appointment.totalFee || 500,
        paymentStatus: appointment.paymentStatus || 'PAID',
      })
    }

    // Notify patient
    if (appointment.patient?.user?._id) {
      await Notification.create({
        user: appointment.patient.user._id,
        title: 'Prescription Slip Ready',
        message: `Dr. ${request.user.name} has issued your prescription. You can view and download your slip from My Prescriptions.`,
        type: 'status',
      })
    }

    response.json({
      message: 'Prescription saved successfully.',
      prescription: appointment.prescription,
      visitId: visit._id,
    })
  } catch (error) {
    console.error('Prescription save error:', error)
    response.status(500).json({ message: 'Could not save prescription.' })
  }
})

// GET /api/appointments/:id/prescription - View prescription slip details
router.get('/:id/prescription', authenticateToken, async (request, response) => {
  try {
    const appointment = await Appointment.findById(request.params.id)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } })
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name email phone' },
          { path: 'department', select: 'name' },
        ],
      })

    if (!appointment) return response.status(404).json({ message: 'Appointment not found.' })

    const prescription = appointment.prescription || { medicines: [] }

    response.json({
      appointmentId: appointment._id,
      patientName: appointment.patient?.user?.name || 'Patient',
      patientPhone: appointment.patient?.user?.phone || 'N/A',
      patientGender: appointment.patient?.gender || 'N/A',
      patientBloodGroup: appointment.patient?.bloodGroup || 'N/A',
      doctorName: appointment.doctor?.user?.name || 'Doctor',
      department: appointment.doctor?.department?.name || 'OPD',
      specialization: appointment.doctor?.specialization || 'Consultant',
      doctorPhone: appointment.doctor?.user?.phone || '',
      appointmentDate: appointment.appointmentDate,
      queueToken: appointment.queueToken || '-',
      medicines: prescription.medicines || [],
      doctorAdvice: prescription.doctorAdvice || '',
      followUpDate: prescription.followUpDate || '',
      prescribedAt: prescription.prescribedAt || appointment.updatedAt,
      hospitalName: 'Aarogya Multi-Speciality Hospital',
      hospitalAddress: 'Sector 14, Health City, New Delhi - 110001',
    })
  } catch (error) {
    console.error('Get prescription error:', error)
    response.status(500).json({ message: 'Could not fetch prescription.' })
  }
})

// PUT /api/appointments/:id/status - Doctor or Admin: Update appointment status
router.put('/:id/status', authenticateToken, authorizeRoles('admin', 'doctor'), async (request, response) => {
  const { status } = request.body

  if (!validStatuses.includes(status)) {
    return response.status(400).json({ message: `Invalid status. Allowed statuses: ${validStatuses.join(', ')}` })
  }

  try {
    const appointment = await Appointment.findById(request.params.id)
      .populate({ path: 'patient', populate: { path: 'user' } })
      .populate({ path: 'doctor', populate: { path: 'user' } })

    if (!appointment) {
      return response.status(404).json({ message: 'Appointment not found.' })
    }

    // If doctor role, verify appointment belongs to this doctor
    if (request.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: request.user.id })
      if (!doctor || String(appointment.doctor._id) !== String(doctor._id)) {
        return response.status(403).json({ message: 'You are not authorized to update this appointment.' })
      }
    }

    appointment.status = status
    await appointment.save()

    // Notify patient about the status change
    if (appointment.patient?.user?._id) {
      await Notification.create({
        user: appointment.patient.user._id,
        title: 'Appointment Status Updated',
        message: `Your appointment on ${appointment.appointmentDate} at ${appointment.appointmentTime} is now ${status}.`,
        type: 'status',
      })
    }

    response.json({
      message: `Appointment status updated to ${status}.`,
      status: appointment.status,
    })
  } catch (error) {
    console.error('Update appointment status error:', error)
    response.status(500).json({ message: 'Appointment status could not be updated.' })
  }
})

// DELETE /api/appointments/:id - Patient or Admin: Cancel an appointment
router.delete('/:id', authenticateToken, authorizeRoles('patient', 'admin'), async (request, response) => {
  try {
    const appointment = await Appointment.findById(request.params.id)
      .populate({ path: 'patient', populate: { path: 'user' } })
      .populate({ path: 'doctor', populate: { path: 'user' } })

    if (!appointment) {
      return response.status(404).json({ message: 'Appointment not found.' })
    }

    // If patient, ensure they own the appointment
    if (request.user.role === 'patient') {
      const patient = await Patient.findOne({ user: request.user.id })
      if (!patient || String(appointment.patient._id) !== String(patient._id)) {
        return response.status(403).json({ message: 'You can only cancel your own appointments.' })
      }

      if (appointment.status === 'COMPLETED') {
        return response.status(400).json({ message: 'Completed appointments cannot be cancelled.' })
      }
    }

    appointment.status = 'CANCELLED'
    await appointment.save()

    // Notify patient
    if (appointment.patient?.user?._id) {
      await Notification.create({
        user: appointment.patient.user._id,
        title: 'Appointment Cancelled',
        message: `Your appointment scheduled for ${appointment.appointmentDate} at ${appointment.appointmentTime} has been cancelled.`,
        type: 'status',
      })
    }

    // Notify doctor
    if (appointment.doctor?.user?._id) {
      await Notification.create({
        user: appointment.doctor.user._id,
        title: 'Appointment Cancelled',
        message: `The appointment for ${appointment.patient?.user?.name || 'patient'} on ${appointment.appointmentDate} has been cancelled.`,
        type: 'status',
      })
    }

    response.json({ message: 'Appointment cancelled successfully.' })
  } catch (error) {
    console.error('Cancel appointment error:', error)
    response.status(500).json({ message: 'Appointment could not be cancelled.' })
  }
})

export default router