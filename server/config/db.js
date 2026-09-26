import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hospital_management'

export async function connectDB() {
  try {
    const connection = await mongoose.connect(MONGODB_URI)
    console.log(`MongoDB connected: ${connection.connection.host}`)
    return connection
  } catch (error) {
    console.error('MongoDB connection error:', error.message)
    process.exit(1)
  }
}
