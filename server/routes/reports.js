import { Router } from 'express'
import { Appointment } from '../models/Appointment.js'
import { Doctor } from '../models/Doctor.js'
import { Patient } from '../models/Patient.js'
import { Department } from '../models/Department.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = Router()

// GET /api/reports - Admin: Aggregate hospital reports from MongoDB
router.get('/', authenticateToken, authorizeRoles('admin'), async (_request, response) => {
  try {
    const today = new Date().toISOString().slice(0, 10)

    // Parallel execution of real database queries
    const [
      totalDoctors,
      totalPatients,
      totalDepartments,
      totalAppointments,
      todayAppointments,
      statusCountsRaw,
      departmentStats,
      doctorStats,
    ] = await Promise.all([
      Doctor.countDocuments(),
      Patient.countDocuments(),
      Department.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ appointmentDate: today }),
      // Aggregate appointment counts grouped by status
      Appointment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      // Aggregate appointments grouped by department
      Appointment.aggregate([
        {
          $lookup: {
            from: 'doctors',
            localField: 'doctor',
            foreignField: '_id',
            as: 'doctorInfo',
          },
        },
        { $unwind: '$doctorInfo' },
        {
          $lookup: {
            from: 'departments',
            localField: 'doctorInfo.department',
            foreignField: '_id',
            as: 'deptInfo',
          },
        },
        { $unwind: '$deptInfo' },
        {
          $group: {
            _id: '$deptInfo.name',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      // Aggregate appointments per doctor
      Appointment.aggregate([
        {
          $lookup: {
            from: 'doctors',
            localField: 'doctor',
            foreignField: '_id',
            as: 'doctorInfo',
          },
        },
        { $unwind: '$doctorInfo' },
        {
          $lookup: {
            from: 'users',
            localField: 'doctorInfo.user',
            foreignField: '_id',
            as: 'userInfo',
          },
        },
        { $unwind: '$userInfo' },
        {
          $group: {
            _id: '$userInfo.name',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ])

    // Convert status aggregation to an easy lookup dictionary
    const statusMap = {
      REQUESTED: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    }
    statusCountsRaw.forEach((item) => {
      if (item._id) statusMap[item._id] = item.count
    })

    const statusCounts = Object.keys(statusMap).map((key) => ({
      status: key,
      count: statusMap[key],
    }))

    const departments = departmentStats.map((item) => ({
      department: item._id,
      count: item.count,
    }))

    const doctors = doctorStats.map((item) => ({
      doctor: item._id,
      count: item.count,
    }))

    response.json({
      summary: {
        totalDoctors,
        totalPatients,
        totalDepartments,
        totalAppointments,
        todayAppointments,
        pendingRequests: statusMap.REQUESTED,
        confirmedAppointments: statusMap.CONFIRMED,
        completedAppointments: statusMap.COMPLETED,
        cancelledAppointments: statusMap.CANCELLED,
      },
      statusCounts,
      departments,
      doctors,
    })
  } catch (error) {
    console.error('Reports generation error:', error)
    response.status(500).json({ message: 'Reports could not be generated.' })
  }
})

export default router