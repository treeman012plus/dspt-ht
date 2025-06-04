import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import type { AdminUser, LoginForm } from '@/types'
import * as authApi from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AdminUser | null>(null)
  const token = ref<string | null>(localStorage.getItem('admin_token'))

  const isLoggedIn = computed(() => !!token.value)

  // 登录
  const login = async (loginForm: LoginForm) => {
    try {
      const tokenData = await authApi.login(loginForm)
      token.value = tokenData
      
      // 保存token
      localStorage.setItem('admin_token', tokenData)
      
      // 设置7天后过期
      const expireTime = Date.now() + 7 * 24 * 60 * 60 * 1000
      localStorage.setItem('token_expire', expireTime.toString())
      
      // 获取用户信息 - 暂时注释掉，因为后端可能没有提供/auth/me接口
      // await getCurrentUser()
      
      ElMessage.success('登录成功')
      return tokenData
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

  // 检查token是否过期（仅检查，不执行logout）
  const checkTokenExpire = () => {
    // 如果没有token，直接返回false
    if (!token.value) {
      return false
    }
    
    const expireTime = localStorage.getItem('token_expire')
    
    if (expireTime) {
      const now = Date.now()
      if (now > parseInt(expireTime)) {
        // token已过期
        return false
      }
    } else {
      // 没有过期时间记录但有token，重新设置7天过期时间
      const newExpireTime = Date.now() + 7 * 24 * 60 * 60 * 1000
      localStorage.setItem('token_expire', newExpireTime.toString())
      console.log('重新设置token过期时间')
    }
    return true
  }

  // 检查token是否过期并执行相应操作
  const checkTokenExpireAndLogout = async () => {
    if (!checkTokenExpire()) {
      await logout()
      return false
    }
    return true
  }

  // 清除token（不显示消息）
  const clearToken = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('admin_token')
    localStorage.removeItem('token_expire')
  }

  // 初始化认证状态
  const initAuth = async () => {
    if (token.value) {
      // 应用启动时只检查token是否存在，不执行自动登出
      // 让路由守卫来处理token过期的情况
      console.log('Token已存在，认证状态已初始化')
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
    checkTokenExpireAndLogout,
    clearToken,
    initAuth
  }
})