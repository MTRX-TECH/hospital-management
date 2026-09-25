import React, { useState, useEffect } from 'react'
import { api, type Appointment, type DoctorQueueData } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'
import { AddVisitModal } from './AddVisitModal'
import { EmptyState } from '../../components/EmptyState'
import {
  ClockIcon,
  CheckIcon,
  StethoscopeIcon,
  BellIcon,
  PlayIcon,
  SkipForwardIcon,
  AlertCircleIcon,
  RefreshIcon,
} from '../../components/Icons'

interface TodayAppointmentsProps {
  onNotify: (message: string) => void
}

export const TodayAppointments: React.FC<TodayAppointmentsProps> = ({ onNotify }) => {
  const [queueData, setQueueData] = useState<DoctorQueueData | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedForVisit, setSelectedForVisit] = useState<Appointment | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const todayStr = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    loadQueueData()
  }, [])

  async function loadQueueData(isManual = false) {
    if (isManual) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      // Load both doctor queue operational view and appointments list
      const [qData, appList] = await Promise.all([
        api.getDoctorQueue({ date: todayStr }),
        api.getAppointments({ date: todayStr }),
      ])
      setQueueData(qData)
      setAppointments(appList)
    } catch (err: any) {
      setError(err.message || 'Could not load today OPD queue.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function handleCallPatient(appointmentId: string, token: string) {
    setActionLoadingId(appointmentId)
    try {
      await api.callPatientQueue(appointmentId)
      onNotify(`Called patient token ${token || 'appointment'} to consultation room.`)
      await loadQueueData(true)
    } catch (err: any) {
      alert(err.message || 'Could not call patient.')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleStartConsultation(appointmentId: string, patientName: string) {
    setActionLoadingId(appointmentId)
    try {
      await api.startConsultation(appointmentId)
      onNotify(`Consultation started with ${patientName}.`)
      await loadQueueData(true)
    } catch (err: any) {
      alert(err.message || 'Could not start consultation.')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleSkipPatient(appointmentId: string, token: string) {
    if (!window.confirm(`Temporarily hold/skip token ${token || 'patient'}?`)) return

    setActionLoadingId(appointmentId)
    try {
      await api.skipPatientQueue(appointmentId)
      onNotify(`Token ${token || 'patient'} held temporarily.`)
      await loadQueueData(true)
    } catch (err: any) {
      alert(err.message || 'Could not hold patient.')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleMarkNoShow(appointmentId: string, patientName: string) {
    const reason = window.prompt(
      `Mark ${patientName} as No-Show? (Grace period elapsed / Patient absent during queue calls)`,
      'Patient absent during OPD queue calls'
    )
    if (reason === null) return

    setActionLoadingId(appointmentId)
    try {
      await api.markNoShow(appointmentId, reason)
      onNotify(`${patientName} marked as No-Show. Alert notification sent.`)
      await loadQueueData(true)
    } catch (err: any) {
      alert(err.message || 'Could not mark as no-show.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const stats = queueData?.stats || {
    totalScheduled: appointments.length,
    checkedInCount: appointments.filter((a) => a.checkInStatus === 'CHECKED_IN').length,
    waitingCount: appointments.filter((a) => a.status === 'WAITING').length,
    inConsultationCount: appointments.filter((a) => a.status === 'IN_CONSULTATION').length,
    completedCount: appointments.filter((a) => a.status === 'COMPLETED').length,
    noShowCount: appointments.filter((a) => a.status === 'NO_SHOW').length,
  }

  const active = queueData?.activeConsultation

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">OPD Queue Operations Board</h1>
          <p className="page-subtitle">
            Live queue management, patient calls, and digital prescriptions for today ({todayStr})
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadQueueData(true)}
          disabled={refreshing}
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshIcon size={15} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Updating Queue...' : 'Refresh Board'}
        </button>
      </div>

      {error && <div className="form-alert-error">{error}</div>}

      {/* OPD Queue Stats Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Scheduled</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{stats.totalScheduled}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: '#0369a1', fontWeight: 600, textTransform: 'uppercase' }}>Checked In</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284c7' }}>{stats.checkedInCount}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: '#4338ca', fontWeight: 600, textTransform: 'uppercase' }}>Waiting</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4338ca' }}>{stats.waitingCount}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: '#7e22ce', fontWeight: 600, textTransform: 'uppercase' }}>In Consultation</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7e22ce' }}>{stats.inConsultationCount}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>Completed</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#166534' }}>{stats.completedCount}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: '#be123c', fontWeight: 600, textTransform: 'uppercase' }}>No Show</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#be123c' }}>{stats.noShowCount}</div>
        </div>
      </div>

      {/* Active Consultation Hero Card if active */}
      {active && (
        <div
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '24px',
            boxShadow: '0 4px 14px rgba(30, 58, 138, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <span
              style={{
                background: '#22c55e',
                color: '#ffffff',
                padding: '3px 10px',
                borderRadius: '14px',
                fontSize: '0.76rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Consultation in Progress
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '6px' }}>
              Token {active.queueToken}: {active.patientName}
            </div>
            <div style={{ fontSize: '0.88rem', color: '#bfdbfe', marginTop: '3px' }}>
              {active.patientGender} • Blood: {active.patientBloodGroup} • Phone: {active.patientPhone} • Slot: {active.appointmentTime}
            </div>
            {active.reason && (
              <div style={{ fontSize: '0.84rem', color: '#e0e7ff', marginTop: '6px', fontStyle: 'italic' }}>
                &ldquo;{active.reason}&rdquo;
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                const foundApp = appointments.find((a) => a.id === active.id)
                if (foundApp) setSelectedForVisit(foundApp)
              }}
              className="btn-primary"
              style={{ background: '#ffffff', color: '#1e3a8a', fontWeight: 700 }}
            >
              <StethoscopeIcon size={16} color="#1e3a8a" />
              Complete &amp; Issue Prescription
            </button>

            <button
              type="button"
              onClick={() => handleMarkNoShow(active.id, active.patientName)}
              className="btn-danger-outline"
              style={{ borderColor: '#ffffff', color: '#ffffff' }}
            >
              <AlertCircleIcon size={14} color="#ffffff" /> Mark No-Show
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-container">Loading OPD Queue...</div>
      ) : appointments.length > 0 ? (
        <div className="table-responsive card-table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Queue Token</th>
                <th>Slot Time</th>
                <th>Patient Details</th>
                <th>Pre-Consultation Intake</th>
                <th>Check-In &amp; Payment</th>
                <th>Queue Status</th>
                <th>Doctor Queue Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((app) => {
                const isWaiting = app.status === 'WAITING' || (app.checkInStatus === 'CHECKED_IN' && app.status === 'CONFIRMED')
                const isInConsultation = app.status === 'IN_CONSULTATION'
                const isCompleted = app.status === 'COMPLETED'
                const pre = app.preConsultation

                return (
                  <tr key={app.id} style={{ backgroundColor: isInConsultation ? '#f0fdf4' : undefined }}>
                    <td>
                      {app.queueToken ? (
                        <span
                          style={{
                            background: '#1e3a8a',
                            color: '#ffffff',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {app.queueToken}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Not Checked In</span>
                      )}
                    </td>
                    <td>
                      <div className="table-cell-bold" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <ClockIcon size={15} color="#0284c7" />
                        {app.appointmentTime}
                      </div>
                    </td>
                    <td>
                      <div className="table-cell-bold">{app.patient}</div>
                      <div className="table-cell-sub">
                        {app.patientGender || 'N/A'} • Blood: {app.patientBloodGroup || 'N/A'} • {app.patientPhone}
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '240px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#0f172a' }}>
                          {app.reason}
                        </div>
                        {pre && pre.symptoms && pre.symptoms.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                            {pre.symptoms.slice(0, 3).map((sym, i) => (
                              <span
                                key={i}
                                style={{
                                  background: '#e0e7ff',
                                  color: '#3730a3',
                                  padding: '1px 6px',
                                  borderRadius: '3px',
                                  fontSize: '0.72rem',
                                  fontWeight: 500,
                                }}
                              >
                                {sym}
                              </span>
                            ))}
                            {pre.symptoms.length > 3 && (
                              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                +{pre.symptoms.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem' }}>
                        <span style={{ color: app.checkInStatus === 'CHECKED_IN' ? '#16a34a' : '#d97706', fontWeight: 600 }}>
                          {app.checkInStatus === 'CHECKED_IN' ? '✓ Checked In' : 'Pending'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Advance: ₹{app.advancePaid ?? 200}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={app.status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {/* Call Patient Button */}
                        {isWaiting && (
                          <button
                            type="button"
                            disabled={actionLoadingId === app.id}
                            onClick={() => handleCallPatient(app.id, app.queueToken || '')}
                            className="btn-secondary"
                            style={{ fontSize: '0.76rem', padding: '4px 8px' }}
                            title="Call Patient into Room"
                          >
                            <BellIcon size={13} color="#1e40af" /> Call
                          </button>
                        )}

                        {/* Start Consultation Button */}
                        {isWaiting && (
                          <button
                            type="button"
                            disabled={actionLoadingId === app.id}
                            onClick={() => handleStartConsultation(app.id, app.patient)}
                            className="btn-primary"
                            style={{ fontSize: '0.76rem', padding: '4px 8px' }}
                            title="Start In-Person Consultation"
                          >
                            <PlayIcon size={13} /> Start
                          </button>
                        )}

                        {/* Complete & Issue Prescription */}
                        {(isInConsultation || isWaiting || app.status === 'CONFIRMED') && (
                          <button
                            type="button"
                            onClick={() => setSelectedForVisit(app)}
                            className="btn-primary"
                            style={{ fontSize: '0.76rem', padding: '4px 8px' }}
                          >
                            <StethoscopeIcon size={13} /> Complete &amp; Prescribe
                          </button>
                        )}

                        {/* Skip Button */}
                        {isWaiting && !app.isSkipped && (
                          <button
                            type="button"
                            disabled={actionLoadingId === app.id}
                            onClick={() => handleSkipPatient(app.id, app.queueToken || '')}
                            className="btn-secondary"
                            style={{ fontSize: '0.76rem', padding: '4px 6px' }}
                            title="Hold / Skip patient"
                          >
                            <SkipForwardIcon size={13} /> Skip
                          </button>
                        )}

                        {/* Mark No Show */}
                        {app.status !== 'COMPLETED' && app.status !== 'CANCELLED' && app.status !== 'NO_SHOW' && (
                          <button
                            type="button"
                            disabled={actionLoadingId === app.id}
                            onClick={() => handleMarkNoShow(app.id, app.patient)}
                            className="btn-danger-outline btn-sm"
                            style={{ fontSize: '0.72rem', padding: '3px 6px' }}
                            title="Mark No-Show if patient fails to appear"
                          >
                            No-Show
                          </button>
                        )}

                        {isCompleted && (
                          <span
                            style={{
                              fontSize: '0.8rem',
                              color: '#166534',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <CheckIcon size={14} color="#166534" /> Prescription Slip Issued
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={<StethoscopeIcon size={38} color="#94a3b8" />}
          title="No Appointments Scheduled for Today"
          message="You have no patient consultations scheduled for today. Check 'Assigned Appointments' to view upcoming dates."
        />
      )}

      {/* Complete Consultation & Add Digital Prescription Modal */}
      <AddVisitModal
        appointment={selectedForVisit}
        isOpen={Boolean(selectedForVisit)}
        onClose={() => setSelectedForVisit(null)}
        onSuccess={async (msg) => {
          onNotify(msg)
          await loadQueueData(true)
        }}
      />
    </div>
  )
}
