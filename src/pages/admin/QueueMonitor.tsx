import React, { useState, useEffect } from 'react'
import { api, type Doctor, type Appointment } from '../../services/api'
import { QueueIcon, RefreshIcon, StethoscopeIcon } from '../../components/Icons'

interface QueueMonitorProps {
  onNotify: (message: string) => void
}

export const QueueMonitor: React.FC<QueueMonitorProps> = ({ onNotify }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedDept, setSelectedDept] = useState<string>('ALL')
  const [error, setError] = useState('')

  const todayStr = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    loadHospitalQueues()
  }, [])

  async function loadHospitalQueues(isManual = false) {
    if (isManual) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const [docs, apps] = await Promise.all([
        api.getDoctors(),
        api.getAppointments({ date: todayStr }),
      ])
      setDoctors(docs)
      setTodayAppointments(apps)
      if (isManual) onNotify('Live hospital queues refreshed.')
    } catch (err: any) {
      setError(err.message || 'Could not load hospital queue monitoring data.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const departments = Array.from(new Set(doctors.map((d) => d.department).filter(Boolean)))

  const filteredDoctors = doctors.filter((doc) => {
    if (selectedDept === 'ALL') return true
    return doc.department === selectedDept
  })

  // Global OPD totals
  const totalCheckedIn = todayAppointments.filter((a) => a.checkInStatus === 'CHECKED_IN').length
  const totalWaiting = todayAppointments.filter((a) => a.status === 'WAITING').length
  const totalInConsultation = todayAppointments.filter((a) => a.status === 'IN_CONSULTATION').length
  const totalCompleted = todayAppointments.filter((a) => a.status === 'COMPLETED').length

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">OPD Queue Command Center</h1>
          <p className="page-subtitle">
            Live hospital-wide outpatient waiting rooms and consultation tracking across departments
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadHospitalQueues(true)}
          disabled={refreshing}
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshIcon size={15} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh All OPDs'}
        </button>
      </div>

      {error && <div className="form-alert-error">{error}</div>}

      {/* Hospital High-Level Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Today's Consultations
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{todayAppointments.length}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 600, textTransform: 'uppercase' }}>
            Checked In (OPD)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0284c7' }}>{totalCheckedIn}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: '#4338ca', fontWeight: 600, textTransform: 'uppercase' }}>
            Waiting in Lounges
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#4338ca' }}>{totalWaiting}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: '#7e22ce', fontWeight: 600, textTransform: 'uppercase' }}>
            In Active Consultation
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#7e22ce' }}>{totalInConsultation}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>
            Completed &amp; Prescribed
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#166534' }}>{totalCompleted}</div>
        </div>
      </div>

      {/* Department Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '6px' }}>
        <button
          type="button"
          className={`tab-filter-btn ${selectedDept === 'ALL' ? 'active' : ''}`}
          onClick={() => setSelectedDept('ALL')}
        >
          All Departments ({doctors.length} Doctors)
        </button>
        {departments.map((dept) => (
          <button
            key={dept}
            type="button"
            className={`tab-filter-btn ${selectedDept === dept ? 'active' : ''}`}
            onClick={() => setSelectedDept(dept)}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* OPD Doctor Queue Cards Grid */}
      {loading ? (
        <div className="loading-container">Connecting to hospital-wide OPD queues...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredDoctors.map((doc) => {
            const docApps = todayAppointments.filter((a) => a.doctorId === doc.id || a.doctor === doc.name)
            const activeConsultation = docApps.find((a) => a.status === 'IN_CONSULTATION')
            const waitingCount = docApps.filter((a) => a.status === 'WAITING').length
            const completedCount = docApps.filter((a) => a.status === 'COMPLETED').length

            return (
              <div
                key={doc.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem' }}>{doc.name}</div>
                      <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
                        {doc.department} • {doc.specialization}
                      </div>
                    </div>
                    <span
                      style={{
                        background: '#eff6ff',
                        color: '#1e40af',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                    >
                      Fee: ₹{doc.consultationFee}
                    </span>
                  </div>

                  {/* Active Consultation Callout */}
                  <div style={{ margin: '16px 0', padding: '12px', borderRadius: '8px', background: activeConsultation ? '#f0fdf4' : '#f8fafc', border: activeConsultation ? '1px solid #bbf7d0' : '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      Current Room Status
                    </div>
                    {activeConsultation ? (
                      <div style={{ marginTop: '4px' }}>
                        <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.94rem' }}>
                          ● In Consultation: Token {activeConsultation.queueToken}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#1e3a8a' }}>
                          Patient: {activeConsultation.patient}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.86rem', color: '#64748b', fontStyle: 'italic', marginTop: '4px' }}>
                        No active consultation in room
                      </div>
                    )}
                  </div>

                  {/* Doctor OPD Mini Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                    <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Scheduled</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{docApps.length}</div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.72rem', color: '#4338ca', fontWeight: 600 }}>Waiting</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4338ca' }}>{waitingCount}</div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 600 }}>Done</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#166534' }}>{completedCount}</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '0.78rem', color: '#94a3b8' }}>
                  OPD Counter: Room {doc.id.slice(-2)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
