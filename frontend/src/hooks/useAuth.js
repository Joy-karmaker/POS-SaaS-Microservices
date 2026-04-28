import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  bootstrapPlatformAdmin,
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession as refreshSessionRequest,
} from '../api/authApi'
import { getTenantProfile } from '../api/staffApi'
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
  const [tenantProfile, setTenantProfile] = useState(null)
  const [authError, setAuthError] = useState('')
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isBootstrapping, setIsBootstrapping] = useState(false)

  const clearSession = useCallback(() => {
    setUser(null)
    setTenantProfile(null)
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

  const fetchProfile = useCallback(async () => {
    try {
      const p = await getTenantProfile()
      setTenantProfile(p)
      return p
    } catch {
      setTenantProfile(null)
      return null
    }
  }, [])

  useEffect(() => {
    const session = loadAuthSession()
    if (!session) {
      setIsLoadingSession(false)
      return
    }

    ;(async () => {
      try {
        applySession(session.user)
        
        // Load tenant profile if user is in tenant scope
        if (session.user.role !== 'platform_admin') {
          await fetchProfile()
        }

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
          if (refreshed.user.role !== 'platform_admin') {
            await fetchProfile()
          }
        } catch {
          clearSession()
        }
      } finally {
        setIsLoadingSession(false)
      }
    })()
  }, [applySession, clearSession, fetchProfile])

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
      
      // Fetch profile immediately after login for tenant users
      if (role !== 'platform_admin') {
        await fetchProfile()
      }

      return result.user
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      setAuthError(message)
      return null
    } finally {
      setIsLoggingIn(false)
    }
  }, [applySession, fetchProfile])

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
    tenantProfile,
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
