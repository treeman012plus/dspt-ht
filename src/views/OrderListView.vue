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
            v-model="searchForm.orderNo"
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
            <el-option label="待付款" value="pending" />
            <el-option label="待发货" value="paid" />
            <el-option label="已发货" value="shipped" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
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
      <TablePagination
        :data="orders"
        :loading="loading"
        :total="pagination.total"
        :page="pagination.current"
        :page-size="pagination.size"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <el-table-column prop="orderNo" label="订单号" width="180" />
        
        <el-table-column prop="userId" label="用户ID" width="120" />
        
        <el-table-column prop="totalAmount" label="订单金额" width="120">
          <template #default="{ row }">
            <span class="amount">¥{{ formatPrice(row.totalAmount) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="订单状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="updatedAt" label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
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
              v-if="row.status === 'paid'"
              type="success"
              size="small"
              link
              @click="handleShip(row)"
            >
              发货
            </el-button>
            
            <el-button
              v-if="['pending', 'paid'].includes(row.status)"
              type="danger"
              size="small"
              link
              @click="handleCancel(row)"
            >
              取消订单
            </el-button>
          </template>
        </el-table-column>
      </TablePagination>
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
          <el-input :value="currentOrder?.orderNo" disabled />
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
import TablePagination from '@/components/TablePagination.vue'
import * as orderApi from '@/api/order'
import { formatDate, formatPrice } from '@/utils'
import type { Order, PaginationParams } from '@/types'

const router = useRouter()
const shipFormRef = ref<FormInstance>()

// 数据状态
const orders = ref<Order[]>([])
const loading = ref(false)
const shipDialogVisible = ref(false)
const shipping = ref(false)
const currentOrder = ref<Order | null>(null)

// 搜索表单
const searchForm = reactive({
  orderNo: '',
  userId: '',
  status: '',
  dateRange: [] as string[]
})

// 分页参数
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
})

// 发货表单
const shipForm = reactive({
  expressCompany: '',
  trackingNumber: '',
  remark: ''
})

// 发货表单验证规则
const shipRules: FormRules = {
  expressCompany: [
    { required: true, message: '请选择物流公司', trigger: 'change' }
  ],
  trackingNumber: [
    { required: true, message: '请输入快递单号', trigger: 'blur' },
    { min: 8, max: 30, message: '快递单号长度在 8 到 30 个字符', trigger: 'blur' }
  ]
}

// 获取订单状态类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    pending: 'warning',
    paid: 'info',
    shipped: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取订单状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '待付款',
    paid: '待发货',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消'
  }
  return textMap[status] || status
}

// 获取订单列表
const fetchOrders = async () => {
  try {
    loading.value = true
    
    const params: PaginationParams & {
      orderNo?: string
      userId?: string
      status?: string
      startDate?: string
      endDate?: string
    } = {
      page: pagination.current,
      pageSize: pagination.size
    }
    
    // 添加搜索条件
    if (searchForm.orderNo) params.orderNo = searchForm.orderNo
    if (searchForm.userId) params.userId = searchForm.userId
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    
    const response = await orderApi.getOrders(params)
    orders.value = response.data
    pagination.total = response.total
  } catch (error) {
    console.error('获取订单列表失败:', error)
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  fetchOrders()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    orderNo: '',
    userId: '',
    status: '',
    dateRange: []
  })
  pagination.current = 1
  fetchOrders()
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.current = page
  fetchOrders()
}

const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.current = 1
  fetchOrders()
}

// 查看订单详情
const handleViewDetail = (order: Order) => {
  router.push(`/orders/${order.id}`)
}

// 发货
const handleShip = (order: Order) => {
  currentOrder.value = order
  shipDialogVisible.value = true
}

// 确认发货
const handleConfirmShip = async () => {
  if (!shipFormRef.value || !currentOrder.value) return
  
  try {
    const valid = await shipFormRef.value.validate()
    if (!valid) return
    
    shipping.value = true
    
    await orderApi.shipOrder(currentOrder.value.id, {
      expressCompany: shipForm.expressCompany,
      trackingNumber: shipForm.trackingNumber,
      remark: shipForm.remark
    })
    
    ElMessage.success('发货成功')
    shipDialogVisible.value = false
    fetchOrders()
  } catch (error) {
    console.error('发货失败:', error)
    ElMessage.error('发货失败')
  } finally {
    shipping.value = false
  }
}

// 取消订单
const handleCancel = async (order: Order) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消订单「${order.orderNo}」吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await orderApi.cancelOrder(order.id, '用户取消')
    ElMessage.success('取消成功')
    fetchOrders()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消订单失败:', error)
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