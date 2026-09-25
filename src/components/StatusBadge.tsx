import React from 'react'
import {
  HourglassIcon,
  CheckIcon,
  CheckCircleIcon,
  CrossIcon,
  CreditCardIcon,
  QrCodeIcon,
  QueueIcon,
  StethoscopeIcon,
  AlertCircleIcon,
} from './Icons'

interface StatusBadgeProps {
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
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const norm = status?.toUpperCase() || 'REQUESTED'

  const styles: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
    REQUESTED: {
      bg: '#fef3c7',
      text: '#92400e',
      label: 'Requested',
      icon: <HourglassIcon size={12} color="#92400e" />,
    },
    PENDING_PAYMENT: {
      bg: '#ffedd5',
      text: '#c2410c',
      label: 'Payment Pending',
      icon: <CreditCardIcon size={12} color="#c2410c" />,
    },
    CONFIRMED: {
      bg: '#dbeafe',
      text: '#1e40af',
      label: 'Confirmed',
      icon: <CheckIcon size={12} color="#1e40af" />,
    },
    CHECKED_IN: {
      bg: '#e0f2fe',
      text: '#0369a1',
      label: 'Checked In',
      icon: <QrCodeIcon size={12} color="#0369a1" />,
    },
    WAITING: {
      bg: '#e0e7ff',
      text: '#4338ca',
      label: 'In Queue',
      icon: <QueueIcon size={12} color="#4338ca" />,
    },
    IN_CONSULTATION: {
      bg: '#f3e8ff',
      text: '#7e22ce',
      label: 'In Consultation',
      icon: <StethoscopeIcon size={12} color="#7e22ce" />,
    },
    COMPLETED: {
      bg: '#dcfce7',
      text: '#166534',
      label: 'Completed',
      icon: <CheckCircleIcon size={12} color="#166534" />,
    },
    CANCELLED: {
      bg: '#fee2e2',
      text: '#991b1b',
      label: 'Cancelled',
      icon: <CrossIcon size={12} color="#991b1b" />,
    },
    NO_SHOW: {
      bg: '#ffe4e6',
      text: '#be123c',
      label: 'No Show',
      icon: <AlertCircleIcon size={12} color="#be123c" />,
    },
  }

  const current = styles[norm] || styles.REQUESTED

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '0.78rem',
        fontWeight: 600,
        backgroundColor: current.bg,
        color: current.text,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
      }}
    >
      {current.icon}
      <span>{current.label}</span>
    </span>
  )
}
