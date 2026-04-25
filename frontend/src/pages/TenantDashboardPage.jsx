import { HealthCard } from '../components/HealthCard'
import { TenantNav } from '../components/TenantNav'
import { useServiceHealth } from '../hooks/useServiceHealth'

export function TenantDashboardPage({ user }) {
  const { healthItems, isCheckingHealth, refreshHealth } = useServiceHealth()

  return (
    <main className="content-grid">
      <article className="card span-2">
        <h2>Tenant Workspace</h2>
        <p className="muted">Core navigation for tenant modules.</p>
        <TenantNav />
      </article>

      <HealthCard
        healthItems={healthItems}
        isCheckingHealth={isCheckingHealth}
        onRefresh={refreshHealth}
      />

      <article className="card">
        <h2>Session Context</h2>
        <p className="muted">
          Login successful. This area is for tenant modules (stores, shift, products, inventory,
          sales).
        </p>
        <div className="session-meta">
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
          <p>
            <strong>Role:</strong> {user?.role}
          </p>
          <p>
            <strong>Tenant ID:</strong> {user?.tenant_id ?? 'N/A'}
          </p>
        </div>
      </article>

      <article className="card span-2">
        <h2>Next Tenant Steps</h2>
        <ol className="demo-list">
          <li>Use Stores page to create/view tenant stores.</li>
          <li>Use Shift page to open and close cashier shifts.</li>
          <li>Next: add product and inventory CRUD APIs for tenant scope.</li>
        </ol>
      </article>
    </main>
  )
}
