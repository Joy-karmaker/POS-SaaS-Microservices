import { TenantNav } from '../components/TenantNav'
import { useStores } from '../hooks/useStores'

export function TenantStoresPage({ user }) {
  const isTenantAdmin = user?.role === 'tenant_admin'
  const {
    storeName,
    setStoreName,
    storeCode,
    setStoreCode,
    stores,
    storeError,
    isLoadingStores,
    isCreatingStore,
    canCreateStore,
    submitStore,
  } = useStores({ enabled: true })

  async function handleCreateStore(event) {
    event.preventDefault()
    await submitStore()
  }

  return (
    <main className="content-grid">
      <article className="card span-2">
        <h2>Tenant Stores</h2>
        <p className="muted">
          Manage store branches under your tenant. Tenant users can view stores; tenant admins can
          create them.
        </p>
        <TenantNav />
      </article>

      <article className="card">
        <h2>Create Store</h2>
        {isTenantAdmin ? (
          <form className="tenant-form" onSubmit={handleCreateStore}>
            <label htmlFor="storeName">Store Name</label>
            <input
              id="storeName"
              type="text"
              placeholder="Example: Main Outlet"
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
            />

            <label htmlFor="storeCode">Store Code (Optional)</label>
            <input
              id="storeCode"
              type="text"
              placeholder="Example: MAIN-001"
              value={storeCode}
              onChange={(event) => setStoreCode(event.target.value)}
            />

            <button type="submit" disabled={!canCreateStore}>
              {isCreatingStore ? 'Creating...' : 'Create Store'}
            </button>
          </form>
        ) : (
          <p className="muted">Read-only access: only tenant_admin can create stores.</p>
        )}

        {storeError ? <p className="error-text">{storeError}</p> : null}
      </article>

      <article className="card">
        <h2>Store Summary</h2>
        <p className="muted">Tenant: {user?.tenant_id ?? 'N/A'}</p>
        <p className="muted">Stores loaded: {stores.length}</p>
        <p className="muted">Role: {user?.role}</p>
      </article>

      <article className="card span-2">
        <h2>Stores</h2>
        {stores.length === 0 ? (
          <p className="muted">{isLoadingStores ? 'Loading stores...' : 'No stores available yet.'}</p>
        ) : (
          <div className="tenant-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Store ID</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => (
                  <tr key={store.id}>
                    <td>{store.name}</td>
                    <td>{store.code}</td>
                    <td>{store.id}</td>
                    <td>{store.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </main>
  )
}
