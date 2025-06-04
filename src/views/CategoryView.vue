<template>
  <div class="category-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>商品分类</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增分类
        </el-button>
      </div>
    </div>
    
    <el-card>
      <!-- 分类表格 -->
      <el-table 
        :data="categories" 
        :loading="loading" 
        border
        style="width: 100%"
      >
        <el-table-column prop="id" label="分类ID" width="200" />
        
        <el-table-column prop="name" label="分类名称" min-width="200" />
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            
            <el-button
              type="danger"
              size="small"
              link
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div v-if="categories.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无分类数据">
          <el-button type="primary" @click="handleAdd">
            创建第一个分类
          </el-button>
        </el-empty>
      </div>
    </el-card>
    
    <!-- 新增/编辑分类对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="400px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入分类名称"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ saving ? '保存中...' : '确定' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import * as productApi from '@/api/product'
import type { ProductCategory } from '@/types'

const formRef = ref<FormInstance>()
const dialogVisible = ref(false)
const loading = ref(false)
const saving = ref(false)
const isEdit = ref(false)
const currentCategory = ref<ProductCategory | null>(null)

// 分类数据
const categories = ref<ProductCategory[]>([])

// 表单数据
const form = reactive({
  id: '',
  name: ''
})

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 20, message: '分类名称长度在 2 到 20 个字符', trigger: 'blur' }
  ]
}

// 计算属性
const dialogTitle = computed(() => {
  return isEdit.value ? '编辑分类' : '新增分类'
})

// 获取分类列表
const fetchCategories = async () => {
  try {
    loading.value = true
    const response = await productApi.getCategories()
    // 将API返回的categoryId和categoryName映射为id和name
    categories.value = response.map(category => ({
      id: category.categoryId,
      name: category.categoryName
    }))
  } catch (error) {
    console.error('获取分类失败:', error)
    ElMessage.error('获取分类失败')
  } finally {
    loading.value = false
  }
}

// 新增分类
const handleAdd = () => {
  isEdit.value = false
  currentCategory.value = null
  
  Object.assign(form, {
    id: '',
    name: ''
  })
  
  dialogVisible.value = true
}

// 编辑分类
const handleEdit = (category: ProductCategory) => {
  isEdit.value = true
  currentCategory.value = category
  
  Object.assign(form, {
    id: category.id,
    name: category.name
  })
  
  dialogVisible.value = true
}

// 删除分类
const handleDelete = async (category: ProductCategory) => {
  try {
    await ElMessageBox.confirm(`确定要删除分类「${category.name}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await productApi.deleteCategory(category.id)
    ElMessage.success('删除成功')
    fetchCategories()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除分类失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 保存分类
const handleSave = async () => {
  if (!formRef.value) return
  
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
    
    saving.value = true
    
    if (isEdit.value) {
      // 更新分类
      await productApi.updateCategory(form.id, {
        name: form.name
      })
      ElMessage.success('更新成功')
    } else {
      // 创建分类
      await productApi.createCategory({
        name: form.name
      })
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    fetchCategories()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  currentCategory.value = null
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.category-view {
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

.empty-state {
  padding: 40px 0;
  text-align: center;
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