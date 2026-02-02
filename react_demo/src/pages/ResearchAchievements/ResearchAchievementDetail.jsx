import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { cooperationProjectsAPI } from '../../services/api'
import useUserStore from '../../stores/userStore'
import { PROJECT_STATUS } from '../../utils/constants'

const CooperationProjectDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, isEnterprise, isUniversity } = useUserStore()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showUpdateStatus, setShowUpdateStatus] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [id])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await cooperationProjectsAPI.getProject(id)
      setProject(response.data)
    } catch (error) {
      console.error('获取合作项目详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这个合作项目吗？')) return

    try {
      await cooperationProjectsAPI.deleteProject(id)
      navigate('/cooperation-projects')
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    }
  }

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      alert('请选择新的状态')
      return
    }

    setUpdating(true)
    try {
      await cooperationProjectsAPI.updateProject(id, { status: newStatus })
      await fetchProject()
      setShowUpdateStatus(false)
      setNewStatus('')
    } catch (error) {
      console.error('更新状态失败:', error)
      alert('更新状态失败，请重试')
    } finally {
      setUpdating(false)
    }
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || colors.pending}`}>
        {labels[status] || '待确认'}
      </span>
    )
  }

  const getNextStatusOptions = (currentStatus) => {
    const statusFlow = {
      pending: ['signed', 'cancelled'],
      signed: ['in_progress', 'cancelled'],
      in_progress: ['completed'],
      completed: [],
      cancelled: []
    }
    return statusFlow[currentStatus] || []
  }

  const statusLabels = {
    pending: '待确认',
    signed: '已签约',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12 text-gray-500">
          合作项目不存在
        </div>
      </div>
    )
  }

  const isParticipant = user && (
    project.enterprise_id === user.id || project.university_id === user.id
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 返回按钮 */}
      <Link
        to="/cooperation-projects"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回列表
      </Link>

      {/* 标题和操作按钮 */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{project.title}</h1>
          <div className="flex flex-wrap items-center gap-3">
            {getStatusBadge(project.status)}
            {project.project_type && (
              <span className="inline-block bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm">
                {project.project_type}
              </span>
            )}
            <span className="text-sm text-gray-500">
              创建于 {new Date(project.created_at).toLocaleString('zh-CN')}
            </span>
          </div>
        </div>
        {isParticipant && (
          <div className="flex gap-2">
            {!showUpdateStatus && getNextStatusOptions(project.status).length > 0 && (
              <button
                onClick={() => setShowUpdateStatus(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                更新状态
              </button>
            )}
            <Link
              to={`/cooperation-projects/edit/${project.id}`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              编辑
            </Link>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              删除
            </button>
          </div>
        )}
      </div>

      {/* 更新状态表单 */}
      {showUpdateStatus && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">更新项目状态</h3>
          <div className="flex gap-3">
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">选择新状态</option>
              {getNextStatusOptions(project.status).map(status => (
                <option key={status} value={status}>{statusLabels[status]}</option>
              ))}
            </select>
            <button
              onClick={handleUpdateStatus}
              disabled={updating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {updating ? '更新中...' : '确认'}
            </button>
            <button
              onClick={() => {
                setShowUpdateStatus(false)
                setNewStatus('')
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 合作方信息 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">合作方</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {project.enterprise_id && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                  {project.enterprise_name?.charAt(0) || '企'}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{project.enterprise_name || '企业'}</div>
                  <div className="text-sm text-gray-600">企业方</div>
                </div>
              </div>
            </div>
          )}
          {project.university_id && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-medium">
                  {project.university_name?.charAt(0) || '高'}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{project.university_name || '高校'}</div>
                  <div className="text-sm text-gray-600">高校方</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 项目描述 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">项目描述</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
      </div>

      {/* 关联信息 */}
      {(project.demand_id || project.barrier_id || project.achievement_id) && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">关联信息</h2>
          <div className="space-y-2">
            {project.demand_id && (
              <Link
                to={`/research-demands/${project.demand_id}`}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">研发需求</span>
                <span className="text-sm">查看关联需求</span>
              </Link>
            )}
            {project.barrier_id && (
              <Link
                to={`/technical-barriers/${project.barrier_id}`}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
              >
                <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">技术壁垒</span>
                <span className="text-sm">查看关联壁垒</span>
              </Link>
            )}
            {project.achievement_id && (
              <Link
                to={`/research-achievements/${project.achievement_id}`}
                className="flex items-center gap-2 text-green-600 hover:text-green-700"
              >
                <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">研发成果</span>
                <span className="text-sm">查看关联成果</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 项目信息 */}
      {(project.budget || project.duration || project.start_date || project.end_date) && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">项目信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.budget && (
              <div>
                <div className="text-sm text-gray-500 mb-1">预算</div>
                <div className="text-lg font-semibold text-gray-900">
                  ¥{(project.budget / 10000).toFixed(2)} 万
                </div>
              </div>
            )}
            {project.duration && (
              <div>
                <div className="text-sm text-gray-500 mb-1">项目周期</div>
                <div className="text-lg font-semibold text-gray-900">{project.duration}</div>
              </div>
            )}
            {project.start_date && (
              <div>
                <div className="text-sm text-gray-500 mb-1">开始日期</div>
                <div className="text-lg font-semibold text-gray-900">
                  {new Date(project.start_date).toLocaleDateString('zh-CN')}
                </div>
              </div>
            )}
            {project.end_date && (
              <div>
                <div className="text-sm text-gray-500 mb-1">结束日期</div>
                <div className="text-lg font-semibold text-gray-900">
                  {new Date(project.end_date).toLocaleDateString('zh-CN')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 统计信息 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">项目进度</h2>
        <div className="text-gray-700">
          <div className="text-sm text-gray-500 mb-1">里程碑</div>
          <div className="text-lg font-semibold text-gray-900">
            {project.milestone_count || 0} 个里程碑
          </div>
        </div>
      </div>

      {/* 备注 */}
      {project.notes && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">备注</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{project.notes}</p>
        </div>
      )}

      {/* 聊天按钮 */}
      {isParticipant && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">项目沟通</h3>
          <p className="text-gray-600 mb-4">与合作方进行实时沟通，讨论项目进展。</p>
          <Link
            to={`/chat?user_id=${user.role === 'enterprise' ? project.university_id : project.enterprise_id}`}
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            开始聊天
          </Link>
        </div>
      )}
    </div>
  )
}

export default CooperationProjectDetail
