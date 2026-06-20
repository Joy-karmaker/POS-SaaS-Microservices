import apiClient from './apiClient'

export async function getCategories(params = {}) {
  const query = new URLSearchParams(params).toString()
  const url = query ? `/catalog/categories?${query}` : '/catalog/categories'
  const { data } = await apiClient.get(url)
  return data
}

export async function createCategory(payload) {
  const { data } = await apiClient.post('/catalog/categories', payload)
  return data
}

export async function updateCategory(id, payload) {
  const { data } = await apiClient.patch(`/catalog/categories/${id}`, payload)
  return data
}

export async function deleteCategory(id) {
  const { data } = await apiClient.delete(`/catalog/categories/${id}`)
  return data
}

export async function getProducts(params = {}) {
  const query = new URLSearchParams(params).toString()
  const url = query ? `/catalog/products?${query}` : '/catalog/products'
  const { data } = await apiClient.get(url)
  return data
}

export async function getProductSearchIndex() {
  const { data } = await apiClient.get('/catalog/products/search-index')
  return data
}

export async function createProduct(payload) {
  const { data } = await apiClient.post('/catalog/products', payload)
  return data
}

export async function updateProduct(id, payload) {
  const { data } = await apiClient.patch(`/catalog/products/${id}`, payload)
  return data
}

export async function deleteProduct(id) {
  const { data } = await apiClient.delete(`/catalog/products/${id}`)
  return data
}

export async function adjustStock(productId, quantityChange) {
  const { data } = await apiClient.post('/catalog/inventory/adjust', {
    product_id: productId,
    quantity_change: quantityChange
  })
  return data
}

