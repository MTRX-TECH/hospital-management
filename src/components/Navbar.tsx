import React from 'react'
import { useAuth } from '../context/AuthContext'
import { HospitalCrossIcon, BellIcon, LogOutIcon } from './Icons'

interface NavbarProps {
  unreadNotificationsCount?: number
  onNotificationsClick?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  unreadNotificationsCount = 0,
  onNotificationsClick,
}) => {
  const { user, logout } = useAuth()

  const roleColors: Record<string, { bg: string; text: string }> = {
    patient: { bg: '#e0f2fe', text: '#0369a1' },
    doctor: { bg: '#dcfce7', text: '#15803d' },
    admin: { bg: '#fef3c7', text: '#b45309' },
  }

  const roleStyle = roleColors[user?.role || 'patient']

  return (
    <header className="top-navbar">
      <div className="navbar-brand">
        <span className="brand-cross">
          <HospitalCrossIcon size={20} color="#ffffff" />
        </span>
        <div>
          <span className="brand-title">AAROGYA</span>
          <span className="brand-subtitle">MULTI-SPECIALITY HOSPITAL</span>
        </div>
      </div>

      <div className="navbar-actions">
        {onNotificationsClick && (
          <button
            onClick={onNotificationsClick}
            className="notif-bell-btn"
            title="Notifications"
            aria-label="View notifications"
          >
            <BellIcon size={18} color="#475569" />
            {unreadNotificationsCount > 0 && (
              <span className="notif-badge">{unreadNotificationsCount}</span>
            )}
          </button>
        )}

        <div className="user-profile-badge">
          <div className="user-avatar">
            {user?.name
              ? user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : 'U'}
          </div>
          <div className="user-details">
            <span className="user-name">{user?.name}</span>
            <span
              className="user-role-pill"
              style={{ backgroundColor: roleStyle.bg, color: roleStyle.text }}
            >
              {user?.role.toUpperCase()}
            </span>
          </div>
        </div>

        <button onClick={logout} className="logout-button" title="Sign out of your account">
          <LogOutIcon size={16} color="currentColor" />
          <span className="logout-text">Sign Out</span>
        </button>
      </div>
    </header>
  )
}
