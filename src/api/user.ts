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

// 更新用户状态 - 改为POST请求
export const updateUserStatus = (id: string, status: 'active' | 'disabled'): Promise<User> => {
  return api.post('/users/status', { userId: id, status })
}

// 修改用户密码
export const updateUserPassword = (userId: string, password: string): Promise<any> => {
  return api.post('/users/password', { userId, password })
}

// 添加用户备注
export const addUserRemark = (id: string, remark: string): Promise<User> => {
  return api.patch(`/users/${id}/remark`, { remark })
}

// 获取用户收货地址列表
export const getUserAddresses = (userId: string): Promise<any[]> => {
  return api.get(`/users/${userId}/addresses`)
}

// 获取用户订单统计
export const getUserOrderStats = (userId: string): Promise<any> => {
  return api.get(`/users/${userId}/order-stats`)
}