import React, { useEffect, useState } from 'react'
import { api, type Doctor, type DoctorSchedule } from '../../services/api'
import { Modal } from '../../components/Modal'

interface DoctorProfileModalProps {
  doctorId: string | null
  isOpen: boolean
  onClose: () => void
  onBookClick: (doctor: Doctor) => void
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const DoctorProfileModal: React.FC<DoctorProfileModalProps> = ({
  doctorId,
  isOpen,
  onClose,
  onBookClick,
}) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (doctorId && isOpen) {
      loadDoctor(doctorId)
    }
  }, [doctorId, isOpen])

  async function loadDoctor(id: string) {
    setLoading(true)
    setError('')
    try {
      const data = await api.getDoctorById(id)
      setDoctor(data)
      setSchedules(data.schedules || [])
    } catch (err: any) {
      setError(err.message || 'Could not load doctor details.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !doctorId) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={doctor ? doctor.name : 'Doctor Profile'}
      subtitle={doctor ? `${doctor.specialization} • ${doctor.department}` : ''}
      maxWidth="620px"
    >
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
          Loading provider profile...
        </div>
      ) : error ? (
        <div className="form-alert-error">{error}</div>
      ) : doctor ? (
        <div className="doctor-profile-content">
          <div className="doctor-profile-header">
            <div className="doctor-profile-avatar">
              {doctor.name.replace('Dr. ', '').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{doctor.name}</h3>
              <p style={{ margin: '3px 0', color: '#0284c7', fontWeight: 600 }}>
                {doctor.specialization} ({doctor.qualification || 'Licensed Physician'})
              </p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.88rem' }}>
                Department: <strong>{doctor.department}</strong> • {doctor.experienceYears} Years Experience
              </p>
            </div>
          </div>

          <div className="profile-section">
            <h4 className="profile-section-title">Biography &amp; Clinical Focus</h4>
            <p className="profile-bio-text">{doctor.bio || 'Experienced healthcare specialist dedicated to patient wellness.'}</p>
          </div>

          <div className="profile-stats-row">
            <div className="profile-stat-box">
              <span className="stat-label">Consultation Fee</span>
              <span className="stat-value">₹{Number(doctor.consultationFee).toFixed(0)}</span>
            </div>
            <div className="profile-stat-box">
              <span className="stat-label">Experience</span>
              <span className="stat-value">{doctor.experienceYears} Years</span>
            </div>
            <div className="profile-stat-box">
              <span className="stat-label">Phone</span>
              <span className="stat-value">{doctor.phone || 'Clinic line'}</span>
            </div>
          </div>

          <div className="profile-section">
            <h4 className="profile-section-title">Weekly Clinic Hours</h4>
            {schedules.length > 0 ? (
              <div className="schedules-list">
                {schedules.map((s, index) => (
                  <div key={index} className="schedule-row-item">
                    <span className="schedule-day">{dayNames[s.dayOfWeek]}</span>
                    <span className="schedule-time">
                      {s.startTime} - {s.endTime}
                    </span>
                    <span className="schedule-duration">({s.slotDuration} min sessions)</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                No regular schedule posted. Consult clinic reception.
              </p>
            )}
          </div>

          <div className="modal-actions" style={{ marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose()
                onBookClick(doctor)
              }}
              className="btn-primary"
            >
              Book Appointment Now
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
