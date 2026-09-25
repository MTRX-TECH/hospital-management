import mongoose from 'mongoose'

const patientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    dateOfBirth: {
      type: String,
      default: '',
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', ''],
      default: '',
    },
    bloodGroup: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    emergencyContact: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

export const Patient = mongoose.model('Patient', patientSchema)
