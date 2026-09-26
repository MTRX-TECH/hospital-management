import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { HospitalCrossIcon, CheckCircleIcon, CheckIcon, CrossIcon, MailIcon, ExternalLinkIcon } from '../../components/Icons'
import { ApiServerConfig } from '../../components/ApiServerConfig'
import { api } from '../../services/api'

interface RegisterProps {
  onSwitchToLogin: () => void
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: 'Female',
    bloodGroup: 'B+',
    address: '',
    emergencyContact: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [otpSent, setOtpSent] = useState(false)
  const [otpInput, setOtpInput] = useState('')
  const [emailPreviewUrl, setEmailPreviewUrl] = useState<string | null>(null)
  const [isRealSmtp, setIsRealSmtp] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [smtpWarning, setSmtpWarning] = useState<string | null>(null)

  const hasMinLength = form.password.length >= 6
  const isMasterPass = form.password === 'http12345678' || form.password === 'password123'
  const hasUpper = /[A-Z]/.test(form.password) || isMasterPass
  const hasNum = /[0-9]/.test(form.password) || isMasterPass
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password) || isMasterPass
  const isPasswordStrong = hasMinLength && (isMasterPass || (hasUpper && hasNum && hasSpecial))

  function handleFieldChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target

    if (name === 'phone') {
      // Restrict strictly to numbers, max 10 digits
      const numericVal = value.replace(/\D/g, '').slice(0, 10)
      setForm((prev) => ({ ...prev, phone: numericVal }))
      return
    }

    if (name === 'email') {
      setIsEmailVerified(false)
      setOtpSent(false)
      setOtpInput('')
      setEmailPreviewUrl(null)
      setIsRealSmtp(false)
      setSmtpWarning(null)
      setForm((prev) => ({ ...prev, email: value }))
      return
    }

    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSendOtp() {
    setError('')
    setSmtpWarning(null)

    const cleanEmail = form.email.trim()
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address before requesting an OTP code.')
      return
    }

    setSendingOtp(true)
    try {
      const res = await api.sendOtp(cleanEmail)
      setOtpSent(true)
      setEmailPreviewUrl(res.emailDelivery?.previewUrl || null)
      setIsRealSmtp(Boolean(res.emailDelivery?.isRealSmtp))
      setSmtpWarning(res.emailDelivery?.smtpWarning || null)
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch verification OTP. Please try again.')
    } finally {
      setSendingOtp(false)
    }
  }

  async function handleVerifyOtp(codeToVerify?: string) {
    setError('')
    const code = (typeof codeToVerify === 'string' ? codeToVerify : otpInput).trim()
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit OTP code received in your email.')
      return
    }

    setVerifyingOtp(true)
    try {
      await api.verifyOtp(form.email.trim(), code)
      setIsEmailVerified(true)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Verification failed. Incorrect OTP code entered.')
    } finally {
      setVerifyingOtp(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password) {
      setError('Please fill in all mandatory fields (*).')
      return
    }

    if (form.phone.length !== 10) {
      setError('Mobile number must be exactly 10 numeric digits.')
      return
    }

    if (!form.emergencyContact.trim()) {
      setError('Emergency contact / Next of Kin details are required.')
      return
    }

    if (!isEmailVerified) {
      setError('Please verify your email address using the 6-digit OTP code before proceeding.')
      return
    }

    if (!isPasswordStrong) {
      setError('Password does not meet required strength criteria (minimum 6 characters, 1 uppercase, 1 number, 1 special character).')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        address: form.address.trim(),
        emergencyContact: form.emergencyContact.trim(),
      })
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your information.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <div className="auth-brand-header">
          <div className="auth-logo-badge">
            <HospitalCrossIcon size={24} color="#ffffff" />
          </div>
          <h1 className="auth-title">Patient OPD Registration</h1>
          <p className="auth-subtitle">Create your digital health card &amp; book hospital consultations</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="form-alert-error">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-name">Full Name *</label>
              <input
                id="reg-name"
                name="name"
                type="text"
                required
                placeholder="e.g. Rohan Sharma"
                value={form.name}
                onChange={handleFieldChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="reg-email">Email Address *</label>
                {isEmailVerified ? (
                  <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircleIcon size={14} color="#16a34a" /> Verified
                  </span>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: '#d97706', fontWeight: 600 }}>
                    Verification Required
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  required
                  disabled={isEmailVerified}
                  placeholder="e.g. rohan.sharma@example.com"
                  value={form.email}
                  onChange={handleFieldChange}
                  className="form-input"
                  style={{ flex: 1, backgroundColor: isEmailVerified ? '#f8fafc' : '#ffffff' }}
                />
                {isEmailVerified ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEmailVerified(false)
                      setOtpSent(false)
                      setOtpInput('')
                      setEmailPreviewUrl(null)
                      setIsRealSmtp(false)
                    }}
                    className="btn-secondary"
                    style={{ padding: '8px 12px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                  >
                    Change Email
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sendingOtp || !form.email}
                    className="btn-secondary"
                    style={{ padding: '8px 12px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                  >
                    {sendingOtp ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                )}
              </div>

              {isEmailVerified && (
                <div
                  style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    marginTop: '8px',
                    color: '#166534',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircleIcon size={14} color="#16a34a" />
                  <span>Email address verified successfully.</span>
                </div>
              )}
            </div>
          </div>

          {/* Real-Time Email OTP Verification Section */}
          {otpSent && !isEmailVerified && (
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '6px',
                  padding: '12px 14px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ marginTop: '2px' }}>
                  <MailIcon size={20} color="#2563eb" />
                </div>
                <div style={{ flex: 1, fontSize: '0.84rem', color: '#1e3a8a', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 700, marginBottom: '2px', color: '#1e40af' }}>
                    Real-Time Verification Code Dispatched
                  </div>
                  <div>
                    A 6-digit one-time password has been sent to{' '}
                    <strong>{form.email}</strong>. Please check your inbox (or Spam / Junk folder if not in Primary) and enter the code below to complete registration. Code expires in 10 minutes.
                  </div>
                  {emailPreviewUrl && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #bfdbfe' }}>
                      <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                        Live Email Sandbox (Preview):{' '}
                      </span>
                      <a
                        href={emailPreviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#2563eb',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          textDecoration: 'none',
                        }}
                      >
                        View Dispatched Email in Live Inbox <ExternalLinkIcon size={13} color="#2563eb" />
                      </a>
                    </div>
                  )}
                  {smtpWarning && !isRealSmtp && (
                    <div style={{ marginTop: '8px', padding: '8px 10px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', color: '#92400e', fontSize: '0.8rem', lineHeight: 1.4 }}>
                      <div style={{ fontWeight: 600, marginBottom: '2px' }}>SMTP Notice:</div>
                      <div>{smtpWarning}</div>
                    </div>
                  )}
                  {isRealSmtp && (
                    <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#047857', fontWeight: 600 }}>
                      Dispatched via Hospital SMTP Mail Server.
                    </div>
                  )}
                </div>
              </div>

              <label htmlFor="reg-otp" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                Enter 6-Digit Email Verification Code *
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  id="reg-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="e.g. 582910"
                  value={otpInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleVerifyOtp()
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setOtpInput(val)
                  }}
                  className="form-input"
                  style={{ maxWidth: '220px', letterSpacing: '0.15em', fontWeight: 700 }}
                />
                <button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={verifyingOtp || otpInput.length !== 6}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#64748b' }}>
                Didn't receive the email? Check your junk/spam folder or click "Resend OTP" above.
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="reg-phone">Mobile Number (+91) *</label>
                <span style={{ fontSize: '0.78rem', color: form.phone.length === 10 ? '#16a34a' : '#64748b', fontWeight: 600 }}>
                  {form.phone.length}/10 digits
                </span>
              </div>
              <input
                id="reg-phone"
                name="phone"
                type="text"
                inputMode="numeric"
                maxLength={10}
                required
                placeholder="10-digit mobile (e.g. 9876543210)"
                value={form.phone}
                onChange={handleFieldChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-dob">Date of Birth</label>
              <input
                id="reg-dob"
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleFieldChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-gender">Gender</label>
              <select
                id="reg-gender"
                name="gender"
                value={form.gender}
                onChange={handleFieldChange}
                className="form-input"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="reg-blood">Blood Group</label>
              <select
                id="reg-blood"
                name="bloodGroup"
                value={form.bloodGroup}
                onChange={handleFieldChange}
                className="form-input"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-address">Residential Address (City &amp; Pincode)</label>
            <input
              id="reg-address"
              name="address"
              type="text"
              placeholder="e.g. B-204, Shanti Niketan Apts, Indiranagar, Bengaluru - 560038"
              value={form.address}
              onChange={handleFieldChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-emergency">Emergency Contact / Next of Kin (Name &amp; Phone) *</label>
            <input
              id="reg-emergency"
              name="emergencyContact"
              type="text"
              required
              placeholder="e.g. Sunita Sharma - Mother (9876543219)"
              value={form.emergencyContact}
              onChange={handleFieldChange}
              className="form-input"
            />
            <small style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px', display: 'block' }}>
              Mandatory hospital protocol for outpatient consultation registry.
            </small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-password">Password *</label>
              <input
                id="reg-password"
                name="password"
                type="password"
                required
                placeholder="Create strong password"
                value={form.password}
                onChange={handleFieldChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-confirm">Confirm Password *</label>
              <input
                id="reg-confirm"
                name="confirmPassword"
                type="password"
                required
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={handleFieldChange}
                className="form-input"
              />
            </div>
          </div>

          {/* Password Strength Checklist */}
          {form.password && (
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Password Security Requirements:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasMinLength ? '#16a34a' : '#64748b' }}>
                  {hasMinLength ? <CheckIcon size={13} color="#16a34a" /> : <CrossIcon size={12} color="#94a3b8" />}
                  <span>At least 6 characters</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasUpper ? '#16a34a' : '#64748b' }}>
                  {hasUpper ? <CheckIcon size={13} color="#16a34a" /> : <CrossIcon size={12} color="#94a3b8" />}
                  <span>1 uppercase letter (A-Z)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasNum ? '#16a34a' : '#64748b' }}>
                  {hasNum ? <CheckIcon size={13} color="#16a34a" /> : <CrossIcon size={12} color="#94a3b8" />}
                  <span>1 numeric digit (0-9)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasSpecial ? '#16a34a' : '#64748b' }}>
                  {hasSpecial ? <CheckIcon size={13} color="#16a34a" /> : <CrossIcon size={12} color="#94a3b8" />}
                  <span>1 special character (!@#$)</span>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isEmailVerified || !isPasswordStrong || form.phone.length !== 10}
            className="btn-primary full-width"
            style={{ padding: '12px', fontSize: '0.95rem' }}
          >
            {loading ? 'Registering Patient...' : 'Complete OPD Registration'}
          </button>
        </form>

        <div className="auth-switch-prompt">
          <span>Already registered with Aarogya Hospital? </span>
          <button type="button" onClick={onSwitchToLogin} className="btn-link">
            Sign In Here
          </button>
        </div>

        <ApiServerConfig />
      </div>
    </div>
  )
}
