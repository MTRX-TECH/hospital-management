import { Router } from 'express'
import { Department } from '../models/Department.js'
import { Doctor } from '../models/Doctor.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = Router()

// GET /api/departments - Get all departments
router.get('/', async (_request, response) => {
  try {
    const departments = await Department.find().sort({ name: 1 })
    response.json(departments)
  } catch (error) {
    console.error('Fetch departments error:', error)
    response.status(500).json({ message: 'Departments could not be loaded.' })
  }
})

// POST /api/departments - Admin: Create department
router.post('/', authenticateToken, authorizeRoles('admin'), async (request, response) => {
  const { name, description } = request.body

  if (!name || !name.trim()) {
    return response.status(400).json({ message: 'Department name is required.' })
  }

  try {
    const existing = await Department.findOne({ name: name.trim() })
    if (existing) {
      return response.status(409).json({ message: 'A department with this name already exists.' })
    }

    const department = await Department.create({
      name: name.trim(),
      description: description ? description.trim() : '',
    })

    response.status(201).json(department)
  } catch (error) {
    console.error('Create department error:', error)
    response.status(500).json({ message: 'Department could not be created.' })
  }
})

// PUT /api/departments/:id - Admin: Update department
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (request, response) => {
  const { name, description } = request.body

  try {
    const department = await Department.findById(request.params.id)
    if (!department) {
      return response.status(404).json({ message: 'Department not found.' })
    }

    if (name) department.name = name.trim()
    if (description !== undefined) department.description = description.trim()
    await department.save()

    response.json(department)
  } catch (error) {
    console.error('Update department error:', error)
    response.status(500).json({ message: 'Department could not be updated.' })
  }
})

// DELETE /api/departments/:id - Admin: Delete department
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (request, response) => {
  try {
    const doctorsCount = await Doctor.countDocuments({ department: request.params.id })
    if (doctorsCount > 0) {
      return response.status(400).json({ message: 'Cannot delete department with active doctors assigned.' })
    }

    const department = await Department.findByIdAndDelete(request.params.id)
    if (!department) {
      return response.status(404).json({ message: 'Department not found.' })
    }

    response.json({ message: 'Department deleted successfully.' })
  } catch (error) {
    console.error('Delete department error:', error)
    response.status(500).json({ message: 'Department could not be deleted.' })
  }
})

export default router