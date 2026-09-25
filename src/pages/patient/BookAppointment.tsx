import React, { useState, useEffect } from 'react'
import {
  api,
  type Doctor,
  type PreConsultationData,
  type Department,
} from '../../services/api'
import { SimulatedPaymentGateway, type PaymentSuccessResult } from './SimulatedPaymentGateway'
import {
  CalendarIcon,
  StethoscopeIcon,
  CheckCircleIcon,
  ClockIcon,
  BuildingIcon,
  PlusIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
} from '../../components/Icons'

interface BookAppointmentProps {
  onNotify: (message: string) => void
  onNavigate: (tab: string) => void
  initialDoctorId?: string
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

export const BookAppointment: React.FC<BookAppointmentProps> = ({
  onNotify,
  onNavigate,
  initialDoctorId,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)

  // Doctors & Departments
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDoctorId || '')
  const [loadingDoctors, setLoadingDoctors] = useState(true)

  // Step 1: Date & Slot
  const [date, setDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotMessage, setSlotMessage] = useState('')
  const [patientConflictsCount, setPatientConflictsCount] = useState(0)

  // Step 2: Clinical Intake
  const [reason, setReason] = useState('')
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [symptomDuration, setSymptomDuration] = useState('1-3 Days')
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [currentMedications, setCurrentMedications] = useState('')
  const [knownAllergies, setKnownAllergies] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')

  // Step 4: Success Result
  const [successResult, setSuccessResult] = useState<PaymentSuccessResult | null>(null)
  const [error, setError] = useState('')

  // 14-Day Advance Booking Window
  const today = new Date()
  const minDate = today.toISOString().slice(0, 10)
  const maxDateObj = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
  const maxDate = maxDateObj.toISOString().slice(0, 10)

  const twoWeekDates = Array.from({ length: 15 }, (_, i) => {
    const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
    const dateStr = d.toISOString().slice(0, 10)
    const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' })
    const monthLabel = d.toLocaleDateString('en-US', { month: 'short' })
    const dayNum = d.getDate()
    return { dateStr, dayLabel, monthLabel, dayNum }
  })

  useEffect(() => {
    loadDoctorsAndDepts()
  }, [])

  useEffect(() => {
    if (selectedDoctorId && date) {
      fetchSlots(selectedDoctorId, date)
    } else {
      setAvailableSlots([])
      setSelectedSlot('')
      setSlotMessage('')
      setPatientConflictsCount(0)
    }
  }, [selectedDoctorId, date])

  async function loadDoctorsAndDepts() {
    setLoadingDoctors(true)
    try {
      const [docs, depts] = await Promise.all([api.getDoctors(), api.getDepartments()])
      setDoctors(docs)
      setDepartments(depts)
      if (initialDoctorId && docs.some((d) => d.id === initialDoctorId)) {
        setSelectedDoctorId(initialDoctorId)
      } else if (docs.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(docs[0].id)
      }
    } catch (err: any) {
      console.warn('Error loading doctors for booking page:', err)
    } finally {
      setLoadingDoctors(false)
    }
  }

