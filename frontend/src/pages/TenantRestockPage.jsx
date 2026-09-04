import { useEffect, useState, useMemo } from 'react'
import {
  getRestockOrders,
  createRestockOrder,
  dispatchRestockOrder,
  receiveRestockOrder,
  cancelRestockOrder,
} from '../api/restockApi'
import { initiatePayment, verifyPayment } from '../api/paymentApi'
import { getProductSearchIndex } from '../api/catalogApi'
import { TenantNav } from '../components/TenantNav'

export function TenantRestockPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Restock Supplier Payment States
  const [payingOrder, setPayingOrder] = useState(null)
  const [payGateway, setPayGateway] = useState('STRIPE')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Catalog products for order creation
  const [catalogProducts, setCatalogProducts] = useState([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState(50)
  const [warehouseName, setWarehouseName] = useState('Central Distribution Hub')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState(null)

  const fetchOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getRestockOrders({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      })
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load restock orders', err)
      setError(err.response?.data?.message || 'Failed to fetch restock orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await getProductSearchIndex()
      setCatalogProducts(Array.isArray(res) ? res : [])
      if (res && res.length > 0 && !selectedProductId) {
        setSelectedProductId(res[0].id)
      }
    } catch (err) {
      console.error('Failed to load catalog products', err)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  useEffect(() => {
    fetchProducts()
  }, [])

  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders
    const term = searchTerm.toLowerCase().trim()
    return orders.filter((o) => {
      const numMatch = o.order_number?.toLowerCase().includes(term)
      const itemMatch = o.items?.some((i) => i.product_name?.toLowerCase().includes(term))
      const warehouseMatch = o.warehouse_name?.toLowerCase().includes(term)
      return numMatch || itemMatch || warehouseMatch
    })
  }, [orders, searchTerm])

  const kpis = useMemo(() => {
    const totalCount = orders.length
    const requestedCount = orders.filter((o) => o.status === 'REQUESTED').length
    const dispatchedCount = orders.filter((o) => o.status === 'DISPATCHED').length
    const receivedCount = orders.filter((o) => o.status === 'RECEIVED').length
    const totalUnitsReplenished = orders
      .filter((o) => o.status === 'RECEIVED')
      .reduce((sum, o) => sum + Number(o.total_items || 0), 0)

    return { totalCount, requestedCount, dispatchedCount, receivedCount, totalUnitsReplenished }
  }, [orders])

  const handleCreateOrder = async (e) => {
    e.preventDefault()
    if (!selectedProductId || quantity <= 0) {
      alert('Please select a product and enter a valid quantity')
      return
    }

    setSubmitting(true)
    try {
      await createRestockOrder({
        warehouse_name: warehouseName,
        notes,
        items: [
          {
            product_id: Number(selectedProductId),
            quantity: Number(quantity),
          },
        ],
      })
      alert('Restock order submitted to warehouse successfully!')
      setShowCreateModal(false)
      setNotes('')
      setQuantity(50)
      await fetchOrders()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to submit restock order')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDispatch = async (orderId) => {
    setActionLoadingId(orderId)
    try {
      await dispatchRestockOrder(orderId)
      alert(`Order #${orderId} marked as DISPATCHED (In-Transit from warehouse).`)
      await fetchOrders()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to dispatch order')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReceive = async (orderId) => {
    if (!confirm('Confirm receipt of shipment? This will instantly increase shelf inventory!')) return
    setActionLoadingId(orderId)
    try {
      const res = await receiveRestockOrder(orderId)
      alert(`Order #${orderId} marked as RECEIVED! Store stock has been replenished.`)
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(res)
      }
      await fetchOrders()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to receive order')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCancel = async (orderId) => {
    if (!confirm(`Are you sure you want to cancel Purchase Order #${orderId}?`)) return
    setActionLoadingId(orderId)
    try {
      await cancelRestockOrder(orderId)
      alert(`Order #${orderId} has been cancelled.`)
      await fetchOrders()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to cancel order')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleConfirmWarehousePayment = async () => {
    if (!payingOrder) return
    setIsProcessingPayment(true)
    try {
      const cost = Number(payingOrder.total_cost || 0)
      const currency = payGateway === 'STRIPE' ? 'USD' : 'BDT'

      const initRes = await initiatePayment({
        purpose: 'RESTOCK_ORDER',
        restock_order_id: payingOrder.id,
        reference_id: String(payingOrder.id),
        method: payGateway,
        gateway: payGateway,
        amount: cost > 0 ? cost : 100,
        currency,
        warehouse_name: payingOrder.warehouse_name,
        notes: `Supplier restock payment for ${payingOrder.order_number}`,
        idempotency_key: `restock_${payingOrder.id}_${Date.now()}`,
      })

      let finalPayment = initRes
      if (initRes.status !== 'SUCCESS') {
        finalPayment = await verifyPayment({
          payment_id: initRes.id,
          gateway: payGateway,
          gateway_ref: initRes.gateway_ref,
          verification_data: { tran_id: initRes.gateway_ref, val_id: `VAL_RESTOCK_${Date.now()}` },
        })
      }

      alert(`Restock Order ${payingOrder.order_number} successfully paid via ${payGateway}!\nReceipt: ${finalPayment.receipt_number || `REC-${finalPayment.id}`}`)
      setPayingOrder(null)
      await fetchOrders()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to process warehouse payment')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const getPaymentBadge = (status, gateway) => {
    if (status === 'PAID') {
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
          PAID {gateway ? `(${gateway})` : ''}
        </span>
      )
    }
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
        UNPAID
      </span>
    )
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RECEIVED':
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
            RECEIVED
          </span>
        )
      case 'DISPATCHED':
        return (
          <span
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: '#e0f2fe',
              color: '#0369a1',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284c7' }}></span>
            IN-TRANSIT
          </span>
        )
      case 'REQUESTED':
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
            REQUESTED
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
        return <span>{status}</span>
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: 1400, margin: '0 auto', padding: '1rem' }}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Warehouse Restock & Purchase Orders (B2B)</h2>
          <p className="muted" style={{ margin: '0.25rem 0 0' }}>
            Replenish store inventory directly from the central distribution hub before stock-outs happen.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          >
            {loading ? 'Refreshing…' : '↻ Refresh'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', background: '#16a34a', border: 'none' }}
          >
            + New Restock Order
          </button>
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
          <div className="muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Replenished Units</div>
          <strong style={{ fontSize: '1.6rem', color: '#16a34a', display: 'block', marginTop: '0.25rem' }}>
            {kpis.totalUnitsReplenished.toLocaleString()}
          </strong>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 12, padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <div className="muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pending Warehouse</div>
          <strong style={{ fontSize: '1.6rem', color: '#d97706', display: 'block', marginTop: '0.25rem' }}>
            {kpis.requestedCount}
          </strong>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 12, padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <div className="muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>In-Transit / Shipped</div>
          <strong style={{ fontSize: '1.6rem', color: '#0284c7', display: 'block', marginTop: '0.25rem' }}>
            {kpis.dispatchedCount}
          </strong>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 12, padding: '1.1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
          <div className="muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Received Orders</div>
          <strong style={{ fontSize: '1.6rem', color: '#0f172a', display: 'block', marginTop: '0.25rem' }}>
            {kpis.receivedCount}
          </strong>
        </div>
      </section>

      {/* Filter Toolbar */}
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
          {['ALL', 'REQUESTED', 'DISPATCHED', 'RECEIVED', 'CANCELLED'].map((st) => (
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

        <div style={{ minWidth: 280 }}>
          <input
            type="text"
            placeholder="Search by PO #, Product, Warehouse..."
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

      {/* Restock Orders Table */}
      <section className="card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
        {loading ? (
          <p className="muted" style={{ padding: '2rem 0', textAlign: 'center' }}>Loading restock purchase orders...</p>
        ) : error ? (
          <div style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: 8 }}>
            {error}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <p className="muted" style={{ fontSize: '1rem', margin: '0 0 1rem' }}>No restock orders found.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
              style={{ padding: '0.5rem 1rem', background: '#16a34a' }}
            >
              + Place Restock Order
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>PO Number</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Warehouse</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Products Requested</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Total Units</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Total Cost</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Payment</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Date Requested</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>
                      {o.order_number}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#475569' }}>
                      {o.warehouse_name}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      {getStatusBadge(o.status)}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span className="muted" style={{ fontSize: '0.85rem', display: 'block', maxWidth: 240, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {o.items?.map((i) => `${i.product_name} (${i.quantity})`).join(', ') || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 700 }}>
                      {o.total_items}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: 600, color: '#0f172a', fontFamily: 'JetBrains Mono, monospace' }}>
                      ${Number(o.total_cost || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      {getPaymentBadge(o.payment_status, o.payment_gateway)}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center', justifyContent: 'center' }}>
                        {o.payment_status !== 'PAID' && o.status !== 'CANCELLED' && (
                          <button
                            onClick={() => setPayingOrder(o)}
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
                            title="Pay warehouse supplier invoice via Stripe or SSLCOMMERZ"
                          >
                            💳 Pay Warehouse
                          </button>
                        )}
                        {o.status === 'REQUESTED' && (
                          <>
                            <button
                              onClick={() => handleDispatch(o.id)}
                              disabled={actionLoadingId === o.id}
                              style={{
                                background: '#0284c7',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 6,
                                padding: '0.35rem 0.65rem',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                              title="Simulate warehouse dispatching shipment"
                            >
                              🚚 Dispatch
                            </button>
                            <button
                              onClick={() => handleCancel(o.id)}
                              disabled={actionLoadingId === o.id}
                              style={{
                                background: '#fee2e2',
                                color: '#b91c1c',
                                border: '1px solid #fca5a5',
                                borderRadius: 6,
                                padding: '0.35rem 0.55rem',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {o.status === 'DISPATCHED' && (
                          <button
                            onClick={() => handleReceive(o.id)}
                            disabled={actionLoadingId === o.id}
                            style={{
                              background: '#16a34a',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: 6,
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                            title="Confirm arrival and replenish stock"
                          >
                            📥 Mark as Received
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedOrder(o)}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: 6,
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Details Modal */}
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
              maxWidth: 520,
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{selectedOrder.order_number}</h3>
                <span className="muted" style={{ fontSize: '0.8rem' }}>Warehouse: {selectedOrder.warehouse_name}</span>
              </div>
              <div>{getStatusBadge(selectedOrder.status)}</div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '1rem 0', margin: '1rem 0' }}>
              <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#64748b' }}>
                    <th style={{ paddingBottom: '0.5rem' }}>Product</th>
                    <th style={{ paddingBottom: '0.5rem' }}>SKU</th>
                    <th style={{ paddingBottom: '0.5rem', textAlign: 'right' }}>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '0.5rem 0', fontWeight: 500 }}>{item.product_name}</td>
                      <td style={{ padding: '0.5rem 0', color: '#64748b', fontFamily: 'monospace' }}>{item.sku || '—'}</td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 700 }}>+{item.quantity} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedOrder.notes && (
              <p className="muted" style={{ fontSize: '0.85rem', background: '#f8fafc', padding: '0.6rem 0.8rem', borderRadius: 8 }}>
                <strong>Notes:</strong> {selectedOrder.notes}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
              <span className="muted" style={{ fontSize: '0.8rem' }}>
                {selectedOrder.received_at
                  ? `Replenished on ${new Date(selectedOrder.received_at).toLocaleString()}`
                  : `Created on ${new Date(selectedOrder.created_at).toLocaleString()}`}
              </span>
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn-primary"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
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
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 480,
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>Create Warehouse Restock Order</h3>
            <p className="muted" style={{ margin: '0 0 1.25rem', fontSize: '0.85rem' }}>
              Submit a Purchase Order to central warehouse distribution to replenish low or out-of-stock products.
            </p>

            <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Target Product:
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  required
                >
                  {catalogProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current Stock: {p.stock_quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Restock Quantity (Units):
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Distribution Warehouse:
                </label>
                <select
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                >
                  <option value="Central Distribution Hub">Central Distribution Hub</option>
                  <option value="Regional North Warehouse">Regional North Warehouse</option>
                  <option value="Regional South Logistics">Regional South Logistics</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Order Notes:
                </label>
                <input
                  type="text"
                  placeholder="e.g., Urgent restock for weekend promo"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', background: '#16a34a' }}
                >
                  {submitting ? 'Submitting...' : 'Submit to Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Warehouse Supplier Modal */}
      {payingOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 14,
              maxWidth: 480,
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: '#0f172a' }}>
              💳 Pay Warehouse Invoice
            </h3>
            <p className="muted" style={{ fontSize: '0.85rem', margin: '0 0 1rem' }}>
              Settle supplier restock purchase order for <strong>{payingOrder.order_number}</strong>
            </p>

            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '1rem', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ color: '#64748b' }}>Warehouse:</span>
                <strong style={{ color: '#1e293b' }}>{payingOrder.warehouse_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ color: '#64748b' }}>Total Units:</span>
                <strong style={{ color: '#1e293b' }}>{payingOrder.total_items} items</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', paddingTop: '0.5rem', borderTop: '1px dashed #cbd5e1' }}>
                <span>Invoice Total:</span>
                <strong style={{ color: '#16a34a', fontFamily: 'JetBrains Mono, monospace', fontSize: '1.2rem' }}>
                  ${Number(payingOrder.total_cost || 0).toFixed(2)}
                </strong>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Select Payment Gateway:
              </label>
              <select
                value={payGateway}
                onChange={(e) => setPayGateway(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #cbd5e1', fontWeight: 600, fontSize: '0.9rem' }}
              >
                <option value="STRIPE">🌎 Stripe (International Cards / Apple Pay / USD)</option>
                <option value="SSLCOMMERZ">🇧🇩 SSLCOMMERZ (bKash / Nagad / Local Cards / BDT)</option>
              </select>

              {payGateway === 'STRIPE' && (
                <div style={{ marginTop: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '0.65rem', fontSize: '0.82rem', color: '#166534' }}>
                  ✓ Corporate Card & B2B Wire settlement via Stripe PaymentIntents in USD.
                </div>
              )}
              {payGateway === 'SSLCOMMERZ' && (
                <div style={{ marginTop: '0.75rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '0.65rem', fontSize: '0.82rem', color: '#1e40af' }}>
                  ✓ Bangladesh local banking, bKash, & Nagad verified via SSLCOMMERZ IPN in BDT.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setPayingOrder(null)}
                disabled={isProcessingPayment}
                className="btn-secondary"
                style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWarehousePayment}
                disabled={isProcessingPayment}
                className="btn-primary"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', background: '#16a34a' }}
              >
                {isProcessingPayment ? 'Processing Settlement...' : `✓ Settle $${Number(payingOrder.total_cost || 0).toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
