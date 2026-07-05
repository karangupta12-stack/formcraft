import axios from 'axios'

// const api = axios.create({
//   baseURL: '/api',
//   headers: { 'Content-Type': 'application/json' },
// })
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})
  
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('fc_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('fc_token')
      localStorage.removeItem('fc_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       d => api.post('/auth/register/', d),
  login:          d => api.post('/auth/login/', d),
  me:             () => api.get('/auth/me/'),
  changePassword: d => api.post('/auth/change-password/', d),
}

// ── Forms ─────────────────────────────────────────────────────────────────────
export const formsAPI = {
  list:           ()           => api.get('/forms/'),
  create:         d            => api.post('/forms/create/', d),
  get:            slug         => api.get(`/forms/${slug}/`),
  update:         (slug, d)    => api.patch(`/forms/${slug}/`, d),
  remove:         slug         => api.delete(`/forms/${slug}/`),
  duplicate:      slug         => api.post(`/forms/${slug}/duplicate/`),
  updateSettings: (slug, d)    => api.patch(`/forms/${slug}/settings/`, d),
  updateBranding: (slug, d)    => api.patch(`/forms/${slug}/branding/`, d, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getQR:          slug         => api.get(`/forms/${slug}/qr/`),
  getEmbed:       slug         => api.get(`/forms/${slug}/embed/`),
  getPublic:      slug         => api.get(`/forms/public/${slug}/`),
}

// ── Responses ─────────────────────────────────────────────────────────────────
export const responsesAPI = {
  uploadFile:   d            => api.post('/responses/upload/', d, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  submit:       d            => api.post('/responses/submit/', d),
  trackSession: d            => api.post('/responses/session/', d),
  list:         slug         => api.get(`/responses/${slug}/`),
  edit:         (slug, pk, d) => api.patch(`/responses/${slug}/${pk}/edit/`, d),
  deleteOne:    (slug, pk)   => api.delete(`/responses/${slug}/${pk}/delete/`),
  clearAll:     slug         => api.delete(`/responses/${slug}/clear/`),
  exportExcel:  slug         => api.get(`/responses/${slug}/export/`, { responseType: 'blob' }),
  exportCSV:    slug         => api.get(`/responses/${slug}/export/csv/`, { responseType: 'blob' }),
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  recordView: d    => api.post('/analytics/view/', d),
  getSummary: slug => api.get(`/analytics/${slug}/summary/`),
  resetViews: slug => api.delete(`/analytics/${slug}/reset-views/`),
}

export default api
