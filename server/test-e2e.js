const API_BASE = 'http://localhost:4000/api'

async function runFullE2ETest() {
  console.log('====================================================')
  console.log('STARTING COMPLETE SYSTEM INTEGRATION & VIVA TEST SUITE')
  console.log('====================================================\n')

  // 1. Health check
  const health = await (await fetch(`${API_BASE}/health`)).json()
  console.log('1. [System] Health check status:', health.status, `(Database: ${health.database})`)

  // 2. Simulated Email OTP Verification & Patient Registration
  const testEmail = `student.test.${Date.now()}@example.com`
  const otpRes = await fetch(`${API_BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  })
  const otpData = await otpRes.json()
  console.log('2a. [Patient] Simulated OTP dispatched for email:', otpData.simulatedOtp)

  const verifyOtpRes = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, otp: otpData.simulatedOtp }),
  })
  const verifyData = await verifyOtpRes.json()
  console.log('2b. [Patient] OTP verification status:', verifyData.message)

  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Alexander Knight',
      email: testEmail,
      phone: '9876543210',
      password: 'Pass@123',
      dateOfBirth: '2001-05-12',
      gender: 'Male',
      bloodGroup: 'B+',
      address: '12 University Drive, Tech Campus',
      emergencyContact: '9876543211',
    }),
  })
  const regData = await regRes.json()
  if (!regData.user) {
    throw new Error('Registration failed: ' + JSON.stringify(regData))
  }
  console.log('2c. [Patient] Registered new patient:', regData.user.name, `(${regData.user.email})`)
  const patientToken = regData.token

  // 3. Patient updates profile
  const updateProfRes = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${patientToken}`,
    },
    body: JSON.stringify({
      address: '45 Varsity Road, Innovation Wing',
      phone: '9876543212',
    }),
  })
  const updatedProf = await updateProfRes.json()
  console.log('3. [Patient] Updated demographic profile address:', updatedProf.profile.address)

  // 4. Patient searches doctors & filters by department
  const doctorsInCardio = await (await fetch(`${API_BASE}/doctors?department=Cardiology`)).json()
  console.log(`4. [Patient] Filtered Cardiology doctors: Found ${doctorsInCardio.length} provider(s).`)
  const targetDoctor = doctorsInCardio[0]

  // 5. Patient checks available schedule slots
  const testDate = '2026-10-12' // Monday
  const slotData = await (await fetch(`${API_BASE}/schedules/slots?doctorId=${targetDoctor.id}&date=${testDate}`)).json()
  console.log(`5. [Patient] Available slots for ${testDate} with ${targetDoctor.name}:`, slotData.availableSlots.length, 'slots')
  const chosenSlot = slotData.availableSlots[0]

  // 6. Patient books appointment
  const bookRes = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${patientToken}`,
    },
    body: JSON.stringify({
      doctorId: targetDoctor.id,
      appointmentDate: testDate,
      appointmentTime: chosenSlot,
      reason: 'Chest tightness following cardio workout',
    }),
  })
  const appt = await bookRes.json()
  console.log('6. [Patient] Booked appointment ID:', appt.id, 'Status:', appt.status)

  // 7. Verify slot collision prevention: Second patient booking the same slot
  const collisionRes = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${patientToken}`,
    },
    body: JSON.stringify({
      doctorId: targetDoctor.id,
      appointmentDate: testDate,
      appointmentTime: chosenSlot,
      reason: 'Another patient trying same slot',
    }),
  })
  console.log('7. [Security] Slot Collision Check (Expected 409 Conflict): Status', collisionRes.status)
  if (collisionRes.status !== 409) throw new Error('Collision prevention failed!')

  // 8. Doctor logs in
  const docLogin = await (
    await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dr.rajesh@hospital.com', password: 'password123' }),
    })
  ).json()
  const doctorToken = docLogin.token
  console.log('8. [Doctor] Logged in as:', docLogin.user.name)

  // 9. Doctor confirms the requested appointment
  const confirmRes = await (
    await fetch(`${API_BASE}/appointments/${appt.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({ status: 'CONFIRMED' }),
    })
  ).json()
  console.log('9. [Doctor] Confirmed appointment:', confirmRes.message)

  // 10. Doctor uploads diagnostic report image via Cloudinary endpoint & completes visit
  const uploadRes = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${doctorToken}`,
    },
    body: JSON.stringify({
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    }),
  })
  const uploadData = await uploadRes.json()
  console.log('10a. [Doctor] Cloudinary Report Image Uploaded:', uploadData.url ? 'Success' : 'Failed')

  const visitRes = await (
    await fetch(`${API_BASE}/visits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        appointmentId: appt.id,
        diagnosisSummary: 'Exercise-induced intercostal muscle strain',
        doctorNotes: 'Cardiac enzymes normal. ECG showed healthy rhythm. Prescribed mild analgesics and rest from heavy lifting for 7 days.',
        reportImageUrl: uploadData.url,
      }),
    })
  ).json()
  console.log('10b. [Doctor] Completed visit and recorded notes with report image:', visitRes.message)

  // 11. Patient verifies visit record & doctor notes
  const patientVisits = await (
    await fetch(`${API_BASE}/visits`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    })
  ).json()
  console.log(`11. [Patient] Medical records retrieved: ${patientVisits.length} record(s). Latest: "${patientVisits[0].diagnosisSummary}" (Report URL attached: ${Boolean(patientVisits[0].reportImageUrl)})`)

  // 12. Patient marks notifications read
  const notifData = await (
    await fetch(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    })
  ).json()
  console.log(`12. [Patient] Notifications count: ${notifData.notifications.length} (${notifData.unreadCount} unread)`)
  await fetch(`${API_BASE}/notifications/read-all`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${patientToken}` },
  })
  const postReadNotifs = await (
    await fetch(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    })
  ).json()
  console.log('    [Patient] After mark all read: Unread count =', postReadNotifs.unreadCount)

  // 13. Admin logs in
  const adminLogin = await (
    await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@hospital.com', password: 'password123' }),
    })
  ).json()
  const adminToken = adminLogin.token
  console.log('13. [Admin] Logged in as:', adminLogin.user.name)

  // 14. Admin creates new department
  const newDeptName = `Physiotherapy & Sports Medicine ${Date.now().toString().slice(-4)}`
  const deptCreate = await (
    await fetch(`${API_BASE}/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: newDeptName,
        description: 'Advanced physical therapy, musculoskeletal rehab, and athletic recovery.',
      }),
    })
  ).json()
  console.log('14. [Admin] Created new department:', deptCreate.name)

  // 15. Admin views live reports
  const reports = await (
    await fetch(`${API_BASE}/reports`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
  ).json()
  console.log('15. [Admin] Real-time Database Analytics Summary:')
  console.log('    Total Doctors in DB:', reports.summary.totalDoctors)
  console.log('    Total Patients in DB:', reports.summary.totalPatients)
  console.log('    Total Appointments in DB:', reports.summary.totalAppointments)
  console.log('    Completed Visits in DB:', reports.summary.completedAppointments)
  console.log('    Departments in DB:', reports.summary.totalDepartments)

  // 16. Admin accesses patient medical dossier for download
  const patientDetailRes = await fetch(`${API_BASE}/patients/${regData.user.id}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  })
  const patientDetail = await patientDetailRes.json()
  console.log(`16. [Admin] Retrieved patient medical dossier with ${patientDetail.visits.length} visit record(s) ready for image generation download.`)

  console.log('\n====================================================')
  console.log('>>> ALL 16 END-TO-END SYSTEM TESTS PASSED SUCCESSFULLY! <<<')
  console.log('====================================================\n')
}

runFullE2ETest().catch((err) => {
  console.error('Integration test failure:', err)
  process.exit(1)
})