  async function fetchSlots(docId: string, selectedDate: string) {
    setLoadingSlots(true)
    setError('')
    setSelectedSlot('')
    setPatientConflictsCount(0)
    try {
      const data = await api.getAvailableSlots(docId, selectedDate)
      setAvailableSlots(data.availableSlots || [])
      setPatientConflictsCount((data as any).patientConflictSlots?.length || 0)
      setSlotMessage(data.message || (data.availableSlots.length === 0 ? 'No slots available for this date.' : ''))
    } catch (err: any) {
      setError(err.message || 'Could not calculate available slots.')
    } finally {
      setLoadingSlots(false)
    }
  }

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId) || null

  function toggleSymptom(sym: string) {
    setSelectedSymptoms((prev) => (prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]))
  }

  function toggleCondition(cond: string) {
    setSelectedConditions((prev) => (prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]))
  }

  function handleProceedToClinical() {
    if (!selectedDoctorId) {
      setError('Please select a consulting doctor.')
      return
    }
    if (!date) {
      setError('Please choose an appointment date within the 14-day window.')
      return
    }
    if (!selectedSlot) {
      setError('Please choose an available consultation time slot.')
      return
    }
    setError('')
    setCurrentStep(2)
  }

  function handleProceedToPayment() {
    if (!reason.trim()) {
      setError('Please provide the primary reason or symptoms for this consultation.')
      return
    }
    setError('')
    setCurrentStep(3)
  }

  async function handlePaymentAndConfirm(paymentMethod: string) {
    if (!selectedDoctor) throw new Error('No doctor selected')

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
      doctorId: selectedDoctor.id,
      appointmentDate: date,
      appointmentTime: selectedSlot,
      reason: reason.trim(),
      advancePaid: 200,
      paymentMethod,
      preConsultation: preConsultationData,
    })

    onNotify(`Appointment confirmed with ${selectedDoctor.name}. Advance payment of ₹200 verified.`)

    return {
      appointmentId: res.id,
      receiptNumber: res.receiptNumber,
      transactionReference: res.transactionReference,
      totalFee: res.totalFee || selectedDoctor.consultationFee || 500,
      remainingBalance: res.remainingBalance ?? Math.max(0, (selectedDoctor.consultationFee || 500) - 200),
      advancePaid: res.advancePaid ?? 200,
    }
  }

  function handleResetBooking() {
    setCurrentStep(1)
    setDate('')
    setSelectedSlot('')
    setReason('')
    setSelectedSymptoms([])
    setSelectedConditions([])
    setCurrentMedications('')
    setKnownAllergies('')
    setAdditionalNotes('')
    setSuccessResult(null)
    setError('')
  }

  return (
    <div className="page-content">
      {/* Header Banner */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="page-title">Book Doctor Consultation</h1>
          <p className="page-subtitle">
            Schedule an OPD specialist appointment with secure online advance token deposit
          </p>
        </div>
      </div>

      {/* 4-Step Clinical Breadcrumb Progress */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff',
          padding: '16px 24px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: currentStep >= 1 ? '#1d4ed8' : '#e2e8f0',
              color: currentStep >= 1 ? '#ffffff' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            {currentStep > 1 ? <CheckIcon size={16} /> : '1'}
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: currentStep === 1 ? 700 : 500, color: currentStep === 1 ? '#1d4ed8' : '#0f172a' }}>
              Doctor &amp; Slot
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Select specialist &amp; 14-day date</div>
          </div>
        </div>

        <div style={{ flex: 1, height: '2px', backgroundColor: currentStep >= 2 ? '#1d4ed8' : '#e2e8f0', margin: '0 16px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: currentStep >= 2 ? '#1d4ed8' : '#e2e8f0',
              color: currentStep >= 2 ? '#ffffff' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            {currentStep > 2 ? <CheckIcon size={16} /> : '2'}
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: currentStep === 2 ? 700 : 500, color: currentStep === 2 ? '#1d4ed8' : '#0f172a' }}>
              Pre-Consultation
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Symptoms &amp; clinical history</div>
          </div>
        </div>

        <div style={{ flex: 1, height: '2px', backgroundColor: currentStep >= 3 ? '#1d4ed8' : '#e2e8f0', margin: '0 16px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: currentStep >= 3 ? '#1d4ed8' : '#e2e8f0',
              color: currentStep >= 3 ? '#ffffff' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            {currentStep > 3 ? <CheckIcon size={16} /> : '3'}
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: currentStep === 3 ? 700 : 500, color: currentStep === 3 ? '#1d4ed8' : '#0f172a' }}>
              Advance Payment
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>₹200 online token deposit</div>
          </div>
        </div>
      </div>

      {error && <div className="form-alert-error" style={{ marginBottom: '18px' }}>{error}</div>}

      {currentStep === 1 && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          {/* Doctor Dropdown Selector */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label htmlFor="doctor-select" style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
              1. Select Consulting Specialist *
            </label>
            <select
              id="doctor-select"
              value={selectedDoctorId}
              onChange={(e) => {
                setSelectedDoctorId(e.target.value)
                setSelectedSlot('')
              }}
              className="form-input"
              style={{ fontSize: '0.92rem', padding: '10px 14px' }}
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} — {doc.specialization} ({doc.department}) | Fee: ₹{doc.consultationFee || 500}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Doctor Summary Card */}
          {selectedDoctor && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                marginBottom: '22px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', backgroundColor: '#e0f2fe', borderRadius: '8px' }}>
                  <StethoscopeIcon size={24} color="#0369a1" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>{selectedDoctor.name}</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    {selectedDoctor.specialization} • {selectedDoctor.department}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>Consultation Fee</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1d4ed8' }}>
                  ₹{(selectedDoctor.consultationFee || 500).toFixed(2)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 600 }}>
                  ₹200.00 Advance Online Deposit
                </div>
              </div>
            </div>
          )}

          {/* 14-Day Calendar Window Chips */}
          <div className="form-group" style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label htmlFor="fullpage-book-date" style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                2. Choose Appointment Date (Next 14 Days) *
              </label>
              <span style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600 }}>2-Week Advance Booking</span>
            </div>

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
                      minWidth: '68px',
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #1d4ed8' : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isSelected ? '#1d4ed8' : '#64748b', textTransform: 'uppercase' }}>
                      {item.dayLabel}
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: isSelected ? '#1d4ed8' : '#0f172a', margin: '2px 0' }}>
                      {item.dayNum}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: isSelected ? '#1d4ed8' : '#94a3b8' }}>
                      {item.monthLabel}
                    </div>
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                id="fullpage-book-date"
                type="date"
                min={minDate}
                max={maxDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-input"
                style={{ maxWidth: '240px' }}
              />
              {date && (
                <span style={{ fontSize: '0.84rem', color: '#15803d', fontWeight: 600 }}>
                  Selected Date:{' '}
                  {new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Time Slot Chips */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
              3. Available OPD Time Slots *
            </label>
            {loadingSlots ? (
              <div style={{ padding: '16px', color: '#64748b', fontSize: '0.88rem' }}>
                Checking doctor clinic schedule and existing bookings...
              </div>
            ) : date ? (
              availableSlots.length > 0 ? (
                <div className="slots-grid" style={{ marginTop: '10px' }}>
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
                <div className="slot-empty-notice" style={{ marginTop: '10px' }}>
                  {slotMessage || 'No available consultation slots on this date.'}
                </div>
              )
            ) : (
              <div className="slot-hint" style={{ marginTop: '8px' }}>
                Please pick a date above to display active consultation slots.
              </div>
            )}

            {patientConflictsCount > 0 && (
              <div
                style={{
                  marginTop: '12px',
                  fontSize: '0.82rem',
                  color: '#0369a1',
                  backgroundColor: '#f0f9ff',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #bae6fd',
                }}
              >
                Scheduling Protection: Overlapping slots with your existing appointments on this date have been filtered out automatically.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              disabled={!selectedDoctorId || !date || !selectedSlot}
              onClick={handleProceedToClinical}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              Continue to Clinical Intake <ArrowRightIcon size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: PRE-CONSULTATION INTAKE ================= */}
      {currentStep === 2 && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
              Pre-Consultation Clinical Intake
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
              This data is delivered directly to {selectedDoctor?.name} prior to your visit.
            </p>
          </div>

          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label htmlFor="fullpage-reason" style={{ fontWeight: 700 }}>
              Primary Reason &amp; Chief Complaint *
            </label>
            <textarea
              id="fullpage-reason"
              rows={2}
              required
              placeholder="Describe what you are experiencing (e.g. persistent fever, chest tightness, knee pain)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label style={{ fontWeight: 700 }}>Common Symptoms (Select all that apply)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
              {COMMON_SYMPTOMS.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym)
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      border: isSelected ? '1.5px solid #1d4ed8' : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
                      color: isSelected ? '#1d4ed8' : '#334155',
                      cursor: 'pointer',
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {sym}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
            <div className="form-group">
              <label style={{ fontWeight: 700 }}>Duration of Symptoms</label>
              <select
                value={symptomDuration}
                onChange={(e) => setSymptomDuration(e.target.value)}
                className="form-input"
              >
                <option value="Less than 24 Hours">Less than 24 Hours</option>
                <option value="1-3 Days">1-3 Days</option>
                <option value="1 Week">1 Week</option>
                <option value="2-4 Weeks">2-4 Weeks</option>
                <option value="Chronic (Months)">Chronic (Months)</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 700 }}>Known Drug Allergies</label>
              <input
                type="text"
                placeholder="e.g. Penicillin, Sulfa drugs, None"
                value={knownAllergies}
                onChange={(e) => setKnownAllergies(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label style={{ fontWeight: 700 }}>Existing Medical Conditions</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
              {COMMON_CONDITIONS.map((cond) => {
                const isSelected = selectedConditions.includes(cond)
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleCondition(cond)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      border: isSelected ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? '#f0fdf4' : '#f8fafc',
                      color: isSelected ? '#15803d' : '#334155',
                      cursor: 'pointer',
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {cond}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div className="form-group">
              <label style={{ fontWeight: 700 }}>Current Medications</label>
              <input
                type="text"
                placeholder="e.g. Metformin 500mg, Telmisartan 40mg"
                value={currentMedications}
                onChange={(e) => setCurrentMedications(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 700 }}>Additional Clinical Notes</label>
              <input
                type="text"
                placeholder="Any special accommodations or concerns..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeftIcon size={14} /> Back to Doctor &amp; Slot
            </button>

            <button
              type="button"
              disabled={!reason.trim()}
              onClick={handleProceedToPayment}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              Proceed to Advance Payment <ArrowRightIcon size={16} />
            </button>
          </div>
        </div>
      )}

      {currentStep === 3 && selectedDoctor && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <SimulatedPaymentGateway
            doctor={selectedDoctor}
            appointmentDate={date}
            appointmentTime={selectedSlot}
            onBack={() => setCurrentStep(2)}
            onPayAndConfirm={handlePaymentAndConfirm}
            onSuccessDone={(result) => {
              setSuccessResult(result)
              setCurrentStep(4)
            }}
            onNavigate={onNavigate}
          />
        </div>
      )}

      {currentStep === 4 && successResult && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #bbf7d0', padding: '28px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                display: 'inline-flex',
                padding: '14px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                marginBottom: '12px',
              }}
            >
              <CheckCircleIcon size={40} color="#15803d" />
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#14532d', margin: '0 0 6px 0' }}>
              Appointment Confirmed &amp; Advance Paid
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0 }}>
              Your consultation token has been generated. You can download your official payment receipt below.
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '20px',
              maxWidth: '600px',
              margin: '0 auto 24px auto',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.88rem' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.76rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  Doctor
                </span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{successResult.doctor.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{successResult.doctor.specialization}</div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.76rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  Scheduled Time
                </span>
                <div style={{ fontWeight: 700, color: '#1d4ed8' }}>
                  {successResult.date} at {successResult.time}
                </div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.76rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  Receipt Number
                </span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{successResult.receiptNumber}</div>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '0.76rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  Transaction Ref
                </span>
                <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.82rem' }}>
                  {successResult.transactionReference}
                </div>
              </div>
            </div>

            <div style={{ margin: '16px 0', borderTop: '1px dashed #cbd5e1' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
              <span>Total Consultation Fee:</span>
              <span style={{ fontWeight: 600 }}>₹{successResult.totalFee.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: '#15803d', fontWeight: 700, marginBottom: '6px' }}>
              <span>Advance Paid Online:</span>
              <span>₹{successResult.amountPaid.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: '#64748b' }}>
              <span>Remaining Balance Payable at OPD Reception:</span>
              <span style={{ fontWeight: 700, color: '#334155' }}>₹{successResult.remainingBalance.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleResetBooking}
              className="btn-secondary"
            >
              Book Another Appointment
            </button>
            <button
              type="button"
              onClick={() => onNavigate('live-waiting-room')}
              className="btn-secondary"
            >
              Go to Live Waiting Room
            </button>
            <button
              type="button"
              onClick={() => onNavigate('my-appointments')}
              className="btn-primary"
            >
              View in My Appointments &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
