import apiClient from './apiClient'

export async function createPayment(payload) {
  const { data } = await apiClient.post('/payment/payments', payload)
  return data
}

export async function getPayments() {
  const { data } = await apiClient.get('/payment/payments')
  return data
}
