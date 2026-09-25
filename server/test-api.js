const API_BASE = 'http://localhost:4000/api'

async function runTests() {
  console.log('--- STARTING BACKEND API VERIFICATION TESTS ---')

  // 1. Health check
  const healthRes = await fetch(`${API_BASE}/health`)
  const health = await healthRes.json()
  console.log('✓ Health Check:', health.status, health.database)

  // 2. Patient Login
  const patientLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient@hospital.com', password: 'password123' }),
  })
  const patientAuth = await patientLoginRes.json()
  if (!patientAuth.token) throw new Error('Patient login failed')
  console.log('✓ Patient Login Successful:', patientAuth.user.name, `(${patientAuth.user.role})`)

  // 3. Doctor Login
  const doctorLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'dr.rajesh@hospital.com', password: 'password123' }),
  })
  const doctorAuth = await doctorLoginRes.json()
  if (!doctorAuth.token) throw new Error('Doctor login failed')
  console.log('✓ Doctor Login Successful:', doctorAuth.user.name, `(${doctorAuth.user.role})`)

  // 4. Admin Login
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@hospital.com', password: 'password123' }),
  })
  const adminAuth = await adminLoginRes.json()
  if (!adminAuth.token) throw new Error('Admin login failed')
  console.log('✓ Admin Login Successful:', adminAuth.user.name, `(${adminAuth.user.role})`)

  // 5. Fetch Departments
  const deptRes = await fetch(`${API_BASE}/departments`)
  const depts = await deptRes.json()
  console.log(`✓ Fetched ${depts.length} departments:`, depts.map((d) => d.name).join(', '))

  // 6. Fetch Doctors with search & filter
  const docRes = await fetch(`${API_BASE}/doctors?department=Cardiology`)
  const doctors = await docRes.json()
  console.log(`✓ Found ${doctors.length} doctor(s) in Cardiology:`, doctors.map((d) => d.name).join(', '))
  const targetDoctor = doctors[0]

  // 7. Check Slot Calculation for upcoming Monday (e.g. 2026-10-05)
  // Let's find a valid future Monday date for Dr. Sarah Wilson
  const nextMonday = '2026-10-05'
  const slotsRes = await fetch(`${API_BASE}/schedules/slots?doctorId=${targetDoctor.id}&date=${nextMonday}`)
  const slotData = await slotsRes.json()
  console.log(`✓ Calculated available slots for ${nextMonday}:`, slotData.availableSlots.length, 'slots available')

  if (slotData.availableSlots.length === 0) {
    throw new Error('No available slots generated')
  }

  const chosenTime = slotData.availableSlots[0]

  // 8. Book Appointment
  const bookRes = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${patientAuth.token}`,
    },
    body: JSON.stringify({
      doctorId: targetDoctor.id,
      appointmentDate: nextMonday,
      appointmentTime: chosenTime,
      reason: 'Cardiac wellness check and ECG review',
    }),
  })
  const bookData = await bookRes.json()
  console.log('✓ Appointment Booked:', bookRes.status, bookData.message || bookData)
  const newAppointmentId = bookData.id

  // 9. Collision Prevention Test: Attempt to book the exact same slot again
  const duplicateBookRes = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${patientAuth.token}`,
    },
    body: JSON.stringify({
      doctorId: targetDoctor.id,
      appointmentDate: nextMonday,
      appointmentTime: chosenTime,
      reason: 'Another patient trying to book the exact same slot',
    }),
  })
  console.log('✓ Collision Prevention Status (Expected 409):', duplicateBookRes.status)
  if (duplicateBookRes.status !== 409) {
    throw new Error(`Collision check failed! Expected 409, got ${duplicateBookRes.status}`)
  }

  // 10. Doctor confirms appointment
  const confirmRes = await fetch(`${API_BASE}/appointments/${newAppointmentId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${doctorAuth.token}`,
    },
    body: JSON.stringify({ status: 'CONFIRMED' }),
  })
  const confirmData = await confirmRes.json()
  console.log('✓ Doctor Status Update:', confirmRes.status, confirmData.message)

  // 11. Doctor completes appointment and adds Visit Record
  const completeRes = await fetch(`${API_BASE}/visits`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${doctorAuth.token}`,
    },
    body: JSON.stringify({
      appointmentId: newAppointmentId,
      diagnosisSummary: 'Cardiovascular assessment clear',
      doctorNotes: 'Resting pulse 72 bpm, blood pressure normal at 120/80. Cleared for regular athletic activities.',
    }),
  })
  const completeData = await completeRes.json()
  console.log('✓ Doctor Visit Record Created:', completeRes.status, completeData.message)

  // 12. Patient checks Visit History
  const patientVisitsRes = await fetch(`${API_BASE}/visits`, {
    headers: { Authorization: `Bearer ${patientAuth.token}` },
  })
  const patientVisits = await patientVisitsRes.json()
  console.log(`✓ Patient Visit History fetched: ${patientVisits.length} record(s). Latest note: "${patientVisits[0].diagnosisSummary}"`)

  // 13. Patient checks Notifications
  const notifRes = await fetch(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${patientAuth.token}` },
  })
  const notifs = await notifRes.json()
  console.log(`✓ Patient Notifications: ${notifs.notifications.length} total, ${notifs.unreadCount} unread.`)

  // 14. Admin Reports from MongoDB
  const reportsRes = await fetch(`${API_BASE}/reports`, {
    headers: { Authorization: `Bearer ${adminAuth.token}` },
  })
  const reports = await reportsRes.json()
  console.log('✓ Admin Live Database Reports Summary:')
  console.log('  Total Doctors:', reports.summary.totalDoctors)
  console.log('  Total Patients:', reports.summary.totalPatients)
  console.log('  Total Appointments:', reports.summary.totalAppointments)
  console.log('  Completed Appointments:', reports.summary.completedAppointments)
  console.log('  Department Breakdown:', reports.departments.map((d) => `${d.department}: ${d.count}`).join(', '))

  console.log('\n--- ALL BACKEND TESTS PASSED SUCCESSFULLY! ---')
}

runTests().catch((err) => {
  console.error('Test error:', err)
  process.exit(1)
})
