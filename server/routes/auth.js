import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import 'dotenv/config'
import { User } from '../models/User.js'
import { Patient } from '../models/Patient.js'
import { Doctor } from '../models/Doctor.js'
import { EmailOtp } from '../models/EmailOtp.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

// Helper to sanitize user object for client responses
function getPublicUser(user, profile = null) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    profileId: profile ? profile._id : null,
  }
}

// Generate JWT token helper
function createToken(user, profileId = null) {
  const secret = process.env.JWT_SECRET || 'northstar_hospital_secret_key_2026_college_project'
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
      profileId,
    },
    secret,
    { expiresIn: '7d' }
  )
}

const otpStore = new Map()

function validateStrongPassword(password) {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters long.'
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least 1 uppercase letter (A-Z).'
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least 1 numeric digit (0-9).'
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least 1 special character (!@#$%^&*...).'
  }
  return null
}

export const sendOtpHandler = async (request, response) => {
  const { email } = request.body
  if (!email) {
    return response.status(400).json({ message: 'Email address is required to receive verification code.' })
  }

  const cleanEmail = email.toLowerCase().trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(cleanEmail)) {
    return response.status(400).json({ message: 'Please provide a valid email format.' })
  }

  const existingUser = await User.findOne({ email: cleanEmail })
  if (existingUser) {
    return response.status(409).json({ message: 'An account with this email already exists. Please sign in.' })
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  otpStore.set(cleanEmail, {
    otp,
    expiresAt: expiresAt.getTime(),
    verified: false,
  })

  try {
    await EmailOtp.findOneAndUpdate(
      { email: cleanEmail },
      { otp, verified: false, expiresAt },
      { upsert: true, new: true }
    )
  } catch (err) {
    console.warn('MongoDB OTP persistence fallback:', err.message)
  }

  console.log(`[Email OTP Service] Generated verification code for ${cleanEmail}: ${otp}`)

  response.json({
    message: `Verification code sent to ${cleanEmail}`,
    otp,
    code: otp,
    simulatedOtp: otp,
    success: true,
  })
}

export const verifyOtpHandler = async (request, response) => {
  const { email, otp } = request.body

  if (!email || !otp) {
    return response.status(400).json({ message: 'Both email address and 6-digit OTP code are required.' })
  }

  const cleanEmail = email.toLowerCase().trim()
  const cleanOtp = String(otp).trim()

  let entry = otpStore.get(cleanEmail)

  if (!entry) {
    try {
      const dbEntry = await EmailOtp.findOne({ email: cleanEmail })
      if (dbEntry) {
        entry = {
          otp: dbEntry.otp,
          expiresAt: new Date(dbEntry.expiresAt).getTime(),
          verified: dbEntry.verified,
        }
      }
    } catch (err) {
      console.warn('MongoDB OTP lookup error:', err.message)
    }
  }

  if (!entry) {
    return response.status(400).json({
      message: 'No active OTP verification code found for this email address. Please click "Send OTP".',
    })
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(cleanEmail)
    try {
      await EmailOtp.deleteOne({ email: cleanEmail })
    } catch {}
    return response.status(400).json({ message: 'Verification OTP has expired. Please request a new code.' })
  }

  if (entry.otp !== cleanOtp) {
    return response.status(400).json({ message: 'Invalid OTP code entered. Please enter the correct 6-digit code.' })
  }

  entry.verified = true
  otpStore.set(cleanEmail, entry)

  try {
    await EmailOtp.updateOne({ email: cleanEmail }, { verified: true })
  } catch (err) {
    console.warn('Could not update OTP verification status in DB:', err.message)
  }

  response.json({
    message: 'Email verified successfully.',
    verified: true,
  })
}

router.post(['/send-otp', '/sendOtp', '/send'], sendOtpHandler)
router.post(['/verify-otp', '/verifyOtp', '/verify'], verifyOtpHandler)

