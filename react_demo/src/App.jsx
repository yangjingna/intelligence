import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Jobs, { JobForm } from './pages/Jobs'
import Chat from './pages/Chat'
import Resources, { ResourceForm } from './pages/Resources'
import CustomerService from './pages/CustomerService'
import Knowledge, { KnowledgeForm } from './pages/Knowledge'
import Profile from './pages/Profile'
import useUserStore from './stores/userStore'

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
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public routes */}
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="resources" element={<Resources />} />
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
          path="resources/create"
          element={
            <EnterpriseRoute>
              <ResourceForm />
            </EnterpriseRoute>
          }
        />
        <Route
          path="resources/edit/:id"
          element={
            <EnterpriseRoute>
              <ResourceForm />
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
  )
}

export default App
