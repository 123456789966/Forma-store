import axios from 'axios'

// Base API instance
const api = axios.create({
  baseURL: '/api',  // proxied to http://localhost:5000/api via vite.config.js
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  addAddress: (data) => api.post('/auth/add-address', data),
  deleteAddress: (id) => api.delete(`/auth/address/${id}`),
}

// ─── Products ─────────────────────────────────────────────────────────────────
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
  getSuggestions: (q) => api.get('/products/search/suggestions', { params: { q } }),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  addReview: (id, data) => api.post(`/products/${id}/reviews`, data),
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export const cartAPI = {
  get: () => api.get('/cart'),
  add: (productId, qty) => api.post('/cart/add', { productId, qty }),
  update: (productId, qty) => api.put('/cart/update', { productId, qty }),
  remove: (productId) => api.delete(`/cart/remove/${productId}`),
  clear: () => api.delete('/cart/clear'),
  applyCoupon: (code) => api.post('/cart/coupon', { code }),
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.put(`/orders/${id}/cancel`),
}

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentAPI = {
  createIntent: (orderId) => api.post('/payments/create-payment-intent', { orderId }),
  confirm: (paymentIntentId, orderId) => api.post('/payments/confirm', { paymentIntentId, orderId }),
  refund: (orderId, reason) => api.post(`/payments/refund/${orderId}`, { reason }),
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getOrders: (params) => api.get('/admin/orders', { params }),
  updateOrderStatus: (id, data) => api.patch(`/admin/orders/${id}/status`, data),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  getInventory: (params) => api.get('/admin/inventory', { params }),
  updateStock: (id, data) => api.patch(`/admin/inventory/${id}`, data),
}

export default api