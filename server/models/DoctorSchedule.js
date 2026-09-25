import mongoose from 'mongoose'

const doctorScheduleSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    },
    startTime: {
      type: String,
      required: true, // e.g. "09:00"
    },
    endTime: {
      type: String,
      required: true, // e.g. "13:00"
    },
    slotDuration: {
      type: Number,
      required: true,
      default: 30, // in minutes
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

// Ensure a doctor doesn't have duplicate schedule entries for the exact same day and start time
doctorScheduleSchema.index({ doctor: 1, dayOfWeek: 1, startTime: 1 }, { unique: true })

export const DoctorSchedule = mongoose.model('DoctorSchedule', doctorScheduleSchema)
