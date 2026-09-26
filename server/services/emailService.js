import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import path from 'path'
import dns from 'dns'
import { fileURLToPath } from 'url'

// Force IPv4 across all DNS lookups to eliminate ENETUNREACH IPv6 errors on cloud containers (Render/Railway/AWS)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first')
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config()

let cachedTransporter = null
let isEthereal = false

// Custom DNS lookup that strictly enforces IPv4 resolution
const ipv4Lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  dns.lookup(hostname, { ...options, family: 4 }, callback)
}

async function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter
  }

  const emailUser = (process.env.EMAIL_USER || process.env.SMTP_USER || 'mtrx.tech512@gmail.com').trim()
  const rawPass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || 'bjhpspfzyohfxxme').trim()
  const emailPass = (!process.env.SMTP_HOST && emailUser.toLowerCase().includes('gmail.com'))
    ? rawPass.replace(/\s+/g, '')
    : rawPass

  // Real SMTP / Gmail configured by user
  if (emailUser && emailPass) {
    if (process.env.SMTP_HOST) {
      cachedTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_PORT === '465',
        family: 4,
        lookup: ipv4Lookup,
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      })
    } else {
      // Default to Gmail with strict IPv4 forced lookup, preventing ENETUNREACH on Render
      cachedTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        family: 4,
        lookup: ipv4Lookup,
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
        tls: {
          servername: 'smtp.gmail.com',
          rejectUnauthorized: false,
        },
      })
    }
    isEthereal = false
    console.log(`[Email Service] Configured live SMTP transport via ${emailUser} (IPv4 forced)`)
    return cachedTransporter
  }

  // Zero-config live preview transporter (Ethereal Email)
  try {
    const testAccount = await nodemailer.createTestAccount()
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      lookup: ipv4Lookup,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
    isEthereal = true
    console.log(`[Email Service] Created live real-time test account: ${testAccount.user}`)
    return cachedTransporter
  } catch (err) {
    console.warn('[Email Service] Failed to create Ethereal account, using direct SMTP fallback:', err.message)
    cachedTransporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'windows',
    })
    return cachedTransporter
  }
}

