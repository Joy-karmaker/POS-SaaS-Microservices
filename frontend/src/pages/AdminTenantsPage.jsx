import { HealthCard } from '../components/HealthCard'
import { useServiceHealth } from '../hooks/useServiceHealth'
import { useTenants } from '../hooks/useTenants'

export function AdminTenantsPage() {
  const { healthItems, isCheckingHealth, refreshHealth } = useServiceHealth()
  const {
    tenantName,
    setTenantName,
    ownerPassword,
    setOwnerPassword,
    recentTenants,
    tenantError,
    isCreatingTenant,
    isLoadingTenants,
    canCreateTenant,
    submitTenant,
  } = useTenants({ enabled: true })

  async function handleCreateTenant(event) {
    event.preventDefault()
    const created = await submitTenant()
    if (created) {
      await refreshHealth()
    }
  }

  return (
    <main className="content-grid">
      <HealthCard
        healthItems={healthItems}
        isCheckingHealth={isCheckingHealth}
        onRefresh={refreshHealth}
      />

      <article className="card">
        <h2>Provision Tenant</h2>
        <form className="tenant-form" onSubmit={handleCreateTenant}>
          <div className="form-group">
            <label htmlFor="tenantName">Tenant / Shop Name</label>
            <input
              id="tenantName"
              type="text"
              placeholder="Example: Demo Store Dhaka"
              value={tenantName}
              onChange={(event) => setTenantName(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="ownerPassword">Initial Owner Password</label>
            <input
              id="ownerPassword"
              type="password"
              placeholder="Min 8 characters"
              value={ownerPassword}
              onChange={(event) => setOwnerPassword(event.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={!canCreateTenant} className="btn-primary">
            {isCreatingTenant ? 'Provisioning...' : 'Create Tenant'}
          </button>
        </form>
        {tenantError ? <p className="error-text">{tenantError}</p> : null}
      </article>

      <article className="card span-2">
        <h2>Recent Provisioning Results</h2>
        {recentTenants.length === 0 ? (
          <p className="muted">
            {isLoadingTenants ? 'Loading tenants...' : 'No tenants created from UI yet.'}
          </p>
        ) : (
          <div className="tenant-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Tenant ID</th>
                  <th>Database</th>
                  <th>DB User</th>
                </tr>
              </thead>
              <tbody>
                {recentTenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td>{tenant.name}</td>
                    <td>{tenant.id}</td>
                    <td>{tenant.db_name}</td>
                    <td>{tenant.db_username}</td>
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
