import { useEffect, useState, useMemo } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory, getProducts, createProduct, updateProduct, deleteProduct, getProductSearchIndex } from '../api/catalogApi'
import { TenantNav } from '../components/TenantNav'
import { io } from 'socket.io-client'
import { FuzzySearchIndex } from '../utils/FuzzySearchIndex'

export function TenantCatalogPage({ user }) {
  const [allCategories, setAllCategories] = useState([])
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newCatName, setNewCatName] = useState('')
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category_id: '',
    stock_quantity: '',
    sku: '',
    barcode: '',
    image_url: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 })
  
  const [catPage, setCatPage] = useState(1)
  const [catLimit, setCatLimit] = useState(5)
  const [catMeta, setCatMeta] = useState({ total: 0, totalPages: 1 })
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({
    name: '',
    price: '',
    category_id: '',
    stock_quantity: '',
    sku: '',
    barcode: '',
    image_url: ''
  })
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState([])

  // Fetch all categories for dropdowns
  const fetchAllCategories = async () => {
    try {
      const res = await getCategories()
      setAllCategories(Array.isArray(res) ? res : (res.data || []))
    } catch (err) {
      console.error('Failed to load all categories', err)
    }
  }

  // Fetch paginated categories for the table
  const fetchCategoriesList = async () => {
    try {
      const res = await getCategories({ page: catPage, limit: catLimit })
      if (res && res.data && res.meta) {
        setCategories(res.data)
        setCatMeta(res.meta)
      } else if (Array.isArray(res)) {
        setCategories(res)
      }
    } catch (err) {
      console.error('Failed to load categories', err)
    }
  }

  useEffect(() => {
    fetchAllCategories()
  }, [])

  useEffect(() => {
    fetchCategoriesList()
  }, [catPage, catLimit])

  const searchIndex = useMemo(() => new FuzzySearchIndex(), [])
  const [indexVersion, setIndexVersion] = useState(0)

  // Initialize product search index
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

  useEffect(() => {
    initializeProductsIndex()
  }, [])

  const computeVisibleProducts = () => {
    // 1. Get searched products from local Trie
    let filtered = appliedSearchTerm
      ? searchIndex.search(appliedSearchTerm)
      : Array.from(searchIndex.productsMap.values())

    // 2. Filter by category
    if (filterCategory) {
      filtered = filtered.filter(p => p.category_id === Number(filterCategory))
    }

    // 3. Paginate
    const total = filtered.length
    const totalPages = Math.ceil(total / limit) || 1

    // Safety check: reset to page 1 if current page is out of bounds
    let currentPage = page
    if (page > totalPages) {
      currentPage = 1
      setPage(1)
    }

    const startIndex = (currentPage - 1) * limit
    const paginated = filtered.slice(startIndex, startIndex + limit)

    setProducts(paginated)
    setMeta({
      total,
      page: currentPage,
      limit,
      totalPages
    })
  }

  // Compute products list when filters, pagination, or search index updates
  useEffect(() => {
    computeVisibleProducts()
  }, [page, limit, appliedSearchTerm, filterCategory, indexVersion])

  // Real-time stock & catalog updates via WebSockets
  useEffect(() => {
    const socket = io(window.location.origin, {
      path: '/catalog/socket.io',
      transports: ['websocket'],
      upgrade: false
    })

    socket.on('connect', () => {
      console.log('Connected to real-time inventory updates channel')
    })

    socket.on('connect_error', (err) => {
      console.warn('Real-time connection failed, retrying...', err.message)
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

  const handleSearchSubmit = () => {
    setAppliedSearchTerm(searchTerm)
    setPage(1)
  }

  const handleCategoryFilterChange = (e) => {
    setFilterCategory(e.target.value)
    setPage(1)
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    try {
      await createCategory({ name: newCatName })
      fetchCategoriesList()
      fetchAllCategories()
      setNewCatName('')
    } catch (err) {
      console.error(err)
      alert('Failed to create category')
    }
  }

  const handleCreateProduct = async (e) => {
    e.preventDefault()
    if (!newProduct.name || !newProduct.price) return
    try {
      const prod = await createProduct({
        ...newProduct,
        price: parseFloat(newProduct.price),
        category_id: newProduct.category_id ? parseInt(newProduct.category_id) : undefined,
        stock_quantity: newProduct.stock_quantity ? parseInt(newProduct.stock_quantity) : 0,
        sku: newProduct.sku,
        barcode: newProduct.barcode,
        image_url: newProduct.image_url
      })
      searchIndex.addProduct(prod)
      setIndexVersion(v => v + 1)
      setNewProduct({ name: '', price: '', category_id: '', stock_quantity: '', sku: '', barcode: '', image_url: '' })
    } catch (err) {
      console.error(err)
      alert('Failed to create product')
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    try {
      await deleteCategory(id)
      fetchCategoriesList()
      fetchAllCategories()
    } catch (err) {
      console.error(err)
      alert('Failed to delete category')
    }
  }

  const handleUpdateCategory = async (e) => {
    e.preventDefault()
    if (!editCategoryName.trim()) return
    try {
      await updateCategory(editingCategoryId, { name: editCategoryName })
      setEditingCategoryId(null)
      fetchCategoriesList()
      fetchAllCategories()
      // Update local products categories in index
      for (const [id, p] of searchIndex.productsMap.entries()) {
        if (p.category_id === editingCategoryId) {
          p.category = { ...p.category, name: editCategoryName }
        }
      }
      searchIndex.rebuild()
      setIndexVersion(v => v + 1)
    } catch (err) {
      console.error(err)
      alert('Failed to update category')
    }
  }

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await deleteProduct(id)
      searchIndex.removeProduct(id)
      setIndexVersion(v => v + 1)
    } catch (err) {
      console.error(err)
      alert('Failed to delete product')
    }
  }

  const startEditing = (p) => {
    setEditingId(p.id)
    setEditData({
      name: p.name,
      price: p.price.toString(),
      category_id: p.category_id?.toString() || '',
      stock_quantity: p.stock_quantity.toString(),
      sku: p.sku || '',
      barcode: p.barcode || '',
      image_url: p.image_url || ''
    })
  }

  const handleUpdateProduct = async (e) => {
    e.preventDefault()
    try {
      const updated = await updateProduct(editingId, {
        ...editData,
        price: parseFloat(editData.price),
        category_id: editData.category_id ? parseInt(editData.category_id) : null,
        stock_quantity: parseInt(editData.stock_quantity)
      })
      searchIndex.addProduct(updated)
      setIndexVersion(v => v + 1)
      setEditingId(null)
    } catch (err) {
      console.error(err)
      alert('Failed to update product')
    }
  }

  const handleToggleSelectAll = () => {
    if (selectedProductIds.length === products.length && products.length > 0) {
      setSelectedProductIds([])
    } else {
      setSelectedProductIds(products.map(p => p.id))
    }
  }

  const handleToggleSelect = (id) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(sid => sid !== id))
    } else {
      setSelectedProductIds([...selectedProductIds, id])
    }
  }

  const handleBulkDelete = async () => {
    if (!selectedProductIds.length) return
    if (!confirm(`Are you sure you want to delete ${selectedProductIds.length} products?`)) return
    try {
      await Promise.all(selectedProductIds.map(id => deleteProduct(id)))
      selectedProductIds.forEach(id => searchIndex.removeProduct(id))
      setIndexVersion(v => v + 1)
      setSelectedProductIds([])
    } catch (err) {
      console.error(err)
      alert('Failed to delete some products')
    }
  }

  const handleExportCSV = () => {
    const headers = ['Name', 'SKU', 'Category', 'Price', 'Stock']
    let matched = appliedSearchTerm
      ? searchIndex.search(appliedSearchTerm)
      : Array.from(searchIndex.productsMap.values())
    if (filterCategory) {
      matched = matched.filter(p => p.category_id === Number(filterCategory))
    }

    const rows = matched.map(p => [
      p.name,
      p.sku || '',
      p.category?.name || '',
      p.price,
      p.stock_quantity
    ])
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `catalog_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImportCSV = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target.result
      const lines = text.split('\n')
      const rows = lines.slice(1) // skip header
      const importedProducts = []
      
      for (const row of rows) {
        if (!row.trim()) continue
        const [name, sku, categoryName, price, stock] = row.split(',')
        
        // Find category ID by name
        const cat = categories.find(c => c.name.toLowerCase() === (categoryName || '').trim().toLowerCase())
        
        try {
          const prod = await createProduct({
            name: (name || '').trim(),
            sku: (sku || '').trim(),
            price: parseFloat(price || 0),
            stock_quantity: parseInt(stock || 0),
            category_id: cat ? cat.id : undefined
          })
          importedProducts.push(prod)
        } catch (err) {
          console.error(`Failed to import row: ${row}`, err)
        }
      }
      searchIndex.addProducts(importedProducts)
      setIndexVersion(v => v + 1)
      alert(`Imported ${importedProducts.length} products successfully!`)
      e.target.value = '' // reset input
    }
    reader.readAsText(file)
  }

  const formatStockOutDateShort = (p) => {
    if (p.stock_quantity === 0) {
      return <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.8rem' }}>OUT</span>
    }
    if (!p.stock_out_date || parseFloat(p.sales_velocity) === 0) {
      return <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Stable</span>
    }
    const date = new Date(p.stock_out_date)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.8rem' }}>Today</span>
    if (diffDays === 1) return <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.8rem' }}>Tomorrow</span>
    if (diffDays <= 3) return <span style={{ color: '#f97316', fontWeight: 600, fontSize: '0.8rem', padding: '2px 6px', background: 'rgba(249, 115, 22, 0.08)', borderRadius: '4px' }}>&lt;3 Days</span>
    if (diffDays <= 7) return <span style={{ color: '#eab308', fontWeight: 500, fontSize: '0.8rem', padding: '2px 6px', background: 'rgba(234, 179, 8, 0.08)', borderRadius: '4px' }}>&lt;7 Days</span>
    return <span style={{ color: '#10b981', fontSize: '0.8rem' }}>{diffDays} Days</span>
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h2>Catalog & Inventory</h2>
          <p className="muted">Manage your categories and products.</p>
        </div>
      </header>

      <TenantNav />

      <main className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1.8fr' }}>
        <div className="card">
          <div className="card-head">
            <h3>Categories</h3>
          </div>
          <div className="card-body">
            {loading ? (
              <p className="muted">Loading categories...</p>
            ) : categories.length === 0 ? (
              <p className="muted">No categories found.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {categories.map((c) => (
                  <li key={c.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                    {editingCategoryId === c.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        <input 
                          type="text" 
                          value={editCategoryName} 
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          style={{ flex: 1, padding: '4px 8px', fontSize: '0.85rem' }}
                        />
                        <button 
                          onClick={handleUpdateCategory}
                          className="btn-primary"
                          style={{ width: 'auto', padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setEditingCategoryId(null)}
                          style={{ width: 'auto', padding: '4px 8px', background: '#ccc', color: '#333', border: 'none', borderRadius: '4px', fontSize: '0.75rem' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <strong>{c.name}</strong>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button 
                            onClick={() => { setEditingCategoryId(c.id); setEditCategoryName(c.name); }}
                            style={{ width: 'auto', padding: '4px 8px', background: 'rgba(45, 128, 125, 0.1)', color: 'var(--primary)', border: 'none', borderRadius: '4px', fontSize: '0.75rem' }}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(c.id)}
                            style={{ width: 'auto', padding: '4px 8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '4px', fontSize: '0.75rem' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            
            {/* Category Pagination Controls */}
            {categories.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Showing {categories.length} of {catMeta.total || categories.length} categories
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    disabled={catPage === 1} 
                    onClick={() => setCatPage(p => p - 1)}
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', border: 'none', borderRadius: '4px', background: catPage === 1 ? '#f1f5f9' : 'rgba(45, 128, 125, 0.1)', color: catPage === 1 ? '#94a3b8' : 'var(--primary)', cursor: catPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                  >
                    Prev
                  </button>
                  <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>Page {catPage} of {catMeta.totalPages || 1}</span>
                  <button 
                    disabled={catPage >= (catMeta.totalPages || 1)} 
                    onClick={() => setCatPage(p => p + 1)}
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', border: 'none', borderRadius: '4px', background: catPage >= (catMeta.totalPages || 1) ? '#f1f5f9' : 'rgba(45, 128, 125, 0.1)', color: catPage >= (catMeta.totalPages || 1) ? '#94a3b8' : 'var(--primary)', cursor: catPage >= (catMeta.totalPages || 1) ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                  >
                    Next
                  </button>
                  <select 
                    value={catLimit} 
                    onChange={e => { setCatLimit(Number(e.target.value)); setCatPage(1); }} 
                    style={{ padding: '0.25rem', fontSize: '0.85rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  >
                    <option value={5}>5 / page</option>
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                  </select>
                </div>
              </div>
            )}
            
          </div>
          <div className="card-footer">
            <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              <input
                type="text"
                placeholder="New category name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                style={{ flex: 3, padding: '0.75rem 1rem' }}
              />
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: 'auto', flex: 1, padding: '0.75rem 1.5rem', whiteSpace: 'nowrap' }}
              >
                Add
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Products</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flex: 2 }}>
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit() }}
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
                />
                <button 
                  onClick={handleSearchSubmit} 
                  className="btn-primary" 
                  style={{ width: 'auto', padding: '0.5rem 1rem' }}
                >
                  Search
                </button>
              </div>
              <select 
                value={filterCategory}
                onChange={handleCategoryFilterChange}
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
              >
                <option value="">All Categories</option>
                {allCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button 
                onClick={handleExportCSV}
                style={{ flex: 1, padding: '0.5rem', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}
              >
                Export CSV
              </button>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', margin: 0 }}>
                Import CSV
                <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display: 'none' }} />
              </label>
            </div>

            {selectedProductIds.length > 0 && (
              <div style={{ background: 'rgba(45, 128, 125, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem' }}>
                  {selectedProductIds.length} items selected
                </span>
                <button 
                  onClick={handleBulkDelete}
                  style={{ width: 'auto', padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.85rem' }}
                >
                  Delete Selected
                </button>
              </div>
            )}

            {loading && products.length === 0 ? (
              <p className="muted" style={{ minHeight: '300px' }}>Loading products...</p>
            ) : products.length === 0 && !loading ? (
              <p className="muted" style={{ minHeight: '300px' }}>No products found.</p>
            ) : (
              <div className="tenant-table-wrap" style={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto', transition: 'opacity 0.2s', minHeight: '300px' }}>
                <table style={{ minWidth: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        <input 
                          type="checkbox" 
                          checked={products.length > 0 && selectedProductIds.length === products.length}
                          onChange={handleToggleSelectAll}
                        />
                      </th>
                      <th></th>
                      <th>Name</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th style={{ textAlign: 'center' }}>Stock</th>
                      <th style={{ textAlign: 'center' }}>Velocity (Qty/Day)</th>
                      <th style={{ textAlign: 'center' }}>Stock-out Forecast</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className={selectedProductIds.includes(p.id) ? 'selected-row' : ''}>
                        {editingId === p.id ? (
                          <>
                            <td></td>
                            <td></td>
                            <td>
                              <input 
                                type="text" 
                                value={editData.name} 
                                onChange={(e) => setEditData({...editData, name: e.target.value})}
                                style={{ padding: '4px', fontSize: '0.8rem', width: '100px' }}
                              />
                            </td>
                            <td>
                              <input 
                                type="text" 
                                placeholder="SKU"
                                value={editData.sku} 
                                onChange={(e) => setEditData({...editData, sku: e.target.value})}
                                style={{ padding: '4px', fontSize: '0.8rem', width: '70px' }}
                              />
                            </td>
                            <td>
                              <select 
                                value={editData.category_id} 
                                onChange={(e) => setEditData({...editData, category_id: e.target.value})}
                                style={{ padding: '4px', fontSize: '0.8rem' }}
                              >
                                <option value="">None</option>
                                {allCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            </td>
                            <td>
                              <input 
                                type="number" 
                                step="0.01"
                                value={editData.price} 
                                onChange={(e) => setEditData({...editData, price: e.target.value})}
                                style={{ padding: '4px', fontSize: '0.8rem', width: '70px' }}
                              />
                            </td>
                            <td>
                              <input 
                                type="number" 
                                value={editData.stock_quantity} 
                                onChange={(e) => setEditData({...editData, stock_quantity: e.target.value})}
                                style={{ padding: '4px', fontSize: '0.8rem', width: '60px' }}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>-</td>
                            <td style={{ textAlign: 'center' }}>-</td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                <button onClick={handleUpdateProduct} className="btn-primary" style={{ width: 'auto', padding: '4px 8px', fontSize: '0.75rem' }}>Save</button>
                                <button onClick={() => setEditingId(null)} style={{ width: 'auto', padding: '4px 8px', background: '#ccc', color: '#333', border: 'none', borderRadius: '4px', fontSize: '0.75rem' }}>Cancel</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>
                              <input 
                                type="checkbox" 
                                checked={selectedProductIds.includes(p.id)}
                                onChange={() => handleToggleSelect(p.id)}
                              />
                            </td>
                            <td>
                              <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                {p.image_url ? (
                                  <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '10px' }}>No Img</div>
                                )}
                              </div>
                            </td>
                            <td><strong>{p.name}</strong></td>
                            <td style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono' }} className="muted">{p.sku || '-'}</td>
                            <td>{p.category?.name || <span className="muted">None</span>}</td>
                            <td style={{ fontFamily: 'JetBrains Mono' }}>${p.price}</td>
                            <td style={{ 
                              fontFamily: 'JetBrains Mono', 
                              textAlign: 'center',
                              color: p.stock_quantity === 0 ? '#ef4444' : p.stock_quantity < 5 ? '#f97316' : 'inherit',
                              fontWeight: p.stock_quantity < 5 ? 'bold' : 'normal'
                            }}>
                              {p.stock_quantity}
                              {p.stock_quantity < 5 && p.stock_quantity > 0 && <span style={{ fontSize: '0.65rem', marginLeft: '4px', textTransform: 'uppercase', padding: '2px 4px', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '4px' }}>Low</span>}
                              {p.stock_quantity === 0 && <span style={{ fontSize: '0.65rem', marginLeft: '4px', textTransform: 'uppercase', padding: '2px 4px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>Out</span>}
                            </td>
                            <td style={{ fontFamily: 'JetBrains Mono', textAlign: 'center' }}>
                              {p.sales_velocity}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 500 }}>
                              {formatStockOutDateShort(p)}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                <button 
                                  onClick={() => startEditing(p)}
                                  style={{ width: 'auto', padding: '4px 8px', background: 'rgba(45, 128, 125, 0.1)', color: 'var(--primary)', border: 'none', borderRadius: '4px', fontSize: '0.75rem' }}
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteProduct(p.id)}
                                  style={{ width: 'auto', padding: '4px 8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '4px', fontSize: '0.75rem' }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Showing {products.length} of {meta.total || products.length} products
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button 
                      disabled={page === 1} 
                      onClick={() => setPage(p => p - 1)}
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', border: 'none', borderRadius: '4px', background: page === 1 ? '#f1f5f9' : 'rgba(45, 128, 125, 0.1)', color: page === 1 ? '#94a3b8' : 'var(--primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                    >
                      Prev
                    </button>
                    <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>Page {page} of {meta.totalPages || 1}</span>
                    <button 
                      disabled={page >= (meta.totalPages || 1)} 
                      onClick={() => setPage(p => p + 1)}
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', border: 'none', borderRadius: '4px', background: page >= (meta.totalPages || 1) ? '#f1f5f9' : 'rgba(45, 128, 125, 0.1)', color: page >= (meta.totalPages || 1) ? '#94a3b8' : 'var(--primary)', cursor: page >= (meta.totalPages || 1) ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                    >
                      Next
                    </button>
                    <select 
                      value={limit} 
                      onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} 
                      style={{ padding: '0.25rem', fontSize: '0.85rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    >
                      <option value={10}>10 / page</option>
                      <option value={20}>20 / page</option>
                      <option value={50}>50 / page</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="card-footer">
            <form onSubmit={handleCreateProduct} className="tenant-form" style={{ gap: '0.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Product name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="SKU"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Image URL"
                  value={newProduct.image_url}
                  onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                />
                <select
                  value={newProduct.category_id}
                  onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="">No Category</option>
                  {allCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  style={{ flex: 2 }}
                  required
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={newProduct.stock_quantity}
                  onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                  style={{ flex: 1 }}
                />
                <button 
                  type="submit" 
                  className="btn-primary"
                  style={{ width: 'auto', padding: '0.75rem 1.5rem', whiteSpace: 'nowrap' }}
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
