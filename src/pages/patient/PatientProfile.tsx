import React, { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

interface PatientProfileProps {
  onNotify: (message: string) => void
}

export const PatientProfile: React.FC<PatientProfileProps> = ({ onNotify }) => {
  const { user, refreshUser } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    address: '',
    emergencyContact: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getMe()
      if (data.user) {
        setForm({
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          dateOfBirth: data.profile?.dateOfBirth || '',
          gender: data.profile?.gender || 'Other',
          bloodGroup: data.profile?.bloodGroup || 'O+',
          address: data.profile?.address || '',
          emergencyContact: data.profile?.emergencyContact || '',
        })
      }
    } catch (err: any) {
      setError(err.message || 'Could not load your profile details.')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.updateProfile({
        name: form.name,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        address: form.address,
        emergencyContact: form.emergencyContact,
      })
      await refreshUser()
      onNotify('Your profile information has been updated successfully.')
    } catch (err: any) {
      setError(err.message || 'Could not update your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Healthcare Profile</h1>
          <p className="page-subtitle">Manage personal contact details and medical demographic information</p>
        </div>
      </div>

      <div className="profile-layout-grid">
        <div className="profile-sidebar-card">
          <div className="profile-large-avatar">
            {form.name
              ? form.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : 'P'}
          </div>
          <h2 className="profile-card-name">{form.name || user?.name}</h2>
          <p className="profile-card-email">{form.email || user?.email}</p>
          <span className="profile-role-tag">PATIENT ACCOUNT</span>

          <div className="profile-mini-specs">
            <div className="spec-row">
              <span className="spec-label">Blood Group:</span>
              <span className="spec-val">{form.bloodGroup || 'Not specified'}</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Gender:</span>
              <span className="spec-val">{form.gender || 'Not specified'}</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Phone:</span>
              <span className="spec-val">{form.phone || 'Not provided'}</span>
            </div>
          </div>
        </div>

        <div className="profile-form-card">
          {error && <div className="form-alert-error">{error}</div>}

          {loading ? (
            <div className="loading-state-text">Loading profile information...</div>
          ) : (
            <form onSubmit={handleSubmit} className="custom-form">
              <h3 className="form-section-title">Personal &amp; Contact Details</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="p-name">Full Name *</label>
                  <input
                    id="p-name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="p-email">Email Address (Read-only)</label>
                  <input
                    id="p-email"
                    name="email"
                    type="email"
                    disabled
                    value={form.email}
                    className="form-input disabled"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="p-phone">Contact Phone *</label>
                  <input
                    id="p-phone"
                    name="phone"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="p-dob">Date of Birth</label>
                  <input
                    id="p-dob"
                    name="dateOfBirth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>

              <h3 className="form-section-title" style={{ marginTop: '24px' }}>
                Medical Demographics &amp; Emergency
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="p-gender">Gender</label>
                  <select
                    id="p-gender"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="p-blood">Blood Group</label>
                  <select
                    id="p-blood"
                    name="bloodGroup"
                    value={form.bloodGroup}
                    onChange={handleChange}
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
                <label htmlFor="p-address">Residential Address</label>
                <input
                  id="p-address"
                  name="address"
                  type="text"
                  placeholder="Street address, city, state"
                  value={form.address}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="p-emergency">Emergency Contact Person &amp; Phone</label>
                <input
                  id="p-emergency"
                  name="emergencyContact"
                  type="text"
                  placeholder="e.g. David Bennett - (555) 0299"
                  value={form.emergencyContact}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-submit-row">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving Profile...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
