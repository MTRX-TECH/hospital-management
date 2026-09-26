export function getApiBaseUrl(): string {
  // 1. Runtime override via localStorage (allows instant configuration without rebuilding)
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('hospital_api_url')
    if (customUrl && customUrl.trim()) {
      let clean = customUrl.trim().replace(/\/+$/, '')
      if (window.location.protocol === 'https:' && clean.startsWith('http://') && !clean.includes('localhost')) {
        clean = clean.replace('http://', 'https://')
      }
      return clean.endsWith('/api') ? clean : `${clean}/api`
    }
  }

  // 2. Build-time environment variable VITE_API_URL
  const envUrl = (import.meta.env.VITE_API_URL || '').trim()
  if (envUrl) {
    let clean = envUrl.replace(/\/+$/, '')
    // Auto-upgrade insecure http to https if current window is https and target is not localhost
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && clean.startsWith('http://') && !clean.includes('localhost')) {
      clean = clean.replace('http://', 'https://')
    }
    return clean.endsWith('/api') ? clean : `${clean}/api`
  }

  // 3. Browser environment fallback
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location
    // Local development server on machine
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:4000/api'
    }
    // Remote production hosting (Render unified deployment, Docker, or Vercel proxy)
    // Uses current origin with /api, ensuring zero mixed-content and correct domain targeting
    return `${origin}/api`
  }

  return 'http://localhost:4000/api'
}

export const API_URL = getApiBaseUrl()

export function setCustomApiUrl(url: string): void {
  if (typeof window !== 'undefined') {
    let clean = url.trim().replace(/\/+$/, '')
    if (window.location.protocol === 'https:' && clean.startsWith('http://') && !clean.includes('localhost')) {
      clean = clean.replace('http://', 'https://')
    }
    const formatted = clean.endsWith('/api') ? clean : `${clean}/api`
    localStorage.setItem('hospital_api_url', formatted)
  }
}

export function resetCustomApiUrl(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('hospital_api_url')
  }
}

export async function checkApiHealth(customUrl?: string): Promise<{
  ok: boolean
  data?: any
  error?: string
  latencyMs?: number
}> {
  let base = (customUrl ? customUrl.trim().replace(/\/+$/, '') : getApiBaseUrl()).replace(/\/+$/, '')
  // Normalize base: if user typed e.g. https://xyz.onrender.com, target /api/health
  const testUrl = base.endsWith('/api') ? `${base}/health` : `${base}/api/health`

  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(testUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const latencyMs = Date.now() - start
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('text/html')) {
      return {
        ok: false,
        latencyMs,
        error: 'Returned HTML page (likely SPA catch-all rewrite) instead of API JSON response.',
      }
    }

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return {
        ok: false,
        latencyMs,
        error: data.message || `Server responded with HTTP ${res.status}`,
      }
    }

    return {
      ok: true,
      latencyMs,
      data,
    }
  } catch (err: any) {
    const latencyMs = Date.now() - start
    return {
      ok: false,
      latencyMs,
      error: err.name === 'AbortError' ? 'Connection timed out (8s)' : (err.message || 'Network connection failed'),
    }
  }
}

if (typeof window !== 'undefined') {
  ;(window as any).setHospitalApiUrl = (url: string) => {
    setCustomApiUrl(url)
    console.log('[Hospital API] Updated backend URL to:', url)
    window.location.reload()
  }
}


export interface User {
  id: string
  name: string
  email: string
  role: 'patient' | 'doctor' | 'admin'
  phone: string
  profileId?: string | null
}

export interface PatientProfile {
  id: string
  dateOfBirth?: string
  gender?: string
  bloodGroup?: string
  address?: string
  emergencyContact?: string
}

export interface Department {
  _id: string
  name: string
  description?: string
  createdAt?: string
}

export interface Doctor {
  id: string
  name: string
  email: string
  phone: string
  specialization: string
  experienceYears: number
  consultationFee: number
  qualification: string
  bio: string
  department: string
  departmentId?: string
  schedules?: DoctorSchedule[]
}

