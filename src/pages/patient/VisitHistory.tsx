import React, { useState, useEffect } from 'react'
import { api, type VisitRecord } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { EmptyState } from '../../components/EmptyState'
import { CalendarIcon, FileTextIcon, StethoscopeIcon } from '../../components/Icons'
import { downloadVisitReportImage } from '../../utils/reportGenerator'
import { Modal } from '../../components/Modal'

interface VisitHistoryProps {
  onNavigate: (tab: string) => void
}

export const VisitHistory: React.FC<VisitHistoryProps> = ({ onNavigate }) => {
  const { user } = useAuth()
  const [visits, setVisits] = useState<VisitRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    loadVisits()
  }, [])

  async function loadVisits() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getVisits()
      setVisits(data)
    } catch (err: any) {
      setError(err.message || 'Could not load your medical visit history.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadReport(visit: VisitRecord) {
    setDownloadingId(visit.id)
    try {
      await downloadVisitReportImage({
        id: visit.id,
        appointmentDate: visit.appointmentDate,
        appointmentTime: visit.appointmentTime,
        patientName: visit.patientName || user?.name || 'Patient',
        patientPhone: visit.patientPhone || user?.phone || '',
        patientGender: visit.patientGender,
        patientBloodGroup: visit.patientBloodGroup,
        doctorName: visit.doctorName,
        department: visit.department,
        reason: visit.reason,
        diagnosisSummary: visit.diagnosisSummary,
        doctorNotes: visit.doctorNotes,
        reportImageUrl: visit.reportImageUrl,
        createdAt: visit.createdAt,
      })
    } catch (err) {
      console.error('Failed to generate report image:', err)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patient Medical Visit History</h1>
          <p className="page-subtitle">
            Permanent records of completed clinical consultations, diagnoses, prescription advice, and diagnostic reports
          </p>
        </div>
      </div>

      {error && <div className="form-alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">Loading medical records...</div>
      ) : visits.length > 0 ? (
        <div className="visit-records-container">
          {visits.map((visit) => (
            <div key={visit.id} className="visit-card">
              <div className="visit-card-header">
                <div className="visit-date-badge">
                  <span className="calendar-icon">
                    <CalendarIcon size={15} color="currentColor" />
                  </span>
                  <strong>{visit.appointmentDate}</strong>
                  {visit.appointmentTime && <span>at {visit.appointmentTime}</span>}
                </div>
                <div className="visit-dept-pill">{visit.department}</div>
              </div>

              <div className="visit-card-meta">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StethoscopeIcon size={16} color="#0284c7" />
                  <div>
                    <span className="meta-label">Consulting Physician:</span>
                    <span className="meta-value doctor-name">{visit.doctorName}</span>
                  </div>
                </div>
                {visit.reason && (
                  <div>
                    <span className="meta-label">Reason for Visit:</span>
                    <span className="meta-value">{visit.reason}</span>
                  </div>
                )}
              </div>

              <div className="visit-section-box">
                <h4 className="visit-box-title">Diagnosis &amp; Clinical Summary</h4>
                <p className="visit-box-text">{visit.diagnosisSummary || 'Routine medical evaluation conducted.'}</p>
              </div>

              <div className="visit-section-box doctor-notes-highlight">
                <h4 className="visit-box-title">Doctor's Care Advice &amp; Notes (Rx)</h4>
                <p className="visit-box-text notes-text">
                  {visit.doctorNotes || 'No specific post-consultation directions recorded.'}
                </p>
              </div>

              {/* Uploaded Diagnostic Report Image Preview */}
              {visit.reportImageUrl && (
                <div
                  style={{
                    margin: '12px 0',
                    padding: '12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={visit.reportImageUrl}
                      alt="Diagnostic Report"
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        cursor: 'pointer',
                      }}
                      onClick={() => setPreviewImage(visit.reportImageUrl || null)}
                    />
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a' }}>
                        Diagnostic Scan / Lab Report Attached
                      </div>
                      <small style={{ color: '#64748b' }}>Cloudinary Secured Diagnostic Document</small>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewImage(visit.reportImageUrl || null)}
                    className="btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                  >
                    View Full Image
                  </button>
                </div>
              )}

              <div
                className="visit-card-footer"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                <small className="record-recorded-time">
                  Record documented on {new Date(visit.createdAt).toLocaleDateString()}
                </small>

                {/* Download Report as Image Button */}
                <button
                  type="button"
                  disabled={downloadingId === visit.id}
                  onClick={() => handleDownloadReport(visit)}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  <FileTextIcon size={14} color="#ffffff" />
                  {downloadingId === visit.id ? 'Generating Image...' : 'Download Report (Image)'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FileTextIcon size={38} color="#94a3b8" />}
          title="No Visit Records on File"
          message="Once you attend a consultation and the doctor completes the appointment, your diagnosis summary and doctor's clinical notes will appear here."
          actionLabel="Book a Consultation"
          onAction={() => onNavigate('find-doctors')}
        />
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <Modal
          isOpen={Boolean(previewImage)}
          onClose={() => setPreviewImage(null)}
          title="Diagnostic Report Document"
          subtitle="Aarogya Multi-Speciality Hospital Clinical Record"
          maxWidth="700px"
        >
          <div style={{ textAlign: 'center', padding: '10px' }}>
            <img
              src={previewImage}
              alt="Full Report"
              style={{ maxWidth: '100%', maxHeight: '550px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
            <div style={{ marginTop: '16px' }}>
              <button onClick={() => setPreviewImage(null)} className="btn-secondary">
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
