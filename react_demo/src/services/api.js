import axios from 'axios'

// 开发环境
const API_BASE_URL = 'http://47.108.117.7:8000/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const storage = localStorage.getItem('user-storage')
    console.log('[API] Request to:', config.url)
    if (storage) {
      try {
        const parsed = JSON.parse(storage)
        const token = parsed?.state?.token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
          console.log('[API] Token添加成功, 前20字符:', token.substring(0, 20) + '...')
        } else {
          console.log('[API] 警告: storage存在但token为空', parsed?.state)
        }
      } catch (e) {
        console.error('[API] 解析storage失败:', e)
      }
    } else {
      console.log('[API] 警告: localStorage中没有user-storage')
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
        'auth/profile', // Profile fetch might fail if token expired
        'summary',     // Summary API
        'innovation-dynamics'  // Innovation Dynamics has role check
      ]

      const shouldSkipRedirect = noRedirectUrls.some(path => url.includes(path))

      if (!shouldSkipRedirect) {
        localStorage.removeItem('user-storage')
        window.location.href = '/login'
      }
    }
    if (error.response?.status === 403) {
      const url = error.config?.url || ''
      const urlLower = url.toLowerCase()

      // 判断是否是创新动态相关的请求
      if (urlLower.includes('innovation-dynamics')) {
        console.error('[API] 权限不足: 创新动态仅政府用户可访问')
      } else {
        console.error('[API] 权限不足:', error.response.data?.detail || '没有访问权限')
      }
      // 可以选择是否重定向，目前由页面组件自行处理显示
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

// Summary API (需要更长的超时时间，因为AI处理需要时间)
export const summaryAPI = {
  getConversationSummary: (conversationId) => api.get(`/summary/conversations/${conversationId}`, { timeout: 60000 })
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

// Research Demands API
export const researchDemandsAPI = {
  getDemands: (params) => api.get('/research-demands', { params }),
  getDemand: (id) => api.get(`/research-demands/${id}`),
  createDemand: (data) => api.post('/research-demands', data),
  updateDemand: (id, data) => api.put(`/research-demands/${id}`, data),
  deleteDemand: (id) => api.delete(`/research-demands/${id}`),
  getMyDemands: () => api.get('/research-demands/my'),
  getStats: () => api.get('/research-demands/stats/summary')
}

// Technical Barriers API
export const technicalBarriersAPI = {
  getBarriers: (params) => api.get('/technical-barriers', { params }),
  getBarrier: (id) => api.get(`/technical-barriers/${id}`),
  createBarrier: (data) => api.post('/technical-barriers', data),
  updateBarrier: (id, data) => api.put(`/technical-barriers/${id}`, data),
  deleteBarrier: (id) => api.delete(`/technical-barriers/${id}`),
  getMyBarriers: () => api.get('/technical-barriers/my'),
  getStats: () => api.get('/technical-barriers/stats/summary')
}

// Research Achievements API
export const researchAchievementsAPI = {
  getAchievements: (params) => api.get('/research-achievements', { params }),
  getAchievement: (id) => api.get(`/research-achievements/${id}`),
  createAchievement: (data) => api.post('/research-achievements', data),
  updateAchievement: (id, data) => api.put(`/research-achievements/${id}`, data),
  deleteAchievement: (id) => api.delete(`/research-achievements/${id}`),
  getMyAchievements: () => api.get('/research-achievements/my'),
  getStats: () => api.get('/research-achievements/stats/summary')
}

// Cooperation Projects API
export const cooperationProjectsAPI = {
  getProjects: (params) => api.get('/cooperation-projects', { params }),
  getProject: (id) => api.get(`/cooperation-projects/${id}`),
  createProject: (data) => api.post('/cooperation-projects', data),
  updateProject: (id, data) => api.put(`/cooperation-projects/${id}`, data),
  deleteProject: (id) => api.delete(`/cooperation-projects/${id}`),
  getStats: () => api.get('/cooperation-projects/stats/summary')
}

// Inquiry Records API
export const inquiryRecordsAPI = {
  getInquiries: (params) => api.get('/inquiry-records', { params }),
  getInquiry: (id) => api.get(`/inquiry-records/${id}`),
  createInquiry: (data) => api.post('/inquiry-records', data),
  updateInquiry: (id, data) => api.put(`/inquiry-records/${id}`, data),
  deleteInquiry: (id) => api.delete(`/inquiry-records/${id}`),
  getStats: () => api.get('/inquiry-records/stats/summary')
}

// Innovation Dynamics API
export const innovationDynamicsAPI = {
  getDynamics: (params) => api.get('/innovation-dynamics', { params }),
  getDynamic: (id) => api.get(`/innovation-dynamics/${id}`),
  createDynamic: (data) => api.post('/innovation-dynamics', data),
  updateDynamic: (id, data) => api.put(`/innovation-dynamics/${id}`, data),
  deleteDynamic: (id) => api.delete(`/innovation-dynamics/${id}`),
  getStats: () => api.get('/innovation-dynamics/stats/summary')
}

// WebSocket helper
export const createWebSocket = (token) => {
  const wsUrl = `ws://47.108.117.7:8000/ws?token=${token}`
  return new WebSocket(wsUrl)
}

export default api
