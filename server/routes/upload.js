import { Router } from 'express'
import { uploadToCloudinary } from '../config/cloudinary.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

// POST /api/upload - Upload clinical report image to Cloudinary
router.post('/', authenticateToken, async (request, response) => {
  const { image, folder } = request.body

  if (!image) {
    return response.status(400).json({ message: 'No image provided. Please select an image file.' })
  }

  try {
    const imageUrl = await uploadToCloudinary(image, folder || 'hospital_reports')
    response.json({
      message: 'Report image uploaded successfully.',
      url: imageUrl,
      success: true,
    })
  } catch (error) {
    console.error('Image upload error:', error)
    response.status(500).json({ message: error.message || 'Image upload failed.' })
  }
})

export default router
