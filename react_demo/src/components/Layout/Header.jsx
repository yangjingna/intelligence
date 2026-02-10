import { Link, useNavigate } from 'react-router-dom'
import useUserStore from '../../stores/userStore'
import wsService from '../../services/websocket'

const Header = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, isEnterprise, isUniversity, isGovernment, isStudent } = useUserStore()

  const handleLogout = () => {
    wsService.disconnect()
    logout()
    navigate('/login')
  }

  const getRoleLabel = () => {
    if (isStudent()) return '学生'
    if (isEnterprise()) return '企业'
    if (isUniversity()) return '高校'
    if (isGovernment()) return '政府'
    return ''
  }

  return (
    <header className="bg-white border-b-4 border-blue-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-900">产学研合作服务平台</span>
            </Link>
            <nav className="hidden md:flex ml-10 space-x-6">
              <Link
                to="/"
                className="text-gray-700 hover:text-blue-900 px-3 py-2 text-sm font-medium border-b-2 border-transparent hover:border-blue-900"
              >
                首页
              </Link>
              {isEnterprise() && (
                <Link
                  to="/jobs"
                  className="text-gray-700 hover:text-blue-900 px-3 py-2 text-sm font-medium border-b-2 border-transparent hover:border-blue-900"
                >
                  资源发布
                </Link>
              )}
              {/* 研发需求 */}
              {(isEnterprise() || isUniversity()) && (
                <Link
                  to="/research-demands"
                  className="text-gray-700 hover:text-blue-900 px-3 py-2 text-sm font-medium border-b-2 border-transparent hover:border-blue-900"
                >
                  研发需求
                </Link>
              )}
              {/* 技术壁垒 */}
              {(isEnterprise() || isUniversity()) && (
                <Link
                  to="/technical-barriers"
                  className="text-gray-700 hover:text-blue-900 px-3 py-2 text-sm font-medium border-b-2 border-transparent hover:border-blue-900"
                >
                  技术壁垒
                </Link>
              )}
              {/* 研发成果 */}
              {isUniversity() && (
                <Link
                  to="/research-achievements"
                  className="text-gray-700 hover:text-blue-900 px-3 py-2 text-sm font-medium border-b-2 border-transparent hover:border-blue-900"
                >
                  研发成果
                </Link>
              )}
              {/* 合作项目 */}
              {isEnterprise() && (
                <Link
                  to="/cooperation-projects"
                  className="text-gray-700 hover:text-blue-900 px-3 py-2 text-sm font-medium border-b-2 border-transparent hover:border-blue-900"
                >
                  合作项目
                </Link>
              )}
              {/* 仪表盘 */}
              {isGovernment() && (
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-blue-900 px-3 py-2 text-sm font-medium border-b-2 border-transparent hover:border-blue-900"
                >
                  仪表盘
                </Link>
              )}
              {/* 创新动态 */}
              {isGovernment() && (
                <Link
                  to="/innovation-dynamics"
                  className="text-gray-700 hover:text-blue-900 px-3 py-2 text-sm font-medium border-b-2 border-transparent hover:border-blue-900"
                >
                  创新动态
                </Link>
              )}
              {isAuthenticated && (
                <Link
                  to="/chat"
                  className="text-gray-700 hover:text-blue-900 px-3 py-2 text-sm font-medium border-b-2 border-transparent hover:border-blue-900"
                >
                  企业直聊
                </Link>
              )}
              <Link
                to="/customer-service"
                className="text-gray-700 hover:text-blue-900 px-3 py-2 text-sm font-medium border-b-2 border-transparent hover:border-blue-900"
              >
                在线客服
              </Link>
              {isEnterprise() && (
                <Link
                  to="/knowledge"
                  className="text-gray-700 hover:text-blue-900 px-3 py-2 text-sm font-medium border-b-2 border-transparent hover:border-blue-900"
                >
                  知识库管理
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex flex-col items-end text-sm">
                  <Link
                    to="/profile"
                    className="text-gray-700 hover:text-blue-900 font-medium"
                  >
                    {user?.name || '个人中心'}
                  </Link>
                  <span className="text-gray-500">
                    {getRoleLabel()}
                    {isEnterprise() && user?.company && ` · ${user.company}`}
                    {isUniversity() && user?.university && ` · ${user.university}`}
                    {isGovernment() && user?.government && ` · ${user.government}`}
                    {isStudent() && user?.school && ` · ${user.school}`}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-blue-900 text-white px-4 py-2 text-sm font-medium hover:bg-blue-800 border-2 border-blue-900"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-900 px-4 py-2 text-sm font-medium"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-900 text-white px-4 py-2 text-sm font-medium hover:bg-blue-800 border-2 border-blue-900"
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
