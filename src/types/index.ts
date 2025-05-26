// 用户相关类型
export interface User {
  id: string
  avatar?: string
  nickname: string
  phone: string
  email?: string
  gender?: 'male' | 'female' | 'other'
  birthday?: string
  registerTime: string
  lastLoginTime: string
  createdAt: string
  lastLoginAt: string
  loginCount?: number
  source?: string
  status: 'active' | 'disabled'
  remark?: string
  addresses?: Address[]
  remarks?: Array<{
    id: string
    content: string
    createdBy: string
    createdAt: string
  }>
  orderStats?: {
    totalOrders: number
    completedOrders: number
    totalAmount: number
    avgOrderAmount: number
  }
}

export interface Address {
  id: string
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  isDefault: boolean
  zipCode?: string // Added zipCode
}

// 商品相关类型
export interface Product {
  id: string
  title: string
  image: string
  categoryId: string
  categoryName: string
  price: number
  stock: number
  status: 'online' | 'offline'
  description?: string
  createTime: string
  updateTime: string
}

export interface ProductCategory {
  id: string
  name: string
  parentId?: string
  children?: ProductCategory[]
  level: number
}

// 订单相关类型
export interface Order {
  id: string
  orderNo: string // Added orderNo
  userId: string
  userNickname: string
  totalAmount: number
  subtotal?: number // Added subtotal, optional
  shippingFee?: number // Added shippingFee, optional
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'
  createTime: string
  createdAt: string // Added createdAt
  updatedAt: string // Added updatedAt
  paidAt?: string // Added paidAt, optional
  shippedAt?: string // Added shippedAt, optional
  paymentMethod?: string // Added paymentMethod, optional
  remark?: string
  shippingInfo?: ShippingInfo
  shippingAddress?: Address // Added shippingAddress, optional
  shipping?: OrderShippingDetails // Updated shipping type
  items: OrderItem[]
  remarks?: { // Added remarks as array of objects
    id: string;
    content: string;
    createdBy: string;
    createdAt: string;
  }[];
}

export interface OrderItem {
  id: string
  productId: string
  productTitle: string
  productImage: string
  price: number
  quantity: number
  totalPrice: number
}

export interface ShippingInfo {
  name: string
  phone: string
  address: string
  trackingNumber?: string
  shippedTime?: string
}

// Added interface for shipping details used in Order
export interface OrderShippingDetails {
  expressCompany: string;
  trackingNumber: string;
  remark?: string;
}

// 仪表盘数据类型
export interface DashboardStats {
  totalProducts: number
  todayOrders: number
  totalUsers: number
}

export interface OrderTrend {
  date: string
  count: number
}

// 分页相关类型
export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginationResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 登录相关类型
export interface LoginForm {
  username: string
  password: string
  rememberMe: boolean
}

export interface AdminUser {
  id: string
  username: string
  nickname: string
  avatar?: string
  permissions: string[]
  token: string
}