<template>
  <div class="upload-image">
    <el-upload
      :action="uploadUrl"
      :headers="uploadHeaders"
      :show-file-list="false"
      :before-upload="beforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      :disabled="disabled"
      class="image-uploader"
      drag
    >
      <div v-if="imageUrl" class="image-preview">
        <img :src="imageUrl" alt="预览图" />
        <div class="image-overlay">
          <el-icon class="upload-icon"><Plus /></el-icon>
          <span>点击或拖拽替换图片</span>
        </div>
      </div>
      <div v-else class="upload-placeholder">
        <el-icon class="upload-icon"><Plus /></el-icon>
        <div class="upload-text">
          <p>点击或拖拽上传图片</p>
          <p class="upload-tip">支持 JPG、PNG、GIF 格式，大小不超过 {{ maxSizeMB }}MB</p>
        </div>
      </div>
    </el-upload>
    
    <div v-if="imageUrl" class="image-actions">
      <el-button size="small" @click="previewImage">预览</el-button>
      <el-button size="small" type="danger" @click="removeImage">删除</el-button>
    </div>
    
    <!-- 图片预览对话框 -->
    <el-dialog v-model="previewVisible" title="图片预览" width="60%">
      <div class="preview-container">
        <img :src="imageUrl" alt="预览图" style="max-width: 100%; max-height: 500px;" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { isImageFile, formatFileSize } from '@/utils'

interface Props {
  modelValue?: string
  maxSize?: number // 最大文件大小，单位MB
  disabled?: boolean
  accept?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'upload-success', url: string): void
  (e: 'upload-error', error: any): void
}

const props = withDefaults(defineProps<Props>(), {
  maxSize: 5,
  disabled: false,
  accept: 'image/jpeg,image/jpg,image/png,image/gif'
})

const emit = defineEmits<Emits>()

const imageUrl = ref(props.modelValue || '')
const previewVisible = ref(false)

// 计算属性
const maxSizeMB = computed(() => props.maxSize)
const uploadUrl = computed(() => '/api/upload/image')
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('admin_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

// 上传前验证
const beforeUpload = (file: File) => {
  // 检查文件类型
  if (!isImageFile(file)) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  
  // 检查文件大小
  const maxSizeBytes = props.maxSize * 1024 * 1024
  if (file.size > maxSizeBytes) {
    ElMessage.error(`图片大小不能超过 ${props.maxSize}MB！当前文件大小：${formatFileSize(file.size)}`)
    return false
  }
  
  return true
}

// 上传成功
const handleSuccess = (response: any) => {
  if (response.code === 200) {
    imageUrl.value = response.data.url
    emit('update:modelValue', response.data.url)
    emit('upload-success', response.data.url)
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

// 上传失败
const handleError = (error: any) => {
  console.error('上传失败:', error)
  ElMessage.error('图片上传失败，请重试')
  emit('upload-error', error)
}

// 预览图片
const previewImage = () => {
  previewVisible.value = true
}

// 删除图片
const removeImage = () => {
  imageUrl.value = ''
  emit('update:modelValue', '')
  ElMessage.success('图片已删除')
}

// 监听modelValue变化
watch(() => props.modelValue, (newValue) => {
  imageUrl.value = newValue || ''
})
</script>

<style scoped>
.upload-image {
  width: 100%;
}

.image-uploader {
  width: 100%;
}

.image-uploader :deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-uploader :deep(.el-upload:hover) {
  border-color: #409eff;
}

.image-preview {
  position: relative;
  width: 100%;
  height: 100%;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-preview:hover .image-overlay {
  opacity: 1;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #8c939d;
}

.upload-icon {
  font-size: 28px;
  margin-bottom: 16px;
}

.upload-text {
  text-align: center;
}

.upload-text p {
  margin: 0;
  line-height: 1.5;
}

.upload-tip {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 8px;
}

.image-actions {
  margin-top: 10px;
  text-align: center;
}

.image-actions .el-button {
  margin: 0 5px;
}

.preview-container {
  text-align: center;
}
</style>