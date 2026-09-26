import React, { useState, useEffect } from 'react'
import { getApiBaseUrl, checkApiHealth, setCustomApiUrl, resetCustomApiUrl } from '../services/api'
import { ServerIcon, SettingsIcon, CheckCircleIcon, CrossIcon, RefreshCwIcon } from './Icons'

interface ApiServerConfigProps {
  defaultOpen?: boolean
  onConfigChanged?: () => void
}

export const ApiServerConfig: React.FC<ApiServerConfigProps> = ({
  defaultOpen = false,
  onConfigChanged,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [currentUrl, setCurrentUrl] = useState('')
  const [inputUrl, setInputUrl] = useState('')
  const [checking, setChecking] = useState(false)
  const [healthStatus, setHealthStatus] = useState<'checking' | 'connected' | 'disconnected' | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    const url = getApiBaseUrl()
    setCurrentUrl(url)
    setInputUrl(url)
    verifyHealth(url)
  }, [])

  async function verifyHealth(urlToTest?: string) {
    setChecking(true)
    setHealthStatus('checking')
    setStatusMessage('Checking server connectivity...')
    try {
      const res = await checkApiHealth(urlToTest)
      if (res.ok) {
        setHealthStatus('connected')
        setStatusMessage(`Connected: ${res.data?.service || 'API Active'} (${res.latencyMs}ms)`)
      } else {
        setHealthStatus('disconnected')
        setStatusMessage(res.error || 'Server responded with an error.')
      }
    } catch (err: any) {
      setHealthStatus('disconnected')
      setStatusMessage(err.message || 'Unable to connect to backend server.')
    } finally {
      setChecking(false)
    }
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!inputUrl.trim()) return

    setCustomApiUrl(inputUrl.trim())
    const newBase = getApiBaseUrl()
    setCurrentUrl(newBase)
    setInputUrl(newBase)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)

    verifyHealth(newBase)
    if (onConfigChanged) onConfigChanged()
  }

  function handleReset() {
    resetCustomApiUrl()
    const newBase = getApiBaseUrl()
    setCurrentUrl(newBase)
    setInputUrl(newBase)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)

    verifyHealth(newBase)
    if (onConfigChanged) onConfigChanged()
  }

  return (
    <div style={{ marginTop: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8125rem',
          color: '#64748b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor:
                healthStatus === 'connected'
                  ? '#10b981'
                  : healthStatus === 'disconnected'
                  ? '#ef4444'
                  : '#f59e0b',
              display: 'inline-block',
            }}
          />
          <span style={{ fontWeight: 500 }}>Backend API:</span>
          <code
            style={{
              backgroundColor: '#f1f5f9',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: '#334155',
              maxWidth: '220px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'inline-block',
            }}
            title={currentUrl}
          >
            {currentUrl}
          </code>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            background: 'none',
            border: 'none',
            color: '#2563eb',
            cursor: 'pointer',
            fontSize: '0.8125rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '2px 6px',
          }}
        >
          <SettingsIcon size={14} color="#2563eb" />
          <span>{isOpen ? 'Close' : 'Configure'}</span>
        </button>
      </div>

      {statusMessage && !isOpen && (
        <div
          style={{
            fontSize: '0.75rem',
            color: healthStatus === 'connected' ? '#059669' : healthStatus === 'disconnected' ? '#dc2626' : '#d97706',
            marginTop: '0.25rem',
          }}
        >
          {statusMessage}
        </div>
      )}

      {isOpen && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.875rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <ServerIcon size={16} color="#1e40af" />
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>
              Production Backend Server Configuration
            </span>
          </div>

          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
            If your backend is hosted separately on Render, Railway, or AWS (e.g. <code>https://hospital-backend.onrender.com</code>), enter the base URL below.
          </p>

          <form onSubmit={handleSave}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://your-backend-api.onrender.com"
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  fontSize: '0.8125rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8125rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Apply
              </button>
            </div>
          </form>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => verifyHealth(inputUrl)}
                disabled={checking}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  backgroundColor: '#e2e8f0',
                  color: '#334155',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <RefreshCwIcon size={12} color="#334155" />
                <span>{checking ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  backgroundColor: 'transparent',
                  color: '#64748b',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Reset Default
              </button>
            </div>

            {savedSuccess && (
              <span style={{ fontSize: '0.75rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircleIcon size={14} color="#16a34a" /> Saved successfully
              </span>
            )}
          </div>

          {statusMessage && (
            <div
              style={{
                marginTop: '0.5rem',
                padding: '6px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                backgroundColor: healthStatus === 'connected' ? '#ecfdf5' : healthStatus === 'disconnected' ? '#fef2f2' : '#fffbeb',
                color: healthStatus === 'connected' ? '#065f46' : healthStatus === 'disconnected' ? '#991b1b' : '#92400e',
                border: `1px solid ${healthStatus === 'connected' ? '#a7f3d0' : healthStatus === 'disconnected' ? '#fecaca' : '#fde68a'}`,
              }}
            >
              {statusMessage}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
