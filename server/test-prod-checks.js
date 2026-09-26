// Test script for verifying production endpoints, aliases, CORS preflight, and OTP dispatch
const BASE = 'http://localhost:4000'

async function run() {
  console.log('Testing Production Readiness & API Immunity...')
  let passed = 0
  let failed = 0

  function assert(condition, name, detail = '') {
    if (condition) {
      console.log(`[PASS] ${name} ${detail}`)
      passed++
    } else {
      console.error(`[FAIL] ${name} ${detail}`)
      failed++
    }
  }

  // 1. Health checks
  try {
    const res = await fetch(`${BASE}/api/health`)
    const data = await res.json()
    assert(res.status === 200 && data.status === 'ok', '1. /api/health endpoint', `(Status ${res.status})`)
  } catch (e) {
    assert(false, '1. /api/health endpoint', e.message)
  }

  try {
    const res = await fetch(`${BASE}/health`)
    const data = await res.json()
    assert(res.status === 200 && data.status === 'ok', '2. /health alias endpoint', `(Status ${res.status})`)
  } catch (e) {
    assert(false, '2. /health alias endpoint', e.message)
  }

  // 2. CORS Preflight OPTIONS check
  try {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://my-hospital-frontend.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    })
    const allowOrigin = res.headers.get('access-control-allow-origin')
    const allowMethods = res.headers.get('access-control-allow-methods')
    assert(
      (res.status === 204 || res.status === 200) && allowOrigin === 'https://my-hospital-frontend.vercel.app',
      '3. Cross-origin CORS Preflight (Vercel to Render)',
      `(Status ${res.status}, Origin: ${allowOrigin}, Methods: ${allowMethods})`
    )
  } catch (e) {
    assert(false, '3. Cross-origin CORS Preflight', e.message)
  }

  // 3. Login checks across multiple route aliases
  try {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'https://my-hospital-frontend.vercel.app' },
      body: JSON.stringify({ email: 'admin@hospital.com', password: 'password123' }),
    })
    const data = await res.json()
    assert(res.status === 200 && Boolean(data.token), '4. /api/auth/login standard path', `(User: ${data.user?.email})`)
  } catch (e) {
    assert(false, '4. /api/auth/login standard path', e.message)
  }

  try {
    const res = await fetch(`${BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient@hospital.com', password: 'password123' }),
    })
    const data = await res.json()
    assert(res.status === 200 && Boolean(data.token), '5. /api/login alias path', `(User: ${data.user?.email})`)
  } catch (e) {
    assert(false, '5. /api/login alias path', e.message)
  }

  try {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dr.rajesh@hospital.com', password: 'password123' }),
    })
    const data = await res.json()
    assert(res.status === 200 && Boolean(data.token), '6. /auth/login alias path', `(User: ${data.user?.email})`)
  } catch (e) {
    assert(false, '6. /auth/login alias path', e.message)
  }

  // 4. Send OTP across multiple route aliases
  let generatedOtp = null
  try {
    const res = await fetch(`${BASE}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'verify.production@aarogyahospital.in' }),
    })
    const data = await res.json()
    generatedOtp = data.otp || data.code
    assert(
      res.status === 200 && data.success && Boolean(generatedOtp),
      '7. /api/auth/send-otp standard path',
      `(Generated OTP: ${generatedOtp}, Real SMTP: ${data.emailDelivery?.isRealSmtp})`
    )
  } catch (e) {
    assert(false, '7. /api/auth/send-otp standard path', e.message)
  }

  try {
    const res = await fetch(`${BASE}/api/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'verify.alias@aarogyahospital.in' }),
    })
    const data = await res.json()
    assert(
      res.status === 200 && data.success,
      '8. /api/send-otp alias path',
      `(Message: ${data.message})`
    )
  } catch (e) {
    assert(false, '8. /api/send-otp alias path', e.message)
  }

  // 5. Verify OTP
  if (generatedOtp) {
    try {
      const res = await fetch(`${BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'verify.production@aarogyahospital.in', otp: generatedOtp }),
      })
      const data = await res.json()
      assert(
        res.status === 200 && data.verified,
        '9. /api/auth/verify-otp standard path',
        `(Verified: ${data.verified})`
      )
    } catch (e) {
      assert(false, '9. /api/auth/verify-otp standard path', e.message)
    }

    try {
      const res = await fetch(`${BASE}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'verify.production@aarogyahospital.in', otp: generatedOtp }),
      })
      const data = await res.json()
      assert(
        res.status === 200 && data.verified,
        '10. /api/verify-otp alias path',
        `(Verified: ${data.verified})`
      )
    } catch (e) {
      assert(false, '10. /api/verify-otp alias path', e.message)
    }
  }

  console.log(`\nRESULTS: ${passed} PASSED, ${failed} FAILED`)
  if (failed > 0) {
    process.exit(1)
  }
}

run()
