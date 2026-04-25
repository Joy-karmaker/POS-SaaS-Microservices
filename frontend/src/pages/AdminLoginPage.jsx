import { useState } from 'react'
import { Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { getHomePathByRole } from '../auth/routeUtils'
import { HealthCard } from '../components/HealthCard'
import { useServiceHealth } from '../hooks/useServiceHealth'

export function AdminLoginPage({ auth }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [bootstrapUsername, setBootstrapUsername] = useState('')
  const [bootstrapPassword, setBootstrapPassword] = useState('')
  const [bootstrapMessage, setBootstrapMessage] = useState('')
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
    setBootstrapMessage('')
    auth.clearError()

    const user = await auth.login({
      username: username.trim(),
      password,
      allowedRoles: ['platform_admin'],
    })

    if (!user) {
      return
    }

    const requestedPath = location.state?.from
    const nextPath =
      typeof requestedPath === 'string' && requestedPath.startsWith('/admin/')
        ? requestedPath
        : '/admin/tenants'

    await refreshHealth()
    navigate(nextPath, { replace: true })
  }

  async function handleBootstrap(event) {
    event.preventDefault()
    auth.clearError()
    setBootstrapMessage('')

    const created = await auth.createFirstPlatformAdmin({
      username: bootstrapUsername.trim(),
      password: bootstrapPassword,
    })

    if (!created) {
      return
    }

    const user = await auth.login({
      username: bootstrapUsername.trim(),
      password: bootstrapPassword,
      allowedRoles: ['platform_admin'],
    })

    if (user) {
      await refreshHealth()
      navigate('/admin/tenants', { replace: true })
      return
    }

    setBootstrapMessage('Platform admin created. Please login with new credentials.')
  }

  return (
    <main className="content-grid">
      <article className="card">
        <h2>Admin Login</h2>
        <p className="muted">Use this page only for platform admin accounts.</p>
        <div className="route-tabs">
          <NavLink to="/admin/login" className="route-tab active">
            Admin Login
          </NavLink>
          <NavLink to="/app/login" className="route-tab">
            Go to App Login
          </NavLink>
        </div>
        <form className="tenant-form" onSubmit={handleLogin}>
          <label htmlFor="adminUsername">Username</label>
          <input
            id="adminUsername"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />

          <label htmlFor="adminPassword">Password</label>
          <input
            id="adminPassword"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button type="submit" disabled={auth.isLoggingIn}>
            {auth.isLoggingIn ? 'Signing in...' : 'Login as Platform Admin'}
          </button>
        </form>
        {auth.authError ? <p className="error-text">{auth.authError}</p> : null}
      </article>

      <article className="card">
        <h2>Dev Bootstrap (Optional)</h2>
        <p className="muted">Create first platform admin in local environment.</p>
        <form className="tenant-form" onSubmit={handleBootstrap}>
          <label htmlFor="bootstrapUsername">Admin Username</label>
          <input
            id="bootstrapUsername"
            type="text"
            value={bootstrapUsername}
            onChange={(event) => setBootstrapUsername(event.target.value)}
          />

          <label htmlFor="bootstrapPassword">Admin Password</label>
          <input
            id="bootstrapPassword"
            type="password"
            value={bootstrapPassword}
            onChange={(event) => setBootstrapPassword(event.target.value)}
          />

          <button type="submit" disabled={auth.isBootstrapping}>
            {auth.isBootstrapping ? 'Creating...' : 'Create First Admin'}
          </button>
        </form>
        {bootstrapMessage ? <p className="success-text">{bootstrapMessage}</p> : null}
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
