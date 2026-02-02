import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { researchAchievementsAPI } from '../../services/api'

const ResearchAchievementForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    research_area: '',
    application_field: '',
    innovation_points: '',
    technical_indicators: '',
    market_potential: '',
    category: '',
    status: 'draft'
  })
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadAchievement = async () => {
    try {
      setLoading(true)
      const response = await researchAchievementsAPI.getAchievement(id)
      const achievement = response.data
      setFormData({
        title: achievement.title || '',
        description: achievement.description || '',
        research_area: achievement.research_area || '',
        application_field: achievement.application_field || '',
        innovation_points: achievement.innovation_points || '',
        technical_indicators: achievement.technical_indicators || '',
        market_potential: achievement.market_potential || '',
        category: achievement.category || '',
        status: achievement.status || 'draft'
      })
    } catch (error) {
      setError('加载研发成果失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isEdit) {
      loadAchievement()
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
      if (isEdit) {
        await researchAchievementsAPI.updateAchievement(id, formData)
      } else {
        await researchAchievementsAPI.createAchievement(formData)
      }

      navigate('/research-achievements')
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
          {isEdit ? '编辑研发成果' : '发布研发成果'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isEdit ? '更新研发成果信息' : '发布研发成果，展示高校科研成果'}
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
              成果标题 *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入成果标题"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              成果描述 *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请详细描述研发成果"
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
              <label htmlFor="application_field" className="block text-sm font-medium text-gray-700 mb-1">
                应用领域
              </label>
              <input
                id="application_field"
                name="application_field"
                type="text"
                value={formData.application_field}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="如：智能制造、医疗健康等"
              />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              成果类别
            </label>
            <input
              id="category"
              name="category"
              type="text"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="如：发明专利、软件著作权、技术方案等"
            />
          </div>

          <div>
            <label htmlFor="innovation_points" className="block text-sm font-medium text-gray-700 mb-1">
              创新点
            </label>
            <textarea
              id="innovation_points"
              name="innovation_points"
              value={formData.innovation_points}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请描述主要创新点"
            />
          </div>

          <div>
            <label htmlFor="technical_indicators" className="block text-sm font-medium text-gray-700 mb-1">
              技术指标
            </label>
            <textarea
              id="technical_indicators"
              name="technical_indicators"
              value={formData.technical_indicators}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请描述主要技术指标"
            />
          </div>

          <div>
            <label htmlFor="market_potential" className="block text-sm font-medium text-gray-700 mb-1">
              市场潜力
            </label>
            <textarea
              id="market_potential"
              name="market_potential"
              value={formData.market_potential}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请描述市场应用潜力"
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
              <option value="draft">草稿</option>
              <option value="published">发布</option>
              <option value="archived">归档</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/research-achievements')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? '提交中...' : (isEdit ? '更新' : '保存')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ResearchAchievementForm
