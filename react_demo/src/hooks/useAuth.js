import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../stores/userStore'
import { authAPI } from '../services/api'
import wsService from '../services/websocket'

const useAuth = () => {
  const navigate = useNavigate()
  const { user, token, isAuthenticated, login: storeLogin, logout: storeLogout, updateUser } = useUserStore()

  const login = useCallback(async (email, password) => {
    try {
      const response = await authAPI.login({ email, password })
      const { user: userData, token: authToken } = response.data
      storeLogin(userData, authToken)
      wsService.connect(authToken)

      // Navigate based on role
      if (userData.role === 'enterprise') {
        navigate('/jobs')
      } else if (userData.role === 'government') {
        navigate('/innovation-dynamics')
      } else {
        navigate('/')
      }
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || '登录失败'
      }
    }
  }, [storeLogin, navigate])

  const register = useCallback(async (userData) => {
    try {
      const response = await authAPI.register(userData)
      const { user: newUser, token: authToken } = response.data
      storeLogin(newUser, authToken)
      wsService.connect(authToken)
      navigate('/')
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || '注册失败'
      }
    }
  }, [storeLogin, navigate])

  const logout = useCallback(() => {
    wsService.disconnect()
    storeLogout()
    navigate('/login')
  }, [storeLogout, navigate])

  const updateProfile = useCallback(async (data) => {
    try {
      const response = await authAPI.updateProfile(data)
      updateUser(response.data)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || '更新失败'
      }
    }
  }, [updateUser])

  return {
    user,
    token,
    isAuthenticated,
    isStudent: user?.role === 'student',
    isEnterprise: user?.role === 'enterprise',
    login,
    register,
    logout,
    updateProfile
  }
}

export default useAuth
