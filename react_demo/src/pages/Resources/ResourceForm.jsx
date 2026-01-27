import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { resourcesAPI } from '../../services/api'
import { RESOURCE_TYPES } from '../../utils/constants'

const resourceTypeLabels = {
  [RESOURCE_TYPES.PROJECT]: '项目合作',
  [RESOURCE_TYPES.INTERNSHIP]: '实习机会',
  [RESOURCE_TYPES.RESEARCH]: '科研项目',
  [RESOURCE_TYPES.COOPERATION]: '产学研合作'
}

const ResourceForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState({
    title: '',
    type: '',
    description: '',
    requirements: '',
    tags: '',
    deadline: '',
    contactName: '',
    contactEmail: '',
    contactPhone: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)

  useEffect(() => {
    if (isEdit) {
      fetchResource()
    }
  }, [id])

  const fetchResource = async () => {
    try {
      const response = await resourcesAPI.getResource(id)
      const resource = response.data
      setFormData({
        title: resource.title || '',
        type: resource.type || '',
        description: resource.description || '',
        requirements: resource.requirements || '',
        tags: resource.tags?.join(', ') || '',
        deadline: resource.deadline?.split('T')[0] || '',
        // 兼容后端返回的 snake_case 字段名
        contactName: resource.contact_name || resource.contactName || '',
        contactEmail: resource.contact_email || resource.contactEmail || '',
        contactPhone: resource.contact_phone || resource.contactPhone || ''
      })
    } catch (error) {
      console.error('Failed to fetch resource:', error)
    } finally {
      setFetchLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.title) newErrors.title = '请输入资源名称'
    if (!formData.type) newErrors.type = '请选择资源类型'
    if (!formData.description) newErrors.description = '请输入资源描述'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      // 转换为后端期望的 snake_case 字段名
      // 注意：空字符串需要转为 undefined 而不是 null，否则后端验证会失败
      const submitData = {
        title: formData.title,
        type: formData.type,
        description: formData.description || null,
        requirements: formData.requirements || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        deadline: formData.deadline || null,
        contact_name: formData.contactName || null,
        contact_phone: formData.contactPhone || null
      }

      // 只有当邮箱不为空时才添加，避免空字符串导致验证失败
      if (formData.contactEmail && formData.contactEmail.trim()) {
        submitData.contact_email = formData.contactEmail.trim()
      }

      console.log('Submitting data:', submitData)

      if (isEdit) {
        await resourcesAPI.updateResource(id, submitData)
      } else {
        await resourcesAPI.createResource(submitData)
      }
      navigate('/resources')
    } catch (error) {
      console.error('Failed to save resource:', error)
      // 显示更详细的错误信息
      const errorMsg = error.response?.data?.detail || '保存失败，请检查填写的信息'
      alert(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('确定要删除这个资源吗？')) return

    try {
      await resourcesAPI.deleteResource(id)
      navigate('/resources')
    } catch (error) {
      console.error('Failed to delete resource:', error)
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
          {isEdit ? '编辑资源' : '发布资源'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit ? '修改资源信息' : '填写资源信息发布产学研合作机会'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              资源名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="例如：智能制造产学研合作项目"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              资源类型 <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${
                errors.type ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="">请选择</option>
              {Object.entries(resourceTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              资源描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={`w-full px-4 py-2 border ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="请详细描述资源内容和合作方向..."
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              合作要求
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请描述对合作方的要求..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标签
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="用逗号分隔，例如：AI, 大数据"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                截止日期
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">联系方式</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系人
                </label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="联系人姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="联系邮箱"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  电话
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="联系电话"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-6 py-2 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
            >
              删除资源
            </button>
          )}
          <div className={`flex gap-4 ${!isEdit ? 'ml-auto' : ''}`}>
            <button
              type="button"
              onClick={() => navigate('/resources')}
              className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '保存中...' : isEdit ? '保存修改' : '发布资源'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ResourceForm
