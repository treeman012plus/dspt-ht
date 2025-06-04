import axios from 'axios'
import type { AxiosResponse, AxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types'

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  // 处理Long类型精度问题
  transformResponse: [
    function (data) {
      if (typeof data === 'string') {
        try {
          // 使用正则表达式将大整数转换为字符串，避免精度丢失
          return JSON.parse(data.replace(/:\s*(\d{16,})/g, ': "$1"'))
        } catch (e) {
          return data
        }
      }
      return data
    }
  ]
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加token
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, message, data } = response.data
    
    if (code === 200) {
      return data
    } else if (code === 401) {
      // 未授权，清除token并跳转登录
      localStorage.removeItem('admin_token')
      localStorage.removeItem('token_expire')
      // 避免在登录页面重复跳转
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
        ElMessage.error('登录已过期，请重新登录')
      }
      return Promise.reject(new Error(message))
    } else {
      ElMessage.error(message || '请求失败')
      return Promise.reject(new Error(message))
    }
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('token_expire')
      // 避免在登录页面重复跳转
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
        ElMessage.error('登录已过期，请重新登录')
      }
    } else {
      ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default api