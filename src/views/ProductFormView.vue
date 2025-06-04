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
            

            
            <el-form-item label="商品详情" prop="description">
              <div class="editor-container">
                <QuillEditor
                  ref="quillEditor"
                  v-model:content="form.description"
                  content-type="html"
                  :options="editorOptions"
                  style="height: 300px;"
                  @ready="onEditorReady"
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

// Quill编辑器实例引用
const quillEditor = ref<any>(null)

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

// 自定义图片上传处理器
const imageHandler = () => {
  const input = document.createElement('input')
  input.setAttribute('type', 'file')
  input.setAttribute('accept', 'image/*')
  input.click()
  
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      ElMessage.error('只能上传图片文件！')
      return
    }
    
    // 验证文件大小（5MB）
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      ElMessage.error('图片大小不能超过5MB！')
      return
    }
    
    try {
      // 显示上传进度
      const loadingMessage = ElMessage({
        message: '图片上传中...',
        type: 'info',
        duration: 0
      })
      
      // 调用图片上传API
      const response = await productApi.uploadImage(file)
      loadingMessage.close()
      
      // 获取编辑器实例
      const editor = quillEditor.value?.getQuill()
      if (!editor) return
      
      // 获取当前光标位置
      const range = editor.getSelection()
      const index = range ? range.index : editor.getLength()
      
      // 插入图片
      editor.insertEmbed(index, 'image', response)
      
      // 移动光标到图片后面
      editor.setSelection(index + 1)
      
      ElMessage.success('图片上传成功')
    } catch (error) {
      console.error('图片上传失败:', error)
      ElMessage.error('图片上传失败，请重试')
    }
  }
}

// 编辑器就绪回调
const onEditorReady = (quill: any) => {
  // 自定义图片上传处理器
  const toolbar = quill.getModule('toolbar')
  toolbar.addHandler('image', imageHandler)
}

// 处理富文本内容中的base64图片
const processRichTextImages = async (content: string): Promise<string> => {
  if (!content) return content
  
  // 匹配base64图片的正则表达式
  const base64ImageRegex = /<img[^>]+src="data:image\/[^;]+;base64,[^"]+"[^>]*>/g
  const base64Images = content.match(base64ImageRegex)
  
  if (!base64Images || base64Images.length === 0) {
    return content
  }
  
  let processedContent = content
  
  // 显示处理进度
  const loadingMessage = ElMessage({
    message: `正在处理 ${base64Images.length} 张图片...`,
    type: 'info',
    duration: 0
  })
  
  try {
    // 处理每个base64图片
    for (let i = 0; i < base64Images.length; i++) {
      const imgTag = base64Images[i]
      
      try {
        // 提取base64数据
        const srcMatch = imgTag.match(/src="(data:image\/[^;]+;base64,[^"]+)"/)
        if (!srcMatch) continue
        
        const base64Data = srcMatch[1]
        
        // 将base64转换为File对象
        const response = await fetch(base64Data)
        const blob = await response.blob()
        const file = new File([blob], `image_${i + 1}.png`, { type: blob.type })
        
        // 上传图片
        const uploadResponse = await productApi.uploadImage(file)
        
        // 替换base64图片为URL
        const newImgTag = imgTag.replace(base64Data, uploadResponse.url)
        processedContent = processedContent.replace(imgTag, newImgTag)
        
        // 更新进度
        loadingMessage.close()
        ElMessage({
          message: `已处理 ${i + 1}/${base64Images.length} 张图片`,
          type: 'info',
          duration: 1000
        })
      } catch (error) {
        console.error('处理base64图片失败:', error)
        // 如果上传失败，保留原始base64图片
      }
    }
    
    loadingMessage.close()
    if (base64Images.length > 0) {
      ElMessage.success(`成功处理 ${base64Images.length} 张图片`)
    }
  } catch (error) {
    loadingMessage.close()
    console.error('处理图片时发生错误:', error)
  }
  
  return processedContent
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
    // 将API返回的categoryId和categoryName映射为id和name
    categories.value = response.map(category => ({
      id: category.categoryId,
      name: category.categoryName
    }))
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
    // 处理后端返回的字段映射
    Object.assign(form, {
      title: product.goodName || product.title,
      categoryId: product.categoryId,
      categoryName: product.categoryName, // 赋值 categoryName
      price: product.price,
      stock: product.stock,
      image: product.coverUrl || product.image,
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
    
    // 处理富文本中的base64图片
    const processedDescription = await processRichTextImages(form.description)
    
    // 查找选中的分类名称并赋值给 form.categoryName
    const selectedCategory = categories.value.find(cat => cat.id === form.categoryId);
    if (selectedCategory) {
      form.categoryName = selectedCategory.name;
    }
    
    // 创建要提交的数据，使用处理后的描述
    const submitData = {
      ...form,
      description: processedDescription
    }

    if (isEdit.value) {
      // 更新商品
      await productApi.updateProduct(productId.value, submitData)
      ElMessage.success('更新成功')
    } else {
      // 创建商品
      await productApi.createProduct(submitData)
      ElMessage.success('创建成功')
    }
    
    // 更新本地表单数据
    form.description = processedDescription
    
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