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
        conversationId: message.conversationId || message.conversation_id
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

    wsService.on('new_message', handleNewMessage)
    wsService.on('online_status', handleOnlineStatus)
    wsService.on('online_users_list', handleOnlineUsersList)

    return () => {
      wsService.off('new_message', handleNewMessage)
      wsService.off('online_status', handleOnlineStatus)
      wsService.off('online_users_list', handleOnlineUsersList)
    }
  }, [isAuthenticated, token])

  const handleNotificationClick = () => {
    if (notification?.conversationId) {
      navigate('/chat')
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
            {notification.senderName?.charAt(0) || 'U'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">{notification.senderName}</p>
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
  const { isAuthenticated, user, _hasHydrated } = useUserStore()

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

  if (user?.role !== 'enterprise') {
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

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </>
  )
}

export default App
