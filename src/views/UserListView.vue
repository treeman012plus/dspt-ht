<template>
  <div class="user-list-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>用户管理</h2>
    </div>
    
    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="用户ID">
          <el-input
            v-model="searchForm.userId"
            placeholder="请输入用户ID"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="手机号">
          <el-input
            v-model="searchForm.phone"
            placeholder="请输入手机号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="昵称">
          <el-input
            v-model="searchForm.nickname"
            placeholder="请输入昵称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="账号状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option label="全部" value="" />
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="注册时间">
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
    
    <!-- 用户列表 -->
    <el-card>
      <TablePagination
        :data="users"
        :loading="loading"
        :total="pagination.total"
        :page="pagination.current"
        :page-size="pagination.size"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <el-table-column prop="id" label="用户ID" width="120" />
        
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar
              :src="row.avatar"
              :size="40"
              class="user-avatar"
            >
              <el-icon><User /></el-icon>
            </el-avatar>
          </template>
        </el-table-column>
        
        <el-table-column prop="nickname" label="昵称" width="150" />
        
        <el-table-column prop="phone" label="手机号" width="150">
          <template #default="{ row }">
            <span v-if="row.phone">
              {{ formatPhone(row.phone) }}
            </span>
            <span v-else class="no-data">未绑定</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="email" label="邮箱" width="200">
          <template #default="{ row }">
            <span v-if="row.email">{{ row.email }}</span>
            <span v-else class="no-data">未绑定</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="账号状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="createdAt" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="lastLoginAt" label="最后登录" width="180">
          <template #default="{ row }">
            <span v-if="row.lastLoginAt">
              {{ formatDate(row.lastLoginAt) }}
            </span>
            <span v-else class="no-data">从未登录</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="180" fixed="right">
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
              :type="row.status === 'active' ? 'danger' : 'success'"
              size="small"
              link
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
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
import TablePagination from '@/components/TablePagination.vue'
import * as userApi from '@/api/user'
import { formatDate } from '@/utils'
import type { User, PaginationParams } from '@/types'

const router = useRouter()

// 数据状态
const users = ref<User[]>([])
const loading = ref(false)

// 搜索表单
const searchForm = reactive({
  userId: '',
  phone: '',
  nickname: '',
  status: '',
  dateRange: [] as string[]
})

// 分页参数
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
})

// 格式化手机号
const formatPhone = (phone: string) => {
  if (!phone) return ''
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3')
}

// 获取用户列表
const fetchUsers = async () => {
  try {
    loading.value = true
    
    const params: PaginationParams & {
      userId?: string
      phone?: string
      nickname?: string
      status?: string
      startDate?: string
      endDate?: string
    } = {
      page: pagination.current,
      pageSize: pagination.size // 将 size 改为 pageSize
    }
    
    // 添加搜索条件
    if (searchForm.userId) params.userId = searchForm.userId
    if (searchForm.phone) params.phone = searchForm.phone
    if (searchForm.nickname) params.nickname = searchForm.nickname
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    
    const response = await userApi.getUsers(params)
    users.value = response.data
    pagination.total = response.total
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  fetchUsers()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    userId: '',
    phone: '',
    nickname: '',
    status: '',
    dateRange: []
  })
  pagination.current = 1
  fetchUsers()
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.current = page
  fetchUsers()
}

const handleSizeChange = (size: number) => {
  pagination.size = size
  pagination.current = 1
  fetchUsers()
}

// 查看用户详情
const handleViewDetail = (user: User) => {
  router.push(`/users/${user.id}`)
}

// 切换用户状态
const handleToggleStatus = async (user: User) => {
  const action = user.status === 'active' ? '禁用' : '启用'
  const newStatus = user.status === 'active' ? 'disabled' : 'active'
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}用户「${user.nickname}」吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await userApi.updateUserStatus(user.id, newStatus)
    ElMessage.success(`${action}成功`)
    fetchUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('更新用户状态失败:', error)
      ElMessage.error(`${action}失败`)
    }
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-list-view {
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

.user-avatar {
  border: 1px solid #e4e7ed;
}

.no-data {
  color: #c0c4cc;
  font-style: italic;
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