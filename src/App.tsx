import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Navbar } from './components/Navbar'
import { Sidebar } from './components/Sidebar'
import { HospitalCrossIcon, CheckIcon } from './components/Icons'

import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'

import { PatientDashboard } from './pages/patient/PatientDashboard'
import { BookAppointment } from './pages/patient/BookAppointment'
import { FindDoctors } from './pages/patient/FindDoctors'
import { MyAppointments } from './pages/patient/MyAppointments'
import { LiveWaitingRoom } from './pages/patient/LiveWaitingRoom'
import { PatientPrescriptions } from './pages/patient/PatientPrescriptions'
import { VisitHistory } from './pages/patient/VisitHistory'
import { PatientProfile } from './pages/patient/PatientProfile'
import { Notifications } from './pages/patient/Notifications'

import { DoctorDashboard } from './pages/doctor/DoctorDashboard'
import { TodayAppointments } from './pages/doctor/TodayAppointments'
import { DoctorAppointments } from './pages/doctor/DoctorAppointments'
import { DoctorPatientHistory } from './pages/doctor/DoctorPatientHistory'
import { DoctorSchedulePage } from './pages/doctor/DoctorSchedule'

import { AdminDashboard } from './pages/admin/AdminDashboard'
import { QueueMonitor } from './pages/admin/QueueMonitor'
import { ManagePayments } from './pages/admin/ManagePayments'
import { ManageDoctors } from './pages/admin/ManageDoctors'
import { ManageDepartments } from './pages/admin/ManageDepartments'
import { ManageSchedules } from './pages/admin/ManageSchedules'
import { ManagePatients } from './pages/admin/ManagePatients'
import { ManageAppointments } from './pages/admin/ManageAppointments'
import { ReportsPage } from './pages/admin/Reports'

import { api } from './services/api'
import './index.css'

function MainApp() {
  const { user, loading } = useAuth()
  const [isRegistering, setIsRegistering] = useState(false)
  const [currentTab, setCurrentTab] = useState('dashboard')
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    setCurrentTab('dashboard')
    if (user) {
      loadUnreadCount()
    }
  }, [user])

  async function loadUnreadCount() {
    try {
      const data = await api.getNotifications()
      setUnreadNotifications(data.unreadCount || 0)
    } catch {
      // Intentionally silent
    }
  }

  function showToast(msg: string) {
    setToastMessage(msg)
    window.setTimeout(() => {
      setToastMessage('')
    }, 3500)
  }

  if (loading) {
    return (
      <div className="auth-container">
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <HospitalCrossIcon size={32} color="#0284c7" />
          </div>
          <div style={{ fontWeight: 600 }}>Loading Aarogya Hospital System...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    if (isRegistering) {
      return <Register onSwitchToLogin={() => setIsRegistering(false)} />
    }
    return <Login onSwitchToRegister={() => setIsRegistering(true)} />
  }

  const role = user.role

  return (
    <div className="app-container">
      <Navbar
        unreadNotificationsCount={unreadNotifications}
        onNotificationsClick={() => setCurrentTab('notifications')}
      />

      <div className="app-main-layout">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab)
            if (tab === 'notifications') {
              loadUnreadCount()
            }
          }}
          unreadCount={unreadNotifications}
        />

        <main className="app-content-wrapper">
          {role === 'patient' && (
            <>
              {currentTab === 'dashboard' && <PatientDashboard onNavigate={setCurrentTab} />}
              {currentTab === 'book-appointment' && (
                <BookAppointment onNotify={showToast} onNavigate={setCurrentTab} />
              )}
              {currentTab === 'find-doctors' && <FindDoctors onNotify={showToast} />}
              {currentTab === 'my-appointments' && (
                <MyAppointments onNotify={showToast} onNavigate={setCurrentTab} />
              )}
              {currentTab === 'live-waiting-room' && (
                <LiveWaitingRoom onNotify={showToast} onNavigate={setCurrentTab} />
              )}
              {currentTab === 'my-prescriptions' && (
                <PatientPrescriptions onNotify={showToast} onNavigate={setCurrentTab} />
              )}
              {currentTab === 'visit-history' && <VisitHistory onNavigate={setCurrentTab} />}
              {currentTab === 'profile' && <PatientProfile onNotify={showToast} />}
              {currentTab === 'notifications' && (
                <Notifications onRefreshBadge={loadUnreadCount} />
              )}
            </>
          )}

          {role === 'doctor' && (
            <>
              {currentTab === 'dashboard' && (
                <DoctorDashboard onNavigate={setCurrentTab} onNotify={showToast} />
              )}
              {currentTab === 'today-appointments' && (
                <TodayAppointments onNotify={showToast} />
              )}
              {currentTab === 'all-appointments' && (
                <DoctorAppointments onNotify={showToast} />
              )}
              {currentTab === 'patient-history' && (
                <DoctorPatientHistory />
              )}
              {currentTab === 'my-schedule' && (
                <DoctorSchedulePage onNotify={showToast} />
              )}
              {currentTab === 'notifications' && (
                <Notifications onRefreshBadge={loadUnreadCount} />
              )}
            </>
          )}

          {role === 'admin' && (
            <>
              {currentTab === 'dashboard' && <AdminDashboard onNavigate={setCurrentTab} />}
              {currentTab === 'queue-monitor' && <QueueMonitor onNotify={showToast} />}
              {currentTab === 'manage-payments' && <ManagePayments onNotify={showToast} />}
              {currentTab === 'manage-doctors' && <ManageDoctors onNotify={showToast} />}
              {currentTab === 'manage-departments' && (
                <ManageDepartments onNotify={showToast} />
              )}
              {currentTab === 'manage-schedules' && <ManageSchedules onNotify={showToast} />}
              {currentTab === 'manage-patients' && <ManagePatients />}
              {currentTab === 'manage-appointments' && (
                <ManageAppointments onNotify={showToast} />
              )}
              {currentTab === 'reports' && <ReportsPage />}
            </>
          )}
        </main>
      </div>

      {toastMessage && (
        <div className="toast-banner">
          <span className="toast-icon">
            <CheckIcon size={16} color="#ffffff" />
          </span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}
