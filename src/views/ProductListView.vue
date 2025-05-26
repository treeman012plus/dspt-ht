<template>
  <div class="product-list">
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <h2>商品列表</h2>
      <div class="header-actions">
        <el-button type="primary" @click="goToAddProduct">
          <el-icon><Plus /></el-icon>
          新增商品
        </el-button>
        <el-button @click="handleBatchImport">
          <el-icon><Upload /></el-icon>
          批量导入
        </el-button>
      </div>
    </div>
    
    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="商品搜索">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入商品名称或ID"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="商品分类">
          <el-select
            v-model="searchForm.categoryId"
            placeholder="请选择分类"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="上架状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="已上架" value="online" />
            <el-option label="已下架" value="offline" />
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
    <div v-if="selectedProducts.length > 0" class="batch-actions">
      <el-alert
        :title="`已选择 ${selectedProducts.length} 个商品`"
        type="info"
        show-icon
        :closable="false"
      >
        <template #default>
          <div class="batch-buttons">
            <el-button size="small" @click="handleBatchOnline">批量上架</el-button>
            <el-button size="small" @click="handleBatchOffline">批量下架</el-button>
            <el-button size="small" type="danger" @click="handleBatchDelete">批量删除</el-button>
          </div>
        </template>
      </el-alert>
    </div>
    
    <!-- 商品表格 -->
    <el-card>
      <TablePagination
        :data="products"
        :total="total"
        :loading="loading"
        v-model:page="pagination.page"
        v-model:page-size="pagination.pageSize"
        @pagination-change="fetchProducts"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="id" label="商品ID" width="100" />
        
        <el-table-column label="商品图片" width="100">
          <template #default="{ row }">
            <el-image
              :src="row.image"
              :preview-src-list="[row.image]"
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
        
        <el-table-column prop="title" label="商品名称" min-width="200" show-overflow-tooltip />
        
        <el-table-column prop="categoryName" label="分类" width="120" />
        
        <el-table-column label="价格" width="100">
          <template #default="{ row }">
            <span class="price">¥{{ row.price.toFixed(2) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="stock" label="库存" width="80" />
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'online' ? 'success' : 'danger'">
              {{ row.status === 'online' ? '已上架' : '已下架' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row.id)">
              编辑
            </el-button>
            <el-button
              size="small"
              :type="row.status === 'online' ? 'warning' : 'success'"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'online' ? '下架' : '上架' }}
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
    
    <!-- 批量导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="批量导入商品" width="500px">
      <div class="import-content">
        <el-alert
          title="导入说明"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <p>1. 请下载模板文件，按照模板格式填写商品信息</p>
          <p>2. 支持Excel格式文件(.xlsx, .xls)</p>
          <p>3. 单次最多导入1000条商品数据</p>
        </el-alert>
        
        <div class="import-actions">
          <el-button @click="downloadTemplate">
            <el-icon><Download /></el-icon>
            下载模板
          </el-button>
        </div>
        
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :show-file-list="true"
          :limit="1"
          accept=".xlsx,.xls"
          @change="handleFileChange"
        >
          <el-button type="primary">
            <el-icon><Upload /></el-icon>
            选择文件
          </el-button>
        </el-upload>
      </div>
      
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importing" @click="handleImport">
          {{ importing ? '导入中...' : '开始导入' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import TablePagination from '@/components/TablePagination.vue'
import * as productApi from '@/api/product'
import type { Product, ProductCategory, PaginationParams } from '@/types'
import { formatDate } from '@/utils'

const router = useRouter()

// 数据状态
const products = ref<Product[]>([])
const categories = ref<ProductCategory[]>([])
const selectedProducts = ref<Product[]>([])
const total = ref(0)
const loading = ref(false)
const importing = ref(false)
const importDialogVisible = ref(false)

// 分页参数
const pagination = reactive({
  page: 1,
  pageSize: 20
})

// 搜索表单
const searchForm = reactive({
  keyword: '',
  categoryId: '',
  status: ''
})

// 获取商品列表
const fetchProducts = async () => {
  try {
    loading.value = true
    const params = {
      ...pagination,
      ...searchForm
    }
    const response = await productApi.getProducts(params)
    products.value = response.data
    total.value = response.total
  } catch (error) {
    console.error('获取商品列表失败:', error)
    ElMessage.error('获取商品列表失败')
  } finally {
    loading.value = false
  }
}

// 获取商品分类
const fetchCategories = async () => {
  try {
    const response = await productApi.getCategories()
    categories.value = response
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchProducts()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    categoryId: '',
    status: ''
  })
  pagination.page = 1
  fetchProducts()
}

// 选择变化
const handleSelectionChange = (selection: Product[]) => {
  selectedProducts.value = selection
}

// 跳转到新增商品
const goToAddProduct = () => {
  router.push('/products/add')
}

// 编辑商品
const handleEdit = (id: string) => {
  router.push(`/products/edit/${id}`)
}

// 切换商品状态
const handleToggleStatus = async (product: Product) => {
  try {
    const newStatus = product.status === 'online' ? 'offline' : 'online'
    const action = newStatus === 'online' ? '上架' : '下架'
    
    await ElMessageBox.confirm(`确定要${action}商品「${product.title}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await productApi.updateProduct(product.id, { status: newStatus })
    ElMessage.success(`${action}成功`)
    fetchProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('更新商品状态失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

// 删除商品
const handleDelete = async (product: Product) => {
  try {
    await ElMessageBox.confirm(`确定要删除商品「${product.title}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await productApi.deleteProduct(product.id)
    ElMessage.success('删除成功')
    fetchProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除商品失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 批量上架
const handleBatchOnline = async () => {
  try {
    const ids = selectedProducts.value.map(item => item.id)
    await productApi.batchUpdateProductStatus(ids, 'online')
    ElMessage.success('批量上架成功')
    fetchProducts()
    selectedProducts.value = []
  } catch (error) {
    console.error('批量上架失败:', error)
    ElMessage.error('批量上架失败')
  }
}

// 批量下架
const handleBatchOffline = async () => {
  try {
    const ids = selectedProducts.value.map(item => item.id)
    await productApi.batchUpdateProductStatus(ids, 'offline')
    ElMessage.success('批量下架成功')
    fetchProducts()
    selectedProducts.value = []
  } catch (error) {
    console.error('批量下架失败:', error)
    ElMessage.error('批量下架失败')
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedProducts.value.length} 个商品吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const deletePromises = selectedProducts.value.map(item => productApi.deleteProduct(item.id))
    await Promise.all(deletePromises)
    
    ElMessage.success('批量删除成功')
    fetchProducts()
    selectedProducts.value = []
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

// 批量导入
const handleBatchImport = () => {
  importDialogVisible.value = true
}

// 下载模板
const downloadTemplate = () => {
  // 这里应该调用后端API下载模板文件
  ElMessage.info('模板下载功能需要后端支持')
}

// 文件选择变化
const handleFileChange = (file: any) => {
  console.log('选择的文件:', file)
}

// 执行导入
const handleImport = async () => {
  try {
    importing.value = true
    // 这里应该调用后端API执行导入
    await new Promise(resolve => setTimeout(resolve, 2000)) // 模拟导入过程
    ElMessage.success('导入成功')
    importDialogVisible.value = false
    fetchProducts()
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
}

onMounted(() => {
  fetchProducts()
  fetchCategories()
})
</script>

<style scoped>
.product-list {
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

.batch-buttons .el-button {
  margin-right: 10px;
}

.price {
  color: #e6a23c;
  font-weight: 600;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 20px;
}

.import-content {
  padding: 20px 0;
}

.import-actions {
  margin: 20px 0;
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
  
  .search-card :deep(.el-form) {
    flex-direction: column;
  }
  
  .search-card :deep(.el-form-item) {
    margin-right: 0;
    margin-bottom: 15px;
  }
}
</style>