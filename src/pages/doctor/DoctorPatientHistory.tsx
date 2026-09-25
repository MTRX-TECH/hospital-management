import React, { useState, useEffect } from 'react'
import { api, type VisitRecord } from '../../services/api'
import { EmptyState } from '../../components/EmptyState'
import { Modal } from '../../components/Modal'
import { SearchIcon, CalendarIcon, FileTextIcon, UserIcon, StethoscopeIcon } from '../../components/Icons'
import { downloadVisitReportImage } from '../../utils/reportGenerator'

interface PatientGroup {
  id: string
  name: string
  phone: string
  gender: string
  bloodGroup: string
  visits: VisitRecord[]
}

export const DoctorPatientHistory: React.FC = () => {
  const [visits, setVisits] = useState<VisitRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<PatientGroup | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAllVisits()
  }, [])

  async function loadAllVisits() {
    setLoading(true)
    setError('')
    try {
      // Fetch all visits with all=true
      const data = await api.getVisits(undefined, true)
      setVisits(data)
    } catch (err: any) {
      setError(err.message || 'Could not load clinical patient histories.')
    } finally {
      setLoading(false)
    }
  }

  // Group visits by patient
  const patientMap = new Map<string, PatientGroup>()
  visits.forEach((v) => {
    const key = v.patientId || v.patientName
    if (!patientMap.has(key)) {
      patientMap.set(key, {
        id: v.patientId || key,
        name: v.patientName || 'Unknown Patient',
        phone: v.patientPhone || 'N/A',
        gender: v.patientGender || 'N/A',
        bloodGroup: v.patientBloodGroup || 'N/A',
        visits: [],
      })
    }
    patientMap.get(key)!.visits.push(v)
  })

  const patientGroups = Array.from(patientMap.values())

  // Filter by search query
  const filteredPatients = patientGroups.filter((p) => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return true
    const matchName = p.name.toLowerCase().includes(term)
    const matchPhone = p.phone.toLowerCase().includes(term)
    const matchDiag = p.visits.some((v) => v.diagnosisSummary?.toLowerCase().includes(term))
    return matchName || matchPhone || matchDiag
  })

  async function handleDownloadReport(visit: VisitRecord, patient: PatientGroup) {
    setDownloadingId(visit.id)
    try {
      await downloadVisitReportImage({
        id: visit.id,
        appointmentDate: visit.appointmentDate,
        appointmentTime: visit.appointmentTime,
        patientName: patient.name,
        patientPhone: patient.phone,
        patientGender: patient.gender,
        patientBloodGroup: patient.bloodGroup,
        doctorName: visit.doctorName,
        department: visit.department,
        reason: visit.reason,
        diagnosisSummary: visit.diagnosisSummary,
        doctorNotes: visit.doctorNotes,
        reportImageUrl: visit.reportImageUrl,
        createdAt: visit.createdAt,
      })
    } catch (err) {
      console.error('Failed to download report image:', err)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patient Medical History &amp; Records</h1>
          <p className="page-subtitle">
            Inspect previous outpatient consultations, diagnoses, prescription advice, and attached diagnostic reports
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
            placeholder="Search patients by name, phone, or past clinical diagnosis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {error && <div className="form-alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">Loading patient medical history...</div>
      ) : filteredPatients.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredPatients.map((patient) => {
            const isSelected = selectedPatient?.id === patient.id
            const latestVisit = patient.visits[0]

            return (
              <div
                key={patient.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: isSelected ? '1.5px solid #1e40af' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'border-color 0.15s ease',
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: '#eff6ff',
                        color: '#1e40af',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1rem',
                      }}
                    >
                      <UserIcon size={20} color="#1e40af" />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                        {patient.name}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                        Mobile: {patient.phone} • Gender: {patient.gender} • Blood Group: {patient.bloodGroup}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        backgroundColor: '#f1f5f9',
                        color: '#334155',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                      }}
                    >
                      {patient.visits.length} {patient.visits.length === 1 ? 'Visit Record' : 'Visit Records'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPatient(isSelected ? null : patient)}
                      className={isSelected ? 'btn-primary' : 'btn-secondary'}
                      style={{ padding: '7px 14px', fontSize: '0.85rem' }}
                    >
                      {isSelected ? 'Hide Records' : 'View Full History'}
                    </button>
                  </div>
                </div>

                {/* Latest diagnosis snippet */}
                {latestVisit && !isSelected && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '10px 14px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      fontSize: '0.88rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#0f172a' }}>Most Recent Assessment: </strong>
                      <span style={{ color: '#334155' }}>{latestVisit.diagnosisSummary}</span>
                      <span style={{ color: '#64748b', marginLeft: '8px' }}>({latestVisit.appointmentDate})</span>
                    </div>
                    {latestVisit.reportImageUrl && (
                      <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600 }}>
                        Diagnostic Scan Available
                      </span>
                    )}
                  </div>
                )}

                {/* Expanded Full Visit History Timeline */}
                {isSelected && (
                  <div style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e40af', marginBottom: '14px' }}>
                      Consultation History Timeline for {patient.name}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {patient.visits.map((visit, index) => (
                        <div
                          key={visit.id}
                          style={{
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '16px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  backgroundColor: '#eff6ff',
                                  color: '#1e40af',
                                  fontWeight: 700,
                                  fontSize: '0.78rem',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                }}
                              >
                                Consultation #{patient.visits.length - index}
                              </span>
                              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                                {visit.appointmentDate}
                              </strong>
                              {visit.appointmentTime && (
                                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>at {visit.appointmentTime}</span>
                              )}
                            </div>
                            <span style={{ color: '#0284c7', fontWeight: 600, fontSize: '0.88rem' }}>
                              Dr. {visit.doctorName} • {visit.department}
                            </span>
                          </div>

                          <div style={{ marginBottom: '8px', fontSize: '0.9rem' }}>
                            <strong style={{ color: '#166534' }}>Diagnosis: </strong>
                            <span style={{ color: '#0f172a', fontWeight: 600 }}>{visit.diagnosisSummary}</span>
                          </div>

                          <div
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              padding: '10px 12px',
                              fontSize: '0.88rem',
                              color: '#334155',
                              lineHeight: 1.5,
                            }}
                          >
                            <strong style={{ color: '#1e3a8a', display: 'block', marginBottom: '4px' }}>Doctor's Clinical Notes &amp; Rx:</strong>
                            {visit.doctorNotes || 'No specific notes recorded.'}
                          </div>

                          {/* Cloudinary Report Image if present */}
                          {visit.reportImageUrl && (
                            <div
                              style={{
                                marginTop: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '8px 12px',
                              }}
                            >
                              <img
                                src={visit.reportImageUrl}
                                alt="Report Thumbnail"
                                style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                                onClick={() => setPreviewImage(visit.reportImageUrl || null)}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                                  Diagnostic Scan / Cloudinary Report
                                </div>
                                <small style={{ color: '#64748b' }}>Click to view high-resolution scan</small>
                              </div>
                              <button
                                type="button"
                                onClick={() => setPreviewImage(visit.reportImageUrl || null)}
                                className="btn-secondary"
                                style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                              >
                                View Image
                              </button>
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                            <button
                              type="button"
                              disabled={downloadingId === visit.id}
                              onClick={() => handleDownloadReport(visit, patient)}
                              className="btn-primary"
                              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                            >
                              <FileTextIcon size={14} color="#ffffff" />
                              {downloadingId === visit.id ? 'Generating...' : 'Download Report (Image)'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={<FileTextIcon size={38} color="#94a3b8" />}
          title="No Patient Records Found"
          message="No patient medical histories match your search query."
        />
      )}

      {/* Cloudinary Report Preview Modal */}
      {previewImage && (
        <Modal
          isOpen={Boolean(previewImage)}
          onClose={() => setPreviewImage(null)}
          title="Diagnostic Report Document"
          subtitle="Hospital Cloudinary Medical Vault"
          maxWidth="720px"
        >
          <div style={{ textAlign: 'center', padding: '10px' }}>
            <img
              src={previewImage}
              alt="Diagnostic Scan Full"
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
