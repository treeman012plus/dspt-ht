import api from './index'
import type { DashboardStats, OrderTrend } from '@/types'

// 获取仪表盘统计数据
export const getDashboardStats = (): Promise<DashboardStats> => {
  return api.get('/dashboard/stats')
}

// 获取近7天订单趋势
export const getOrderTrend = (days: number = 7): Promise<OrderTrend[]> => {
  return api.get('/dashboard/order-trend', { params: { days } })
}

// 获取最新订单
export const getLatestOrders = (limit: number = 5): Promise<any[]> => {
  return api.get('/dashboard/latest-orders', { params: { limit } })
}