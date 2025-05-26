import api from './index'
import type { Order, PaginationParams, PaginationResponse } from '@/types'

// 获取订单列表
export const getOrders = (params: PaginationParams & {
  orderNo?: string
  userId?: string
  status?: string
}): Promise<PaginationResponse<Order>> => {
  return api.get('/orders', { params })
}

// 获取订单详情
export const getOrder = (id: string): Promise<Order> => {
  return api.get(`/orders/${id}`)
}

// 更新订单状态
export const updateOrderStatus = (id: string, status: Order['status'], remark?: string): Promise<Order> => {
  return api.patch(`/orders/${id}/status`, { status, remark })
}

// 发货
export const shipOrder = (id: string, data: { expressCompany: string; trackingNumber: string; remark?: string }): Promise<Order> => {
  return api.patch(`/orders/${id}/ship`, data)
}

// 取消订单
export const cancelOrder = (id: string, reason: string): Promise<Order> => {
  return api.patch(`/orders/${id}/cancel`, { reason })
}

// 添加订单备注
export const addOrderRemark = (id: string, remark: string): Promise<Order> => {
  return api.patch(`/orders/${id}/remark`, { remark })
}