import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const storage = localStorage.getItem('user-storage')
    if (storage) {
      try {
        const parsed = JSON.parse(storage)
        const token = parsed?.state?.token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
          // Debug: 只在customer-service请求时打印
          if (config.url?.includes('customer-service')) {
            console.log('[API] Token已添加到请求头')
          }
        } else {
          if (config.url?.includes('customer-service')) {
            console.log('[API] 警告: storage存在但token为空', parsed?.state)
          }
        }
      } catch (e) {
        console.error('[API] 解析storage失败:', e)
      }
    } else {
      if (config.url?.includes('customer-service')) {
        console.log('[API] 警告: localStorage中没有user-storage')
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      // List of URLs that should NOT trigger a login redirect on 401
      // These endpoints either handle auth optionally or manage errors themselves
      const noRedirectUrls = [
        'customer-service',
        'chat',
        'knowledge',
        'resources',  // Resources has both public and auth modes
        'jobs',       // Jobs has both public and auth modes
        'auth/profile' // Profile fetch might fail if token expired
      ]

      const shouldSkipRedirect = noRedirectUrls.some(path => url.includes(path))

      if (!shouldSkipRedirect) {
        localStorage.removeItem('user-storage')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth APIs
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data)
}

// Jobs APIs
export const jobsAPI = {
  getJobs: (params) => api.get('/jobs', { params }),
  getJob: (id) => api.get(`/jobs/${id}`),
  createJob: (data) => api.post('/jobs', data),
  updateJob: (id, data) => api.put(`/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
  getMyJobs: () => api.get('/jobs/my')
}

// Resources APIs
export const resourcesAPI = {
  getResources: (params) => api.get('/resources', { params }),
  getResource: (id) => api.get(`/resources/${id}`),
  createResource: (data) => api.post('/resources', data),
  updateResource: (id, data) => api.put(`/resources/${id}`, data),
  deleteResource: (id) => api.delete(`/resources/${id}`),
  getMyResources: () => api.get('/resources/my')
}

// Chat APIs
export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (conversationId, params = {}) => api.get(`/chat/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId, data) => api.post(`/chat/conversations/${conversationId}/messages`, data),
  createConversation: (data) => api.post('/chat/conversations', data),
  getOrCreateConversation: (targetUserId, jobId, resourceId = null) => api.post('/chat/conversations/get-or-create', { targetUserId, jobId, resourceId })
}

// Customer Service API
export const customerServiceAPI = {
  sendMessage: (message) => api.post('/customer-service/chat', { message }),
  getHistory: () => api.get('/customer-service/history'),
  clearHistory: () => api.delete('/customer-service/history'),
  getContextStatus: () => api.get('/customer-service/context-status'),
  getSlots: () => api.get('/customer-service/slots')
}

// Summary API
export const summaryAPI = {
  getConversationSummary: (conversationId) => api.get(`/summary/conversations/${conversationId}`)
}

// Knowledge API
export const knowledgeAPI = {
  getKnowledge: (params) => api.get('/knowledge', { params }),
  getKnowledgeItem: (id) => api.get(`/knowledge/${id}`),
  createKnowledge: (data) => api.post('/knowledge', data),
  updateKnowledge: (id, data) => api.put(`/knowledge/${id}`, data),
  deleteKnowledge: (id) => api.delete(`/knowledge/${id}`),
  getStats: () => api.get('/knowledge/stats'),
  getCategories: () => api.get('/knowledge/categories')
}

// WebSocket helper
export const createWebSocket = (token) => {
  const wsUrl = `ws://localhost:8000/ws?token=${token}`
  return new WebSocket(wsUrl)
}

export default api
