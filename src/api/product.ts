import api from './index'
import type { Product, ProductCategory, ApiProductCategory, PaginationParams, PaginationResponse } from '@/types'

// 获取商品列表
export const getProducts = (params: (PaginationParams | { current: number; size: number }) & {
  keyword?: string
  productId?: string
  categoryId?: string
  minPrice?: string
  maxPrice?: string
}): Promise<PaginationResponse<Product>> => {
  return api.get('/products', { params })
}

// 获取商品详情
export const getProduct = (id: string): Promise<Product> => {
  return api.get(`/products/${id}`)
}

// 创建商品
export const createProduct = (data: Omit<Product, 'id' | 'createTime' | 'updateTime' | 'goodId' | 'createdAt'>): Promise<Product> => {
  // 将前端字段映射到后端字段
  const backendData = {
    goodName: data.title,
    description: data.description,
    price: data.price,
    stock: data.stock,
    categoryId: data.categoryId,
    coverUrl: data.image
  }
  return api.post('/products', backendData)
}

// 更新商品
export const updateProduct = (id: string, data: Partial<Product>): Promise<Product> => {
  // 将前端字段映射到后端字段
  const backendData: any = {}
  if (data.title) backendData.goodName = data.title
  if (data.description !== undefined) backendData.description = data.description
  if (data.price !== undefined) backendData.price = data.price
  if (data.stock !== undefined) backendData.stock = data.stock
  if (data.categoryId) backendData.categoryId = data.categoryId
  if (data.image) backendData.coverUrl = data.image
  
  return api.put(`/products/${id}`, backendData)
}

// 删除商品
export const deleteProduct = (id: string): Promise<void> => {
  return api.delete(`/products/${id}`)
}



// 获取商品分类
export const getCategories = (): Promise<ApiProductCategory[]> => {
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