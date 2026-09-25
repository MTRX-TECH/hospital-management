import React, { useState, useEffect } from 'react'
import { api, type NotificationItem } from '../../services/api'
import { EmptyState } from '../../components/EmptyState'
import { CheckIcon, BellIcon, BuildingIcon, CalendarIcon } from '../../components/Icons'

interface NotificationsProps {
  onRefreshBadge?: () => void
}

export const Notifications: React.FC<NotificationsProps> = ({ onRefreshBadge }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getNotifications()
      setNotifications(data.notifications || [])
      onRefreshBadge?.()
    } catch (err: any) {
      setError(err.message || 'Could not load notifications.')
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await api.markNotificationRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      onRefreshBadge?.()
    } catch (err: any) {
      console.warn('Could not mark notification read:', err)
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      onRefreshBadge?.()
    } catch (err: any) {
      console.warn('Could not mark all notifications read:', err)
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications &amp; Care Alerts</h1>
          <p className="page-subtitle">
            Secure in-app appointment status updates, confirmations, and clinic messages
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <CheckIcon size={14} color="currentColor" />
            Mark All as Read
          </button>
        )}
      </div>

      {error && <div className="form-alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">Loading notifications...</div>
      ) : notifications.length > 0 ? (
        <div className="notifications-list-card">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`notification-item-row ${!n.isRead ? 'unread' : 'read'}`}
            >
              <div className="notification-status-icon">
                {n.type === 'status' ? (
                  <BellIcon size={20} color="#0284c7" />
                ) : n.type === 'system' ? (
                  <BuildingIcon size={20} color="#6366f1" />
                ) : (
                  <CalendarIcon size={20} color="#059669" />
                )}
              </div>

              <div className="notification-main-content">
                <div className="notification-title-bar">
                  <h4 className="notification-headline">{n.title}</h4>
                  <span className="notification-timestamp">
                    {new Date(n.createdAt).toLocaleDateString()} at{' '}
                    {new Date(n.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="notification-body-text">{n.message}</p>
              </div>

              {!n.isRead && (
                <button
                  type="button"
                  onClick={() => handleMarkRead(n.id)}
                  className="btn-mark-read"
                  title="Mark this notification as read"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BellIcon size={38} color="#94a3b8" />}
          title="No Notifications"
          message="You have no notifications or messages at this time."
        />
      )}
    </div>
  )
}
