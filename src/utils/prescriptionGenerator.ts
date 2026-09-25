/**
 * Aarogya Multi-Speciality Hospital - Digital Prescription Slip Generator
 * Generates official high-resolution (2x retina) prescription slips using HTML5 Canvas
 * that patients can download directly as high-clarity PNG images.
 */

export interface MedicineItem {
  name: string
  dosage: string
  frequency: string
  numberOfTimes?: string
  timing?: string
  duration: string
  instructions: string
}

export interface PrescriptionData {
  appointmentId: string
  doctorName: string
  department: string
  specialization?: string
  doctorPhone?: string
  patientName: string
  patientPhone?: string
  patientGender?: string
  patientBloodGroup?: string
  appointmentDate: string
  queueToken?: string
  medicines: MedicineItem[]
  doctorAdvice?: string
  followUpDate?: string
  prescribedAt?: string
  hospitalName?: string
  hospitalAddress?: string
}

export async function downloadPrescriptionImage(prescription: PrescriptionData): Promise<void> {
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

  // 2. Outer Border
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 3
  ctx.strokeRect(20, 20, width - 40, height - 40)

  // 3. Header Banner (Hospital & Doctor info)
  const headerGrad = ctx.createLinearGradient(0, 20, width, 180)
  headerGrad.addColorStop(0, '#0f172a')
  headerGrad.addColorStop(1, '#1e3a8a')
  ctx.fillStyle = headerGrad
  ctx.fillRect(20, 20, width - 40, 160)

  // Hospital Name
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif'
  ctx.fillText(prescription.hospitalName || 'AAROGYA MULTI-SPECIALITY HOSPITAL', 50, 68)

  ctx.fillStyle = '#93c5fd'
  ctx.font = '13px "Segoe UI", Arial, sans-serif'
  ctx.fillText(
    prescription.hospitalAddress || 'Sector 14, Health City, New Delhi - 110001 | Phone: +91 11 2345 6789',
    50,
    94
  )

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '12px "Segoe UI", Arial, sans-serif'
  ctx.fillText('NABH Accredited Tertiary Care Center | Outpatient Care Division', 50, 116)

  // Doctor Badge on Top Right
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(width - 320, 42, 280, 116)
  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif'
  ctx.fillText(prescription.doctorName, width - 305, 72)

  ctx.fillStyle = '#2563eb'
  ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif'
  ctx.fillText(`Dept of ${prescription.department}`, width - 305, 96)

  ctx.fillStyle = '#64748b'
  ctx.font = '12px "Segoe UI", Arial, sans-serif'
  ctx.fillText(prescription.specialization || 'Consultant Specialist', width - 305, 118)
  ctx.fillText(`Reg: DMC-${prescription.appointmentId.slice(-5).toUpperCase()}`, width - 305, 138)

  // 4. Patient Info Ribbon
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(30, 200, width - 60, 80)
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = 1
  ctx.strokeRect(30, 200, width - 60, 80)

  ctx.fillStyle = '#64748b'
  ctx.font = '12px "Segoe UI", Arial, sans-serif'
  ctx.fillText('PATIENT NAME', 50, 226)
  ctx.fillText('PHONE NUMBER', 310, 226)
  ctx.fillText('GENDER / BLOOD GROUP', 550, 226)
  ctx.fillText('DATE / QUEUE TOKEN', 780, 226)

  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif'
  ctx.fillText(prescription.patientName, 50, 254)
  ctx.fillText(prescription.patientPhone || 'N/A', 310, 254)
  ctx.fillText(`${prescription.patientGender || 'N/A'} | ${prescription.patientBloodGroup || 'N/A'}`, 550, 254)
  ctx.fillText(`${prescription.appointmentDate} (${prescription.queueToken || 'OPD'})`, 780, 254)

  // 5. Classic Rx Symbol
  ctx.fillStyle = '#1e3a8a'
  ctx.font = 'italic bold 44px "Times New Roman", serif'
  ctx.fillText('℞', 45, 335)

  ctx.fillStyle = '#1e293b'
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif'
  ctx.fillText('PRESCRIBED MEDICINES & DOSAGE SCHEDULE', 95, 325)

  // 6. Medication Table Header
  const tableY = 355
  ctx.fillStyle = '#1e3a8a'
  ctx.fillRect(30, tableY, width - 60, 36)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif'
  ctx.fillText('SL', 45, tableY + 23)
  ctx.fillText('TABLET / MEDICINE NAME', 90, tableY + 23)
  ctx.fillText('DOSAGE', 350, tableY + 23)
  ctx.fillText('NUMBER OF TIMES TO TAKE', 470, tableY + 23)
  ctx.fillText('DURATION', 710, tableY + 23)
  ctx.fillText('INSTRUCTIONS', 810, tableY + 23)

  // Medication Rows
  let curY = tableY + 36
  if (!prescription.medicines || prescription.medicines.length === 0) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(30, curY, width - 60, 50)
    ctx.strokeRect(30, curY, width - 60, 50)
    ctx.fillStyle = '#64748b'
    ctx.font = 'italic 13px "Segoe UI", Arial, sans-serif'
    ctx.fillText('No oral medications prescribed during this consultation.', 50, curY + 30)
    curY += 50
  } else {
    prescription.medicines.forEach((med, idx) => {
      const rowHeight = 44
      ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc'
      ctx.fillRect(30, curY, width - 60, rowHeight)
      ctx.strokeStyle = '#e2e8f0'
      ctx.strokeRect(30, curY, width - 60, rowHeight)

      ctx.fillStyle = '#475569'
      ctx.font = '13px "Segoe UI", Arial, sans-serif'
      ctx.fillText(String(idx + 1).padStart(2, '0'), 45, curY + 27)

      ctx.fillStyle = '#0f172a'
      ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif'
      ctx.fillText(med.name, 90, curY + 27)

      ctx.fillStyle = '#2563eb'
      ctx.font = '13px "Segoe UI", Arial, sans-serif'
      ctx.fillText(med.dosage || '1 Tablet', 350, curY + 27)

      ctx.fillStyle = '#047857'
      ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif'
      const timesText = med.numberOfTimes
        ? `${med.numberOfTimes} (${med.timing || ''})`
        : med.frequency || '1 time a day'
      ctx.fillText(timesText, 470, curY + 27)

      ctx.fillStyle = '#334155'
      ctx.font = '13px "Segoe UI", Arial, sans-serif'
      ctx.fillText(med.duration || 'As directed', 710, curY + 27)

      ctx.fillStyle = '#64748b'
      ctx.font = '12px "Segoe UI", Arial, sans-serif'
      ctx.fillText(med.instructions || 'With water', 810, curY + 27)

      curY += rowHeight
    })
  }

  // 7. Clinical Advice / Instructions Section
  curY += 30
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#cbd5e1'
  ctx.strokeRect(30, curY, width - 60, 150)
  ctx.fillStyle = '#f1f5f9'
  ctx.fillRect(30, curY, width - 60, 32)
  ctx.fillStyle = '#1e293b'
  ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif'
  ctx.fillText('DOCTOR ADVICE & CLINICAL INSTRUCTIONS', 45, curY + 22)

  ctx.fillStyle = '#334155'
  ctx.font = '13px "Segoe UI", Arial, sans-serif'
  const adviceText = prescription.doctorAdvice || 'Take plenty of fluids, maintain a healthy balanced diet, and complete the prescribed course.'
  
  // Word wrap advice
  const words = adviceText.split(' ')
  let line = ''
  let lineY = curY + 54
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    const metrics = ctx.measureText(testLine)
    if (metrics.width > width - 110 && n > 0) {
      ctx.fillText(line, 45, lineY)
      line = words[n] + ' '
      lineY += 22
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, 45, lineY)

  // Follow-up Box
  curY += 175
  ctx.fillStyle = '#eff6ff'
  ctx.fillRect(30, curY, width - 60, 50)
  ctx.strokeStyle = '#bfdbfe'
  ctx.strokeRect(30, curY, width - 60, 50)

  ctx.fillStyle = '#1e40af'
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif'
  ctx.fillText('RECOMMENDED NEXT REVIEW / FOLLOW-UP:', 50, curY + 31)

  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif'
  ctx.fillText(
    prescription.followUpDate ? `${prescription.followUpDate} (After 14 Days)` : 'As needed / SOS if symptoms persist',
    390,
    curY + 31
  )

  // 8. Signatures & Hospital Stamp
  const signY = height - 200
  // Stamp
  ctx.save()
  ctx.strokeStyle = '#1e3a8a'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(200, signY + 35, 45, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#1e3a8a'
  ctx.font = 'bold 9px "Segoe UI", Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('AAROGYA HOSPITAL', 200, signY + 25)
  ctx.fillText('OUTPATIENT OPD', 200, signY + 38)
  ctx.fillText('MEDICAL RECORD', 200, signY + 51)
  ctx.restore()

  // Doctor Signature Line
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(660, signY + 50)
  ctx.lineTo(940, signY + 50)
  ctx.stroke()

  ctx.fillStyle = '#1e293b'
  ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(prescription.doctorName, 800, signY + 70)
  ctx.font = '12px "Segoe UI", Arial, sans-serif'
  ctx.fillStyle = '#64748b'
  ctx.fillText(`Consultant, ${prescription.department}`, 800, signY + 88)
  ctx.textAlign = 'left'

  // Footer bar
  ctx.fillStyle = '#f1f5f9'
  ctx.fillRect(20, height - 55, width - 40, 35)
  ctx.fillStyle = '#64748b'
  ctx.font = '11px "Segoe UI", Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(
    'Digital prescription valid across all registered pharmacies in India under National Telemedicine Guidelines.',
    width / 2,
    height - 33
  )

  // Download Trigger
  const link = document.createElement('a')
  link.download = `Aarogya_Prescription_${prescription.patientName.replace(/\s+/g, '_')}_${prescription.appointmentDate}.png`
  link.href = canvas.toDataURL('image/png')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
