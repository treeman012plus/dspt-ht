<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="8" :md="8" :lg="8">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon total-products">
              <el-icon><Goods /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ dashboardStats.totalProducts }}</div>
              <div class="stats-label">总商品数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="8" :md="8" :lg="8">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon today-orders">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ dashboardStats.todayOrders }}</div>
              <div class="stats-label">今日订单量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="8" :md="8" :lg="8">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon total-users">
              <el-icon><User /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ dashboardStats.totalUser }}</div>
              <div class="stats-label">注册用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 快捷操作和数据概览 -->
    <el-row :gutter="20" class="quick-actions">
      <el-col :xs="24" :sm="12" :md="8" :lg="8">
        <el-card class="quick-action-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Operation /></el-icon>
              <span>快捷操作</span>
            </div>
          </template>
          <div class="action-buttons">
            <el-button type="primary" @click="goToAddProduct" class="action-btn">
              <el-icon><Plus /></el-icon>
              新增商品
            </el-button>
            <el-button type="success" @click="goToOrders" class="action-btn">
              <el-icon><View /></el-icon>
              查看订单
            </el-button>
            <el-button type="warning" @click="goToUsers" class="action-btn">
              <el-icon><User /></el-icon>
              用户管理
            </el-button>
            <el-button type="info" @click="goToCategories" class="action-btn">
              <el-icon><Menu /></el-icon>
              分类管理
            </el-button>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="8" :lg="8">
        <el-card class="latest-orders-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Document /></el-icon>
              <span>最新订单</span>
            </div>
          </template>
          <div class="latest-orders">
            <div v-if="latestOrders.length === 0" class="no-data">
              <el-icon class="no-data-icon"><DocumentRemove /></el-icon>
              <p>暂无订单数据</p>
            </div>
            <div v-else>
              <div
                v-for="order in latestOrders"
                :key="order.orderId"
                class="order-item"
                @click="goToOrderDetail(order.orderId)"
              >
                <div class="order-info">
                  <div class="order-no">订单号：{{ order.orderId }}</div>
                  <div class="order-amount">¥{{ order.totalAmount }}</div>
                </div>
                <div class="order-status">
                  <el-tag :type="getOrderStatusType(order.status)">{{ getOrderStatusText(order.status) }}</el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="8" :lg="8">
        <el-card class="system-info-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Monitor /></el-icon>
              <span>系统概览</span>
            </div>
          </template>
          <div class="system-info">
            <div class="info-item">
              <div class="info-label">
                <el-icon><Clock /></el-icon>
                系统运行时间
              </div>
              <div class="info-value">{{ systemUptime }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">
                <el-icon><Calendar /></el-icon>
                今日访问量
              </div>
              <div class="info-value">{{ todayVisits }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">
                <el-icon><TrendCharts /></el-icon>
                本月销售额
              </div>
              <div class="info-value">¥{{ monthlyRevenue }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">
                <el-icon><Star /></el-icon>
                平均评分
              </div>
              <div class="info-value">{{ averageRating }}/5.0</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 订单趋势图表 -->
    <el-row>
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>近7天订单趋势</span>
          </template>
          <div ref="chartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import { ElMessage } from 'element-plus'
import { Plus, View, User, Menu, Operation, Document, DocumentRemove, Monitor, Clock, Calendar, TrendCharts, Star, Goods } from '@element-plus/icons-vue'
import * as dashboardApi from '@/api/dashboard'
import type { DashboardStats, OrderTrend } from '@/types'

const router = useRouter()
const chartRef = ref<HTMLElement>()
let chartInstance: ECharts | null = null

// 仪表盘数据
const dashboardStats = ref<DashboardStats>({
  totalProducts: 0,
  todayOrders: 0,
  totalUser: 0
})

const orderTrend = ref<OrderTrend[]>([])
const latestOrders = ref<any[]>([])
const loading = ref(false)

// 系统信息数据
const systemUptime = ref('7天12小时')
const todayVisits = ref(1234)
const monthlyRevenue = ref(45678)
const averageRating = ref(4.8)

// 获取仪表盘数据
const fetchDashboardData = async () => {
  try {
    loading.value = true
    const [statsData, trendData, ordersData] = await Promise.all([
      dashboardApi.getDashboardStats(),
      dashboardApi.getOrderTrend(7),
      dashboardApi.getLatestOrders(5)
    ])
    
    dashboardStats.value = statsData
    orderTrend.value = trendData
    latestOrders.value = ordersData
    
    // 渲染图表
    await nextTick()
    renderChart()
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 渲染订单趋势图表
const renderChart = () => {
  if (!chartRef.value) return
  
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  chartInstance = echarts.init(chartRef.value)
  
  const option = {
    title: {
      text: '订单趋势',
      left: 'center',
      textStyle: {
        fontSize: 16,
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>订单数量: {c}'
    },
    xAxis: {
      type: 'category',
      data: orderTrend.value.map(item => item.date),
      axisLabel: {
        formatter: (value: string) => {
          const date = new Date(value)
          return `${date.getMonth() + 1}/${date.getDate()}`
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '订单数量'
    },
    series: [
      {
        data: orderTrend.value.map(item => item.count),
        type: 'line',
        smooth: true,
        itemStyle: {
          color: '#409eff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ]
          }
        }
      }
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    }
  }
  
  chartInstance.setOption(option)
  
  // 响应式调整
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
}

// 获取订单状态类型
const getOrderStatusType = (status: string | number) => {
  // 处理数字状态
  if (typeof status === 'number') {
    const numberStatusMap: Record<number, string> = {
      0: 'warning',  // 待付款
      1: 'info',     // 待发货
      2: 'primary',  // 已发货
      3: 'success',  // 已完成
      4: 'danger',   // 已取消
      5: 'warning'   // 已退款
    }
    return numberStatusMap[status] || 'info'
  }
  
  // 处理字符串状态
  const statusMap: Record<string, string> = {
    pending: 'warning',
    paid: 'info',
    shipped: 'primary',
    completed: 'success',
    cancelled: 'danger',
    refunded: 'warning'
  }
  return statusMap[status] || 'info'
}

// 获取订单状态文本
const getOrderStatusText = (status: string | number) => {
  // 处理数字状态
  if (typeof status === 'number') {
    const numberStatusMap: Record<number, string> = {
      0: '待付款',
      1: '待发货',
      2: '已发货',
      3: '已完成',
      4: '已取消',
      5: '已退款'
    }
    return numberStatusMap[status] || '未知状态'
  }
  
  // 处理字符串状态
  const statusMap: Record<string, string> = {
    pending: '待付款',
    paid: '待发货',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款'
  }
  return statusMap[status] || status
}

// 跳转到新增商品页面
const goToAddProduct = () => {
  router.push('/products/add')
}

// 跳转到订单列表
const goToOrders = () => {
  router.push('/orders')
}

// 跳转到订单详情
const goToOrderDetail = (orderId: string) => {
  // 找到对应的订单数据
  const order = latestOrders.value.find(o => o.orderId === orderId)
  if (!order) {
    router.push(`/orders/${orderId}`)
    return
  }
  
  console.log('查看订单详情：', order.orderId)
  console.log('传递的订单数据：', order)
  
  // 创建一个可序列化的订单数据副本，避免DataCloneError
  const serializableOrderData = {
    id: order.orderId,
    orderId: order.orderId,
    orderNo: order.orderId,
    userId: order.userId,
    totalAmount: order.totalAmount,
    status: order.status,
    paymentMethod: order.paymentMethod,
    orderTime: order.orderTime,
    createdAt: order.orderTime,
    paidAt: order.status >= 1 ? order.orderTime : null,
    shippedAt: order.status >= 2 ? order.orderTime : null,
    shippingAddress: order.shippingAddress ? {
      receiver: order.shippingAddress.receiver,
      name: order.shippingAddress.receiver,
      phone: order.shippingAddress.phone,
      provinceName: order.shippingAddress.provinceName,
      cityName: order.shippingAddress.cityName,
      districtName: order.shippingAddress.districtName,
      detailAddress: order.shippingAddress.detailAddress,
      address: order.shippingAddress.detailAddress
    } : null,
    items: [], // 仪表盘数据中没有商品明细，留空
    shipping: null,
    remarks: []
  }
  
  console.log('补充后的订单数据：', serializableOrderData)
  
  // 通过路由导航到详情页
  router.push(`/orders/${orderId}`).then(() => {
    // 导航成功后，将订单数据存储到history.state中
    history.replaceState({ ...history.state, orderData: serializableOrderData }, '')
    console.log('已将订单数据存储到history.state:', serializableOrderData)
  })
}

// 跳转到用户管理
const goToUsers = () => {
  router.push('/users')
}

// 跳转到分类管理
const goToCategories = () => {
  router.push('/categories')
}

onMounted(() => {
  fetchDashboardData()
})

// 组件卸载时销毁图表实例
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
  window.removeEventListener('resize', () => {
    chartInstance?.resize()
  })
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
}

.stats-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15);
}

.stats-content {
  display: flex;
  align-items: center;
  padding: 24px;
  position: relative;
}

.stats-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient);
}

.stats-icon {
  width: 70px;
  height: 70px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24px;
  font-size: 28px;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.stats-icon.total-products {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stats-icon.today-orders {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stats-icon.total-users {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  --gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stats-info {
  flex: 1;
}

.stats-number {
  font-size: 36px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stats-label {
  font-size: 15px;
  color: #7f8c8d;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.quick-actions {
  margin-bottom: 30px;
}

.quick-action-card,
.latest-orders-card,
.system-info-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
}

.quick-action-card:hover,
.latest-orders-card:hover,
.system-info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #2c3e50;
}

.header-icon {
  margin-right: 8px;
  font-size: 18px;
  color: #3498db;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action-btn {
  border-radius: 10px;
  font-weight: 500;
  padding: 12px 16px;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.system-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.info-item:hover {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  transform: translateX(4px);
}

.info-label {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
}

.info-label .el-icon {
  margin-right: 8px;
  color: #3498db;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.latest-orders {
  max-height: 320px;
  overflow-y: auto;
  overflow-x: hidden;
}

.no-data {
  text-align: center;
  color: #6c757d;
  padding: 40px 0;
  font-size: 14px;
}

.no-data-icon {
  font-size: 48px;
  color: #dee2e6;
  margin-bottom: 12px;
}

.no-data p {
  margin: 0;
  font-weight: 500;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.order-item:hover {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  transform: translateX(4px);
  border-color: #3498db;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
}

.order-item:last-child {
  margin-bottom: 0;
}

.order-info {
  flex: 1;
}

.order-no {
  font-size: 14px;
  color: #495057;
  margin-bottom: 6px;
  font-weight: 500;
}

.order-amount {
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.chart-container {
  width: 100%;
  height: 400px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-row .el-col {
    margin-bottom: 15px;
  }
  
  .quick-actions .el-col {
    margin-bottom: 15px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
  
  .chart-container {
    height: 300px;
  }
}
</style>