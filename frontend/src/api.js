import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const getExpenses = (params) => api.get('/expenses', { params })
export const createExpense = (data) => api.post('/expenses', data)
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data)
export const deleteExpense = (id) => api.delete(`/expenses/${id}`)

export const getCategories = () => api.get('/categories')
export const createCategory = (data) => api.post('/categories', data)
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data)

export const getDashboard = (month, year) =>
  api.get('/dashboard', { params: { month, year } })

export const gmailSync = (expenses) =>
  api.post('/gmail/sync', { expenses })

export default api
