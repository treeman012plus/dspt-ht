import api from './index'
import type { User, PaginationParams, PaginationResponse } from '@/types'

// 获取用户列表
export const getUsers = (params: PaginationParams & {
  keyword?: string
  phone?: string
}): Promise<PaginationResponse<User>> => {
  return api.get('/users', { params })
}

// 获取用户详情
export const getUser = (id: string): Promise<User> => {
  return api.get(`/users/${id}`)
}

// 更新用户状态
export const updateUserStatus = (id: string, status: 'active' | 'disabled'): Promise<User> => {
  return api.patch(`/users/${id}/status`, { status })
}

// 添加用户备注
export const addUserRemark = (id: string, remark: string): Promise<User> => {
  return api.patch(`/users/${id}/remark`, { remark })
}