import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { knowledgeAPI } from '../../services/api'

const KnowledgeForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    keywords: '',
    is_preset: false
  })
  const [categories, setCategories] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)

  useEffect(() => {
    fetchCategories()
    if (isEdit) {
      fetchKnowledge()
    }
  }, [id])

  const fetchCategories = async () => {
    try {
      const response = await knowledgeAPI.getCategories()
      setCategories(response.data || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      setCategories(['平台功能', '注册登录', '岗位招聘', '资源中心', '其他'])
    }
  }

  const fetchKnowledge = async () => {
    try {
      const response = await knowledgeAPI.getKnowledgeItem(id)
      const item = response.data
      setFormData({
        question: item.question || '',
        answer: item.answer || '',
        category: item.category || '',
        keywords: item.keywords || '',
        is_preset: item.is_preset === 1
      })
    } catch (error) {
      console.error('Failed to fetch knowledge:', error)
      alert('获取知识条目失败')
      navigate('/knowledge')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.question.trim()) newErrors.question = '请输入问题'
    if (!formData.answer.trim()) newErrors.answer = '请输入答案'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const submitData = {
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        category: formData.category || null,
        keywords: formData.keywords.trim() || null,
        is_preset: formData.is_preset
      }

      if (isEdit) {
        await knowledgeAPI.updateKnowledge(id, submitData)
      } else {
        await knowledgeAPI.createKnowledge(submitData)
      }
      navigate('/knowledge')
    } catch (error) {
      console.error('Failed to save knowledge:', error)
      alert('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('确定要删除这个知识条目吗？')) return

    try {
      await knowledgeAPI.deleteKnowledge(id)
      navigate('/knowledge')
    } catch (error) {
      console.error('Failed to delete knowledge:', error)
      alert('删除失败，请重试')
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? '编辑知识' : '添加知识'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit ? '修改知识库条目' : '添加新的问答到知识库'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="space-y-6">
          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              问题 <span className="text-red-500">*</span>
            </label>
            <textarea
              name="question"
              value={formData.question}
              onChange={handleChange}
              rows={3}
              className={`w-full px-4 py-2 border ${
                errors.question ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="输入用户可能会问的问题..."
            />
            {errors.question && <p className="mt-1 text-sm text-red-600">{errors.question}</p>}
          </div>

          {/* Answer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              答案 <span className="text-red-500">*</span>
            </label>
            <textarea
              name="answer"
              value={formData.answer}
              onChange={handleChange}
              rows={6}
              className={`w-full px-4 py-2 border ${
                errors.answer ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="输入对应的答案内容..."
            />
            {errors.answer && <p className="mt-1 text-sm text-red-600">{errors.answer}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分类
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">请选择分类</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              关键词
            </label>
            <input
              type="text"
              name="keywords"
              value={formData.keywords}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="用逗号分隔，例如：注册, 账号, 登录"
            />
            <p className="mt-1 text-xs text-gray-500">关键词可帮助更精准地匹配用户问题</p>
          </div>

          {/* Is Preset */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_preset"
              id="is_preset"
              checked={formData.is_preset}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_preset" className="ml-2 text-sm text-gray-700">
              设为预设问答
            </label>
            <span className="ml-2 text-xs text-gray-500">（预设问答为系统内置的标准回答）</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-between">
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-6 py-2 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
            >
              删除
            </button>
          )}
          <div className={`flex gap-4 ${!isEdit ? 'ml-auto' : ''}`}>
            <button
              type="button"
              onClick={() => navigate('/knowledge')}
              className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '保存中...' : isEdit ? '保存修改' : '添加知识'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default KnowledgeForm
