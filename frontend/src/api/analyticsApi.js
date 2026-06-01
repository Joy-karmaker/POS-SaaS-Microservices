import apiClient from './apiClient'

/**
 * Fetches the overview dashboard analytics stats.
 */
export async function getAnalyticsSummary() {
  const { data } = await apiClient.get('/catalog/analytics/summary')
  return data
}

/**
 * Fetches the paginated forecasting list ordered by urgency.
 */
export async function getForecastList(params = {}) {
  const query = new URLSearchParams(params).toString()
  const url = query ? `/catalog/analytics/forecast?${query}` : '/catalog/analytics/forecast'
  const { data } = await apiClient.get(url)
  return data
}

/**
 * Triggers random historical sales seeding (simulation).
 */
export async function seedSimulationSales(count = 1000) {
  const { data } = await apiClient.post('/catalog/analytics/seed-sales', { count })
  return data
}

/**
 * Manually requests a full system-wide recalculation of forecasting metrics.
 */
export async function recalculateAnalytics() {
  const { data } = await apiClient.post('/catalog/analytics/recalculate')
  return data
}
