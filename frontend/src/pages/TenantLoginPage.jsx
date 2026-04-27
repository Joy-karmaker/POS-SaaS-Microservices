import { useState } from 'react'
import { Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { getHomePathByRole } from '../auth/routeUtils'
import { HealthCard } from '../components/HealthCard'
import { useServiceHealth } from '../hooks/useServiceHealth'

export function TenantLoginPage({ auth }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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

    const parts = username.trim().split('.')
    const tenantId = parts.length > 1 ? parts[0] : null
    const actualUsername = parts.length > 1 ? parts.slice(1).join('.') : username.trim()

    const user = await auth.login({
      username: actualUsername,
      password,
      tenantId,
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
          <label htmlFor="tenantUsername">Username (e.g. store.1 or store.admin)</label>
          <input
            id="tenantUsername"
            type="text"
            pattern="^[a-zA-Z0-9-]+\.[a-zA-Z0-9]+$"
            title="Username must be in the format: tenant_name.username (e.g. mystore.123 or mystore.admin)"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
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
