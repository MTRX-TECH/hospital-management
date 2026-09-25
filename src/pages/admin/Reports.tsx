import React, { useState, useEffect } from 'react'
import { api, type ReportData } from '../../services/api'
import { StatCard } from '../../components/StatCard'
import {
  RefreshIcon,
  ChartBarIcon,
  CheckCircleIcon,
  HourglassIcon,
  CrossIcon,
  BuildingIcon,
  StethoscopeIcon,
} from '../../components/Icons'

export const ReportsPage: React.FC = () => {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadReports()
  }, [])

  async function loadReports() {
    setLoading(true)
    setError('')
    try {
      const reports = await api.getReports()
      setData(reports)
    } catch (err: any) {
      setError(err.message || 'Could not load hospital analytics.')
    } finally {
      setLoading(false)
    }
  }

  const s = data?.summary
  const total = Math.max(1, s?.totalAppointments || 1)

  // Status colors
  const statusColors: Record<string, string> = {
    REQUESTED: '#f59e0b',
    CONFIRMED: '#3b82f6',
    COMPLETED: '#10b981',
    CANCELLED: '#ef4444',
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hospital Reports &amp; Real-Time Analytics</h1>
          <p className="page-subtitle">
            Live database aggregations from MongoDB across clinical departments, appointments, and physician caseloads
          </p>
        </div>
        <button onClick={loadReports} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <RefreshIcon size={14} color="currentColor" /> Refresh Metrics
        </button>
      </div>

      {error && <div className="form-alert-error">{error}</div>}

      {/* Summary KPI Cards */}
      <div className="stat-cards-grid">
        <StatCard
          title="Total Appointments"
          value={s?.totalAppointments ?? (loading ? '...' : 0)}
          subtitle="All hospital records"
          icon={<ChartBarIcon size={22} color="#1e40af" />}
          color="blue"
        />
        <StatCard
          title="Completion Rate"
          value={
            s?.totalAppointments
              ? `${Math.round(((s.completedAppointments || 0) / s.totalAppointments) * 100)}%`
              : '0%'
          }
          subtitle={`${s?.completedAppointments || 0} visits completed`}
          icon={<CheckCircleIcon size={22} color="#15803d" />}
          color="green"
        />
        <StatCard
          title="Pending Requests"
          value={s?.pendingRequests ?? (loading ? '...' : 0)}
          subtitle="Awaiting doctor action"
          icon={<HourglassIcon size={22} color="#92400e" />}
          color="amber"
        />
        <StatCard
          title="Cancellation Rate"
          value={
            s?.totalAppointments
              ? `${Math.round(((s.cancelledAppointments || 0) / s.totalAppointments) * 100)}%`
              : '0%'
          }
          subtitle={`${s?.cancelledAppointments || 0} cancelled`}
          icon={<CrossIcon size={20} color="#991b1b" />}
          color="red"
        />
      </div>

      {/* Main Aggregations Grid */}
      <div className="dashboard-grid-two" style={{ marginTop: '24px' }}>
        {/* Status Distribution */}
        <div className="dashboard-card">
          <h2 className="card-title">Appointments by Status</h2>
          <p className="card-subtitle">Aggregated distribution of all consultation requests</p>

          {loading ? (
            <div className="loading-state-text">Aggregating status records...</div>
          ) : data?.statusCounts ? (
            <div className="report-bars-list">
              {data.statusCounts.map((item) => {
                const pct = Math.round((item.count / total) * 100)
                const barColor = statusColors[item.status] || '#64748b'
                return (
                  <div key={item.status} className="report-bar-item">
                    <div className="bar-labels-row">
                      <strong style={{ color: barColor }}>
                        {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                      </strong>
                      <span>
                        <strong>{item.count}</strong> ({pct}%)
                      </span>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>

        {/* Department Volume */}
        <div className="dashboard-card">
          <h2 className="card-title">Appointments by Department</h2>
          <p className="card-subtitle">Consultation volume distributed across clinical departments</p>

          {loading ? (
            <div className="loading-state-text">Aggregating departmental volumes...</div>
          ) : data?.departments && data.departments.length > 0 ? (
            <div className="report-bars-list">
              {data.departments.map((dept, idx) => {
                const pct = Math.round((dept.count / total) * 100)
                return (
                  <div key={idx} className="report-bar-item">
                    <div className="bar-labels-row">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <BuildingIcon size={14} color="#0284c7" />
                        {dept.department}
                      </span>
                      <span>
                        <strong>{dept.count}</strong> ({pct}%)
                      </span>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${pct}%`, backgroundColor: '#0284c7' }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state-text">No departmental bookings on record.</div>
          )}
        </div>
      </div>

      {/* Doctor Caseload Breakdown Table */}
      <div className="dashboard-card full-width" style={{ marginTop: '24px' }}>
        <h2 className="card-title">Physician Consultation Workload</h2>
        <p className="card-subtitle">Aggregate appointments booked per doctor</p>

        {loading ? (
          <div className="loading-state-text">Aggregating doctor workloads...</div>
        ) : data?.doctors && data.doctors.length > 0 ? (
          <div className="table-responsive" style={{ marginTop: '12px' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Physician Name</th>
                  <th>Total Appointments</th>
                  <th>Share of Hospital Volume</th>
                </tr>
              </thead>
              <tbody>
                {data.doctors.map((doc, idx) => {
                  const pct = Math.round((doc.count / total) * 100)
                  return (
                    <tr key={idx}>
                      <td>
                        <div className="table-cell-bold" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <StethoscopeIcon size={15} color="#0284c7" />
                          {doc.doctor}
                        </div>
                      </td>
                      <td>
                        <strong>{doc.count}</strong> appointments
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="progress-bar-bg" style={{ flex: 1, maxWidth: '200px' }}>
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${pct}%`, backgroundColor: '#2563eb' }}
                            ></div>
                          </div>
                          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state-text">No physician appointments found.</div>
        )}
      </div>
    </div>
  )
}
