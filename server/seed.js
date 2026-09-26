import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, './.env') })
dotenv.config()

import { User } from './models/User.js'
import { Department } from './models/Department.js'
import { Patient } from './models/Patient.js'
import { Doctor } from './models/Doctor.js'
import { DoctorSchedule } from './models/DoctorSchedule.js'
import { Appointment } from './models/Appointment.js'
import { VisitRecord } from './models/VisitRecord.js'
import { Notification } from './models/Notification.js'
import { Payment } from './models/Payment.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hospital_management'

function getTodayString() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB at:', MONGODB_URI)
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB.')

    // Clean existing collections
    await User.deleteMany({})
    await Department.deleteMany({})
    await Patient.deleteMany({})
    await Doctor.deleteMany({})
    await DoctorSchedule.deleteMany({})
    await Appointment.deleteMany({})
    await VisitRecord.deleteMany({})
    await Notification.deleteMany({})
    await Payment.deleteMany({})
    console.log('Cleared existing database records.')

    const passwordHash = await bcrypt.hash('password123', 10)

    // 1. Departments
    const departments = await Department.insertMany([
      { name: 'Cardiology', description: 'Comprehensive heart care, ECG, 2D Echo, TMT, coronary angiography, and preventive cardiology.' },
      { name: 'General Medicine', description: 'Primary outpatient department (OPD), infectious diseases, fever clinic, and diabetes management.' },
      { name: 'Neurology', description: 'Advanced care for brain, spine, migraine, neuropathy, stroke rehab, and epilepsy disorders.' },
      { name: 'Orthopaedics', description: 'Bone, joint preservation, arthroscopy, spine care, fracture trauma, and arthritis management.' },
      { name: 'Paediatrics', description: 'Comprehensive newborn care, immunisation / vaccination, and child growth and wellness.' },
      { name: 'Dermatology', description: 'Clinical skin disorders, allergy testing, cosmetology, hair, and nail health therapies.' },
    ])
    console.log(`Created ${departments.length} departments.`)

    // 2. Exactly 1 Admin User (Medical Superintendent)
    const adminUser = await User.create({
      name: 'Dr. Rameshwar Rao (Medical Superintendent)',
      email: 'admin@hospital.com',
      passwordHash,
      role: 'admin',
      phone: '+91 98450 11000',
    })
    console.log('Created 1 Admin account: admin@hospital.com')

    // 3. Exactly 2 Doctor Users
    const doctorUsersData = [
      {
        name: 'Dr. Rajesh Sharma',
        email: 'dr.rajesh@hospital.com',
        phone: '+91 98111 22334',
        department: departments[0]._id, // Cardiology
        specialization: 'Senior Consultant Cardiologist',
        experienceYears: 14,
        consultationFee: 800, // ₹800
        qualification: 'MBBS, MD, DM (Cardiology) - AIIMS New Delhi',
        bio: 'Specialist in preventive cardiology, hypertension control, non-invasive cardiac evaluation, and coronary health.',
        schedules: [
          { dayOfWeek: 0, startTime: '09:00', endTime: '14:00', slotDuration: 30 },
          { dayOfWeek: 1, startTime: '09:00', endTime: '14:00', slotDuration: 30 },
          { dayOfWeek: 2, startTime: '09:00', endTime: '14:00', slotDuration: 30 },
          { dayOfWeek: 3, startTime: '09:00', endTime: '14:00', slotDuration: 30 },
          { dayOfWeek: 4, startTime: '09:00', endTime: '14:00', slotDuration: 30 },
          { dayOfWeek: 5, startTime: '09:00', endTime: '14:00', slotDuration: 30 },
          { dayOfWeek: 6, startTime: '09:00', endTime: '14:00', slotDuration: 30 },
        ],
      },
      {
        name: 'Dr. Meenakshi Sundaram',
        email: 'dr.meenakshi@hospital.com',
        phone: '+91 98444 55667',
        department: departments[1]._id, // General Medicine
        specialization: 'Senior Consultant Physician (General OPD)',
        experienceYears: 12,
        consultationFee: 600, // ₹600
        qualification: 'MBBS, MD (Internal Medicine)',
        bio: 'Holistic physician catering to general outpatient care, type-2 diabetes management, seasonal fevers, and preventive checkups.',
        schedules: [
          { dayOfWeek: 0, startTime: '09:00', endTime: '14:00', slotDuration: 30 },
          { dayOfWeek: 1, startTime: '09:00', endTime: '14:00', slotDuration: 30 },
          { dayOfWeek: 2, startTime: '09:00', endTime: '14:00', slotDuration: 30 },
          { dayOfWeek: 3, startTime: '09:00', endTime: '14:00', slotDuration: 30 },
          { dayOfWeek: 4, startTime: '09:00', endTime: '14:00', slotDuration: 30 },
          { dayOfWeek: 5, startTime: '09:00', endTime: '14:00', slotDuration: 30 },
          { dayOfWeek: 6, startTime: '09:00', endTime: '14:00', slotDuration: 30 },
        ],
      },
    ]

    const doctorDocs = []
    for (const d of doctorUsersData) {
      const user = await User.create({
        name: d.name,
        email: d.email,
        passwordHash,
        role: 'doctor',
        phone: d.phone,
      })
      const doctor = await Doctor.create({
        user: user._id,
        department: d.department,
        specialization: d.specialization,
        experienceYears: d.experienceYears,
        consultationFee: d.consultationFee,
        qualification: d.qualification,
        bio: d.bio,
      })
      doctorDocs.push({ doctor, user, schedules: d.schedules })

      for (const s of d.schedules) {
        await DoctorSchedule.create({
          doctor: doctor._id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          slotDuration: s.slotDuration,
          isAvailable: true,
        })
      }
    }
    console.log(`Created exactly ${doctorDocs.length} Doctors and their OPD schedules.`)

    // 4. Exactly 2 Patient Users
    const patientUsersData = [
      {
        name: 'Rohan Sharma',
        email: 'patient@hospital.com',
        phone: '+91 98765 43210',
        dateOfBirth: '1995-07-22',
        gender: 'Male',
        bloodGroup: 'B+',
        address: 'B-204, Shanti Niketan Apartments, 5th Cross, Indiranagar, Bengaluru, Karnataka - 560038',
        emergencyContact: 'Sunita Sharma - Mother (+91 98765 43219)',
      },
      {
        name: 'Ananya Iyer',
        email: 'ananya.iyer@example.com',
        phone: '+91 98450 12345',
        dateOfBirth: '1998-11-14',
        gender: 'Female',
        bloodGroup: 'O+',
        address: 'Plot 42, 4th Main Road, Anna Nagar, Chennai, Tamil Nadu - 600040',
        emergencyContact: 'R. Iyer - Father (+91 98450 12349)',
      },
    ]

    const patientDocs = []
    for (const p of patientUsersData) {
      const user = await User.create({
        name: p.name,
        email: p.email,
        passwordHash,
        role: 'patient',
        phone: p.phone,
      })
      const patient = await Patient.create({
        user: user._id,
        dateOfBirth: p.dateOfBirth,
        gender: p.gender,
        bloodGroup: p.bloodGroup,
        address: p.address,
        emergencyContact: p.emergencyContact,
      })
      patientDocs.push({ patient, user })
    }
    console.log(`Created exactly ${patientDocs.length} Patients and demographic profiles.`)

    const todayStr = getTodayString()

    // 5. Sample Appointment 1: Past Completed Consultation for Rohan Sharma with Dr. Rajesh Sharma
    const pastPrescription = {
      medicines: [
        {
          name: 'Tab. Pantocid 40mg',
          dosage: '1 Tablet',
          numberOfTimes: '1 time a day (Morning only)',
          timing: 'Before Food (Empty Stomach)',
          frequency: '1 time a day (Morning only) (Before Food (Empty Stomach))',
          duration: '7 Days',
          instructions: 'Take 30 minutes before breakfast with water',
        },
        {
          name: 'Tab. Ecosprin 75mg',
          dosage: '1 Tablet',
          numberOfTimes: '1 time a day (Night only)',
          timing: 'After Food',
          frequency: '1 time a day (Night only) (After Food)',
          duration: '30 Days',
          instructions: 'Take strictly after dinner',
        },
        {
          name: 'Tab. Metoprolol Succinate 25mg',
          dosage: '1 Tablet',
          numberOfTimes: '1 time a day (Morning only)',
          timing: 'After Food',
          frequency: '1 time a day (Morning only) (After Food)',
          duration: '14 Days',
          instructions: 'Swallow whole, do not chew or crush',
        },
      ],
      doctorAdvice: 'Maintain a low sodium diet. 30 minutes of brisk morning walk daily. Drink 3 litres of water. Review in Cardiology OPD after 2 weeks.',
      followUpDate: '2026-10-15',
      prescribedAt: new Date('2026-09-18T10:15:00Z'),
    }

    const pastAppointment = await Appointment.create({
      patient: patientDocs[0].patient._id,
      doctor: doctorDocs[0].doctor._id,
      appointmentDate: '2026-09-18',
      appointmentTime: '09:30',
      reason: 'Chest tightness following morning jog and post-meal acidity',
      status: 'COMPLETED',
      totalFee: 800,
      advancePaid: 200,
      remainingBalance: 600,
      paymentStatus: 'PARTIALLY_PAID',
      paymentMethod: 'UPI',
      transactionReference: 'TXN-AAROGYA-20260918-001',
      checkInStatus: 'CHECKED_IN',
      checkInTime: new Date('2026-09-18T09:10:00Z'),
      queueToken: 'R-001',
      queueNumber: 1,
      preConsultation: {
        reason: 'Chest tightness following morning jog and post-meal acidity',
        symptoms: ['Chest Discomfort', 'Acidity', 'Fatigue'],
        symptomDuration: '3-4 Days',
        existingConditions: ['Hypertension (BP)'],
        currentMedications: 'Amlodipine 5mg OD',
        knownAllergies: 'None',
        additionalNotes: 'Symptoms worsen on climbing stairs',
        submittedAt: new Date('2026-09-17T18:00:00Z'),
      },
      prescription: pastPrescription,
    })

    // Payment Ledger for Past Appointment
    await Payment.create({
      appointment: pastAppointment._id,
      patient: patientDocs[0].patient._id,
      doctor: doctorDocs[0].doctor._id,
      amount: 200,
      totalFee: 800,
      type: 'ADVANCE_BOOKING',
      paymentMethod: 'UPI',
      transactionReference: 'TXN-AAROGYA-20260918-001',
      receiptNumber: 'REC-2026-00001',
      status: 'SUCCESS',
      paidAt: new Date('2026-09-17T18:05:00Z'),
    })

    // Visit Record for Past Appointment
    await VisitRecord.create({
      appointment: pastAppointment._id,
      doctor: doctorDocs[0].doctor._id,
      patient: patientDocs[0].patient._id,
      diagnosisSummary: 'Pre-hypertension with mild gastroesophageal reflux',
      doctorNotes: 'BP: 130/84 mmHg, Pulse: 76 bpm. Normal ECG. Prescribed Pantocid, Ecosprin, and Metoprolol.',
      preConsultation: pastAppointment.preConsultation,
      prescription: pastPrescription,
      totalFee: 800,
      paymentStatus: 'PAID',
    })

    // 6. Sample Appointment 2: TODAY'S ACTIVE WAITING QUEUE for Rohan Sharma
    const todayAppointment = await Appointment.create({
      patient: patientDocs[0].patient._id,
      doctor: doctorDocs[0].doctor._id,
      appointmentDate: todayStr,
      appointmentTime: '10:00',
      reason: 'Follow-up cardiology review and blood pressure assessment',
      status: 'WAITING',
      totalFee: 800,
      advancePaid: 200,
      remainingBalance: 600,
      paymentStatus: 'PARTIALLY_PAID',
      paymentMethod: 'UPI',
      transactionReference: `TXN-AAROGYA-${Date.now()}-101`,
      checkInStatus: 'CHECKED_IN',
      checkInTime: new Date(),
      queueToken: 'R-001',
      queueNumber: 1,
      preConsultation: {
        reason: 'Follow-up cardiology review and blood pressure assessment',
        symptoms: ['Mild Palpitation'],
        symptomDuration: '1-3 Days',
        existingConditions: ['Hypertension (BP)'],
        currentMedications: 'Pantocid 40mg, Metoprolol 25mg',
        knownAllergies: 'None',
        additionalNotes: 'Patient adhering to daily morning walks',
        submittedAt: new Date(),
      },
    })

    // Payment Ledger for Today's Appointment
    await Payment.create({
      appointment: todayAppointment._id,
      patient: patientDocs[0].patient._id,
      doctor: doctorDocs[0].doctor._id,
      amount: 200,
      totalFee: 800,
      type: 'ADVANCE_BOOKING',
      paymentMethod: 'UPI',
      transactionReference: todayAppointment.transactionReference,
      receiptNumber: 'REC-2026-00002',
      status: 'SUCCESS',
      paidAt: new Date(),
    })

    // 7. Sample Appointment 3: Confirmed Appointment for Ananya Iyer with Dr. Meenakshi Sundaram
    const ananyaAppointment = await Appointment.create({
      patient: patientDocs[1].patient._id,
      doctor: doctorDocs[1].doctor._id,
      appointmentDate: todayStr,
      appointmentTime: '11:30',
      reason: 'Seasonal viral fever symptoms, body ache, and persistent cough',
      status: 'CONFIRMED',
      totalFee: 600,
      advancePaid: 200,
      remainingBalance: 400,
      paymentStatus: 'PARTIALLY_PAID',
      paymentMethod: 'CARD',
      transactionReference: `TXN-AAROGYA-${Date.now()}-102`,
      checkInStatus: 'NOT_CHECKED_IN',
      preConsultation: {
        reason: 'Seasonal viral fever symptoms, body ache, and persistent cough',
        symptoms: ['Fever / Chills', 'Cough / Cold / Sore Throat'],
        symptomDuration: '3-5 Days',
        existingConditions: ['None / Healthy'],
        currentMedications: 'None',
        knownAllergies: 'None',
        additionalNotes: 'Patient requesting temperature check and general OPD review',
        submittedAt: new Date(),
      },
    })

    // Payment Ledger for Ananya
    await Payment.create({
      appointment: ananyaAppointment._id,
      patient: patientDocs[1].patient._id,
      doctor: doctorDocs[1].doctor._id,
      amount: 200,
      totalFee: 600,
      type: 'ADVANCE_BOOKING',
      paymentMethod: 'CARD',
      transactionReference: ananyaAppointment.transactionReference,
      receiptNumber: 'REC-2026-00003',
      status: 'SUCCESS',
      paidAt: new Date(),
    })

    // 8. Notifications
    await Notification.create({
      user: patientDocs[0].user._id,
      title: 'OPD Queue Token Assigned',
      message: `Your check-in is verified! Queue Token: R-001. Please proceed to the 1st Floor OPD Lounge.`,
      type: 'reminder',
      isRead: false,
    })

    await Notification.create({
      user: patientDocs[0].user._id,
      title: 'Advance Payment Verified',
      message: 'Advance fee of ₹200 confirmed. Receipt REC-2026-00002 has been generated.',
      type: 'status',
      isRead: false,
    })

    await Notification.create({
      user: doctorDocs[0].user._id,
      title: 'Patient Waiting in Queue',
      message: 'Rohan Sharma (Token R-001) has checked in and is waiting in the Cardiology OPD lounge.',
      type: 'appointment',
      isRead: false,
    })

    await Notification.create({
      user: adminUser._id,
      title: 'Hospital System Initialized',
      message: 'Aarogya Multi-Speciality Hospital clinical database initialized with 2 Patients, 2 Doctors, and 1 Admin.',
      type: 'system',
      isRead: true,
    })

    console.log('Created sample appointments, payments, queue tokens, prescriptions, and notifications.')

    console.log('\n======================================================')
    console.log('   AAROGYA HOSPITAL SYSTEM - SEED DATA READY          ')
    console.log('======================================================')
    console.log('All Passwords: password123')
    console.log('Admin (1):   admin@hospital.com       (Dr. Rameshwar Rao - Medical Superintendent)')
    console.log('Doctor (1):  dr.rajesh@hospital.com   (Dr. Rajesh Sharma - Senior Cardiologist)')
    console.log('Doctor (2):  dr.meenakshi@hospital.com(Dr. Meenakshi Sundaram - General Medicine)')
    console.log('Patient (1): patient@hospital.com     (Rohan Sharma - Active Token R-001 waiting today!)')
    console.log('Patient (2): ananya.iyer@example.com  (Ananya Iyer - Confirmed appointment today)')
    console.log('======================================================\n')

    process.exit(0)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

seedDatabase()
