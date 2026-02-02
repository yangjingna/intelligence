import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { cooperationProjectsAPI } from '../../services/api'
import useUserStore from '../../stores/userStore'
import { PROJECT_STATUS } from '../../utils/constants'

const CooperationProjects = () => {
  const { user, isAuthenticated, isEnterprise, isUniversity } = useUserStore()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const params = {}
      if (search) params.search = search
      if (filterStatus) params.status = filterStatus
      if (filterType) params.project_type = filterType

      const response = await cooperationProjectsAPI.getProjects(params)
      setProjects(response.data)
    } catch (error) {
      console.error('获取合作项目失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleSearch = () => {
    fetchProjects()
  }

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      signed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    const labels = {
      pending: '待确认',
      signed: '已签约',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
        {labels[status] || '待确认'}
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">合作项目</h1>
        {isEnterprise() && (
          <Link
            to="/cooperation-projects/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            创建项目
          </Link>
        )}
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="搜索标题或描述"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部状态</option>
              <option value="pending">待确认</option>
              <option value="signed">已签约</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
          <div>
            <input
              type="text"
              placeholder="项目类型"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <button
              onClick={handleSearch}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              搜索
            </button>
          </div>
        </div>
      </div>

      {/* 项目列表 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          暂无合作项目
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  {project.enterprise_name && (
                    <span className="text-xs text-gray-500 block">{project.enterprise_name}</span>
                  )}
                  {project.university_name && (
                    <span className="text-xs text-gray-500 block">{project.university_name}</span>
                  )}
                </div>
                {getStatusBadge(project.status)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
              {project.project_type && (
                <div className="mb-2">
                  <span className="inline-block bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs">
                    {project.project_type}
                  </span>
                </div>
              )}
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {project.description}
              </p>
              <Link
                to={`/cooperation-projects/${project.id}`}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                查看详情
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CooperationProjects
