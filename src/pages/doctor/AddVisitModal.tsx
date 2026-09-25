import React, { useState, useEffect } from 'react'
import { api, type Appointment, type VisitRecord, type PrescriptionMedicine } from '../../services/api'
import { Modal } from '../../components/Modal'
import { CheckCircleIcon, CrossIcon, PlusIcon, PrescriptionIcon } from '../../components/Icons'

interface AddVisitModalProps {
  appointment: Appointment | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
}

interface TabletFormItem {
  name: string
  numberOfTimes: string
  dosage: string
  timing: string
  duration: string
  instructions: string
}

const COMMON_TABLET_PRESETS: TabletFormItem[] = [
  {
    name: 'Tab. Paracetamol 650mg',
    dosage: '1 Tablet',
    numberOfTimes: '3 times a day (Morning, Afternoon & Night)',
    timing: 'After Food',
    duration: '3 Days',
    instructions: 'Take with warm water for fever and pain',
  },
  {
    name: 'Tab. Pantocid 40mg',
    dosage: '1 Tablet',
    numberOfTimes: '1 time a day (Morning only)',
    timing: 'Before Food (Empty Stomach)',
    duration: '5 Days',
    instructions: 'Take 30 minutes before breakfast',
  },
  {
    name: 'Tab. Azithromycin 500mg',
    dosage: '1 Tablet',
    numberOfTimes: '1 time a day (Morning only)',
    timing: 'After Food',
    duration: '3 Days',
    instructions: 'Complete 3-day antibiotic course strictly',
  },
  {
    name: 'Tab. Cetirizine 10mg',
    dosage: '1 Tablet',
    numberOfTimes: '1 time a day (Night only)',
    timing: 'At Bedtime',
    duration: '5 Days',
    instructions: 'For allergic rhinitis; may cause mild drowsiness',
  },
  {
    name: 'Tab. Amoxicillin 500mg',
    dosage: '1 Capsule',
    numberOfTimes: '3 times a day (Morning, Afternoon & Night)',
    timing: 'After Food',
    duration: '5 Days',
    instructions: 'Take every 8 hours after meals',
  },
  {
    name: 'Tab. Metformin 500mg',
    dosage: '1 Tablet',
    numberOfTimes: '2 times a day (Morning & Night)',
    timing: 'After Food',
    duration: '30 Days',
    instructions: 'Take strictly after breakfast and dinner',
  },
]

const NUMBER_OF_TIMES_OPTIONS = [
  '1 time a day (Morning only)',
  '1 time a day (Night only)',
  '2 times a day (Morning & Night)',
  '3 times a day (Morning, Afternoon & Night)',
  '4 times a day (Every 6 hours)',
  'SOS (As and when needed / Fever > 100°F)',
  'Every Alternate Day',
]

const TIMING_OPTIONS = [
  'After Food',
  'Before Food (Empty Stomach)',
  'With Food',
  'At Bedtime',
  'Between Meals',
]

const DURATION_OPTIONS = [
  '3 Days',
  '5 Days',
  '7 Days',
  '10 Days',
  '14 Days',
  '1 Month (30 Days)',
  'Ongoing / Long-term',
]

const DOSAGE_OPTIONS = [
  '1 Tablet',
  '2 Tablets',
  '1/2 Tablet',
  '1 Capsule',
  '5ml (1 Tsp)',
  '10ml (2 Tsp)',
]

