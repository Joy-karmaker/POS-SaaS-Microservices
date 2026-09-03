import apiClient from './apiClient'

export async function createOrder(payload) {
  const { data } = await apiClient.post('/order/orders', payload)
  return data
}

export async function getOrders(params = {}) {
  const { data } = await apiClient.get('/order/orders', { params })
  return data
}

export async function getOrder(id) {
  const { data } = await apiClient.get(`/order/orders/${id}`)
  return data
}

export async function cancelOrder(id) {
  const { data } = await apiClient.post(`/order/orders/${id}/cancel`)
  return data
}
