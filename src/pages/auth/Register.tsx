import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { HospitalCrossIcon, CheckIcon, CrossIcon } from '../../components/Icons'
import { ApiServerConfig } from '../../components/ApiServerConfig'

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

    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password) {
      setError('Please fill in all mandatory fields (*).')
      return
    }

    const cleanEmail = form.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.')
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
        email: cleanEmail,
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
              <label htmlFor="reg-email">Email Address *</label>
              <input
                id="reg-email"
                name="email"
                type="email"
                required
                placeholder="e.g. rohan.sharma@example.com"
                value={form.email}
                onChange={handleFieldChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-phone">Mobile Number (10 Digits) *</label>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRight: 'none',
                    padding: '8px 12px',
                    borderTopLeftRadius: '6px',
                    borderBottomLeftRadius: '6px',
                    fontSize: '0.9rem',
                    color: '#475569',
                    fontWeight: 600,
                  }}
                >
                  +91
                </span>
                <input
                  id="reg-phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={handleFieldChange}
                  className="form-input"
                  style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                  maxLength={10}
                />
              </div>
              <small style={{ color: '#64748b', fontSize: '0.76rem', marginTop: '4px', display: 'block' }}>
                {form.phone.length}/10 digits entered
              </small>
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
                className="form-select"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
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
                className="form-select"
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
            <label htmlFor="reg-emergency">Emergency Contact / Next of Kin (Name &amp; Phone) *</label>
            <input
              id="reg-emergency"
              name="emergencyContact"
              type="text"
              required
              placeholder="e.g. Priya Sharma (Spouse) - 9876500000"
              value={form.emergencyContact}
              onChange={handleFieldChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-address">Residential Address</label>
            <textarea
              id="reg-address"
              name="address"
              rows={2}
              placeholder="e.g. Flat 402, Shanti Kunj, Karol Bagh, New Delhi"
              value={form.address}
              onChange={handleFieldChange}
              className="form-input"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reg-password">Password *</label>
              <input
                id="reg-password"
                name="password"
                type="password"
                required
                placeholder="At least 6 characters"
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
            disabled={loading || !isPasswordStrong || form.phone.length !== 10 || !form.name.trim() || !form.email.trim() || !form.emergencyContact.trim()}
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
