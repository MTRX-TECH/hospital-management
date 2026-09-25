import QRCode from 'qrcode'

export interface QRCodeOptions {
  width?: number
  margin?: number
  color?: {
    dark: string
    light: string
  }
}

/**
 * Generates a high-quality data URL string for an appointment check-in QR code.
 * Safe and privacy-preserving: contains only appointment identifier and check-in token.
 */
export async function generateAppointmentQRCode(
  appointmentId: string,
  options?: QRCodeOptions
): Promise<string> {
  const payload = JSON.stringify({
    system: 'Aarogya Hospital OPD',
    appointmentId,
    action: 'CHECK_IN',
    version: '1.0',
  })

  return QRCode.toDataURL(payload, {
    width: options?.width || 240,
    margin: options?.margin || 2,
    color: {
      dark: options?.color?.dark || '#1e3a8a', // Deep clinical navy
      light: options?.color?.light || '#ffffff',
    },
    errorCorrectionLevel: 'M',
  })
}

/**
 * Generates a dynamic QR code for UPI advance payment.
 * UPI standard URL format: upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
 */
export async function generateUpiQRCode(
  upiUri: string,
  options?: QRCodeOptions
): Promise<string> {
  return QRCode.toDataURL(upiUri, {
    width: options?.width || 220,
    margin: options?.margin || 2,
    color: {
      dark: options?.color?.dark || '#0f172a',
      light: options?.color?.light || '#ffffff',
    },
    errorCorrectionLevel: 'M',
  })
}

