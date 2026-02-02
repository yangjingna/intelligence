import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { technicalBarriersAPI } from '../../services/api'

const TechnicalBarrierForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    technical_area: '',
    challenge: '',
    impact: '',
    current_solution: '',
    desired_solution: '',
    investment: '',
    timeline: '',
    category: '',
    difficulty: 'medium'
  })
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadBarrier = async () => {
    try {
      setLoading(true)
      const response = await technicalBarriersAPI.getBarrier(id)
      const barrier = response.data
      setFormData({
        title: barrier.title || '',
        description: barrier.description || '',
        technical_area: barrier.technical_area || '',
        challenge: barrier.challenge || '',
        impact: barrier.impact || '',
        current_solution: barrier.current_solution || '',
        desired_solution: barrier.desired_solution || '',
        investment: barrier.investment || '',
        timeline: barrier.timeline || '',
        category: barrier.category || '',
        difficulty: barrier.difficulty || 'medium'
      })
    } catch (error) {
      setError('加载技术壁垒失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isEdit) {
      loadBarrier()
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
        investment: formData.investment ? parseFloat(formData.investment) : null
      }

      if (isEdit) {
        await technicalBarriersAPI.updateBarrier(id, submitData)
      } else {
        await technicalBarriersAPI.createBarrier(submitData)
      }

      navigate('/technical-barriers')
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
          {isEdit ? '编辑技术壁垒' : '发布技术壁垒'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isEdit ? '更新技术壁垒信息' : '发布技术壁垒，寻求高校和科研机构的帮助'}
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
              壁垒标题 *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入壁垒标题"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              壁垒描述 *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请详细描述技术壁垒问题"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="technical_area" className="block text-sm font-medium text-gray-700 mb-1">
                技术领域
              </label>
              <input
                id="technical_area"
                name="technical_area"
                type="text"
                value={formData.technical_area}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="如：人工智能、新材料等"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                壁垒类别
              </label>
              <input
                id="category"
                name="category"
                type="text"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="如：工艺瓶颈、核心技术等"
              />
            </div>
          </div>

          <div>
            <label htmlFor="challenge" className="block text-sm font-medium text-gray-700 mb-1">
              技术挑战
            </label>
            <textarea
              id="challenge"
              name="challenge"
              value={formData.challenge}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请描述具体的技术挑战"
            />
          </div>

          <div>
            <label htmlFor="impact" className="block text-sm font-medium text-gray-700 mb-1">
              业务影响
            </label>
            <textarea
              id="impact"
              name="impact"
              value={formData.impact}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请描述壁垒对业务的影响"
            />
          </div>

          <div>
            <label htmlFor="current_solution" className="block text-sm font-medium text-gray-700 mb-1">
              当前解决方案
            </label>
            <textarea
              id="current_solution"
              name="current_solution"
              value={formData.current_solution}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请描述当前的解决方案"
            />
          </div>

          <div>
            <label htmlFor="desired_solution" className="block text-sm font-medium text-gray-700 mb-1">
              期望解决方案
            </label>
            <textarea
              id="desired_solution"
              name="desired_solution"
              value={formData.desired_solution}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请描述期望的解决方案"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="investment" className="block text-sm font-medium text-gray-700 mb-1">
                已投入资金（万元）
              </label>
              <input
                id="investment"
                name="investment"
                type="number"
                value={formData.investment}
                onChange={handleChange}
                step="0.1"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入已投入资金"
              />
            </div>

            <div>
              <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 mb-1">
                预期解决时间
              </label>
              <input
                id="timeline"
                name="timeline"
                type="text"
                value={formData.timeline}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="如：3个月、半年、1年"
              />
            </div>
          </div>

          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
              难度
            </label>
            <select
              id="difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="very_high">极高</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/technical-barriers')}
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

export default TechnicalBarrierForm
