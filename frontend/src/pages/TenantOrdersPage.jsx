import { useEffect, useState, useMemo } from 'react'
import { getOrders, cancelOrder } from '../api/orderApi'
import { createPayment } from '../api/paymentApi'
import { TenantNav } from '../components/TenantNav'
import { Link } from 'react-router-dom'

export function TenantOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [payModalOrder, setPayModalOrder] = useState(null)
  const [payingMethod, setPayingMethod] = useState('CASH')
  const [processingPay, setProcessingPay] = useState(false)

  const fetchOrdersList = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getOrders({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      })
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load orders', err)
      setError(err.response?.data?.message || 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickPay = async (order, method = 'CASH') => {
    setProcessingPay(true)
    try {
      await createPayment({
        order_id: order.id,
        method: method,
        amount: order.total,
        idempotency_key: crypto.randomUUID(),
      })
      alert(`Payment of $${Number(order.total).toFixed(2)} recorded successfully via ${method}!`)
      setPayModalOrder(null)
      if (selectedOrder?.id === order.id) {
        setSelectedOrder((prev) => ({ ...prev, status: 'PAID' }))
      }
      await fetchOrdersList()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to complete payment')
    } finally {
      setProcessingPay(false)
    }
  }

  const handleCancelOrder = async (orderId) => {
    if (!confirm(`Are you sure you want to cancel/void Order #${orderId}?`)) return
    try {
      await cancelOrder(orderId)
      alert(`Order #${orderId} has been cancelled.`)
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: 'CANCELLED' }))
      }
      await fetchOrdersList()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to cancel order')
    }
  }

  useEffect(() => {
    fetchOrdersList()
  }, [statusFilter])

  // Filtered orders with search term
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders
    const term = searchTerm.toLowerCase().trim()
    return orders.filter((o) => {
      const idMatch = String(o.id).includes(term)
      const itemMatch = o.items?.some((i) => i.product_name?.toLowerCase().includes(term))
      return idMatch || itemMatch
    })
  }, [orders, searchTerm])

  // Analytics KPI counts
  const kpis = useMemo(() => {
    const totalCount = orders.length
    const paidCount = orders.filter((o) => o.status === 'PAID').length
    const pendingCount = orders.filter((o) => o.status === 'PENDING').length
    const failedCount = orders.filter((o) => o.status === 'PAYMENT_FAILED').length
    const totalRevenue = orders
      .filter((o) => o.status === 'PAID')
      .reduce((sum, o) => sum + Number(o.total || 0), 0)

    return { totalCount, paidCount, pendingCount, failedCount, totalRevenue }
  }, [orders])

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return (
          <span
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: '#dcfce7',
              color: '#15803d',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}></span>
            PAID
          </span>
        )
      case 'PENDING':
        return (
          <span
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: '#fef3c7',
              color: '#b45309',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }}></span>
            PENDING
          </span>
        )
      case 'PAYMENT_FAILED':
        return (
          <span
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: '#fee2e2',
              color: '#b91c1c',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }}></span>
            FAILED
          </span>
        )
      case 'CANCELLED':
        return (
          <span
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: '#f1f5f9',
              color: '#64748b',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8' }}></span>
            CANCELLED
          </span>
        )
      default:
        return (
          <span
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: '#f1f5f9',
              color: '#475569',
            }}
          >
            {status}
          </span>
        )
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: 1400, margin: '0 auto', padding: '1rem' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Customer Orders & Sales History</h2>
          <p className="muted" style={{ margin: '0.25rem 0 0' }}>
            Auditable customer transactions, live payment settlements, and itemized receipts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={fetchOrdersList}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          >
            {loading ? 'Refreshing…' : '↻ Refresh'}
          </button>
          <Link
            to="/app/pos"
            className="btn-primary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
          >
            + New Sale in POS
          </Link>
        </div>
      </header>

      <TenantNav />

      {/* KPI Cards */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          margin: '1.25rem 0',
        }}
      >
        <div style={{ background: '#ffffff', borderRadius: 12, padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <div className="muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Settled Revenue</div>
          <strong style={{ fontSize: '1.6rem', color: '#16a34a', display: 'block', marginTop: '0.25rem' }}>
            ${kpis.totalRevenue.toFixed(2)}
          </strong>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 12, padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <div className="muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Orders</div>
          <strong style={{ fontSize: '1.6rem', display: 'block', marginTop: '0.25rem' }}>
            {kpis.totalCount}
          </strong>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 12, padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <div className="muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Paid Orders</div>
          <strong style={{ fontSize: '1.6rem', color: '#0284c7', display: 'block', marginTop: '0.25rem' }}>
            {kpis.paidCount}
          </strong>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 12, padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <div className="muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pending / In-Flight</div>
          <strong style={{ fontSize: '1.6rem', color: '#d97706', display: 'block', marginTop: '0.25rem' }}>
            {kpis.pendingCount}
          </strong>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.25rem',
          marginBottom: '1rem',
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="muted" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Status:</span>
          {['ALL', 'PAID', 'PENDING', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                background: statusFilter === st ? 'var(--primary, #0f172a)' : '#f1f5f9',
                color: statusFilter === st ? '#ffffff' : '#334155',
                border: 'none',
                borderRadius: 8,
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: statusFilter === st ? 600 : 400,
                transition: 'all 0.15s ease',
              }}
            >
              {st === 'ALL' ? 'All Orders' : st}
            </button>
          ))}
        </div>

        <div style={{ minWidth: 260 }}>
          <input
            type="text"
            placeholder="Search by Order ID or Product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.8rem',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
            }}
          />
        </div>
      </div>

      {/* Orders Table */}
      <section className="card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
        {loading ? (
          <p className="muted" style={{ padding: '2rem 0', textAlign: 'center' }}>Loading orders from order-service...</p>
        ) : error ? (
          <div style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: 8 }}>
            {error}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <p className="muted" style={{ fontSize: '1rem', margin: '0 0 1rem' }}>No orders found matching the filter criteria.</p>
            <Link to="/app/pos" className="btn-primary" style={{ textDecoration: 'none', padding: '0.5rem 1rem' }}>
              Create Sale in POS Terminal
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Order ID</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Date & Time</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Line Items</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Subtotal</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Tax</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Discount</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => {
                  const itemCount = o.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0
                  return (
                    <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>
                        #{o.id}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#475569' }}>
                        {new Date(o.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {getStatusBadge(o.status)}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ fontWeight: 500 }}>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                        <span className="muted" style={{ fontSize: '0.8rem', display: 'block', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {o.items?.map((i) => `${i.product_name} (${i.quantity})`).join(', ') || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#475569' }}>
                        ${Number(o.subtotal || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#475569' }}>
                        ${Number(o.tax || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: o.discount > 0 ? '#16a34a' : '#475569' }}>
                        {o.discount > 0 ? `-$${Number(o.discount).toFixed(2)}` : '$0.00'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--primary, #0f172a)' }}>
                        ${Number(o.total || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center', justifyContent: 'center' }}>
                          {o.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => setPayModalOrder(o)}
                                style={{
                                  background: '#16a34a',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: 6,
                                  padding: '0.35rem 0.65rem',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                }}
                                title="Settle payment and mark as PAID"
                              >
                                💳 Pay Now
                              </button>
                              <button
                                onClick={() => handleCancelOrder(o.id)}
                                style={{
                                  background: '#fee2e2',
                                  color: '#b91c1c',
                                  border: '1px solid #fca5a5',
                                  borderRadius: 6,
                                  padding: '0.35rem 0.55rem',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  fontWeight: 500,
                                }}
                                title="Void/Cancel this order"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedOrder(o)}
                            style={{
                              background: '#16a34a',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: 6,
                              padding: '0.4rem 0.8rem',
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            }}
                          >
                            🧾 Receipt
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Receipt Modal / Drawer */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 480,
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Receipt: ORD-{String(selectedOrder.id).padStart(6, '0')}</h3>
                <span className="muted" style={{ fontSize: '0.8rem' }}>{new Date(selectedOrder.created_at).toLocaleString()}</span>
              </div>
              <div>{getStatusBadge(selectedOrder.status)}</div>
            </div>

            <div style={{ borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', padding: '1rem 0', margin: '1rem 0' }}>
              <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#64748b' }}>
                    <th style={{ paddingBottom: '0.5rem' }}>Item</th>
                    <th style={{ paddingBottom: '0.5rem', textAlign: 'center' }}>Qty</th>
                    <th style={{ paddingBottom: '0.5rem', textAlign: 'right' }}>Price</th>
                    <th style={{ paddingBottom: '0.5rem', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '0.4rem 0', fontWeight: 500 }}>{item.product_name}</td>
                      <td style={{ padding: '0.4rem 0', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '0.4rem 0', textAlign: 'right' }}>${Number(item.unit_price).toFixed(2)}</td>
                      <td style={{ padding: '0.4rem 0', textAlign: 'right', fontWeight: 600 }}>${Number(item.total_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pending Settle Banner */}
            {selectedOrder.status === 'PENDING' && (
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '0.9rem', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 600, color: '#92400e', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                  ⏳ Unsettled Order (Payment Pending)
                </div>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', color: '#78350f' }}>
                  This order has not been paid yet. Settle payment now to close it as <strong>PAID</strong>, or void/cancel it.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleQuickPay(selectedOrder, 'CASH')}
                    disabled={processingPay}
                    style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    💵 Pay with Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPay(selectedOrder, 'CARD')}
                    disabled={processingPay}
                    style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    💳 Pay with Card
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCancelOrder(selectedOrder.id)}
                    style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: 6, padding: '0.45rem 0.85rem', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Subtotal</span>
                <span>${Number(selectedOrder.subtotal || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Tax</span>
                <span>${Number(selectedOrder.tax || 0).toFixed(2)}</span>
              </div>
              {Number(selectedOrder.discount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                  <span>Discount</span>
                  <span>-${Number(selectedOrder.discount).toFixed(2)}</span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid #e2e8f0',
                  marginTop: '0.25rem',
                }}
              >
                <span>Total</span>
                <span>${Number(selectedOrder.total || 0).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => window.print()}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                🖨️ Print Receipt
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn-primary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Settle Payment Modal */}
      {payModalOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem',
          }}
          onClick={() => setPayModalOrder(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 420,
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>
              Settle Payment for Order #{payModalOrder.id}
            </h3>
            <p className="muted" style={{ margin: '0 0 1.25rem', fontSize: '0.9rem' }}>
              Select payment method to mark this order as <strong>PAID</strong> and close the transaction.
            </p>

            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="muted">Total Due:</span>
                <strong style={{ fontSize: '1.25rem', color: '#16a34a' }}>
                  ${Number(payModalOrder.total).toFixed(2)}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                <span>Items:</span>
                <span>{payModalOrder.items?.length || 0} line items</span>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Payment Method:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {['CASH', 'CARD', 'MFS'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPayingMethod(m)}
                    style={{
                      padding: '0.6rem 0.5rem',
                      borderRadius: 8,
                      border: payingMethod === m ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: payingMethod === m ? '#eff6ff' : '#ffffff',
                      color: payingMethod === m ? '#1d4ed8' : '#334155',
                      fontWeight: payingMethod === m ? 700 : 500,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    {m === 'CASH' ? '💵 Cash' : m === 'CARD' ? '💳 Card' : '📱 MFS'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setPayModalOrder(null)}
                className="btn-secondary"
                disabled={processingPay}
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleQuickPay(payModalOrder, payingMethod)}
                className="btn-primary"
                disabled={processingPay}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', background: '#16a34a' }}
              >
                {processingPay ? 'Processing...' : `Confirm $${Number(payModalOrder.total).toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
