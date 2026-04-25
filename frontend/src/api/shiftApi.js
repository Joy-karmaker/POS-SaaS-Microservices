import apiClient from './apiClient'
import { getErrorMessage } from './httpUtils'

function normalizeBalance(value) {
  const trimmed = String(value ?? '').trim()
  if (trimmed === '') {
    return undefined
  }

  const numeric = Number(trimmed)
  return Number.isFinite(numeric) ? numeric : undefined
}

export async function getCurrentShift(storeId) {
  try {
    const response = await apiClient.get('/tenant/shifts/current', {
      params: { store_id: storeId },
    })

    return response.data?.shift ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to load current shift'))
  }
}

export async function openShift({ storeId, openingBalance }) {
  const payload = {
    store_id: storeId,
  }

  const normalizedOpening = normalizeBalance(openingBalance)
  if (normalizedOpening !== undefined) {
    payload.opening_balance = normalizedOpening
  }

  try {
    const response = await apiClient.post('/tenant/shifts/open', payload)
    return response.data?.shift ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to open shift'))
  }
}

export async function closeShift({ storeId, closingBalance }) {
  const payload = {
    store_id: storeId,
  }

  const normalizedClosing = normalizeBalance(closingBalance)
  if (normalizedClosing !== undefined) {
    payload.closing_balance = normalizedClosing
  }

  try {
    const response = await apiClient.post('/tenant/shifts/close', payload)
    return response.data?.shift ?? null
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to close shift'))
  }
}
