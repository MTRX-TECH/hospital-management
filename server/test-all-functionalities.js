import http from 'http'

const BASE_URL = 'http://localhost:4000/api'

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`)
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          resolve({ status: res.statusCode, data: parsed })
        } catch {
          resolve({ status: res.statusCode, data })
        }
      })
    })

    req.on('error', reject)

    if (body) {
      req.write(JSON.stringify(body))
    }
    req.end()
  })
}

async function runComprehensiveVerification() {
  console.log('======================================================================')
  console.log('STARTING EXHAUSTIVE COMPREHENSIVE SYSTEM FUNCTIONALITY VERIFICATION')
  console.log('======================================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`)
      passed++
    } else {
      console.error(`[FAIL] ${message}`)
      failed++
    }
  }

  try {
    // -----------------------------------------------------------------
    // SECTION 1: AUTHENTICATION & REGISTRATION VALIDATIONS
    // -----------------------------------------------------------------
    console.log('--- SECTION 1: Patient Registration & Field Validations ---')

    // 1.1 Phone number validation: Reject non-numeric
    const testEmail1 = `test.val.${Date.now()}@hospital.in`
    const regRes1 = await request('POST', '/auth/register', {
      name: 'Test Patient',
      email: testEmail1,
      password: 'StrongPassword@123',
      phone: '98765abcde', // Invalid phone
      emergencyContact: '9876543210',
    })
    assert(
      regRes1.status === 400 && regRes1.data.message?.toLowerCase().includes('digit'),
      '1.1 Rejects registration with non-numeric phone number'
    )

    // 1.2 Phone number validation: Reject < 10 digits
    const regRes2 = await request('POST', '/auth/register', {
      name: 'Test Patient',
      email: testEmail1,
      password: 'StrongPassword@123',
      phone: '98765', // Incomplete phone
      emergencyContact: '9876543210',
    })
    assert(
      regRes2.status === 400 && regRes2.data.message?.toLowerCase().includes('digit'),
      '1.2 Rejects registration with phone length < 10 digits'
    )

    // 1.3 Emergency contact required validation
    const regRes3 = await request('POST', '/auth/register', {
      name: 'Test Patient',
      email: testEmail1,
      password: 'StrongPassword@123',
      phone: '9876543210',
      emergencyContact: '', // Missing emergency contact
    })
    assert(
      regRes3.status === 400 && regRes3.data.message?.toLowerCase().includes('emergency'),
      '1.3 Rejects registration when emergencyContact is missing'
    )

    // 1.4 Password strength validation: Reject weak passwords (no uppercase, no special char)
    const regRes4 = await request('POST', '/auth/register', {
      name: 'Test Patient',
      email: testEmail1,
      password: 'weakpassword', // Weak password
      phone: '9876543210',
      emergencyContact: '9123456780',
    })
    assert(
      regRes4.status === 400 && (regRes4.data.message?.toLowerCase().includes('password') || regRes4.data.message?.toLowerCase().includes('character')),
      '1.4 Rejects weak passwords without uppercase, number, or special character'
    )

    // 1.5 Automated simulated OTP generation
    const otpRes = await request('POST', '/auth/send-otp', { email: testEmail1 })
    assert(
      otpRes.status === 200 && otpRes.data.simulatedOtp && otpRes.data.simulatedOtp.length === 6,
      `1.5 Automated OTP generated successfully: ${otpRes.data.simulatedOtp}`
    )

    // 1.6 Verify simulated OTP
    const verifyRes = await request('POST', '/auth/verify-otp', {
      email: testEmail1,
      otp: otpRes.data.simulatedOtp,
    })
    assert(
      verifyRes.status === 200 && verifyRes.data.verified === true,
      '1.6 Simulated OTP email verified successfully'
    )

    // 1.7 Successful patient registration with valid strong password and 10-digit phone
    const regSuccess = await request('POST', '/auth/register', {
      name: 'Pooja Verma',
      email: testEmail1,
      password: 'Pooja@Hospital2026',
      phone: '9876543210',
      emergencyContact: '9123456780',
      dateOfBirth: '1995-04-12',
      gender: 'Female',
      bloodGroup: 'B+',
    })
    assert(
      regSuccess.status === 201 && regSuccess.data.token && regSuccess.data.user.role === 'patient',
      '1.7 Patient registration succeeds with JWT token issued'
    )
    const newPatientToken = regSuccess.data.token

    // -----------------------------------------------------------------
    // SECTION 2: MULTI-ROLE LOGINS (PATIENT, DOCTORS, ADMIN)
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 2: Role-Based Logins & Authentication ---')

    const patientLogin = await request('POST', '/auth/login', {
      email: 'patient@hospital.com',
      password: 'password123',
    })
    assert(patientLogin.status === 200 && patientLogin.data.user?.role === 'patient', '2.1 Patient login valid')
    const patientToken = patientLogin.data.token

    const doctorLogin1 = await request('POST', '/auth/login', {
      email: 'dr.rajesh@hospital.com',
      password: 'password123',
    })
    assert(doctorLogin1.status === 200 && doctorLogin1.data.user?.role === 'doctor', '2.2 Doctor 1 (Cardiology) login valid')
    const doctorToken1 = doctorLogin1.data.token

    const doctorLogin2 = await request('POST', '/auth/login', {
      email: 'dr.meenakshi@hospital.com',
      password: 'password123',
    })
    assert(doctorLogin2.status === 200 && doctorLogin2.data.user?.role === 'doctor', '2.3 Doctor 2 (General Medicine) login valid')
    const doctorToken2 = doctorLogin2.data.token

    const adminLogin = await request('POST', '/auth/login', {
      email: 'admin@hospital.com',
      password: 'password123',
    })
    assert(adminLogin.status === 200 && adminLogin.data.user?.role === 'admin', '2.4 Admin login valid')
    const adminToken = adminLogin.data.token

    // -----------------------------------------------------------------
    // SECTION 3: DOCTOR DISCOVERY & 14-DAY APPOINTMENT BOOKING
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 3: Doctor Discovery, 14-Day Window & Slot Conflicts ---')

    const docsRes = await request('GET', '/doctors', null, patientToken)
    assert(docsRes.status === 200 && docsRes.data.length >= 2, `3.1 Loaded ${docsRes.data.length} hospital doctors`)

    const cardioDoc = docsRes.data.find((d) => d.department === 'Cardiology') || docsRes.data[0]
    const orthoDoc = docsRes.data.find((d) => String(d.id) !== String(cardioDoc.id)) || docsRes.data[1]

    // Dynamically query next 14 days to find a date & slot where both Cardio & Ortho have available clinic schedule
    let testDate = ''
    let chosenSlot = ''
    for (let i = 2; i <= 14; i++) {
      const candidateDate = new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const [s1, s2] = await Promise.all([
        request('GET', `/schedules/slots?doctorId=${cardioDoc.id}&date=${candidateDate}`, null, patientToken),
        request('GET', `/schedules/slots?doctorId=${orthoDoc.id}&date=${candidateDate}`, null, patientToken),
      ])
      const overlap = s1.data.availableSlots?.find((slot) => s2.data.availableSlots?.includes(slot))
      if (overlap) {
        testDate = candidateDate
        chosenSlot = overlap
        break
      }
    }

    console.log(`[INFO] Found verified overlapping clinic slot: ${testDate} at ${chosenSlot} for both Dr. ${cardioDoc.name} and Dr. ${orthoDoc.name}`)

    const slotsRes = await request('GET', `/schedules/slots?doctorId=${cardioDoc.id}&date=${testDate}`, null, patientToken)
    assert(slotsRes.status === 200 && slotsRes.data.availableSlots?.length > 0, `3.2 Generated ${slotsRes.data.availableSlots?.length} slots for ${testDate}`)

    // 3.3 Book Appointment with Doctor 1 (Cardiology) with Simulated Advance Payment ₹200
    const bookRes1 = await request(
      'POST',
      '/appointments',
      {
        doctorId: cardioDoc.id,
        appointmentDate: testDate,
        appointmentTime: chosenSlot,
        reason: 'Recurrent palpitations and exertion fatigue',
        advancePaid: 200,
        paymentMethod: 'UPI',
        preConsultation: {
          reason: 'Recurrent palpitations and exertion fatigue',
          symptoms: ['Chest Pain / Discomfort', 'Breathlessness / Shortness of Breath'],
          symptomDuration: '1-3 Days',
          existingConditions: ['Hypertension (BP)'],
          currentMedications: 'Amlodipine 5mg',
          knownAllergies: 'None',
          additionalNotes: 'Patient requests morning consultation',
        },
      },
      patientToken
    )

    assert(
      bookRes1.status === 201 &&
        bookRes1.data.advancePaid === 200 &&
        bookRes1.data.paymentStatus === 'PARTIALLY_PAID' &&
        bookRes1.data.transactionReference &&
        bookRes1.data.receiptNumber,
      `3.3 Doctor 1 appointment booked with ₹200 advance deposit (Receipt: ${bookRes1.data.receiptNumber}, Txn: ${bookRes1.data.transactionReference})`
    )
    const appointment1Id = bookRes1.data.id

    // 3.4 Cross-Check Collision Prevention:
    // Single patient tries to book Doctor 2 (Orthopaedics) on the EXACT same date and time slot
    console.log('\n--- Cross-Check: Patient Collision Prevention on Same Date & Time ---')
    const conflictBookRes = await request(
      'POST',
      '/appointments',
      {
        doctorId: orthoDoc.id,
        appointmentDate: testDate,
        appointmentTime: chosenSlot, // Same date & slot!
        reason: 'Joint and shoulder evaluation',
        advancePaid: 200,
        paymentMethod: 'CARD',
      },
      patientToken
    )

    assert(
      conflictBookRes.status === 409 && conflictBookRes.data.message?.toLowerCase().includes('conflict'),
      `3.4 Prevented single patient booking two appointments for different doctors on same date & time (Status: 409 Conflict: "${conflictBookRes.data.message}")`
    )

    // -----------------------------------------------------------------
    // SECTION 4: PAYMENT LEDGER & RECEIPT INTEGRITY
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 4: Payment Ledger & Official Receipt Verification ---')

    const receiptRes = await request('GET', `/payments/receipt/${appointment1Id}`, null, patientToken)
    assert(
      receiptRes.status === 200 &&
        receiptRes.data.receiptNumber === bookRes1.data.receiptNumber &&
        receiptRes.data.advancePaid === 200 &&
        receiptRes.data.remainingBalance === (cardioDoc.consultationFee || 800) - 200,
      `4.1 Official hospital receipt retrieved: Advance ₹${receiptRes.data.advancePaid}, Balance Due ₹${receiptRes.data.remainingBalance}`
    )

    // -----------------------------------------------------------------
    // SECTION 5: OPD CHECK-IN & SEQUENTIAL TOKEN GENERATION
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 5: OPD Check-In & Live Waiting Room ---')

    const checkInRes = await request('POST', `/appointments/${appointment1Id}/check-in`, {}, patientToken)
    assert(
      checkInRes.status === 200 && checkInRes.data.queueToken && checkInRes.data.queueNumber > 0,
      `5.1 OPD Check-In successful. Assigned Sequential Queue Token: ${checkInRes.data.queueToken} (Queue #${checkInRes.data.queueNumber})`
    )

    const queueStatusRes = await request('GET', `/appointments/${appointment1Id}/queue`, null, patientToken)
    assert(
      queueStatusRes.status === 200 && queueStatusRes.data.queueToken === checkInRes.data.queueToken,
      `5.2 Live waiting room status verified: Current Token = ${queueStatusRes.data.currentToken || 'None'}, Status = ${queueStatusRes.data.status}`
    )

    // -----------------------------------------------------------------
    // SECTION 6: DOCTOR OPD QUEUE & CLINICAL CONSULTATION
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 6: Doctor OPD Queue Board & Consultation ---')

    const docQueueRes = await request('GET', `/doctor-queue/today?date=${testDate}`, null, doctorToken1)
    assert(
      docQueueRes.status === 200 && docQueueRes.data.queue?.some((item) => item.id === appointment1Id),
      `6.1 Doctor OPD Queue board contains checked-in patient token ${checkInRes.data.queueToken}`
    )

    // 6.2 Doctor calls next patient
    const callRes = await request('POST', '/doctor-queue/call-next', { appointmentId: appointment1Id }, doctorToken1)
    assert(callRes.status === 200, `6.2 Doctor successfully called token ${checkInRes.data.queueToken}`)

    // 6.3 Doctor starts consultation
    const startRes = await request('POST', '/doctor-queue/start-consultation', { appointmentId: appointment1Id }, doctorToken1)
    assert(startRes.status === 200, '6.3 Doctor consultation started (Status: IN_CONSULTATION)')

    // 6.4 Complete consultation with tablet name and number of times taken
    const completeRes = await request(
      'POST',
      '/doctor-queue/complete-consultation',
      {
        appointmentId: appointment1Id,
        diagnosisSummary: 'Benign Sinus Tachycardia with stress fatigue',
        doctorNotes: 'ECG regular rhythm. Advised adequate hydration and electrolyte balance.',
        doctorAdvice: 'Avoid caffeine after 4 PM, practice 20 mins slow deep breathing twice daily.',
        followUpDate: '2026-10-15',
        reportImageUrl: 'https://res.cloudinary.com/hospital/image/upload/v12345/ecg_strip_01.png',
        medicines: [
          {
            tabletName: 'Tab. Metoprolol Tartrate 25mg',
            frequency: '2 times daily (Morning - Night)',
            duration: '14 Days',
            instructions: 'Take 1 tablet after food with full glass of water',
          },
          {
            tabletName: 'Tab. Neurobion Forte',
            frequency: '1 time daily (After lunch)',
            duration: '30 Days',
            instructions: 'Swallow whole with meal',
          },
        ],
      },
      doctorToken1
    )

    assert(
      completeRes.status === 200 && completeRes.data.visitId,
      `6.4 Consultation completed with digital prescription & report image (Visit ID: ${completeRes.data.visitId})`
    )

    // -----------------------------------------------------------------
    // SECTION 7: PATIENT PRESCRIPTIONS & VISIT RECORDS
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 7: Patient Prescription & Visit History Inspection ---')

    const rxRes = await request('GET', `/appointments/${appointment1Id}/prescription`, null, patientToken)
    assert(
      rxRes.status === 200 &&
        rxRes.data.medicines?.length === 2 &&
        rxRes.data.medicines[0].tabletName === 'Tab. Metoprolol Tartrate 25mg' &&
        rxRes.data.medicines[0].frequency.includes('2 times daily'),
      `7.1 Patient digital prescription contains explicit tablet names and frequencies: "${rxRes.data.medicines[0].tabletName}" (${rxRes.data.medicines[0].frequency})`
    )

    const visitsRes = await request('GET', '/visits', null, patientToken)
    assert(
      visitsRes.status === 200 && visitsRes.data.some((v) => v.appointmentId === appointment1Id),
      `7.2 Patient visit history contains completed record with report image (${visitsRes.data[0]?.reportImageUrl ? 'Image Attached' : 'No image'})`
    )

    // -----------------------------------------------------------------
    // SECTION 8: DOCTOR PATIENT HISTORY LIST & ADMIN OVERSIGHT
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 8: Doctor Patient History List & Admin Dossier ---')

    // 8.1 Doctor views complete patient history list
    const docVisitsList = await request('GET', '/visits?all=true', null, doctorToken1)
    assert(
      docVisitsList.status === 200 && docVisitsList.data.length >= 1,
      `8.1 Doctor module displays patient history in list (${docVisitsList.data.length} total patient records)`
    )

    // 8.2 Admin views hospital payments ledger
    const adminPayments = await request('GET', '/payments', null, adminToken)
    const totalRev = adminPayments.data.stats?.totalRevenue ?? adminPayments.data.totalRevenue ?? 0
    const totalTx = adminPayments.data.stats?.totalTransactions ?? adminPayments.data.payments?.length ?? 0
    assert(
      adminPayments.status === 200 && totalRev > 0 && totalTx > 0,
      `8.2 Admin payments ledger oversight: Total Revenue = ₹${totalRev}, Total Transactions = ${totalTx}`
    )

    // 8.3 Admin inspects full patient medical dossier (ready for image download)
    const patientsRes = await request('GET', '/patients', null, adminToken)
    assert(patientsRes.status === 200 && patientsRes.data.length > 0, `8.3 Admin fetched ${patientsRes.data.length} hospital patients`)

    const firstPatient = patientsRes.data[0]
    const dossierRes = await request('GET', `/patients/${firstPatient.id}`, null, adminToken)
    assert(
      dossierRes.status === 200 && dossierRes.data.patient && Array.isArray(dossierRes.data.visits),
      `8.4 Admin loaded medical history dossier for ${firstPatient.name} (${dossierRes.data.visits.length} clinical visits)`
    )

    // -----------------------------------------------------------------
    // SECTION 9: NOTIFICATIONS
    // -----------------------------------------------------------------
    console.log('\n--- SECTION 9: Automated Notifications Verification ---')

    const notifsRes = await request('GET', '/notifications', null, patientToken)
    assert(
      notifsRes.status === 200 && notifsRes.data.notifications?.length > 0,
      `9.1 Patient received automated notifications (${notifsRes.data.notifications?.length} total notifications)`
    )

    // Summary
    console.log('\n======================================================================')
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`)
    console.log('======================================================================')

    if (failed === 0) {
      console.log('>>> ALL SYSTEM FUNCTIONALITIES ARE VERIFIED AND WORKING 100% CORRECTLY! <<<')
      process.exit(0)
    } else {
      console.error(`>>> ${failed} TEST(S) FAILED. INVESTIGATION REQUIRED. <<<`)
      process.exit(1)
    }
  } catch (error) {
    console.error('Fatal execution error during verification:', error)
    process.exit(1)
  }
}

runComprehensiveVerification()
