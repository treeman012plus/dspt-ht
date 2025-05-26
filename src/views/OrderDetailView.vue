<template>
  <div class="order-detail-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <el-button @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h2>订单详情</h2>
    </div>
    
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    
    <div v-else-if="order" class="order-content">
      <!-- 订单基本信息 -->
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <span>订单信息</span>
            <el-tag :type="getStatusType(order.status)" size="large">
              {{ getStatusText(order.status) }}
            </el-tag>
          </div>
        </template>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="info-item">
              <label>订单号：</label>
              <span>{{ order.orderNo }}</span>
              <el-button
                type="primary"
                link
                size="small"
                @click="copyToClipboard(order.orderNo)"
              >
                复制
              </el-button>
            </div>
            
            <div class="info-item">
              <label>用户ID：</label>
              <span>{{ order.userId }}</span>
            </div>
            
            <div class="info-item">
              <label>订单金额：</label>
              <span class="amount">¥{{ formatPrice(order.totalAmount) }}</span>
            </div>
            
            <div class="info-item">
              <label>支付方式：</label>
              <span>{{ order.paymentMethod || '未设置' }}</span>
            </div>
          </el-col>
          
          <el-col :span="12">
            <div class="info-item">
              <label>创建时间：</label>
              <span>{{ formatDate(order.createdAt) }}</span>
            </div>
            
            <div class="info-item">
              <label>更新时间：</label>
              <span>{{ formatDate(order.updatedAt) }}</span>
            </div>
            
            <div class="info-item">
              <label>支付时间：</label>
              <span>{{ order.paidAt ? formatDate(order.paidAt) : '未支付' }}</span>
            </div>
            
            <div class="info-item">
              <label>发货时间：</label>
              <span>{{ order.shippedAt ? formatDate(order.shippedAt) : '未发货' }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>
      
      <!-- 收货信息 -->
      <el-card class="info-card">
        <template #header>
          <span>收货信息</span>
        </template>
        
        <div v-if="order.shippingAddress">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="info-item">
                <label>收货人：</label>
                <span>{{ order.shippingAddress.name }}</span>
              </div>
              
              <div class="info-item">
                <label>联系电话：</label>
                <span>{{ order.shippingAddress.phone }}</span>
              </div>
            </el-col>
            
            <el-col :span="12">
              <div class="info-item">
                <label>收货地址：</label>
                <span>
                  {{ order.shippingAddress.province }}
                  {{ order.shippingAddress.city }}
                  {{ order.shippingAddress.district }}
                  {{ order.shippingAddress.detail }}
                </span>
              </div>
            </el-col>
          </el-row>
        </div>
        
        <div v-else class="no-data">
          暂无收货信息
        </div>
      </el-card>
      
      <!-- 商品明细 -->
      <el-card class="info-card">
        <template #header>
          <span>商品明细</span>
        </template>
        
        <el-table :data="order.items" border>
          <el-table-column label="商品图片" width="100">
            <template #default="{ row }">
              <el-image
                :src="row.productImage"
                :preview-src-list="[row.productImage]"
                fit="cover"
                class="product-image"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
            </template>
          </el-table-column>
          
          <el-table-column prop="productName" label="商品名称" />
          
          <el-table-column prop="productId" label="商品ID" width="120" />
          
          <el-table-column prop="price" label="单价" width="120">
            <template #default="{ row }">
              ¥{{ formatPrice(row.price) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="quantity" label="数量" width="80" />
          
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              <span class="amount">¥{{ formatPrice(row.price * row.quantity) }}</span>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="order-summary">
          <div class="summary-item">
            <span>商品总额：</span>
            <span>¥{{ formatPrice(order.subtotal || order.totalAmount) }}</span>
          </div>
          <div class="summary-item">
            <span>运费：</span>
            <span>¥{{ formatPrice(order.shippingFee || 0) }}</span>
          </div>
          <div class="summary-item total">
            <span>订单总额：</span>
            <span class="amount">¥{{ formatPrice(order.totalAmount) }}</span>
          </div>
        </div>
      </el-card>
      
      <!-- 物流信息 -->
      <el-card v-if="order.status === 'shipped' || order.status === 'completed'" class="info-card">
        <template #header>
          <span>物流信息</span>
        </template>
        
        <div v-if="order.shipping">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="info-item">
                <label>物流公司：</label>
                <span>{{ getExpressCompanyName(order.shipping.expressCompany) }}</span>
              </div>
              
              <div class="info-item">
                <label>快递单号：</label>
                <span>{{ order.shipping.trackingNumber }}</span>
                <el-button
                  type="primary"
                  link
                  size="small"
                  @click="copyToClipboard(order.shipping.trackingNumber)"
                >
                  复制
                </el-button>
              </div>
            </el-col>
            
            <el-col :span="12">
              <div class="info-item">
                <label>发货时间：</label>
                <span>{{ formatDate(order.shippedAt!) }}</span>
              </div>
              
              <div v-if="order.shipping.remark" class="info-item">
                <label>发货备注：</label>
                <span>{{ order.shipping.remark }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
        
        <div v-else class="no-data">
          暂无物流信息
        </div>
      </el-card>
      
      <!-- 订单备注 -->
      <el-card class="info-card">
        <template #header>
          <span>订单备注</span>
        </template>
        
        <div class="remark-section">
          <el-input
            v-model="remarkText"
            type="textarea"
            :rows="4"
            placeholder="请输入订单备注..."
            maxlength="500"
            show-word-limit
          />
          
          <div class="remark-actions">
            <el-button type="primary" :loading="savingRemark" @click="handleSaveRemark">
              {{ savingRemark ? '保存中...' : '保存备注' }}
            </el-button>
          </div>
        </div>
        
        <div v-if="order.remarks && order.remarks.length > 0" class="remark-history">
          <h4>历史备注</h4>
          <div v-for="remark in order.remarks" :key="remark.id" class="remark-item">
            <div class="remark-content">{{ remark.content }}</div>
            <div class="remark-meta">
              <span>{{ remark.createdBy }}</span>
              <span>{{ formatDate(remark.createdAt) }}</span>
            </div>
          </div>
        </div>
      </el-card>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button
          v-if="order.status === 'paid'"
          type="success"
          @click="handleShip"
        >
          发货
        </el-button>
        
        <el-button
          v-if="['pending', 'paid'].includes(order.status)"
          type="danger"
          @click="handleCancel"
        >
          取消订单
        </el-button>
      </div>
    </div>
    
    <div v-else class="error-state">
      <el-result
        icon="error"
        title="订单不存在"
        sub-title="请检查订单ID是否正确"
      >
        <template #extra>
          <el-button type="primary" @click="goBack">返回列表</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as orderApi from '@/api/order'
import { formatDate, formatPrice, copyToClipboard } from '@/utils'
import type { Order } from '@/types'

const route = useRoute()
const router = useRouter()

// 数据状态
const order = ref<Order | null>(null)
const loading = ref(false)
const savingRemark = ref(false)
const remarkText = ref('')

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

// 获取物流公司名称
const getExpressCompanyName = (code: string) => {
  const companyMap: Record<string, string> = {
    SF: '顺丰速运',
    YTO: '圆通速递',
    ZTO: '中通快递',
    STO: '申通快递',
    YD: '韵达速递',
    BEST: '百世快递',
    DBL: '德邦快递'
  }
  return companyMap[code] || code
}

// 获取订单详情
const fetchOrderDetail = async () => {
  const orderId = route.params.id as string
  if (!orderId) {
    ElMessage.error('订单ID不能为空')
    return
  }
  
  try {
    loading.value = true
    const response = await orderApi.getOrder(orderId)
    order.value = response
    
    // 设置备注文本
    if (response.remarks && response.remarks.length > 0) {
      remarkText.value = response.remarks[response.remarks.length - 1].content
    }
  } catch (error) {
    console.error('获取订单详情失败:', error)
    ElMessage.error('获取订单详情失败')
  } finally {
    loading.value = false
  }
}

// 保存备注
const handleSaveRemark = async () => {
  if (!order.value || !remarkText.value.trim()) {
    ElMessage.warning('请输入备注内容')
    return
  }
  
  try {
    savingRemark.value = true
    await orderApi.addOrderRemark(order.value.id, remarkText.value.trim())
    ElMessage.success('备注保存成功')
    fetchOrderDetail() // 重新获取订单详情
  } catch (error) {
    console.error('保存备注失败:', error)
    ElMessage.error('保存备注失败')
  } finally {
    savingRemark.value = false
  }
}

// 发货
const handleShip = () => {
  // 跳转到订单列表页面并触发发货操作
  router.push({
    path: '/orders',
    query: { action: 'ship', orderId: order.value?.id }
  })
}

// 取消订单
const handleCancel = async () => {
  if (!order.value) return
  
  try {
    await ElMessageBox.confirm(
      `确定要取消订单「${order.value.orderNo}」吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await orderApi.cancelOrder(order.value.id, '用户取消')
    ElMessage.success('取消成功')
    fetchOrderDetail() // 重新获取订单详情
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消订单失败:', error)
      ElMessage.error('取消失败')
    }
  }
}

// 返回
const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchOrderDetail()
})
</script>

<style scoped>
.order-detail-view {
  padding: 0;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.back-btn {
  margin-right: 15px;
}

.page-header h2 {
  margin: 0;
  color: #333;
}

.loading-container {
  padding: 20px;
}

.order-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.info-item label {
  min-width: 100px;
  color: #666;
  font-weight: 500;
}

.info-item span {
  color: #333;
}

.amount {
  font-weight: 600;
  color: #f56c6c;
}

.no-data {
  color: #999;
  text-align: center;
  padding: 20px;
}

.product-image {
  width: 60px;
  height: 60px;
  border-radius: 4px;
}

.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #c0c4cc;
}

.order-summary {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.summary-item.total {
  font-size: 16px;
  font-weight: 600;
  border-top: 1px solid #e4e7ed;
  padding-top: 8px;
  margin-top: 8px;
}

.remark-section {
  margin-bottom: 20px;
}

.remark-actions {
  margin-top: 10px;
  text-align: right;
}

.remark-history h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 14px;
}

.remark-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 10px;
}

.remark-content {
  margin-bottom: 8px;
  line-height: 1.5;
}

.remark-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  padding: 20px 0;
}

.error-state {
  padding: 40px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .info-item label {
    min-width: auto;
    margin-bottom: 5px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .summary-item {
    font-size: 14px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>