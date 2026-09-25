import { Router } from 'express'
import { Patient } from '../models/Patient.js'
import { Appointment } from '../models/Appointment.js'
import { VisitRecord } from '../models/VisitRecord.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = Router()

// GET /api/patients - Admin: List all registered patients
router.get('/', authenticateToken, authorizeRoles('admin', 'doctor'), async (_request, response) => {
  try {
    const patients = await Patient.find()
      .populate('user', 'name email phone createdAt')
      .sort({ createdAt: -1 })

    // For each patient, also count their appointments
    const formatted = await Promise.all(
      patients.map(async (p) => {
        const appointmentCount = await Appointment.countDocuments({ patient: p._id })
        return {
          id: p._id,
          name: p.user?.name || 'Unknown Patient',
          email: p.user?.email || '',
          phone: p.user?.phone || '',
          dateOfBirth: p.dateOfBirth || 'Not specified',
          gender: p.gender || 'Not specified',
          bloodGroup: p.bloodGroup || 'Not specified',
          address: p.address || 'Not specified',
          emergencyContact: p.emergencyContact || 'Not specified',
          registeredDate: p.user?.createdAt || p.createdAt,
          appointmentCount,
        }
      })
    )

    response.json(formatted)
  } catch (error) {
    console.error('Fetch patients error:', error)
    response.status(500).json({ message: 'Patients could not be loaded.' })
  }
})

// GET /api/patients/:id - Doctor or Admin: Get single patient profile & medical history
router.get('/:id', authenticateToken, authorizeRoles('admin', 'doctor', 'patient'), async (request, response) => {
  try {
    let patient = null
    try {
      patient = await Patient.findById(request.params.id).populate('user', 'name email phone')
    } catch {
      // Not a direct Patient ObjectId
    }

    if (!patient) {
      patient = await Patient.findOne({ user: request.params.id }).populate('user', 'name email phone')
    }

    if (!patient) {
      return response.status(404).json({ message: 'Patient not found.' })
    }

    // If patient role, ensure they are viewing themselves
    if (request.user.role === 'patient') {
      const myPatient = await Patient.findOne({ user: request.user.id })
      if (!myPatient || String(myPatient._id) !== String(patient._id)) {
        return response.status(403).json({ message: 'You are not authorized to view this patient profile.' })
      }
    }

    const appointments = await Appointment.find({ patient: patient._id })
      .populate({
        path: 'doctor',
        populate: [{ path: 'user', select: 'name' }, { path: 'department', select: 'name' }],
      })
      .sort({ appointmentDate: -1 })

    const visits = await VisitRecord.find({ patient: patient._id })
      .populate('appointment')
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
      .sort({ createdAt: -1 })

    response.json({
      patient: {
        id: patient._id,
        name: patient.user?.name,
        email: patient.user?.email,
        phone: patient.user?.phone,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        address: patient.address,
        emergencyContact: patient.emergencyContact,
      },
      appointments: appointments.map((a) => ({
        id: a._id,
        date: a.appointmentDate,
        time: a.appointmentTime,
        doctor: a.doctor?.user?.name,
        department: a.doctor?.department?.name,
        reason: a.reason,
        status: a.status,
      })),
      visits: visits.map((v) => ({
        id: v._id,
        date: v.appointment?.appointmentDate,
        doctor: v.doctor?.user?.name,
        diagnosisSummary: v.diagnosisSummary,
        doctorNotes: v.doctorNotes,
        reportImageUrl: v.reportImageUrl || '',
      })),
    })
  } catch (error) {
    console.error('Fetch patient profile error:', error)
    response.status(500).json({ message: 'Patient profile could not be loaded.' })
  }
})

export default router
