import React, { useState, useEffect } from 'react'
import { api, type AdminPaymentsData } from '../../services/api'
import { CreditCardIcon, DownloadIcon, RefreshIcon, ReceiptIcon } from '../../components/Icons'
import { downloadReceiptImage } from '../../utils/receiptGenerator'

interface ManagePaymentsProps {
  onNotify: (message: string) => void
}

export const ManagePayments: React.FC<ManagePaymentsProps> = ({ onNotify }) => {
  const [data, setData] = useState<AdminPaymentsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPayments()
  }, [])

  async function loadPayments(isManual = false) {
    if (isManual) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const res = await api.getPaymentsList()
      setData(res)
    } catch (err: any) {
      setError(err.message || 'Could not load hospital payment ledger.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function handleDownloadReceipt(appointmentId: string) {
    setDownloadingId(appointmentId)
    try {
      const receiptData = await api.getReceipt(appointmentId)
      await downloadReceiptImage(receiptData)
      onNotify('Official hospital payment receipt downloaded.')
    } catch (err: any) {
      alert(err.message || 'Could not download receipt.')
    } finally {
      setDownloadingId(null)
    }
  }

  const stats = data?.stats || {
    totalRevenue: 0,
    todayRevenue: 0,
    totalTransactions: 0,
    methodBreakdown: { UPI: 0, CARD: 0, NETBANKING: 0, CASH: 0 },
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hospital Payments &amp; Revenue Ledger</h1>
          <p className="page-subtitle">
            Financial oversight, advance booking collections, and official patient transaction receipts
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadPayments(true)}
          disabled={refreshing}
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshIcon size={15} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Updating Ledger...' : 'Refresh Records'}
        </button>
      </div>

      {error && <div className="form-alert-error">{error}</div>}

      {/* Financial KPIs Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Revenue Collected
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#047857', marginTop: '6px' }}>
            ₹{stats.totalRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '4px' }}>
            Across all OPD advance bookings
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Today&apos;s Collection
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e40af', marginTop: '6px' }}>
            ₹{stats.todayRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#2563eb', marginTop: '4px' }}>
            Real-time today&apos;s receipts
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Transactions
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {stats.totalTransactions}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
            UPI: {stats.methodBreakdown.UPI} | Card: {stats.methodBreakdown.CARD} | NetBanking: {stats.methodBreakdown.NETBANKING}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="loading-container">Loading hospital transaction ledger...</div>
      ) : data && data.payments && data.payments.length > 0 ? (
        <div className="table-responsive card-table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Transaction Ref</th>
                <th>Patient Details</th>
                <th>Doctor &amp; Department</th>
                <th>Appointment Date</th>
                <th>Payment Mode</th>
                <th>Amount Paid</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.86rem' }}>
                      {p.receiptNumber}
                    </span>
                  </td>
                  <td>
                    <span className="mono-code" style={{ fontSize: '0.75rem' }}>
                      {p.transactionReference}
                    </span>
                  </td>
                  <td>
                    <div className="table-cell-bold">{p.patientName}</div>
                    <div className="table-cell-sub">{p.patientPhone}</div>
                  </td>
                  <td>
                    <div className="table-cell-bold">{p.doctorName}</div>
                    <div className="table-cell-sub">{p.department}</div>
                  </td>
                  <td>
                    <div>{p.appointmentDate}</div>
                    <div className="table-cell-sub">at {p.appointmentTime}</div>
                  </td>
                  <td>
                    <span
                      style={{
                        background: '#f1f5f9',
                        color: '#334155',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.78rem',
                      }}
                    >
                      {p.paymentMethod}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#047857', fontSize: '0.94rem' }}>
                      ₹{Number(p.amount).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      Total Fee: ₹{p.totalFee}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        background: '#dcfce7',
                        color: '#166534',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.76rem',
                        textTransform: 'uppercase',
                      }}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleDownloadReceipt(p.appointmentId || p.id)}
                      disabled={downloadingId === p.id}
                      className="btn-secondary"
                      style={{ fontSize: '0.76rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      title="Download Official Receipt"
                    >
                      <DownloadIcon size={13} />
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ background: '#ffffff', padding: '40px', textAlign: 'center', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <CreditCardIcon size={38} color="#94a3b8" />
          <h3 style={{ marginTop: '12px', color: '#334155' }}>No Financial Transactions Recorded</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Advance booking payments made by patients will be logged in this ledger automatically.
          </p>
        </div>
      )}
    </div>
  )
}
