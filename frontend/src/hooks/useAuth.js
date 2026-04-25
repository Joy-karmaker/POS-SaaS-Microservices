import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  bootstrapPlatformAdmin,
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession as refreshSessionRequest,
} from '../api/authApi'
import { clearAuthSession, loadAuthSession, saveAuthSession } from '../api/authStorage'

function roleLabel(role) {
  if (role === 'platform_admin') {
    return 'Platform Admin'
  }

  if (role === 'tenant_admin') {
    return 'Tenant Admin'
  }

  return role === 'user' ? 'Tenant User' : role
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [authError, setAuthError] = useState('')
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isBootstrapping, setIsBootstrapping] = useState(false)

  const clearSession = useCallback(() => {
    setUser(null)
    clearAuthSession()
  }, [])

  const applySession = useCallback((nextUser) => {
    setUser(nextUser)
    saveAuthSession(nextUser)
  }, [])

  useEffect(() => {
    const handleForceLogout = () => {
      clearSession()
    }
    window.addEventListener('auth:logout', handleForceLogout)
    return () => {
      window.removeEventListener('auth:logout', handleForceLogout)
    }
  }, [clearSession])

  useEffect(() => {
    const session = loadAuthSession()
    if (!session) {
      setIsLoadingSession(false)
      return
    }

    ;(async () => {
      try {
        applySession(session.user)

        const currentUser = await getMe()
        if (!currentUser) {
          throw new Error('Session is not valid')
        }

        applySession(currentUser)
      } catch {
        try {
          const refreshed = await refreshSessionRequest()
          if (!refreshed.user) {
            throw new Error('Session refresh failed.')
          }

          applySession(refreshed.user)
        } catch {
          clearSession()
        }
      } finally {
        setIsLoadingSession(false)
      }
    })()
  }, [applySession, clearSession])

  const login = useCallback(async ({ username, password, tenantId = null, allowedRoles = [] }) => {
    setIsLoggingIn(true)
    setAuthError('')

    try {
      const result = await loginRequest(username, password, tenantId)
      if (!result.user) {
        throw new Error('Login response is missing user data')
      }

      const role = typeof result.user.role === 'string' ? result.user.role : ''
      if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        throw new Error(
          `This form allows ${allowedRoles.map(roleLabel).join(' / ')} login. ` +
            `You signed in as ${roleLabel(role)}.`,
        )
      }

      applySession(result.user)

      return result.user
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      setAuthError(message)
      return null
    } finally {
      setIsLoggingIn(false)
    }
  }, [applySession])

  const logout = useCallback(async () => {
    const hasUser = user !== null

    setAuthError('')

    try {
      if (hasUser) {
        await logoutRequest()
      }
    } catch {
      // Clear local session regardless of server-side logout response.
    } finally {
      clearSession()
    }
  }, [clearSession, user])

  const createFirstPlatformAdmin = useCallback(async ({ username, password }) => {
    setIsBootstrapping(true)
    setAuthError('')

    try {
      await bootstrapPlatformAdmin(username, password)
      return true
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Bootstrap failed')
      return false
    } finally {
      setIsBootstrapping(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setAuthError('')
  }, [])

  const isAuthenticated = useMemo(() => user !== null, [user])

  return {
    user,
    authError,
    isAuthenticated,
    isLoadingSession,
    isLoggingIn,
    isBootstrapping,
    login,
    logout,
    clearError,
    createFirstPlatformAdmin,
  }
}
