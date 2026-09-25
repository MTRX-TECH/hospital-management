import React, { useState, useEffect } from 'react'
import { api, type DoctorSchedule } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Modal } from '../../components/Modal'
import { EmptyState } from '../../components/EmptyState'
import { PlusIcon, ClockIcon } from '../../components/Icons'

interface DoctorScheduleProps {
  onNotify: (message: string) => void
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const DoctorSchedulePage: React.FC<DoctorScheduleProps> = ({ onNotify }) => {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '13:00',
    slotDuration: 30,
    isAvailable: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.profileId) {
      loadSchedules(user.profileId)
    }
  }, [user])

  async function loadSchedules(docId: string) {
    setLoading(true)
    setError('')
    try {
      const data = await api.getDoctorSchedules(docId)
      setSchedules(data)
    } catch (err: any) {
      setError(err.message || 'Could not load your schedules.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.profileId) return

    setSaving(true)
    setError('')
    try {
      await api.saveSchedule({
        doctorId: user.profileId,
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
        slotDuration: Number(form.slotDuration),
        isAvailable: form.isAvailable,
      })
      onNotify('Clinic schedule updated successfully.')
      setIsModalOpen(false)
      await loadSchedules(user.profileId)
    } catch (err: any) {
      setError(err.message || 'Could not save schedule.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id?: string) {
    if (!id || !user?.profileId) return
    if (!window.confirm('Are you sure you want to remove this schedule slot?')) return

    try {
      await api.deleteSchedule(id)
      onNotify('Schedule slot removed.')
      await loadSchedules(user.profileId)
    } catch (err: any) {
      alert(err.message || 'Could not delete schedule entry.')
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Consultation Hours &amp; Schedules</h1>
          <p className="page-subtitle">
            Configure your active weekly clinic hours. The booking engine automatically creates appointment slots based on these hours.
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <PlusIcon size={16} /> Add Clinic Hours
        </button>
      </div>

      {error && <div className="form-alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">Loading your schedules...</div>
      ) : schedules.length > 0 ? (
        <div className="table-responsive card-table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Day of Week</th>
                <th>Clinic Hours</th>
                <th>Slot Duration</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s._id}>
                  <td>
                    <div className="table-cell-bold">{dayNames[s.dayOfWeek]}</div>
                  </td>
                  <td>
                    <span className="time-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <ClockIcon size={13} color="#64748b" /> {s.startTime} – {s.endTime}
                    </span>
                  </td>
                  <td>{s.slotDuration} minutes</td>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        backgroundColor: s.isAvailable ? '#dcfce7' : '#fee2e2',
                        color: s.isAvailable ? '#166534' : '#991b1b',
                      }}
                    >
                      {s.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleDelete(s._id)}
                      className="btn-danger-outline btn-sm"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={<ClockIcon size={38} color="#94a3b8" />}
          title="No Consultation Schedules Configured"
          message="You haven't set up any weekly clinic hours. Add your consultation hours so patients can book appointments with you."
          actionLabel="Add Consultation Hours"
          onAction={() => setIsModalOpen(true)}
        />
      )}

      {/* Add / Edit Schedule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Configure Consultation Hours"
        subtitle="Set hours for a specific day of the week"
        maxWidth="500px"
      >
        <form onSubmit={handleSave} className="custom-form">
          <div className="form-group">
            <label htmlFor="sch-day">Day of the Week *</label>
            <select
              id="sch-day"
              value={form.dayOfWeek}
              onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
              className="form-input"
            >
              {dayNames.map((name, idx) => (
                <option key={idx} value={idx}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sch-start">Start Time *</label>
              <input
                id="sch-start"
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="sch-end">End Time *</label>
              <input
                id="sch-end"
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sch-dur">Slot Duration (Minutes) *</label>
              <select
                id="sch-dur"
                value={form.slotDuration}
                onChange={(e) => setForm({ ...form, slotDuration: Number(e.target.value) })}
                className="form-input"
              >
                <option value={15}>15 Minutes</option>
                <option value={20}>20 Minutes</option>
                <option value={30}>30 Minutes (Recommended)</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="sch-avail">Availability</label>
              <select
                id="sch-avail"
                value={form.isAvailable ? 'yes' : 'no'}
                onChange={(e) => setForm({ ...form, isAvailable: e.target.value === 'yes' })}
                className="form-input"
              >
                <option value="yes">Available for booking</option>
                <option value="no">Unavailable</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
