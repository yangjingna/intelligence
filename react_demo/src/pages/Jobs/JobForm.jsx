import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { jobsAPI } from '../../services/api'

const JobForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState({
    title: '',
    salary: '',
    location: '',
    experience: '',
    education: '',
    description: '',
    requirements: '',
    tags: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)

  useEffect(() => {
    if (isEdit) {
      fetchJob()
    }
  }, [id])

  const fetchJob = async () => {
    try {
      const response = await jobsAPI.getJob(id)
      const job = response.data
      setFormData({
        title: job.title || '',
        salary: job.salary || '',
        location: job.location || '',
        experience: job.experience || '',
        education: job.education || '',
        description: job.description || '',
        requirements: job.requirements || '',
        tags: job.tags?.join(', ') || ''
      })
    } catch (error) {
      console.error('Failed to fetch job:', error)
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
    if (!formData.title) newErrors.title = '请输入岗位名称'
    if (!formData.salary) newErrors.salary = '请输入薪资范围'
    if (!formData.location) newErrors.location = '请选择工作地点'
    if (!formData.description) newErrors.description = '请输入岗位描述'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const submitData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      }

      if (isEdit) {
        await jobsAPI.updateJob(id, submitData)
      } else {
        await jobsAPI.createJob(submitData)
      }
      navigate('/jobs')
    } catch (error) {
      console.error('Failed to save job:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('确定要删除这个岗位吗？')) return

    try {
      await jobsAPI.deleteJob(id)
      navigate('/jobs')
    } catch (error) {
      console.error('Failed to delete job:', error)
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
          {isEdit ? '编辑岗位' : '发布岗位'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEdit ? '修改岗位信息' : '填写岗位信息发布招聘'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              岗位名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="例如：前端开发工程师"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                薪资范围 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${
                  errors.salary ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="例如：15k-25k"
              />
              {errors.salary && <p className="mt-1 text-sm text-red-600">{errors.salary}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                工作地点 <span className="text-red-500">*</span>
              </label>
              <select
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${
                  errors.location ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">请选择</option>
                <option value="北京">北京</option>
                <option value="上海">上海</option>
                <option value="深圳">深圳</option>
                <option value="杭州">杭州</option>
                <option value="广州">广州</option>
                <option value="成都">成都</option>
                <option value="武汉">武汉</option>
                <option value="南京">南京</option>
              </select>
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                经验要求
              </label>
              <select
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择</option>
                <option value="不限">不限</option>
                <option value="应届生">应届生</option>
                <option value="1-3年">1-3年</option>
                <option value="3-5年">3-5年</option>
                <option value="5-10年">5-10年</option>
                <option value="10年以上">10年以上</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                学历要求
              </label>
              <select
                name="education"
                value={formData.education}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择</option>
                <option value="不限">不限</option>
                <option value="大专">大专</option>
                <option value="本科">本科</option>
                <option value="硕士">硕士</option>
                <option value="博士">博士</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              技能标签
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="用逗号分隔，例如：React, Vue, TypeScript"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              岗位描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={`w-full px-4 py-2 border ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="请详细描述岗位职责..."
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              任职要求
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请描述任职要求..."
            />
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-6 py-2 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
            >
              删除岗位
            </button>
          )}
          <div className={`flex gap-4 ${!isEdit ? 'ml-auto' : ''}`}>
            <button
              type="button"
              onClick={() => navigate('/jobs')}
              className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '保存中...' : isEdit ? '保存修改' : '发布岗位'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default JobForm
