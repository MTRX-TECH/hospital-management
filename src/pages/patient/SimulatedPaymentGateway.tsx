import React, { useState, useEffect } from 'react'
import {
  CreditCardIcon,
  QrCodeIcon,
  BankIcon,
  ShieldCheckIcon,
  LockIcon,
  CheckCircleIcon,
  CheckIcon,
  DownloadIcon,
  CalendarIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  SmartphoneIcon,
} from '../../components/Icons'
import { generateUpiQRCode } from '../../utils/qrCode'
import { downloadReceiptImage, type ReceiptData } from '../../utils/receiptGenerator'
import { api, type Doctor } from '../../services/api'

export interface PaymentSuccessResult {
  appointmentId: string
  receiptNumber: string
  transactionReference: string
  amountPaid: number
  totalFee: number
  remainingBalance: number
  paymentMethod: string
  doctor: Doctor
  date: string
  time: string
  patientName?: string
}

interface SimulatedPaymentGatewayProps {
  doctor: Doctor
  appointmentDate: string
  appointmentTime: string
  onBack: () => void
  onPayAndConfirm: (paymentMethod: string) => Promise<{
    appointmentId: string
    receiptNumber?: string
    transactionReference?: string
    totalFee?: number
    remainingBalance?: number
    advancePaid?: number
  }>
  onSuccessDone?: (result: PaymentSuccessResult) => void
  onNavigate?: (tab: string) => void
}

const POPULAR_INDIAN_BANKS = [
  { id: 'SBI', name: 'State Bank of India', code: 'SBI', popular: true },
  { id: 'HDFC', name: 'HDFC Bank', code: 'HDFC', popular: true },
  { id: 'ICICI', name: 'ICICI Bank', code: 'ICICI', popular: true },
  { id: 'AXIS', name: 'Axis Bank', code: 'UTIB', popular: true },
  { id: 'PNB', name: 'Punjab National Bank', code: 'PUNB', popular: false },
  { id: 'KOTAK', name: 'Kotak Mahindra Bank', code: 'KKBK', popular: false },
]

