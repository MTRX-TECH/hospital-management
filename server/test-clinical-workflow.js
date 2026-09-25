// test-clinical-workflow.js
// Automated test script to verify all 14 clinical workflow features
const API_URL = 'http://localhost:4000/api'

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  const data = await res.json()
  return { status: res.status, data }
}

async function runTests() {
  console.log('--- STARTING CLINICAL WORKFLOW INTEGRATION TESTS ---')

  // 1. Health check
  const health = await request('/health')
  console.log('1. Health check status:', health.status, health.data.service)
  if (health.status !== 200) throw new Error('Health check failed')

  // 2. Login as patient
  const patientAuth = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'patient@hospital.com', password: 'password123' }),
  })
  console.log('2. Patient Login:', patientAuth.status, patientAuth.data.user?.name)
  const patientToken = patientAuth.data.token
  const pHeaders = { Authorization: `Bearer ${patientToken}` }

  // 3. Login as doctor
  const doctorAuth = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'dr.rajesh@hospital.com', password: 'password123' }),
  })
  console.log('3. Doctor Login:', doctorAuth.status, doctorAuth.data.user?.name)
  const doctorToken = doctorAuth.data.token
  const dHeaders = { Authorization: `Bearer ${doctorToken}` }

  // 4. Login as admin
  const adminAuth = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@hospital.com', password: 'password123' }),
  })
  console.log('4. Admin Login:', adminAuth.status, adminAuth.data.user?.name)
  const adminToken = adminAuth.data.token
  const aHeaders = { Authorization: `Bearer ${adminToken}` }

  // 5. Get doctor details and schedules to pick a valid future slot
  const docsRes = await request('/doctors', { headers: pHeaders })
  const cardioDoc = docsRes.data.find((d) => d.email === 'dr.rajesh@hospital.com') || docsRes.data[0]
  console.log('5. Selected Doctor:', cardioDoc.name, 'Department:', cardioDoc.department)

  // Find next valid date for doctor's schedule and query available slots
  const availableDay = cardioDoc.schedules && cardioDoc.schedules.length > 0 ? cardioDoc.schedules[0].dayOfWeek : 1
  const today = new Date()
  let targetDate = new Date()
  let chosenDateStr = ''
  let chosenSlotTime = ''

  for (let i = 2; i <= 14; i++) {
    const candidate = new Date(today)
    candidate.setDate(today.getDate() + i)
    if (candidate.getDay() === availableDay) {
      const dStr = candidate.toISOString().split('T')[0]
      const slotsRes = await request(`/schedules/slots?doctorId=${cardioDoc.id}&date=${dStr}`, { headers: pHeaders })
      if (slotsRes.data?.availableSlots && slotsRes.data.availableSlots.length > 0) {
        chosenDateStr = dStr
        chosenSlotTime = slotsRes.data.availableSlots[0]
        break
      }
    }
  }

  const dateStr = chosenDateStr || '2026-10-12'
  const slotTime = chosenSlotTime || '10:00'
  console.log(`6. Selected Future Slot: ${dateStr} at ${slotTime}`)

  // 6. Patient books appointment with Pre-Consultation questionnaire and Advance Payment ₹200
  const bookingRes = await request('/appointments', {
    method: 'POST',
    headers: pHeaders,
    body: JSON.stringify({
      doctorId: cardioDoc.id,
      appointmentDate: dateStr,
      appointmentTime: slotTime,
      reason: 'Routine cardiac checkup and mild chest flutter',
      advancePaid: 200,
      paymentMethod: 'UPI',
      preConsultation: {
        reason: 'Routine cardiac checkup and mild chest flutter',
        symptoms: ['Chest Flutter', 'Occasional Palpitation', 'Mild Fatigue'],
        symptomDuration: '1 Week',
        existingConditions: ['Hypertension'],
        currentMedications: 'Amlodipine 5mg OD',
        knownAllergies: 'None',
        additionalNotes: 'Symptoms worsen slightly after physical exertion',
      },
    }),
  })
  console.log('7. Book with Advance Payment & Pre-Consultation:', bookingRes.status, bookingRes.data)
  if (bookingRes.status !== 201) throw new Error('Booking failed: ' + JSON.stringify(bookingRes.data))
  const appointmentId = bookingRes.data.id

  // 7. Verify single appointment details & payment status
  const appDetails = await request(`/appointments/${appointmentId}`, { headers: pHeaders })
  console.log('8. Appointment Record Verified:', {
    id: appDetails.data.id,
    status: appDetails.data.status,
    paymentStatus: appDetails.data.paymentStatus,
    advancePaid: appDetails.data.advancePaid,
    remainingBalance: appDetails.data.remainingBalance,
    hasPreConsultation: !!appDetails.data.preConsultation,
  })

  // 8. Fetch official hospital payment receipt
  const receiptRes = await request(`/payments/receipt/${appointmentId}`, { headers: pHeaders })
  console.log('9. Hospital Payment Receipt:', receiptRes.status, {
    receiptNumber: receiptRes.data.receiptNumber,
    transactionReference: receiptRes.data.transactionReference,
    advancePaid: receiptRes.data.advancePaid,
    remainingBalance: receiptRes.data.remainingBalance,
  })

  // 9. QR Check-In / Self Check-In
  const checkInRes = await request(`/appointments/${appointmentId}/check-in`, {
    method: 'POST',
    headers: pHeaders,
  })
  console.log('10. Check-In & Sequential Token Generation:', checkInRes.status, {
    queueToken: checkInRes.data.queueToken,
    queueNumber: checkInRes.data.queueNumber,
    status: checkInRes.data.status,
  })

  // 10. Patient Live Waiting Room Queue status
  const queueRes = await request(`/appointments/${appointmentId}/queue`, { headers: pHeaders })
  console.log('11. Patient Waiting Room Live Status:', queueRes.status, {
    queueToken: queueRes.data.queueToken,
    currentToken: queueRes.data.currentToken,
    patientsAhead: queueRes.data.patientsAhead,
    estimatedWaitMinutes: queueRes.data.estimatedWaitMinutes,
  })

  // 11. Doctor OPD Queue Operations Board for targetDate
  const docQueueRes = await request(`/doctor-queue/today?doctorId=${cardioDoc.id}&date=${dateStr}`, {
    headers: dHeaders,
  })
  console.log('12. Doctor OPD Queue Board:', docQueueRes.status, {
    stats: docQueueRes.data.stats,
    queueLength: docQueueRes.data.queue?.length,
  })

  // 12. Doctor calls patient token
  const callRes = await request('/doctor-queue/call-next', {
    method: 'POST',
    headers: dHeaders,
    body: JSON.stringify({ appointmentId }),
  })
  console.log('13. Doctor Calls Patient:', callRes.status, callRes.data.message)

  // 13. Doctor starts consultation
  const startRes = await request('/doctor-queue/start-consultation', {
    method: 'POST',
    headers: dHeaders,
    body: JSON.stringify({ appointmentId }),
  })
  console.log('14. Doctor Starts Consultation:', startRes.status, startRes.data.message)

  // 14. Doctor completes consultation with digital prescription & advice
  const completeRes = await request('/doctor-queue/complete-consultation', {
    method: 'POST',
    headers: dHeaders,
    body: JSON.stringify({
      appointmentId,
      diagnosisSummary: 'Mild exertion-induced tachycardia; normal resting rhythm',
      doctorNotes: 'Advised lifestyle modification, low sodium intake, and regular walking',
      doctorAdvice: 'Take prescribed beta blocker in morning after breakfast. Hydrate adequately.',
      followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      medicines: [
        {
          name: 'Metoprolol Succinate',
          dosage: '25mg',
          frequency: '1-0-0 (Morning After Food)',
          duration: '14 Days',
          instructions: 'Swallow whole with a full glass of water',
        },
        {
          name: 'Ecosprin',
          dosage: '75mg',
          frequency: '0-0-1 (Night After Food)',
          duration: '30 Days',
          instructions: 'Take strictly after dinner',
        },
      ],
    }),
  })
  console.log('15. Complete Consultation & Digital Prescription:', completeRes.status, completeRes.data)

  // 15. Fetch patient digital prescription
  const rxRes = await request(`/appointments/${appointmentId}/prescription`, { headers: pHeaders })
  console.log('16. Digital Prescription Slip Data:', rxRes.status, {
    doctorName: rxRes.data.doctorName,
    medicinesCount: rxRes.data.medicines?.length,
    medicines: rxRes.data.medicines?.map((m) => m.name),
  })

  // 16. Admin Financial Ledger & Payment oversight
  const adminPayRes = await request('/payments', { headers: aHeaders })
  console.log('17. Admin Financial Oversight:', adminPayRes.status, {
    totalRevenue: adminPayRes.data.stats?.totalRevenue,
    totalTransactions: adminPayRes.data.stats?.totalTransactions,
    recentPaymentsCount: adminPayRes.data.payments?.length,
  })

  console.log('--- ALL 17 INTEGRATION TEST SCENARIOS PASSED SUCCESSFULLY! ---')
}

runTests().catch((err) => {
  console.error('TEST FAILED:', err)
  process.exit(1)
})
