<template>
  <div class="coupon-list">
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <h2>优惠券管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="goToAddCoupon">
          <el-icon><Plus /></el-icon>
          新增优惠券
        </el-button>
      </div>
    </div>
    
    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="优惠券名称">
          <el-input
            v-model="searchForm.title"
            placeholder="请输入优惠券名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="优惠券类型">
          <el-select
            v-model="searchForm.type"
            placeholder="请选择类型"
            clearable
            style="width: 150px"
          >
            <el-option label="全部" value="" />
            <el-option label="满减券" value="1" />
            <el-option label="折扣券" value="2" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option label="全部" value="all" />
            <el-option label="有效" value="active" />
            <el-option label="已过期" value="expired" />
          </el-select>
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
    
    <!-- 批量操作 -->
    <div v-if="selectedCoupons.length > 0" class="batch-actions">
      <el-alert
        :title="`已选择 ${selectedCoupons.length} 个优惠券`"
        type="info"
        show-icon
        :closable="false"
      >
        <template #default>
          <div class="batch-buttons">
            <el-button size="small" type="danger" @click="handleBatchDelete">批量删除</el-button>
          </div>
        </template>
      </el-alert>
    </div>
    
    <!-- 优惠券表格 -->
    <el-card>
      <TablePagination
        :data="coupons"
        :total="total"
        :loading="loading"
        v-model:page="pagination.page"
        v-model:page-size="pagination.pageSize"
        @pagination-change="fetchCoupons"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="id" label="优惠券ID" width="100" />
        
        <el-table-column prop="title" label="优惠券名称" min-width="200" show-overflow-tooltip />
        
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 1 ? 'success' : 'warning'">
              {{ row.type === 1 ? '满减券' : '折扣券' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="面值" width="120">
          <template #default="{ row }">
            <span v-if="row.type === 1" class="value">¥{{ row.value.toFixed(2) }}</span>
            <span v-else class="value">{{ (row.value * 10).toFixed(1) }}折</span>
          </template>
        </el-table-column>
        
        <el-table-column label="最低使用金额" width="120">
          <template #default="{ row }">
            <span class="min-amount">¥{{ row.minAmount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="库存" width="80">
          <template #default="{ row }">
            <span :class="{ 'low-stock': row.total <= 10 }">{{ row.total }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="有效期" width="200">
          <template #default="{ row }">
            <div class="validity-period">
              <div>{{ formatDate(row.startTime) }}</div>
              <div>至 {{ formatDate(row.endTime) }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getCouponStatusType(row)">
              {{ getCouponStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row.id)">
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </TablePagination>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import TablePagination from '@/components/TablePagination.vue'
import * as couponApi from '@/api/coupon'
import type { Coupon } from '@/types'
import { formatDate } from '@/utils'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const coupons = ref<Coupon[]>([])
const total = ref(0)
const selectedCoupons = ref<Coupon[]>([])

// 分页参数
const pagination = reactive({
  page: 1,
  pageSize: 10
})

// 搜索表单
const searchForm = reactive({
  title: '',
  type: '',
  status: 'all'
})

// 获取优惠券列表
const fetchCoupons = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    
    const response = await couponApi.getCoupons(params)
    const rawCoupons = response.records || response.data || []
    
    // 数据映射和处理
    coupons.value = rawCoupons.map((coupon: any) => ({
      id: coupon.id,
      title: coupon.title,
      type: coupon.type,
      value: Number(coupon.value),
      minAmount: Number(coupon.minAmount),
      startTime: coupon.startTime,
      endTime: coupon.endTime,
      total: coupon.total,
      createTime: coupon.createTime
    }))
    
    total.value = response.total || 0
  } catch (error) {
    console.error('获取优惠券列表失败:', error)
    ElMessage.error('获取优惠券列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchCoupons()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    title: '',
    type: '',
    status: 'all'
  })
  pagination.page = 1
  fetchCoupons()
}

// 跳转到新增优惠券页面
const goToAddCoupon = () => {
  router.push('/coupons/add')
}

// 编辑优惠券
const handleEdit = (id: string | number) => {
  router.push(`/coupons/edit/${id}`)
}

// 删除优惠券
const handleDelete = async (coupon: Coupon) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除优惠券"${coupon.title}"吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await couponApi.deleteCoupon(coupon.id)
    ElMessage.success('删除成功')
    fetchCoupons()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除优惠券失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedCoupons.value.length} 个优惠券吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const ids = selectedCoupons.value.map(coupon => coupon.id)
    await couponApi.deleteCoupons(ids)
    ElMessage.success('批量删除成功')
    selectedCoupons.value = []
    fetchCoupons()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

// 选择变化
const handleSelectionChange = (selection: Coupon[]) => {
  selectedCoupons.value = selection
}

// 获取优惠券状态类型
const getCouponStatusType = (coupon: Coupon) => {
  const now = new Date()
  const startTime = new Date(coupon.startTime)
  const endTime = new Date(coupon.endTime)
  
  if (now < startTime) {
    return 'info' // 未开始
  } else if (now > endTime) {
    return 'danger' // 已过期
  } else if (coupon.total <= 0) {
    return 'warning' // 已售罄
  } else {
    return 'success' // 有效
  }
}

// 获取优惠券状态文本
const getCouponStatusText = (coupon: Coupon) => {
  const now = new Date()
  const startTime = new Date(coupon.startTime)
  const endTime = new Date(coupon.endTime)
  
  if (now < startTime) {
    return '未开始'
  } else if (now > endTime) {
    return '已过期'
  } else if (coupon.total <= 0) {
    return '已售罄'
  } else {
    return '有效'
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchCoupons()
})
</script>

<style scoped>
.coupon-list {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-card {
  margin-bottom: 20px;
}

.batch-actions {
  margin-bottom: 20px;
}

.batch-buttons {
  margin-top: 10px;
}

.value {
  font-weight: bold;
  color: #e6a23c;
}

.min-amount {
  color: #909399;
}

.low-stock {
  color: #f56c6c;
  font-weight: bold;
}

.validity-period {
  font-size: 12px;
  line-height: 1.4;
}

.validity-period div:first-child {
  color: #606266;
}

.validity-period div:last-child {
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>