export const SimulatedPaymentGateway: React.FC<SimulatedPaymentGatewayProps> = ({
  doctor,
  appointmentDate,
  appointmentTime,
  onBack,
  onPayAndConfirm,
  onSuccessDone,
  onNavigate,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI')

  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>('')
  const [upiId, setUpiId] = useState('patient.aarogya@okaxis')
  const [upiVerified, setUpiVerified] = useState(true)
  const [verifyingUpi, setVerifyingUpi] = useState(false)
  const [selectedUpiApp, setSelectedUpiApp] = useState<'GPAY' | 'PHONEPE' | 'PAYTM' | 'BHIM'>('GPAY')

  const [cardNumber, setCardNumber] = useState('4532 8910 2345 6789')
  const [cardHolder, setCardHolder] = useState('PATIENT NAME')
  const [cardExpiry, setCardExpiry] = useState('08/28')
  const [cardCvv, setCardCvv] = useState('889')
  const [cardType, setCardType] = useState<'RUPAY' | 'VISA' | 'MASTERCARD'>('RUPAY')

  const [selectedBank, setSelectedBank] = useState('SBI')

  const [processingState, setProcessingState] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE')
  const [processingStage, setProcessingStage] = useState('')
  const [paymentResult, setPaymentResult] = useState<PaymentSuccessResult | null>(null)
  const [downloadingReceipt, setDownloadingReceipt] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const advanceAmount = 200
  const totalFee = doctor.consultationFee || 500
  const balanceDue = Math.max(0, totalFee - advanceAmount)

  useEffect(() => {
    async function makeQr() {
      try {
        const upiUri = `upi://pay?pa=hospital.aarogya@icici&pn=Aarogya+Hospital&am=${advanceAmount}.00&cu=INR&tn=OPD-Token-${encodeURIComponent(
          doctor.name
        )}`
        const url = await generateUpiQRCode(upiUri, { width: 200, margin: 1 })
        setUpiQrDataUrl(url)
      } catch (err) {
        console.warn('QR generation error:', err)
      }
    }
    makeQr()
  }, [doctor.name, advanceAmount])

  function handleVerifyUpi() {
    if (!upiId || !upiId.includes('@')) {
      setErrorMessage('Please enter a valid UPI ID (e.g. mobile@upi, username@okhdfcbank)')
      return
    }
    setVerifyingUpi(true)
    setErrorMessage('')
    window.setTimeout(() => {
      setVerifyingUpi(false)
      setUpiVerified(true)
    }, 500)
  }

  function handleQuickUpiApp(app: 'GPAY' | 'PHONEPE' | 'PAYTM' | 'BHIM') {
    setSelectedUpiApp(app)
    setUpiVerified(true)
    if (app === 'GPAY') setUpiId('patient@okhdfcbank')
    if (app === 'PHONEPE') setUpiId('patient@ybl')
    if (app === 'PAYTM') setUpiId('patient@paytm')
    if (app === 'BHIM') setUpiId('patient@upi')
  }

  function handleCardNumberChange(val: string) {
    const raw = val.replace(/\D/g, '').slice(0, 16)
    const formatted = raw.replace(/(\d{4})/g, '$1 ').trim()
    setCardNumber(formatted)
    if (raw.startsWith('5')) setCardType('MASTERCARD')
    else if (raw.startsWith('4')) setCardType('VISA')
    else setCardType('RUPAY')
  }

  function handleExpiryChange(val: string) {
    const raw = val.replace(/\D/g, '').slice(0, 4)
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`)
    } else {
      setCardExpiry(raw)
    }
  }

  function fillDemoCard() {
    setCardNumber('6071 8923 4512 3341')
    setCardHolder('AAROGYA PATIENT')
    setCardExpiry('12/29')
    setCardCvv('742')
    setCardType('RUPAY')
  }

  async function handleExecutePayment() {
    setErrorMessage('')
    setProcessingState('PROCESSING')

    setProcessingStage('Connecting to Aarogya Bank Gateway (256-bit SSL)...')
    await new Promise((resolve) => window.setTimeout(resolve, 500))

    setProcessingStage(`Authorizing advance token payment of ₹${advanceAmount.toFixed(2)} via ${paymentMethod}...`)
    await new Promise((resolve) => window.setTimeout(resolve, 600))

    try {
      const response = await onPayAndConfirm(paymentMethod)

      setProcessingStage('Payment Approved. Generating OPD token and official receipt...')
      await new Promise((resolve) => window.setTimeout(resolve, 400))

      const result: PaymentSuccessResult = {
        appointmentId: response.appointmentId,
        receiptNumber: response.receiptNumber || `REC-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        transactionReference: response.transactionReference || `TXN-AAROGYA-${Date.now()}`,
        amountPaid: response.advancePaid ?? advanceAmount,
        totalFee: response.totalFee ?? totalFee,
        remainingBalance: response.remainingBalance ?? balanceDue,
        paymentMethod,
        doctor,
        date: appointmentDate,
        time: appointmentTime,
      }

      setPaymentResult(result)
      setProcessingState('SUCCESS')
      if (onSuccessDone) {
        onSuccessDone(result)
      }
    } catch (err: any) {
      setProcessingState('IDLE')
      setErrorMessage(err.message || 'Payment authorization failed. Please try again.')
    }
  }

  async function handleDownloadReceipt() {
    if (!paymentResult) return
    setDownloadingReceipt(true)
    try {
      let fullReceipt: ReceiptData
      try {
        const fetched = await api.getReceipt(paymentResult.appointmentId)
        fullReceipt = fetched
      } catch {
        fullReceipt = {
          receiptNumber: paymentResult.receiptNumber,
          transactionReference: paymentResult.transactionReference,
          appointmentId: paymentResult.appointmentId,
          date: paymentResult.date,
          time: paymentResult.time,
          patientName: paymentResult.patientName || 'Registered Patient',
          patientPhone: 'Confidential',
          doctorName: paymentResult.doctor.name,
          department: paymentResult.doctor.department,
          specialization: paymentResult.doctor.specialization,
          totalFee: paymentResult.totalFee,
          advancePaid: paymentResult.amountPaid,
          remainingBalance: paymentResult.remainingBalance,
          paymentMethod: paymentResult.paymentMethod,
          paymentStatus: paymentResult.remainingBalance === 0 ? 'PAID' : 'PARTIALLY_PAID',
          paidAt: new Date().toISOString(),
          hospitalName: 'Aarogya Multi-Speciality Hospital',
          hospitalAddress: 'Sector 14, Health City, New Delhi - 110001',
          hospitalPhone: '+91 11 2345 6789',
          hospitalGst: '07AAAAA0000A1Z5',
        }
      }
      await downloadReceiptImage(fullReceipt)
    } catch (err: any) {
      console.warn('Failed to download receipt:', err)
    } finally {
      setDownloadingReceipt(false)
    }
  }

  if (processingState === 'PROCESSING') {
    return (
      <div
        style={{
          padding: '40px 24px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'inline-flex', padding: '14px', borderRadius: '50%', backgroundColor: '#eff6ff', marginBottom: '16px' }}>
          <ShieldCheckIcon size={36} color="#1d4ed8" />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
          Aarogya Secure OPD Payment Gateway
        </h3>
        <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '440px', margin: '0 auto 24px auto' }}>
          256-bit SSL encrypted connection established with hospital core banking switch.
        </p>

        <div
          style={{
            maxWidth: '380px',
            margin: '0 auto 20px auto',
            height: '8px',
            backgroundColor: '#e2e8f0',
            borderRadius: '999px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#2563eb',
              borderRadius: '999px',
              animation: 'pulse 1.2s infinite',
            }}
          />
        </div>

        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1d4ed8', minHeight: '24px' }}>
          {processingStage}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '12px' }}>
          Amount: <strong>₹{advanceAmount.toFixed(2)}</strong> | Do not refresh this window
        </div>
      </div>
    )
  }

  if (processingState === 'SUCCESS' && paymentResult) {
    return (
      <div
        style={{
          padding: '28px 24px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #bbf7d0',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '12px',
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              color: '#16a34a',
              marginBottom: '12px',
            }}
          >
            <CheckCircleIcon size={36} color="#15803d" />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#14532d', margin: '0 0 6px 0' }}>
            Advance Payment Successful
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#475569', margin: 0 }}>
            Your consultation with <strong>{paymentResult.doctor.name}</strong> is officially confirmed.
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '18px 20px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '0.86rem' }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.76rem', textTransform: 'uppercase', fontWeight: 600 }}>
                Receipt Number
              </span>
              <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{paymentResult.receiptNumber}</strong>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.76rem', textTransform: 'uppercase', fontWeight: 600 }}>
                Transaction Reference
              </span>
              <strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>{paymentResult.transactionReference}</strong>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.76rem', textTransform: 'uppercase', fontWeight: 600 }}>
                Consultation Slot
              </span>
              <strong style={{ color: '#1e40af' }}>
                {paymentResult.date} at {paymentResult.time}
              </strong>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.76rem', textTransform: 'uppercase', fontWeight: 600 }}>
                Payment Method
              </span>
              <strong style={{ color: '#0f172a' }}>{paymentResult.paymentMethod} (Verified Online)</strong>
            </div>
          </div>

          <div style={{ margin: '14px 0', borderTop: '1px dashed #cbd5e1' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.88rem' }}>
            <span style={{ color: '#475569' }}>Total Consultation Fee:</span>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{paymentResult.totalFee.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.9rem' }}>
            <span style={{ color: '#15803d', fontWeight: 700 }}>Advance Paid Online (Confirmed):</span>
            <span style={{ fontWeight: 800, color: '#15803d' }}>₹{paymentResult.amountPaid.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#64748b' }}>
            <span>Remaining Balance Due at OPD Reception:</span>
            <span style={{ fontWeight: 700, color: '#334155' }}>₹{paymentResult.remainingBalance.toFixed(2)}</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.82rem',
            color: '#166534',
            marginBottom: '22px',
          }}
        >
          <ShieldCheckIcon size={20} color="#15803d" />
          <span>
            Payment verified by Aarogya OPD Core. SMS and email notifications have been logged to your patient dashboard.
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={handleDownloadReceipt}
            disabled={downloadingReceipt}
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <DownloadIcon size={16} />
            {downloadingReceipt ? 'Generating Receipt Image...' : 'Download Official Receipt (PNG)'}
          </button>

          {onNavigate && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('live-waiting-room')}
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                Go to Live Waiting Room
              </button>
              <button
                type="button"
                onClick={() => onNavigate('my-appointments')}
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <CalendarIcon size={16} /> My Appointments
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '10px',
          padding: '16px 18px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.96rem' }}>
            OPD Advance Consultation Fee Breakdown
          </div>
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              padding: '3px 8px',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ShieldCheckIcon size={12} /> SECURE 256-BIT SSL CHECKOUT
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: '#475569', marginBottom: '6px' }}>
          <span>Doctor Consultation Fee ({doctor.specialization}):</span>
          <span style={{ fontWeight: 600 }}>₹{totalFee.toFixed(2)}</span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.92rem',
            fontWeight: 700,
            color: '#1d4ed8',
            marginBottom: '6px',
            paddingBottom: '8px',
            borderBottom: '1px dashed #cbd5e1',
          }}
        >
          <span>Online Advance Token (Due Now to Confirm Slot):</span>
          <span>₹{advanceAmount.toFixed(2)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#64748b' }}>
          <span>Remaining Balance (Payable at OPD Reception Counter):</span>
          <span style={{ fontWeight: 700, color: '#334155' }}>₹{balanceDue.toFixed(2)}</span>
        </div>
      </div>

      {errorMessage && <div className="form-alert-error" style={{ marginBottom: '16px' }}>{errorMessage}</div>}

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', marginBottom: '10px' }}>
          Select Payment Method
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setPaymentMethod('UPI')}
            style={{
              padding: '12px 10px',
              borderRadius: '8px',
              border: paymentMethod === 'UPI' ? '2px solid #2563eb' : '1px solid #cbd5e1',
              backgroundColor: paymentMethod === 'UPI' ? '#eff6ff' : '#ffffff',
              color: paymentMethod === 'UPI' ? '#1d4ed8' : '#334155',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <QrCodeIcon size={20} color={paymentMethod === 'UPI' ? '#1d4ed8' : '#64748b'} />
            <span style={{ fontSize: '0.86rem', fontWeight: 700 }}>UPI / Dynamic QR</span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>GPay, PhonePe, Paytm</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('CARD')}
            style={{
              padding: '12px 10px',
              borderRadius: '8px',
              border: paymentMethod === 'CARD' ? '2px solid #2563eb' : '1px solid #cbd5e1',
              backgroundColor: paymentMethod === 'CARD' ? '#eff6ff' : '#ffffff',
              color: paymentMethod === 'CARD' ? '#1d4ed8' : '#334155',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <CreditCardIcon size={20} color={paymentMethod === 'CARD' ? '#1d4ed8' : '#64748b'} />
            <span style={{ fontSize: '0.86rem', fontWeight: 700 }}>Debit / RuPay Card</span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Visa, MasterCard</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('NETBANKING')}
            style={{
              padding: '12px 10px',
              borderRadius: '8px',
              border: paymentMethod === 'NETBANKING' ? '2px solid #2563eb' : '1px solid #cbd5e1',
              backgroundColor: paymentMethod === 'NETBANKING' ? '#eff6ff' : '#ffffff',
              color: paymentMethod === 'NETBANKING' ? '#1d4ed8' : '#334155',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <BankIcon size={20} color={paymentMethod === 'NETBANKING' ? '#1d4ed8' : '#64748b'} />
            <span style={{ fontSize: '0.86rem', fontWeight: 700 }}>Net Banking</span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>SBI, HDFC, ICICI</span>
          </button>
        </div>
      </div>

      {paymentMethod === 'UPI' && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '18px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>
                Scan with any UPI App
              </div>
              {upiQrDataUrl ? (
                <img
                  src={upiQrDataUrl}
                  alt="Aarogya Hospital UPI Advance QR"
                  style={{ width: '160px', height: '160px', borderRadius: '6px', margin: '0 auto', display: 'block' }}
                />
              ) : (
                <div style={{ width: '160px', height: '160px', backgroundColor: '#e2e8f0', margin: '0 auto' }} />
              )}
              <div style={{ fontSize: '0.78rem', color: '#1e40af', fontWeight: 700, marginTop: '8px' }}>
                ₹{advanceAmount.toFixed(2)} Advance Token
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>VPA: hospital.aarogya@icici</div>
            </div>

            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                Fast UPI Checkout
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '14px' }}>
                {(['GPAY', 'PHONEPE', 'PAYTM', 'BHIM'] as const).map((app) => {
                  const isSelected = selectedUpiApp === app
                  const label = app === 'GPAY' ? 'Google Pay' : app === 'PHONEPE' ? 'PhonePe' : app === 'PAYTM' ? 'Paytm UPI' : 'BHIM UPI'
                  return (
                    <button
                      key={app}
                      type="button"
                      onClick={() => handleQuickUpiApp(app)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                        backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: isSelected ? '#1d4ed8' : '#334155',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <SmartphoneIcon size={14} color={isSelected ? '#2563eb' : '#64748b'} />
                      {label}
                    </button>
                  )
                })}
              </div>

              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>UPI ID / VPA</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => {
                      setUpiId(e.target.value)
                      setUpiVerified(false)
                    }}
                    placeholder="patient@okhdfcbank"
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyUpi}
                    disabled={verifyingUpi}
                    className="btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '0 14px' }}
                  >
                    {verifyingUpi ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </div>

              {upiVerified && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#15803d', fontWeight: 600 }}>
                  <CheckIcon size={14} color="#15803d" /> Verified Aarogya Banking Account ({upiId})
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {paymentMethod === 'CARD' && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '18px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              maxWidth: '380px',
              margin: '0 auto 20px auto',
              padding: '18px 22px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)',
              color: '#ffffff',
              boxShadow: '0 8px 20px rgba(15, 23, 42, 0.15)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <span style={{ fontSize: '0.78rem', letterSpacing: '1px', fontWeight: 700, color: '#93c5fd' }}>
                AAROGYA HEALTHCARE CARD
              </span>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                {cardType}
              </span>
            </div>

            <div
              style={{
                width: '36px',
                height: '26px',
                backgroundColor: '#fbbf24',
                borderRadius: '4px',
                marginBottom: '16px',
                border: '1px solid #d97706',
              }}
            />

            <div style={{ fontSize: '1.18rem', letterSpacing: '2.5px', fontFamily: 'monospace', fontWeight: 700, marginBottom: '14px' }}>
              {cardNumber || '•••• •••• •••• ••••'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <div>
                <div style={{ fontSize: '0.64rem', color: '#94a3b8', textTransform: 'uppercase' }}>Cardholder</div>
                <div style={{ fontWeight: 600 }}>{cardHolder || 'NAME'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.64rem', color: '#94a3b8', textTransform: 'uppercase' }}>Expires</div>
                <div style={{ fontWeight: 600 }}>{cardExpiry || 'MM/YY'}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={fillDemoCard}
              style={{
                fontSize: '0.78rem',
                color: '#2563eb',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                textDecoration: 'underline',
              }}
            >
              Auto-fill RuPay Health Card
            </button>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>16-Digit Card Number</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => handleCardNumberChange(e.target.value)}
              placeholder="4532 8910 2345 6789"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Cardholder Name</label>
            <input
              type="text"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
              placeholder="AS PRINTED ON CARD"
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Valid Thru (MM/YY)</label>
              <input
                type="text"
                value={cardExpiry}
                onChange={(e) => handleExpiryChange(e.target.value)}
                placeholder="12/28"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>CVV / CVC</label>
              <input
                type="password"
                maxLength={3}
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                placeholder="•••"
                className="form-input"
              />
            </div>
          </div>
        </div>
      )}

      {paymentMethod === 'NETBANKING' && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '18px',
            marginBottom: '20px',
          }}
        >
          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '12px' }}>
            Select Preferred Indian Bank
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px' }}>
            {POPULAR_INDIAN_BANKS.map((b) => {
              const isSelected = selectedBank === b.id
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBank(b.id)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: isSelected ? '#2563eb' : '#64748b', fontWeight: 700 }}>
                    {b.code}
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: isSelected ? '#1d4ed8' : '#0f172a' }}>
                    {b.name}
                  </div>
                </button>
              )
            })}
          </div>

          <div
            style={{
              padding: '10px 12px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              fontSize: '0.78rem',
              color: '#64748b',
              border: '1px solid #e2e8f0',
            }}
          >
            Note: You will be securely connected through your bank's authentication gateway to approve the ₹200.00 advance deposit.
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          borderRadius: '8px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          fontSize: '0.82rem',
          color: '#1e40af',
          marginBottom: '20px',
        }}
      >
        <LockIcon size={16} color="#1d4ed8" />
        <span>
          Instant confirmation with official hospital receipt and automated OPD token generation.
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeftIcon size={14} /> Back
        </button>

        <button
          type="button"
          onClick={handleExecutePayment}
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem', padding: '10px 20px' }}
        >
          <CreditCardIcon size={16} /> Pay ₹{advanceAmount.toFixed(2)} Advance &amp; Confirm
          <ArrowRightIcon size={14} />
        </button>
      </div>
    </div>
  )
}
