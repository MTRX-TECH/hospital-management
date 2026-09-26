import mongoose from 'mongoose'

const emailOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
)

// Automatically purge expired OTPs from MongoDB
emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const EmailOtp = mongoose.model('EmailOtp', emailOtpSchema)
