import React, { useState, useEffect } from 'react'
import { api, type Appointment } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'
import { AddVisitModal } from './AddVisitModal'
import { EmptyState } from '../../components/EmptyState'
import { ClockIcon, CalendarIcon } from '../../components/Icons'

interface DoctorAppointmentsProps {
  onNotify: (message: string) => void
}

export const DoctorAppointments: React.FC<DoctorAppointmentsProps> = ({ onNotify }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedFilter, setSelectedFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [selectedForVisit, setSelectedForVisit] = useState<Appointment | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAppointments()
  }, [])

  async function loadAppointments() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getAppointments()
      setAppointments(data)
    } catch (err: any) {
      setError(err.message || 'Could not load assigned appointments.')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatus(id: string, status: string) {
    setUpdatingId(id)
    try {
      await api.updateAppointmentStatus(id, status)
      onNotify(`Appointment marked as ${status}.`)
      await loadAppointments()
    } catch (err: any) {
      alert(err.message || 'Could not update status.')
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = appointments.filter((a) => {
    if (selectedFilter === 'ALL') return true
    return a.status === selectedFilter
  })

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Assigned Hospital Appointments</h1>
          <p className="page-subtitle">Complete roster of patient visits assigned to your clinical schedule</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="tab-filters-row">
        {['ALL', 'REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            type="button"
            className={`tab-filter-btn ${selectedFilter === st ? 'active' : ''}`}
            onClick={() => setSelectedFilter(st)}
          >
            {st === 'ALL' ? 'All Appointments' : st.charAt(0) + st.slice(1).toLowerCase()}
            <span className="tab-count-badge">
              {st === 'ALL'
                ? appointments.length
                : appointments.filter((a) => a.status === st).length}
            </span>
          </button>
        ))}
      </div>

      {error && <div className="form-alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">Loading appointments...</div>
      ) : filtered.length > 0 ? (
        <div className="table-responsive card-table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Appointment Date</th>
                <th>Time</th>
                <th>Patient Name</th>
                <th>Demographics</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div className="table-cell-bold">{app.appointmentDate}</div>
                  </td>
                  <td>
                    <div className="table-cell-bold" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <ClockIcon size={14} color="#64748b" />
                      {app.appointmentTime}
                    </div>
                  </td>
                  <td>
                    <div className="table-cell-bold">{app.patient}</div>
                    <div className="table-cell-sub">{app.patientPhone || app.patientEmail}</div>
                  </td>
                  <td>
                    {app.patientGender || 'N/A'} • Blood: {app.patientBloodGroup || 'N/A'}
                  </td>
                  <td>
                    <div className="table-cell-truncate" title={app.reason}>
                      {app.reason}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={app.status} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {app.status === 'REQUESTED' && (
                        <button
                          type="button"
                          disabled={updatingId === app.id}
                          onClick={() => handleStatus(app.id, 'CONFIRMED')}
                          className="btn-success-sm"
                        >
                          Confirm
                        </button>
                      )}
                      {app.status === 'CONFIRMED' && (
                        <button
                          type="button"
                          onClick={() => setSelectedForVisit(app)}
                          className="btn-primary-sm"
                        >
                          Complete Visit
                        </button>
                      )}
                      {app.status !== 'CANCELLED' && app.status !== 'COMPLETED' && (
                        <button
                          type="button"
                          disabled={updatingId === app.id}
                          onClick={() => handleStatus(app.id, 'CANCELLED')}
                          className="btn-danger-outline btn-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={<CalendarIcon size={38} color="#94a3b8" />}
          title="No Appointments Found"
          message={`There are no appointments with status "${selectedFilter}".`}
          actionLabel="View All"
          onAction={() => setSelectedFilter('ALL')}
        />
      )}

      {/* Add Visit Record Modal */}
      <AddVisitModal
        appointment={selectedForVisit}
        isOpen={Boolean(selectedForVisit)}
        onClose={() => setSelectedForVisit(null)}
        onSuccess={async (msg) => {
          onNotify(msg)
          await loadAppointments()
        }}
      />
    </div>
  )
}
