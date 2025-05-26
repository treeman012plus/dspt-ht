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
              <div class="stats-number">{{ dashboardStats.totalUsers }}</div>
              <div class="stats-label">注册用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 快捷操作 -->
    <el-row :gutter="20" class="quick-actions">
      <el-col :xs="24" :sm="12" :md="12" :lg="12">
        <el-card>
          <template #header>
            <span>快捷操作</span>
          </template>
          <div class="action-buttons">
            <el-button type="primary" @click="goToAddProduct">
              <el-icon><Plus /></el-icon>
              新增商品
            </el-button>
            <el-button type="success" @click="goToOrders">
              <el-icon><View /></el-icon>
              查看最新订单
            </el-button>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="12" :lg="12">
        <el-card>
          <template #header>
            <span>最新订单</span>
          </template>
          <div class="latest-orders">
            <div v-if="latestOrders.length === 0" class="no-data">
              暂无订单数据
            </div>
            <div v-else>
              <div
                v-for="order in latestOrders"
                :key="order.id"
                class="order-item"
                @click="goToOrderDetail(order.id)"
              >
                <div class="order-info">
                  <div class="order-no">订单号：{{ order.orderNo }}</div>
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
import * as dashboardApi from '@/api/dashboard'
import type { DashboardStats, OrderTrend } from '@/types'

const router = useRouter()
const chartRef = ref<HTMLElement>()
let chartInstance: ECharts | null = null

// 仪表盘数据
const dashboardStats = ref<DashboardStats>({
  totalProducts: 0,
  todayOrders: 0,
  totalUsers: 0
})

const orderTrend = ref<OrderTrend[]>([])
const latestOrders = ref<any[]>([])
const loading = ref(false)

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
const getOrderStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'warning',
    paid: 'info',
    shipped: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取订单状态文本
const getOrderStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待付款',
    paid: '待发货',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消'
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
  router.push(`/orders/${orderId}`)
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
  cursor: pointer;
  transition: all 0.3s;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stats-content {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.stats-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 24px;
  color: white;
}

.stats-icon.total-products {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stats-icon.today-orders {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stats-icon.total-users {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stats-info {
  flex: 1;
}

.stats-number {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  line-height: 1;
  margin-bottom: 5px;
}

.stats-label {
  font-size: 14px;
  color: #666;
}

.quick-actions {
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-buttons .el-button {
  flex: 1;
  min-width: 120px;
}

.latest-orders {
  max-height: 200px;
  overflow-y: auto;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 20px;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.order-item:hover {
  background-color: #f9f9f9;
}

.order-item:last-child {
  border-bottom: none;
}

.order-info {
  flex: 1;
}

.order-no {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.order-amount {
  font-size: 16px;
  font-weight: 600;
  color: #e6a23c;
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