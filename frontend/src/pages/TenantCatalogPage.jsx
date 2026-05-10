import { useEffect, useState } from 'react'
import { getCategories, createCategory, getProducts, createProduct } from '../api/catalogApi'
import { TenantNav } from '../components/TenantNav'

export function TenantCatalogPage({ user }) {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newCatName, setNewCatName] = useState('')

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const [cats, prods] = await Promise.all([getCategories(), getProducts()])
        setCategories(cats)
        setProducts(prods)
      } catch (err) {
        console.error('Failed to load catalog', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCatalog()
  }, [])

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    try {
      const cat = await createCategory({ name: newCatName })
      setCategories([...categories, cat])
      setNewCatName('')
    } catch (err) {
      console.error(err)
      alert('Failed to create category')
    }
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

      <main className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
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
              <ul>
                {categories.map((c) => (
                  <li key={c.id}>
                    <strong>{c.name}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card-footer">
            <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              <input
                type="text"
                placeholder="New category name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="primary">Add</button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Products</h3>
          </div>
          <div className="card-body">
            {loading ? (
              <p className="muted">Loading products...</p>
            ) : products.length === 0 ? (
              <p className="muted">No products found.</p>
            ) : (
              <ul>
                {products.map((p) => (
                  <li key={p.id}>
                    <strong>{p.name}</strong> - ${p.price} (Stock: {p.stock_quantity})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
