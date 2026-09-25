import React from 'react'
import { FolderIcon } from './Icons'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        border: '1px dashed #cbd5e1',
        borderRadius: '12px',
        margin: '16px 0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '12px' }}>
        {icon || <FolderIcon size={38} color="#94a3b8" />}
      </div>
      <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>
        {title}
      </h3>
      <p style={{ margin: '0 auto 16px', maxWidth: '420px', fontSize: '0.9rem', color: '#64748b' }}>
        {message}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-primary"
          style={{
            padding: '8px 18px',
            fontSize: '0.88rem',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
