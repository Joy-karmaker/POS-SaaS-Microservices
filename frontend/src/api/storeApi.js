import apiClient from './apiClient'
import { getErrorMessage } from './httpUtils'

export async function getStores(tenantId = '') {
  try {
    const response = await apiClient.get('/tenant/stores', {
      params: tenantId.trim() !== '' ? { tenant_id: tenantId.trim() } : undefined,
    })

    return Array.isArray(response.data?.stores) ? response.data.stores : []
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to load stores'))
  }
}

export async function createStore(payload) {
  try {
    const response = await apiClient.post('/tenant/stores', payload)
    return response.data?.store
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Store creation failed'))
  }
}
