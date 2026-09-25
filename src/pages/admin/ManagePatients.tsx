import React, { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { Modal } from '../../components/Modal'
import { EmptyState } from '../../components/EmptyState'
import {
  SearchIcon,
  UsersIcon,
  CalendarIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  UserIcon,
} from '../../components/Icons'
import {
  downloadPatientMedicalHistoryImage,
  downloadVisitReportImage,
} from '../../utils/reportGenerator'

export const ManagePatients: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')

  // Patient detail modal
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [patientDetail, setPatientDetail] = useState<any | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Download states
  const [downloadingHistoryId, setDownloadingHistoryId] = useState<string | null>(null)
  const [downloadingVisitId, setDownloadingVisitId] = useState<string | null>(null)

  // Cloudinary image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    loadPatients()
  }, [])

  async function loadPatients() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getPatients()
      setPatients(data)
    } catch (err: any) {
      setError(err.message || 'Could not load patient records.')
    } finally {
      setLoading(false)
    }
  }

  async function openPatientHistory(id: string) {
    setSelectedPatientId(id)
    setLoadingDetail(true)
    try {
      const data = await api.getPatientById(id)
      setPatientDetail(data)
    } catch (err: any) {
      alert(err.message || 'Could not load patient medical record.')
    } finally {
      setLoadingDetail(false)
    }
  }

  async function handleDownloadHistory(detail: any) {
    if (!detail?.patient) return
    const pid = detail.patient.id || detail.patient._id || 'patient'
    setDownloadingHistoryId(pid)
    try {
      await downloadPatientMedicalHistoryImage({
        name: detail.patient.name,
        email: detail.patient.email,
        phone: detail.patient.phone,
        dateOfBirth: detail.patient.dateOfBirth,
        gender: detail.patient.gender,
        bloodGroup: detail.patient.bloodGroup,
        address: detail.patient.address,
        emergencyContact: detail.patient.emergencyContact,
        visits: (detail.visits || []).map((v: any) => ({
          id: v.id || v._id,
          date: v.date,
          doctor: v.doctor,
          department: v.department || 'General Medicine',
          diagnosisSummary: v.diagnosisSummary,
          doctorNotes: v.doctorNotes,
          reportImageUrl: v.reportImageUrl,
        })),
      })
    } catch (err: any) {
      alert('Could not download patient medical history image: ' + err.message)
    } finally {
      setDownloadingHistoryId(null)
    }
  }

  async function handleQuickDownloadFromTable(p: any) {
    setDownloadingHistoryId(p.id)
    try {
      const detail = await api.getPatientById(p.id)
      await downloadPatientMedicalHistoryImage({
        name: detail.patient.name,
        email: detail.patient.email,
        phone: detail.patient.phone,
        dateOfBirth: detail.patient.dateOfBirth,
        gender: detail.patient.gender,
        bloodGroup: detail.patient.bloodGroup,
        address: detail.patient.address,
        emergencyContact: detail.patient.emergencyContact,
        visits: (detail.visits || []).map((v: any) => ({
          id: v.id || v._id,
          date: v.date,
          doctor: v.doctor,
          department: v.department || 'General Medicine',
          diagnosisSummary: v.diagnosisSummary,
          doctorNotes: v.doctorNotes,
          reportImageUrl: v.reportImageUrl,
        })),
      })
    } catch (err: any) {
      alert('Could not generate medical history: ' + err.message)
    } finally {
      setDownloadingHistoryId(null)
    }
  }

  async function handleDownloadSingleVisit(v: any, patient: any) {
    const vid = v.id || v._id || 'visit'
    setDownloadingVisitId(vid)
    try {
      await downloadVisitReportImage({
        id: vid,
        patientName: patient.name,
        patientPhone: patient.phone,
        patientGender: patient.gender,
        patientBloodGroup: patient.bloodGroup,
        doctorName: v.doctor || 'Consulting Specialist',
        department: v.department || 'General Medicine',
        appointmentDate: v.date,
        diagnosisSummary: v.diagnosisSummary,
        doctorNotes: v.doctorNotes,
        reportImageUrl: v.reportImageUrl,
      })
    } catch (err: any) {
      alert('Could not generate visit report image: ' + err.message)
    } finally {
      setDownloadingVisitId(null)
    }
  }

  const filteredPatients = patients.filter((p) =>
    `${p.name} ${p.email} ${p.phone} ${p.bloodGroup}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hospital Patient Directory</h1>
          <p className="page-subtitle">
            Registered patient profiles, demographics, contact details, and certified clinical histories
          </p>
        </div>
      </div>

      <div className="search-filter-card">
        <div className="search-input-wrapper full-width">
          <span className="search-icon">
            <SearchIcon size={16} color="#64748b" />
          </span>
          <input
            type="text"
            placeholder="Search patients by name, email, phone, or blood group..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {error && <div className="form-alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">Loading patient directory...</div>
      ) : filteredPatients.length > 0 ? (
        <div className="table-responsive card-table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ minWidth: '180px' }}>Patient Details</th>
                <th style={{ minWidth: '140px' }}>Demographics</th>
                <th style={{ minWidth: '150px' }}>Contact</th>
                <th style={{ minWidth: '140px' }}>Emergency Contact</th>
                <th style={{ minWidth: '110px' }}>Visits</th>
                <th style={{ minWidth: '220px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="table-cell-bold">{p.name}</div>
                    <small style={{ color: '#64748b' }}>{p.address || 'Address unlisted'}</small>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.88rem' }}>
                      {p.gender || 'N/A'} • {p.dateOfBirth || 'DOB N/A'}
                    </div>
                    <span className="blood-tag">{p.bloodGroup || 'Blood N/A'}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{p.phone || 'No phone'}</div>
                    <small style={{ color: '#64748b' }}>{p.email}</small>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.88rem', color: '#1e293b', fontWeight: 500 }}>
                      {p.emergencyContact || 'None provided'}
                    </div>
                  </td>
                  <td>
                    <span className="tab-count-badge" style={{ fontSize: '0.85rem' }}>
                      {p.appointmentCount} consultations
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => openPatientHistory(p.id)}
                        className="btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <FileTextIcon size={14} />
                        <span>Medical File</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDownloadFromTable(p)}
                        disabled={downloadingHistoryId === p.id}
                        className="btn-primary btn-sm"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          backgroundColor: '#0369a1',
                          borderColor: '#0369a1',
                        }}
                        title="Download complete medical history dossier as an image"
                      >
                        <DownloadIcon size={14} color="#ffffff" />
                        <span>{downloadingHistoryId === p.id ? 'Generating...' : 'Download Image'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={<UsersIcon size={38} color="#94a3b8" />}
          title="No Patients Found"
          message="No patient accounts match your search query."
        />
      )}

      {/* Patient History Modal */}
      <Modal
        isOpen={Boolean(selectedPatientId)}
        onClose={() => {
          setSelectedPatientId(null)
          setPatientDetail(null)
        }}
        title="Patient Medical Dossier &amp; Clinical History"
        subtitle={patientDetail?.patient ? `Certified Medical Record: ${patientDetail.patient.name}` : ''}
        maxWidth="760px"
      >
        {loadingDetail ? (
          <div className="loading-container">Loading clinical history...</div>
        ) : patientDetail ? (
          <div className="patient-medical-modal-body">
            {/* Action Bar for complete Dossier Download */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px',
              }}
            >
              <div>
                <strong style={{ color: '#1e3a8a', display: 'block', fontSize: '0.95rem' }}>
                  Aarogya Certified Medical Record Dossier
                </strong>
                <span style={{ fontSize: '0.82rem', color: '#3b82f6' }}>
                  Official hospital dossier with full consultation history &amp; emergency info
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDownloadHistory(patientDetail)}
                disabled={Boolean(downloadingHistoryId)}
                className="btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#0284c7',
                  whiteSpace: 'nowrap',
                }}
              >
                <DownloadIcon size={15} color="#ffffff" />
                <span>
                  {downloadingHistoryId ? 'Generating Image...' : 'Download History (Image)'}
                </span>
              </button>
            </div>

            <div className="patient-mini-summary-box">
              <div className="summary-row">
                <span>Name &amp; Gender:</span>
                <strong>
                  {patientDetail.patient.name} ({patientDetail.patient.gender || 'N/A'})
                </strong>
              </div>
              <div className="summary-row">
                <span>Blood Group:</span>
                <strong className="blood-tag">{patientDetail.patient.bloodGroup || 'N/A'}</strong>
              </div>
              <div className="summary-row">
                <span>Date of Birth / Age:</span>
                <strong>{patientDetail.patient.dateOfBirth || 'Not listed'}</strong>
              </div>
              <div className="summary-row">
                <span>Contact Details:</span>
                <strong>
                  {patientDetail.patient.phone} • {patientDetail.patient.email}
                </strong>
              </div>
              <div className="summary-row">
                <span>Emergency Contact:</span>
                <strong style={{ color: '#b91c1c' }}>
                  {patientDetail.patient.emergencyContact || 'None provided'}
                </strong>
              </div>
              <div className="summary-row">
                <span>Residential Address:</span>
                <span>{patientDetail.patient.address || 'Address unlisted'}</span>
              </div>
            </div>

            <h4 style={{ margin: '22px 0 12px', fontSize: '1.05rem', color: '#0f172a' }}>
              Past Consultation Visits &amp; Doctor Notes ({patientDetail.visits?.length || 0})
            </h4>

            {patientDetail.visits && patientDetail.visits.length > 0 ? (
              <div className="modal-visits-list">
                {patientDetail.visits.map((v: any) => (
                  <div key={v.id || v._id} className="visit-record-subcard">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                        flexWrap: 'wrap',
                        gap: '6px',
                      }}
                    >
                      <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0f172a' }}>
                        <CalendarIcon size={15} color="#0284c7" /> {v.date}
                      </strong>
                      <span style={{ color: '#0284c7', fontWeight: 600, fontSize: '0.92rem' }}>
                        Dr. {v.doctor}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.9rem', marginBottom: '6px', color: '#1e293b' }}>
                      <strong>Diagnosis:</strong> {v.diagnosisSummary || 'Routine examination'}
                    </div>

                    <div
                      style={{
                        fontSize: '0.86rem',
                        color: '#334155',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        marginBottom: '10px',
                        lineHeight: 1.5,
                      }}
                    >
                      <strong style={{ color: '#0f172a', display: 'block', marginBottom: '3px' }}>
                        Clinical Notes &amp; Treatment Plan:
                      </strong>
                      {v.doctorNotes}
                    </div>

                    {/* Report Image thumbnail if Cloudinary scan attached */}
                    {v.reportImageUrl && (
                      <div
                        style={{
                          marginBottom: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          padding: '8px 12px',
                          borderRadius: '6px',
                        }}
                      >
                        <img
                          src={v.reportImageUrl}
                          alt="Diagnostic scan"
                          style={{
                            width: '45px',
                            height: '45px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            cursor: 'pointer',
                          }}
                          onClick={() => setPreviewImage(v.reportImageUrl)}
                        />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#166534', display: 'block' }}>
                            Attached Diagnostic Scan / Lab Report (Cloudinary)
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            Click thumbnail or button to inspect document
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewImage(v.reportImageUrl)}
                          className="btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <EyeIcon size={13} />
                          <span>View Scan</span>
                        </button>
                      </div>
                    )}

                    {/* Single Visit Report Image Download */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => handleDownloadSingleVisit(v, patientDetail.patient)}
                        disabled={downloadingVisitId === (v.id || v._id)}
                        className="btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <DownloadIcon size={13} color="#0284c7" />
                        <span>
                          {downloadingVisitId === (v.id || v._id)
                            ? 'Generating Slip...'
                            : 'Download Visit Slip (Image)'}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: '12px 0' }}>
                No completed clinical visit records on file for this patient.
              </p>
            )}

            <div className="modal-actions" style={{ marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedPatientId(null)
                  setPatientDetail(null)
                }}
                className="btn-secondary"
              >
                Close Medical File
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Cloudinary Diagnostic Report Scan Preview Modal */}
      {previewImage && (
        <Modal
          isOpen={Boolean(previewImage)}
          onClose={() => setPreviewImage(null)}
          title="Diagnostic Lab / Scan Document Preview"
          subtitle="Aarogya Multi-Speciality Hospital Diagnostic Archives"
          maxWidth="700px"
        >
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <img
              src={previewImage}
              alt="Diagnostic Scan Full Document"
              style={{
                maxWidth: '100%',
                maxHeight: '65vh',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                objectFit: 'contain',
              }}
            />
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <a
                href={previewImage}
                download="aarogya-diagnostic-report.png"
                target="_blank"
                rel="noreferrer"
                className="btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <DownloadIcon size={14} color="#ffffff" />
                <span>Download Original Scan</span>
              </a>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="btn-secondary btn-sm"
              >
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
