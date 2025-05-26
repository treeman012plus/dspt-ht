import api from './index'
import type { Product, ProductCategory, PaginationParams, PaginationResponse } from '@/types'

// 获取商品列表
export const getProducts = (params: PaginationParams & {
  keyword?: string
  categoryId?: string
  status?: string
}): Promise<PaginationResponse<Product>> => {
  return api.get('/products', { params })
}

// 获取商品详情
export const getProduct = (id: string): Promise<Product> => {
  return api.get(`/products/${id}`)
}

// 创建商品
export const createProduct = (data: Omit<Product, 'id' | 'createTime' | 'updateTime'>): Promise<Product> => {
  return api.post('/products', data)
}

// 更新商品
export const updateProduct = (id: string, data: Partial<Product>): Promise<Product> => {
  return api.put(`/products/${id}`, data)
}

// 删除商品
export const deleteProduct = (id: string): Promise<void> => {
  return api.delete(`/products/${id}`)
}

// 批量更新商品状态
export const batchUpdateProductStatus = (ids: string[], status: 'online' | 'offline'): Promise<void> => {
  return api.patch('/products/batch-status', { ids, status })
}

// 获取商品分类
export const getCategories = (): Promise<ProductCategory[]> => {
  return api.get('/categories')
}

// 创建分类
export const createCategory = (data: Omit<ProductCategory, 'id' | 'children'>): Promise<ProductCategory> => {
  return api.post('/categories', data)
}

// 更新分类
export const updateCategory = (id: string, data: Partial<ProductCategory>): Promise<ProductCategory> => {
  return api.put(`/categories/${id}`, data)
}

// 删除分类
export const deleteCategory = (id: string): Promise<void> => {
  return api.delete(`/categories/${id}`)
}

// 上传图片
export const uploadImage = (file: File): Promise<{ url: string }> => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}