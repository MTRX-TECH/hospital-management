import { Router } from 'express'
import { Payment } from '../models/Payment.js'
import { Appointment } from '../models/Appointment.js'
import { Patient } from '../models/Patient.js'
import { Doctor } from '../models/Doctor.js'
import { Notification } from '../models/Notification.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = Router()

// POST /api/payments/create - Process demo payment for appointment
router.post('/create', authenticateToken, async (request, response) => {
  const { appointmentId, amount = 200, paymentMethod = 'UPI', notes = '' } = request.body

  if (!appointmentId) {
    return response.status(400).json({ message: 'Appointment ID is required.' })
  }

  const numericAmount = Number(amount)
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return response.status(400).json({ message: 'Valid payment amount is required.' })
  }

  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } })
      .populate({ path: 'doctor', populate: { path: 'user', select: 'name email phone' } })

    if (!appointment) {
      return response.status(404).json({ message: 'Appointment not found.' })
    }

    // Role verification: Patient can only pay for own appointment
    if (request.user.role === 'patient') {
      const patient = await Patient.findOne({ user: request.user.id })
      if (!patient || String(appointment.patient._id) !== String(patient._id)) {
        return response.status(403).json({ message: 'You are not authorized to make payment for this appointment.' })
      }
    }

    // Generate transaction reference & receipt number
    const timestamp = Date.now()
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const transactionReference = `TXN-AAROGYA-${timestamp}-${randomSuffix}`

    const count = await Payment.countDocuments()
    const currentYear = new Date().getFullYear()
    const receiptNumber = `REC-${currentYear}-${String(count + 1001).padStart(5, '0')}`

    const totalFee = appointment.totalFee || 500
    const newAdvancePaid = (appointment.advancePaid || 0) + numericAmount
    const remainingBalance = Math.max(0, totalFee - newAdvancePaid)
    const newPaymentStatus = remainingBalance === 0 ? 'PAID' : 'PARTIALLY_PAID'

    // Create payment ledger record
    const payment = await Payment.create({
      appointment: appointment._id,
      patient: appointment.patient._id,
      doctor: appointment.doctor._id,
      amount: numericAmount,
      totalFee,
      type: numericAmount >= totalFee ? 'FULL_PAYMENT' : 'ADVANCE_BOOKING',
      paymentMethod,
      transactionReference,
      receiptNumber,
      status: 'SUCCESS',
      notes: notes || 'Online advance consultation booking fee',
      paidAt: new Date(),
    })

    // Update appointment payment fields and auto-confirm
    appointment.paymentStatus = newPaymentStatus
    appointment.advancePaid = newAdvancePaid
    appointment.remainingBalance = remainingBalance
    appointment.paymentId = payment._id.toString()
    appointment.paymentMethod = paymentMethod
    appointment.transactionReference = transactionReference
    appointment.paidAt = new Date()

    // If currently REQUESTED or PENDING_PAYMENT, auto-confirm once advance payment is verified
    if (appointment.status === 'REQUESTED' || appointment.status === 'PENDING_PAYMENT') {
      appointment.status = 'CONFIRMED'
    }

    await appointment.save()

    // Send notifications
    if (appointment.patient?.user?._id) {
      await Notification.create({
        user: appointment.patient.user._id,
        title: 'Payment Successful',
        message: `Advance payment of ₹${numericAmount} received for Dr. ${appointment.doctor?.user?.name || 'Doctor'} on ${appointment.appointmentDate}. Receipt: ${receiptNumber}.`,
        type: 'status',
      })
    }

    if (appointment.doctor?.user?._id) {
      await Notification.create({
        user: appointment.doctor.user._id,
        title: 'Appointment Confirmed & Paid',
        message: `Patient ${appointment.patient?.user?.name || 'Patient'} completed advance fee payment of ₹${numericAmount} for ${appointment.appointmentDate} at ${appointment.appointmentTime}.`,
        type: 'appointment',
      })
    }

    return response.status(201).json({
      message: 'Payment processed successfully.',
      payment: {
        id: payment._id,
        receiptNumber: payment.receiptNumber,
        transactionReference: payment.transactionReference,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paidAt: payment.paidAt,
        status: payment.status,
      },
      appointment: {
        id: appointment._id,
        status: appointment.status,
        paymentStatus: appointment.paymentStatus,
        advancePaid: appointment.advancePaid,
        remainingBalance: appointment.remainingBalance,
      },
    })
  } catch (error) {
    console.error('Payment processing error:', error)
    return response.status(500).json({ message: 'Payment could not be processed at this time.' })
  }
})

