import api from './index'
import type { LoginForm, AdminUser } from '@/types'

// 登录
export const login = (data: LoginForm): Promise<AdminUser> => {
  return api.post('/auth/login', data)
}

// 获取当前用户信息
export const getCurrentUser = (): Promise<AdminUser> => {
  return api.get('/auth/me')
}

// 登出
export const logout = (): Promise<void> => {
  return api.post('/auth/logout')
}