import { Navigate, useLocation } from 'react-router-dom'
import { getHomePathByRole } from '../auth/routeUtils'

export function ProtectedRoute({
  isLoadingSession,
  isAuthenticated,
  user,
  allowedRoles,
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

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to={getHomePathByRole(user?.role)} replace />
  }

  return children
}
