import React, { useState, useEffect } from 'react'
import { api, type Appointment, type PrescriptionSlipData } from '../../services/api'
import { downloadPrescriptionImage } from '../../utils/prescriptionGenerator'
import { PrescriptionIcon, DownloadIcon, CalendarIcon, StethoscopeIcon } from '../../components/Icons'
import { EmptyState } from '../../components/EmptyState'

interface PatientPrescriptionsProps {
  onNotify: (message: string) => void
  onNavigate: (tab: string) => void
}

export const PatientPrescriptions: React.FC<PatientPrescriptionsProps> = ({ onNotify, onNavigate }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPrescriptions()
  }, [])

  async function loadPrescriptions() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getAppointments()
      // Filter appointments that have prescriptions or are completed
      const withPrescriptions = data.filter(
        (a) =>
          (a.prescription && a.prescription.medicines && a.prescription.medicines.length > 0) ||
          a.status === 'COMPLETED'
      )
      setAppointments(withPrescriptions)
    } catch (err: any) {
      setError(err.message || 'Could not load your digital prescriptions.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownload(appointmentId: string) {
    setDownloadingId(appointmentId)
    try {
      const rxData = await api.getPrescription(appointmentId)
      await downloadPrescriptionImage(rxData)
      onNotify('Digital prescription slip downloaded successfully.')
    } catch (err: any) {
      alert(err.message || 'Could not generate prescription slip.')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Digital Prescriptions</h1>
          <p className="page-subtitle">Access, review, and download your official doctor prescription slips</p>
        </div>
      </div>

      {error && <div className="form-alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">Loading your digital prescriptions...</div>
      ) : appointments.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {appointments.map((app) => {
            const rx = app.prescription
            const medicines = rx?.medicines || []

            return (
              <div
                key={app.id}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '8px',
                          background: '#eff6ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <PrescriptionIcon size={20} color="#2563eb" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{app.doctor}</div>
                        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                          {app.department} • {app.specialization}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                    >
                      {app.appointmentDate}
                    </span>
                  </div>

                  {/* Medicines List Preview */}
                  <div style={{ margin: '18px 0', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: '#64748b',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        marginBottom: '8px',
                      }}
                    >
                      Prescribed Medications ({medicines.length})
                    </div>
                    {medicines.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {medicines.map((m, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: '#f8fafc',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              fontSize: '0.86rem',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                              {m.name}{' '}
                              <span style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.84rem' }}>
                                ({m.dosage || '1 Tablet'})
                              </span>
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#047857', fontWeight: 600, marginTop: '3px' }}>
                              Take: {m.numberOfTimes ? `${m.numberOfTimes} (${m.timing || ''})` : m.frequency}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                              Duration: {m.duration} {m.instructions ? `• Note: ${m.instructions}` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.86rem', color: '#64748b', fontStyle: 'italic' }}>
                        Clinical consultation completed with doctor advice.
                      </div>
                    )}

                    {rx?.doctorAdvice && (
                      <div style={{ marginTop: '12px', fontSize: '0.84rem', color: '#334155' }}>
                        <span style={{ fontWeight: 600 }}>Doctor Advice:</span> {rx.doctorAdvice}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Token: {app.queueToken || 'OPD'}</span>
                  <button
                    type="button"
                    onClick={() => handleDownload(app.id)}
                    disabled={downloadingId === app.id}
                    className="btn-primary"
                    style={{ fontSize: '0.82rem', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <DownloadIcon size={14} />
                    {downloadingId === app.id ? 'Generating Slip...' : 'Download Slip (PNG)'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={<PrescriptionIcon size={40} color="#94a3b8" />}
          title="No Prescriptions Issued Yet"
          message="Once your doctor completes your consultation, digital prescription slips will appear here for download."
          actionLabel="View Appointments"
          onAction={() => onNavigate('my-appointments')}
        />
      )}
    </div>
  )
}
