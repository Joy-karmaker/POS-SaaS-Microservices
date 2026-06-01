import { useEffect, useState } from 'react'
import { HealthCard } from '../components/HealthCard'
import { TenantNav } from '../components/TenantNav'
import { useServiceHealth } from '../hooks/useServiceHealth'
import { getAnalyticsSummary, getForecastList, seedSimulationSales, recalculateAnalytics } from '../api/analyticsApi'
import { io } from 'socket.io-client'

export function TenantDashboardPage({ user }) {
  const { healthItems, isCheckingHealth, refreshHealth } = useServiceHealth()
  const [summary, setSummary] = useState({ outOfStock: 0, criticalRisk: 0, lowRisk: 0, stable: 0 })
  const [topProduct, setTopProduct] = useState(null)
  const [forecastProducts, setForecastProducts] = useState([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(5)
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [seedCount, setSeedCount] = useState(1000)

  // Fetch initial analytics summary
  const fetchSummary = async () => {
    try {
      const res = await getAnalyticsSummary()
      if (res) {
        setSummary(res.summary)
        setTopProduct(res.topProduct)
      }
    } catch (err) {
      console.error('Failed to load analytics summary', err)
    }
  }

  // Fetch paginated forecast products
  const fetchForecast = async () => {
    setLoading(true)
    try {
      const res = await getForecastList({ page, limit })
      if (res && res.data) {
        setForecastProducts(res.data)
        setMeta(res.meta)
      }
    } catch (err) {
      console.error('Failed to load forecast list', err)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchSummary()
  }, [])

  // Load forecast when page or limit changes
  useEffect(() => {
    fetchForecast()
  }, [page, limit])

  // Real-time updates via WebSockets
  useEffect(() => {
    const socket = io(window.location.origin, {
      path: '/catalog/socket.io',
      transports: ['websocket'],
      upgrade: false
    })

    socket.on('connect', () => {
      console.log('Connected to real-time analytics sync channel')
    })

    socket.on('stock_updated', () => {
      // Refresh analytics in background on any stock adjustments
      fetchSummary()
      fetchForecast()
    })

    socket.on('product_updated', () => {
      // Refresh analytics in background on any product updates
      fetchSummary()
      fetchForecast()
    })

    return () => {
      socket.disconnect()
    }
  }, [page, limit])

  // Handlers
  const handleSeedSales = async (e) => {
    e.preventDefault()
    setSeeding(true)
    try {
      const res = await seedSimulationSales(seedCount)
      alert(res.message || 'Seeded sales successfully!')
      fetchSummary()
      fetchForecast()
    } catch (err) {
      console.error(err)
      alert('Failed to seed simulation sales data')
    } finally {
      setSeeding(false)
    }
  }

  const handleRecalculate = async () => {
    setRecalculating(true)
    try {
      const res = await recalculateAnalytics()
      alert(res.message || 'Forecasting models recalculated!')
      fetchSummary()
      fetchForecast()
    } catch (err) {
      console.error(err)
      alert('Failed to recalculate forecasts')
    } finally {
      setRecalculating(false)
    }
  }

  // Format stock-out dates beautifully
  const formatStockOutDate = (product) => {
    if (product.stock_quantity === 0) {
      return <span style={{ color: '#ef4444', fontWeight: 'bold' }}>OUT OF STOCK</span>
    }
    
    if (!product.stock_out_date || parseFloat(product.sales_velocity) === 0) {
      return <span style={{ color: '#64748b' }}>Stable (No Sales)</span>
    }

    const date = new Date(product.stock_out_date)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) {
      return <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Stocks out today</span>
    }
    if (diffDays === 1) {
      return <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Stocks out tomorrow</span>
    }
    if (diffDays <= 3) {
      return <span style={{ color: '#f97316', fontWeight: 600 }}>Stocks out in {diffDays} days</span>
    }
    if (diffDays <= 7) {
      return <span style={{ color: '#eab308', fontWeight: 500 }}>Stocks out in {diffDays} days</span>
    }

    return <span style={{ color: '#10b981' }}>{date.toLocaleDateString()} (In {diffDays} days)</span>
  }

  return (
    <main className="content-grid" style={{ maxWidth: '1400px' }}>
      
      {/* Overview Block */}
      <article className="card span-2" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>Inventory Analytics & Forecasting</h2>
            <p className="muted">Predictive inventory velocity engine. Avoid stock-outs before they happen.</p>
          </div>
          <button 
            disabled={recalculating} 
            onClick={handleRecalculate}
            className="btn-primary"
            style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            {recalculating ? 'Recalculating...' : 'Force Recalculate'}
          </button>
        </div>
        <TenantNav />
      </article>

      {/* KPI Stats Row */}
      <div className="span-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        
        {/* Out of Stock Card */}
        <div className="card" style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', display: 'flex', gap: '1rem', alignItems: 'center', transition: 'all 0.2s' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '1.5rem' }}>
            🚫
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#ef4444', fontFamily: 'JetBrains Mono' }}>{summary.outOfStock}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#991b1b' }}>Out of Stock</div>
          </div>
        </div>

        {/* Critical Risk Card */}
        <div className="card" style={{ 
          padding: '1.5rem', 
          background: summary.criticalRisk > 0 ? 'rgba(249, 115, 22, 0.05)' : 'rgba(255, 255, 255, 0.8)', 
          border: summary.criticalRisk > 0 ? '1px solid rgba(249, 115, 22, 0.25)' : '1px solid var(--border)', 
          display: 'flex', 
          gap: '1rem', 
          alignItems: 'center',
          animation: summary.criticalRisk > 0 ? 'pulse 2s infinite' : 'none'
        }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(249, 115, 22, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316', fontSize: '1.5rem' }}>
            ⚠️
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f97316', fontFamily: 'JetBrains Mono' }}>{summary.criticalRisk}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#c2410c' }}>Critical Risk (&lt;3 days)</div>
          </div>
        </div>

        {/* Low Risk Card */}
        <div className="card" style={{ padding: '1.5rem', background: 'rgba(234, 179, 8, 0.05)', border: '1px solid rgba(234, 179, 8, 0.25)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308', fontSize: '1.5rem' }}>
            🔔
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#eab308', fontFamily: 'JetBrains Mono' }}>{summary.lowRisk}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#854d0e' }}>Low Risk (3-7 days)</div>
          </div>
        </div>

        {/* Stable Card */}
        <div className="card" style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '1.5rem' }}>
            ✅
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#10b981', fontFamily: 'JetBrains Mono' }}>{summary.stable}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#065f46' }}>Healthy / Stable</div>
          </div>
        </div>

      </div>

      {/* Seeding Simulation Card */}
      <article className="card">
        <h2>🔥 Sales History Simulator</h2>
        <p className="muted" style={{ marginBottom: '1.25rem' }}>
          Generate random sales history over the past 30 days to check data scaling aggregations.
        </p>
        <form onSubmit={handleSeedSales} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Number of Sales Transactions</label>
            <select 
              value={seedCount} 
              onChange={e => setSeedCount(Number(e.target.value))}
              style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '1rem', background: 'white' }}
            >
              <option value={100}>100 transactions</option>
              <option value={500}>500 transactions</option>
              <option value={1000}>1,000 transactions</option>
              <option value={2500}>2,500 transactions (Stress test)</option>
            </select>
          </div>
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={seeding}
            style={{ padding: '0.75rem 1rem' }}
          >
            {seeding ? 'Generating Transactions & recalculating...' : `Simulate ${seedCount.toLocaleString()} Sales`}
          </button>
        </form>

        {topProduct && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(45, 128, 125, 0.08)', borderRadius: '12px', border: '1px solid rgba(45, 128, 125, 0.15)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase' }}>🔥 Top Sales Velocity</div>
            <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{topProduct.name}</strong>
            <span style={{ fontSize: '0.9rem', color: '#475569' }}>
              Selling at <strong style={{ color: 'var(--primary)', fontFamily: 'JetBrains Mono' }}>{topProduct.sales_velocity}</strong> units / day
            </span>
          </div>
        )}
      </article>

      {/* Service Health Card */}
      <HealthCard
        healthItems={healthItems}
        isCheckingHealth={isCheckingHealth}
        onRefresh={refreshHealth}
      />

      {/* Stock-out Forecast List Table */}
      <article className="card span-2">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>🚨 Stock-out Date Predictions</h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Sorted by Risk Urgency</span>
        </div>

        {forecastProducts.length === 0 ? (
          <p className="muted" style={{ padding: '2rem 0', textAlign: 'center' }}>No products found. Add products in the Catalog & Inventory module.</p>
        ) : (
          <div className="tenant-table-wrap" style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'center' }}>Current Stock</th>
                  <th style={{ textAlign: 'center' }}>Sales Velocity (Qty/Day)</th>
                  <th style={{ textAlign: 'right' }}>Predicted Stock-out Date</th>
                </tr>
              </thead>
              <tbody>
                {forecastProducts.map((p) => {
                  const riskLevel = p.stock_quantity === 0 ? 'out' : 
                                    p.stock_out_date && (new Date(p.stock_out_date).getTime() - new Date().getTime()) / (1000*60*60*24) <= 3 ? 'critical' :
                                    p.stock_out_date && (new Date(p.stock_out_date).getTime() - new Date().getTime()) / (1000*60*60*24) <= 7 ? 'low' : 'stable';
                  
                  let trBg = 'transparent';
                  if (riskLevel === 'out') trBg = 'rgba(239, 68, 68, 0.02)';
                  else if (riskLevel === 'critical') trBg = 'rgba(249, 115, 22, 0.02)';

                  return (
                    <tr key={p.id} style={{ background: trBg }}>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{p.name}</strong>
                        <div className="muted" style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono', marginTop: '2px' }}>SKU: {p.sku || '-'}</div>
                      </td>
                      <td>{p.category?.name || <span className="muted">None</span>}</td>
                      <td style={{ textAlign: 'center', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                        <span style={{ 
                          color: p.stock_quantity === 0 ? '#ef4444' : p.stock_quantity < 5 ? '#f97316' : 'inherit'
                        }}>
                          {p.stock_quantity}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'JetBrains Mono' }}>
                        {p.sales_velocity}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 500 }}>
                        {formatStockOutDate(p)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Showing {forecastProducts.length} of {meta.total || forecastProducts.length} items
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                  style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem', border: 'none', borderRadius: '6px', background: page === 1 ? '#f1f5f9' : 'rgba(45, 128, 125, 0.1)', color: page === 1 ? '#94a3b8' : 'var(--primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                >
                  Prev
                </button>
                <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>Page {page} of {meta.totalPages || 1}</span>
                <button 
                  disabled={page >= (meta.totalPages || 1)} 
                  onClick={() => setPage(p => p + 1)}
                  style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem', border: 'none', borderRadius: '6px', background: page >= (meta.totalPages || 1) ? '#f1f5f9' : 'rgba(45, 128, 125, 0.1)', color: page >= (meta.totalPages || 1) ? '#94a3b8' : 'var(--primary)', cursor: page >= (meta.totalPages || 1) ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                >
                  Next
                </button>
                <select 
                  value={limit} 
                  onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} 
                  style={{ padding: '0.3rem', fontSize: '0.85rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </article>

      {/* Styled Micro-Animations Injection */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            box-shadow: var(--shadow);
          }
          50% {
            opacity: 0.95;
            box-shadow: 0 0 15px rgba(249, 115, 22, 0.15);
          }
        }
      `}</style>

    </main>
  )
}
