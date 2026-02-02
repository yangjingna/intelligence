import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { researchDemandsAPI } from '../../services/api'

const ResearchDemandForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    research_area: '',
    technical_requirements: '',
    expected_outcome: '',
    budget: '',
    duration: '',
    category: '',
    priority: 'medium'
  })
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadDemand = async () => {
    try {
      setLoading(true)
      const response = await researchDemandsAPI.getDemand(id)
      const demand = response.data
      setFormData({
        title: demand.title || '',
        description: demand.description || '',
        research_area: demand.research_area || '',
        technical_requirements: demand.technical_requirements || '',
        expected_outcome: demand.expected_outcome || '',
        budget: demand.budget || '',
        duration: demand.duration || '',
        category: demand.category || '',
        priority: demand.priority || 'medium'
      })
    } catch (error) {
      setError('加载研发需求失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isEdit) {
      loadDemand()
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
        await researchDemandsAPI.updateDemand(id, submitData)
      } else {
        await researchDemandsAPI.createDemand(submitData)
      }

      navigate('/research-demands')
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
          {isEdit ? '编辑研发需求' : '发布研发需求'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isEdit ? '更新研发需求信息' : '发布新的研发需求，吸引高校和科研机构合作'}
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
              需求标题 *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入需求标题"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              需求描述 *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请详细描述您的研发需求"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="research_area" className="block text-sm font-medium text-gray-700 mb-1">
                研究领域
              </label>
              <input
                id="research_area"
                name="research_area"
                type="text"
                value={formData.research_area}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="如：人工智能、新材料等"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                需求类别
              </label>
              <input
                id="category"
                name="category"
                type="text"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="如：技术开发、技术咨询等"
              />
            </div>
          </div>

          <div>
            <label htmlFor="technical_requirements" className="block text-sm font-medium text-gray-700 mb-1">
              技术要求
            </label>
            <textarea
              id="technical_requirements"
              name="technical_requirements"
              value={formData.technical_requirements}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请描述技术要求和规格"
            />
          </div>

          <div>
            <label htmlFor="expected_outcome" className="block text-sm font-medium text-gray-700 mb-1">
              预期成果
            </label>
            <textarea
              id="expected_outcome"
              name="expected_outcome"
              value={formData.expected_outcome}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请描述期望的交付成果"
            />
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
                placeholder="请输入预算金额"
              />
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                预期周期
              </label>
              <input
                id="duration"
                name="duration"
                type="text"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="如：3个月、半年、1年"
              />
            </div>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              优先级
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="urgent">紧急</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/research-demands')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? '提交中...' : (isEdit ? '更新' : '发布')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ResearchDemandForm
