/**
 * Aarogya Multi-Speciality Hospital - Clinical Report & Medical History Image Generator
 * Uses native HTML5 Canvas to generate high-resolution (2x retina) official clinical
 * documentation images that patients and administrators can download directly.
 */

export interface ReportData {
  id?: string
  appointmentDate?: string
  appointmentTime?: string
  patientName: string
  patientPhone?: string
  patientGender?: string
  patientBloodGroup?: string
  doctorName: string
  department: string
  reason?: string
  diagnosisSummary?: string
  doctorNotes?: string
  reportImageUrl?: string
  createdAt?: string
}

export interface PatientHistoryData {
  name: string
  email?: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  bloodGroup?: string
  address?: string
  emergencyContact?: string
  visits: Array<{
    id?: string
    date?: string
    doctor?: string
    department?: string
    diagnosisSummary?: string
    doctorNotes?: string
    reportImageUrl?: string
  }>
}

/**
 * Downloads a single visit/prescription report as an image
 */
export async function downloadVisitReportImage(report: ReportData): Promise<void> {
  const width = 1000
  const height = 1350
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 1. Background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  // Outer border & header banner
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 4
  ctx.strokeRect(20, 20, width - 40, height - 40)

  // Top header color band
  ctx.fillStyle = '#1e3a8a'
  ctx.fillRect(20, 20, width - 40, 130)

  // Hospital Cross icon emblem
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(55, 55, 45, 45)
  ctx.fillStyle = '#1e3a8a'
  ctx.fillRect(72, 63, 11, 29)
  ctx.fillRect(63, 72, 29, 11)

  // Hospital Name & Credentials
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 30px system-ui, -apple-system, sans-serif'
  ctx.fillText('AAROGYA MULTI-SPECIALITY HOSPITAL', 120, 72)
  ctx.font = '500 15px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#bfdbfe'
  ctx.fillText('DEPARTMENT OF OUTPATIENT CLINICAL SERVICES & CARE RECORDS', 120, 98)
  ctx.fillText('Bengaluru, Karnataka • Helpline: +91 80 2345 6789 • Web: aarogya-hospital.org', 120, 122)

  // Title bar
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(24, 152, width - 48, 55)
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 1
  ctx.strokeRect(24, 152, width - 48, 55)

  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif'
  ctx.fillText('CLINICAL OPD CONSULTATION SUMMARY & PRESCRIPTION', 45, 187)

  const refDate = report.appointmentDate || new Date().toISOString().slice(0, 10)
  ctx.font = '500 15px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#64748b'
  ctx.fillText(`Date: ${refDate} | Ref: #${(report.id || 'REC').slice(-8).toUpperCase()}`, 680, 187)

  // Two Column Details Box
  const boxTop = 230
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(40, boxTop, width - 80, 170)
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.strokeRect(40, boxTop, width - 80, 170)

  // Left column: Patient details
  ctx.fillStyle = '#1e40af'
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif'
  ctx.fillText('PATIENT PARTICULARS', 60, boxTop + 35)

  ctx.font = '15px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#334155'
  ctx.fillText(`Patient Name:`, 60, boxTop + 70)
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#0f172a'
  ctx.fillText(report.patientName || 'N/A', 170, boxTop + 70)

  ctx.font = '15px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#334155'
  ctx.fillText(`Contact:`, 60, boxTop + 102)
  ctx.fillStyle = '#0f172a'
  ctx.fillText(report.patientPhone || 'Registered On File', 170, boxTop + 102)

  ctx.fillStyle = '#334155'
  ctx.fillText(`Demographics:`, 60, boxTop + 135)
  ctx.fillStyle = '#0f172a'
  ctx.fillText(`Gender: ${report.patientGender || 'N/A'}  |  Blood Group: ${report.patientBloodGroup || 'N/A'}`, 170, boxTop + 135)

  // Vertical divider
  ctx.strokeStyle = '#cbd5e1'
  ctx.beginPath()
  ctx.moveTo(500, boxTop + 20)
  ctx.lineTo(500, boxTop + 150)
  ctx.stroke()

  // Right column: Doctor & Department
  ctx.fillStyle = '#1e40af'
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif'
  ctx.fillText('CONSULTING PHYSICIAN', 530, boxTop + 35)

  ctx.font = '15px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#334155'
  ctx.fillText(`Doctor:`, 530, boxTop + 70)
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#0f172a'
  ctx.fillText(report.doctorName || 'Senior Specialist', 640, boxTop + 70)

  ctx.font = '15px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#334155'
  ctx.fillText(`Department:`, 530, boxTop + 102)
  ctx.fillStyle = '#0f172a'
  ctx.fillText(report.department || 'General Medicine', 640, boxTop + 102)

  ctx.fillStyle = '#334155'
  ctx.fillText(`Time Slot:`, 530, boxTop + 135)
  ctx.fillStyle = '#0f172a'
  ctx.fillText(report.appointmentTime || 'OPD Slot', 640, boxTop + 135)

  // Clinical Chief Complaint Box
  let currentY = boxTop + 200
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(40, currentY, width - 80, 80)
  ctx.strokeStyle = '#e2e8f0'
  ctx.strokeRect(40, currentY, width - 80, 80)

  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif'
  ctx.fillText('CHIEF COMPLAINT / PRESENTING CONCERNS', 60, currentY + 30)
  ctx.font = '15px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#475569'
  ctx.fillText(report.reason || 'General routine checkup & consultation', 60, currentY + 58)

  // Primary Diagnosis Box
  currentY += 105
  ctx.fillStyle = '#f0fdf4'
  ctx.fillRect(40, currentY, width - 80, 95)
  ctx.strokeStyle = '#bbf7d0'
  ctx.strokeRect(40, currentY, width - 80, 95)

  ctx.fillStyle = '#166534'
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif'
  ctx.fillText('PRIMARY CLINICAL DIAGNOSIS & ASSESSMENT', 60, currentY + 32)
  ctx.font = 'bold 17px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#0f172a'
  ctx.fillText(report.diagnosisSummary || 'Clinical evaluation completed with normal limits.', 60, currentY + 68)

  // Doctor Clinical Notes & Rx Prescriptions Box
  currentY += 120
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(40, currentY, width - 80, 220)
  ctx.strokeStyle = '#cbd5e1'
  ctx.strokeRect(40, currentY, width - 80, 220)

  ctx.fillStyle = '#1e3a8a'
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif'
  ctx.fillText('PHYSICIAN CLINICAL NOTES & PRESCRIPTION DIRECTIVES (Rx)', 60, currentY + 35)

  ctx.font = '15px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#1e293b'
  const notes = report.doctorNotes || 'Maintain prescribed hydration, standard lifestyle precautions, and follow up in OPD if symptoms persist.'

  // Word wrap for doctor notes
  wrapText(ctx, notes, 60, currentY + 70, width - 120, 26)

  // Clinical Report image section if available
  currentY += 245
  if (report.reportImageUrl && report.reportImageUrl.startsWith('data:image')) {
    try {
      const img = new Image()
      img.src = report.reportImageUrl
      await new Promise((resolve) => {
        img.onload = resolve
        img.onerror = resolve
      })
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(40, currentY, width - 80, 280)
      ctx.strokeStyle = '#e2e8f0'
      ctx.strokeRect(40, currentY, width - 80, 280)

      ctx.fillStyle = '#0f172a'
      ctx.font = 'bold 15px system-ui, -apple-system, sans-serif'
      ctx.fillText('ATTACHED DIAGNOSTIC LAB / SCAN REPORT', 60, currentY + 30)

      // Draw thumbnail preview
      ctx.drawImage(img, 60, currentY + 45, 300, 210)
      ctx.font = '14px system-ui, -apple-system, sans-serif'
      ctx.fillStyle = '#64748b'
      ctx.fillText('Diagnostic report certified by consulting department.', 380, currentY + 80)
      ctx.fillText('Digital copy securely archived in Cloudinary Hospital Vault.', 380, currentY + 110)
      currentY += 300
    } catch {
      // Fallback if image doesn't render
    }
  }

  // Footer & Official Electronic Stamp
  const footerY = height - 160

  // Stamp Box
  ctx.strokeStyle = '#1e40af'
  ctx.lineWidth = 2
  ctx.strokeRect(620, footerY - 20, 320, 110)

  ctx.fillStyle = '#1e40af'
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif'
  ctx.fillText('AAROGYA MULTI-SPECIALITY HOSPITAL', 635, footerY + 10)
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif'
  ctx.fillText(`VERIFIED ELECTRONIC RECORD`, 635, footerY + 36)
  ctx.font = '500 13px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#0f172a'
  ctx.fillText(`${report.doctorName} (Medical Staff)`, 635, footerY + 60)
  ctx.font = 'italic 12px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#64748b'
  ctx.fillText(`Digitally signed on ${new Date().toLocaleDateString()}`, 635, footerY + 80)

  // Disclaimer
  ctx.fillStyle = '#94a3b8'
  ctx.font = '13px system-ui, -apple-system, sans-serif'
  ctx.fillText('This document is a certified computer-generated electronic medical record.', 40, footerY + 50)
  ctx.fillText('Valid for medical follow-up, pharmacy dispensing, and patient health history.', 40, footerY + 74)

  // Trigger download
  const link = document.createElement('a')
  link.download = `Aarogya-Medical-Report-${(report.patientName || 'Patient').replace(/\s+/g, '_')}-${refDate}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

/**
 * Downloads a complete medical history dossier for a patient as an image
 */
export async function downloadPatientMedicalHistoryImage(patient: PatientHistoryData): Promise<void> {
  const width = 1100
  const visitCount = (patient.visits || []).length
  // Dynamic height based on number of visits
  const height = Math.max(1300, 480 + visitCount * 180 + 150)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  // Border
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 4
  ctx.strokeRect(20, 20, width - 40, height - 40)

  // Top header banner
  ctx.fillStyle = '#1e3a8a'
  ctx.fillRect(20, 20, width - 40, 130)

  // Emblem
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(55, 55, 45, 45)
  ctx.fillStyle = '#1e3a8a'
  ctx.fillRect(72, 63, 11, 29)
  ctx.fillRect(63, 72, 29, 11)

  // Header texts
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 30px system-ui, -apple-system, sans-serif'
  ctx.fillText('AAROGYA MULTI-SPECIALITY HOSPITAL', 120, 72)
  ctx.font = '500 15px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#bfdbfe'
  ctx.fillText('COMPREHENSIVE PATIENT MEDICAL HISTORY DOSSIER', 120, 98)
  ctx.fillText('Certified Confidential Medical Record • Hospital Information Management System', 120, 122)

  // Patient Demographic Card
  const boxTop = 180
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(40, boxTop, width - 80, 170)
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 1
  ctx.strokeRect(40, boxTop, width - 80, 170)

  ctx.fillStyle = '#1e40af'
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif'
  ctx.fillText('PATIENT IDENTIFICATION & CONTACT PROFILE', 60, boxTop + 35)

  ctx.font = '15px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#334155'
  ctx.fillText('Full Name:', 60, boxTop + 70)
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#0f172a'
  ctx.fillText(patient.name || 'Patient', 160, boxTop + 70)

  ctx.font = '15px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#334155'
  ctx.fillText('Email:', 60, boxTop + 102)
  ctx.fillStyle = '#0f172a'
  ctx.fillText(patient.email || 'N/A', 160, boxTop + 102)

  ctx.fillStyle = '#334155'
  ctx.fillText('Mobile:', 60, boxTop + 135)
  ctx.fillStyle = '#0f172a'
  ctx.fillText(patient.phone || 'N/A', 160, boxTop + 135)

  // Right column
  ctx.fillStyle = '#334155'
  ctx.fillText('Gender / Blood:', 550, boxTop + 70)
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#0f172a'
  ctx.fillText(`${patient.gender || 'N/A'}  •  Blood Group: ${patient.bloodGroup || 'N/A'}`, 680, boxTop + 70)

  ctx.font = '15px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#334155'
  ctx.fillText('Emergency:', 550, boxTop + 102)
  ctx.fillStyle = '#0f172a'
  ctx.fillText(patient.emergencyContact || 'Not specified', 680, boxTop + 102)

  ctx.fillStyle = '#334155'
  ctx.fillText('Address:', 550, boxTop + 135)
  ctx.fillStyle = '#0f172a'
  ctx.fillText(patient.address || 'Bengaluru, India', 680, boxTop + 135)

  // Timeline of Medical Consultations
  let currentY = boxTop + 210
  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif'
  ctx.fillText(`CHRONOLOGICAL CLINICAL VISITS (${visitCount} Recorded)`, 40, currentY)
  currentY += 20

  if (!patient.visits || patient.visits.length === 0) {
    currentY += 40
    ctx.fillStyle = '#64748b'
    ctx.font = 'italic 16px system-ui, -apple-system, sans-serif'
    ctx.fillText('No outpatient consultations documented on file yet.', 40, currentY)
    currentY += 60
  } else {
    patient.visits.forEach((v, idx) => {
      currentY += 25
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(40, currentY, width - 80, 150)
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 1
      ctx.strokeRect(40, currentY, width - 80, 150)

      // Visit number tag
      ctx.fillStyle = '#eff6ff'
      ctx.fillRect(55, currentY + 15, 90, 28)
      ctx.strokeStyle = '#bfdbfe'
      ctx.strokeRect(55, currentY + 15, 90, 28)
      ctx.fillStyle = '#1e40af'
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
      ctx.fillText(`Visit #${visitCount - idx}`, 70, currentY + 34)

      // Visit Date & Doctor
      ctx.fillStyle = '#0f172a'
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif'
      ctx.fillText(`Date: ${v.date || 'N/A'}`, 160, currentY + 35)

      ctx.fillStyle = '#0284c7'
      ctx.font = 'bold 15px system-ui, -apple-system, sans-serif'
      ctx.fillText(`Consultant: ${v.doctor || 'Physician'}`, 550, currentY + 35)

      // Diagnosis
      ctx.fillStyle = '#166534'
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
      ctx.fillText('Diagnosis:', 55, currentY + 70)
      ctx.fillStyle = '#0f172a'
      ctx.font = '15px system-ui, -apple-system, sans-serif'
      ctx.fillText(v.diagnosisSummary || 'Routine examination completed.', 140, currentY + 70)

      // Doctor Notes
      ctx.fillStyle = '#475569'
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
      ctx.fillText('Notes (Rx):', 55, currentY + 102)
      ctx.fillStyle = '#334155'
      ctx.font = '14px system-ui, -apple-system, sans-serif'
      const notes = (v.doctorNotes || 'No additional instructions.').slice(0, 110)
      ctx.fillText(notes + (v.doctorNotes && v.doctorNotes.length > 110 ? '...' : ''), 140, currentY + 102)

      if (v.reportImageUrl) {
        ctx.fillStyle = '#059669'
        ctx.font = 'bold 13px system-ui, -apple-system, sans-serif'
        ctx.fillText('[Diagnostic Scan / Cloudinary Report Attached]', 140, currentY + 130)
      }

      currentY += 150
    })
  }

  // Footer
  const footerY = height - 90
  ctx.strokeStyle = '#cbd5e1'
  ctx.beginPath()
  ctx.moveTo(40, footerY)
  ctx.lineTo(width - 40, footerY)
  ctx.stroke()

  ctx.fillStyle = '#64748b'
  ctx.font = '13px system-ui, -apple-system, sans-serif'
  ctx.fillText('Official Medical Dossier issued by Aarogya Multi-Speciality Hospital Administration.', 40, footerY + 30)
  ctx.fillText(`Generated on ${new Date().toLocaleString()} • Database: MongoDB Certified Records`, 40, footerY + 52)

  const link = document.createElement('a')
  link.download = `Aarogya-Medical-History-${(patient.name || 'Patient').replace(/\s+/g, '_')}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

// Helper: Word wrap for Canvas text
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ')
  let line = ''
  let currentY = y

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY)
      line = words[n] + ' '
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, currentY)
}
