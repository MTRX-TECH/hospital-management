import { Router } from 'express'
import { Appointment } from '../models/Appointment.js'
import { Doctor } from '../models/Doctor.js'
import { Patient } from '../models/Patient.js'
import { VisitRecord } from '../models/VisitRecord.js'
import { Notification } from '../models/Notification.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = Router()

// Helper to get today's date in YYYY-MM-DD
function getTodayDateString() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// GET /api/doctor-queue/today - Doctor's live OPD queue board
router.get('/today', authenticateToken, authorizeRoles('doctor', 'admin'), async (request, response) => {
  try {
    let doctorId = request.query.doctorId
    const targetDate = request.query.date || getTodayDateString()

    if (request.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: request.user.id })
      if (!doctor) return response.status(404).json({ message: 'Doctor profile not found.' })
      doctorId = doctor._id
    }

    if (!doctorId) {
      return response.status(400).json({ message: 'Doctor ID is required.' })
    }

    const appointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: targetDate,
      status: { $ne: 'CANCELLED' },
    })
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } })
      .sort({ queueNumber: 1, appointmentTime: 1 })

    // Summary counters
    const totalScheduled = appointments.length
    const checkedInCount = appointments.filter((a) => a.checkInStatus === 'CHECKED_IN').length
    const waitingCount = appointments.filter((a) => a.status === 'WAITING' || (a.checkInStatus === 'CHECKED_IN' && a.status === 'CONFIRMED')).length
    const inConsultation = appointments.find((a) => a.status === 'IN_CONSULTATION') || null
    const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length
    const noShowCount = appointments.filter((a) => a.status === 'NO_SHOW').length

    // Next patient to be called
    const nextInLine = appointments.find(
      (a) => (a.status === 'WAITING' || a.checkInStatus === 'CHECKED_IN') && a.status !== 'IN_CONSULTATION' && a.status !== 'COMPLETED' && a.status !== 'NO_SHOW' && !a.isSkipped
    ) || appointments.find((a) => a.status === 'WAITING' || a.checkInStatus === 'CHECKED_IN') || null

    response.json({
      targetDate,
      stats: {
        totalScheduled,
        checkedInCount,
        waitingCount,
        inConsultationCount: inConsultation ? 1 : 0,
        completedCount,
        noShowCount,
      },
      activeConsultation: inConsultation
        ? {
            id: inConsultation._id,
            queueToken: inConsultation.queueToken || `OPD-${inConsultation._id.toString().slice(-3)}`,
            queueNumber: inConsultation.queueNumber,
            patientName: inConsultation.patient?.user?.name || 'Patient',
            patientPhone: inConsultation.patient?.user?.phone || 'N/A',
            patientBloodGroup: inConsultation.patient?.bloodGroup || 'N/A',
            patientGender: inConsultation.patient?.gender || 'N/A',
            patientDOB: inConsultation.patient?.dateOfBirth || 'N/A',
            appointmentTime: inConsultation.appointmentTime,
            reason: inConsultation.reason,
            preConsultation: inConsultation.preConsultation,
            consultationStartTime: inConsultation.consultationStartTime,
          }
        : null,
      nextInLine: nextInLine
        ? {
            id: nextInLine._id,
            queueToken: nextInLine.queueToken,
            patientName: nextInLine.patient?.user?.name,
            appointmentTime: nextInLine.appointmentTime,
          }
        : null,
      queue: appointments.map((a) => ({
        id: a._id,
        appointmentTime: a.appointmentTime,
        patientId: a.patient?._id,
        patientName: a.patient?.user?.name || 'Patient',
        patientPhone: a.patient?.user?.phone || 'N/A',
        patientBloodGroup: a.patient?.bloodGroup || 'N/A',
        patientGender: a.patient?.gender || 'N/A',
        reason: a.reason,
        status: a.status,
        checkInStatus: a.checkInStatus,
        checkInTime: a.checkInTime,
        queueToken: a.queueToken || '-',
        queueNumber: a.queueNumber,
        calledAt: a.calledAt,
        isSkipped: a.isSkipped,
        paymentStatus: a.paymentStatus,
        preConsultation: a.preConsultation,
        hasPrescription: !!(a.prescription && a.prescription.medicines && a.prescription.medicines.length > 0),
      })),
    })
  } catch (error) {
    console.error('Fetch doctor queue error:', error)
    response.status(500).json({ message: 'Doctor queue could not be loaded.' })
  }
})

