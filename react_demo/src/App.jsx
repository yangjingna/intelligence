import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Jobs, { JobForm } from './pages/Jobs'
import Chat from './pages/Chat'
import CustomerService from './pages/CustomerService'
import Knowledge, { KnowledgeForm } from './pages/Knowledge'
import Profile from './pages/Profile'
import { ResearchDemands, ResearchDemandForm, ResearchDemandDetail } from './pages/ResearchDemands'
import { TechnicalBarriers, TechnicalBarrierForm, TechnicalBarrierDetail } from './pages/TechnicalBarriers'
import { ResearchAchievements, ResearchAchievementForm, ResearchAchievementDetail } from './pages/ResearchAchievements'
import { CooperationProjects, CooperationProjectForm, CooperationProjectDetail } from './pages/CooperationProjects'
import { Inquiries, InquiryDetail } from './pages/Inquiries'
import { InnovationDynamics } from './pages/InnovationDynamics'
import Dashboard from './pages/Dashboard'
import useUserStore from './stores/userStore'
import useChatStore from './stores/chatStore'
import wsService from './services/websocket'

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, _hasHydrated } = useUserStore()

  // Wait for hydration to complete before checking auth
  if (!_hasHydrated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Global WebSocket message handler component
const GlobalMessageHandler = () => {
  const navigate = useNavigate()
  const { isAuthenticated, token } = useUserStore()
  const { updateOnlineStatus } = useChatStore()
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    if (!isAuthenticated || !token) return

    console.log('[Global] 设置全局WebSocket监听器')
    wsService.connect(token)

    const handleNewMessage = (message) => {
      console.log('[Global] 收到新消息:', message)
      // 显示通知
      const senderName = message.senderName || message.sender_name || '用户'
      const content = message.content?.substring(0, 50) || '新消息'
      setNotification({
        id: Date.now(),
        senderName,
        content,
        conversationId: message.conversationId || message.conversation_id,
        type: 'new_message'
      })

      // 5秒后自动隐藏
      setTimeout(() => {
        setNotification(null)
      }, 5000)
    }

    const handleOnlineStatus = ({ userId, isOnline }) => {
      console.log('[Global] 在线状态更新:', userId, isOnline)
      updateOnlineStatus(userId, isOnline)
    }

    const handleOnlineUsersList = ({ userIds }) => {
      console.log('[Global] 收到在线用户列表:', userIds)
      // 批量更新在线状态
      userIds.forEach(userId => {
        updateOnlineStatus(userId, true)
      })
    }

    const handleDemandPublished = (payload) => {
      console.log('[Global] 收到新研发需求:', payload)
      setNotification({
        id: Date.now(),
        title: '新研发需求',
        content: `企业 ${payload.enterprise_name} 发布了新需求: ${payload.title}`,
        type: 'demand_published',
        link: '/research-demands'
      })
      setTimeout(() => {
        setNotification(null)
      }, 5000)
    }

    const handleBarrierPublished = (payload) => {
      console.log('[Global] 收到新技术壁垒:', payload)
      setNotification({
        id: Date.now(),
        title: '新技术壁垒',
        content: `企业 ${payload.enterprise_name} 发布了新壁垒: ${payload.title}`,
        type: 'barrier_published',
        link: '/technical-barriers'
      })
      setTimeout(() => {
        setNotification(null)
      }, 5000)
    }

    const handleAchievementPublished = (payload) => {
      console.log('[Global] 收到新研发成果:', payload)
      setNotification({
        id: Date.now(),
        title: '新研发成果',
        content: `高校 ${payload.university_name} 发布了新成果: ${payload.title}`,
        type: 'achievement_published',
        link: '/research-achievements'
      })
      setTimeout(() => {
        setNotification(null)
      }, 5000)
    }

    const handleNewInquiry = (payload) => {
      console.log('[Global] 收到新咨询:', payload)
      setNotification({
        id: Date.now(),
        title: '新咨询',
        content: `${payload.inquirer_name} (${payload.inquirer_role}) 咨询了您`,
        type: 'new_inquiry',
        link: '/inquiry-records'
      })
      setTimeout(() => {
        setNotification(null)
      }, 5000)
    }

    const handleProjectSigned = (payload) => {
      console.log('[Global] 项目签约:', payload)
      setNotification({
        id: Date.now(),
        title: '项目签约',
        content: `项目 ${payload.title} 已签约`,
        type: 'project_signed',
        link: '/cooperation-projects'
      })
      setTimeout(() => {
        setNotification(null)
      }, 5000)
    }

    const handleProjectCompleted = (payload) => {
      console.log('[Global] 项目完成:', payload)
      setNotification({
        id: Date.now(),
        title: '项目完成',
        content: `项目 ${payload.title} 已完成`,
        type: 'project_completed',
        link: '/cooperation-projects'
      })
      setTimeout(() => {
        setNotification(null)
      }, 5000)
    }

    wsService.on('new_message', handleNewMessage)
    wsService.on('online_status', handleOnlineStatus)
    wsService.on('online_users_list', handleOnlineUsersList)
    wsService.on('demand_published', handleDemandPublished)
    wsService.on('barrier_published', handleBarrierPublished)
    wsService.on('achievement_published', handleAchievementPublished)
    wsService.on('new_inquiry', handleNewInquiry)
    wsService.on('project_signed', handleProjectSigned)
    wsService.on('project_completed', handleProjectCompleted)

    return () => {
      wsService.off('new_message', handleNewMessage)
      wsService.off('online_status', handleOnlineStatus)
      wsService.off('online_users_list', handleOnlineUsersList)
      wsService.off('demand_published', handleDemandPublished)
      wsService.off('barrier_published', handleBarrierPublished)
      wsService.off('achievement_published', handleAchievementPublished)
      wsService.off('new_inquiry', handleNewInquiry)
      wsService.off('project_signed', handleProjectSigned)
      wsService.off('project_completed', handleProjectCompleted)
    }
  }, [isAuthenticated, token])

  const handleNotificationClick = () => {
    if (notification?.conversationId) {
      navigate('/chat')
    } else if (notification?.link) {
      navigate(notification.link)
    }
    setNotification(null)
  }

  if (!notification) return null

  return (
    <div
      onClick={handleNotificationClick}
      className="fixed top-20 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-blue-600 font-medium">
            {notification.title?.charAt(0) || 'N'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">{notification.title}</p>
          <p className="text-sm text-gray-500 truncate">{notification.content}</p>
          <p className="text-xs text-blue-500 mt-1">点击查看</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setNotification(null)
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// Enterprise only route wrapper
const EnterpriseRoute = ({ children }) => {
  const { isAuthenticated, user, isEnterprise, _hasHydrated } = useUserStore()

  // Wait for hydration to complete before checking auth
  if (!_hasHydrated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isEnterprise()) {
    return <Navigate to="/" replace />
  }

  return children
}

// University only route wrapper
const UniversityRoute = ({ children }) => {
  const { isAuthenticated, user, _hasHydrated } = useUserStore()

  if (!_hasHydrated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'university') {
    return <Navigate to="/" replace />
  }

  return children
}

// Government only route wrapper
const GovernmentRoute = ({ children }) => {
  const { isAuthenticated, user, isGovernment, _hasHydrated } = useUserStore()

  if (!_hasHydrated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isGovernment()) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <>
      <GlobalMessageHandler />
      <Routes>
        <Route path="/" element={<Layout />}>
        {/* Public routes */}
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="customer-service" element={<CustomerService />} />

        {/* Protected routes */}
        <Route
          path="chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Enterprise only routes */}
        <Route
          path="jobs/create"
          element={
            <EnterpriseRoute>
              <JobForm />
            </EnterpriseRoute>
          }
        />
        <Route
          path="jobs/edit/:id"
          element={
            <EnterpriseRoute>
              <JobForm />
            </EnterpriseRoute>
          }
        />
        <Route
          path="knowledge"
          element={
            <EnterpriseRoute>
              <Knowledge />
            </EnterpriseRoute>
          }
        />
        <Route
          path="knowledge/create"
          element={
            <EnterpriseRoute>
              <KnowledgeForm />
            </EnterpriseRoute>
          }
        />
        <Route
          path="knowledge/edit/:id"
          element={
            <EnterpriseRoute>
              <KnowledgeForm />
            </EnterpriseRoute>
          }
        />

        {/* Research Demands routes */}
        <Route
          path="research-demands"
          element={
            <ProtectedRoute>
              <ResearchDemands />
            </ProtectedRoute>
          }
        />
        <Route
          path="research-demands/create"
          element={
            <EnterpriseRoute>
              <ResearchDemandForm />
            </EnterpriseRoute>
          }
        />
        <Route
          path="research-demands/edit/:id"
          element={
            <EnterpriseRoute>
              <ResearchDemandForm />
            </EnterpriseRoute>
          }
        />
        <Route
          path="research-demands/:id"
          element={
            <ProtectedRoute>
              <ResearchDemandDetail />
            </ProtectedRoute>
          }
        />

        {/* Technical Barriers routes */}
        <Route
          path="technical-barriers"
          element={
            <ProtectedRoute>
              <TechnicalBarriers />
            </ProtectedRoute>
          }
        />
        <Route
          path="technical-barriers/create"
          element={
            <EnterpriseRoute>
              <TechnicalBarrierForm />
            </EnterpriseRoute>
          }
        />
        <Route
          path="technical-barriers/edit/:id"
          element={
            <EnterpriseRoute>
              <TechnicalBarrierForm />
            </EnterpriseRoute>
          }
        />
        <Route
          path="technical-barriers/:id"
          element={
            <ProtectedRoute>
              <TechnicalBarrierDetail />
            </ProtectedRoute>
          }
        />

        {/* Research Achievements routes */}
        <Route
          path="research-achievements"
          element={
            <ProtectedRoute>
              <ResearchAchievements />
            </ProtectedRoute>
          }
        />
        <Route
          path="research-achievements/create"
          element={
            <UniversityRoute>
              <ResearchAchievementForm />
            </UniversityRoute>
          }
        />
        <Route
          path="research-achievements/edit/:id"
          element={
            <UniversityRoute>
              <ResearchAchievementForm />
            </UniversityRoute>
          }
        />
        <Route
          path="research-achievements/:id"
          element={
            <ProtectedRoute>
              <ResearchAchievementDetail />
            </ProtectedRoute>
          }
        />

        {/* Cooperation Projects routes */}
        <Route
          path="cooperation-projects"
          element={
            <ProtectedRoute>
              <CooperationProjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="cooperation-projects/create"
          element={
            <ProtectedRoute>
              <CooperationProjectForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="cooperation-projects/edit/:id"
          element={
            <ProtectedRoute>
              <CooperationProjectForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="cooperation-projects/:id"
          element={
            <ProtectedRoute>
              <CooperationProjectDetail />
            </ProtectedRoute>
          }
        />

        {/* Inquiry Records routes */}
        <Route
          path="inquiry-records"
          element={
            <ProtectedRoute>
              <Inquiries />
            </ProtectedRoute>
          }
        />
        <Route
          path="inquiry-records/:id"
          element={
            <ProtectedRoute>
              <InquiryDetail />
            </ProtectedRoute>
          }
        />

        {/* Innovation Dynamics routes */}
        <Route
          path="dashboard"
          element={
            <GovernmentRoute>
              <Dashboard />
            </GovernmentRoute>
          }
        />
        <Route
          path="innovation-dynamics"
          element={
            <GovernmentRoute>
              <InnovationDynamics />
            </GovernmentRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </>
  )
}

export default App
