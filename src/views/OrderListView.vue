<template>
  <div class="order-list-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>订单管理</h2>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="订单号">
          <el-input
            v-model="searchForm.orderId"
            placeholder="请输入订单号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="用户ID">
          <el-input
            v-model="searchForm.userId"
            placeholder="请输入用户ID"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="订单状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option label="全部" value="" />
            <el-option label="待付款" value="0" />
            <el-option label="待发货" value="1" />
            <el-option label="已发货" value="2" />
            <el-option label="已完成" value="3" />
            <el-option label="已取消" value="4" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单列表 -->
    <el-card>
      <el-table 
        :data="orderList" 
        :loading="loading" 
        border
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="orderId" label="订单号" width="200" />
        
        <el-table-column prop="userId" label="用户ID" width="120" />
        
        <el-table-column prop="totalAmount" label="订单金额" width="120">
          <template #default="{ row }">
            <span class="amount">{{ formatPrice(row.totalAmount) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="订单状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="orderTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.orderTime) }}
          </template>
        </el-table-column>
        
        <el-table-column label="支付方式" width="120">
          <template #default="{ row }">
            {{ getPaymentMethodText(row.paymentMethod) }}
          </template>
        </el-table-column>
        
        <el-table-column label="收货人" width="120">
          <template #default="{ row }">
            {{ row.shippingAddress?.receiver || '-' }}
          </template>
        </el-table-column>
        
        <el-table-column label="收货地址" width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.shippingAddress">
              {{ row.shippingAddress.provinceName }}
              {{ row.shippingAddress.cityName }}
              {{ row.shippingAddress.districtName }}
              {{ row.shippingAddress.detailAddress }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="handleViewDetail(row)"
            >
              查看详情
            </el-button>
            
            <el-button
              v-if="row.status === 1"
              type="success"
              size="small"
              link
              @click="handleShip(row)"
            >
              发货
            </el-button>
            
            <el-button
              v-if="[0, 1].includes(row.status)"
              type="danger"
              size="small"
              link
              @click="handleCancel(row)"
            >
              取消订单
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页组件 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalCount"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 发货对话框 -->
    <el-dialog
      v-model="shipDialogVisible"
      title="订单发货"
      width="500px"
      @close="resetShipForm"
    >
      <el-form
        ref="shipFormRef"
        :model="shipForm"
        :rules="shipRules"
        label-width="100px"
      >
        <el-form-item label="订单号">
          <el-input :value="currentOrder?.orderId" disabled />
        </el-form-item>
        
        <el-form-item label="物流公司" prop="expressCompany">
          <el-select
            v-model="shipForm.expressCompany"
            placeholder="请选择物流公司"
            style="width: 100%"
          >
            <el-option label="顺丰速运" value="SF" />
            <el-option label="圆通速递" value="YTO" />
            <el-option label="中通快递" value="ZTO" />
            <el-option label="申通快递" value="STO" />
            <el-option label="韵达速递" value="YD" />
            <el-option label="百世快递" value="BEST" />
            <el-option label="德邦快递" value="DBL" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="快递单号" prop="trackingNumber">
          <el-input
            v-model="shipForm.trackingNumber"
            placeholder="请输入快递单号"
            maxlength="30"
          />
        </el-form-item>
        
        <el-form-item label="发货备注">
          <el-input
            v-model="shipForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入发货备注（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="shipDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="shipping" @click="handleConfirmShip">
          {{ shipping ? '发货中...' : '确认发货' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import * as orderApi from '@/api/order'
import { formatDate, formatPrice } from '@/utils'
import type { Order } from '@/types'

const router = useRouter()

// 响应式数据
const orderList = ref<Order[]>([])
const loading = ref(false)
const shipDialogVisible = ref(false)
const shipping = ref(false)
const currentOrder = ref<Order | null>(null)

// 分页数据
const currentPage = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)

// 搜索表单
const searchForm = reactive({
  orderId: '',
  userId: '',
  status: '',
  dateRange: [] as string[]
})

// 发货表单
const shipForm = reactive({
  expressCompany: '',
  trackingNumber: '',
  remark: ''
})

const shipFormRef = ref<FormInstance>()

// 发货表单验证规则
const shipRules: FormRules = {
  expressCompany: [
    { required: true, message: '请选择物流公司', trigger: 'change' }
  ],
  trackingNumber: [
    { required: true, message: '请输入快递单号', trigger: 'blur' },
    { min: 5, max: 30, message: '快递单号长度在 5 到 30 个字符', trigger: 'blur' }
  ]
}

// 获取订单状态类型
const getStatusType = (status: number) => {
  const typeMap: Record<number, string> = {
    0: 'warning',  // 待付款
    1: 'info',     // 待发货
    2: 'primary',  // 已发货
    3: 'success',  // 已完成
    4: 'danger',   // 已取消
    5: 'warning'   // 已退款
  }
  return typeMap[status] || 'info'
}

// 获取订单状态文本
const getStatusText = (status: number) => {
  const textMap: Record<number, string> = {
    0: '待付款',
    1: '待发货',
    2: '已发货',
    3: '已完成',
    4: '已取消',
    5: '已退款'
  }
  return textMap[status] || '未知状态'
}

// 获取支付方式文本
const getPaymentMethodText = (paymentMethod: string | null) => {
  if (!paymentMethod) return '未设置'
  const methodMap: Record<string, string> = {
    'alipay': '支付宝',
    'wechat': '微信支付',
    'bank': '银行卡',
    'cash': '现金'
  }
  return methodMap[paymentMethod] || paymentMethod
}

// 获取订单列表
const fetchOrders = async () => {
  try {
    loading.value = true
    console.log('开始获取订单列表，参数：', {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...searchForm
    })
    
    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    
    // 添加搜索条件
    if (searchForm.orderId) {
      params.orderId = searchForm.orderId
    }
    if (searchForm.userId) {
      params.userId = searchForm.userId
    }
    if (searchForm.status !== '') {
      params.status = searchForm.status
    }
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    
    const response = await orderApi.getOrders(params)
    console.log('API响应：', response)
    console.log('response类型：', typeof response)
    console.log('response.data：', response?.data)
    
    // 处理API响应数据
    let data = null
    if (response?.data) {
      data = response.data
    } else if (response?.records) {
      // 直接返回分页数据的情况
      data = response
    } else if (Array.isArray(response)) {
      // 直接返回数组的情况
      data = response
    } else {
      console.warn('无法识别的响应格式：', response)
      orderList.value = []
      totalCount.value = 0
      return
    }
    
    console.log('处理后的data：', data)
    
    // 处理分页数据结构
    if (data.records && Array.isArray(data.records)) {
      // 标准分页格式
      orderList.value = [...data.records]
      totalCount.value = data.total || data.totalCount || data.records.length
      console.log('使用标准分页格式，订单数量：', orderList.value.length, '总数：', totalCount.value)
    } else if (Array.isArray(data)) {
      // 直接返回数组
      orderList.value = [...data]
      totalCount.value = data.length
      console.log('使用数组格式，订单数量：', orderList.value.length)
    } else {
      console.warn('未知的数据格式：', data)
      orderList.value = []
      totalCount.value = 0
    }
    
    console.log('最终订单列表：', orderList.value)
  } catch (error) {
    console.error('获取订单列表失败：', error)
    ElMessage.error('获取订单列表失败')
    orderList.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  console.log('执行搜索，搜索条件：', searchForm)
  currentPage.value = 1
  fetchOrders()
}

// 重置搜索
const handleReset = () => {
  console.log('重置搜索条件')
  Object.assign(searchForm, {
    orderId: '',
    userId: '',
    status: '',
    dateRange: []
  })
  currentPage.value = 1
  fetchOrders()
}

// 分页变化
const handleCurrentChange = (page: number) => {
  console.log('页码变化：', page)
  currentPage.value = page
  fetchOrders()
}

const handleSizeChange = (size: number) => {
  console.log('页面大小变化：', size)
  pageSize.value = size
  currentPage.value = 1
  fetchOrders()
}

// 查看详情
const handleViewDetail = (order: Order) => {
  console.log('查看订单详情：', order.orderId)
  console.log('传递的订单数据：', order)
  console.log('订单数据中的关键字段：', {
    userId: order.userId,
    paymentMethod: order.paymentMethod,
    shippingAddress: order.shippingAddress,
    hasUserId: 'userId' in order,
    hasPaymentMethod: 'paymentMethod' in order,
    hasShippingAddress: 'shippingAddress' in order
  })
  
  // 创建一个可序列化的订单数据副本，避免DataCloneError
  const serializableOrderData = {
    id: order.id,
    orderId: order.orderId,
    orderNo: order.orderNo,
    userId: order.userId,
    totalAmount: order.totalAmount,
    status: order.status,
    paymentMethod: order.paymentMethod,
    orderTime: order.orderTime,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    shippedAt: order.shippedAt,
    shippingAddress: order.shippingAddress ? {
      receiver: order.shippingAddress.receiver,
      name: order.shippingAddress.name,
      phone: order.shippingAddress.phone,
      provinceName: order.shippingAddress.provinceName,
      cityName: order.shippingAddress.cityName,
      districtName: order.shippingAddress.districtName,
      detailAddress: order.shippingAddress.detailAddress,
      address: order.shippingAddress.address
    } : null,
    items: order.items ? order.items.map(item => ({
      itemId: item.itemId,
      productId: item.good?.goodId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      good: item.good ? {
        goodId: item.good.goodId,
        goodName: item.good.goodName,
        coverUrl: item.good.coverUrl
      } : null
    })) : [],
    shipping: order.shipping,
    remarks: order.remarks
  }
  
  console.log('补充后的订单数据：', serializableOrderData)
  
  // 通过路由导航到详情页
  router.push(`/orders/${order.orderId}`).then(() => {
    // 导航成功后，将订单数据存储到history.state中
    history.replaceState({ ...history.state, orderData: serializableOrderData }, '')
    console.log('已将订单数据存储到history.state:', serializableOrderData)
  })
}

// 发货
const handleShip = (order: Order) => {
  console.log('发货订单：', order.orderId)
  currentOrder.value = order
  shipDialogVisible.value = true
}

// 确认发货
const handleConfirmShip = async () => {
  if (!shipFormRef.value || !currentOrder.value) return
  
  try {
    await shipFormRef.value.validate()
    shipping.value = true
    
    await orderApi.shipOrder(currentOrder.value.orderId, {
      expressCompany: shipForm.expressCompany,
      trackingNumber: shipForm.trackingNumber,
      remark: shipForm.remark
    })
    
    ElMessage.success('发货成功')
    shipDialogVisible.value = false
    resetShipForm()
    fetchOrders()
  } catch (error) {
    if (error !== 'validation failed') {
      console.error('发货失败：', error)
      ElMessage.error('发货失败')
    }
  } finally {
    shipping.value = false
  }
}

// 取消订单
const handleCancel = async (order: Order) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消订单 ${order.orderId} 吗？`,
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await orderApi.cancelOrder(order.orderId, '管理员取消')
    ElMessage.success('取消成功')
    fetchOrders()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消订单失败：', error)
      ElMessage.error('取消失败')
    }
  }
}

// 重置发货表单
const resetShipForm = () => {
  if (shipFormRef.value) {
    shipFormRef.value.resetFields()
  }
  Object.assign(shipForm, {
    expressCompany: '',
    trackingNumber: '',
    remark: ''
  })
  currentOrder.value = null
}

onMounted(() => {
  console.log('组件挂载，开始获取订单列表')
  fetchOrders()
})
</script>

<style scoped>
.order-list-view {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #333;
}

.search-card {
  margin-bottom: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.amount {
  font-weight: 600;
  color: #f56c6c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-card :deep(.el-form--inline .el-form-item) {
    display: block;
    margin-right: 0;
    margin-bottom: 15px;
  }
  
  .search-card :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }
}
</style>