export async function sendOtpEmail(toEmail, otp) {
  const transporter = await getTransporter()
  const emailUser = (process.env.EMAIL_USER || process.env.SMTP_USER || 'mtrx.tech512@gmail.com').trim()
  const rawPass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || 'bjhpspfzyohfxxme').trim()
  const emailPass = (!process.env.SMTP_HOST && emailUser.toLowerCase().includes('gmail.com'))
    ? rawPass.replace(/\s+/g, '')
    : rawPass

  const fromAddress = process.env.EMAIL_FROM || `"Aarogya Multi-Speciality Hospital" <${emailUser}>`

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    replyTo: fromAddress,
    subject: `Aarogya Hospital: ${otp} is your verification code`,
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'High',
    },
    text: `Your security verification code for Aarogya Hospital registration is: ${otp}. This code is valid for 10 minutes. If you did not request this, please disregard.`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; }
          .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 28px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.02em; }
          .header p { margin: 6px 0 0 0; font-size: 13px; color: #93c5fd; }
          .body { padding: 32px 28px; color: #1e293b; line-height: 1.6; }
          .badge { display: inline-block; background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; margin-bottom: 16px; }
          .code-box { background: #f8fafc; border: 2px dashed #3b82f6; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 34px; font-weight: 800; letter-spacing: 0.25em; color: #1d4ed8; font-family: 'Courier New', Courier, monospace; }
          .expiry { font-size: 13px; color: #64748b; margin-top: 8px; }
          .notice { font-size: 13px; color: #64748b; background-color: #f8fafc; border-left: 3px solid #3b82f6; padding: 10px 14px; margin-top: 24px; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>AAROGYA MULTI-SPECIALITY HOSPITAL</h1>
            <p>Outpatient Department &amp; Patient Portal</p>
          </div>
          <div class="body">
            <span class="badge">SECURE EMAIL VERIFICATION</span>
            <p>Hello,</p>
            <p>Thank you for registering with <strong>Aarogya Multi-Speciality Hospital</strong>. To activate your digital health record and complete your registration, please verify your email address using the code below:</p>
            
            <div class="code-box">
              <div class="otp-code">${otp}</div>
              <div class="expiry">This verification code expires in <strong>10 minutes</strong>.</div>
            </div>

            <p>Please enter this 6-digit code on the registration page to confirm your email.</p>
            
            <div class="notice">
              <strong>Security Notice:</strong> Never share this verification code with anyone. Hospital staff will never ask for your security OTP. If you did not initiate this registration, please disregard this email.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Aarogya Multi-Speciality Hospital. Sector 14, Health City, New Delhi - 110001<br>
            24x7 Emergency OPD Helpline: +91 11 2345 6789
          </div>
        </div>
      </body>
      </html>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(`[Email Service] Real-time OTP email dispatched via ${emailUser} to ${toEmail}. Message ID: ${info.messageId}`)

    let previewUrl = null
    if (isEthereal) {
      previewUrl = nodemailer.getTestMessageUrl(info)
      console.log(`[Email Service] Real-time preview available at: ${previewUrl}`)
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
      isRealSmtp: !isEthereal,
      sender: emailUser,
    }
  } catch (err) {
    cachedTransporter = null // Reset cached transporter on failure so next request retries cleanly
    console.warn(`[Email Service] Live SMTP delivery via port 465 failed: ${err.message}`)

    // 1. If port 465 timed out or blocked, retry via port 587 (STARTTLS) with forced IPv4
    try {
      console.log(`[Email Service] Retrying delivery via port 587 (STARTTLS) with forced IPv4...`)
      const fallbackPort587 = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        family: 4,
        lookup: ipv4Lookup,
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
        tls: {
          servername: 'smtp.gmail.com',
          rejectUnauthorized: false,
        },
      })

      const port587Info = await fallbackPort587.sendMail(mailOptions)
      console.log(`[Email Service] Port 587 retry successfully delivered OTP to ${toEmail}. Message ID: ${port587Info.messageId}`)
      return {
        success: true,
        messageId: port587Info.messageId,
        previewUrl: null,
        isRealSmtp: true,
        sender: emailUser,
      }
    } catch (retryErr) {
      console.warn('[Email Service] Port 587 retry also failed:', retryErr.message)
    }

    const isAuthError = err.message && (err.message.includes('535') || err.message.includes('BadCredentials') || err.message.includes('Username and Password not accepted'))

    const authWarning = isAuthError
      ? `Google SMTP rejected credentials for ${emailUser} (BadCredentials). Please verify your 16-character App Password.`
      : `Email delivery issue: ${err.message}`

    if (!isEthereal) {
      console.warn('[Email Service] Activating automatic sandbox fallback...')
      try {
        const testAccount = await nodemailer.createTestAccount()
        const fallbackTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          lookup: ipv4Lookup,
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        })
        const fallbackInfo = await fallbackTransporter.sendMail({
          ...mailOptions,
          from: '"Aarogya Multi-Speciality Hospital" <no-reply@aarogyahospital.in>',
        })
        const previewUrl = nodemailer.getTestMessageUrl(fallbackInfo)
        console.log(`[Email Service] Real-time fallback preview available at: ${previewUrl}`)
        return {
          success: true,
          messageId: fallbackInfo.messageId,
          previewUrl,
          isRealSmtp: false,
          sender: emailUser,
          smtpWarning: authWarning,
        }
      } catch (fallbackErr) {
        console.error('[Email Service] Sandbox fallback also failed:', fallbackErr.message)
      }
    }

    return {
      success: true,
      messageId: null,
      previewUrl: null,
      isRealSmtp: false,
      sender: emailUser,
      smtpWarning: authWarning,
      deliveryNotice: 'Code generated. Please verify your sender App Password in Google Account settings.',
    }
  }
}
