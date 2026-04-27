import apiClient from './apiClient'
import { getErrorMessage } from './httpUtils'

export async function getTenants() {
  try {
    const response = await apiClient.get('/tenant/tenants')
    return Array.isArray(response.data?.tenants) ? response.data.tenants : []
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to load tenants'))
  }
}

export async function createTenant(name, owner_password) {
  try {
    const response = await apiClient.post('/tenant/tenants', { name, owner_password })
    return response.data?.tenant
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Tenant creation failed'))
  }
}
