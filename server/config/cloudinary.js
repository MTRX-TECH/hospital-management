import { v2 as cloudinary } from 'cloudinary'
import 'dotenv/config'

// Configure Cloudinary SDK with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
})

/**
 * Uploads an image (base64 data URI or remote/local URL) to Cloudinary.
 * If Cloudinary credentials are not provided, it gracefully returns
 * the data URI or demo image URL so offline development and college
 * project presentations run without crashing.
 */
export async function uploadToCloudinary(imageSource, folder = 'hospital_reports') {
  if (!imageSource) {
    throw new Error('No image data provided for upload.')
  }

  // Check if live Cloudinary credentials are provided in .env
  const hasCloudinaryCredentials =
    Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
    Boolean(process.env.CLOUDINARY_API_KEY) &&
    Boolean(process.env.CLOUDINARY_API_SECRET)

  if (hasCloudinaryCredentials) {
    try {
      const result = await cloudinary.uploader.upload(imageSource, {
        folder,
        resource_type: 'auto',
      })
      console.log('Uploaded image to Cloudinary successfully:', result.secure_url)
      return result.secure_url
    } catch (uploadErr) {
      console.warn('Cloudinary upload warning:', uploadErr.message)
      // Fallback to storing data URI if Cloudinary credentials failed or quota exceeded
      return imageSource
    }
  }

  // Demo fallback when Cloudinary API credentials have not been configured yet
  console.log('Cloudinary credentials not set in .env; utilizing standard data URI for clinical report.')
  return imageSource
}

export default cloudinary
