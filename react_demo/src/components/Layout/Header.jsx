import { Link, useNavigate } from 'react-router-dom'
import useUserStore from '../../stores/userStore'
import wsService from '../../services/websocket'

const Header = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useUserStore()

  const handleLogout = () => {
    wsService.disconnect()
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600">产学研平台</span>
            </Link>
            <nav className="hidden md:flex ml-10 space-x-8">
              <Link
                to="/"
                className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                首页
              </Link>
              <Link
                to="/jobs"
                className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                {user?.role === 'enterprise' ? '资源发布' : '资源匹配'}
              </Link>
              {isAuthenticated && (
                <Link
                  to="/chat"
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  企业直聊
                </Link>
              )}
              <Link
                to="/customer-service"
                className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                智能客服
              </Link>
              {user?.role === 'enterprise' && (
                <Link
                  to="/knowledge"
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  知识库管理
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  {user?.name || '个人中心'}
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-blue-600 px-4 py-2 text-sm font-medium transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