// GET /api/payments/receipt/:appointmentId - Get formal hospital receipt for appointment
router.get('/receipt/:appointmentId', authenticateToken, async (request, response) => {
  try {
    const appointment = await Appointment.findById(request.params.appointmentId)
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name email phone' },
      })
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name email phone' },
          { path: 'department', select: 'name' },
        ],
      })

    if (!appointment) {
      return response.status(404).json({ message: 'Appointment not found.' })
    }

    // Role check
    if (request.user.role === 'patient') {
      const patient = await Patient.findOne({ user: request.user.id })
      if (!patient || String(appointment.patient._id) !== String(patient._id)) {
        return response.status(403).json({ message: 'Unauthorized access to payment receipt.' })
      }
    }

    const payment = await Payment.findOne({ appointment: appointment._id }).sort({ createdAt: -1 })

    const receiptData = {
      receiptNumber: payment ? payment.receiptNumber : `REC-${appointment._id.toString().slice(-6).toUpperCase()}`,
      transactionReference: appointment.transactionReference || payment?.transactionReference || 'REF-AAROGYA-OPD',
      appointmentId: appointment._id,
      date: appointment.appointmentDate,
      time: appointment.appointmentTime,
      patientName: appointment.patient?.user?.name || 'Patient',
      patientPhone: appointment.patient?.user?.phone || 'N/A',
      patientEmail: appointment.patient?.user?.email || 'N/A',
      patientBloodGroup: appointment.patient?.bloodGroup || 'N/A',
      doctorName: appointment.doctor?.user?.name || 'Doctor',
      department: appointment.doctor?.department?.name || 'Outpatient Department',
      specialization: appointment.doctor?.specialization || 'Consultant',
      totalFee: appointment.totalFee || 500,
      advancePaid: appointment.advancePaid || (payment ? payment.amount : 0),
      remainingBalance: appointment.remainingBalance ?? 0,
      paymentMethod: appointment.paymentMethod || payment?.paymentMethod || 'UPI',
      paymentStatus: appointment.paymentStatus || 'UNPAID',
      paidAt: appointment.paidAt || payment?.paidAt || appointment.createdAt,
      hospitalName: 'Aarogya Multi-Speciality Hospital',
      hospitalAddress: 'Sector 14, Health City, New Delhi - 110001',
      hospitalPhone: '+91 11 2345 6789 / +91 11 9876 5432',
      hospitalGst: '07AAAAA0000A1Z5',
    }

    response.json(receiptData)
  } catch (error) {
    console.error('Fetch receipt error:', error)
    response.status(500).json({ message: 'Could not fetch payment receipt.' })
  }
})

// GET /api/payments - Admin: List all hospital payment records & financial statistics
router.get('/', authenticateToken, authorizeRoles('admin'), async (_request, response) => {
  try {
    const payments = await Payment.find()
      .populate({ path: 'patient', populate: { path: 'user', select: 'name email phone' } })
      .populate({
        path: 'doctor',
        populate: [
          { path: 'user', select: 'name' },
          { path: 'department', select: 'name' },
        ],
      })
      .populate('appointment', 'appointmentDate appointmentTime status')
      .sort({ createdAt: -1 })

    const totalRevenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0)
    const todayStr = new Date().toISOString().split('T')[0]
    const todayRevenue = payments
      .filter((p) => p.paidAt && p.paidAt.toISOString().split('T')[0] === todayStr)
      .reduce((acc, p) => acc + (p.amount || 0), 0)

    const upiCount = payments.filter((p) => p.paymentMethod === 'UPI').length
    const cardCount = payments.filter((p) => p.paymentMethod === 'CARD').length
    const netbankingCount = payments.filter((p) => p.paymentMethod === 'NETBANKING').length
    const cashCount = payments.filter((p) => p.paymentMethod === 'CASH').length

    response.json({
      stats: {
        totalRevenue,
        todayRevenue,
        totalTransactions: payments.length,
        methodBreakdown: { UPI: upiCount, CARD: cardCount, NETBANKING: netbankingCount, CASH: cashCount },
      },
      payments: payments.map((p) => ({
        id: p._id,
        receiptNumber: p.receiptNumber,
        transactionReference: p.transactionReference,
        amount: p.amount,
        totalFee: p.totalFee,
        type: p.type,
        paymentMethod: p.paymentMethod,
        status: p.status,
        paidAt: p.paidAt,
        patientName: p.patient?.user?.name || 'Patient',
        patientPhone: p.patient?.user?.phone || 'N/A',
        doctorName: p.doctor?.user?.name || 'Doctor',
        department: p.doctor?.department?.name || 'General',
        appointmentDate: p.appointment?.appointmentDate || 'N/A',
        appointmentTime: p.appointment?.appointmentTime || 'N/A',
        appointmentStatus: p.appointment?.status || 'N/A',
      })),
    })
  } catch (error) {
    console.error('Fetch payments error:', error)
    response.status(500).json({ message: 'Could not fetch payments list.' })
  }
})

export default router