// POST /api/doctor-queue/call-next - Doctor calls a patient into OPD room
router.post('/call-next', authenticateToken, authorizeRoles('doctor'), async (request, response) => {
  const { appointmentId } = request.body
  try {
    const doctor = await Doctor.findOne({ user: request.user.id })
    if (!doctor) return response.status(404).json({ message: 'Doctor profile not found.' })

    const appointment = await Appointment.findById(appointmentId)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } })

    if (!appointment) return response.status(404).json({ message: 'Appointment not found.' })
    if (String(appointment.doctor) !== String(doctor._id)) {
      return response.status(403).json({ message: 'Unauthorized access to this queue item.' })
    }

    appointment.calledAt = new Date()
    appointment.isSkipped = false
    await appointment.save()

    // Notify patient
    if (appointment.patient?.user?._id) {
      await Notification.create({
        user: appointment.patient.user._id,
        title: 'Doctor Calling Your Token',
        message: `Your token ${appointment.queueToken || 'appointment'} is called by Dr. ${request.user.name}. Please proceed inside the consultation room.`,
        type: 'reminder',
      })
    }

    response.json({
      message: `Token ${appointment.queueToken || ''} called successfully.`,
      calledAt: appointment.calledAt,
    })
  } catch (error) {
    console.error('Call patient error:', error)
    response.status(500).json({ message: 'Could not call patient.' })
  }
})

// POST /api/doctor-queue/start-consultation - Begin consultation
router.post('/start-consultation', authenticateToken, authorizeRoles('doctor'), async (request, response) => {
  const { appointmentId } = request.body
  try {
    const doctor = await Doctor.findOne({ user: request.user.id })
    if (!doctor) return response.status(404).json({ message: 'Doctor profile not found.' })

    const appointment = await Appointment.findById(appointmentId)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })

    if (!appointment) return response.status(404).json({ message: 'Appointment not found.' })
    if (String(appointment.doctor) !== String(doctor._id)) {
      return response.status(403).json({ message: 'Unauthorized.' })
    }

    appointment.status = 'IN_CONSULTATION'
    appointment.consultationStartTime = new Date()
    await appointment.save()

    response.json({
      message: `Consultation started with ${appointment.patient?.user?.name || 'patient'}.`,
      appointmentId: appointment._id,
      status: appointment.status,
    })
  } catch (error) {
    console.error('Start consultation error:', error)
    response.status(500).json({ message: 'Could not start consultation.' })
  }
})

