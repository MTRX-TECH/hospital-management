import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api, type Appointment, type VisitRecord, type NotificationItem } from '../../services/api'
import { StatCard } from '../../components/StatCard'
import { StatusBadge } from '../../components/StatusBadge'
import { EmptyState } from '../../components/EmptyState'
import { PlusIcon, CalendarIcon, StethoscopeIcon, FileTextIcon, BellIcon, ClockIcon } from '../../components/Icons'

interface PatientDashboardProps {
  onNavigate: (tab: string) => void
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [visits, setVisits] = useState<VisitRecord[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    setLoading(true)
    try {
      const [appData, visitData, notifData] = await Promise.all([
        api.getAppointments(),
        api.getVisits(),
        api.getNotifications(),
      ])
      setAppointments(appData)
      setVisits(visitData)
      setNotifications(notifData.notifications || [])
    } catch (err: any) {
      console.warn('Dashboard data load error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Active appointments are REQUESTED or CONFIRMED
  const activeAppointments = appointments.filter(
    (a) => a.status === 'REQUESTED' || a.status === 'CONFIRMED'
  )

  // Upcoming appointment: the earliest active one
  const nextAppointment = activeAppointments.length > 0 ? activeAppointments[0] : null
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length
  const unreadNotifs = notifications.filter((n) => !n.isRead).length

  return (
    <div className="page-content">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div>
          <span className="badge-welcome">PATIENT CARE PORTAL</span>
          <h1 className="welcome-heading">Welcome back, {user?.name?.split(' ')[0] || 'Patient'}</h1>
          <p className="welcome-sub">
            Review your care timeline, book specialist appointments, and view clinical visit notes.
          </p>
        </div>
        <button onClick={() => onNavigate('book-appointment')} className="btn-primary-inverse">
          <PlusIcon size={16} /> Book New Appointment
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="stat-cards-grid">
        <StatCard
          title="Active Appointments"
          value={activeAppointments.length}
          subtitle="Scheduled &amp; pending"
          icon={<CalendarIcon size={22} color="#1e40af" />}
          color="blue"
        />
        <StatCard
          title="Completed Visits"
          value={completedCount}
          subtitle="Care notes on file"
          icon={<StethoscopeIcon size={22} color="#166534" />}
          color="green"
        />
        <StatCard
          title="Recent Care Records"
          value={visits.length}
          subtitle="Diagnoses &amp; prescriptions"
          icon={<FileTextIcon size={22} color="#6b21a8" />}
          color="purple"
        />
        <StatCard
          title="Unread Notices"
          value={unreadNotifs}
          subtitle="Appointment updates"
          icon={<BellIcon size={22} color="#92400e" />}
          color="amber"
        />
      </div>

      {/* Next Upcoming Appointment Highlight */}
      <div className="dashboard-grid-two">
        <div className="dashboard-card">
          <div className="card-header-row">
            <div>
              <h2 className="card-title">Next Scheduled Appointment</h2>
              <p className="card-subtitle">Your immediate upcoming hospital visit</p>
            </div>
            {nextAppointment && <StatusBadge status={nextAppointment.status} />}
          </div>

          {loading ? (
            <div className="loading-state-text">Loading appointment schedule...</div>
          ) : nextAppointment ? (
            <div className="next-appointment-box">
              <div className="appt-date-block">
                <span className="appt-date-month">
                  {new Date(`${nextAppointment.appointmentDate}T12:00:00`).toLocaleString('en-US', {
                    month: 'short',
                  })}
                </span>
                <span className="appt-date-day">
                  {nextAppointment.appointmentDate.slice(8, 10)}
                </span>
                <span className="appt-date-year">{nextAppointment.appointmentDate.slice(0, 4)}</span>
              </div>

              <div className="appt-details-block">
                <div className="appt-time-row">
                  <span className="time-badge">
                    <ClockIcon size={13} style={{ marginRight: '4px', verticalAlign: 'middle', display: 'inline' }} />
                    {nextAppointment.appointmentTime}
                  </span>
                  <span className="dept-tag">{nextAppointment.department}</span>
                </div>
                <h3 className="appt-doctor-name">{nextAppointment.doctor}</h3>
                <p className="appt-specialty">{nextAppointment.specialization}</p>
                <div className="appt-reason-box">
                  <strong>Reason:</strong> {nextAppointment.reason}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<CalendarIcon size={36} color="#94a3b8" />}
              title="No Upcoming Appointments"
              message="You currently do not have any scheduled or pending doctor visits."
              actionLabel="Find a Doctor"
              onAction={() => onNavigate('find-doctors')}
            />
          )}
        </div>

        {/* Quick Actions & Recent Notifications */}
        <div className="dashboard-card">
          <div className="card-header-row">
            <div>
              <h2 className="card-title">Recent In-App Notifications</h2>
              <p className="card-subtitle">Real-time status updates from our clinic</p>
            </div>
            <button onClick={() => onNavigate('notifications')} className="btn-link">
              View All
            </button>
          </div>

          {loading ? (
            <div className="loading-state-text">Loading notifications...</div>
          ) : notifications.length > 0 ? (
            <div className="recent-notifs-list">
              {notifications.slice(0, 3).map((n) => (
                <div key={n.id} className={`notif-item-mini ${!n.isRead ? 'unread' : ''}`}>
                  <span className="notif-dot"></span>
                  <div className="notif-mini-content">
                    <div className="notif-mini-title">{n.title}</div>
                    <div className="notif-mini-message">{n.message}</div>
                    <small className="notif-mini-time">
                      {new Date(n.createdAt).toLocaleDateString()} at{' '}
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<BellIcon size={36} color="#94a3b8" />}
              title="No Notifications"
              message="You have no notifications at this time."
            />
          )}
        </div>
      </div>

      {/* Recent Appointments Table */}
      <div className="dashboard-card full-width" style={{ marginTop: '24px' }}>
        <div className="card-header-row">
          <div>
            <h2 className="card-title">Recent Appointment History</h2>
            <p className="card-subtitle">Your recent requests, confirmed sessions, and completed visits</p>
          </div>
          <button onClick={() => onNavigate('my-appointments')} className="btn-link">
            See All Appointments
          </button>
        </div>

        {loading ? (
          <div className="loading-state-text">Loading appointment history...</div>
        ) : appointments.length > 0 ? (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Reason</th>
                  <th>Fee</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.slice(0, 5).map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div className="table-cell-bold">{app.appointmentDate}</div>
                      <div className="table-cell-sub">at {app.appointmentTime}</div>
                    </td>
                    <td>
                      <div className="table-cell-bold">{app.doctor}</div>
                      <div className="table-cell-sub">{app.specialization}</div>
                    </td>
                    <td>
                      <span className="table-cell-tag">{app.department}</span>
                    </td>
                    <td>
                      <div className="table-cell-truncate">{app.reason}</div>
                    </td>
                    <td>₹{Number(app.consultationFee).toFixed(0)}</td>
                    <td>
                      <StatusBadge status={app.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<FileTextIcon size={36} color="#94a3b8" />}
            title="No Appointments Found"
            message="You haven't requested any doctor appointments yet."
            actionLabel="Schedule Your First Appointment"
            onAction={() => onNavigate('find-doctors')}
          />
        )}
      </div>
    </div>
  )
}
