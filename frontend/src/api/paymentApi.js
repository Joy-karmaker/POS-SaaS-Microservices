import apiClient from './apiClient'

export async function initiatePayment(payload) {
  const { data } = await apiClient.post('/payment/payments/initiate', payload)
  return data
}

export async function verifyPayment(payload) {
  const { data } = await apiClient.post('/payment/payments/verify', payload)
  return data
}

export async function getPayment(id) {
  const { data } = await apiClient.get(`/payment/payments/${id}`)
  return data
}

export async function createPayment(payload) {
  const { data } = await apiClient.post('/payment/payments', payload)
  return data
}

export async function getPayments() {
  const { data } = await apiClient.get('/payment/payments')
  return data
}
