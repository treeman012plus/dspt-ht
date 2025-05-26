import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import type { AdminUser, LoginForm } from '@/types'
import * as authApi from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AdminUser | null>(null)
  const token = ref<string | null>(localStorage.getItem('admin_token'))
  const rememberMe = ref<boolean>(localStorage.getItem('remember_me') === 'true')

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  // 登录
  const login = async (loginForm: LoginForm) => {
    try {
      const userData = await authApi.login(loginForm)
      user.value = userData
      token.value = userData.token
      
      // 保存token
      localStorage.setItem('admin_token', userData.token)
      
      // 处理记住我功能
      if (loginForm.rememberMe) {
        localStorage.setItem('remember_me', 'true')
        // 设置一年后过期
        const expireTime = Date.now() + 365 * 24 * 60 * 60 * 1000
        localStorage.setItem('token_expire', expireTime.toString())
      } else {
        localStorage.removeItem('remember_me')
        localStorage.removeItem('token_expire')
      }
      
      ElMessage.success('登录成功')
      return userData
    } catch (error) {
      throw error
    }
  }

  // 登出
  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      user.value = null
      token.value = null
      localStorage.removeItem('admin_token')
      localStorage.removeItem('remember_me')
      localStorage.removeItem('token_expire')
      ElMessage.success('已退出登录')
    }
  }

  // 获取当前用户信息
  const getCurrentUser = async () => {
    try {
      const userData = await authApi.getCurrentUser()
      user.value = userData
      return userData
    } catch (error) {
      // 获取用户信息失败，清除本地数据
      user.value = null
      token.value = null
      localStorage.removeItem('admin_token')
      throw error
    }
  }

  // 检查token是否过期
  const checkTokenExpire = () => {
    const expireTime = localStorage.getItem('token_expire')
    const rememberMeFlag = localStorage.getItem('remember_me')
    
    if (rememberMeFlag === 'true' && expireTime) {
      const now = Date.now()
      if (now > parseInt(expireTime)) {
        // token已过期
        logout()
        return false
      }
    }
    return true
  }

  // 初始化认证状态
  const initAuth = async () => {
    if (token.value && checkTokenExpire()) {
      try {
        await getCurrentUser()
      } catch (error) {
        console.error('初始化认证失败:', error)
      }
    }
  }

  return {
    user,
    token,
    isLoggedIn,
    login,
    logout,
    getCurrentUser,
    checkTokenExpire,
    initAuth
  }
})