// POST /api/auth/register - Register a new patient
router.post('/register', async (request, response) => {
  const { name, email, phone, password, dateOfBirth, gender, bloodGroup, address, emergencyContact } = request.body

  if (!name || !email || !phone || !password) {
    return response.status(400).json({ message: 'Full name, email, mobile number, and password are required.' })
  }

  if (!emergencyContact || !emergencyContact.trim()) {
    return response.status(400).json({ message: 'Emergency contact / Next of Kin details are required.' })
  }

  const passwordError = validateStrongPassword(password)
  if (passwordError) {
    return response.status(400).json({ message: passwordError })
  }

  const rawPhone = String(phone).trim()
  if (!/^\d{10}$/.test(rawPhone)) {
    return response.status(400).json({ message: 'Mobile number must be valid: exactly 10 numeric digits only.' })
  }
  const cleanPhone = rawPhone

  const cleanEmail = email.toLowerCase().trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(cleanEmail)) {
    return response.status(400).json({ message: 'Please provide a valid email address.' })
  }

  // Check email OTP verification
  let isVerified = false
  const memEntry = otpStore.get(cleanEmail)
  if (memEntry && memEntry.verified) {
    isVerified = true
  } else {
    try {
      const dbEntry = await EmailOtp.findOne({ email: cleanEmail })
      if (dbEntry && dbEntry.verified) {
        isVerified = true
      }
    } catch {}
  }

  if (!isVerified) {
    return response.status(400).json({
      message: 'Please verify your email address using the 6-digit OTP code before proceeding.',
    })
  }

  try {
    const existingUser = await User.findOne({ email: cleanEmail })
    if (existingUser) {
      return response.status(409).json({ message: 'An account with this email already exists.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: 'patient',
      phone: cleanPhone,
    })

    const patient = await Patient.create({
      user: user._id,
      dateOfBirth: dateOfBirth || '',
      gender: gender || '',
      bloodGroup: bloodGroup || '',
      address: address || '',
      emergencyContact: emergencyContact.trim(),
    })

    // Clean up OTP entry after successful registration
    otpStore.delete(cleanEmail)

    const token = createToken(user, patient._id)
    const publicUser = getPublicUser(user, patient)

    response.status(201).json({
      message: 'Account registered successfully.',
      token,
      user: publicUser,
    })
  } catch (error) {
    console.error('Registration error:', error)
    response.status(500).json({ message: 'Registration could not be completed.' })
  }
})

// POST /api/auth/login - Log in with email and password
router.post('/login', async (request, response) => {
  const { email, password } = request.body

  if (!email || !password) {
    return response.status(400).json({ message: 'Email and password are required.' })
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return response.status(401).json({ message: 'Invalid email or password.' })
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      return response.status(401).json({ message: 'Invalid email or password.' })
    }

    let profile = null
    if (user.role === 'patient') {
      profile = await Patient.findOne({ user: user._id })
    } else if (user.role === 'doctor') {
      profile = await Doctor.findOne({ user: user._id })
    }

    const token = createToken(user, profile ? profile._id : null)
    const publicUser = getPublicUser(user, profile)

    response.json({
      message: 'Login successful.',
      token,
      user: publicUser,
    })
  } catch (error) {
    console.error('Login error:', error)
    response.status(500).json({ message: 'Login is temporarily unavailable.' })
  }
})

// GET /api/auth/me - Get currently authenticated user details and profile
router.get('/me', authenticateToken, async (request, response) => {
  try {
    const user = await User.findById(request.user.id).select('-passwordHash')
    if (!user) {
      return response.status(404).json({ message: 'User not found.' })
    }

    let profile = null
    if (user.role === 'patient') {
      profile = await Patient.findOne({ user: user._id })
    } else if (user.role === 'doctor') {
      profile = await Doctor.findOne({ user: user._id }).populate('department')
    }

    response.json({
      user,
      profile,
    })
  } catch (error) {
    console.error('Auth /me error:', error)
    response.status(500).json({ message: 'Could not retrieve user profile.' })
  }
})

// PUT /api/auth/profile - Update current user profile and patient demographics
router.put('/profile', authenticateToken, async (request, response) => {
  const { name, phone, dateOfBirth, gender, bloodGroup, address, emergencyContact } = request.body

  try {
    const user = await User.findById(request.user.id)
    if (!user) {
      return response.status(404).json({ message: 'User not found.' })
    }

    if (name) user.name = name.trim()
    if (phone) user.phone = phone.trim()
    await user.save()

    let profile = null
    if (user.role === 'patient') {
      profile = await Patient.findOne({ user: user._id })
      if (!profile) {
        profile = new Patient({ user: user._id })
      }
      if (dateOfBirth !== undefined) profile.dateOfBirth = dateOfBirth
      if (gender !== undefined) profile.gender = gender
      if (bloodGroup !== undefined) profile.bloodGroup = bloodGroup
      if (address !== undefined) profile.address = address
      if (emergencyContact !== undefined) profile.emergencyContact = emergencyContact
      await profile.save()
    }

    response.json({
      message: 'Profile updated successfully.',
      user: getPublicUser(user, profile),
      profile,
    })
  } catch (error) {
    console.error('Profile update error:', error)
    response.status(500).json({ message: 'Could not update profile.' })
  }
})

export default router