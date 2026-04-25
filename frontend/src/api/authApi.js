import apiClient from './apiClient'
import { getErrorMessage } from './httpUtils'

function normalizeAuthResponse(data) {
  return {
    accessToken: typeof data?.access_token === 'string' ? data.access_token : '',
    refreshToken: typeof data?.refresh_token === 'string' ? data.refresh_token : '',
    expiresIn: Number.isFinite(data?.expires_in) ? data.expires_in : 0,
    refreshExpiresIn: Number.isFinite(data?.refresh_expires_in) ? data.refresh_expires_in : 0,
    user: data?.user ?? null,
  }
}

export async function login(username, password, tenantId = null) {
  try {
    const payload = { username, password };
    if (tenantId) payload.tenant_id = tenantId;
    const response = await apiClient.post('/auth/login', payload)
    return normalizeAuthResponse(response.data)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Login failed'))
  }
}

export async function refreshSession() {
  try {
    const response = await apiClient.post('/auth/refresh')
    return normalizeAuthResponse(response.data)
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Session refresh failed'))
  }
}

export async function logout() {
  try {
    await apiClient.post('/auth/logout')
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Logout failed'))
  }
}

export async function getMe() {
  try {
    const response = await apiClient.get('/auth/me')
    return response.data?.user ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to load current user'))
  }
}

export async function bootstrapPlatformAdmin(username, password) {
  try {
    const response = await apiClient.post('/auth/bootstrap-admin', { username, password })
    return response.data?.user ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to create platform admin'))
  }
}