export interface DoctorSchedule {
  _id?: string
  doctor?: string
  dayOfWeek: number
  startTime: string
  endTime: string
  slotDuration: number
  isAvailable: boolean
}

export interface PreConsultationData {
  reason?: string
  symptoms?: string[]
  symptomDuration?: string
  existingConditions?: string[]
  currentMedications?: string
  knownAllergies?: string
  additionalNotes?: string
  submittedAt?: string
}

export interface PrescriptionMedicine {
  name: string // Tablet / Medicine Name
  dosage: string // e.g. "1 Tablet", "500mg"
  frequency: string // e.g. "2 times a day (After Food)"
  numberOfTimes?: string // e.g. "2 times a day"
  timing?: string // e.g. "After Food", "Before Food"
  duration: string // e.g. "5 Days"
  instructions: string // e.g. "Take with warm water"
}

export interface PrescriptionSlipData {
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
  medicines: PrescriptionMedicine[]
  doctorAdvice?: string
  followUpDate?: string
  prescribedAt?: string
  hospitalName?: string
  hospitalAddress?: string
}

export interface PaymentReceiptData {
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

export interface QueueStatusData {
  appointmentId: string
  patientName: string
  doctorName: string
  department: string
  appointmentDate: string
  appointmentTime: string
  queueToken: string
  queueNumber: number
  checkInStatus: string
  status: string
  currentToken: string
  isCurrentPatientCalled: boolean
  patientsAhead: number
  estimatedWaitMinutes: number
  totalWaiting: number
  lastUpdated: string
}

export interface DoctorQueueData {
  targetDate: string
  stats: {
    totalScheduled: number
    checkedInCount: number
    waitingCount: number
    inConsultationCount: number
    completedCount: number
    noShowCount: number
  }
  activeConsultation: any | null
  nextInLine: any | null
  queue: any[]
}

export interface AdminPaymentsData {
  stats: {
    totalRevenue: number
    todayRevenue: number
    totalTransactions: number
    methodBreakdown: { UPI: number; CARD: number; NETBANKING: number; CASH: number }
  }
  payments: any[]
}

export interface Appointment {
  id: string
  appointmentDate: string
  appointmentTime: string
  reason: string
  status:
    | 'REQUESTED'
    | 'PENDING_PAYMENT'
    | 'CONFIRMED'
    | 'CHECKED_IN'
    | 'WAITING'
    | 'IN_CONSULTATION'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'NO_SHOW'
    | string
  createdAt: string
  patientId: string
  patient: string
  patientEmail: string
  patientPhone: string
  patientGender?: string
  patientBloodGroup?: string
  patientDOB?: string
  doctorId: string
  doctor: string
  doctorPhone?: string
  department: string
  specialization: string
  consultationFee: number
  // Payment
  paymentStatus?: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED' | string
  totalFee?: number
  advancePaid?: number
  remainingBalance?: number
  paymentMethod?: string
  transactionReference?: string
  paidAt?: string
  // Queue & Check-In
  checkInStatus?: 'NOT_CHECKED_IN' | 'CHECKED_IN' | 'EXPIRED' | string
  checkInTime?: string
  queueToken?: string
  queueNumber?: number
  calledAt?: string
  isSkipped?: boolean
  noShowAt?: string
  // Clinical
  preConsultation?: PreConsultationData
  prescription?: PrescriptionSlipData
}

export interface VisitRecord {
  id: string
  appointmentId: string
  appointmentDate: string
  appointmentTime: string
  reason: string
  diagnosisSummary: string
  doctorNotes: string
  reportImageUrl?: string
  doctorName: string
  department: string
  patientName: string
  patientPhone?: string
  patientGender?: string
  patientBloodGroup?: string
  patientId?: string
  preConsultation?: PreConsultationData
  prescription?: {
    medicines: PrescriptionMedicine[]
    doctorAdvice?: string
    followUpDate?: string
    prescribedAt?: string
  }
  totalFee?: number
  paymentStatus?: string
  createdAt: string
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'appointment' | 'status' | 'reminder' | 'system'
  isRead: boolean
  createdAt: string
}

export interface ReportData {
  summary: {
    totalDoctors: number
    totalPatients: number
    totalDepartments: number
    totalAppointments: number
    todayAppointments: number
    pendingRequests: number
    confirmedAppointments: number
    completedAppointments: number
    cancelledAppointments: number
  }
  statusCounts: Array<{ status: string; count: number }>
  departments: Array<{ department: string; count: number }>
  doctors: Array<{ doctor: string; count: number }>
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('hospital_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  }

  const baseUrl = getApiBaseUrl()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const targetUrl = `${baseUrl}${cleanPath}`

  let response: Response
  try {
    response = await fetch(targetUrl, {
      ...options,
      headers,
    })
  } catch (err: any) {
    console.error(`[Hospital API Network Error] ${options.method || 'GET'} ${targetUrl}:`, err)
    if (typeof window !== 'undefined' && targetUrl.includes('localhost:4000') && window.location.hostname !== 'localhost') {
      throw new Error(
        `Backend API is currently configured to localhost:4000. In production, please set VITE_API_URL or run setHospitalApiUrl('https://your-backend.onrender.com') in the browser console.`
      )
    }
    throw new Error(
      `Unable to connect to hospital server (${err.message || 'Network error'}). Please verify your backend server status or network connection.`
    )
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('text/html')) {
    console.error(`[Hospital API Error] Received HTML response from ${targetUrl} (Status ${response.status})`)
    throw new Error(
      `Hospital backend returned an invalid response (HTML instead of API JSON). If hosted on a cloud provider, ensure backend URL is configured correctly.`
    )
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        data.message || `Endpoint not found (404) at ${targetUrl}. Please verify your backend server URL.`
      )
    }
    throw new Error(data.message || `Request failed with status ${response.status}`)
  }