export const AddVisitModal: React.FC<AddVisitModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [diagnosis, setDiagnosis] = useState('')
  const [doctorNotes, setDoctorNotes] = useState('')
  const [reportImageUrl, setReportImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [pastVisits, setPastVisits] = useState<VisitRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Prescribed Tablets list with tablet name and number of times it needs to be taken
  const [tablets, setTablets] = useState<TabletFormItem[]>([
    {
      name: '',
      dosage: '1 Tablet',
      numberOfTimes: '2 times a day (Morning & Night)',
      timing: 'After Food',
      duration: '5 Days',
      instructions: 'Take with water after meals',
    },
  ])
  const [followUpDate, setFollowUpDate] = useState('')

  useEffect(() => {
    if (appointment?.patientId) {
      loadPatientHistory(appointment.patientId)
    }
  }, [appointment])

  async function loadPatientHistory(patientId: string) {
    setLoadingHistory(true)
    try {
      const records = await api.getVisits(patientId)
      setPastVisits(records)
    } catch {
      // Non-blocking history load
    } finally {
      setLoadingHistory(false)
    }
  }

  function handleAddTablet() {
    setTablets((prev) => [
      ...prev,
      {
        name: '',
        dosage: '1 Tablet',
        numberOfTimes: '2 times a day (Morning & Night)',
        timing: 'After Food',
        duration: '5 Days',
        instructions: 'Take after meals',
      },
    ])
  }

  function handleAddPresetTablet(preset: TabletFormItem) {
    // If the first empty row is empty, replace it, otherwise append
    setTablets((prev) => {
      if (prev.length === 1 && !prev[0].name.trim()) {
        return [{ ...preset }]
      }
      return [...prev, { ...preset }]
    })
  }

  function handleRemoveTablet(index: number) {
    setTablets((prev) => prev.filter((_, i) => i !== index))
  }

  function handleTabletChange(index: number, field: keyof TabletFormItem, value: string) {
    setTablets((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size should be less than 10MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const base64Data = reader.result as string
      setImagePreview(base64Data)
      setUploadingImage(true)
      try {
        const uploadRes = await api.uploadReportImage(base64Data, 'hospital_reports')
        setReportImageUrl(uploadRes.url)
      } catch (err: any) {
        setUploadError(err.message || 'Cloudinary upload failed. Using local copy.')
        setReportImageUrl(base64Data)
      } finally {
        setUploadingImage(false)
      }
    }
    reader.readAsDataURL(file)
  }

  function handleRemoveImage() {
    setReportImageUrl('')
    setImagePreview(null)
    setUploadError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!appointment) return

    if (!diagnosis.trim()) {
      setError('Please provide a clinical diagnosis summary.')
      return
    }

    setSaving(true)
    setError('')

    // Format medicines with Tablet Name and Number of Times taken
    const validTablets = tablets.filter((t) => t.name && t.name.trim().length > 0)
    const formattedMedicines: PrescriptionMedicine[] = validTablets.map((t) => ({
      name: t.name.trim(),
      dosage: t.dosage || '1 Tablet',
      numberOfTimes: t.numberOfTimes || '2 times a day',
      timing: t.timing || 'After Food',
      frequency: `${t.numberOfTimes} (${t.timing})`,
      duration: t.duration || '5 Days',
      instructions: t.instructions.trim() || 'Take as directed',
    }))

    try {
      await api.completeConsultationQueue({
        appointmentId: appointment.id,
        diagnosisSummary: diagnosis.trim(),
        doctorNotes: doctorNotes.trim(),
        doctorAdvice: doctorNotes.trim(),
        medicines: formattedMedicines,
        followUpDate: followUpDate || '',
        reportImageUrl: reportImageUrl.trim() || undefined,
      })

      onSuccess(`Consultation completed and digital prescription slip issued for ${appointment.patient}.`)
      onClose()
      // Reset
      setDiagnosis('')
      setDoctorNotes('')
      setReportImageUrl('')
      setImagePreview(null)
      setTablets([
        {
          name: '',
          dosage: '1 Tablet',
          numberOfTimes: '2 times a day (Morning & Night)',
          timing: 'After Food',
          duration: '5 Days',
          instructions: 'Take with water after meals',
        },
      ])
      setFollowUpDate('')
    } catch (err: any) {
      setError(err.message || 'Could not save clinical visit record.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen || !appointment) return null

  const pre = appointment.preConsultation

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Consultation &amp; Issue Digital Prescription"
      subtitle={`Aarogya Hospital OPD • ${appointment.patient} (Token: ${appointment.queueToken || 'OPD'})`}
      maxWidth="800px"
    >
      {/* Patient Summary Header */}
      <div className="patient-mini-summary-box">
        <div className="summary-row">
          <span>Patient Name:</span>
          <strong>
            {appointment.patient} ({appointment.patientGender || 'N/A'}, Blood: {appointment.patientBloodGroup || 'N/A'})
          </strong>
        </div>
        <div className="summary-row">
          <span>Contact &amp; Email:</span>
          <strong>
            {appointment.patientPhone || 'N/A'} • {appointment.patientEmail || ''}
          </strong>
        </div>
        <div className="summary-row">
          <span>Chief Complaint:</span>
          <em>{appointment.reason}</em>
        </div>

        {/* Pre-Consultation Summary if submitted */}
        {pre && (pre.symptoms?.length || pre.knownAllergies || pre.currentMedications) && (
          <div
            style={{
              marginTop: '10px',
              padding: '10px 12px',
              background: '#eff6ff',
              borderRadius: '6px',
              border: '1px solid #bfdbfe',
              fontSize: '0.82rem',
            }}
          >
            <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: '4px' }}>
              Patient Pre-Consultation Intake
            </div>
            {pre.symptoms && pre.symptoms.length > 0 && (
              <div style={{ color: '#1e3a8a' }}>
                <strong>Reported Symptoms:</strong> {pre.symptoms.join(', ')} ({pre.symptomDuration || 'N/A'})
              </div>
            )}
            {pre.knownAllergies && (
              <div style={{ color: '#dc2626', fontWeight: 600, marginTop: '2px' }}>
                Allergies: {pre.knownAllergies}
              </div>
            )}
            {pre.currentMedications && (
              <div style={{ color: '#1e3a8a', marginTop: '2px' }}>
                <strong>Current Meds:</strong> {pre.currentMedications}
              </div>
            )}
          </div>
        )}

        {/* Past History Toggle */}
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="btn-link"
            style={{ fontSize: '0.82rem', fontWeight: 600, padding: 0 }}
          >
            {showHistory ? '▲ Hide Past Medical History' : `▼ View Patient History (${pastVisits.length} Previous Visits)`}
          </button>
        </div>

        {showHistory && (
          <div
            style={{
              marginTop: '8px',
              maxHeight: '160px',
              overflowY: 'auto',
              backgroundColor: '#ffffff',
              borderRadius: '6px',
              padding: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            {loadingHistory ? (
              <small>Loading past records...</small>
            ) : pastVisits.length > 0 ? (
              pastVisits.map((v) => (
                <div
                  key={v.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    paddingBottom: '6px',
                    marginBottom: '6px',
                    fontSize: '0.82rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1e40af', fontWeight: 600 }}>
                    <span>
                      {v.appointmentDate} • Dr. {v.doctorName}
                    </span>
                    <span>{v.department}</span>
                  </div>
                  <div style={{ color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>
                    Diagnosis: {v.diagnosisSummary}
                  </div>
                  <div style={{ color: '#64748b' }}>Notes: {v.doctorNotes}</div>
                </div>
              ))
            ) : (
              <small style={{ color: '#94a3b8' }}>No previous visit records on file for this patient.</small>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="custom-form" style={{ marginTop: '16px' }}>
        {error && <div className="form-alert-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="diag-sum" style={{ fontWeight: 600 }}>
            1. Clinical Diagnosis Summary *
          </label>
          <input
            id="diag-sum"
            type="text"
            required
            placeholder="e.g. Acute Upper Respiratory Tract Infection, Essential Hypertension"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="form-input"
          />
        </div>

        {/* Digital Prescription Tablet Builder */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #cbd5e1',
            padding: '18px',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1e3a8a', fontSize: '0.98rem' }}>
              <PrescriptionIcon size={18} color="#1e3a8a" />
              2. Digital Prescription: Tablets &amp; Dosage Schedule
            </div>
            <button
              type="button"
              onClick={handleAddTablet}
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <PlusIcon size={14} /> Add Another Tablet
            </button>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '12px' }}>
            Specify the tablet name and the exact number of times it needs to be taken daily.
          </p>

          {/* Quick-add preset chips */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.76rem', color: '#475569', fontWeight: 600, marginBottom: '6px' }}>
              Quick Common Tablet Presets (Tap to Add):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {COMMON_TABLET_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleAddPresetTablet(preset)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '14px',
                    fontSize: '0.76rem',
                    fontWeight: 500,
                    background: '#f1f5f9',
                    color: '#1e40af',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  + {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* List of Prescribed Tablets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {tablets.map((tab, index) => (
              <div
                key={index}
                style={{
                  background: '#f8fafc',
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#1e40af' }}>
                    Tablet #{index + 1}
                  </span>
                  {tablets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTablet(index)}
                      className="btn-danger-outline"
                      style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                      title="Remove this tablet"
                    >
                      <CrossIcon size={12} color="#dc2626" /> Remove Tablet
                    </button>
                  )}
                </div>

                {/* Grid of tablet details */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '3px' }}>
                      Tablet Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tab. Paracetamol 650mg, Tab. Pantocid 40mg"
                      value={tab.name}
                      onChange={(e) => handleTabletChange(index, 'name', e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.88rem', padding: '7px 10px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '3px' }}>
                      Dosage (Quantity)
                    </label>
                    <select
                      value={tab.dosage}
                      onChange={(e) => handleTabletChange(index, 'dosage', e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.88rem', padding: '7px 10px' }}
                    >
                      {DOSAGE_OPTIONS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Number of times & Timing Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e40af', display: 'block', marginBottom: '3px' }}>
                      Number of Times to be Taken *
                    </label>
                    <select
                      value={tab.numberOfTimes}
                      onChange={(e) => handleTabletChange(index, 'numberOfTimes', e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.88rem', padding: '7px 10px', fontWeight: 600, color: '#1e3a8a' }}
                    >
                      {NUMBER_OF_TIMES_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '3px' }}>
                      Meal Timing
                    </label>
                    <select
                      value={tab.timing}
                      onChange={(e) => handleTabletChange(index, 'timing', e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.88rem', padding: '7px 10px' }}
                    >
                      {TIMING_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '3px' }}>
                      Duration
                    </label>
                    <select
                      value={tab.duration}
                      onChange={(e) => handleTabletChange(index, 'duration', e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.88rem', padding: '7px 10px' }}
                    >
                      {DURATION_OPTIONS.map((dur) => (
                        <option key={dur} value={dur}>
                          {dur}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Instructions Input */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '3px' }}>
                    Special Instructions / Notes for Patient
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Swallow whole with a full glass of water, do not take on empty stomach"
                    value={tab.instructions}
                    onChange={(e) => handleTabletChange(index, 'instructions', e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.84rem', padding: '6px 10px' }}
                  />
                </div>

                {/* Live Badge Preview */}
                {tab.name && (
                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '0.8rem',
                      color: '#065f46',
                      background: '#ecfdf5',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      display: 'inline-block',
                    }}
                  >
                    Take: <strong>{tab.name}</strong> ({tab.dosage}) — <strong>{tab.numberOfTimes}</strong> ({tab.timing}) for <strong>{tab.duration}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Follow-up review date */}
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
              Recommended Next Follow-up Review:
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="form-input"
              style={{ maxWidth: '220px', fontSize: '0.88rem', padding: '6px 10px' }}
            />
          </div>
        </div>

        {/* Doctor Clinical Notes & Lifestyle Advice */}
        <div className="form-group">
          <label htmlFor="doc-notes" style={{ fontWeight: 600 }}>
            3. Doctor Clinical Notes &amp; Dietary/Lifestyle Advice *
          </label>
          <textarea
            id="doc-notes"
            rows={3}
            required
            placeholder="Enter clinical examination notes, vitals, lifestyle modifications, and guidance..."
            value={doctorNotes}
            onChange={(e) => setDoctorNotes(e.target.value)}
            className="form-textarea"
          />
        </div>

        {/* Cloudinary Diagnostic Image Upload */}
        <div className="form-group">
          <label style={{ fontWeight: 600 }}>
            4. Diagnostic Report / Test Image (Optional Cloudinary Upload)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="form-file-input"
              disabled={uploadingImage}
            />
            {uploadingImage && <small style={{ color: '#2563eb' }}>Uploading to Cloudinary...</small>}
            {reportImageUrl && !uploadingImage && (
              <small style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircleIcon size={14} color="#16a34a" /> Report Ready
              </small>
            )}
          </div>
          {uploadError && <div style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: '4px' }}>{uploadError}</div>}

          {imagePreview && (
            <div style={{ marginTop: '10px', display: 'inline-block', position: 'relative' }}>
              <img
                src={imagePreview}
                alt="Report preview"
                style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CrossIcon size={12} color="#ffffff" />
              </button>
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: '22px' }}>
          <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>
            Cancel
          </button>
          <button type="submit" disabled={saving || uploadingImage} className="btn-primary">
            {saving ? 'Completing & Issuing...' : 'Complete Consultation & Issue Digital Prescription'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
