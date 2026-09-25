import React from 'react'
import { ActivityIcon } from './Icons'

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'red'
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
}) => {
  const colorMap = {
    blue: { bg: '#eff6ff', border: '#bfdbfe', iconBg: '#dbeafe', iconColor: '#1e40af' },
    green: { bg: '#f0fdf4', border: '#bbf7d0', iconBg: '#dcfce7', iconColor: '#166534' },
    amber: { bg: '#fffbeb', border: '#fde68a', iconBg: '#fef3c7', iconColor: '#92400e' },
    purple: { bg: '#faf5ff', border: '#e9d5ff', iconBg: '#f3e8ff', iconColor: '#6b21a8' },
    red: { bg: '#fef2f2', border: '#fecaca', iconBg: '#fee2e2', iconColor: '#991b1b' },
  }

  const c = colorMap[color] || colorMap.blue

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '10px',
          backgroundColor: c.iconBg,
          color: c.iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon || <ActivityIcon size={20} color={c.iconColor} />}
      </div>
      <div>
        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500, marginBottom: '2px' }}>{title}</div>
        <div style={{ fontSize: '1.65rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>{value}</div>
        {subtitle && <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>{subtitle}</div>}
      </div>
    </div>
  )
}
