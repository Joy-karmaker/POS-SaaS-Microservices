import { useCallback, useEffect, useMemo, useState } from 'react'
import { createTenant, getTenants } from '../api/tenantApi'

function getErrorMessage(error, fallback = 'Unknown error') {
  return error instanceof Error ? error.message : fallback
}

export function useTenants({ enabled = true } = {}) {
  const [tenantName, setTenantName] = useState('')
  const [recentTenants, setRecentTenants] = useState([])
  const [tenantError, setTenantError] = useState('')
  const [isCreatingTenant, setIsCreatingTenant] = useState(false)
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)

  const canCreateTenant = useMemo(() => {
    return enabled && tenantName.trim().length >= 2 && !isCreatingTenant
  }, [enabled, tenantName, isCreatingTenant])

  const loadTenants = useCallback(async () => {
    if (!enabled) {
      setRecentTenants([])
      setTenantError('')
      setIsLoadingTenants(false)
      return
    }

    setIsLoadingTenants(true)
    setTenantError('')

    try {
      const tenants = await getTenants()
      setRecentTenants(tenants.slice(0, 5))
    } catch (error) {
      setTenantError(getErrorMessage(error, 'Failed to load tenants'))
    } finally {
      setIsLoadingTenants(false)
    }
  }, [enabled])

  useEffect(() => {
    if (enabled) {
      loadTenants()
      return
    }

    setRecentTenants([])
    setTenantName('')
    setTenantError('')
  }, [enabled, loadTenants])

  const submitTenant = useCallback(async () => {
    if (!canCreateTenant) {
      return false
    }

    setIsCreatingTenant(true)
    setTenantError('')

    try {
      const tenant = await createTenant(tenantName.trim())
      setRecentTenants((current) => [tenant, ...current].slice(0, 5))
      setTenantName('')
      return true
    } catch (error) {
      setTenantError(getErrorMessage(error))
      return false
    } finally {
      setIsCreatingTenant(false)
    }
  }, [canCreateTenant, tenantName])

  return {
    tenantName,
    setTenantName,
    recentTenants,
    tenantError,
    isCreatingTenant,
    isLoadingTenants,
    canCreateTenant,
    loadTenants,
    submitTenant,
  }
}
