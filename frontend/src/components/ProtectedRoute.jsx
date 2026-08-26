import { Navigate, useLocation } from 'react-router-dom'
import { getHomePathByRole } from '../auth/routeUtils'

export function ProtectedRoute({
  isLoadingSession,
  isAuthenticated,
  user,
  tenantProfile,
  allowedRoles,
  allowedBusinessRoles = [],
  loginPath,
  children,
}) {
  const location = useLocation()

  if (isLoadingSession) {
    return (
      <article className="card span-2">
        <h2>Checking session...</h2>
        <p className="muted">Please wait while we validate your token.</p>
      </article>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />
  }

  // Check Central Role
  const hasCentralRole = allowedRoles.includes(user?.role)
  
  // Check Business Role if specified
  let hasBusinessRole = true
  if (allowedBusinessRoles.length > 0) {
    const roleCode = tenantProfile?.role_code || ''
    hasBusinessRole = allowedBusinessRoles.includes(roleCode)
  }

  if (!hasCentralRole || !hasBusinessRole) {
    return <Navigate to={getHomePathByRole(user?.role, tenantProfile)} replace />
  }

  return children
}
