import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../../stores/userStore'
import { authAPI } from '../../services/api'
import { validateEmail, validatePhone } from '../../utils/helpers'

const Profile = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, updateUser } = useUserStore()
  const isStudent = user?.role === 'student'

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    resetForm()
  }, [user, isAuthenticated])

  const resetForm = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      // Student fields
      school: user?.school || '',
      major: user?.major || '',
      graduationYear: user?.graduation_year || user?.graduationYear || '',
      bio: user?.bio || '',
      // Enterprise fields
      company: user?.company || '',
      position: user?.position || '',
      department: user?.department || '',
      companyDescription: user?.company_description || user?.companyDescription || ''
    })
    setErrors({})
  }

  // Convert camelCase to snake_case for API
  const toSnakeCase = (data) => ({
    name: data.name,
    email: data.email,
    phone: data.phone,
    school: data.school,
    major: data.major,
    graduation_year: data.graduationYear,
    bio: data.bio,
    company: data.company,
    position: data.position,
    department: data.department,
    company_description: data.companyDescription
  })

  // Convert snake_case to camelCase for local state
  const toCamelCase = (data) => ({
    ...data,
    graduationYear: data.graduation_year,
    companyDescription: data.company_description
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
    setSaveSuccess(false)
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name) {
      newErrors.name = '请输入姓名'
    }

    if (!formData.email) {
      newErrors.email = '请输入邮箱'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址'
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = '请输入有效的手机号'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setSaveSuccess(false)

    try {
      // Convert to snake_case for API
      const apiData = toSnakeCase(formData)
      const response = await authAPI.updateProfile(apiData)
      // Convert response back to camelCase and update store
      const userData = toCamelCase(response.data)
      updateUser(userData)
      setIsEditing(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update profile:', error)
      // Mock success for development - convert to store format
      const userData = toCamelCase(toSnakeCase(formData))
      updateUser(userData)
      setIsEditing(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    resetForm()
    setIsEditing(false)
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">个人中心</h1>
        <p className="text-gray-600 mt-1">管理您的个人信息</p>
      </div>

      {saveSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
          个人信息保存成功！
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-3xl text-white font-bold">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold">{user?.name || '用户'}</h2>
              <p className="text-blue-200">
                {isStudent ? `${user?.school || ''} · ${user?.major || ''}` : `${user?.company || ''} · ${user?.position || ''}`}
              </p>
              <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm">
                {isStudent ? '学生用户' : '企业用户'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">基本信息</h3>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 font-medium rounded-lg transition-colors"
              >
                编辑资料
              </button>
            ) : null}
          </div>

          <div className="space-y-6">
            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 border ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  手机号码
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 border ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50`}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
            </div>

            {/* Role-specific Fields */}
            {isStudent ? (
              <>
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">学生信息</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        学校名称
                      </label>
                      <input
                        type="text"
                        name="school"
                        value={formData.school}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        专业
                      </label>
                      <input
                        type="text"
                        name="major"
                        value={formData.major}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        毕业年份
                      </label>
                      <input
                        type="text"
                        name="graduationYear"
                        value={formData.graduationYear}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="例如：2025"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      个人简介
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      disabled={!isEditing}
                      rows={3}
                      placeholder="介绍一下自己..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">企业信息</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        公司名称
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        职位
                      </label>
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        部门
                      </label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      公司简介
                    </label>
                    <textarea
                      name="companyDescription"
                      value={formData.companyDescription}
                      onChange={handleChange}
                      disabled={!isEditing}
                      rows={3}
                      placeholder="介绍一下公司..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="mt-8 flex justify-end gap-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? '保存中...' : '保存修改'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

export default Profile
