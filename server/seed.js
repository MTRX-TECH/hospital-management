import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import 'dotenv/config'
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

    // 1. Departments (with Indian medical / clinical context)
    const departments = await Department.insertMany([
      { name: 'Cardiology', description: 'Comprehensive heart care, ECG, 2D Echo, TMT, coronary angiography, and preventive cardiology.' },
      { name: 'Neurology', description: 'Advanced care for brain, spine, migraine, neuropathy, stroke rehab, and epilepsy disorders.' },
      { name: 'Orthopaedics', description: 'Bone, joint preservation, arthroscopy, spine care, fracture trauma, and arthritis management.' },
      { name: 'General Medicine', description: 'Primary outpatient department (OPD), infectious diseases, fever clinic, and diabetes management.' },
      { name: 'Paediatrics', description: 'Comprehensive newborn care, immunisation / vaccination, and child growth and wellness.' },
      { name: 'Dermatology', description: 'Clinical skin disorders, allergy testing, cosmetology, hair, and nail health therapies.' },
    ])
    console.log(`Created ${departments.length} departments.`)

    // 2. Users: Admin (Medical Superintendent)
    const adminUser = await User.create({
      name: 'Dr. Rameshwar Rao (Medical Superintendent)',
      email: 'admin@hospital.com',
      passwordHash,
      role: 'admin',
      phone: '+91 98450 11000',
    })

    // 3. Users: Doctors (Renowned Indian Specialists)
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
          { dayOfWeek: 0, startTime: '09:00', endTime: '13:00', slotDuration: 30 },
          { dayOfWeek: 1, startTime: '09:00', endTime: '13:00', slotDuration: 30 },
          { dayOfWeek: 2, startTime: '09:00', endTime: '13:00', slotDuration: 30 },
          { dayOfWeek: 3, startTime: '09:00', endTime: '13:00', slotDuration: 30 },
          { dayOfWeek: 4, startTime: '09:00', endTime: '13:00', slotDuration: 30 },
          { dayOfWeek: 5, startTime: '09:00', endTime: '13:00', slotDuration: 30 },
          { dayOfWeek: 6, startTime: '09:00', endTime: '13:00', slotDuration: 30 },
        ],
      },
      {
        name: 'Dr. Priya Nair',
        email: 'dr.priya@hospital.com',
        phone: '+91 98222 33445',
        department: departments[1]._id, // Neurology
        specialization: 'Consultant Neurologist',
        experienceYears: 10,
        consultationFee: 750, // ₹750
        qualification: 'MBBS, MD, DM (Neurology) - NIMHANS Bengaluru',
        bio: 'Expertise in chronic migraine therapy, peripheral neuropathy, epilepsy management, and stroke rehabilitation.',
        schedules: [
          { dayOfWeek: 1, startTime: '14:00', endTime: '18:00', slotDuration: 30 },
          { dayOfWeek: 2, startTime: '14:00', endTime: '18:00', slotDuration: 30 },
          { dayOfWeek: 3, startTime: '14:00', endTime: '18:00', slotDuration: 30 },
          { dayOfWeek: 4, startTime: '14:00', endTime: '18:00', slotDuration: 30 },
          { dayOfWeek: 5, startTime: '14:00', endTime: '18:00', slotDuration: 30 },
        ],
      },
      {
        name: 'Dr. Arvind Swaminathan',
        email: 'dr.arvind@hospital.com',
        phone: '+91 98333 44556',
        department: departments[2]._id, // Orthopaedics
        specialization: 'Senior Orthopaedic Surgeon',
        experienceYears: 16,
        consultationFee: 900, // ₹900
        qualification: 'MBBS, MS (Orthopaedics), MCh (Ortho)',
        bio: 'Special interest in joint replacement (hip & knee), arthroscopic ligament repair, sports injuries, and spine therapy.',
        schedules: [
          { dayOfWeek: 1, startTime: '10:00', endTime: '14:00', slotDuration: 30 },
          { dayOfWeek: 2, startTime: '10:00', endTime: '14:00', slotDuration: 30 },
          { dayOfWeek: 3, startTime: '10:00', endTime: '14:00', slotDuration: 30 },
          { dayOfWeek: 4, startTime: '10:00', endTime: '14:00', slotDuration: 30 },
          { dayOfWeek: 5, startTime: '10:00', endTime: '14:00', slotDuration: 30 },
        ],
      },
      {
        name: 'Dr. Meenakshi Sundaram',
        email: 'dr.meenakshi@hospital.com',
        phone: '+91 98444 55667',
        department: departments[3]._id, // General Medicine
        specialization: 'Consultant Physician (General OPD)',
        experienceYears: 11,
        consultationFee: 500, // ₹500
        qualification: 'MBBS, MD (Internal Medicine)',
        bio: 'Holistic physician catering to general outpatient care, type-2 diabetes management, seasonal fevers, and preventive checkups.',
        schedules: [
          { dayOfWeek: 1, startTime: '14:00', endTime: '18:00', slotDuration: 30 },
          { dayOfWeek: 2, startTime: '14:00', endTime: '18:00', slotDuration: 30 },
          { dayOfWeek: 3, startTime: '14:00', endTime: '18:00', slotDuration: 30 },
          { dayOfWeek: 4, startTime: '14:00', endTime: '18:00', slotDuration: 30 },
          { dayOfWeek: 5, startTime: '14:00', endTime: '18:00', slotDuration: 30 },
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
    console.log(`Created ${doctorDocs.length} Indian doctors and their OPD schedules.`)

    // 4. Users: Patients (Indian Demographics)
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
      {
        name: 'Vikram Malhotra',
        email: 'vikram.m@example.com',
        phone: '+91 98100 55443',
        dateOfBirth: '1988-03-12',
        gender: 'Male',
        bloodGroup: 'A+',
        address: 'Flat 12C, Cyber Heights, Sector 62, Noida, Uttar Pradesh - 201301',
        emergencyContact: 'Pooja Malhotra - Wife (+91 98100 55444)',
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
    console.log(`Created ${patientDocs.length} patients and demographic profiles.`)

    const todayStr = getTodayString()

    // 5. Sample Appointment 1: Past Completed Appointment with Digital Prescription (Tablets + Times Taken)
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

    // Payment Ledger record for Past Appointment
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

    // 6. Sample Appointment 2: TODAY'S ACTIVE WAITING QUEUE (Ready for Live Demo!)
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

    // 7. Sample Appointment 3: Confirmed Appointment for Ananya Iyer with Dr. Priya Nair
    const ananyaAppointment = await Appointment.create({
      patient: patientDocs[1].patient._id,
      doctor: doctorDocs[1].doctor._id,
      appointmentDate: todayStr,
      appointmentTime: '14:30',
      reason: 'Frequent throbbing migraine attacks triggered by prolonged screen time',
      status: 'CONFIRMED',
      totalFee: 750,
      advancePaid: 200,
      remainingBalance: 550,
      paymentStatus: 'PARTIALLY_PAID',
      paymentMethod: 'CARD',
      transactionReference: `TXN-AAROGYA-${Date.now()}-102`,
      checkInStatus: 'NOT_CHECKED_IN',
      preConsultation: {
        reason: 'Frequent throbbing migraine attacks triggered by prolonged screen time',
        symptoms: ['Headache / Migraine', 'Dizziness / Weakness'],
        symptomDuration: '2-4 Weeks',
        existingConditions: ['None / Healthy'],
        currentMedications: 'None',
        knownAllergies: 'None',
        additionalNotes: 'Pain accompanied by photophobia and nausea',
        submittedAt: new Date(),
      },
    })

    // Payment Ledger for Ananya
    await Payment.create({
      appointment: ananyaAppointment._id,
      patient: patientDocs[1].patient._id,
      doctor: doctorDocs[1].doctor._id,
      amount: 200,
      totalFee: 750,
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
      message: 'Aarogya Multi-Speciality Hospital clinical database initialized with live OPD queues and financial ledger.',
      type: 'system',
      isRead: true,
    })

    console.log('Created sample appointments, payments, queue tokens, prescriptions, and notifications.')

    console.log('\n======================================================')
    console.log('   AAROGYA HOSPITAL SYSTEM - SEED DATA READY          ')
    console.log('======================================================')
    console.log('All Passwords: password123')
    console.log('Admin:   admin@hospital.com       (Dr. Rameshwar Rao - Medical Superintendent)')
    console.log('Doctor:  dr.rajesh@hospital.com   (Dr. Rajesh Sharma - Cardiology)')
    console.log('Doctor:  dr.priya@hospital.com    (Dr. Priya Nair - Neurology)')
    console.log('Doctor:  dr.arvind@hospital.com   (Dr. Arvind Swaminathan - Orthopaedics)')
    console.log('Doctor:  dr.meenakshi@hospital.com(Dr. Meenakshi Sundaram - General Medicine)')
    console.log('Patient: patient@hospital.com     (Rohan Sharma - Active Token R-001 waiting today!)')
    console.log('Patient: ananya.iyer@example.com  (Ananya Iyer - Confirmed appointment today)')
    console.log('======================================================\n')

    process.exit(0)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

seedDatabase()
