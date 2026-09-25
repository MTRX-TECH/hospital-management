import React, { useState, useEffect } from 'react'
import { api, type Appointment } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'
import { EmptyState } from '../../components/EmptyState'
import { SearchIcon, ClockIcon, CalendarIcon } from '../../components/Icons'

interface ManageAppointmentsProps {
  onNotify: (message: string) => void
}

export const ManageAppointments: React.FC<ManageAppointmentsProps> = ({ onNotify }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedFilter, setSelectedFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
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
      setError(err.message || 'Could not load hospital appointments.')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    setUpdatingId(id)
    try {
      await api.updateAppointmentStatus(id, newStatus)
      onNotify(`Appointment marked as ${newStatus}.`)
      await loadAppointments()
    } catch (err: any) {
      alert(err.message || 'Failed to update appointment status.')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredAppointments = appointments
    .filter((a) => (selectedFilter === 'ALL' ? true : a.status === selectedFilter))
    .filter((a) =>
      `${a.patient} ${a.doctor} ${a.department} ${a.reason}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Hospital Appointments</h1>
          <p className="page-subtitle">Centralized hospital-wide appointment ledger, status modifications, and cancellations</p>
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
            {st === 'ALL' ? 'All Bookings' : st.charAt(0) + st.slice(1).toLowerCase()}
            <span className="tab-count-badge">
              {st === 'ALL'
                ? appointments.length
                : appointments.filter((a) => a.status === st).length}
            </span>
          </button>
        ))}
      </div>

      <div className="search-filter-card">
        <div className="search-input-wrapper full-width">
          <span className="search-icon">
            <SearchIcon size={16} color="#64748b" />
          </span>
          <input
            type="text"
            placeholder="Search by patient name, doctor, department, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {error && <div className="form-alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">Loading hospital appointments...</div>
      ) : filteredAppointments.length > 0 ? (
        <div className="table-responsive card-table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID &amp; Date</th>
                <th>Time</th>
                <th>Patient Details</th>
                <th>Doctor &amp; Department</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Status Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((app) => (
                <tr key={app.id}>
                  <td>
                    <span className="mono-code">#{app.id.slice(-6).toUpperCase()}</span>
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
                    <small style={{ color: '#64748b' }}>{app.patientPhone || app.patientEmail}</small>
                  </td>
                  <td>
                    <div className="table-cell-bold">{app.doctor}</div>
                    <span className="table-cell-tag">{app.department}</span>
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
                    <select
                      value={app.status}
                      disabled={updatingId === app.id}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      className="status-select-inline"
                    >
                      <option value="REQUESTED">REQUESTED</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
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
          message="No appointments match your search or selected filter status."
        />
      )}
    </div>
  )
}
