import React, { useState, useEffect } from 'react'
import { api, type Appointment, type QueueStatusData } from '../../services/api'
import { QueueIcon, RefreshIcon, StethoscopeIcon, ClockIcon, UserIcon, BellIcon } from '../../components/Icons'

interface LiveWaitingRoomProps {
  onNotify: (message: string) => void
  onNavigate: (tab: string) => void
}

export const LiveWaitingRoom: React.FC<LiveWaitingRoomProps> = ({ onNotify, onNavigate }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('')
  const [queueData, setQueueData] = useState<QueueStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadEligibleAppointments()
  }, [])

  // Periodic polling every 5 seconds when an appointment is selected
  useEffect(() => {
    if (!selectedAppointmentId) return

    fetchQueueStatus(selectedAppointmentId, false)
    const interval = setInterval(() => {
      fetchQueueStatus(selectedAppointmentId, false)
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedAppointmentId])

  async function loadEligibleAppointments() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getAppointments()
      // Filter for active appointments (WAITING, CONFIRMED, CHECKED_IN, IN_CONSULTATION, REQUESTED)
      const active = data.filter(
        (a) => a.status !== 'CANCELLED' && a.status !== 'NO_SHOW' && a.status !== 'COMPLETED'
      )
      setAppointments(active)

      if (active.length > 0) {
        // Prioritize checked-in or waiting appointment, else first
        const waitingOne = active.find((a) => a.status === 'WAITING' || a.status === 'IN_CONSULTATION' || a.checkInStatus === 'CHECKED_IN')
        const chosenId = waitingOne ? waitingOne.id : active[0].id
        setSelectedAppointmentId(chosenId)
      }
    } catch (err: any) {
      setError(err.message || 'Could not load your appointments.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchQueueStatus(id: string, isManual = true) {
    if (isManual) setRefreshing(true)
    try {
      const status = await api.getQueueStatus(id)
      setQueueData(status)
      if (status.isCurrentPatientCalled) {
        onNotify('Doctor is now calling your token! Please proceed inside the consultation room.')
      }
    } catch (err: any) {
      if (isManual) setError(err.message || 'Could not refresh queue status.')
    } finally {
      if (isManual) setRefreshing(false)
    }
  }

  async function handleSelfCheckIn() {
    if (!selectedAppointmentId) return
    try {
      const res = await api.checkInAppointment(selectedAppointmentId)
      onNotify(`Check-in successful! Your token is ${res.queueToken}.`)
      await fetchQueueStatus(selectedAppointmentId, true)
      await loadEligibleAppointments()
    } catch (err: any) {
      alert(err.message || 'Check-in failed.')
    }
  }

  const selectedApp = appointments.find((a) => a.id === selectedAppointmentId)

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Waiting Room</h1>
          <p className="page-subtitle">Real-time OPD queue tracker and live consultation status</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => selectedAppointmentId && fetchQueueStatus(selectedAppointmentId, true)}
            disabled={refreshing || !selectedAppointmentId}
            className="btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshIcon size={15} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Updating...' : 'Refresh Live Status'}
          </button>
          <button onClick={() => onNavigate('my-appointments')} className="btn-secondary">
            View All Appointments
          </button>
        </div>
      </div>

      {error && <div className="form-alert-error">{error}</div>}

      {/* Appointment Selector Dropdown if multiple active appointments */}
      {appointments.length > 1 && (
        <div
          style={{
            background: '#ffffff',
            padding: '16px 20px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.92rem' }}>
            Select Active Appointment:
          </span>
          <select
            value={selectedAppointmentId}
            onChange={(e) => setSelectedAppointmentId(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              fontWeight: 500,
              minWidth: '280px',
              backgroundColor: '#f8fafc',
            }}
          >
            {appointments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.doctor} ({a.department}) — {a.appointmentDate} at {a.appointmentTime} [{a.status}]
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="loading-container">Connecting to Live Hospital Queue System...</div>
      ) : appointments.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            padding: '40px 20px',
            textAlign: 'center',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
          }}
        >
          <QueueIcon size={44} color="#94a3b8" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', marginTop: '14px' }}>
            No Active Queue Appointments
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.92rem', maxWidth: '440px', margin: '8px auto 20px' }}>
            You do not have any appointments scheduled for queue admission today. Book an appointment or check your past visits.
          </p>
          <button onClick={() => onNavigate('find-doctors')} className="btn-primary">
            Book an Appointment
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
          {/* Main Queue Token Hero Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    background: '#e0e7ff',
                    color: '#3730a3',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Sequential OPD Token
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ClockIcon size={13} /> Auto-refreshes every 5s
                </span>
              </div>

              {/* Large Token Display */}
              <div style={{ textAlign: 'center', margin: '28px 0' }}>
                <div style={{ color: '#64748b', fontSize: '0.88rem', fontWeight: 600, textTransform: 'uppercase' }}>
                  Your Assigned Token
                </div>
                <div
                  style={{
                    fontSize: '3.6rem',
                    fontWeight: 800,
                    color: '#1e3a8a',
                    letterSpacing: '2px',
                    lineHeight: '1.1',
                    margin: '6px 0',
                  }}
                >
                  {queueData?.queueToken && queueData.queueToken !== 'NOT_ASSIGNED'
                    ? queueData.queueToken
                    : selectedApp?.queueToken || 'NOT ISSUED'}
                </div>

                {(!queueData?.queueToken || queueData?.queueToken === 'NOT_ASSIGNED') &&
                  selectedApp?.checkInStatus !== 'CHECKED_IN' && (
                    <div style={{ marginTop: '12px' }}>
                      <p style={{ fontSize: '0.86rem', color: '#dc2626', marginBottom: '10px' }}>
                        Please check in to generate your sequential OPD token.
                      </p>
                      <button onClick={handleSelfCheckIn} className="btn-primary" style={{ padding: '8px 20px' }}>
                        Check In &amp; Generate Token
                      </button>
                    </div>
                  )}

                {queueData?.isCurrentPatientCalled && (
                  <div
                    style={{
                      background: '#dcfce7',
                      color: '#166534',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '10px',
                      animation: 'pulse 1.5s infinite',
                    }}
                  >
                    <BellIcon size={18} color="#166534" />
                    DOCTOR IS CALLING YOU NOW — PROCEED TO ROOM!
                  </div>
                )}
              </div>

              {/* Queue Status Metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  padding: '16px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Now Serving
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>
                    {queueData?.currentToken || 'None'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Patients Ahead
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#2563eb' }}>
                    {queueData?.patientsAhead !== undefined ? queueData.patientsAhead : '—'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Estimated Wait
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#d97706' }}>
                    {queueData?.estimatedWaitMinutes !== undefined ? `~${queueData.estimatedWaitMinutes} mins` : '—'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                    Status
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#047857' }}>
                    {queueData?.status || selectedApp?.status || 'Active'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', fontSize: '0.8rem', color: '#94a3b8' }}>
              Last synchronized: {queueData?.lastUpdated ? new Date(queueData.lastUpdated).toLocaleTimeString() : 'Just now'}
            </div>
          </div>

          {/* Clinical & Specialist Overview Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
                Consultation Overview
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: '#dbeafe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <StethoscopeIcon size={22} color="#1d4ed8" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.02rem' }}>
                      {queueData?.doctorName || selectedApp?.doctor}
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
                      Department of {queueData?.department || selectedApp?.department}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Scheduled Slot</div>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>
                    {queueData?.appointmentDate || selectedApp?.appointmentDate} at{' '}
                    {queueData?.appointmentTime || selectedApp?.appointmentTime}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Chief Complaint / Reason</div>
                  <div style={{ color: '#334155', fontSize: '0.88rem', fontStyle: 'italic' }}>
                    &ldquo;{selectedApp?.reason}&rdquo;
                  </div>
                </div>

                {selectedApp?.preConsultation && selectedApp.preConsultation.symptoms && (
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>
                      Reported Symptoms
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedApp.preConsultation.symptoms.map((s, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: '#f1f5f9',
                            color: '#334155',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.78rem',
                            fontWeight: 500,
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Waiting Room Patient Guidelines */}
            <div
              style={{
                marginTop: '20px',
                padding: '14px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
              }}
            >
              <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.86rem', marginBottom: '6px' }}>
                Waiting Room Instructions
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#1e3a8a', lineHeight: '1.5' }}>
                <li>Keep this tab open for live auditory and visual queue token calls.</li>
                <li>Ensure you are in the OPD waiting lobby 10 minutes prior to call.</li>
                <li>Have your prescription slip and earlier medical records ready.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