// POST /api/doctor-queue/complete-consultation - Complete & save prescription / visit record
router.post('/complete-consultation', authenticateToken, authorizeRoles('doctor'), async (request, response) => {
  const {
    appointmentId,
    diagnosisSummary = '',
    doctorNotes = '',
    medicines = [],
    doctorAdvice = '',
    followUpDate = '',
    reportImageUrl = '',
  } = request.body

  try {
    const doctor = await Doctor.findOne({ user: request.user.id })
    if (!doctor) return response.status(404).json({ message: 'Doctor profile not found.' })

    const appointment = await Appointment.findById(appointmentId)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } })

    if (!appointment) return response.status(404).json({ message: 'Appointment not found.' })
    if (String(appointment.doctor) !== String(doctor._id)) {
      return response.status(403).json({ message: 'Unauthorized.' })
    }

    // Sanitize medicines list to ensure both name and tabletName are set
    const sanitizedMedicines = (medicines || []).map((m) => {
      const tablet = m.tabletName || m.name || 'Prescription Tablet'
      return {
        name: tablet,
        tabletName: tablet,
        dosage: m.dosage || '',
        frequency: m.frequency || m.numberOfTimes || '1 time daily',
        numberOfTimes: m.numberOfTimes || m.frequency || '1 time daily',
        timing: m.timing || '',
        duration: m.duration || '5 Days',
        instructions: m.instructions || '',
      }
    })

    // Save prescription on appointment
    appointment.prescription = {
      medicines: sanitizedMedicines,
      doctorAdvice: doctorAdvice || doctorNotes,
      followUpDate: followUpDate || '',
      prescribedAt: new Date(),
    }
    appointment.status = 'COMPLETED'
    appointment.consultationEndTime = new Date()
    await appointment.save()

    // Sync or create VisitRecord
    let visit = await VisitRecord.findOne({ appointment: appointment._id })
    if (visit) {
      visit.diagnosisSummary = diagnosisSummary || 'Consultation completed'
      visit.doctorNotes = doctorNotes || doctorAdvice
      visit.reportImageUrl = reportImageUrl || visit.reportImageUrl || ''
      visit.preConsultation = appointment.preConsultation || {}
      visit.prescription = appointment.prescription
      await visit.save()
    } else {
      visit = await VisitRecord.create({
        appointment: appointment._id,
        doctor: doctor._id,
        patient: appointment.patient._id,
        diagnosisSummary: diagnosisSummary || 'Consultation completed',
        doctorNotes: doctorNotes || doctorAdvice,
        reportImageUrl: reportImageUrl || '',
        preConsultation: appointment.preConsultation || {},
        prescription: appointment.prescription,
        totalFee: appointment.totalFee || 500,
        paymentStatus: appointment.paymentStatus || 'PAID',
      })
    }

    // Send notification to patient
    if (appointment.patient?.user?._id) {
      await Notification.create({
        user: appointment.patient.user._id,
        title: 'Consultation Completed & Prescription Issued',
        message: `Dr. ${request.user.name} has completed your consultation and issued your digital prescription slip.`,
        type: 'status',
      })
    }

    response.json({
      message: 'Consultation completed and prescription saved successfully.',
      visitId: visit._id,
      status: appointment.status,
    })
  } catch (error) {
    console.error('Complete consultation error:', error)
    response.status(500).json({ message: 'Could not complete consultation.' })
  }
})

// POST /api/doctor-queue/skip-patient - Put patient on hold/skipped
router.post('/skip-patient', authenticateToken, authorizeRoles('doctor'), async (request, response) => {
  const { appointmentId } = request.body
  try {
    const doctor = await Doctor.findOne({ user: request.user.id })
    if (!doctor) return response.status(404).json({ message: 'Doctor profile not found.' })

    const appointment = await Appointment.findById(appointmentId)
    if (!appointment) return response.status(404).json({ message: 'Appointment not found.' })

    appointment.isSkipped = true
    await appointment.save()

    response.json({ message: `Patient token ${appointment.queueToken || ''} temporarily held.`, isSkipped: true })
  } catch (error) {
    console.error('Skip patient error:', error)
    response.status(500).json({ message: 'Could not skip patient.' })
  }
})

// POST /api/doctor-queue/mark-no-show - Patient absent past grace period
router.post('/mark-no-show', authenticateToken, authorizeRoles('doctor', 'admin'), async (request, response) => {
  const { appointmentId, reason = 'Patient absent during queue calls' } = request.body
  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })

    if (!appointment) return response.status(404).json({ message: 'Appointment not found.' })

    appointment.status = 'NO_SHOW'
    appointment.noShowAt = new Date()
    await appointment.save()

    // Notify patient
    if (appointment.patient?.user?._id) {
      await Notification.create({
        user: appointment.patient.user._id,
        title: 'Appointment Marked as No-Show',
        message: `Your appointment with Dr. ${appointment.doctor?.user?.name || 'Doctor'} on ${appointment.appointmentDate} was marked as No-Show because you did not check in or respond during OPD calls. Reason: ${reason}`,
        type: 'reminder',
      })
    }

    response.json({
      message: `Appointment marked as No-Show.`,
      status: appointment.status,
      noShowAt: appointment.noShowAt,
    })
  } catch (error) {
    console.error('Mark no show error:', error)
    response.status(500).json({ message: 'Could not mark no show.' })
  }
})

export default router
