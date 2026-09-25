import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { HospitalCrossIcon } from '../../components/Icons'

interface LoginProps {
  onSwitchToRegister: () => void
}

export const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeRoleTab, setActiveRoleTab] = useState<'patient' | 'doctor' | 'admin'>('patient')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please provide both email and password.')
      return
    }

    setLoading(true)
    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  function handleQuickFill(role: 'patient' | 'doctor' | 'admin') {
    setActiveRoleTab(role)
    setError('')
    if (role === 'patient') {
      setEmail('patient@hospital.com')
      setPassword('password123')
    } else if (role === 'doctor') {
      setEmail('dr.rajesh@hospital.com')
      setPassword('password123')
    } else if (role === 'admin') {
      setEmail('admin@hospital.com')
      setPassword('password123')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand-header">
          <div className="auth-logo-badge">
            <HospitalCrossIcon size={24} color="#ffffff" />
          </div>
          <h1 className="auth-title">Aarogya Multi-Speciality Hospital</h1>
          <p className="auth-subtitle">Patient Management &amp; OPD Consultation Portal</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="role-tabs">
          <button
            type="button"
            className={`role-tab ${activeRoleTab === 'patient' ? 'active' : ''}`}
            onClick={() => handleQuickFill('patient')}
          >
            Patient
          </button>
          <button
            type="button"
            className={`role-tab ${activeRoleTab === 'doctor' ? 'active' : ''}`}
            onClick={() => handleQuickFill('doctor')}
          >
            Doctor
          </button>
          <button
            type="button"
            className={`role-tab ${activeRoleTab === 'admin' ? 'active' : ''}`}
            onClick={() => handleQuickFill('admin')}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="form-alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              required
              placeholder="e.g. rohan.sharma@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              required
              placeholder="Enter your account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary full-width">
            {loading ? 'Authenticating...' : `Sign In as ${activeRoleTab.toUpperCase()}`}
          </button>
        </form>

        <div className="auth-switch-prompt">
          <span>New patient seeking consultation? </span>
          <button type="button" onClick={onSwitchToRegister} className="btn-link">
            Register for OPD
          </button>
        </div>

        {/* Quick Demo Credentials for viva / evaluation */}
        <div className="demo-credentials-card">
          <div className="demo-card-title">Quick Demo Login (1-Click Fill)</div>
          <div className="demo-buttons-grid">
            <button
              type="button"
              className="demo-btn"
              onClick={() => handleQuickFill('patient')}
            >
              Fill Patient
            </button>
            <button
              type="button"
              className="demo-btn"
              onClick={() => handleQuickFill('doctor')}
            >
              Fill Doctor
            </button>
            <button
              type="button"
              className="demo-btn"
              onClick={() => handleQuickFill('admin')}
            >
              Fill Admin
            </button>
          </div>
          <small className="demo-note">Default password: password123</small>
        </div>
      </div>
    </div>
  )
}
