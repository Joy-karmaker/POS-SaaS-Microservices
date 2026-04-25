import { useState } from 'react'
import { Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { getHomePathByRole } from '../auth/routeUtils'
import { HealthCard } from '../components/HealthCard'
import { useServiceHealth } from '../hooks/useServiceHealth'

export function TenantLoginPage({ auth }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('tenant.admin@example.com')
  const [password, setPassword] = useState('tenant12345')
  const { healthItems, isCheckingHealth, refreshHealth } = useServiceHealth()

  if (auth.isLoadingSession) {
    return (
      <main className="content-grid">
        <article className="card span-2">
          <h2>Checking session...</h2>
          <p className="muted">Please wait while we validate your token.</p>
        </article>
      </main>
    )
  }

  if (auth.isAuthenticated) {
    return <Navigate to={getHomePathByRole(auth.user?.role)} replace />
  }

  async function handleLogin(event) {
    event.preventDefault()
    auth.clearError()

    const user = await auth.login({
      email: email.trim(),
      password,
      allowedRoles: ['tenant_admin', 'user'],
    })

    if (!user) {
      return
    }

    const requestedPath = location.state?.from
    const nextPath =
      typeof requestedPath === 'string' && requestedPath.startsWith('/app/')
        ? requestedPath
        : '/app/dashboard'

    await refreshHealth()
    navigate(nextPath, { replace: true })
  }

  return (
    <main className="content-grid">
      <article className="card">
        <h2>Tenant Login</h2>
        <p className="muted">Use this page for tenant admin and tenant user accounts.</p>
        <div className="route-tabs">
          <NavLink to="/app/login" className="route-tab active">
            App Login
          </NavLink>
          <NavLink to="/admin/login" className="route-tab">
            Go to Admin Login
          </NavLink>
        </div>
        <form className="tenant-form" onSubmit={handleLogin}>
          <label htmlFor="tenantEmail">Email</label>
          <input
            id="tenantEmail"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label htmlFor="tenantPassword">Password</label>
          <input
            id="tenantPassword"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button type="submit" disabled={auth.isLoggingIn}>
            {auth.isLoggingIn ? 'Signing in...' : 'Login as Tenant User'}
          </button>
        </form>
        {auth.authError ? <p className="error-text">{auth.authError}</p> : null}
      </article>

        <article className="card">
          <h2>Expected Redirect</h2>
          <ol className="demo-list">
            <li>
              <code>tenant_admin</code> to <code>/app/dashboard</code>
            </li>
            <li>
              <code>user</code> to <code>/app/dashboard</code>
            </li>
            <li>
              <code>platform_admin</code> is not allowed from this page
            </li>
          </ol>
        </article>

      <HealthCard
        healthItems={healthItems}
        isCheckingHealth={isCheckingHealth}
        onRefresh={refreshHealth}
        title="Live Health"
      />
    </main>
  )
}
