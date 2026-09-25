import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { DoctorSchedule } from '../models/DoctorSchedule.js'
import { Doctor } from '../models/Doctor.js'
import { Appointment } from '../models/Appointment.js'
import { Patient } from '../models/Patient.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = Router()

// Helper: Convert "HH:mm" to total minutes from midnight
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

// Helper: Convert total minutes from midnight to "HH:mm"
function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

// GET /api/schedules/slots - Calculate available appointment slots for a given doctor and date
// Query params: doctorId, date (YYYY-MM-DD)
router.get('/slots', async (request, response) => {
  const { doctorId, date } = request.query

  if (!doctorId || !date) {
    return response.status(400).json({ message: 'Doctor ID and appointment date are required.' })
  }

  try {
    const doctor = await Doctor.findById(doctorId).populate('user', 'name')
    if (!doctor) {
      return response.status(404).json({ message: 'Doctor not found.' })
    }

    // Determine day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    // Parse using noon to avoid timezone shift
    const selectedDate = new Date(`${date}T12:00:00`)
    if (isNaN(selectedDate.getTime())) {
      return response.status(400).json({ message: 'Invalid date format. Expected YYYY-MM-DD.' })
    }

    const dayOfWeek = selectedDate.getDay()

    // Find doctor's availability schedules for this day
    const schedules = await DoctorSchedule.find({
      doctor: doctorId,
      dayOfWeek,
      isAvailable: true,
    })

    if (!schedules.length) {
      return response.json({
        doctor: doctor.user?.name,
        date,
        dayOfWeek,
        availableSlots: [],
        message: 'Doctor has no scheduled clinic hours on this day.',
      })
    }

    // Fetch existing non-cancelled appointments for this doctor on this date
    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: date,
      status: { $ne: 'CANCELLED' },
    }).select('appointmentTime')

    const bookedTimes = new Set(bookedAppointments.map((a) => a.appointmentTime))

    // Check if the requesting patient already has an active appointment with another doctor on this date & time
    let patientBookedTimes = new Set()
    let resolvedPatientId = request.query.patientId

    if (!resolvedPatientId && request.headers.authorization) {
      try {
        const token = request.headers.authorization.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'aarogya-hospital-jwt-secret-key-2026')
        if (decoded && decoded.role === 'patient') {
          const p = await Patient.findOne({ user: decoded.id })
          if (p) resolvedPatientId = p._id
        }
      } catch {
        // Optional token for public previews
      }
    }

    if (resolvedPatientId) {
      const patientAppointments = await Appointment.find({
        patient: resolvedPatientId,
        appointmentDate: date,
        status: { $ne: 'CANCELLED' },
      }).select('appointmentTime')
      patientBookedTimes = new Set(patientAppointments.map((a) => a.appointmentTime))
    }

    // Current time check if booking for today
    const now = new Date()
    const isToday = now.toISOString().slice(0, 10) === date
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const allSlots = []

    for (const schedule of schedules) {
      const startMin = timeToMinutes(schedule.startTime)
      const endMin = timeToMinutes(schedule.endTime)
      const duration = schedule.slotDuration || 30

      for (let min = startMin; min + duration <= endMin; min += duration) {
        const slotTime = minutesToTime(min)

        // If today, exclude slots that have already passed
        if (isToday && min <= currentMinutes) {
          continue
        }

        const isBooked = bookedTimes.has(slotTime)
        const isPatientConflict = patientBookedTimes.has(slotTime)

        allSlots.push({
          time: slotTime,
          isBooked,
          isPatientConflict,
        })
      }
    }

    // Sort slots chronologically
    allSlots.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))

    // Available slots exclude doctor-booked slots and patient-conflict slots
    const availableSlots = allSlots.filter((slot) => !slot.isBooked && !slot.isPatientConflict).map((slot) => slot.time)

    response.json({
      doctor: doctor.user?.name,
      date,
      dayOfWeek,
      allSlots,
      availableSlots,
      bookedSlots: Array.from(bookedTimes),
      patientConflictSlots: Array.from(patientBookedTimes),
    })
  } catch (error) {
    console.error('Calculate slots error:', error)
    response.status(500).json({ message: 'Could not calculate available slots.' })
  }
})

// GET /api/schedules/doctor/:doctorId - Get all schedule entries for a doctor
router.get('/doctor/:doctorId', async (request, response) => {
  try {
    const schedules = await DoctorSchedule.find({ doctor: request.params.doctorId }).sort({ dayOfWeek: 1, startTime: 1 })
    response.json(schedules)
  } catch (error) {
    console.error('Fetch doctor schedules error:', error)
    response.status(500).json({ message: 'Doctor schedules could not be loaded.' })
  }
})

// POST /api/schedules - Admin or Doctor: Create or update schedule entry
router.post('/', authenticateToken, authorizeRoles('admin', 'doctor'), async (request, response) => {
  const { doctorId, dayOfWeek, startTime, endTime, slotDuration, isAvailable } = request.body

  if (doctorId === undefined || dayOfWeek === undefined || !startTime || !endTime) {
    return response.status(400).json({ message: 'Doctor ID, day of week, start time, and end time are required.' })
  }

  try {
    let targetDoctorId = doctorId

    // If role is doctor, verify they only edit their own schedule
    if (request.user.role === 'doctor') {
      const doc = await Doctor.findOne({ user: request.user.id })
      if (!doc) {
        return response.status(404).json({ message: 'Doctor profile not found.' })
      }
      targetDoctorId = doc._id
    }

    const schedule = await DoctorSchedule.findOneAndUpdate(
      { doctor: targetDoctorId, dayOfWeek, startTime },
      {
        doctor: targetDoctorId,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        slotDuration: Number(slotDuration) || 30,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      },
      { upsert: true, new: true }
    )

    response.status(201).json(schedule)
  } catch (error) {
    console.error('Save schedule error:', error)
    response.status(500).json({ message: 'Doctor schedule could not be saved.' })
  }
})

// DELETE /api/schedules/:id - Admin or Doctor: Delete schedule entry
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'doctor'), async (request, response) => {
  try {
    const schedule = await DoctorSchedule.findById(request.params.id)
    if (!schedule) {
      return response.status(404).json({ message: 'Schedule entry not found.' })
    }

    if (request.user.role === 'doctor') {
      const doc = await Doctor.findOne({ user: request.user.id })
      if (!doc || String(schedule.doctor) !== String(doc._id)) {
        return response.status(403).json({ message: 'You are not authorized to delete this schedule.' })
      }
    }

    await DoctorSchedule.findByIdAndDelete(request.params.id)
    response.json({ message: 'Schedule entry removed.' })
  } catch (error) {
    console.error('Delete schedule error:', error)
    response.status(500).json({ message: 'Could not remove schedule entry.' })
  }
})

export default router
