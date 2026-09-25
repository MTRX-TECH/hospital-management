import React from 'react'
import { useAuth } from '../context/AuthContext'
import {
  HomeIcon,
  SearchIcon,
  CalendarIcon,
  FileTextIcon,
  UserIcon,
  BellIcon,
  StethoscopeIcon,
  ClockIcon,
  ChartBarIcon,
  UsersIcon,
  BuildingIcon,
  ActivityIcon,
  QueueIcon,
  PrescriptionIcon,
  CreditCardIcon,
  PlusIcon,
} from './Icons'

interface SidebarProps {
  currentTab: string
  onSelectTab: (tab: string) => void
  unreadCount?: number
}

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  badge?: number
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, unreadCount = 0 }) => {
  const { user } = useAuth()
  const role = user?.role || 'patient'

  const navItemsByRole: Record<string, NavItem[]> = {
    patient: [
      { id: 'dashboard', label: 'Patient Dashboard', icon: <HomeIcon size={18} /> },
      { id: 'book-appointment', label: 'Book Appointment', icon: <PlusIcon size={18} /> },
      { id: 'find-doctors', label: 'Find Doctors', icon: <SearchIcon size={18} /> },
      { id: 'my-appointments', label: 'My Appointments', icon: <CalendarIcon size={18} /> },
      { id: 'live-waiting-room', label: 'Live Waiting Room', icon: <QueueIcon size={18} /> },
      { id: 'my-prescriptions', label: 'My Prescriptions', icon: <PrescriptionIcon size={18} /> },
      { id: 'visit-history', label: 'Visit History & Notes', icon: <FileTextIcon size={18} /> },
      { id: 'profile', label: 'My Profile', icon: <UserIcon size={18} /> },
      { id: 'notifications', label: 'Notifications', icon: <BellIcon size={18} />, badge: unreadCount },
    ],
    doctor: [
      { id: 'dashboard', label: 'Doctor Dashboard', icon: <HomeIcon size={18} /> },
      { id: 'today-appointments', label: "OPD Queue Board", icon: <QueueIcon size={18} /> },
      { id: 'all-appointments', label: 'Assigned Appointments', icon: <CalendarIcon size={18} /> },
      { id: 'patient-history', label: 'Patient Medical History', icon: <FileTextIcon size={18} /> },
      { id: 'my-schedule', label: 'Clinic Schedule', icon: <ClockIcon size={18} /> },
      { id: 'notifications', label: 'Notifications', icon: <BellIcon size={18} />, badge: unreadCount },
    ],
    admin: [
      { id: 'dashboard', label: 'Hospital Dashboard', icon: <ChartBarIcon size={18} /> },
      { id: 'queue-monitor', label: 'OPD Queue Monitor', icon: <QueueIcon size={18} /> },
      { id: 'manage-payments', label: 'Hospital Payments', icon: <CreditCardIcon size={18} /> },
      { id: 'manage-doctors', label: 'Manage Doctors', icon: <StethoscopeIcon size={18} /> },
      { id: 'manage-departments', label: 'Manage Departments', icon: <BuildingIcon size={18} /> },
      { id: 'manage-schedules', label: 'Doctor Schedules', icon: <ClockIcon size={18} /> },
      { id: 'manage-patients', label: 'Manage Patients', icon: <UsersIcon size={18} /> },
      { id: 'manage-appointments', label: 'Manage Appointments', icon: <CalendarIcon size={18} /> },
      { id: 'reports', label: 'Reports & Analytics', icon: <ActivityIcon size={18} /> },
    ],
  }

  const items = navItemsByRole[role] || navItemsByRole.patient

  return (
    <aside className="app-sidebar">
      <div className="sidebar-section-title">{role.toUpperCase()} PORTAL</div>
      <nav className="sidebar-nav">
        {items.map((item) => {
          const isActive = currentTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span className="sidebar-nav-label">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="sidebar-nav-badge">{item.badge}</span>
              ) : null}
            </button>
          )
        })}
      </nav>

      <div className="sidebar-info-box">
        <div className="info-title">System Status</div>
        <div className="info-body">
          <span className="status-indicator-dot online"></span>
          Database Connected (MongoDB)
        </div>
      </div>
    </aside>
  )
}
