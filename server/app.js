import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { connectDB } from './config/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.join(__dirname, '../dist')

import authRoutes, { sendOtpHandler, verifyOtpHandler } from './routes/auth.js'
import departmentRoutes from './routes/departments.js'
import doctorRoutes from './routes/doctors.js'
import scheduleRoutes from './routes/schedules.js'
import appointmentRoutes from './routes/appointments.js'
import visitRoutes from './routes/visits.js'
import notificationRoutes from './routes/notifications.js'
import patientRoutes from './routes/patients.js'
import reportRoutes from './routes/reports.js'
import uploadRoutes from './routes/upload.js'
import paymentRoutes from './routes/payments.js'
import doctorQueueRoutes from './routes/doctorQueue.js'

const app = express()

connectDB()

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())

app.use(
  cors({
    origin: (origin, callback) => {
      // In production, allow all web clients (Vercel, Render, local dev, mobile)
      return callback(null, true)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400,
  })
)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }
  next()
})
app.use(express.json({ limit: '15mb' }))
app.use(express.urlencoded({ extended: true, limit: '15mb' }))

app.get(['/api/health', '/health'], (_request, response) => {
  response.json({
    status: 'ok',
    service: 'Hospital Appointment & Patient Management API',
    database: 'MongoDB',
    timestamp: new Date().toISOString(),
  })
})

// Direct root and API aliases for OTP to ensure zero 404s under any URL pattern
const otpSendPaths = [
  '/api/auth/send-otp',
  '/api/auth/sendOtp',
  '/api/send-otp',
  '/api/sendOtp',
  '/auth/send-otp',
  '/auth/sendOtp',
  '/send-otp',
  '/sendOtp',
]
const otpVerifyPaths = [
  '/api/auth/verify-otp',
  '/api/auth/verifyOtp',
  '/api/verify-otp',
  '/api/verifyOtp',
  '/auth/verify-otp',
  '/auth/verifyOtp',
  '/verify-otp',
  '/verifyOtp',
]

for (const p of otpSendPaths) {
  app.post(p, sendOtpHandler)
}
for (const p of otpVerifyPaths) {
  app.post(p, verifyOtpHandler)
}

// Application routes
app.use('/api/auth', authRoutes)
app.use('/auth', authRoutes)
app.use('/api', authRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/visits', visitRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/doctor-queue', doctorQueueRoutes)

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.use((request, response, next) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return next()
    }
    if (request.path.startsWith('/api') || request.path.startsWith('/auth')) {
      return next()
    }
    response.sendFile(path.join(distPath, 'index.html'))
  })
}

app.use((_request, response) => {
  response.status(404).json({ message: 'Requested endpoint not found.' })
})

// Centralized error handler
app.use((error, _request, response, _next) => {
  console.error('API Error:', error.message || error)
  const statusCode = error.status || error.statusCode || 500
  response.status(statusCode).json({
    message: error.expose ? error.message : 'An internal server error occurred. Please try again later.',
  })
})

const PORT = Number(process.env.PORT || 4000)
app.listen(PORT, () => {
  console.log(`Hospital Management API is running on http://localhost:${PORT}`)
})