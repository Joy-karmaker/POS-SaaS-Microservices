import { useCallback, useEffect, useMemo, useState } from 'react'
import { createStore, getStores } from '../api/storeApi'
import { getErrorMessage } from '../api/httpUtils'

export function useStores({ enabled = true, tenantId = '' } = {}) {
  const [storeName, setStoreName] = useState('')
  const [storeCode, setStoreCode] = useState('')
  const [stores, setStores] = useState([])
  const [storeError, setStoreError] = useState('')
  const [isLoadingStores, setIsLoadingStores] = useState(false)
  const [isCreatingStore, setIsCreatingStore] = useState(false)

  const refreshStores = useCallback(async () => {
    if (!enabled) {
      setStores([])
      return []
    }

    setIsLoadingStores(true)
    setStoreError('')

    try {
      const rows = await getStores(tenantId)
      setStores(rows)
      return rows
    } catch (error) {
      setStoreError(getErrorMessage(error, 'Failed to load stores'))
      setStores([])
      return []
    } finally {
      setIsLoadingStores(false)
    }
  }, [enabled, tenantId])

  useEffect(() => {
    refreshStores()
  }, [refreshStores])

  const canCreateStore = useMemo(() => {
    return enabled && storeName.trim().length >= 2 && !isCreatingStore
  }, [enabled, isCreatingStore, storeName])

  const submitStore = useCallback(async () => {
    if (!canCreateStore) {
      return null
    }

    setIsCreatingStore(true)
    setStoreError('')

    try {
      const payload = {
        name: storeName.trim(),
      }

      if (storeCode.trim() !== '') {
        payload.code = storeCode.trim()
      }

      const created = await createStore(payload)
      if (!created) {
        throw new Error('Store creation returned empty response')
      }

      setStores((current) => [created, ...current])
      setStoreName('')
      setStoreCode('')
      return created
    } catch (error) {
      setStoreError(getErrorMessage(error, 'Store creation failed'))
      return null
    } finally {
      setIsCreatingStore(false)
    }
  }, [canCreateStore, storeCode, storeName])

  return {
    storeName,
    setStoreName,
    storeCode,
    setStoreCode,
    stores,
    storeError,
    isLoadingStores,
    isCreatingStore,
    canCreateStore,
    refreshStores,
    submitStore,
  }
}
