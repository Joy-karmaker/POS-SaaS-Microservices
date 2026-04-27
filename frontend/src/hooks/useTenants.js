import { useCallback, useEffect, useMemo, useState } from 'react'
import { createTenant, getTenants } from '../api/tenantApi'

function getErrorMessage(error, fallback = 'Unknown error') {
  return error instanceof Error ? error.message : fallback
}

export function useTenants({ enabled = true } = {}) {
  const [tenantName, setTenantName] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')
  const [recentTenants, setRecentTenants] = useState([])
  const [tenantError, setTenantError] = useState('')
  const [isCreatingTenant, setIsCreatingTenant] = useState(false)
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)

  const canCreateTenant = useMemo(() => {
    return enabled && 
      tenantName.trim().length >= 2 && 
      ownerPassword.length >= 8 &&
      !isCreatingTenant
  }, [enabled, tenantName, ownerPassword, isCreatingTenant])

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
    setOwnerPassword('')
    setTenantError('')
  }, [enabled, loadTenants])

  const submitTenant = useCallback(async () => {
    if (!canCreateTenant) {
      return false
    }

    setIsCreatingTenant(true)
    setTenantError('')

    try {
      const tenant = await createTenant(tenantName.trim(), ownerPassword)
      setRecentTenants((current) => [tenant, ...current].slice(0, 5))
      setTenantName('')
      setOwnerPassword('')
      return true
    } catch (error) {
      setTenantError(getErrorMessage(error))
      return false
    } finally {
      setIsCreatingTenant(false)
    }
  }, [canCreateTenant, tenantName, ownerPassword])

  return {
    tenantName,
    setTenantName,
    ownerPassword,
    setOwnerPassword,
    recentTenants,
    tenantError,
    isCreatingTenant,
    isLoadingTenants,
    canCreateTenant,
    loadTenants,
    submitTenant,
  }
}
