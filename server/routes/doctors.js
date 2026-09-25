import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { Doctor } from '../models/Doctor.js'
import { User } from '../models/User.js'
import { Department } from '../models/Department.js'
import { DoctorSchedule } from '../models/DoctorSchedule.js'
import { Appointment } from '../models/Appointment.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = Router()

// GET /api/doctors - Search and filter doctors
router.get('/', async (request, response) => {
  const { search = '', specialization = '', department = '' } = request.query

  try {
    const filter = {}

    if (specialization) {
      filter.specialization = { $regex: specialization, $options: 'i' }
    }

    if (department) {
      // Check if department is an ObjectId or name
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(department)
      if (isObjectId) {
        filter.department = department
      } else {
        const foundDept = await Department.findOne({ name: { $regex: department, $options: 'i' } })
        if (foundDept) {
          filter.department = foundDept._id
        }
      }
    }

    let doctors = await Doctor.find(filter)
      .populate('user', 'name email phone')
      .populate('department', 'name description')
      .sort({ createdAt: -1 })

    // If search text is provided, filter by doctor name, specialization, or department name
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      doctors = doctors.filter((doc) => {
        const nameMatch = doc.user?.name?.toLowerCase().includes(q)
        const specMatch = doc.specialization?.toLowerCase().includes(q)
        const deptMatch = doc.department?.name?.toLowerCase().includes(q)
        return nameMatch || specMatch || deptMatch
      })
    }

    // Format output cleanly
    const formatted = doctors.map((doc) => ({
      id: doc._id,
      name: doc.user ? doc.user.name : 'Unknown Doctor',
      email: doc.user ? doc.user.email : '',
      phone: doc.user ? doc.user.phone : '',
      specialization: doc.specialization,
      experienceYears: doc.experienceYears,
      consultationFee: doc.consultationFee,
      qualification: doc.qualification,
      bio: doc.bio,
      department: doc.department ? doc.department.name : 'General',
      departmentId: doc.department ? doc.department._id : null,
    }))

    response.json(formatted)
  } catch (error) {
    console.error('Fetch doctors error:', error)
    response.status(500).json({ message: 'Doctors could not be loaded.' })
  }
})

// GET /api/doctors/:id - Single doctor details with schedules
router.get('/:id', async (request, response) => {
  try {
    const doctor = await Doctor.findById(request.params.id)
      .populate('user', 'name email phone')
      .populate('department', 'name description')

    if (!doctor) {
      return response.status(404).json({ message: 'Doctor not found.' })
    }

    const schedules = await DoctorSchedule.find({ doctor: doctor._id, isAvailable: true }).sort({ dayOfWeek: 1, startTime: 1 })

    response.json({
      id: doctor._id,
      name: doctor.user?.name || 'Unknown Doctor',
      email: doctor.user?.email || '',
      phone: doctor.user?.phone || '',
      specialization: doctor.specialization,
      experienceYears: doctor.experienceYears,
      consultationFee: doctor.consultationFee,
      qualification: doctor.qualification,
      bio: doctor.bio,
      department: doctor.department?.name || 'General',
      departmentId: doctor.department?._id || null,
      schedules,
    })
  } catch (error) {
    console.error('Fetch single doctor error:', error)
    response.status(500).json({ message: 'Doctor details could not be loaded.' })
  }
})

// POST /api/doctors - Admin: Create new doctor user and profile
router.post('/', authenticateToken, authorizeRoles('admin'), async (request, response) => {
  const { name, email, phone, password, specialization, experienceYears, consultationFee, departmentId, qualification, bio } = request.body

  if (!name || !email || !password || !phone || !specialization || !departmentId) {
    return response.status(400).json({ message: 'Name, email, phone, password, specialization, and department are required.' })
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) {
      return response.status(409).json({ message: 'A user with this email already exists.' })
    }

    const dept = await Department.findById(departmentId)
    if (!dept) {
      return response.status(404).json({ message: 'Selected department does not exist.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'doctor',
      phone: phone.trim(),
    })

    const doctor = await Doctor.create({
      user: user._id,
      department: dept._id,
      specialization: specialization.trim(),
      experienceYears: Number(experienceYears) || 0,
      consultationFee: Number(consultationFee) || 0,
      qualification: qualification ? qualification.trim() : '',
      bio: bio ? bio.trim() : '',
    })

    // Default schedule: Monday through Friday, 09:00 - 13:00 (30 min slots)
    const defaultSchedules = [1, 2, 3, 4, 5].map((day) => ({
      doctor: doctor._id,
      dayOfWeek: day,
      startTime: '09:00',
      endTime: '13:00',
      slotDuration: 30,
      isAvailable: true,
    }))
    await DoctorSchedule.insertMany(defaultSchedules)

    response.status(201).json({
      id: doctor._id,
      name: user.name,
      email: user.email,
      department: dept.name,
      specialization: doctor.specialization,
    })
  } catch (error) {
    console.error('Create doctor error:', error)
    response.status(500).json({ message: 'Doctor could not be created.' })
  }
})

// PUT /api/doctors/:id - Admin or Doctor: Update doctor details
router.put('/:id', authenticateToken, authorizeRoles('admin', 'doctor'), async (request, response) => {
  const { name, phone, specialization, experienceYears, consultationFee, departmentId, qualification, bio } = request.body

  try {
    const doctor = await Doctor.findById(request.params.id).populate('user')
    if (!doctor) {
      return response.status(404).json({ message: 'Doctor not found.' })
    }

    // If role is doctor, ensure they only edit their own profile
    if (request.user.role === 'doctor' && String(doctor.user._id) !== String(request.user.id)) {
      return response.status(403).json({ message: 'You can only edit your own doctor profile.' })
    }

    if (name && doctor.user) doctor.user.name = name.trim()
    if (phone && doctor.user) doctor.user.phone = phone.trim()
    if (doctor.user) await doctor.user.save()

    if (specialization) doctor.specialization = specialization.trim()
    if (experienceYears !== undefined) doctor.experienceYears = Number(experienceYears)
    if (consultationFee !== undefined) doctor.consultationFee = Number(consultationFee)
    if (qualification !== undefined) doctor.qualification = qualification.trim()
    if (bio !== undefined) doctor.bio = bio.trim()

    if (departmentId && request.user.role === 'admin') {
      const dept = await Department.findById(departmentId)
      if (dept) doctor.department = dept._id
    }

    await doctor.save()

    response.json({ message: 'Doctor profile updated successfully.' })
  } catch (error) {
    console.error('Update doctor error:', error)
    response.status(500).json({ message: 'Doctor profile could not be updated.' })
  }
})

// DELETE /api/doctors/:id - Admin: Delete doctor
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (request, response) => {
  try {
    const doctor = await Doctor.findById(request.params.id)
    if (!doctor) {
      return response.status(404).json({ message: 'Doctor not found.' })
    }

    // Delete schedules
    await DoctorSchedule.deleteMany({ doctor: doctor._id })
    // Delete user account
    if (doctor.user) {
      await User.findByIdAndDelete(doctor.user)
    }
    await Doctor.findByIdAndDelete(doctor._id)

    response.json({ message: 'Doctor deleted successfully.' })
  } catch (error) {
    console.error('Delete doctor error:', error)
    response.status(500).json({ message: 'Doctor could not be deleted.' })
  }
})

export default router