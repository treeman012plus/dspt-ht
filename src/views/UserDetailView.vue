<template>
  <div class="user-detail-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <el-button @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h2>用户详情</h2>
    </div>
    
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    
    <div v-else-if="user" class="user-content">
      <!-- 用户基本信息 -->
      <el-card class="info-card user-basic-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">基本信息</span>
            <el-tag :type="getStatusType(user.status)" size="large" class="status-tag">
              {{ getStatusText(user.status) }}
            </el-tag>
          </div>
        </template>
        
        <div class="user-info">
          <div class="avatar-section">
            <div class="avatar-container">
              <el-avatar
                :src="user.avatarUrl || user.avatar"
                :size="120"
                class="user-avatar"
              >
                <el-icon size="40"><User /></el-icon>
              </el-avatar>
              <div class="avatar-overlay">
                <el-icon><Camera /></el-icon>
              </div>
            </div>
            
            <div class="basic-info">
              <h3 class="user-name">{{ user.nickname }}</h3>
              <p class="user-id">用户ID: {{ user.id }}</p>
              <div class="user-meta">
                <el-tag type="info" size="small" class="meta-tag">
                  <el-icon><Phone /></el-icon>
                  {{ formatPhone(user.phone) }}
                </el-tag>
              </div>
              <div class="status-actions">
                <el-button
                  :type="getStatusType(user.status) === 'success' ? 'danger' : 'success'"
                  size="default"
                  @click="handleToggleStatus"
                  class="action-btn"
                >
                  <el-icon v-if="getStatusType(user.status) === 'success'"><Lock /></el-icon>
                  <el-icon v-else><Unlock /></el-icon>
                  {{ getStatusType(user.status) === 'success' ? '禁用账号' : '启用账号' }}
                </el-button>
                
                <el-button
                  type="warning"
                  size="default"
                  @click="handleChangePassword"
                  class="action-btn"
                >
                  <el-icon><Key /></el-icon>
                  修改密码
                </el-button>
              </div>
            </div>
          </div>
          
          <el-divider class="section-divider" />
          
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">
                <el-icon><Calendar /></el-icon>
                注册时间
              </div>
              <div class="info-value">{{ formatDate(user.createTime || user.createdAt || '') }}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">
                <el-icon><Clock /></el-icon>
                最后登录
              </div>
              <div class="info-value">
                <span v-if="user.latestTime || user.lastLoginAt">
                  {{ formatDate(user.latestTime || user.lastLoginAt || '') }}
                </span>
                <span v-else class="no-data">从未登录</span>
              </div>
            </div>
            
            <div class="info-item">
              <div class="info-label">
                <el-icon><Key /></el-icon>
                账号状态
              </div>
              <div class="info-value">
                <el-tag :type="getStatusType(user.status)" size="small">
                  {{ getStatusText(user.status) }}
                </el-tag>
              </div>
            </div>
            
            <div class="info-item">
              <div class="info-label">
                <el-icon><Phone /></el-icon>
                联系方式
              </div>
              <div class="info-value">{{ user.phone }}</div>
            </div>
          </div>
        </div>
      </el-card>
      
      <!-- 收货地址列表 -->
      <el-card class="info-card address-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><Location /></el-icon>
              收货地址
            </span>
            <el-tag type="info" size="small">{{ addresses.length }} 个地址</el-tag>
          </div>
        </template>
        
        <div v-if="addressLoading" class="loading-section">
          <el-skeleton :rows="3" animated />
        </div>
        
        <div v-else-if="addresses.length > 0" class="address-list">
          <div
            v-for="address in addresses"
            :key="address.id"
            class="address-item"
          >
            <div class="address-header">
              <div class="address-info">
                <span class="address-name">{{ address.name }}</span>
                <span class="address-phone">{{ address.phone }}</span>
                <el-tag v-if="address.isDefault" type="primary" size="small" class="default-tag">
                  默认地址
                </el-tag>
                <el-tag v-if="address.tag" type="info" size="small" class="tag-label">
                  {{ address.tag }}
                </el-tag>
              </div>
            </div>
            
            <div class="address-detail">
              <el-icon><Location /></el-icon>
              {{ address.province }} {{ address.city }} {{ address.district }} {{ address.detail }}
            </div>
            
            <div v-if="address.zipCode" class="address-zipcode">
              <el-icon><Postcard /></el-icon>
              邮编：{{ address.zipCode }}
            </div>
          </div>
        </div>
        
        <div v-else class="no-data-section">
          <el-empty description="暂无收货地址" :image-size="80">
            <template #image>
              <el-icon size="80" color="#c0c4cc"><Location /></el-icon>
            </template>
          </el-empty>
        </div>
      </el-card>
      
      <!-- 订单统计 -->
      <el-card class="info-card stats-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><DataAnalysis /></el-icon>
              订单统计
            </span>
            <el-button type="primary" size="small" @click="refreshOrderStats">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </template>
        
        <div v-if="statsLoading" class="loading-section">
          <el-skeleton :rows="2" animated />
        </div>
        
        <div v-else class="stats-grid">
          <div class="stat-item total-orders">
            <div class="stat-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ orderStats?.totalOrders || 0 }}</div>
              <div class="stat-label">总订单数</div>
            </div>
          </div>
          
          <div class="stat-item completed-orders">
            <div class="stat-icon">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ orderStats?.completedOrders || 0 }}</div>
              <div class="stat-label">已完成订单</div>
            </div>
          </div>
          
          <div class="stat-item total-amount">
            <div class="stat-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ formatPrice(orderStats?.totalAmount || 0) }}</div>
              <div class="stat-label">累计消费</div>
            </div>
          </div>
          
          <div class="stat-item avg-amount">
            <div class="stat-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ formatPrice(orderStats?.avgOrderAmount || 0) }}</div>
              <div class="stat-label">平均订单金额</div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
    
    <div v-else class="error-state">
      <el-result
        icon="error"
        title="用户不存在"
        sub-title="请检查用户ID是否正确"
      >
        <template #extra>
          <el-button type="primary" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回列表
          </el-button>
        </template>
      </el-result>
    </div>
    
    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改用户密码"
      width="500px"
      @close="resetPasswordForm"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item label="用户ID">
          <el-input :value="user?.id" disabled />
        </el-form-item>
        
        <el-form-item label="用户昵称">
          <el-input :value="user?.nickname" disabled />
        </el-form-item>
        
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="passwordForm.password"
            type="password"
            placeholder="请输入新密码"
            show-password
            maxlength="20"
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
            maxlength="20"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="changingPassword" @click="handleConfirmChangePassword">
          {{ changingPassword ? '修改中...' : '确认修改' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Lock, Unlock, ArrowLeft, User as UserIcon, Camera, Calendar, Clock, Key, Phone, Location, Money, TrendCharts, Star, Postcard, DataAnalysis, Document, CircleCheck, Refresh } from '@element-plus/icons-vue'
import * as userApi from '@/api/user'
import { formatDate, formatPrice } from '@/utils'
import type { User, Address } from '@/types'

const route = useRoute()
const router = useRouter()

// 数据状态
const user = ref<User | null>(null)
const addresses = ref<Address[]>([])
const orderStats = ref<any>(null)
const loading = ref(false)
const addressLoading = ref(false)
const statsLoading = ref(false)

// 修改密码相关状态
const passwordDialogVisible = ref(false)
const changingPassword = ref(false)
const passwordFormRef = ref<FormInstance>()

// 修改密码表单
const passwordForm = reactive({
  password: '',
  confirmPassword: ''
})

// 密码表单验证规则
const passwordRules: FormRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 获取状态类型
const getStatusType = (status: string | number) => {
  if (status === 'active' || status === 1) return 'success'
  return 'danger'
}

// 获取状态文本
const getStatusText = (status: string | number) => {
  if (status === 'active' || status === 1) return '正常'
  return '禁用'
}

// 格式化手机号
const formatPhone = (phone: string) => {
  if (!phone) return ''
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3')
}

// 获取用户详情
const fetchUserDetail = async () => {
  const userId = route.params.id as string
  if (!userId) {
    ElMessage.error('用户ID不能为空')
    return
  }
  
  try {
    loading.value = true
    const response = await userApi.getUser(userId)
    
    // 适配后端数据结构
    user.value = {
      ...response,
      avatar: response.avatarUrl || response.avatar,
      status: response.status === 1 ? 'active' : 'disabled'
    }
  } catch (error) {
    console.error('获取用户详情失败:', error)
    ElMessage.error('获取用户详情失败')
  } finally {
    loading.value = false
  }
}

// 获取用户地址列表
const fetchUserAddresses = async () => {
  const userId = route.params.id as string
  if (!userId) return
  
  try {
    addressLoading.value = true
    const response = await userApi.getUserAddresses(userId)
    
    // 适配API响应数据格式
    addresses.value = (response || []).map((item: any) => ({
      id: item.id,
      name: item.receiver, // API字段：receiver -> 前端字段：name
      phone: item.phone,
      province: item.provinceName, // API字段：provinceName -> 前端字段：province
      city: item.cityName, // API字段：cityName -> 前端字段：city
      district: item.districtName, // API字段：districtName -> 前端字段：district
      detail: item.detailAddress, // API字段：detailAddress -> 前端字段：detail
      isDefault: item.isDefault === 1, // 转换为布尔值
      tag: item.tag // 保留标签字段
    }))
  } catch (error) {
    console.error('获取用户地址失败:', error)
    ElMessage.error('获取用户地址失败')
    addresses.value = []
  } finally {
    addressLoading.value = false
  }
}

// 获取订单统计
const fetchOrderStats = async () => {
  const userId = route.params.id as string
  if (!userId) return
  
  try {
    statsLoading.value = true
    const response = await userApi.getUserOrderStats(userId)
    
    // 处理订单数据并计算统计信息
    const orders = response || []
    const totalOrders = orders.length
    const completedOrders = orders.filter((order: any) => order.status === 3 || order.status === 4 || order.status === 5).length // 状态3、4和5为已完成
    const totalAmount = orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0)
    const avgOrderAmount = totalOrders > 0 ? totalAmount / totalOrders : 0
    
    orderStats.value = {
      totalOrders,
      completedOrders,
      totalAmount,
      avgOrderAmount
    }
  } catch (error) {
    console.error('获取订单统计失败:', error)
    ElMessage.error('获取订单统计失败')
    orderStats.value = {
      totalOrders: 0,
      completedOrders: 0,
      totalAmount: 0,
      avgOrderAmount: 0
    }
  } finally {
    statsLoading.value = false
  }
}

