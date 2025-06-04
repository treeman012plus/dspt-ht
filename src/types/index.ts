// 用户相关类型
export interface User {
  id: string | number
  avatar?: string
  avatarUrl?: string
  nickname: string
  phone: string
  password?: string
  status: 'active' | 'disabled' | number
  createTime?: string
  createdAt?: string
  latestTime?: string
  lastLoginAt?: string
  addresses?: Address[]
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
  tag?: string // Added tag for address label
}

// 商品相关类型
export interface Product {
  id: string
  goodId?: number // 后端商品ID
  title: string
  goodName?: string // 后端商品名称
  image: string
  coverUrl?: string // 后端封面图URL
  categoryId: string
  categoryName: string
  price: number
  stock: number
  description?: string
  createTime: string
  updateTime: string
  createdAt?: string // 后端创建时间
}

export interface ProductCategory {
  id: string
  name: string
}

// API响应的分类类型（用于数据映射）
export interface ApiProductCategory {
  categoryId: string
  categoryName: string
}

// 订单相关类型
export interface Order {
  id?: string
  orderId: string // 使用string类型避免Long精度丢失
  orderNo?: string // Added orderNo
  userId: string | number
  userNickname?: string
  totalAmount: number
  subtotal?: number // Added subtotal, optional
  shippingFee?: number // Added shippingFee, optional
  itemsAmount?: number // 商品金额
  goodsAmount?: number // 商品金额（备用字段）
  deliveryAmount?: number // 配送费用
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'refunded' | number
  orderTime?: string // 后端返回的创建时间字段
  createTime?: string
  createdAt?: string // Added createdAt
  paidAt?: string // Added paidAt, optional
  shippedAt?: string // Added shippedAt, optional
  paymentMethod?: string // Added paymentMethod, optional
  remark?: string
  shippingInfo?: ShippingInfo
  shippingAddress?: {
    phone: string;
    cityName: string;
    receiver: string;
    name?: string; // 添加name属性
    districtName: string;
    provinceName: string;
    detailAddress: string;
    address?: string; // 添加address属性
  } | null // 匹配后端返回的收货地址结构，允许null值
  shipping?: OrderShippingDetails // Updated shipping type
  items?: {
    itemId: number;
    good: {
      goodId: number;
      goodName: string;
      description: string;
      price: number;
      stock: number;
      categoryId: number;
      coverUrl: string;
      createdAt: string;
    };
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[]
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
  shippedAt?: string; // 发货时间
}

// 仪表盘数据类型
export interface DashboardStats {
  totalProducts: number
  todayOrders: number
  totalUser: number
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
  data?: T[]
  records?: T[]
  total: number
  page?: number
  pageSize?: number
  current?: number
  size?: number
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 订单列表API响应类型
export interface OrderListResponse {
  code: number
  message: string
  data: {
    records: Order[]
    total: number
    size: number
    current: number
    orders?: any[]
    optimizeCountSql?: boolean
    searchCount?: boolean
    maxLimit?: number
  }
}

// 登录相关类型
export interface LoginForm {
  username: string
  password: string
}

export interface AdminUser {
  id: string
  username: string
  nickname: string
  avatar?: string
  permissions: string[]
  token: string
}

// 优惠券相关类型
export interface Coupon {
  id: string | number
  title: string
  type: 1 | 2 // 1-满减 2-折扣
  value: number // 面值（满减金额/折扣率）
  minAmount: number // 最低使用金额
  startTime: string // 有效期开始
  endTime: string // 有效期结束
  total: number // 发放总量（库存）
  createTime?: string
  updateTime?: string
}

// 优惠券表单类型
export interface CouponForm {
  title: string
  type: 1 | 2
  value: number
  minAmount: number
  startTime: string
  endTime: string
  total: number
}