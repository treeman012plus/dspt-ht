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
              <span>{{ order.orderNo || order.orderId || '-' }}</span>
              <el-button
                type="primary"
                link
                size="small"
                @click="copyToClipboard(order.orderNo || order.orderId || '')"
              >
                复制
              </el-button>
            </div>
            
            <div class="info-item">
              <label>用户ID：</label>
              <span>{{ order.userId || '-' }}</span>
            </div>
            
            <div class="info-item">
              <label>订单金额：</label>
              <span class="amount">{{ order.totalAmount ? formatPrice(order.totalAmount) : '0.00' }}</span>
            </div>
            
            <div class="info-item">
              <label>支付方式：</label>
              <span>{{ order.paymentMethod || '未设置' }}</span>
            </div>
          </el-col>
          
          <el-col :span="12">
            <div class="info-item">
              <label>创建时间：</label>
              <span>{{ order.createdAt ? formatDate(order.createdAt) : (order.orderTime ? formatDate(order.orderTime) : '-') }}</span>
            </div>
            
            <div class="info-item">
              <label>支付时间：</label>
              <span>{{ order.paidAt ? formatDate(order.paidAt) : (order.status === 'paid' || order.status === 1 || order.status === 2 || order.status === 3 ? '已支付' : '未支付') }}</span>
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
                <span>{{ order.shippingAddress.receiver || order.shippingAddress.name || '-' }}</span>
              </div>
              
              <div class="info-item">
                <label>联系电话：</label>
                <span>{{ order.shippingAddress.phone || '-' }}</span>
              </div>
            </el-col>
            
            <el-col :span="12">
              <div class="info-item">
                <label>收货地址：</label>
                <span>
                  {{ order.shippingAddress.provinceName || '' }}
                  {{ order.shippingAddress.cityName || '' }}
                  {{ order.shippingAddress.districtName || '' }}
                  {{ order.shippingAddress.detailAddress || order.shippingAddress.address || '' }}
                </span>
              </div>
            </el-col>
          </el-row>
        </div>
        
        <div v-else class="no-data">
          暂无收货信息
        </div>
      </el-card>
      
      <!-- 商品列表 -->
      <el-card class="info-card">
        <template #header>
          <span>商品清单</span>
        </template>
        
        <el-table :data="order.items || []" border>
          <el-table-column label="商品图片" width="100">
            <template #default="{ row }">
              <el-image
                :src="row.good?.coverUrl || row.productImage || row.image"
                :preview-src-list="[row.good?.coverUrl || row.productImage || row.image]"
                fit="cover"
                style="width: 60px; height: 60px; border-radius: 4px;"
              >
                <template #error>
                  <div class="image-slot">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
            </template>
          </el-table-column>
          
          <el-table-column label="商品名称" min-width="200">
            <template #default="{ row }">
              <span>{{ row.good?.goodName || row.productTitle || row.title || row.name || '-' }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="单价" width="120">
            <template #default="{ row }">
              <span>{{ row.unitPrice ? formatPrice(row.unitPrice) : (row.price ? formatPrice(row.price) : '0.00') }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="quantity" label="数量" width="80">
            <template #default="{ row }">
              <span>{{ row.quantity || 0 }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              <span>{{ row.subtotal ? formatPrice(row.subtotal) : (row.totalPrice ? formatPrice(row.totalPrice) : (row.unitPrice && row.quantity ? formatPrice(row.unitPrice * row.quantity) : '0.00')) }}</span>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="order-summary">
          <div class="summary-item">
            <span>商品金额：</span>
            <span>{{ formatPrice(calculateItemsAmount()) }}</span>
          </div>
          <div class="summary-item">
            <span>运费：</span>
            <span>{{ formatPrice(order.shippingFee || order.deliveryAmount || 0) }}</span>
          </div>
          <div class="summary-item total">
            <span>订单总额：</span>
            <span class="amount">{{ order.totalAmount ? formatPrice(order.totalAmount) : formatPrice(calculateItemsAmount()) }}</span>
          </div>
        </div>
      </el-card>
      
      <!-- 物流信息 -->
      <el-card v-if="order.status === 2 || order.status === 3 || order.status === 'shipped' || order.status === 'completed'" class="info-card">
        <template #header>
          <span>物流信息</span>
        </template>
        
        <div v-if="order.shipping">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="info-item">
                <label>物流公司：</label>
                <span>{{ getExpressCompanyName(order.shipping.expressCompany || '') }}</span>
              </div>
              
              <div class="info-item">
                <label>快递单号：</label>
                <span>{{ order.shipping.trackingNumber || '-' }}</span>
                <el-button
                  v-if="order.shipping.trackingNumber"
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
                <span>{{ order.shipping.shippedAt ? formatDate(order.shipping.shippedAt) : (order.shippedAt ? formatDate(order.shippedAt) : '-') }}</span>
              </div>
              
              <div class="info-item">
                <label>发货备注：</label>
                <span>{{ order.shipping.remark || '无' }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
        
        <div v-else class="no-shipping-info">
          <el-empty description="暂无物流信息" />
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
              <span>{{ remark.createdAt ? formatDate(remark.createdAt) : '-' }}</span>
            </div>
          </div>
        </div>
      </el-card>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button
          v-if="order.status === 1 || order.status === 'paid'"
          type="success"
          @click="handleShip"
        >
          发货
        </el-button>
        
        <el-button
          v-if="(typeof order.status === 'number' && [0, 1].includes(order.status)) || ['pending', 'paid'].includes(order.status as string)"
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
const getStatusType = (status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'refunded' | number) => {
  // 处理字符串状态
  if (typeof status === 'string') {
    const stringTypeMap: Record<string, string> = {
      'pending': 'warning',
      'paid': 'info', 
      'shipped': 'primary',
      'completed': 'success',
      'cancelled': 'danger',
      'refunded': 'warning'
    }
    return stringTypeMap[status] || 'info'
  }
  
  // 处理数字状态
  const typeMap: Record<number, string> = {
    0: 'warning',
    1: 'info',
    2: 'primary',
    3: 'success',
    4: 'danger',
    5: 'warning'
  }
  return typeMap[status] || 'info'
}

// 获取订单状态文本
const getStatusText = (status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'refunded' | number) => {
  // 处理字符串状态
  if (typeof status === 'string') {
    const stringTextMap: Record<string, string> = {
      'pending': '待付款',
      'paid': '待发货',
      'shipped': '已发货', 
      'completed': '已完成',
      'cancelled': '已取消',
      'refunded': '已退款'
    }
    return stringTextMap[status] || '未知状态'
  }
  
  // 处理数字状态
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

// 计算商品总金额
const calculateItemsAmount = () => {
  if (!order.value) return 0
  
  const items = order.value.items || []
  return items.reduce((sum: number, item: any) => {
    return sum + (item.subtotal || item.totalPrice || (item.unitPrice && item.quantity ? item.unitPrice * item.quantity : 0))
  }, 0)
}

// 获取订单详情
const fetchOrderDetail = async () => {
  const orderId = route.params.id as string
  if (!orderId) {
    ElMessage.error('订单ID不能为空')
    return
  }
  
  // 检查是否有从路由state传递的订单数据
  const routeOrderData = (history.state as any)?.orderData
  let hasRouteData = false
  
  if (routeOrderData) {
    console.log('检测到路由传递的订单数据，将用于预填充:', routeOrderData)
    hasRouteData = true
    // 先用路由数据预填充
    order.value = {
      ...routeOrderData,
      userId: routeOrderData.userId || routeOrderData.user_id || routeOrderData.customerId || '-',
      paymentMethod: routeOrderData.paymentMethod || routeOrderData.payment_method || routeOrderData.payType || '未设置',
      shippingAddress: routeOrderData.shippingAddress || routeOrderData.shipping_address || routeOrderData.deliveryAddress,
      items: routeOrderData.items || routeOrderData.orderItems || routeOrderData.goods || [],
      orderNo: routeOrderData.orderNo || routeOrderData.orderId || routeOrderData.order_no,
      totalAmount: routeOrderData.totalAmount || routeOrderData.total_amount || routeOrderData.amount || 0
    } as Order
  }
  
  try {
    loading.value = true
    const response = await orderApi.getOrder(orderId)
    
    console.log('订单详情API响应:', response)
    
    // 处理新的响应格式
    if (response && typeof response === 'object' && 'code' in response && response.code === 200 && 'data' in response) {
      // 如果返回的是订单项数组，需要构造订单对象
      if (Array.isArray(response.data)) {
        // 计算订单总金额
        const totalAmount = response.data.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0)
        
        // 如果有路由数据，则合并；否则构造新的订单对象
        if (hasRouteData && order.value) {
          // 合并API返回的订单项数据
          order.value = {
            ...order.value,
            items: response.data, // 使用API返回的最新订单项数据
            totalAmount: totalAmount || order.value.totalAmount // 优先使用计算出的总金额
          } as Order
        } else {
          // 构造订单对象
          order.value = {
            id: orderId,
            orderId: orderId,
            orderNo: orderId,
            userId: '-',
            totalAmount: totalAmount,
            status: 1, // 默认状态
            createdAt: new Date().toISOString(),
            items: response.data, // 订单项数组
            paymentMethod: '未设置',
            shippingAddress: undefined,
            remarks: []
          } as Order
        }
        
        console.log('构造/合并的订单对象:', order.value)
      } else {
        // 如果返回的是完整订单对象
        const orderData = response.data as any
        
        if (hasRouteData && order.value) {
          // 合并路由数据和API数据，API数据优先级更高
          order.value = {
            ...order.value, // 保留路由数据
            ...orderData, // API数据覆盖
            userId: orderData.userId || orderData.user_id || order.value.userId || '-',
            paymentMethod: orderData.paymentMethod || orderData.payment_method || order.value.paymentMethod || '未设置',
            shippingAddress: orderData.shippingAddress || orderData.shipping_address || order.value.shippingAddress,
            items: orderData.items || orderData.orderItems || order.value.items || []
          } as Order
        } else {
          // 没有路由数据，直接使用API数据
          order.value = {
            ...orderData,
            userId: orderData.userId || orderData.user_id || '-',
            paymentMethod: orderData.paymentMethod || orderData.payment_method || '未设置',
            shippingAddress: orderData.shippingAddress || orderData.shipping_address || undefined,
            items: orderData.items || orderData.orderItems || []
          } as Order
        }
        
        console.log('设置/合并的订单对象:', order.value)
      }
      
      // 设置备注文本
      if (order.value?.remarks && Array.isArray(order.value.remarks) && order.value.remarks.length > 0) {
        const lastRemark = order.value.remarks[order.value.remarks.length - 1]
        if (lastRemark && lastRemark.content) {
          remarkText.value = lastRemark.content
        }
      }
    } else if (response && typeof response === 'object' && !('code' in response)) {
      // 兼容旧的响应格式
      if (Array.isArray(response)) {
        // 如果直接返回的是订单项数组，需要构造订单对象
        const totalAmount = response.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0)
        
        if (hasRouteData && order.value) {
          // 合并API返回的订单项数据
          order.value = {
            ...order.value,
            items: response, // 使用API返回的最新订单项数据
            totalAmount: totalAmount || order.value.totalAmount
          } as Order
        } else {
          order.value = {
            id: orderId,
            orderId: orderId,
            orderNo: orderId,
            userId: '-',
            totalAmount: totalAmount,
            status: 1,
            createdAt: new Date().toISOString(),
            items: response,
            paymentMethod: '未设置',
            shippingAddress: undefined,
            remarks: []
          } as Order
        }
        
        console.log('兼容格式构造/合并的订单对象:', order.value)
      } else {
        // 如果是完整的订单对象
        const orderData = response as any
        
        if (hasRouteData && order.value) {
          // 合并路由数据和API数据
          order.value = {
            ...order.value,
            ...orderData,
            userId: orderData.userId || orderData.user_id || order.value.userId || '-',
            paymentMethod: orderData.paymentMethod || orderData.payment_method || order.value.paymentMethod || '未设置',
            shippingAddress: orderData.shippingAddress || orderData.shipping_address || order.value.shippingAddress,
            items: orderData.items || orderData.orderItems || order.value.items || []
          } as Order
        } else {
          order.value = {
            ...orderData,
            userId: orderData.userId || orderData.user_id || '-',
            paymentMethod: orderData.paymentMethod || orderData.payment_method || '未设置',
            shippingAddress: orderData.shippingAddress || orderData.shipping_address || undefined,
            items: orderData.items || orderData.orderItems || []
          } as Order
        }
        
        console.log('兼容格式的订单对象:', order.value)
      }
      
      // 设置备注文本
      if (order.value?.remarks && Array.isArray(order.value.remarks) && order.value.remarks.length > 0) {
        const lastRemark = order.value.remarks[order.value.remarks.length - 1]
        if (lastRemark && lastRemark.content) {
          remarkText.value = lastRemark.content
        }
      }
    } else {
      console.error('订单数据格式错误:', response)
      ElMessage.error('订单数据格式错误')
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
    await orderApi.addOrderRemark(order.value.id || '', remarkText.value.trim())
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
    
    await orderApi.cancelOrder(order.value.id || '', '用户取消')
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