// 刷新订单统计
const refreshOrderStats = () => {
  fetchOrderStats()
}

// 切换用户状态
const handleToggleStatus = async () => {
  if (!user.value) return
  
  const isActive = user.value.status === 'active' || user.value.status === 1
  const action = isActive ? '禁用' : '启用'
  const newStatus = isActive ? 0 : 1
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}用户「${user.value.nickname}」吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await userApi.updateUserStatus(user.value.id.toString(), newStatus as any)
    ElMessage.success(`${action}成功`)
    fetchUserDetail() // 重新获取用户详情
  } catch (error) {
    if (error !== 'cancel') {
      console.error('更新用户状态失败:', error)
      ElMessage.error(`${action}失败`)
    }
  }
}

// 打开修改密码对话框
const handleChangePassword = () => {
  passwordDialogVisible.value = true
}

// 重置密码表单
const resetPasswordForm = () => {
  passwordForm.password = ''
  passwordForm.confirmPassword = ''
  passwordFormRef.value?.clearValidate()
}

// 确认修改密码
const handleConfirmChangePassword = async () => {
  if (!passwordFormRef.value || !user.value) return
  
  try {
    await passwordFormRef.value.validate()
    changingPassword.value = true
    
    await userApi.updateUserPassword(user.value.id.toString(), passwordForm.password)
    
    ElMessage.success('密码修改成功')
    passwordDialogVisible.value = false
    resetPasswordForm()
  } catch (error) {
    if (error !== 'validation failed') {
      console.error('修改密码失败:', error)
      ElMessage.error('修改密码失败')
    }
  } finally {
    changingPassword.value = false
  }
}

