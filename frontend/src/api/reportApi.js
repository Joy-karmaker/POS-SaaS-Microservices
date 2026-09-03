import apiClient from './apiClient'

export async function getReportSummary() {
  const { data } = await apiClient.get('/reports/reports/summary')
  return data
}

export async function getDailySales(date) {
  const { data } = await apiClient.get('/reports/reports/daily-sales', {
    params: date ? { date } : {},
  })
  return data
}
