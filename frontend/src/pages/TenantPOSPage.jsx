import { useEffect, useState, useMemo } from 'react'
import { getCategories, getProductSearchIndex, adjustStock } from '../api/catalogApi'
import { createCart, getCart, addToCart, updateCartItem, removeFromCart, clearCart, calculatePricing } from '../api/cartApi'
import { TenantNav } from '../components/TenantNav'
import { io } from 'socket.io-client'
import { FuzzySearchIndex } from '../utils/FuzzySearchIndex'

export function TenantPOSPage({ user }) {
  const [allCategories, setAllCategories] = useState([])
  const [filterCategory, setFilterCategory] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Cart & Pricing States
  const [cartId, setCartId] = useState(() => localStorage.getItem('pos_cart_id') || '')
  const [cartItems, setCartItems] = useState([])
  const [pricingResult, setPricingResult] = useState(null)
  const [loadingCart, setLoadingCart] = useState(false)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [discountCode, setDiscountCode] = useState('')
  const [tempCode, setTempCode] = useState('')

  // Checkout states
  const [showCheckout, setShowCheckout] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [amountReceived, setAmountReceived] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false)

  // Fuzzy Search Trie Index
  const searchIndex = useMemo(() => new FuzzySearchIndex(), [])
  const [indexVersion, setIndexVersion] = useState(0)

  // Load and refresh initial data
  const fetchAllCategories = async () => {
    try {
      const res = await getCategories()
      setAllCategories(Array.isArray(res) ? res : (res.data || []))
    } catch (err) {
      console.error('Failed to load categories', err)
    }
  }

  const initializeProductsIndex = async () => {
    setLoading(true)
    try {
      const data = await getProductSearchIndex()
      searchIndex.clear()
      searchIndex.addProducts(data)
      setIndexVersion(v => v + 1)
    } catch (err) {
      console.error('Failed to load product search index', err)
    } finally {
      setLoading(false)
    }
  }

  // Load Cart Items from backend Redis
  const loadCart = async (cid) => {
    if (!cid) return
    setLoadingCart(true)
    try {
      const items = await getCart(cid)
      setCartItems(items)
      await triggerPricing(cid, items, discountCode, discountPercent)
    } catch (err) {
      console.error('Failed to load cart', err)
    } finally {
      setLoadingCart(false)
    }
  }

  // Trigger Pricing Calculation Microservice
  const triggerPricing = async (cid, items, code, percentage) => {
    if (!items || items.length === 0) {
      setPricingResult(null)
      return
    }
    try {
      const payload = { cartId: cid }
      if (percentage > 0) {
        payload.discountPercentage = parseFloat(percentage)
      } else if (code) {
        payload.discountCode = code
      }
      const res = await calculatePricing(payload)
      setPricingResult(res)
    } catch (err) {
      console.error('Failed to calculate pricing', err)
    }
  }

  // Initialize POS cart and catalog
  useEffect(() => {
    fetchAllCategories()
    initializeProductsIndex()
  }, [])

  useEffect(() => {
    async function initCart() {
      let currentCartId = cartId
      if (!currentCartId) {
        try {
          const res = await createCart()
          currentCartId = res.cartId
          localStorage.setItem('pos_cart_id', currentCartId)
          setCartId(currentCartId)
        } catch (err) {
          console.error('Failed to create new cart session', err)
        }
      }
      if (currentCartId) {
        loadCart(currentCartId)
      }
    }
    initCart()
  }, [cartId])

  // Filter products locally using Fuzzy index
  const computeVisibleProducts = () => {
    let filtered = appliedSearchTerm
      ? searchIndex.search(appliedSearchTerm)
      : Array.from(searchIndex.productsMap.values())

    if (filterCategory) {
      filtered = filtered.filter(p => p.category_id === Number(filterCategory))
    }
    setProducts(filtered)
  }

  useEffect(() => {
    computeVisibleProducts()
  }, [appliedSearchTerm, filterCategory, indexVersion])

  // Real-time updates via WebSockets
  useEffect(() => {
    const socket = io(window.location.origin, {
      path: '/catalog/socket.io',
      transports: ['websocket'],
      upgrade: false
    })

    socket.on('connect', () => {
      console.log('POS page connected to real-time inventory channel')
    })

    socket.on('stock_updated', ({ productId, stockQuantity }) => {
      const prod = searchIndex.productsMap.get(productId)
      if (prod) {
        searchIndex.addProduct({ ...prod, stock_quantity: stockQuantity })
        setIndexVersion(v => v + 1)
      }
    })

    socket.on('product_updated', (updatedProduct) => {
      searchIndex.addProduct(updatedProduct)
      setIndexVersion(v => v + 1)
    })

    socket.on('product_created', (newProduct) => {
      searchIndex.addProduct(newProduct)
      setIndexVersion(v => v + 1)
    })

    socket.on('product_deleted', (deletedProductId) => {
      searchIndex.removeProduct(deletedProductId)
      setIndexVersion(v => v + 1)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  // Cart actions handlers
  const handleAddToCart = async (product) => {
    if (product.stock_quantity <= 0) {
      alert(`"${product.name}" is currently out of stock!`)
      return
    }

    const existing = cartItems.find(item => item.product_id === product.id)
    if (existing && existing.quantity >= product.stock_quantity) {
      alert(`Cannot add more. Only ${product.stock_quantity} units available in stock.`)
      return
    }

    try {
      const updatedCart = await addToCart(cartId, product.id, 1)
      setCartItems(updatedCart)
      await triggerPricing(cartId, updatedCart, discountCode, discountPercent)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to add item to cart')
    }
  }

  const handleUpdateQty = async (productId, currentQty, newQty, maxStock) => {
    if (newQty < 0) return
    if (newQty > maxStock) {
      alert(`Insufficient stock. Only ${maxStock} units available.`)
      return
    }

    try {
      let updatedCart
      if (newQty === 0) {
        updatedCart = await removeFromCart(cartId, productId)
      } else {
        updatedCart = await updateCartItem(cartId, productId, newQty)
      }
      setCartItems(updatedCart)
      await triggerPricing(cartId, updatedCart, discountCode, discountPercent)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to update quantity')
    }
  }

  const handleRemoveItem = async (productId) => {
    try {
      const updatedCart = await removeFromCart(cartId, productId)
      setCartItems(updatedCart)
      await triggerPricing(cartId, updatedCart, discountCode, discountPercent)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to remove item')
    }
  }

  const handleClearCart = async () => {
    if (cartItems.length === 0) return
    if (!confirm('Are you sure you want to clear the shopping cart?')) return
    try {
      await clearCart(cartId)
      setCartItems([])
      setPricingResult(null)
    } catch (err) {
      console.error(err)
      alert('Failed to clear cart')
    }
  }

  // Discounts
  const handleApplyDiscountCode = () => {
    setDiscountPercent(0)
    setDiscountCode(tempCode)
    triggerPricing(cartId, cartItems, tempCode, 0)
  }

  const handlePercentChange = (val) => {
    const num = Math.max(0, Math.min(100, val))
    setDiscountPercent(num)
    setDiscountCode('')
    setTempCode('')
    triggerPricing(cartId, cartItems, '', num)
  }

  // Checkout flows
  const totalToPay = pricingResult?.total || 0
  const changeDue = amountReceived ? parseFloat(amountReceived) - totalToPay : 0

  const handleConfirmCheckout = async () => {
    if (paymentMethod === 'CASH' && (isNaN(parseFloat(amountReceived)) || parseFloat(amountReceived) < totalToPay)) {
      setCheckoutError('Amount received must be greater than or equal to the total.')
      return
    }

    setCheckoutError('')
    setIsProcessingCheckout(true)

    try {
      // 1. Deduct stocks for all items in cart
      for (const item of cartItems) {
        await adjustStock(item.product_id, -item.quantity)
      }

      // 2. Build receipt snapshot
      const receiptData = {
        receiptNumber: `REC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toLocaleString(),
        items: [...cartItems],
        pricing: { ...pricingResult },
        paymentMethod,
        amountReceived: paymentMethod === 'CASH' ? parseFloat(amountReceived) : totalToPay,
        changeDue: paymentMethod === 'CASH' ? changeDue : 0
      }

      // 3. Clear Redis cart
      await clearCart(cartId)

      // 4. Provision fresh cart session
      const res = await createCart()
      const nextCartId = res.cartId
      localStorage.setItem('pos_cart_id', nextCartId)
      setCartId(nextCartId)
      setCartItems([])
      setPricingResult(null)

      // Reset local discount overrides
      setDiscountCode('')
      setTempCode('')
      setDiscountPercent(0)

      // 5. Show receipt modal & clear workspace
      setReceipt(receiptData)
      setShowCheckout(false)
      setAmountReceived('')
    } catch (err) {
      console.error(err)
      setCheckoutError(err.response?.data?.message || 'Checkout failed. Please verify stock availability.')
    } finally {
      setIsProcessingCheckout(false)
    }
  }

  // Display stock alerts
  const getStockBadge = (stock) => {
    if (stock === 0) return <span className="pos-badge out">Out</span>
    if (stock < 5) return <span className="pos-badge low">Low ({stock})</span>
    return <span className="pos-badge ok">Stock: {stock}</span>
  }

  return (
    <div className="page-container pos-page-layout">
      {/* Header */}
      <header className="page-header">
        <div>
          <h2>Sales Terminal (POS)</h2>
          <p className="muted">Fast-checkout console for shop cashier operations.</p>
        </div>
      </header>

      <TenantNav />

      {/* Main Terminal Screen */}
      <main className="pos-grid">
        {/* Left Side: Product Browsing */}
        <section className="pos-catalog-side card">
          <div className="pos-filters">
            <input 
              type="text" 
              placeholder="Search by name, SKU, barcode, category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setAppliedSearchTerm(searchTerm) }}
              className="pos-search-input"
            />
            <button 
              onClick={() => setAppliedSearchTerm(searchTerm)}
              className="btn-primary"
              style={{ width: 'auto', padding: '0.65rem 1.25rem' }}
            >
              Search
            </button>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pos-category-select"
            >
              <option value="">All Categories</option>
              {allCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {loading && products.length === 0 ? (
            <p className="muted text-center" style={{ margin: '3rem 0' }}>Loading products...</p>
          ) : products.length === 0 ? (
            <p className="muted text-center" style={{ margin: '3rem 0' }}>No products found matching filters.</p>
          ) : (
            <div className="pos-product-grid">
              {products.map(p => {
                const velocity = parseFloat(p.sales_velocity) || 0
                return (
                  <div key={p.id} className={`pos-product-card ${p.stock_quantity === 0 ? 'disabled' : ''}`}>
                    <div className="pos-card-img">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} />
                      ) : (
                        <div className="pos-card-img-placeholder">🛒</div>
                      )}
                      <div className="pos-card-badge-wrap">
                        {getStockBadge(p.stock_quantity)}
                      </div>
                    </div>
                    <div className="pos-card-body">
                      <h4>{p.name}</h4>
                      <p className="pos-card-sku">SKU: {p.sku || '-'}</p>
                      
                      {velocity > 0 && (
                        <p className="pos-card-velocity" title="Current velocity forecast">
                          🔥 {velocity} units/day
                        </p>
                      )}

                      <div className="pos-card-footer">
                        <span className="pos-card-price">${parseFloat(p.price).toFixed(2)}</span>
                        <button 
                          disabled={p.stock_quantity === 0}
                          onClick={() => handleAddToCart(p)}
                          className="pos-add-btn"
                          title="Add item to checkout cart"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Right Side: Checkout Cart */}
        <section className="pos-cart-side card">
          <div className="pos-cart-header">
            <h3>Checkout Cart</h3>
            <button 
              onClick={handleClearCart} 
              disabled={cartItems.length === 0}
              className="pos-clear-btn"
            >
              Clear Cart
            </button>
          </div>

          {loadingCart && cartItems.length === 0 ? (
            <p className="muted text-center" style={{ padding: '3rem 0' }}>Loading cart...</p>
          ) : cartItems.length === 0 ? (
            <div className="pos-empty-cart">
              <span className="pos-empty-icon">🛒</span>
              <p>Your shopping cart is empty.</p>
              <p className="muted">Click "+ Add" on catalog products to start.</p>
            </div>
          ) : (
            <div className="pos-cart-content">
              {/* Cart Items List */}
              <div className="pos-cart-items">
                {cartItems.map(item => {
                  const productInMap = searchIndex.productsMap.get(item.product_id)
                  const maxStock = productInMap ? productInMap.stock_quantity : 99999

                  return (
                    <div key={item.product_id} className="pos-cart-item">
                      <div className="pos-item-info">
                        <strong className="pos-item-name">{item.name}</strong>
                        <span className="pos-item-price">${parseFloat(item.price).toFixed(2)}</span>
                      </div>
                      <div className="pos-item-actions">
                        <div className="pos-qty-control">
                          <button 
                            onClick={() => handleUpdateQty(item.product_id, item.quantity, item.quantity - 1, maxStock)}
                            className="pos-qty-btn"
                          >
                            -
                          </button>
                          <span className="pos-qty-value">{item.quantity}</span>
                          <button 
                            onClick={() => handleUpdateQty(item.product_id, item.quantity, item.quantity + 1, maxStock)}
                            className="pos-qty-btn"
                          >
                            +
                          </button>
                        </div>
                        <button 
                          onClick={() => handleRemoveItem(item.product_id)} 
                          className="pos-delete-item-btn"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pricing & Discounts */}
              <div className="pos-pricing-panel">
                {/* Manual percentage discount */}
                <div className="pos-discount-row">
                  <label>Discount %</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={discountPercent || ''}
                    onChange={(e) => handlePercentChange(e.target.value ? parseInt(e.target.value, 10) : 0)}
                    className="pos-discount-number-input"
                    placeholder="0"
                  />
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={discountPercent} 
                    onChange={(e) => handlePercentChange(parseInt(e.target.value, 10))}
                    className="pos-discount-slider"
                  />
                </div>

                {/* Discount Code */}
                <div className="pos-coupon-row">
                  <input 
                    type="text" 
                    placeholder="Coupon code (e.g. SAVE10)" 
                    value={tempCode}
                    onChange={(e) => setTempCode(e.target.value)}
                    className="pos-coupon-input"
                  />
                  <button 
                    onClick={handleApplyDiscountCode}
                    className="pos-coupon-btn"
                  >
                    Apply
                  </button>
                </div>
                {discountCode && (
                  <div className="pos-applied-code-indicator">
                    ✓ Coupon <strong>{discountCode}</strong> applied
                  </div>
                )}

                {/* Subtotals & Taxes */}
                {pricingResult && (
                  <div className="pos-totals-box">
                    <div className="pos-total-row">
                      <span>Subtotal</span>
                      <span className="font-mono">${pricingResult.subtotal.toFixed(2)}</span>
                    </div>
                    {pricingResult.discount > 0 && (
                      <div className="pos-total-row discount">
                        <span>Discount ({pricingResult.appliedPercentage}%)</span>
                        <span className="font-mono">-${pricingResult.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="pos-total-row">
                      <span>VAT (15%)</span>
                      <span className="font-mono">${pricingResult.tax.toFixed(2)}</span>
                    </div>
                    <hr className="pos-total-divider" />
                    <div className="pos-total-row final">
                      <span>Total to Pay</span>
                      <span className="font-mono total-amount">${pricingResult.total.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Checkout Trigger */}
                <button 
                  onClick={() => { setShowCheckout(true); setAmountReceived(''); setCheckoutError(''); }}
                  className="pos-checkout-trigger-btn"
                >
                  💳 Proceed to Payment
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* MODAL 1: CHECKOUT SCREEN */}
      {showCheckout && (
        <div className="pos-modal-overlay">
          <div className="pos-modal card">
            <h3>💳 Payment & Checkout</h3>
            <p className="muted" style={{ marginBottom: '1rem' }}>Finalize order processing details.</p>

            <div className="pos-modal-body">
              <div className="pos-modal-billing-summary">
                <div className="pos-modal-summary-item">
                  <span>Total Amount Due:</span>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--primary)', fontFamily: 'JetBrains Mono' }}>
                    ${totalToPay.toFixed(2)}
                  </strong>
                </div>
              </div>

              <div className="pos-modal-form">
                <div className="form-group">
                  <label>Payment Method</label>
                  <select 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                  >
                    <option value="CASH">💵 Cash Payment</option>
                    <option value="CARD">💳 Credit/Debit Card</option>
                    <option value="MOBILE_BANKING">📱 BKash / Nagad Mobile Banking</option>
                  </select>
                </div>

                {paymentMethod === 'CASH' && (
                  <div className="form-group">
                    <label>Amount Tendered / Received ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="Enter amount given by customer..."
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      className="pos-modal-input"
                      autoFocus
                    />
                    {amountReceived && !isNaN(parseFloat(amountReceived)) && (
                      <div className={`pos-change-box ${changeDue >= 0 ? 'success' : 'error'}`}>
                        {changeDue >= 0 ? (
                          <>💵 Customer Change: <strong>${changeDue.toFixed(2)}</strong></>
                        ) : (
                          <>⚠️ Short by: <strong>${Math.abs(changeDue).toFixed(2)}</strong></>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {checkoutError && <p className="error-text">{checkoutError}</p>}
            </div>

            <div className="pos-modal-footer">
              <button 
                onClick={handleConfirmCheckout} 
                disabled={isProcessingCheckout}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                {isProcessingCheckout ? 'Processing Order...' : '✓ Complete Sale'}
              </button>
              <button 
                onClick={() => setShowCheckout(false)} 
                style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '11px', padding: '0.56rem 0.92rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RECEIPT MODAL */}
      {receipt && (
        <div className="pos-modal-overlay">
          <div className="pos-modal receipt-card card">
            <div className="receipt-paper">
              <div className="receipt-header">
                <h2>🏬 SALES RECEIPT</h2>
                <p>POS SaaS Distributed Merchant Platform</p>
                <p>Tenant ID Scope: #{user?.tenant_id || 1}</p>
                <p className="receipt-divider-dash">-----------------------------------</p>
              </div>

              <div className="receipt-meta">
                <div><strong>Receipt:</strong> {receipt.receiptNumber}</div>
                <div><strong>Date:</strong> {receipt.date}</div>
                <div><strong>Cashier:</strong> {user?.username || 'Cashier Admin'}</div>
                <p className="receipt-divider-dash">-----------------------------------</p>
              </div>

              <table className="receipt-items-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map(item => (
                    <tr key={item.product_id}>
                      <td>
                        <div>{item.name}</div>
                        <div className="muted" style={{ fontSize: '0.7rem' }}>Unit Price: ${parseFloat(item.price).toFixed(2)}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>${(item.quantity * parseFloat(item.price)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="receipt-divider-dash">-----------------------------------</p>

              <div className="receipt-totals-box">
                <div className="receipt-totals-row">
                  <span>Subtotal:</span>
                  <span>${receipt.pricing.subtotal.toFixed(2)}</span>
                </div>
                {receipt.pricing.discount > 0 && (
                  <div className="receipt-totals-row">
                    <span>Discount ({receipt.pricing.appliedPercentage}%):</span>
                    <span>-${receipt.pricing.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="receipt-totals-row">
                  <span>VAT Tax (15%):</span>
                  <span>${receipt.pricing.tax.toFixed(2)}</span>
                </div>
                <div className="receipt-totals-row receipt-totals-grand">
                  <span>Total Amount Paid:</span>
                  <span>${receipt.pricing.total.toFixed(2)}</span>
                </div>
              </div>

              <p className="receipt-divider-dash">-----------------------------------</p>

              <div className="receipt-payment-info">
                <div><strong>Payment Type:</strong> {receipt.paymentMethod}</div>
                {receipt.paymentMethod === 'CASH' && (
                  <>
                    <div><strong>Tendered Cash:</strong> ${receipt.amountReceived.toFixed(2)}</div>
                    <div><strong>Change Given:</strong> ${receipt.changeDue.toFixed(2)}</div>
                  </>
                )}
              </div>

              <div className="receipt-footer">
                <p className="receipt-divider-dash">-----------------------------------</p>
                <div className="receipt-barcode">|||| | | ||| || |||| | |||</div>
                <p className="receipt-thankyou">Thank you for shopping with us!</p>
              </div>
            </div>

            <div className="pos-modal-footer" style={{ marginTop: '1.5rem', width: '100%', gap: '0.5rem' }}>
              <button 
                onClick={() => window.print()} 
                style={{ background: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: '11px', padding: '0.75rem', fontWeight: 600, flex: 1, cursor: 'pointer' }}
              >
                🖨️ Print Invoice
              </button>
              <button 
                onClick={() => setReceipt(null)} 
                className="btn-primary" 
                style={{ flex: 1, padding: '0.75rem' }}
              >
                Start New Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STYLES SECTION FOR PREMIUM LOOK */}
      <style>{`
        .pos-page-layout {
          max-width: 1400px;
          margin: 0 auto;
        }

        .pos-grid {
          display: grid;
          grid-template-columns: 1.8fr 1.2fr;
          gap: 1.5rem;
          margin-top: 1rem;
        }

        .pos-filters {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }

        .pos-search-input {
          flex: 1;
          border: 1px solid rgba(22, 82, 90, 0.3);
          border-radius: 11px;
          padding: 0.65rem;
          font-family: 'Space Grotesk', sans-serif;
          background: rgba(255, 255, 255, 0.95);
        }

        .pos-category-select {
          width: 180px;
          border: 1px solid rgba(22, 82, 90, 0.3);
          border-radius: 11px;
          padding: 0.65rem;
          font-family: 'Space Grotesk', sans-serif;
          background: rgba(255, 255, 255, 0.95);
        }

        .pos-product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          max-height: 700px;
          overflow-y: auto;
          padding-right: 0.25rem;
        }

        .pos-product-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .pos-product-card:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border-color: var(--primary);
        }

        .pos-product-card.disabled {
          opacity: 0.6;
        }

        .pos-card-img {
          height: 120px;
          background: #f1f5f9;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid #e2e8f0;
        }

        .pos-card-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .pos-card-img-placeholder {
          font-size: 2.2rem;
        }

        .pos-card-badge-wrap {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
        }

        .pos-badge {
          font-size: 0.7rem;
          font-weight: bold;
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
          text-transform: uppercase;
        }

        .pos-badge.ok {
          background: rgba(16, 185, 129, 0.15);
          color: #065f46;
        }

        .pos-badge.low {
          background: rgba(249, 115, 22, 0.15);
          color: #9a3412;
        }

        .pos-badge.out {
          background: rgba(239, 68, 68, 0.15);
          color: #991b1b;
        }

        .pos-card-body {
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .pos-card-body h4 {
          margin: 0;
          font-size: 0.95rem;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pos-card-sku {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0.2rem 0;
          font-family: 'JetBrains Mono', monospace;
        }

        .pos-card-velocity {
          font-size: 0.75rem;
          color: var(--primary);
          font-weight: 600;
          margin: 0 0 0.5rem;
        }

        .pos-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
          padding-top: 0.5rem;
        }

        .pos-card-price {
          font-family: 'JetBrains Mono', monospace;
          font-weight: bold;
          color: #0f172a;
          font-size: 1.05rem;
        }

        .pos-add-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .pos-add-btn:hover:not(:disabled) {
          filter: brightness(1.1);
        }

        .pos-add-btn:disabled {
          background: #cbd5e1;
          color: #94a3b8;
          cursor: not-allowed;
        }

        /* Cart Side styles */
        .pos-cart-side {
          display: flex;
          flex-direction: column;
          max-height: 780px;
        }

        .pos-cart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(16, 67, 74, 0.15);
        }

        .pos-cart-header h3 {
          margin: 0;
        }

        .pos-clear-btn {
          background: transparent !important;
          border: 1px solid rgba(239, 68, 68, 0.4) !important;
          color: #ef4444 !important;
          padding: 0.3rem 0.6rem !important;
          font-size: 0.78rem !important;
          border-radius: 6px !important;
        }

        .pos-clear-btn:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.05) !important;
          transform: none !important;
          box-shadow: none !important;
        }

        .pos-empty-cart {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5rem 1rem;
          text-align: center;
          color: #64748b;
        }

        .pos-empty-icon {
          font-size: 3rem;
          opacity: 0.4;
          margin-bottom: 1rem;
        }

        .pos-cart-content {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
        }

        .pos-cart-items {
          flex: 1;
          overflow-y: auto;
          margin-bottom: 1rem;
          padding-right: 0.25rem;
          max-height: 350px;
        }

        .pos-cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.65rem 0.25rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .pos-item-info {
          display: flex;
          flex-direction: column;
          flex: 1;
          margin-right: 0.5rem;
        }

        .pos-item-name {
          font-size: 0.85rem;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 180px;
        }

        .pos-item-price {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          color: #64748b;
        }

        .pos-item-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .pos-qty-control {
          display: flex;
          align-items: center;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          overflow: hidden;
          background: #f8fafc;
        }

        .pos-qty-btn {
          background: transparent;
          border: none;
          width: 28px;
          height: 28px;
          font-weight: bold;
          font-size: 1rem;
          cursor: pointer;
          color: #475569;
          transition: background 0.1s;
        }

        .pos-qty-btn:hover {
          background: #e2e8f0;
        }

        .pos-qty-value {
          width: 30px;
          text-align: center;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.82rem;
          font-weight: bold;
          color: #0f172a;
        }

        .pos-delete-item-btn {
          background: transparent;
          border: none;
          color: #ef4444;
          font-size: 0.95rem;
          cursor: pointer;
          padding: 0.25rem;
          opacity: 0.6;
          transition: opacity 0.1s;
        }

        .pos-delete-item-btn:hover {
          opacity: 1;
        }

        .pos-pricing-panel {
          padding-top: 0.75rem;
          border-top: 1px solid #f1f5f9;
        }

        .pos-discount-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .pos-discount-row label {
          font-size: 0.8rem;
          font-weight: bold;
          color: #475569;
        }

        .pos-discount-number-input {
          width: 50px;
          padding: 0.25rem;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-family: 'JetBrains Mono', monospace;
          text-align: center;
          font-size: 0.82rem;
        }

        .pos-discount-slider {
          flex: 1;
          accent-color: var(--primary);
        }

        .pos-coupon-row {
          display: flex;
          gap: 0.35rem;
          margin-bottom: 0.5rem;
        }

        .pos-coupon-input {
          flex: 1;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 0.35rem 0.5rem;
          font-size: 0.82rem;
          font-family: 'Space Grotesk', sans-serif;
        }

        .pos-coupon-btn {
          border: 1px solid #cbd5e1 !important;
          background: #f1f5f9 !important;
          color: #1e293b !important;
          padding: 0.35rem 0.75rem !important;
          font-size: 0.82rem !important;
          border-radius: 6px !important;
          font-weight: bold !important;
        }

        .pos-applied-code-indicator {
          font-size: 0.78rem;
          color: #166534;
          background: #f0fdf4;
          padding: 0.35rem;
          border-radius: 6px;
          margin-bottom: 0.75rem;
          border: 1px dashed #bbf7d0;
        }

        .pos-totals-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .pos-total-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          margin-bottom: 0.35rem;
          color: #475569;
        }

        .pos-total-row.discount {
          color: #b91c1c;
          font-weight: 500;
        }

        .font-mono {
          font-family: 'JetBrains Mono', monospace;
        }

        .pos-total-divider {
          border: 0;
          border-top: 1px solid #cbd5e1;
          margin: 0.5rem 0;
        }

        .pos-total-row.final {
          color: #0f172a;
          font-weight: bold;
          font-size: 1.05rem;
        }

        .total-amount {
          color: var(--primary);
        }

        .pos-checkout-trigger-btn {
          width: 100%;
          background: linear-gradient(135deg, #155f62, #0d3e41);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 0.875rem;
          font-size: 1rem;
          font-weight: bold;
          font-family: 'Space Grotesk', sans-serif;
          cursor: pointer;
          transition: filter 0.15s, transform 0.15s;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .pos-checkout-trigger-btn:hover {
          filter: brightness(1.15);
          transform: translateY(-1px);
        }

        /* Modal Overlay and container styling */
        .pos-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fade-in 0.2s ease-out;
        }

        .pos-modal {
          width: min(480px, 92vw);
          background: white;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          animation: slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .pos-modal h3 {
          margin: 0;
          color: #0f172a;
        }

        .pos-modal-body {
          margin: 1.25rem 0;
        }

        .pos-modal-billing-summary {
          background: #f8fafc;
          border-radius: 8px;
          padding: 0.75rem;
          border: 1px dashed #cbd5e1;
          margin-bottom: 1rem;
        }

        .pos-modal-summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .pos-modal-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .pos-modal-input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0.75rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.15rem;
          margin-top: 0.25rem;
        }

        .pos-change-box {
          margin-top: 0.75rem;
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.95rem;
        }

        .pos-change-box.success {
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        .pos-change-box.error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .pos-modal-footer {
          display: flex;
          gap: 0.5rem;
        }

        /* Receipt styling */
        .receipt-card {
          width: min(380px, 92vw) !important;
          background: #fefefc !important;
          color: #000 !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 8px !important;
          padding: 1.25rem !important;
        }

        .receipt-paper {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.82rem;
          color: #000;
        }

        .receipt-header {
          text-align: center;
          margin-bottom: 0.75rem;
        }

        .receipt-header h2 {
          font-size: 1.2rem;
          margin: 0 0 0.25rem;
          letter-spacing: 1px;
        }

        .receipt-header p {
          margin: 0.1rem 0;
          font-size: 0.7rem;
        }

        .receipt-meta {
          font-size: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .receipt-meta div {
          margin: 0.15rem 0;
        }

        .receipt-divider-dash {
          margin: 0.3rem 0;
          letter-spacing: -1px;
          overflow: hidden;
          white-space: nowrap;
          color: #64748b;
        }

        .receipt-items-table {
          width: 100%;
          margin: 0.5rem 0;
          border-collapse: collapse;
          min-width: 0 !important;
        }

        .receipt-items-table th,
        .receipt-items-table td {
          font-family: 'JetBrains Mono', monospace;
          padding: 0.25rem 0;
          font-size: 0.78rem;
          border-bottom: none !important;
          color: #000 !important;
        }

        .receipt-items-table th {
          font-weight: bold;
        }

        .receipt-totals-box {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          font-size: 0.78rem;
        }

        .receipt-totals-row {
          display: flex;
          justify-content: space-between;
        }

        .receipt-totals-grand {
          font-weight: bold;
          font-size: 0.9rem;
          margin-top: 0.25rem;
        }

        .receipt-payment-info {
          font-size: 0.75rem;
          margin: 0.5rem 0;
        }

        .receipt-barcode {
          font-family: 'Libre Barcode 39', 'Courier New', monospace;
          font-size: 2.2rem;
          letter-spacing: 2px;
          text-align: center;
          margin: 0.75rem 0 0.25rem;
        }

        .receipt-thankyou {
          text-align: center;
          font-style: italic;
          margin: 0.25rem 0 0;
          font-size: 0.75rem;
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-up {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 980px) {
          .pos-grid {
            grid-template-columns: 1fr;
          }
          .pos-cart-side {
            max-height: none;
          }
        }
      `}</style>
    </div>
  )
}
