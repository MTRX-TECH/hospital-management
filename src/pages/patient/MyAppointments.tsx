import React, { useState, useEffect } from 'react'
import { api, type Appointment } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'
import { EmptyState } from '../../components/EmptyState'
import { Modal } from '../../components/Modal'
import {
  PlusIcon,
  CalendarIcon,
  DownloadIcon,
  QrCodeIcon,
  ReceiptIcon,
  PrescriptionIcon,
  QueueIcon,
} from '../../components/Icons'
import { generateAppointmentQRCode } from '../../utils/qrCode'
import { downloadReceiptImage } from '../../utils/receiptGenerator'
import { downloadPrescriptionImage } from '../../utils/prescriptionGenerator'

interface MyAppointmentsProps {
  onNotify: (message: string) => void
  onNavigate: (tab: string) => void
}

export const MyAppointments: React.FC<MyAppointmentsProps> = ({ onNotify, onNavigate }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Appointment Detail & QR Check-In Modal state
  const [activeModalApp, setActiveModalApp] = useState<Appointment | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [checkingIn, setCheckingIn] = useState(false)
  const [downloadingReceipt, setDownloadingReceipt] = useState(false)
  const [downloadingRx, setDownloadingRx] = useState(false)

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
      setError(err.message || 'Could not load your appointments.')
    } finally {
      setLoading(false)
    }
  }

  async function handleOpenDetails(app: Appointment) {
    setActiveModalApp(app)
    try {
      const qrUrl = await generateAppointmentQRCode(app.id)
      setQrCodeDataUrl(qrUrl)
    } catch (err) {
      console.error('QR code generation error:', err)
    }
  }

  async function handleCheckIn(appointmentId: string) {
    setCheckingIn(true)
    try {
      const res = await api.checkInAppointment(appointmentId)
      onNotify(`Check-in successful! Your Queue Token is ${res.queueToken}.`)
      await loadAppointments()
      // Refresh current modal state
      const updated = await api.getAppointmentById(appointmentId)
      setActiveModalApp(updated)
    } catch (err: any) {
      alert(err.message || 'Check-in failed. Please visit the reception desk.')
    } finally {
      setCheckingIn(false)
    }
  }

  async function handleDownloadReceipt(appointmentId: string) {
    setDownloadingReceipt(true)
    try {
      const receiptData = await api.getReceipt(appointmentId)
      await downloadReceiptImage(receiptData)
      onNotify('Official hospital payment receipt downloaded.')
    } catch (err: any) {
      alert(err.message || 'Could not download receipt.')
    } finally {
      setDownloadingReceipt(false)
    }
  }

  async function handleDownloadPrescription(appointmentId: string) {
    setDownloadingRx(true)
    try {
      const rxData = await api.getPrescription(appointmentId)
      await downloadPrescriptionImage(rxData)
      onNotify('Digital prescription slip downloaded.')
    } catch (err: any) {
      alert(err.message || 'Could not download prescription slip.')
    } finally {
      setDownloadingRx(false)
    }
  }

  async function handleCancel(id: string, doctorName: string, date: string) {
    if (!window.confirm(`Are you sure you want to cancel your appointment with ${doctorName} on ${date}?`)) {
      return
    }

    setCancellingId(id)
    try {
      await api.cancelAppointment(id)
      onNotify('Your appointment has been cancelled.')
      await loadAppointments()
      if (activeModalApp?.id === id) {
        setActiveModalApp(null)
      }
    } catch (err: any) {
      alert(err.message || 'Could not cancel appointment.')
    } finally {
      setCancellingId(null)
    }
  }

  const filteredAppointments = appointments.filter((app) => {
    if (selectedFilter === 'ALL') return true
    return app.status === selectedFilter
  })

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Appointments</h1>
          <p className="page-subtitle">Track your bookings, QR passes, payment receipts, and queue statuses</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => onNavigate('live-waiting-room')} className="btn-secondary">
            <QueueIcon size={16} /> Live Waiting Room
          </button>
          <button onClick={() => onNavigate('find-doctors')} className="btn-primary">
            <PlusIcon size={16} /> Book New Appointment
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="tab-filters-row">
        {['ALL', 'CONFIRMED', 'WAITING', 'COMPLETED', 'CANCELLED'].map((status) => (
          <button
            key={status}
            type="button"
            className={`tab-filter-btn ${selectedFilter === status ? 'active' : ''}`}
            onClick={() => setSelectedFilter(status)}
          >
            {status === 'ALL'
              ? 'All Appointments'
              : status === 'CONFIRMED'
              ? 'Confirmed'
              : status === 'WAITING'
              ? 'In Queue'
              : status.charAt(0) + status.slice(1).toLowerCase()}
            <span className="tab-count-badge">
              {status === 'ALL'
                ? appointments.length
                : appointments.filter((a) => a.status === status).length}
            </span>
          </button>
        ))}
      </div>

      {error && <div className="form-alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">Loading your appointments...</div>
      ) : filteredAppointments.length > 0 ? (
        <div className="table-responsive card-table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Appointment ID</th>
                <th>Date &amp; Time</th>
                <th>Doctor &amp; Specialty</th>
                <th>Department</th>
                <th>OPD Queue Token</th>
                <th>Billing &amp; Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((app) => {
                const canCancel = app.status === 'REQUESTED' || app.status === 'CONFIRMED'
                const hasPrescription =
                  app.status === 'COMPLETED' ||
                  (app.prescription && app.prescription.medicines && app.prescription.medicines.length > 0)

                return (
                  <tr key={app.id}>
                    <td>
                      <span className="mono-code">#{app.id.slice(-6).toUpperCase()}</span>
                    </td>
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
                      {app.queueToken ? (
                        <span
                          style={{
                            background: '#eff6ff',
                            color: '#1e40af',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.84rem',
                          }}
                        >
                          {app.queueToken}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Not Generated</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0f172a' }}>
                        Advance: ₹{app.advancePaid ?? 0}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: app.remainingBalance === 0 ? '#16a34a' : '#d97706' }}>
                        {app.remainingBalance === 0 ? 'Fully Paid' : `Balance Due: ₹${app.remainingBalance ?? 0}`}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={app.status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(app)}
                          className="btn-secondary"
                          style={{ fontSize: '0.76rem', padding: '4px 8px' }}
                          title="View QR Check-In Pass & Details"
                        >
                          <QrCodeIcon size={13} /> QR Pass
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(app.id)}
                          className="btn-secondary"
                          style={{ fontSize: '0.76rem', padding: '4px 8px' }}
                          title="Download Official Hospital Receipt"
                        >
                          <ReceiptIcon size={13} /> Receipt
                        </button>

                        {hasPrescription && (
                          <button
                            type="button"
                            onClick={() => handleDownloadPrescription(app.id)}
                            className="btn-primary"
                            style={{ fontSize: '0.76rem', padding: '4px 8px' }}
                            title="Download Digital Prescription Slip"
                          >
                            <PrescriptionIcon size={13} /> Slip
                          </button>
                        )}

                        {canCancel && (
                          <button
                            type="button"
                            disabled={cancellingId === app.id}
                            onClick={() => handleCancel(app.id, app.doctor, app.appointmentDate)}
                            className="btn-danger-outline btn-sm"
                            style={{ fontSize: '0.74rem', padding: '3px 6px' }}
                          >
                            {cancellingId === app.id ? '...' : 'Cancel'}
                          </button>
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
          icon={<CalendarIcon size={38} color="#94a3b8" />}
          title="No Appointments Found"
          message={`There are no appointments with status "${selectedFilter}".`}
          actionLabel={selectedFilter !== 'ALL' ? 'View All Appointments' : 'Find a Doctor'}
          onAction={() => {
            if (selectedFilter !== 'ALL') setSelectedFilter('ALL')
            else onNavigate('find-doctors')
          }}
        />
      )}

      {/* Appointment Details & QR Check-In Modal */}
      {activeModalApp && (
        <Modal
          isOpen={!!activeModalApp}
          onClose={() => setActiveModalApp(null)}
          title="Appointment Details & QR Pass"
          subtitle={`Aarogya Multi-Speciality Hospital • #${activeModalApp.id.slice(-6).toUpperCase()}`}
          maxWidth="640px"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
            {/* Left Column: QR Code & Check-in */}
            <div
              style={{
                textAlign: 'center',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="Appointment QR Code"
                  style={{
                    width: '180px',
                    height: '180px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    margin: '0 auto',
                    display: 'block',
                  }}
                />
              ) : (
                <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Loading QR Pass...
                </div>
              )}

              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>OPD Queue Token</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e3a8a', letterSpacing: '1px' }}>
                  {activeModalApp.queueToken || 'PENDING CHECK-IN'}
                </div>
              </div>

              {activeModalApp.checkInStatus !== 'CHECKED_IN' ? (
                <button
                  type="button"
                  onClick={() => handleCheckIn(activeModalApp.id)}
                  disabled={checkingIn}
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '12px', padding: '8px 12px', fontSize: '0.88rem' }}
                >
                  <QrCodeIcon size={15} />
                  {checkingIn ? 'Checking In...' : 'Check In & Get Token'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActiveModalApp(null)
                    onNavigate('live-waiting-room')
                  }}
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '12px', padding: '8px 12px', fontSize: '0.88rem' }}
                >
                  <QueueIcon size={15} /> Enter Live Waiting Room
                </button>
              )}
            </div>

            {/* Right Column: Appointment Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Consultant Specialist</div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{activeModalApp.doctor}</div>
                <div style={{ color: '#2563eb', fontSize: '0.82rem' }}>
                  {activeModalApp.department} ({activeModalApp.specialization})
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Scheduled Slot</div>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>
                  {activeModalApp.appointmentDate} at {activeModalApp.appointmentTime}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Payment &amp; Billing</div>
                <div style={{ color: '#0f172a' }}>
                  Advance Paid: <strong>₹{activeModalApp.advancePaid ?? 200}</strong> / Total: ₹
                  {activeModalApp.totalFee ?? 500}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Remaining Balance: ₹{activeModalApp.remainingBalance ?? 300} (Pay at desk)
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Reason for Visit</div>
                <div style={{ color: '#334155', fontStyle: 'italic', fontSize: '0.84rem' }}>
                  &ldquo;{activeModalApp.reason}&rdquo;
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Appointment Status</div>
                <div style={{ marginTop: '3px' }}>
                  <StatusBadge status={activeModalApp.status} />
                </div>
              </div>
            </div>
          </div>

          {/* Pre-Consultation Summary if submitted */}
          {activeModalApp.preConsultation && (
            <div
              style={{
                marginTop: '18px',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '0.84rem',
              }}
            >
              <div style={{ fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Pre-Consultation Clinical Intake
              </div>
              {activeModalApp.preConsultation.symptoms && activeModalApp.preConsultation.symptoms.length > 0 && (
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Reported Symptoms:</span>{' '}
                  <span style={{ fontWeight: 500 }}>{activeModalApp.preConsultation.symptoms.join(', ')}</span>
                </div>
              )}
              {activeModalApp.preConsultation.symptomDuration && (
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Duration:</span>{' '}
                  <span>{activeModalApp.preConsultation.symptomDuration}</span>
                </div>
              )}
              {activeModalApp.preConsultation.currentMedications && (
                <div>
                  <span style={{ color: '#64748b' }}>Current Medications:</span>{' '}
                  <span>{activeModalApp.preConsultation.currentMedications}</span>
                </div>
              )}
            </div>
          )}

          {/* Modal Bottom Actions */}
          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => handleDownloadReceipt(activeModalApp.id)}
              disabled={downloadingReceipt}
              className="btn-secondary"
            >
              <ReceiptIcon size={15} />
              {downloadingReceipt ? 'Generating Receipt...' : 'Download Receipt (PNG)'}
            </button>

            {activeModalApp.status === 'COMPLETED' && (
              <button
                type="button"
                onClick={() => handleDownloadPrescription(activeModalApp.id)}
                disabled={downloadingRx}
                className="btn-primary"
              >
                <PrescriptionIcon size={15} />
                {downloadingRx ? 'Generating Slip...' : 'Download Prescription (PNG)'}
              </button>
            )}

            <button type="button" onClick={() => setActiveModalApp(null)} className="btn-secondary">
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
