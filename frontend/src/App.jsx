import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import { getHomePathByRole } from './auth/routeUtils'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuth } from './hooks/useAuth'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { AdminTenantsPage } from './pages/AdminTenantsPage'
import { TenantDashboardPage } from './pages/TenantDashboardPage'
import { TenantLoginPage } from './pages/TenantLoginPage'
import { TenantShiftPage } from './pages/TenantShiftPage'
import { TenantStaffPage } from './pages/TenantStaffPage'
import { TenantStoresPage } from './pages/TenantStoresPage'

const PHASE_STEPS = [
  'Phase 1: Infrastructure + Tenant Provisioning',
  'Phase 2: Auth, Product, Inventory',
  'Phase 3: Sales + RabbitMQ Events',
  'Phase 4: Reporting + CQRS',
]

function App() {
  const auth = useAuth()
  const isPlatformAdmin = auth.user?.role === 'platform_admin'
  const fallbackPath = auth.isAuthenticated ? getHomePathByRole(auth.user?.role, auth.tenantProfile) : '/admin/login'

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="kicker">POS SaaS Demo Console</p>
        <h1>Authentication + Tenant Console</h1>
        <p className="subtitle">
          Route-guarded flows are now separated for platform admin and tenant users.
        </p>
      </header>

      <section className="phase-track" aria-label="Implementation phases">
        {PHASE_STEPS.map((step, index) => (
          <div className="phase-pill" key={step}>
            <span className="phase-index">0{index + 1}</span>
            <span>{step}</span>
          </div>
        ))}
      </section>

      {auth.isAuthenticated ? (
        <section className="session-strip" aria-label="Current session">
          <div>
            <strong>{auth.user?.username || auth.user?.email}</strong>
            <span className="role-chip">{auth.tenantProfile?.role_name || auth.user?.role}</span>
            <p className="muted inline">
              {isPlatformAdmin
                ? 'Platform scope: tenant management endpoints available.'
                : `Tenant scope: ${auth.tenantProfile?.full_name || 'User'}`}
            </p>
          </div>
          <div className="card-head">
            <button type="button" onClick={auth.logout}>
              Logout
            </button>
          </div>
        </section>
      ) : null}

      <Routes>
        <Route path="/" element={<Navigate to={fallbackPath} replace />} />
        <Route path="/admin/login" element={<AdminLoginPage auth={auth} />} />
        <Route path="/app/login" element={<TenantLoginPage auth={auth} />} />

        <Route
          path="/admin/tenants"
          element={
            <ProtectedRoute
              isLoadingSession={auth.isLoadingSession}
              isAuthenticated={auth.isAuthenticated}
              user={auth.user}
              allowedRoles={['platform_admin']}
              loginPath="/admin/login"
            >
              <AdminTenantsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/dashboard"
          element={
            <ProtectedRoute
              isLoadingSession={auth.isLoadingSession}
              isAuthenticated={auth.isAuthenticated}
              user={auth.user}
              allowedRoles={['tenant_admin']}
              allowedBusinessRoles={['admin']}
              loginPath="/app/login"
            >
              <TenantDashboardPage user={auth.user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/stores"
          element={
            <ProtectedRoute
              isLoadingSession={auth.isLoadingSession}
              isAuthenticated={auth.isAuthenticated}
              user={auth.user}
              allowedRoles={['tenant_admin', 'user']}
              allowedBusinessRoles={['admin', 'manager']}
              loginPath="/app/login"
            >
              <TenantStoresPage user={auth.user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/shift"
          element={
            <ProtectedRoute
              isLoadingSession={auth.isLoadingSession}
              isAuthenticated={auth.isAuthenticated}
              user={auth.user}
              allowedRoles={['tenant_admin', 'user']}
              allowedBusinessRoles={['admin', 'manager', 'cashier']}
              loginPath="/app/login"
            >
              <TenantShiftPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/staff"
          element={
            <ProtectedRoute
              isLoadingSession={auth.isLoadingSession}
              isAuthenticated={auth.isAuthenticated}
              user={auth.user}
              allowedRoles={['tenant_admin', 'user']}
              allowedBusinessRoles={['admin', 'manager', 'staff']}
              loginPath="/app/login"
            >
              <TenantStaffPage user={auth.user} />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to={getHomePathByRole(auth.user?.role, auth.tenantProfile)} replace />} />
      </Routes>
    </div>
  )
}

export default App
