import React, { useState, useEffect } from 'react'
import { api, type Doctor, type DoctorSchedule } from '../../services/api'
import { Modal } from '../../components/Modal'
import { EmptyState } from '../../components/EmptyState'
import { PlusIcon, ClockIcon } from '../../components/Icons'

interface ManageSchedulesProps {
  onNotify: (message: string) => void
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const ManageSchedules: React.FC<ManageSchedulesProps> = ({ onNotify }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('')
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingSchedules, setLoadingSchedules] = useState(false)
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
    loadDoctors()
  }, [])

  useEffect(() => {
    if (selectedDoctorId) {
      loadDoctorSchedules(selectedDoctorId)
    } else {
      setSchedules([])
    }
  }, [selectedDoctorId])

  async function loadDoctors() {
    setLoading(true)
    setError('')
    try {
      const docs = await api.getDoctors()
      setDoctors(docs)
      if (docs.length > 0) {
        setSelectedDoctorId(docs[0].id)
      }
    } catch (err: any) {
      setError(err.message || 'Could not load doctors.')
    } finally {
      setLoading(false)
    }
  }

  async function loadDoctorSchedules(docId: string) {
    setLoadingSchedules(true)
    try {
      const data = await api.getDoctorSchedules(docId)
      setSchedules(data)
    } catch (err: any) {
      console.warn('Could not load schedules for doctor:', err)
    } finally {
      setLoadingSchedules(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDoctorId) return

    setSaving(true)
    setError('')
    try {
      await api.saveSchedule({
        doctorId: selectedDoctorId,
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
        slotDuration: Number(form.slotDuration),
        isAvailable: form.isAvailable,
      })
      onNotify('Doctor schedule updated.')
      setIsModalOpen(false)
      await loadDoctorSchedules(selectedDoctorId)
    } catch (err: any) {
      setError(err.message || 'Could not save schedule.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id?: string) {
    if (!id || !selectedDoctorId) return
    if (!window.confirm('Delete this schedule slot?')) return

    try {
      await api.deleteSchedule(id)
      onNotify('Schedule slot removed.')
      await loadDoctorSchedules(selectedDoctorId)
    } catch (err: any) {
      alert(err.message || 'Could not delete schedule entry.')
    }
  }

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId)

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Doctor Clinic Schedules</h1>
          <p className="page-subtitle">Configure physician weekly availability hours and appointment slot duration</p>
        </div>
        {selectedDoctorId && (
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            <PlusIcon size={16} /> Add Schedule Entry
          </button>
        )}
      </div>

      {/* Doctor Selector */}
      <div className="search-filter-card">
        <div className="filter-dropdown-wrapper full-width">
          <label htmlFor="select-doc-sched" className="filter-label" style={{ minWidth: '130px' }}>
            Select Doctor:
          </label>
          <select
            id="select-doc-sched"
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="filter-select"
            style={{ flex: 1 }}
          >
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name} — {doc.specialization} ({doc.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="form-alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">Loading doctors list...</div>
      ) : selectedDoctor ? (
        <div className="schedule-management-block">
          <div className="selected-doctor-info-bar">
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>{selectedDoctor.name}</h3>
              <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                {selectedDoctor.specialization} • Department of {selectedDoctor.department}
              </p>
            </div>
            <div className="fee-badge">
              OPD Fee: <strong>₹{Number(selectedDoctor.consultationFee).toFixed(0)}</strong>
            </div>
          </div>

          {loadingSchedules ? (
            <div className="loading-container">Loading doctor weekly schedules...</div>
          ) : schedules.length > 0 ? (
            <div className="table-responsive card-table-wrapper" style={{ marginTop: '16px' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Day of Week</th>
                    <th>Clinic Hours</th>
                    <th>Slot Duration</th>
                    <th>Availability</th>
                    <th>Actions</th>
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
                          Delete
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
              title="No Schedule Entries for this Doctor"
              message={`No consultation hours have been set up for ${selectedDoctor.name}.`}
              actionLabel="Add Consultation Hours"
              onAction={() => setIsModalOpen(true)}
            />
          )}
        </div>
      ) : null}

      {/* Add / Edit Schedule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Doctor Consultation Schedule"
        subtitle={selectedDoctor ? `Configuring hours for ${selectedDoctor.name}` : ''}
        maxWidth="500px"
      >
        <form onSubmit={handleSave} className="custom-form">
          <div className="form-group">
            <label htmlFor="ad-day">Day of the Week *</label>
            <select
              id="ad-day"
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
              <label htmlFor="ad-start">Start Time *</label>
              <input
                id="ad-start"
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="ad-end">End Time *</label>
              <input
                id="ad-end"
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
              <label htmlFor="ad-dur">Slot Duration (Minutes) *</label>
              <select
                id="ad-dur"
                value={form.slotDuration}
                onChange={(e) => setForm({ ...form, slotDuration: Number(e.target.value) })}
                className="form-input"
              >
                <option value={15}>15 Minutes</option>
                <option value={20}>20 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="ad-avail">Availability Status</label>
              <select
                id="ad-avail"
                value={form.isAvailable ? 'yes' : 'no'}
                onChange={(e) => setForm({ ...form, isAvailable: e.target.value === 'yes' })}
                className="form-input"
              >
                <option value="yes">Available</option>
                <option value="no">Unavailable</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Schedule Entry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
