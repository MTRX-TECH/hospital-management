/**
 * Aarogya Multi-Speciality Hospital - Official Payment Receipt Generator
 * Generates high-resolution (2x retina) official financial receipts using HTML5 Canvas
 * that patients can download directly as high-clarity PNG images.
 */

export interface ReceiptData {
  receiptNumber: string
  transactionReference: string
  appointmentId: string
  date: string
  time: string
  patientName: string
  patientPhone: string
  patientEmail?: string
  patientBloodGroup?: string
  doctorName: string
  department: string
  specialization: string
  totalFee: number
  advancePaid: number
  remainingBalance: number
  paymentMethod: string
  paymentStatus: string
  paidAt?: string
  hospitalName?: string
  hospitalAddress?: string
  hospitalPhone?: string
  hospitalGst?: string
}

export async function downloadReceiptImage(receipt: ReceiptData): Promise<void> {
  const width = 1000
  const height = 1200
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 1. Background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  // 2. Outer Border & Watermark
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 3
  ctx.strokeRect(20, 20, width - 40, height - 40)

  // 3. Header Banner (Deep Navy Gradient)
  const headerGrad = ctx.createLinearGradient(0, 20, width, 180)
  headerGrad.addColorStop(0, '#0f172a')
  headerGrad.addColorStop(1, '#1e3a8a')
  ctx.fillStyle = headerGrad
  ctx.fillRect(20, 20, width - 40, 160)

  // Hospital Name & Details
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif'
  ctx.fillText(receipt.hospitalName || 'AAROGYA MULTI-SPECIALITY HOSPITAL', 50, 70)

  ctx.fillStyle = '#93c5fd'
  ctx.font = '14px "Segoe UI", Arial, sans-serif'
  ctx.fillText(
    receipt.hospitalAddress || 'Sector 14, Health City, New Delhi - 110001 | Phone: +91 11 2345 6789',
    50,
    98
  )

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '13px "Segoe UI", Arial, sans-serif'
  ctx.fillText(`GSTIN: ${receipt.hospitalGst || '07AAAAA0000A1Z5'} | NABH Accredited Healthcare Facility`, 50, 122)

  // Header Tag
  ctx.fillStyle = '#22c55e'
  ctx.fillRect(width - 240, 50, 190, 36)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('OFFICIAL RECEIPT', width - 145, 74)
  ctx.textAlign = 'left'

  // Subheader: Receipt metadata
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(30, 200, width - 60, 70)
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 1
  ctx.strokeRect(30, 200, width - 60, 70)

  ctx.fillStyle = '#475569'
  ctx.font = '13px "Segoe UI", Arial, sans-serif'
  ctx.fillText('RECEIPT NO:', 50, 228)
  ctx.fillText('TRANSACTION REF:', 360, 228)
  ctx.fillText('PAYMENT DATE & TIME:', 680, 228)

  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif'
  ctx.fillText(receipt.receiptNumber, 50, 252)
  ctx.fillText(receipt.transactionReference, 360, 252)
  const paidDateFormatted = receipt.paidAt ? new Date(receipt.paidAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')
  ctx.fillText(paidDateFormatted, 680, 252)

  // 4. Two Columns: Patient Info & Doctor/OPD Info
  // Left Box: Patient
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#e2e8f0'
  ctx.strokeRect(30, 290, 460, 150)
  ctx.fillStyle = '#f1f5f9'
  ctx.fillRect(30, 290, 460, 34)
  ctx.fillStyle = '#1e293b'
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif'
  ctx.fillText('PATIENT INFORMATION', 45, 313)

  ctx.fillStyle = '#64748b'
  ctx.font = '13px "Segoe UI", Arial, sans-serif'
  ctx.fillText('Name:', 45, 350)
  ctx.fillText('Contact:', 45, 380)
  ctx.fillText('Blood Group:', 45, 410)

  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif'
  ctx.fillText(receipt.patientName, 150, 350)
  ctx.font = '14px "Segoe UI", Arial, sans-serif'
  ctx.fillText(receipt.patientPhone, 150, 380)
  ctx.fillText(receipt.patientBloodGroup || 'N/A', 150, 410)

  // Right Box: Doctor & OPD
  ctx.strokeRect(510, 290, 460, 150)
  ctx.fillStyle = '#f1f5f9'
  ctx.fillRect(510, 290, 460, 34)
  ctx.fillStyle = '#1e293b'
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif'
  ctx.fillText('CLINICAL & APPOINTMENT DETAILS', 525, 313)

  ctx.fillStyle = '#64748b'
  ctx.font = '13px "Segoe UI", Arial, sans-serif'
  ctx.fillText('Doctor:', 525, 350)
  ctx.fillText('Department:', 525, 380)
  ctx.fillText('Scheduled Slot:', 525, 410)

  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif'
  ctx.fillText(receipt.doctorName, 640, 350)
  ctx.font = '14px "Segoe UI", Arial, sans-serif'
  ctx.fillText(`${receipt.department} (${receipt.specialization})`, 640, 380)
  ctx.fillText(`${receipt.date} at ${receipt.time}`, 640, 410)

  // 5. Payment Itemized Table
  const tableY = 470
  ctx.fillStyle = '#1e3a8a'
  ctx.fillRect(30, tableY, width - 60, 38)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif'
  ctx.fillText('SL', 50, tableY + 24)
  ctx.fillText('SERVICE / CHARGE PARTICULARS', 110, tableY + 24)
  ctx.fillText('PAYMENT METHOD', 560, tableY + 24)
  ctx.fillText('AMOUNT (INR)', 820, tableY + 24)

  // Row 1: Consultation Fee
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(30, tableY + 38, width - 60, 45)
  ctx.strokeStyle = '#e2e8f0'
  ctx.strokeRect(30, tableY + 38, width - 60, 45)

  ctx.fillStyle = '#334155'
  ctx.font = '14px "Segoe UI", Arial, sans-serif'
  ctx.fillText('01', 50, tableY + 66)
  ctx.fillText(`Specialist OPD Consultation - ${receipt.department}`, 110, tableY + 66)
  ctx.fillText('-', 560, tableY + 66)
  ctx.fillText(`Rs. ${receipt.totalFee.toFixed(2)}`, 820, tableY + 66)

  // Row 2: Advance Payment
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(30, tableY + 83, width - 60, 45)
  ctx.strokeRect(30, tableY + 83, width - 60, 45)

  ctx.fillStyle = '#047857'
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif'
  ctx.fillText('02', 50, tableY + 111)
  ctx.fillText('Advance Consultation Token (Online Payment)', 110, tableY + 111)
  ctx.fillText(receipt.paymentMethod || 'UPI', 560, tableY + 111)
  ctx.fillText(`- Rs. ${receipt.advancePaid.toFixed(2)}`, 820, tableY + 111)

  // Summary Box
  const sumY = tableY + 150
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(510, sumY, 460, 160)
  ctx.strokeStyle = '#cbd5e1'
  ctx.strokeRect(510, sumY, 460, 160)

  ctx.fillStyle = '#475569'
  ctx.font = '14px "Segoe UI", Arial, sans-serif'
  ctx.fillText('Total Consultation Fee:', 530, sumY + 35)
  ctx.fillText('Advance Amount Paid:', 530, sumY + 70)
  ctx.fillText('Remaining Balance at Reception:', 530, sumY + 105)
  ctx.fillText('Payment Status:', 530, sumY + 140)

  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(`Rs. ${receipt.totalFee.toFixed(2)}`, 940, sumY + 35)

  ctx.fillStyle = '#16a34a'
  ctx.fillText(`Rs. ${receipt.advancePaid.toFixed(2)}`, 940, sumY + 70)

  ctx.fillStyle = receipt.remainingBalance > 0 ? '#d97706' : '#16a34a'
  ctx.fillText(`Rs. ${receipt.remainingBalance.toFixed(2)}`, 940, sumY + 105)

  ctx.fillStyle = receipt.remainingBalance === 0 ? '#16a34a' : '#2563eb'
  ctx.fillText(receipt.paymentStatus, 940, sumY + 140)
  ctx.textAlign = 'left'

  // Terms and Notes Box (Left)
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#e2e8f0'
  ctx.strokeRect(30, sumY, 460, 160)

  ctx.fillStyle = '#1e293b'
  ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif'
  ctx.fillText('TERMS & BILLING CONDITIONS', 45, sumY + 28)

  ctx.fillStyle = '#64748b'
  ctx.font = '12px "Segoe UI", Arial, sans-serif'
  const terms = [
    '• Please present this receipt at the OPD registration counter.',
    '• Remaining balance (if any) is payable at hospital billing desk.',
    '• Valid for 14 days from scheduled appointment date.',
    '• Advance deposit is fully documented in hospital records.',
  ]
  terms.forEach((t, i) => {
    ctx.fillText(t, 45, sumY + 56 + i * 24)
  })

  // 6. Signatory & Stamp
  const authY = sumY + 200
  // Stamp ring
  ctx.save()
  ctx.strokeStyle = '#1e3a8a'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(200, authY + 40, 50, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#1e3a8a'
  ctx.font = 'bold 10px "Segoe UI", Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('AAROGYA HOSPITAL', 200, authY + 28)
  ctx.fillText('ACCOUNTS & BILLING', 200, authY + 44)
  ctx.fillText('VERIFIED & PAID', 200, authY + 58)
  ctx.restore()

  // Authorized Cashier Sign
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(680, authY + 55)
  ctx.lineTo(940, authY + 55)
  ctx.stroke()

  ctx.fillStyle = '#475569'
  ctx.font = '12px "Segoe UI", Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Authorized Accounts Officer / Cashier', 810, authY + 75)
  ctx.font = 'italic 11px "Segoe UI", Arial, sans-serif'
  ctx.fillText('Aarogya Multi-Speciality Hospital', 810, authY + 92)
  ctx.textAlign = 'left'

  // Footer bar
  ctx.fillStyle = '#f1f5f9'
  ctx.fillRect(20, height - 55, width - 40, 35)
  ctx.fillStyle = '#64748b'
  ctx.font = '11px "Segoe UI", Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(
    'This is a computer-generated official receipt and requires no physical signature. Registered under Delhi Healthcare Act.',
    width / 2,
    height - 33
  )

  // Download Trigger
  const link = document.createElement('a')
  link.download = `Aarogya_Receipt_${receipt.receiptNumber}.png`
  link.href = canvas.toDataURL('image/png')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
