import { useCallback, useEffect, useState } from 'react'
import apiClient from '../api/apiClient'
import { getErrorMessage, getResponseMessage } from '../api/httpUtils'

const HEALTH_ENDPOINTS = [
  { label: 'API Gateway', path: '/health' },
  { label: 'Tenant Service', path: '/tenant/health' },
]

export function useServiceHealth() {
  const [healthItems, setHealthItems] = useState([])
  const [isCheckingHealth, setIsCheckingHealth] = useState(false)

  const checkHealth = useCallback(async (endpoint) => {
    const startedAt = performance.now()

    try {
      const response = await apiClient.get(endpoint.path, {
        validateStatus: () => true,
      })

      return {
        ...endpoint,
        status: response.status >= 200 && response.status < 300 ? 'ok' : 'error',
        latency: Math.round(performance.now() - startedAt),
        message: getResponseMessage(response, response.statusText),
      }
    } catch (error) {
      return {
        ...endpoint,
        status: 'offline',
        latency: null,
        message: getErrorMessage(error, 'Network error'),
      }
    }
  }, [])

  const refreshHealth = useCallback(async () => {
    setIsCheckingHealth(true)
    const results = await Promise.all(HEALTH_ENDPOINTS.map(checkHealth))
    setHealthItems(results)
    setIsCheckingHealth(false)
  }, [checkHealth])

  useEffect(() => {
    refreshHealth()
  }, [refreshHealth])

  return {
    healthItems,
    isCheckingHealth,
    refreshHealth,
  }
}
