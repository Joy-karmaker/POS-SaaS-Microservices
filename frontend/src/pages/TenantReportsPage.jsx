import { useEffect, useState } from 'react'
import { getReportSummary, getDailySales } from '../api/reportApi'
import { TenantNav } from '../components/TenantNav'

export function TenantReportsPage() {
  const [summary, setSummary] = useState(null)
  const [daily, setDaily] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [s, d] = await Promise.all([getReportSummary(), getDailySales()])
      setSummary(s)
      setDaily(Array.isArray(d) ? d : [])
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h2>Sales Reports</h2>
          <p className="muted">Aggregated sales performance (CQRS read model).</p>
        </div>
      </header>

      <TenantNav />

      <section className="card" style={{ marginTop: '1rem', padding: '1.25rem' }}>
        {loading ? (
          <p className="muted">Loading reports…</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem' }}>
                <div className="muted" style={{ fontSize: '0.8rem' }}>Total Sales</div>
                <strong style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>
                  ${Number(summary?.total_sales || 0).toFixed(2)}
                </strong>
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem' }}>
                <div className="muted" style={{ fontSize: '0.8rem' }}>Total Orders</div>
                <strong style={{ fontSize: '1.4rem' }}>{summary?.total_orders || 0}</strong>
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem' }}>
                <div className="muted" style={{ fontSize: '0.8rem' }}>Days Tracked</div>
                <strong style={{ fontSize: '1.4rem' }}>{summary?.days || 0}</strong>
              </div>
            </div>

            <h3>Daily Sales</h3>
            {daily.length === 0 ? (
              <p className="muted">
                No sales recorded yet. Complete a POS checkout to populate reports.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.5rem' }}>Date</th>
                    <th style={{ padding: '0.5rem' }}>Orders</th>
                    <th style={{ padding: '0.5rem' }}>Items</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem' }}>{new Date(row.date).toLocaleDateString()}</td>
                      <td style={{ padding: '0.5rem' }}>{row.total_orders}</td>
                      <td style={{ padding: '0.5rem' }}>{row.total_items}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                        ${Number(row.total_sales).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <button
              onClick={load}
              style={{
                marginTop: '1.25rem',
                background: '#f1f5f9',
                color: '#1e293b',
                border: '1px solid #cbd5e1',
                borderRadius: 11,
                padding: '0.6rem 1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </>
        )}
      </section>
    </div>
  )
}
