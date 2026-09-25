import React, { useState, useEffect } from 'react'
import { api, type Doctor, type PreConsultationData } from '../../services/api'
import { Modal } from '../../components/Modal'
import { CreditCardIcon, CheckCircleIcon, CalendarIcon, StethoscopeIcon } from '../../components/Icons'
import { SimulatedPaymentGateway } from './SimulatedPaymentGateway'

interface BookAppointmentModalProps {
  doctor: Doctor | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (message: string) => void
}

const COMMON_SYMPTOMS = [
  'Fever & Chills',
  'Chest Pain / Discomfort',
  'Breathlessness / Shortness of Breath',
  'Headache / Migraine',
  'Persistent Cough / Sore Throat',
  'Abdominal Pain / Acidity',
  'Joint / Back Pain',
  'Skin Rash / Itching',
  'Dizziness / Weakness',
]

const COMMON_CONDITIONS = [
  'Hypertension (BP)',
  'Type 2 Diabetes',
  'Asthma / Respiratory',
  'Thyroid Disorder',
  'Cardiac Condition',
  'None / Healthy',
]

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  doctor,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)

  // Step 1: Slot
  const [date, setDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotMessage, setSlotMessage] = useState('')
  const [patientConflictsCount, setPatientConflictsCount] = useState(0)

  // Step 2: Pre-Consultation
  const [reason, setReason] = useState('')
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [symptomDuration, setSymptomDuration] = useState('1-3 Days')
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [currentMedications, setCurrentMedications] = useState('')
  const [knownAllergies, setKnownAllergies] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')

  const [error, setError] = useState('')

  // 2 Weeks Selection Window (Today to Today + 14 days)
  const today = new Date()
  const minDate = today.toISOString().slice(0, 10)
  const maxDateObj = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
  const maxDate = maxDateObj.toISOString().slice(0, 10)

  // Generate 14-day date options
  const twoWeekDates = Array.from({ length: 15 }, (_, i) => {
    const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
    const dateStr = d.toISOString().slice(0, 10)
    const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' })
    const monthLabel = d.toLocaleDateString('en-US', { month: 'short' })
    const dayNum = d.getDate()
    return { dateStr, dayLabel, monthLabel, dayNum }
  })

  useEffect(() => {
    if (doctor && date) {
      fetchSlots(doctor.id, date)
    } else {
      setAvailableSlots([])
      setSelectedSlot('')
      setSlotMessage('')
      setPatientConflictsCount(0)
    }
  }, [doctor, date])

  async function fetchSlots(doctorId: string, selectedDate: string) {
    setLoadingSlots(true)
    setError('')
    setSelectedSlot('')
    setPatientConflictsCount(0)
    try {
      const data = await api.getAvailableSlots(doctorId, selectedDate)
      setAvailableSlots(data.availableSlots || [])
      setPatientConflictsCount((data as any).patientConflictSlots?.length || 0)
      setSlotMessage(data.message || (data.availableSlots.length === 0 ? 'No slots available for this date.' : ''))
    } catch (err: any) {
      setError(err.message || 'Could not calculate available slots.')
    } finally {
      setLoadingSlots(false)
    }
  }

  function toggleSymptom(sym: string) {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    )
  }

  function toggleCondition(cond: string) {
    setSelectedConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
    )
  }

  function handleNextToStep2() {
    if (!date) {
      setError('Please select an appointment date within the 2-week window.')
      return
    }
    if (!selectedSlot) {
      setError('Please choose an available time slot.')
      return
    }
    setError('')
    setCurrentStep(2)
  }

  function handleNextToStep3() {
    if (!reason.trim()) {
      setError('Please describe your chief complaint or symptoms.')
      return
    }
    setError('')
    setCurrentStep(3)
  }



  function handleClose() {
    setCurrentStep(1)
    setDate('')
    setSelectedSlot('')
    setReason('')
    setSelectedSymptoms([])
    setSelectedConditions([])
    setCurrentMedications('')
    setKnownAllergies('')
    setAdditionalNotes('')
    setError('')
    onClose()
  }

  if (!doctor) return null

  const totalFee = doctor.consultationFee || 500
  const advanceAmount = 200
  const balanceAmount = Math.max(0, totalFee - advanceAmount)

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Book Doctor Appointment"
      subtitle={`Schedule a consultation with ${doctor.name}`}
      maxWidth="680px"
    >
      {/* Multi-Step Indicator Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '14px',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: currentStep >= 1 ? '#1e40af' : '#e2e8f0',
              color: currentStep >= 1 ? '#ffffff' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            1
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: currentStep === 1 ? 700 : 500, color: currentStep === 1 ? '#1e40af' : '#64748b' }}>
            Date &amp; Slot
          </span>
        </div>

        <div style={{ flex: 1, height: '2px', background: currentStep >= 2 ? '#1e40af' : '#e2e8f0', margin: '0 10px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: currentStep >= 2 ? '#1e40af' : '#e2e8f0',
              color: currentStep >= 2 ? '#ffffff' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            2
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: currentStep === 2 ? 700 : 500, color: currentStep === 2 ? '#1e40af' : '#64748b' }}>
            Pre-Consultation
          </span>
        </div>

        <div style={{ flex: 1, height: '2px', background: currentStep === 3 ? '#1e40af' : '#e2e8f0', margin: '0 10px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: currentStep === 3 ? '#1e40af' : '#e2e8f0',
              color: currentStep === 3 ? '#ffffff' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            3
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: currentStep === 3 ? 700 : 500, color: currentStep === 3 ? '#1e40af' : '#64748b' }}>
            Advance Payment
          </span>
        </div>
      </div>

      {/* Doctor Summary Strip */}
      <div className="booking-doctor-banner" style={{ marginBottom: '18px' }}>
        <div className="banner-details">
          <div className="banner-name">{doctor.name}</div>
          <div className="banner-sub">
            {doctor.specialization} • {doctor.department}
          </div>
          <div className="banner-fee">
            Total Consultation Fee: <strong>₹{Number(totalFee).toFixed(0)}</strong> (Advance: ₹200)
          </div>
        </div>
      </div>

      {error && <div className="form-alert-error">{error}</div>}

      {/* STEP 1: Date & Time Slot */}
      {currentStep === 1 && (
        <div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label htmlFor="book-date" style={{ fontWeight: 600 }}>1. Select Appointment Date (Next 2 Weeks) *</label>
              <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 600 }}>14-Day Advance Window</span>
            </div>

            {/* Quick 2-week date selector chips */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '8px',
                marginBottom: '10px',
              }}
            >
              {twoWeekDates.map((item) => {
                const isSelected = date === item.dateStr
                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => setDate(item.dateStr)}
                    style={{
                      flexShrink: 0,
                      minWidth: '65px',
                      padding: '8px 6px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #1e40af' : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isSelected ? '#1e40af' : '#64748b', textTransform: 'uppercase' }}>
                      {item.dayLabel}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: isSelected ? '#1e40af' : '#0f172a', margin: '2px 0' }}>
                      {item.dayNum}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: isSelected ? '#1e40af' : '#94a3b8' }}>
                      {item.monthLabel}
                    </div>
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                id="book-date"
                type="date"
                min={minDate}
                max={maxDate}
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-input"
                style={{ flex: 1 }}
              />
              {date && (
                <span style={{ fontSize: '0.82rem', color: '#16a34a', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  Selected: {new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>2. Choose Available Time Slot *</label>
            {loadingSlots ? (
              <div className="slot-loading">Checking doctor schedule and existing bookings...</div>
            ) : date ? (
              availableSlots.length > 0 ? (
                <div className="slots-grid">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot === slot
                    return (
                      <button
                        key={slot}
                        type="button"
                        className={`slot-chip ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="slot-empty-notice">{slotMessage || 'No available slots on this day.'}</div>
              )
            ) : (
              <div className="slot-hint">Please choose a date above to view available consultation slots.</div>
            )}

            {patientConflictsCount > 0 && (
              <div
                style={{
                  marginTop: '10px',
                  fontSize: '0.82rem',
                  color: '#0369a1',
                  backgroundColor: '#f0f9ff',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #bae6fd',
                  lineHeight: 1.45,
                }}
              >
                Note: You already have another doctor consultation scheduled on this date. Overlapping time slots have been filtered out to prevent scheduling conflicts.
              </div>
            )}
          </div>

          <div className="modal-actions" style={{ marginTop: '24px' }}>
            <button type="button" onClick={handleClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedSlot || !date}
              onClick={handleNextToStep2}
              className="btn-primary"
            >
              Continue to Pre-Consultation &rarr;
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Clinical Pre-Consultation Form */}
      {currentStep === 2 && (
        <div>
          <div className="form-group">
            <label htmlFor="chief-reason">Chief Complaint &amp; Reason for Consultation *</label>
            <textarea
              id="chief-reason"
              rows={2}
              required
              placeholder="e.g. Mild chest flutter, headache after working hours, routine health check..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="form-textarea"
            />
          </div>

          <div className="form-group">
            <label>Select Observed Symptoms (Tap to toggle)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
              {COMMON_SYMPTOMS.map((sym) => {
                const active = selectedSymptoms.includes(sym)
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '16px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      border: active ? '1px solid #1e40af' : '1px solid #cbd5e1',
                      background: active ? '#eff6ff' : '#f8fafc',
                      color: active ? '#1e40af' : '#334155',
                    }}
                  >
                    {active ? '✓ ' : '+ '}
                    {sym}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label>Symptom Duration</label>
              <select
                value={symptomDuration}
                onChange={(e) => setSymptomDuration(e.target.value)}
                className="form-input"
              >
                <option value="Less than 24 hours">Less than 24 hours</option>
                <option value="1-3 Days">1 - 3 Days</option>
                <option value="1 Week">1 Week</option>
                <option value="2-4 Weeks">2 - 4 Weeks</option>
                <option value="Chronic / Over 1 Month">Chronic / Over 1 Month</option>
              </select>
            </div>

            <div className="form-group">
              <label>Known Drug Allergies</label>
              <input
                type="text"
                placeholder="e.g. Penicillin, Sulfa, None"
                value={knownAllergies}
                onChange={(e) => setKnownAllergies(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Existing Medical Conditions</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
              {COMMON_CONDITIONS.map((cond) => {
                const active = selectedConditions.includes(cond)
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleCondition(cond)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      border: active ? '1px solid #047857' : '1px solid #cbd5e1',
                      background: active ? '#ecfdf5' : '#ffffff',
                      color: active ? '#047857' : '#475569',
                    }}
                  >
                    {cond}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="form-group">
            <label>Current Medications (if any)</label>
            <input
              type="text"
              placeholder="e.g. Metformin 500mg, Telmisartan 40mg daily"
              value={currentMedications}
              onChange={(e) => setCurrentMedications(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button type="button" onClick={() => setCurrentStep(1)} className="btn-secondary">
              &larr; Back to Slot
            </button>
            <button
              type="button"
              disabled={!reason.trim()}
              onClick={handleNextToStep3}
              className="btn-primary"
            >
              Proceed to Advance Payment &rarr;
            </button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <SimulatedPaymentGateway
          doctor={doctor}
          appointmentDate={date}
          appointmentTime={selectedSlot}
          onBack={() => setCurrentStep(2)}
          onPayAndConfirm={async (method) => {
            const preConsultationData: PreConsultationData = {
              reason: reason.trim(),
              symptoms: selectedSymptoms,
              symptomDuration,
              existingConditions: selectedConditions,
              currentMedications: currentMedications.trim(),
              knownAllergies: knownAllergies.trim(),
              additionalNotes: additionalNotes.trim(),
            }

            const res = await api.createAppointment({
              doctorId: doctor.id,
              appointmentDate: date,
              appointmentTime: selectedSlot,
              reason: reason.trim(),
              advancePaid: 200,
              paymentMethod: method,
              preConsultation: preConsultationData,
            })

            onSuccess(
              `Appointment confirmed with ${doctor.name} on ${date} at ${selectedSlot}. Advance payment of ₹200 verified.`
            )

            return {
              appointmentId: res.id,
              receiptNumber: res.receiptNumber,
              transactionReference: res.transactionReference,
              totalFee: res.totalFee || doctor.consultationFee || 500,
              remainingBalance: res.remainingBalance ?? Math.max(0, (doctor.consultationFee || 500) - 200),
              advancePaid: res.advancePaid ?? 200,
            }
          }}
        />
      )}
    </Modal>
  )
}
