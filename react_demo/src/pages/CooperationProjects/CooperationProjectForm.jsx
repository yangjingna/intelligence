import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cooperationProjectsAPI } from '../../services/api'

const CooperationProjectForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    demand_id: '',
    barrier_id: '',
    achievement_id: '',
    project_type: '',
    budget: '',
    duration: '',
    start_date: '',
    end_date: '',
    status: 'pending',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadProject = async () => {
    try {
      setLoading(true)
      const response = await cooperationProjectsAPI.getProject(id)
      const project = response.data
      setFormData({
        title: project.title || '',
        description: project.description || '',
        demand_id: project.demand_id || '',
        barrier_id: project.barrier_id || '',
        achievement_id: project.achievement_id || '',
        project_type: project.project_type || '',
        budget: project.budget || '',
        duration: project.duration || '',
        start_date: project.start_date ? project.start_date.substring(0, 10) : '',
        end_date: project.end_date ? project.end_date.substring(0, 10) : '',
        status: project.status || 'pending',
        notes: project.notes || ''
      })
    } catch (error) {
      setError('加载合作项目失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isEdit) {
      loadProject()
    }
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title || !formData.description) {
      setError('请填写标题和描述')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const submitData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null
      }

      if (isEdit) {
        await cooperationProjectsAPI.updateProject(id, submitData)
      } else {
        await cooperationProjectsAPI.createProject(submitData)
      }

      navigate('/cooperation-projects')
    } catch (error) {
      setError(error.response?.data?.message || '提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? '编辑合作项目' : '创建合作项目'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isEdit ? '更新合作项目信息' : '创建新的产学研合作项目'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-8">
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              项目标题 *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入项目标题"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              项目描述 *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请详细描述合作项目"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="demand_id" className="block text-sm font-medium text-gray-700 mb-1">
                关联需求ID
              </label>
              <input
                id="demand_id"
                name="demand_id"
                type="number"
                value={formData.demand_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="关联的研发需求ID"
              />
            </div>
            <div>
              <label htmlFor="barrier_id" className="block text-sm font-medium text-gray-700 mb-1">
                关联壁垒ID
              </label>
              <input
                id="barrier_id"
                name="barrier_id"
                type="number"
                value={formData.barrier_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="关联的技术壁垒ID"
              />
            </div>
            <div>
              <label htmlFor="achievement_id" className="block text-sm font-medium text-gray-700 mb-1">
                关联成果ID
              </label>
              <input
                id="achievement_id"
                name="achievement_id"
                type="number"
                value={formData.achievement_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="关联的研发成果ID"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="project_type" className="block text-sm font-medium text-gray-700 mb-1">
                项目类型
              </label>
              <input
                id="project_type"
                name="project_type"
                type="text"
                value={formData.project_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="如：技术研发、成果转化等"
              />
            </div>
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                项目周期
              </label>
              <input
                id="duration"
                name="duration"
                type="text"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="如：6个月、1年"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                预算（万元）
              </label>
              <input
                id="budget"
                name="budget"
                type="number"
                value={formData.budget}
                onChange={handleChange}
                step="0.1"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入项目预算"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                状态
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">待确认</option>
                <option value="signed">已签约</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                开始日期
              </label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                结束日期
              </label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              备注
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入备注信息"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/cooperation-projects')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? '提交中...' : (isEdit ? '更新' : '创建')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CooperationProjectForm
