import React, { useState, useEffect } from 'react'
import { api, type ReportData } from '../../services/api'
import { StatCard } from '../../components/StatCard'
import {
  PlusIcon,
  ActivityIcon,
  StethoscopeIcon,
  UsersIcon,
  ClockIcon,
  HourglassIcon,
  FileTextIcon,
  CheckIcon,
  CheckCircleIcon,
  CrossIcon,
  BuildingIcon,
  CalendarIcon,
} from '../../components/Icons'

interface AdminDashboardProps {
  onNavigate: (tab: string) => void
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboardStats()
  }, [])

  async function loadDashboardStats() {
    setLoading(true)
    setError('')
    try {
      const reports = await api.getReports()
      setData(reports)
    } catch (err: any) {
      setError(err.message || 'Could not load administrative hospital metrics.')
    } finally {
      setLoading(false)
    }
  }

  const s = data?.summary

  return (
    <div className="page-content">
      <div className="welcome-banner admin-banner">
        <div>
          <span className="badge-welcome">ADMINISTRATIVE DIRECTORY</span>
          <h1 className="welcome-heading">Hospital Operations Dashboard</h1>
          <p className="welcome-sub">
            Real-time aggregate data connected directly to MongoDB. Manage doctors, departments, patient accounts, and clinic appointments.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => onNavigate('manage-doctors')} className="btn-primary-inverse" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <PlusIcon size={15} /> Add Doctor
          </button>
          <button onClick={() => onNavigate('reports')} className="btn-secondary-inverse" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ActivityIcon size={15} /> View Analytics
          </button>
        </div>
      </div>

      {error && <div className="form-alert-error">{error}</div>}

      {/* KPI Cards Grid - All from live database counts */}
      <div className="stat-cards-grid">
        <StatCard
          title="Total Doctors"
          value={s?.totalDoctors ?? (loading ? '...' : 0)}
          subtitle="Active medical staff"
          icon={<StethoscopeIcon size={22} color="#1e40af" />}
          color="blue"
        />
        <StatCard
          title="Total Registered Patients"
          value={s?.totalPatients ?? (loading ? '...' : 0)}
          subtitle="Hospital patient directory"
          icon={<UsersIcon size={22} color="#6b21a8" />}
          color="purple"
        />
        <StatCard
          title="Today's Appointments"
          value={s?.todayAppointments ?? (loading ? '...' : 0)}
          subtitle="Scheduled for current date"
          icon={<ClockIcon size={22} color="#15803d" />}
          color="green"
        />
        <StatCard
          title="Pending Requests"
          value={s?.pendingRequests ?? (loading ? '...' : 0)}
          subtitle="Awaiting confirmation"
          icon={<HourglassIcon size={22} color="#92400e" />}
          color="amber"
        />
      </div>

      <div className="stat-cards-grid" style={{ marginTop: '16px' }}>
        <StatCard
          title="Total Appointments"
          value={s?.totalAppointments ?? (loading ? '...' : 0)}
          subtitle="Cumulative hospital bookings"
          icon={<FileTextIcon size={22} color="#1e40af" />}
          color="blue"
        />
        <StatCard
          title="Confirmed Appointments"
          value={s?.confirmedAppointments ?? (loading ? '...' : 0)}
          subtitle="Active consultation sessions"
          icon={<CheckIcon size={20} color="#1e40af" />}
          color="blue"
        />
        <StatCard
          title="Completed Visits"
          value={s?.completedAppointments ?? (loading ? '...' : 0)}
          subtitle="Visit records documented"
          icon={<CheckCircleIcon size={22} color="#15803d" />}
          color="green"
        />
        <StatCard
          title="Cancelled Bookings"
          value={s?.cancelledAppointments ?? (loading ? '...' : 0)}
          subtitle="Slot freed or declined"
          icon={<CrossIcon size={20} color="#991b1b" />}
          color="red"
        />
      </div>

      {/* Quick Access Panels */}
      <div className="dashboard-grid-two" style={{ marginTop: '24px' }}>
        {/* Department Volume Overview */}
        <div className="dashboard-card">
          <div className="card-header-row">
            <div>
              <h2 className="card-title">Appointments by Department</h2>
              <p className="card-subtitle">Distribution across hospital specialty units</p>
            </div>
            <button onClick={() => onNavigate('manage-departments')} className="btn-link">
              Manage
            </button>
          </div>

          {loading ? (
            <div className="loading-state-text">Loading department distribution...</div>
          ) : data?.departments && data.departments.length > 0 ? (
            <div className="admin-dept-list">
              {data.departments.map((dept, idx) => (
                <div key={idx} className="admin-dept-row">
                  <div className="dept-row-info">
                    <span className="dept-name">{dept.department}</span>
                    <span className="dept-count">{dept.count} appointment(s)</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(100, Math.round((dept.count / Math.max(1, s?.totalAppointments || 1)) * 100))}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-text">No departmental appointments recorded yet.</div>
          )}
        </div>

        {/* Quick Operations Directory */}
        <div className="dashboard-card">
          <div className="card-header-row">
            <div>
              <h2 className="card-title">Administrative Operations</h2>
              <p className="card-subtitle">Quick shortcuts to hospital management modules</p>
            </div>
          </div>

          <div className="admin-quick-links-grid">
            <button
              type="button"
              onClick={() => onNavigate('manage-doctors')}
              className="admin-action-tile"
            >
              <span className="action-tile-icon">
                <StethoscopeIcon size={24} color="#0284c7" />
              </span>
              <div className="action-tile-title">Manage Doctors</div>
              <div className="action-tile-desc">Add providers, edit profiles and fees</div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('manage-departments')}
              className="admin-action-tile"
            >
              <span className="action-tile-icon">
                <BuildingIcon size={24} color="#0284c7" />
              </span>
              <div className="action-tile-title">Manage Departments</div>
              <div className="action-tile-desc">Configure hospital clinical units</div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('manage-schedules')}
              className="admin-action-tile"
            >
              <span className="action-tile-icon">
                <ClockIcon size={24} color="#0284c7" />
              </span>
              <div className="action-tile-title">Doctor Schedules</div>
              <div className="action-tile-desc">Weekly hours and slot durations</div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('manage-patients')}
              className="admin-action-tile"
            >
              <span className="action-tile-icon">
                <UsersIcon size={24} color="#0284c7" />
              </span>
              <div className="action-tile-title">Patient Directory</div>
              <div className="action-tile-desc">View demographics &amp; visit histories</div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('manage-appointments')}
              className="admin-action-tile"
            >
              <span className="action-tile-icon">
                <CalendarIcon size={24} color="#0284c7" />
              </span>
              <div className="action-tile-title">All Appointments</div>
              <div className="action-tile-desc">Hospital-wide schedule and status</div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="admin-action-tile"
            >
              <span className="action-tile-icon">
                <ActivityIcon size={24} color="#0284c7" />
              </span>
              <div className="action-tile-title">Reports &amp; Analytics</div>
              <div className="action-tile-desc">MongoDB aggregation charts &amp; stats</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
