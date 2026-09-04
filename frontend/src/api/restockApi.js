import apiClient from './apiClient'

export async function createRestockOrder(payload) {
  const { data } = await apiClient.post('/catalog/restock', payload)
  return data
}

export async function getRestockOrders(params = {}) {
  const { data } = await apiClient.get('/catalog/restock', { params })
  return data
}

export async function getRestockOrder(id) {
  const { data } = await apiClient.get(`/catalog/restock/${id}`)
  return data
}

export async function dispatchRestockOrder(id) {
  const { data } = await apiClient.post(`/catalog/restock/${id}/dispatch`)
  return data
}

export async function receiveRestockOrder(id) {
  const { data } = await apiClient.post(`/catalog/restock/${id}/receive`)
  return data
}

export async function cancelRestockOrder(id) {
  const { data } = await apiClient.post(`/catalog/restock/${id}/cancel`)
  return data
}

export async function markRestockOrderPaid(id, payload = {}) {
  const { data } = await apiClient.post(`/catalog/restock/${id}/mark-paid`, payload)
  return data
}
