import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    totalFee: {
      type: Number,
      default: 500,
    },
    type: {
      type: String,
      enum: ['ADVANCE_BOOKING', 'FINAL_SETTLEMENT', 'FULL_PAYMENT'],
      default: 'ADVANCE_BOOKING',
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'CARD', 'NETBANKING', 'CASH'],
      default: 'UPI',
    },
    transactionReference: {
      type: String,
      required: true,
      unique: true,
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'],
      default: 'SUCCESS',
    },
    notes: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

paymentSchema.index({ appointment: 1 })
paymentSchema.index({ patient: 1, createdAt: -1 })
paymentSchema.index({ doctor: 1, createdAt: -1 })

export const Payment = mongoose.model('Payment', paymentSchema)
