import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useUserStore from '../../stores/userStore'
import { authAPI } from '../../services/api'
import wsService from '../../services/websocket'
import { validateEmail, validatePhone, validatePassword } from '../../utils/helpers'
import { USER_ROLES } from '../../utils/constants'

const Register = () => {
  const navigate = useNavigate()
  const { login } = useUserStore()
  const [role, setRole] = useState(USER_ROLES.STUDENT)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Student fields
    school: '',
    major: '',
    // Enterprise fields
    company: '',
    position: '',
    // University fields
    university: '',
    college: '',
    research_field: '',
    title: '',
    // Government fields
    government: '',
    region: '',
    department: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
    setApiError('')
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

    if (!formData.phone) {
      newErrors.phone = '请输入手机号'
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = '请输入有效的手机号'
    }

    if (!formData.password) {
      newErrors.password = '请输入密码'
    } else if (!validatePassword(formData.password)) {
      newErrors.password = '密码至少6位'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次密码输入不一致'
    }

    if (role === USER_ROLES.STUDENT) {
      if (!formData.school) {
        newErrors.school = '请输入学校名称'
      }
      if (!formData.major) {
        newErrors.major = '请输入专业'
      }
    } else if (role === USER_ROLES.ENTERPRISE) {
      if (!formData.company) {
        newErrors.company = '请输入公司名称'
      }
      if (!formData.position) {
        newErrors.position = '请输入职位'
      }
    } else if (role === USER_ROLES.UNIVERSITY) {
      if (!formData.university) {
        newErrors.university = '请输入高校名称'
      }
      if (!formData.college) {
        newErrors.college = '请输入学院名称'
      }
      if (!formData.research_field) {
        newErrors.research_field = '请输入研究领域'
      }
      if (!formData.title) {
        newErrors.title = '请输入职称'
      }
    } else if (role === USER_ROLES.GOVERNMENT) {
      if (!formData.government) {
        newErrors.government = '请输入政府部门名称'
      }
      if (!formData.region) {
        newErrors.region = '请输入区域'
      }
      if (!formData.department) {
        newErrors.department = '请输入部门'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setApiError('')

    try {
      // 调试：打印 role 的值
      console.log('[Register] 提交注册数据, role:', role, 'USER_ROLES:', USER_ROLES)

      const submitData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: role
      }

      if (role === USER_ROLES.STUDENT) {
        submitData.school = formData.school
        submitData.major = formData.major
      } else if (role === USER_ROLES.ENTERPRISE) {
        submitData.company = formData.company
        submitData.position = formData.position
      } else if (role === USER_ROLES.UNIVERSITY) {
        submitData.university = formData.university
        submitData.college = formData.college
        submitData.research_field = formData.research_field
        submitData.title = formData.title
      } else if (role === USER_ROLES.GOVERNMENT) {
        submitData.government = formData.government
        submitData.region = formData.region
        submitData.department = formData.department
      }

      const response = await authAPI.register(submitData)
      const { user, token } = response.data
      login(user, token)
      wsService.connect(token)
      navigate('/')
    } catch (error) {
      setApiError(error.response?.data?.message || '注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            注册账号
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            已有账号？{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              立即登录
            </Link>
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-4 rounded-lg border border-gray-300 overflow-hidden">
          <button
            type="button"
            onClick={() => setRole(USER_ROLES.STUDENT)}
            className={`py-2 text-xs font-medium transition-colors ${
              role === USER_ROLES.STUDENT
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            学生用户
          </button>
          <button
            type="button"
            onClick={() => setRole(USER_ROLES.ENTERPRISE)}
            className={`py-2 text-xs font-medium transition-colors ${
              role === USER_ROLES.ENTERPRISE
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            企业用户
          </button>
          <button
            type="button"
            onClick={() => setRole(USER_ROLES.UNIVERSITY)}
            className={`py-2 text-xs font-medium transition-colors ${
              role === USER_ROLES.UNIVERSITY
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            高校用户
          </button>
          <button
            type="button"
            onClick={() => setRole(USER_ROLES.GOVERNMENT)}
            className={`py-2 text-xs font-medium transition-colors ${
              role === USER_ROLES.GOVERNMENT
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            政府用户
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {apiError}
            </div>
          )}

          <div className="space-y-4">
            {/* Common Fields */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                姓名
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="请输入姓名"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                邮箱地址
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="请输入邮箱"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                手机号码
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="请输入手机号"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>

            {/* Student Fields */}
            {role === USER_ROLES.STUDENT && (
              <>
                <div>
                  <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
                    学校名称
                  </label>
                  <input
                    id="school"
                    name="school"
                    type="text"
                    value={formData.school}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.school ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="请输入学校名称"
                  />
                  {errors.school && <p className="mt-1 text-sm text-red-600">{errors.school}</p>}
                </div>
                <div>
                  <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-1">
                    专业
                  </label>
                  <input
                    id="major"
                    name="major"
                    type="text"
                    value={formData.major}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.major ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="请输入专业"
                  />
                  {errors.major && <p className="mt-1 text-sm text-red-600">{errors.major}</p>}
                </div>
              </>
            )}

            {/* Enterprise Fields */}
            {role === USER_ROLES.ENTERPRISE && (
              <>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                    公司名称
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.company ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="请输入公司名称"
                  />
                  {errors.company && <p className="mt-1 text-sm text-red-600">{errors.company}</p>}
                </div>
                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                    职位
                  </label>
                  <input
                    id="position"
                    name="position"
                    type="text"
                    value={formData.position}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.position ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="请输入职位"
                  />
                  {errors.position && <p className="mt-1 text-sm text-red-600">{errors.position}</p>}
                </div>
              </>
            )}

            {/* University Fields */}
            {role === USER_ROLES.UNIVERSITY && (
              <>
                <div>
                  <label htmlFor="university" className="block text-sm font-medium text-gray-700 mb-1">
                    高校名称
                  </label>
                  <input
                    id="university"
                    name="university"
                    type="text"
                    value={formData.university}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.university ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="请输入高校名称"
                  />
                  {errors.university && <p className="mt-1 text-sm text-red-600">{errors.university}</p>}
                </div>
                <div>
                  <label htmlFor="college" className="block text-sm font-medium text-gray-700 mb-1">
                    学院名称
                  </label>
                  <input
                    id="college"
                    name="college"
                    type="text"
                    value={formData.college}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.college ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="请输入学院名称"
                  />
                  {errors.college && <p className="mt-1 text-sm text-red-600">{errors.college}</p>}
                </div>
                <div>
                  <label htmlFor="research_field" className="block text-sm font-medium text-gray-700 mb-1">
                    研究领域
                  </label>
                  <input
                    id="research_field"
                    name="research_field"
                    type="text"
                    value={formData.research_field}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.research_field ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="请输入研究领域"
                  />
                  {errors.research_field && <p className="mt-1 text-sm text-red-600">{errors.research_field}</p>}
                </div>
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    职称
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="请输入职称"
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                </div>
              </>
            )}

            {/* Government Fields */}
            {role === USER_ROLES.GOVERNMENT && (
              <>
                <div>
                  <label htmlFor="government" className="block text-sm font-medium text-gray-700 mb-1">
                    政府部门名称
                  </label>
                  <input
                    id="government"
                    name="government"
                    type="text"
                    value={formData.government}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.government ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="请输入政府部门名称"
                  />
                  {errors.government && <p className="mt-1 text-sm text-red-600">{errors.government}</p>}
                </div>
                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                    区域
                  </label>
                  <input
                    id="region"
                    name="region"
                    type="text"
                    value={formData.region}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.region ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="请输入区域"
                  />
                  {errors.region && <p className="mt-1 text-sm text-red-600">{errors.region}</p>}
                </div>
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                    部门
                  </label>
                  <input
                    id="department"
                    name="department"
                    type="text"
                    value={formData.department}
                    onChange={handleChange}
                    className={`appearance-none relative block w-full px-3 py-2 border ${
                      errors.department ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="请输入部门"
                  />
                  {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
                </div>
              </>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="请输入密码（至少6位）"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                确认密码
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`appearance-none relative block w-full px-3 py-2 border ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="请再次输入密码"
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
