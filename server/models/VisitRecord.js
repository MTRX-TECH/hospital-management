import mongoose from 'mongoose'

const visitMedicineSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: '' },
  tabletName: { type: String, trim: true, default: '' },
  dosage: { type: String, default: '', trim: true },
  frequency: { type: String, default: '', trim: true },
  numberOfTimes: { type: String, default: '', trim: true },
  timing: { type: String, default: '', trim: true },
  duration: { type: String, default: '', trim: true },
  instructions: { type: String, default: '', trim: true },
}, { _id: false })

const visitRecordSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    diagnosisSummary: {
      type: String,
      default: '',
      trim: true,
    },
    doctorNotes: {
      type: String,
      default: '',
      trim: true,
    },
    reportImageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    preConsultation: {
      type: Object,
      default: () => ({}),
    },
    prescription: {
      medicines: { type: [visitMedicineSchema], default: [] },
      doctorAdvice: { type: String, default: '', trim: true },
      followUpDate: { type: String, default: '' },
      prescribedAt: { type: Date, default: Date.now },
    },
    totalFee: {
      type: Number,
      default: 500,
    },
    paymentStatus: {
      type: String,
      default: 'PAID',
    },
  },
  {
    timestamps: true,
  }
)

export const VisitRecord = mongoose.model('VisitRecord', visitRecordSchema)