  return data as T
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: User; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (details: {
    name: string
    email: string
    phone: string
    password: string
    dateOfBirth?: string
    gender?: string
    bloodGroup?: string
    address?: string
    emergencyContact?: string
  }) =>
    request<{ token: string; user: User; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(details),
    }),

  getMe: () => request<{ user: User; profile: any }>('/auth/me'),

  updateProfile: (details: {
    name?: string
    phone?: string
    dateOfBirth?: string
    gender?: string
    bloodGroup?: string
    address?: string
    emergencyContact?: string
  }) =>
    request<{ message: string; user: User; profile: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(details),
    }),

  // Departments
  getDepartments: () => request<Department[]>('/departments'),
  createDepartment: (details: { name: string; description?: string }) =>
    request<Department>('/departments', { method: 'POST', body: JSON.stringify(details) }),
  updateDepartment: (id: string, details: { name?: string; description?: string }) =>
    request<Department>(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(details) }),
  deleteDepartment: (id: string) =>
    request<{ message: string }>(`/departments/${id}`, { method: 'DELETE' }),

  // Doctors
  getDoctors: (params: { search?: string; specialization?: string; department?: string } = {}) => {
    const query = new URLSearchParams()
    if (params.search) query.append('search', params.search)
    if (params.specialization) query.append('specialization', params.specialization)
    if (params.department) query.append('department', params.department)
    const queryString = query.toString() ? `?${query.toString()}` : ''
    return request<Doctor[]>(`/doctors${queryString}`)
  },

  getDoctorById: (id: string) => request<Doctor>(`/doctors/${id}`),

  createDoctor: (details: {
    name: string
    email: string
    phone: string
    password: string
    specialization: string
    experienceYears: number
    consultationFee: number
    departmentId: string
    qualification?: string
    bio?: string
  }) => request<{ id: string; name: string }>('/doctors', { method: 'POST', body: JSON.stringify(details) }),

  updateDoctor: (id: string, details: Partial<Doctor> & { departmentId?: string }) =>
    request<{ message: string }>(`/doctors/${id}`, { method: 'PUT', body: JSON.stringify(details) }),

  deleteDoctor: (id: string) => request<{ message: string }>(`/doctors/${id}`, { method: 'DELETE' }),

  // Schedules & Available Slots
  getAvailableSlots: (doctorId: string, date: string) =>
    request<{
      doctor: string
      date: string
      dayOfWeek: number
      allSlots: Array<{ time: string; isBooked: boolean }>
      availableSlots: string[]
      bookedSlots: string[]
      message?: string
    }>(`/schedules/slots?doctorId=${doctorId}&date=${date}`),

  getDoctorSchedules: (doctorId: string) => request<DoctorSchedule[]>(`/schedules/doctor/${doctorId}`),

  saveSchedule: (details: {
    doctorId: string
    dayOfWeek: number
    startTime: string
    endTime: string
    slotDuration?: number
    isAvailable?: boolean
  }) => request<DoctorSchedule>('/schedules', { method: 'POST', body: JSON.stringify(details) }),

  deleteSchedule: (id: string) => request<{ message: string }>(`/schedules/${id}`, { method: 'DELETE' }),

  // Appointments
  getAppointments: (params: { status?: string; date?: string } = {}) => {
    const query = new URLSearchParams()
    if (params.status) query.append('status', params.status)
    if (params.date) query.append('date', params.date)
    const queryString = query.toString() ? `?${query.toString()}` : ''
    return request<Appointment[]>(`/appointments${queryString}`)
  },

  getAppointmentById: (id: string) => request<Appointment>(`/appointments/${id}`),

  createAppointment: (details: {
    doctorId: string
    appointmentDate: string
    appointmentTime: string
    reason: string
    preConsultation?: PreConsultationData
    advancePaid?: number
    paymentMethod?: string
  }) =>
    request<{
      message: string
      id: string
      status: string
      paymentStatus?: string
      advancePaid?: number
      totalFee?: number
      remainingBalance?: number
      transactionReference?: string
      receiptNumber?: string
      paymentMethod?: string
      appointmentDate?: string
      appointmentTime?: string
    }>('/appointments', { method: 'POST', body: JSON.stringify(details) }),

  updateAppointmentStatus: (id: string, status: string) =>
    request<{ message: string; status: string }>(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  cancelAppointment: (id: string) =>
    request<{ message: string }>(`/appointments/${id}`, { method: 'DELETE' }),

  // Pre-Consultation Form
  submitPreConsultation: (appointmentId: string, data: PreConsultationData) =>
    request<{ message: string; preConsultation: PreConsultationData }>(
      `/appointments/${appointmentId}/pre-consultation`,
      { method: 'POST', body: JSON.stringify(data) }
    ),

  getPreConsultation: (appointmentId: string) =>
    request<PreConsultationData>(`/appointments/${appointmentId}/pre-consultation`),

  // QR & OPD Check-In
  checkInAppointment: (appointmentId: string) =>
    request<{ message: string; queueToken: string; queueNumber: number; status: string }>(
      `/appointments/${appointmentId}/check-in`,
      { method: 'POST' }
    ),

  // Live Waiting Room
  getQueueStatus: (appointmentId: string) =>
    request<QueueStatusData>(`/appointments/${appointmentId}/queue`),

  // Payments & Receipts
  createPayment: (details: {
    appointmentId: string
    amount: number
    paymentMethod?: string
    notes?: string
  }) => request<{ message: string; payment: any; appointment: any }>('/payments/create', {
    method: 'POST',
    body: JSON.stringify(details),
  }),

  getReceipt: (appointmentId: string) =>
    request<PaymentReceiptData>(`/payments/receipt/${appointmentId}`),

  getPaymentsList: () => request<AdminPaymentsData>('/payments'),

  // Digital Prescriptions
  savePrescription: (
    appointmentId: string,
    data: { medicines: PrescriptionMedicine[]; doctorAdvice?: string; followUpDate?: string }
  ) =>
    request<{ message: string; prescription: any }>(`/appointments/${appointmentId}/prescription`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPrescription: (appointmentId: string) =>
    request<PrescriptionSlipData>(`/appointments/${appointmentId}/prescription`),

  // Doctor OPD Queue Operations Board
  getDoctorQueue: (params: { date?: string; doctorId?: string } = {}) => {
    const q = new URLSearchParams()
    if (params.date) q.append('date', params.date)
    if (params.doctorId) q.append('doctorId', params.doctorId)
    const queryString = q.toString() ? `?${q.toString()}` : ''
    return request<DoctorQueueData>(`/doctor-queue/today${queryString}`)
  },

  callPatientQueue: (appointmentId: string) =>
    request<{ message: string; calledAt: string }>('/doctor-queue/call-next', {
      method: 'POST',
      body: JSON.stringify({ appointmentId }),
    }),

  startConsultation: (appointmentId: string) =>
    request<{ message: string; status: string }>('/doctor-queue/start-consultation', {
      method: 'POST',
      body: JSON.stringify({ appointmentId }),
    }),

  completeConsultationQueue: (data: {
    appointmentId: string
    diagnosisSummary?: string
    doctorNotes?: string
    doctorAdvice?: string
    medicines?: PrescriptionMedicine[]
    followUpDate?: string
    reportImageUrl?: string
  }) =>
    request<{ message: string; visitId: string }>('/doctor-queue/complete-consultation', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  skipPatientQueue: (appointmentId: string) =>
    request<{ message: string; isSkipped: boolean }>('/doctor-queue/skip-patient', {
      method: 'POST',
      body: JSON.stringify({ appointmentId }),
    }),

  markNoShow: (appointmentId: string, reason?: string) =>
    request<{ message: string; status: string }>('/doctor-queue/mark-no-show', {
      method: 'POST',
      body: JSON.stringify({ appointmentId, reason }),
    }),

  // OTP Email Verification
  sendOtp: async (email: string) => {
    try {
      return await request<{
        message: string
        emailDelivery?: {
          sent: boolean
          previewUrl?: string | null
          isRealSmtp?: boolean
        }
        simulatedOtp?: string
        otp?: string
        code?: string
        success?: boolean
      }>('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('not found')) {
        return await request<{
          message: string
          emailDelivery?: {
            sent: boolean
            previewUrl?: string | null
            isRealSmtp?: boolean
          }
          simulatedOtp?: string
          otp?: string
          code?: string
          success?: boolean
        }>('/send-otp', {
          method: 'POST',
          body: JSON.stringify({ email }),
        })
      }
      throw err
    }
  },

  verifyOtp: async (email: string, otp: string) => {
    try {
      return await request<{ message: string; verified: boolean }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      })
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('not found')) {
        return await request<{ message: string; verified: boolean }>('/verify-otp', {
          method: 'POST',
          body: JSON.stringify({ email, otp }),
        })
      }
      throw err
    }
  },

  // Cloudinary Image Upload
  uploadReportImage: (image: string, folder?: string) =>
    request<{ message: string; url: string; success: boolean }>('/upload', {
      method: 'POST',
      body: JSON.stringify({ image, folder }),
    }),

  // Visits
  getVisits: (patientId?: string, all?: boolean) => {
    const params = new URLSearchParams()
    if (patientId) params.append('patientId', patientId)
    if (all) params.append('all', 'true')
    const query = params.toString() ? `?${params.toString()}` : ''
    return request<VisitRecord[]>(`/visits${query}`)
  },

  createVisitRecord: (details: {
    appointmentId: string
    diagnosisSummary: string
    doctorNotes: string
    reportImageUrl?: string
  }) => request<{ message: string; id: string }>('/visits', { method: 'POST', body: JSON.stringify(details) }),

  // Notifications
  getNotifications: () =>
    request<{ notifications: NotificationItem[]; unreadCount: number }>('/notifications'),

  markNotificationRead: (id: string) =>
    request<{ message: string }>(`/notifications/${id}/read`, { method: 'PUT' }),

  markAllNotificationsRead: () =>
    request<{ message: string }>('/notifications/read-all', { method: 'PUT' }),

  // Patients (Admin / Doctor)
  getPatients: () =>
    request<
      Array<{
        id: string
        name: string
        email: string
        phone: string
        dateOfBirth: string
        gender: string
        bloodGroup: string
        address: string
        emergencyContact: string
        registeredDate: string
        appointmentCount: number
      }>
    >('/patients'),

  getPatientById: (id: string) =>
    request<{
      patient: any
      appointments: any[]
      visits: any[]
    }>(`/patients/${id}`),

  // Reports
  getReports: () => request<ReportData>('/reports'),
}
