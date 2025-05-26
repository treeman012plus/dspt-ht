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
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
            <el-tag :type="user.status === 'active' ? 'success' : 'danger'" size="large">
              {{ user.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </div>
        </template>
        
        <div class="user-info">
          <div class="avatar-section">
            <el-avatar
              :src="user.avatar"
              :size="100"
              class="user-avatar"
            >
              <el-icon><User /></el-icon>
            </el-avatar>
            
            <div class="basic-info">
              <h3>{{ user.nickname }}</h3>
              <p class="user-id">ID: {{ user.id }}</p>
              <div class="status-actions">
                <el-button
                  :type="user.status === 'active' ? 'danger' : 'success'"
                  size="small"
                  @click="handleToggleStatus"
                >
                  {{ user.status === 'active' ? '禁用账号' : '启用账号' }}
                </el-button>
              </div>
            </div>
          </div>
          
          <el-divider />
          
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="info-item">
                <label>手机号：</label>
                <span v-if="user.phone">{{ user.phone }}</span>
                <span v-else class="no-data">未绑定</span>
              </div>
              
              <div class="info-item">
                <label>邮箱：</label>
                <span v-if="user.email">{{ user.email }}</span>
                <span v-else class="no-data">未绑定</span>
              </div>
              
              <div class="info-item">
                <label>性别：</label>
                <span v-if="user.gender">
                  {{ user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '其他' }}
                </span>
                <span v-else class="no-data">未设置</span>
              </div>
              
              <div class="info-item">
                <label>生日：</label>
                <span v-if="user.birthday">{{ formatDate(user.birthday) }}</span>
                <span v-else class="no-data">未设置</span>
              </div>
            </el-col>
            
            <el-col :span="12">
              <div class="info-item">
                <label>注册时间：</label>
                <span>{{ formatDate(user.createdAt) }}</span>
              </div>
              
              <div class="info-item">
                <label>最后登录：</label>
                <span v-if="user.lastLoginAt">
                  {{ formatDate(user.lastLoginAt) }}
                </span>
                <span v-else class="no-data">从未登录</span>
              </div>
              
              <div class="info-item">
                <label>登录次数：</label>
                <span>{{ user.loginCount || 0 }} 次</span>
              </div>
              
              <div class="info-item">
                <label>账号来源：</label>
                <span>{{ getSourceText(user.source) }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>
      
      <!-- 收货地址列表 -->
      <el-card class="info-card">
        <template #header>
          <span>收货地址</span>
        </template>
        
        <div v-if="user.addresses && user.addresses.length > 0">
          <div
            v-for="address in user.addresses"
            :key="address.id"
            class="address-item"
          >
            <div class="address-header">
              <div class="address-info">
                <span class="name">{{ address.name }}</span>
                <span class="phone">{{ address.phone }}</span>
                <el-tag v-if="address.isDefault" type="primary" size="small">
                  默认地址
                </el-tag>
              </div>
            </div>
            
            <div class="address-detail">
              {{ address.province }}
              {{ address.city }}
              {{ address.district }}
              {{ address.detail }}
            </div>
            
            <div v-if="address.zipCode" class="address-zipcode">
              邮编：{{ address.zipCode }}
            </div>
          </div>
        </div>
        
        <div v-else class="no-data-section">
          <el-empty description="暂无收货地址" />
        </div>
      </el-card>
      
      <!-- 订单统计 -->
      <el-card class="info-card">
        <template #header>
          <span>订单统计</span>
        </template>
        
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-value">{{ user.orderStats?.totalOrders || 0 }}</div>
              <div class="stat-label">总订单数</div>
            </div>
          </el-col>
          
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-value">{{ user.orderStats?.completedOrders || 0 }}</div>
              <div class="stat-label">已完成订单</div>
            </div>
          </el-col>
          
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-value">¥{{ formatPrice(user.orderStats?.totalAmount || 0) }}</div>
              <div class="stat-label">累计消费</div>
            </div>
          </el-col>
          
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-value">¥{{ formatPrice(user.orderStats?.avgOrderAmount || 0) }}</div>
              <div class="stat-label">平均订单金额</div>
            </div>
          </el-col>
        </el-row>
      </el-card>
      
      <!-- 用户备注 -->
      <el-card class="info-card">
        <template #header>
          <span>用户备注</span>
        </template>
        
        <div class="remark-section">
          <el-input
            v-model="remarkText"
            type="textarea"
            :rows="4"
            placeholder="请输入用户备注..."
            maxlength="500"
            show-word-limit
          />
          
          <div class="remark-actions">
            <el-button type="primary" :loading="savingRemark" @click="handleSaveRemark">
              {{ savingRemark ? '保存中...' : '保存备注' }}
            </el-button>
          </div>
        </div>
        
        <div v-if="user.remarks && user.remarks.length > 0" class="remark-history">
          <h4>历史备注</h4>
          <div v-for="remark in user.remarks" :key="remark.id" class="remark-item">
            <div class="remark-content">{{ remark.content }}</div>
            <div class="remark-meta">
              <span>{{ remark.createdBy }}</span>
              <span>{{ formatDate(remark.createdAt) }}</span>
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
import * as userApi from '@/api/user'
import { formatDate, formatPrice } from '@/utils'
import type { User } from '@/types'

const route = useRoute()
const router = useRouter()

// 数据状态
const user = ref<User | null>(null)
const loading = ref(false)
const savingRemark = ref(false)
const remarkText = ref('')

// 获取账号来源文本
const getSourceText = (source?: string) => {
  const sourceMap: Record<string, string> = {
    web: '网页注册',
    app: 'APP注册',
    wechat: '微信注册',
    admin: '管理员创建'
  }
  return sourceMap[source || ''] || '未知'
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
    user.value = response
    
    // 设置备注文本
    if (response.remarks && response.remarks.length > 0) {
      remarkText.value = response.remarks[response.remarks.length - 1].content
    }
  } catch (error) {
    console.error('获取用户详情失败:', error)
    ElMessage.error('获取用户详情失败')
  } finally {
    loading.value = false
  }
}

// 切换用户状态
const handleToggleStatus = async () => {
  if (!user.value) return
  
  const action = user.value.status === 'active' ? '禁用' : '启用'
  const newStatus = user.value.status === 'active' ? 'disabled' : 'active'
  
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
    
    await userApi.updateUserStatus(user.value.id, newStatus)
    ElMessage.success(`${action}成功`)
    fetchUserDetail() // 重新获取用户详情
  } catch (error) {
    if (error !== 'cancel') {
      console.error('更新用户状态失败:', error)
      ElMessage.error(`${action}失败`)
    }
  }
}

// 保存备注
const handleSaveRemark = async () => {
  if (!user.value || !remarkText.value.trim()) {
    ElMessage.warning('请输入备注内容')
    return
  }
  
  try {
    savingRemark.value = true
    await userApi.addUserRemark(user.value.id, remarkText.value.trim())
    ElMessage.success('备注保存成功')
    fetchUserDetail() // 重新获取用户详情
  } catch (error) {
    console.error('保存备注失败:', error)
    ElMessage.error('保存备注失败')
  } finally {
    savingRemark.value = false
  }
}

// 返回
const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchUserDetail()
})
</script>

<style scoped>
.user-detail-view {
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

.user-content {
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

.user-info {
  padding: 0;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.user-avatar {
  border: 2px solid #e4e7ed;
}

.basic-info h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 20px;
}

.user-id {
  margin: 0 0 15px 0;
  color: #666;
  font-size: 14px;
}

.status-actions {
  display: flex;
  gap: 10px;
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

.no-data {
  color: #c0c4cc;
  font-style: italic;
}

.no-data-section {
  padding: 20px 0;
}

.address-item {
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  margin-bottom: 15px;
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.address-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.address-info .name {
  font-weight: 600;
  color: #333;
}

.address-info .phone {
  color: #666;
}

.address-detail {
  color: #333;
  line-height: 1.5;
  margin-bottom: 5px;
}

.address-zipcode {
  color: #999;
  font-size: 12px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-size: 14px;
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
  
  .avatar-section {
    flex-direction: column;
    text-align: center;
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
  
  .address-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .address-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .stat-item {
    padding: 15px;
  }
  
  .stat-value {
    font-size: 20px;
  }
}
</style>