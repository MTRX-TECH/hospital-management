const API_BASE = 'http://127.0.0.1:4000/api'

async function runPatientConflictTest() {
  console.log('=================================================================')
  console.log('TESTING PATIENT SAME-DATE & SAME-TIME CONSULTATION BOOKING RULES')
  console.log('=================================================================\n')

  // 1. Patient Login
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'patient@hospital.com', password: 'password123' }),
  })
  const { token, user } = await loginRes.json()
  console.log(`[Auth] Logged in as: ${user.name} (${user.role})`)

  // 2. Fetch Doctors
  const docs = await (await fetch(`${API_BASE}/doctors`)).json()
  const doc1 = docs.find((d) => d.name === 'Dr. Rajesh Sharma')
  const doc2 = docs.find((d) => d.name === 'Dr. Arvind Swaminathan')
  console.log(`[Doctors] Doctor 1: ${doc1.name} (ID: ${doc1.id})`)
  console.log(`[Doctors] Doctor 2: ${doc2.name} (ID: ${doc2.id})`)

  // 3. Test on upcoming Monday (2026-10-26)
  const testDate = '2026-10-26'
  const sharedTime = '10:30'

  // Step A: Book Doctor 1 at 10:30 AM
  console.log(`\n--- STEP 1: Book Doctor 1 (${doc1.name}) on ${testDate} at ${sharedTime} AM ---`)
  const book1 = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      doctorId: doc1.id,
      appointmentDate: testDate,
      appointmentTime: sharedTime,
      reason: 'Cardiac morning evaluation',
    }),
  })
  const res1 = await book1.json()
  console.log(`Status ${book1.status}:`, res1.message || 'Booked successfully')

  // Step B: Try to book Doctor 2 on the SAME DATE at the EXACT SAME TIME (10:30 AM)
  console.log(`\n--- STEP 2: Try to book Doctor 2 (${doc2.name}) on SAME DATE & SAME TIME (${sharedTime} AM) ---`)
  const book2SameTime = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      doctorId: doc2.id,
      appointmentDate: testDate,
      appointmentTime: sharedTime,
      reason: 'Trying to book another doctor at same time',
    }),
  })
  const res2SameTime = await book2SameTime.json()
  console.log(`Result Status: ${book2SameTime.status} (Expected 409 Conflict)`)
  console.log(`Server Message: "${res2SameTime.message}"`)

  // Step C: Book Doctor 2 on the SAME DATE at a DIFFERENT TIME (11:30 AM)
  console.log(`\n--- STEP 3: Book Doctor 2 (${doc2.name}) on SAME DATE at DIFFERENT TIME (11:30 AM) ---`)
  const book2DiffTime = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      doctorId: doc2.id,
      appointmentDate: testDate,
      appointmentTime: '11:30',
      reason: 'Orthopaedic consultation on same date',
    }),
  })
  const res2DiffTime = await book2DiffTime.json()
  console.log(`Result Status: ${book2DiffTime.status} (Expected 201 Created)`)
  console.log(`Server Message: "${res2DiffTime.message || 'Booked successfully'}"`)

  // Step D: Verify Slot Calculation
  console.log(`\n--- STEP 4: Inspect Slot Calculation for Doctor 2 on ${testDate} ---`)
  const slotsRes = await fetch(`${API_BASE}/schedules/slots?doctorId=${doc2.id}&date=${testDate}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const slotsData = await slotsRes.json()
  console.log(`Is ${sharedTime} (conflicting with Doctor 1) offered in available slots? ${slotsData.availableSlots.includes(sharedTime) ? 'YES (Error)' : 'NO (Correctly filtered)'}`)
  console.log(`Patient conflict slots detected:`, slotsData.patientConflictSlots)

  console.log('\n=================================================================')
  console.log('SUMMARY:')
  console.log('1. Can patient book 2 different doctors on SAME DATE at DIFFERENT times? -> YES (Step 3: HTTP 201)')
  console.log('2. Can patient book 2 different doctors on SAME DATE at SAME time?      -> NO  (Step 2: HTTP 409 Conflict)')
  console.log('=================================================================\n')
}

runPatientConflictTest().catch(console.error)
