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

export async function createStaffUser({ email, password, role }) {
  try {
    const response = await apiClient.post('/tenant/users', {
      email,
      password,
      role,
    })

    return response.data?.user ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Staff user creation failed'))
  }
}
