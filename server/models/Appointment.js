import mongoose from 'mongoose'

const medicineItemSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: '' },
  tabletName: { type: String, trim: true, default: '' },
  dosage: { type: String, default: '', trim: true }, // e.g. "1 Tablet (500mg)"
  frequency: { type: String, default: '', trim: true }, // e.g. "2 times a day (After Food)"
  numberOfTimes: { type: String, default: '', trim: true }, // e.g. "2 times a day"
  timing: { type: String, default: '', trim: true }, // e.g. "After Food"
  duration: { type: String, default: '', trim: true }, // e.g. "5 Days"
  instructions: { type: String, default: '', trim: true }, // e.g. "Take with warm water"
}, { _id: false })

const preConsultationSchema = new mongoose.Schema({
  reason: { type: String, default: '', trim: true },
  symptoms: { type: [String], default: [] },
  symptomDuration: { type: String, default: '', trim: true }, // e.g. "3 Days"
  existingConditions: { type: [String], default: [] },
  currentMedications: { type: String, default: '', trim: true },
  knownAllergies: { type: String, default: '', trim: true },
  additionalNotes: { type: String, default: '', trim: true },
  submittedAt: { type: Date, default: Date.now },
}, { _id: false })

const prescriptionSchema = new mongoose.Schema({
  medicines: { type: [medicineItemSchema], default: [] },
  doctorAdvice: { type: String, default: '', trim: true },
  followUpDate: { type: String, default: '' }, // YYYY-MM-DD
  prescribedAt: { type: Date, default: Date.now },
}, { _id: false })

const appointmentSchema = new mongoose.Schema(
  {
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
    appointmentDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    appointmentTime: {
      type: String, // HH:mm
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'REQUESTED',
        'PENDING_PAYMENT',
        'CONFIRMED',
        'CHECKED_IN',
        'WAITING',
        'IN_CONSULTATION',
        'COMPLETED',
        'CANCELLED',
        'NO_SHOW',
      ],
      default: 'REQUESTED',
    },
    // Payment & Billing
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED'],
      default: 'UNPAID',
    },
    totalFee: {
      type: Number,
      default: 500, // Standard Consultation ₹500
    },
    advancePaid: {
      type: Number,
      default: 0, // Advance ₹200
    },
    remainingBalance: {
      type: Number,
      default: 500,
    },
    paymentId: {
      type: String,
      default: '',
    },
    paymentMethod: {
      type: String,
      default: '',
    },
    transactionReference: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
    },
    // OPD Queue & Check-In
    checkInStatus: {
      type: String,
      enum: ['NOT_CHECKED_IN', 'CHECKED_IN', 'EXPIRED'],
      default: 'NOT_CHECKED_IN',
    },
    checkInTime: {
      type: Date,
    },
    queueToken: {
      type: String,
      default: '', // e.g. R-001
    },
    queueNumber: {
      type: Number,
      default: 0,
    },
    calledAt: {
      type: Date,
    },
    consultationStartTime: {
      type: Date,
    },
    consultationEndTime: {
      type: Date,
    },
    noShowAt: {
      type: Date,
    },
    isSkipped: {
      type: Boolean,
      default: false,
    },
    // Clinical Integration
    preConsultation: {
      type: preConsultationSchema,
      default: () => ({}),
    },
    prescription: {
      type: prescriptionSchema,
      default: () => ({ medicines: [] }),
    },
  },
  {
    timestamps: true,
  }
)

appointmentSchema.index({ doctor: 1, appointmentDate: 1, appointmentTime: 1 })
appointmentSchema.index({ patient: 1, appointmentDate: 1 })
appointmentSchema.index({ doctor: 1, appointmentDate: 1, queueNumber: 1 })

export const Appointment = mongoose.model('Appointment', appointmentSchema)