// 返回
const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchUserDetail()
  fetchUserAddresses()
  fetchOrderStats()
})
</script>

<style scoped>
.user-detail-view {
  padding: 0;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.back-btn {
  margin-right: 16px;
  border-radius: 8px;
}

.page-header h2 {
  margin: 0;
  color: #1f2937;
  font-size: 24px;
  font-weight: 600;
}

.loading-container {
  padding: 24px;
}

.user-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0 20px;
}

.info-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.3s ease;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-tag {
  border-radius: 20px;
  padding: 8px 16px;
  font-weight: 500;
}

/* 用户基本信息卡片 */
.user-basic-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.user-basic-card .card-title {
  color: white;
}

.user-info {
  padding: 0;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
}

.avatar-container {
  position: relative;
  cursor: pointer;
}

.user-avatar {
  border: 4px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
  color: white;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.basic-info {
  flex: 1;
}

.user-name {
  margin: 0 0 8px 0;
  color: white;
  font-size: 28px;
  font-weight: 700;
}

.user-id {
  margin: 0 0 16px 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.user-meta {
  margin-bottom: 20px;
}

.meta-tag {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  border-radius: 20px;
}

.status-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  border-radius: 20px;
  padding: 10px 20px;
  font-weight: 500;
  min-width: 120px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.section-divider {
  border-color: rgba(255, 255, 255, 0.2);
  margin: 24px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.info-item {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.info-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: 500;
}

.info-value {
  color: white;
  font-size: 16px;
  font-weight: 600;
}

.no-data {
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
}

/* 地址卡片 */
.address-card {
  background: white;
}

.loading-section {
  padding: 20px 0;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.address-item {
  padding: 20px;
  border: 2px solid #f1f5f9;
  border-radius: 12px;
  transition: all 0.3s ease;
  background: #fafbfc;
}

.address-item:hover {
  border-color: #3b82f6;
  background: #f8faff;
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.address-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.address-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 16px;
}

.address-phone {
  color: #6b7280;
  font-size: 14px;
}

.default-tag {
  margin-left: 8px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tag-label {
  margin-left: 8px;
}

.address-detail {
  color: #374151;
  line-height: 1.6;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.address-zipcode {
  color: #9ca3af;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.no-data-section {
  padding: 40px 0;
}

/* 统计卡片 */
.stats-card {
  background: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-item:hover {
  transform: translateY(-2px);
}

.total-orders {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.completed-orders {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.total-amount {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.avg-amount {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.stat-icon {
  font-size: 32px;
  opacity: 0.9;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  font-weight: 500;
}

.error-state {
  padding: 60px 20px;
  background: white;
  border-radius: 16px;
  margin: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-content {
    padding: 0 16px;
  }
  
  .page-header {
    margin: 16px;
    padding: 16px;
  }
  
  .avatar-section {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .address-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .address-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .stat-item {
    padding: 16px;
  }
  
  .stat-value {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .user-name {
    font-size: 24px;
  }
}
</style>