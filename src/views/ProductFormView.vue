<template>
  <div class="product-form">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>{{ isEdit ? '编辑商品' : '新增商品' }}</h2>
      <div class="header-actions">
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ saving ? '保存中...' : '保存' }}
        </el-button>
      </div>
    </div>
    
    <el-card>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="product-form-content"
      >
        <el-row :gutter="20">
          <!-- 左侧表单 -->
          <el-col :xs="24" :md="16">
            <el-form-item label="商品标题" prop="title">
              <el-input
                v-model="form.title"
                placeholder="请输入商品标题"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item label="商品分类" prop="categoryId">
              <el-select
                v-model="form.categoryId"
                placeholder="请选择商品分类"
                style="width: 100%"
              >
                <el-option
                  v-for="category in categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
            </el-form-item>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="商品价格" prop="price">
                  <el-input-number
                    v-model="form.price"
                    :min="0"
                    :precision="2"
                    :step="0.01"
                    style="width: 100%"
                    placeholder="请输入价格"
                  >
                    <template #prepend>¥</template>
                  </el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="库存数量" prop="stock">
                  <el-input-number
                    v-model="form.stock"
                    :min="0"
                    :step="1"
                    style="width: 100%"
                    placeholder="请输入库存"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="上架状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio label="online">立即上架</el-radio>
                <el-radio label="offline">暂不上架</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="商品详情" prop="description">
              <div class="editor-container">
                <QuillEditor
                  v-model:content="form.description"
                  content-type="html"
                  :options="editorOptions"
                  style="height: 300px;"
                />
              </div>
            </el-form-item>
          </el-col>
          
          <!-- 右侧图片上传 -->
          <el-col :xs="24" :md="8">
            <el-form-item label="商品主图" prop="image">
              <UploadImage
                v-model="form.image"
                :max-size="5"
                @upload-success="handleImageUpload"
              />
            </el-form-item>
            
            <div class="form-tips">
              <el-alert
                title="填写提示"
                type="info"
                :closable="false"
                show-icon
              >
                <ul>
                  <li>商品标题建议控制在50字以内</li>
                  <li>主图建议尺寸：800x800像素</li>
                  <li>图片格式支持：JPG、PNG、GIF</li>
                  <li>图片大小不超过5MB</li>
                </ul>
              </el-alert>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue' // 导入 onUnmounted
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import UploadImage from '@/components/UploadImage.vue'
import * as productApi from '@/api/product'
import type { Product, ProductCategory } from '@/types'

const route = useRoute()
const router = useRouter()

const formRef = ref<FormInstance>()
const saving = ref(false)
const categories = ref<ProductCategory[]>([])

// Quill编辑器配置
const editorOptions = {
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean'],
      ['link', 'image']
    ]
  },
  placeholder: '请输入商品详情...'
}

// 判断是否为编辑模式
const isEdit = computed(() => !!route.params.id)
const productId = computed(() => route.params.id as string)

// 表单数据
const form = reactive({
  title: '',
  categoryId: '',
  categoryName: '', // 添加 categoryName 属性
  price: 0,
  stock: 0,
  status: 'offline' as 'online' | 'offline',
  image: '',
  description: ''
})

// 表单验证规则
const rules: FormRules = {
  title: [
    { required: true, message: '请输入商品标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择商品分类', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入商品价格', trigger: 'blur' },
    { type: 'number', min: 0, message: '价格不能小于0', trigger: 'blur' }
  ],
  stock: [
    { required: true, message: '请输入库存数量', trigger: 'blur' },
    { type: 'number', min: 0, message: '库存不能小于0', trigger: 'blur' }
  ],
  image: [
    { required: true, message: '请上传商品主图', trigger: 'change' }
  ]
}

// 获取商品分类
const fetchCategories = async () => {
  try {
    const response = await productApi.getCategories()
    categories.value = response
  } catch (error) {
    console.error('获取分类失败:', error)
    ElMessage.error('获取分类失败')
  }
}

// 获取商品详情（编辑模式）
const fetchProduct = async () => {
  if (!isEdit.value) return
  
  try {
    const product = await productApi.getProduct(productId.value)
    Object.assign(form, {
      title: product.title,
      categoryId: product.categoryId,
      categoryName: product.categoryName, // 赋值 categoryName
      price: product.price,
      stock: product.stock,
      status: product.status,
      image: product.image,
      description: product.description || ''
    })
  } catch (error) {
    console.error('获取商品详情失败:', error)
    ElMessage.error('获取商品详情失败')
    goBack()
  }
}

// 图片上传成功回调
const handleImageUpload = (url: string) => {
  form.image = url
}

// 保存商品
const handleSave = async () => {
  if (!formRef.value) return
  
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
    
    saving.value = true
    
    // 查找选中的分类名称并赋值给 form.categoryName
    const selectedCategory = categories.value.find(cat => cat.id === form.categoryId);
    if (selectedCategory) {
      form.categoryName = selectedCategory.name;
    }

    if (isEdit.value) {
      // 更新商品
      await productApi.updateProduct(productId.value, form) // 传递包含 categoryName 的 form 对象
      ElMessage.success('更新成功')
    } else {
      // 创建商品
      await productApi.createProduct(form) // 传递包含 categoryName 的 form 对象
      ElMessage.success('创建成功')
    }
    
    goBack()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.push('/products')
}

// 页面离开前确认
const beforeUnload = (e: BeforeUnloadEvent) => {
  e.preventDefault()
  e.returnValue = ''
}

onMounted(() => {
  fetchCategories()
  if (isEdit.value) {
    fetchProduct()
  }
  
  // 添加页面离开确认
  window.addEventListener('beforeunload', beforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', beforeUnload)
})
</script>

<style scoped>
.product-form {
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

.product-form-content {
  padding: 20px;
}

.editor-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.editor-container :deep(.ql-editor) {
  min-height: 200px;
}

.form-tips {
  margin-top: 20px;
}

.form-tips ul {
  margin: 10px 0 0 0;
  padding-left: 20px;
}

.form-tips li {
  margin-bottom: 5px;
  font-size: 12px;
  color: #666;
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
  
  .product-form-content {
    padding: 15px;
  }
  
  .product-form-content :deep(.el-form-item__label) {
    width: 80px !important;
  }
}
</style>