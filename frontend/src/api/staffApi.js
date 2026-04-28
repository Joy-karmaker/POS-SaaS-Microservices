import apiClient from './apiClient'
import { getErrorMessage } from './httpUtils'

export async function getStaffUsers() {
  try {
    const response = await apiClient.get('/tenant/users')
    return Array.isArray(response.data?.users) ? response.data.users : []
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to load staff users'))
  }
}

export async function getStaffRoles() {
  try {
    const response = await apiClient.get('/tenant/users/roles')
    return Array.isArray(response.data?.roles) ? response.data.roles : []
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to load staff roles'))
  }
}

export async function getTenantProfile() {
  try {
    const response = await apiClient.get('/tenant/users/me')
    return response.data?.profile ?? null
  } catch (error) {
    console.error('Failed to load tenant profile:', error)
    return null
  }
}

export async function createStaffUser({ username, full_name, store_id, role_id, password }) {
  try {
    const response = await apiClient.post('/tenant/users', {
      username,
      full_name,
      store_id,
      role_id,
      password,
    })

    return response.data?.user ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Staff user creation failed'))
  }
}
