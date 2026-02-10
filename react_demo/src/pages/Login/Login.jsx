import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useUserStore from '../../stores/userStore'
import { authAPI } from '../../services/api'
import wsService from '../../services/websocket'
import { validateEmail } from '../../utils/helpers'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useUserStore()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
    if (!formData.email) {
      newErrors.email = '请输入邮箱'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址'
    }
    if (!formData.password) {
      newErrors.password = '请输入密码'
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少6位'
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
      const response = await authAPI.login(formData)
      const { user, token } = response.data
      console.log('[Login] 登录成功, token:', token?.substring(0, 30) + '...')
      console.log('[Login] 用户角色:', user?.role)

      login(user, token)

      // 验证 token 是否保存成功
      setTimeout(() => {
        const saved = localStorage.getItem('user-storage')
        console.log('[Login] 保存后的storage:', saved ? JSON.parse(saved)?.state?.token?.substring(0, 30) + '...' : 'null')
      }, 100)

      wsService.connect(token)

      // 根据角色跳转到不同页面
      if (user.role === 'enterprise') {
        navigate('/jobs')
      } else if (user.role === 'government') {
        navigate('/dashboard')
      } else {
        navigate('/')
      }
    } catch (error) {
      setApiError(error.response?.data?.message || '登录失败，请检查邮箱和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white border-2 border-gray-300 shadow-sm">
        <div className="bg-blue-900 text-white py-6 px-8 border-b-4 border-blue-800">
          <h2 className="text-2xl font-bold text-center">
            用户登录
          </h2>
        </div>

        <form className="py-8 px-8 space-y-6" onSubmit={handleSubmit}>
          {apiError && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 text-sm">
              {apiError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border-2 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } text-gray-900 focus:outline-none focus:border-blue-900 bg-white`}
                placeholder="请输入邮箱"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 border-2 ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } text-gray-900 focus:outline-none focus:border-blue-900 bg-white`}
                placeholder="请输入密码"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 border-2 border-blue-900 text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </div>

          <div className="text-center text-sm">
            还没有账号？{' '}
            <Link to="/register" className="font-medium text-blue-900 hover:text-blue-700 underline">
              立即注册
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
