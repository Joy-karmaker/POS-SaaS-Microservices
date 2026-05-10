import apiClient from './apiClient'

export async function getCategories() {
  const { data } = await apiClient.get('/catalog/categories')
  return data
}

export async function createCategory(payload) {
  const { data } = await apiClient.post('/catalog/categories', payload)
  return data
}

export async function getProducts() {
  const { data } = await apiClient.get('/catalog/products')
  return data
}

export async function createProduct(payload) {
  const { data } = await apiClient.post('/catalog/products', payload)
  return data
}
