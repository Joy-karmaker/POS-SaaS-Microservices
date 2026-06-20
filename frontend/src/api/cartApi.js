import apiClient from './apiClient'

export async function createCart() {
  const { data } = await apiClient.post('/cart')
  return data
}

export async function getCart(cartId) {
  const { data } = await apiClient.get(`/cart/${cartId}`)
  return data
}

export async function addToCart(cartId, productId, quantity) {
  const { data } = await apiClient.post(`/cart/${cartId}/items`, {
    product_id: productId,
    quantity
  })
  return data
}

export async function updateCartItem(cartId, productId, quantity) {
  const { data } = await apiClient.patch(`/cart/${cartId}/items/${productId}`, {
    quantity
  })
  return data
}

export async function removeFromCart(cartId, productId) {
  const { data } = await apiClient.delete(`/cart/${cartId}/items/${productId}`)
  return data
}

export async function clearCart(cartId) {
  const { data } = await apiClient.delete(`/cart/${cartId}`)
  return data
}

export async function calculatePricing(payload) {
  const { data } = await apiClient.post('/pricing/calculate', payload)
  return data
}
