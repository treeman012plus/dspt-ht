import api from './index'
import type { Coupon, CouponForm, PaginationParams, PaginationResponse } from '@/types'

// 获取优惠券列表
export const getCoupons = (params: PaginationParams & {
  title?: string
  type?: string
  status?: string // 'active' | 'expired' | 'all'
}): Promise<PaginationResponse<Coupon>> => {
  return api.get('/coupons', { params })
}

// 获取优惠券详情
export const getCoupon = (id: string | number): Promise<Coupon> => {
  return api.get(`/coupons/${id}`)
}

// 创建优惠券
export const createCoupon = (data: CouponForm): Promise<Coupon> => {
  return api.post('/coupons', data)
}

// 更新优惠券
export const updateCoupon = (id: string | number, data: Partial<CouponForm>): Promise<Coupon> => {
  return api.put(`/coupons/${id}`, data)
}

// 删除优惠券
export const deleteCoupon = (id: string | number): Promise<void> => {
  return api.delete(`/coupons/${id}`)
}

// 批量删除优惠券
export const deleteCoupons = (ids: (string | number)[]): Promise<void> => {
  return api.delete('/coupons/batch', { data: { ids } })
}