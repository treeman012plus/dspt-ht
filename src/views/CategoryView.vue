<template>
  <div class="category-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>商品分类</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd()">
          <el-icon><Plus /></el-icon>
          新增分类
        </el-button>
      </div>
    </div>
    
    <el-card>
      <!-- 分类树 -->
      <el-tree
        ref="treeRef"
        :data="categoryTree"
        :props="treeProps"
        :expand-on-click-node="false"
        :default-expand-all="true"
        node-key="id"
        class="category-tree"
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <div class="node-content">
              <el-icon class="folder-icon">
                <Folder v-if="data.children && data.children.length > 0" />
                <Document v-else />
              </el-icon>
              <span class="node-label">{{ data.name }}</span>
              <el-tag size="small" class="level-tag">{{ getLevelText(data.level) }}</el-tag>
            </div>
            
            <div class="node-actions">
              <el-button
                size="small"
                type="primary"
                link
                @click="handleAdd(data)"
              >
                添加子分类
              </el-button>
              <el-button
                size="small"
                type="warning"
                link
                @click="handleEdit(data)"
              >
                重命名
              </el-button>
              <el-button
                size="small"
                type="danger"
                link
                @click="handleDelete(data)"
              >
                删除
              </el-button>
            </div>
          </div>
        </template>
      </el-tree>
      
      <div v-if="categoryTree.length === 0" class="empty-state">
        <el-empty description="暂无分类数据">
          <el-button type="primary" @click="handleAdd()">
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
        
        <el-form-item v-if="form.parentId" label="父级分类">
          <el-input :value="parentCategoryName" disabled />
        </el-form-item>
        
        <el-form-item label="分类层级">
          <el-input :value="getLevelText(form.level)" disabled />
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
import * as productApi from '@/api/product'
import type { ProductCategory } from '@/types'

const treeRef = ref()
const formRef = ref<FormInstance>()
const dialogVisible = ref(false)
const saving = ref(false)
const isEdit = ref(false)
const currentCategory = ref<ProductCategory | null>(null)
const parentCategory = ref<ProductCategory | null>(null)

// 分类数据
const categories = ref<ProductCategory[]>([])

// 树形结构配置
const treeProps = {
  children: 'children',
  label: 'name'
}

// 表单数据
const form = reactive({
  id: '',
  name: '',
  parentId: '',
  level: 1
})

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 20, message: '分类名称长度在 2 到 20 个字符', trigger: 'blur' }
  ]
}

// 计算属性
const categoryTree = computed(() => {
  return buildTree(categories.value)
})

const dialogTitle = computed(() => {
  return isEdit.value ? '编辑分类' : '新增分类'
})

const parentCategoryName = computed(() => {
  return parentCategory.value?.name || ''
})

// 构建树形结构
const buildTree = (list: ProductCategory[]): ProductCategory[] => {
  const tree: ProductCategory[] = []
  const map = new Map<string, ProductCategory>()
  
  // 创建映射
  list.forEach(item => {
    map.set(item.id, { ...item, children: [] })
  })
  
  // 构建树形结构
  list.forEach(item => {
    const node = map.get(item.id)!
    if (item.parentId && map.has(item.parentId)) {
      const parent = map.get(item.parentId)!
      if (!parent.children) parent.children = []
      parent.children.push(node)
    } else {
      tree.push(node)
    }
  })
  
  return tree
}

// 获取层级文本
const getLevelText = (level: number): string => {
  const levelMap: Record<number, string> = {
    1: '一级分类',
    2: '二级分类',
    3: '三级分类'
  }
  return levelMap[level] || `${level}级分类`
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await productApi.getCategories()
    categories.value = response
  } catch (error) {
    console.error('获取分类失败:', error)
    ElMessage.error('获取分类失败')
  }
}

// 新增分类
const handleAdd = (parent?: ProductCategory) => {
  isEdit.value = false
  parentCategory.value = parent || null
  
  Object.assign(form, {
    id: '',
    name: '',
    parentId: parent?.id || '',
    level: parent ? parent.level + 1 : 1
  })
  
  dialogVisible.value = true
}

// 编辑分类
const handleEdit = (category: ProductCategory) => {
  isEdit.value = true
  currentCategory.value = category
  
  // 查找父级分类
  const parent = categories.value.find(item => item.id === category.parentId)
  parentCategory.value = parent || null
  
  Object.assign(form, {
    id: category.id,
    name: category.name,
    parentId: category.parentId || '',
    level: category.level
  })
  
  dialogVisible.value = true
}

// 删除分类
const handleDelete = async (category: ProductCategory) => {
  try {
    // 检查是否有子分类
    const hasChildren = categories.value.some(item => item.parentId === category.id)
    if (hasChildren) {
      ElMessage.warning('该分类下还有子分类，请先删除子分类')
      return
    }
    
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
        name: form.name,
        parentId: form.parentId || undefined,
        level: form.level
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
  parentCategory.value = null
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

.category-tree {
  min-height: 400px;
}

.tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px 0;
}

.node-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.folder-icon {
  margin-right: 8px;
  color: #409eff;
}

.node-label {
  margin-right: 10px;
  font-size: 14px;
  color: #333;
}

.level-tag {
  margin-left: 8px;
}

.node-actions {
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.3s;
}

.tree-node:hover .node-actions {
  opacity: 1;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

/* 自定义树形组件样式 */
.category-tree :deep(.el-tree-node__content) {
  height: auto;
  padding: 4px 0;
}

.category-tree :deep(.el-tree-node__content:hover) {
  background-color: #f5f7fa;
}

.category-tree :deep(.el-tree-node__expand-icon) {
  color: #c0c4cc;
}

.category-tree :deep(.el-tree-node__expand-icon.expanded) {
  transform: rotate(90deg);
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
  
  .tree-node {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .node-actions {
    opacity: 1;
    width: 100%;
    justify-content: flex-start;
  }
}
</style>