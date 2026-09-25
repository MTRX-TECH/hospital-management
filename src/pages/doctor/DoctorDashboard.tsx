import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api, type Appointment } from '../../services/api'
import { StatCard } from '../../components/StatCard'
import { StatusBadge } from '../../components/StatusBadge'
import { AddVisitModal } from './AddVisitModal'
import { EmptyState } from '../../components/EmptyState'
import {
  StethoscopeIcon,
  HourglassIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
} from '../../components/Icons'

interface DoctorDashboardProps {
  onNavigate: (tab: string) => void
  onNotify: (message: string) => void
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onNavigate, onNotify }) => {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedForVisit, setSelectedForVisit] = useState<Appointment | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const todayStr = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    loadDoctorAppointments()
  }, [])

  async function loadDoctorAppointments() {
    setLoading(true)
    try {
      const data = await api.getAppointments()
      setAppointments(data)
    } catch (err: any) {
      console.warn('Doctor appointments load error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    setUpdatingId(id)
    try {
      await api.updateAppointmentStatus(id, newStatus)
      onNotify(`Appointment marked as ${newStatus}.`)
      await loadDoctorAppointments()
    } catch (err: any) {
      alert(err.message || 'Status update failed.')
    } finally {
      setUpdatingId(null)
    }
  }

  const todayAppointments = appointments.filter((a) => a.appointmentDate === todayStr)
  const pendingRequests = appointments.filter((a) => a.status === 'REQUESTED')
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length
  const upcomingCount = appointments.filter(
    (a) => a.status === 'CONFIRMED' && a.appointmentDate >= todayStr
  ).length

  return (
    <div className="page-content">
      {/* Welcome Banner */}
      <div className="welcome-banner doctor-banner">
        <div>
          <span className="badge-welcome">PHYSICIAN CLINICAL PORTAL</span>
          <h1 className="welcome-heading">Welcome, {user?.name || 'Doctor'}</h1>
          <p className="welcome-sub">
            Manage your consultation schedule, review patient history, and document care visits.
          </p>
        </div>
        <button onClick={() => onNavigate('today-appointments')} className="btn-primary-inverse">
          <StethoscopeIcon size={16} color="#0284c7" />
          <span>View Today's Clinic Queue</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="stat-cards-grid">
        <StatCard
          title="Today's Appointments"
          value={todayAppointments.length}
          subtitle={`For date ${todayStr}`}
          icon={<StethoscopeIcon size={22} color="#1e40af" />}
          color="blue"
        />
        <StatCard
          title="Pending Requests"
          value={pendingRequests.length}
          subtitle="Awaiting physician confirmation"
          icon={<HourglassIcon size={22} color="#92400e" />}
          color="amber"
        />
        <StatCard
          title="Upcoming Confirmed"
          value={upcomingCount}
          subtitle="Scheduled sessions"
          icon={<CalendarIcon size={22} color="#6b21a8" />}
          color="purple"
        />
        <StatCard
          title="Completed Visits"
          value={completedCount}
          subtitle="Care notes documented"
          icon={<CheckCircleIcon size={22} color="#166534" />}
          color="green"
        />
      </div>

      {/* Main Grid: Pending Approvals & Today's Schedule */}
      <div className="dashboard-grid-two">
        {/* Pending Requests Queue */}
        <div className="dashboard-card">
          <div className="card-header-row">
            <div>
              <h2 className="card-title">Pending Patient Requests</h2>
              <p className="card-subtitle">Patients requesting consultations with you</p>
            </div>
            <span className="badge-counter">{pendingRequests.length}</span>
          </div>

          {loading ? (
            <div className="loading-state-text">Loading requests...</div>
          ) : pendingRequests.length > 0 ? (
            <div className="requests-queue-list">
              {pendingRequests.slice(0, 4).map((app) => (
                <div key={app.id} className="request-card-item">
                  <div className="req-header">
                    <div>
                      <strong className="req-patient-name">{app.patient}</strong>
                      <span className="req-time-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CalendarIcon size={13} color="#64748b" /> {app.appointmentDate} at {app.appointmentTime}
                      </span>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>

                  <p className="req-reason-text">
                    <strong>Complaint:</strong> {app.reason}
                  </p>

                  <div className="req-actions">
                    <button
                      type="button"
                      disabled={updatingId === app.id}
                      onClick={() => handleStatusChange(app.id, 'CONFIRMED')}
                      className="btn-success-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      <CheckIcon size={14} color="currentColor" /> Confirm Appointment
                    </button>
                    <button
                      type="button"
                      disabled={updatingId === app.id}
                      onClick={() => handleStatusChange(app.id, 'CANCELLED')}
                      className="btn-danger-outline btn-sm"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CheckCircleIcon size={38} color="#10b981" />}
              title="All Caught Up"
              message="You have no pending appointment requests awaiting confirmation."
            />
          )}
        </div>

        {/* Today's Appointments Mini Queue */}
        <div className="dashboard-card">
          <div className="card-header-row">
            <div>
              <h2 className="card-title">Today's Clinic Queue</h2>
              <p className="card-subtitle">Consultations scheduled for today</p>
            </div>
            <button onClick={() => onNavigate('today-appointments')} className="btn-link">
              Open Queue
            </button>
          </div>

          {loading ? (
            <div className="loading-state-text">Loading today's queue...</div>
          ) : todayAppointments.length > 0 ? (
            <div className="today-queue-list">
              {todayAppointments.map((app) => (
                <div key={app.id} className="today-queue-item">
                  <div className="time-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <ClockIcon size={13} color="#64748b" /> {app.appointmentTime}
                  </div>
                  <div className="queue-patient-details">
                    <strong>{app.patient}</strong>
                    <small>{app.reason}</small>
                  </div>
                  <div className="queue-actions">
                    <StatusBadge status={app.status} />
                    {app.status === 'CONFIRMED' && (
                      <button
                        type="button"
                        onClick={() => setSelectedForVisit(app)}
                        className="btn-primary-sm"
                        style={{ marginLeft: '8px' }}
                      >
                        Complete Visit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<StethoscopeIcon size={38} color="#94a3b8" />}
              title="No Appointments Today"
              message="You do not have any patient consultations booked for today."
            />
          )}
        </div>
      </div>

      {/* Modal for Visit Record Creation */}
      <AddVisitModal
        appointment={selectedForVisit}
        isOpen={Boolean(selectedForVisit)}
        onClose={() => setSelectedForVisit(null)}
        onSuccess={async (msg) => {
          onNotify(msg)
          await loadDoctorAppointments()
        }}
      />
    </div>
  )
}
