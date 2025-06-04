<template>
  <div class="coupon-form">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>{{ isEdit ? '编辑优惠券' : '新增优惠券' }}</h2>
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
        label-width="120px"
        class="coupon-form-content"
      >
        <el-row :gutter="20">
          <!-- 左侧表单 -->
          <el-col :xs="24" :md="16">
            <el-form-item label="优惠券名称" prop="title">
              <el-input
                v-model="form.title"
                placeholder="请输入优惠券名称，如：新客立减券"
                maxlength="50"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item label="优惠券类型" prop="type">
              <el-radio-group v-model="form.type" @change="handleTypeChange">
                <el-radio :label="1">满减券</el-radio>
                <el-radio :label="2">折扣券</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item :label="valueLabel" prop="value">
              <el-input-number
                v-model="form.value"
                :min="form.type === 1 ? 0.01 : 0.1"
                :max="form.type === 1 ? 99999 : 1"
                :precision="form.type === 1 ? 2 : 2"
                :step="form.type === 1 ? 1 : 0.01"
                style="width: 200px"
                :placeholder="form.type === 1 ? '请输入减免金额' : '请输入折扣率'"
              >
                <template #prepend v-if="form.type === 1">¥</template>
                <template #append v-if="form.type === 2">折</template>
              </el-input-number>
              <div class="form-tip">
                {{ form.type === 1 ? '减免金额，如：20表示减免20元' : '折扣率，如：0.75表示7.5折' }}
              </div>
            </el-form-item>
            
            <el-form-item label="最低使用金额" prop="minAmount">
              <el-input-number
                v-model="form.minAmount"
                :min="0"
                :precision="2"
                :step="1"
                style="width: 200px"
                placeholder="请输入最低使用金额"
              >
                <template #prepend>¥</template>
              </el-input-number>
              <div class="form-tip">订单金额满足此条件才能使用优惠券</div>
            </el-form-item>
            
            <el-form-item label="发放总量" prop="total">
              <el-input-number
                v-model="form.total"
                :min="1"
                :step="1"
                style="width: 200px"
                placeholder="请输入发放总量"
              />
              <div class="form-tip">优惠券的库存数量</div>
            </el-form-item>
            
            <el-form-item label="有效期" prop="dateRange">
              <el-date-picker
                v-model="dateRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 400px"
                @change="handleDateRangeChange"
              />
            </el-form-item>
          </el-col>
          
          <!-- 右侧预览 -->
          <el-col :xs="24" :md="8">
            <div class="coupon-preview">
              <h3>优惠券预览</h3>
              <div class="preview-card" :class="`type-${form.type}`">
                <div class="preview-header">
                  <div class="preview-value">
                    <span v-if="form.type === 1" class="value-amount">¥{{ form.value || 0 }}</span>
                    <span v-else class="value-discount">{{ form.value ? (form.value * 10).toFixed(1) : 0 }}折</span>
                  </div>
                  <div class="preview-type">
                    {{ form.type === 1 ? '满减券' : '折扣券' }}
                  </div>
                </div>
                <div class="preview-body">
                  <div class="preview-title">{{ form.title || '优惠券名称' }}</div>
                  <div class="preview-condition">
                    满¥{{ form.minAmount || 0 }}可用
                  </div>
                  <div class="preview-validity">
                    <div v-if="dateRange && dateRange[0] && dateRange[1]">
                      {{ formatPreviewDate(dateRange[0]) }} 至 {{ formatPreviewDate(dateRange[1]) }}
                    </div>
                    <div v-else class="placeholder">请选择有效期</div>
                  </div>
                  <div class="preview-stock">
                    库存：{{ form.total || 0 }}张
                  </div>
                </div>
              </div>
            </div>
            
            <div class="form-tips">
              <el-alert
                title="填写提示"
                type="info"
                :closable="false"
                show-icon
              >
                <ul>
                  <li>优惠券名称建议简洁明了，突出优惠内容</li>
                  <li>满减券：面值为减免金额，如20表示减免20元</li>
                  <li>折扣券：面值为折扣率，如0.75表示7.5折</li>
                  <li>最低使用金额应合理设置，避免过低或过高</li>
                  <li>有效期不能早于当前时间</li>
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import * as couponApi from '@/api/coupon'
import type { CouponForm } from '@/types'

const route = useRoute()
const router = useRouter()

// 表单引用
const formRef = ref<FormInstance>()

// 状态
const saving = ref(false)
const isEdit = computed(() => !!route.params.id)

// 日期范围
const dateRange = ref<[string, string] | null>(null)

// 表单数据
const form = reactive<CouponForm>({
  title: '',
  type: 1,
  value: 0,
  minAmount: 0,
  startTime: '',
  endTime: '',
  total: 100
})

// 计算属性
const valueLabel = computed(() => {
  return form.type === 1 ? '减免金额' : '折扣率'
})

// 表单验证规则
const rules: FormRules = {
  title: [
    { required: true, message: '请输入优惠券名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度在2到50个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择优惠券类型', trigger: 'change' }
  ],
  value: [
    { required: true, message: '请输入面值', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (form.type === 1) {
          if (value <= 0) {
            callback(new Error('减免金额必须大于0'))
          } else if (value >= form.minAmount) {
            callback(new Error('减免金额不能大于等于最低使用金额'))
          } else {
            callback()
          }
        } else {
          if (value <= 0 || value > 1) {
            callback(new Error('折扣率必须在0到1之间'))
          } else {
            callback()
          }
        }
      },
      trigger: 'blur'
    }
  ],
  minAmount: [
    { required: true, message: '请输入最低使用金额', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value < 0) {
          callback(new Error('最低使用金额不能小于0'))
        } else if (form.type === 1 && value <= form.value) {
          callback(new Error('最低使用金额必须大于减免金额'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  total: [
    { required: true, message: '请输入发放总量', trigger: 'blur' },
    { type: 'number', min: 1, message: '发放总量必须大于0', trigger: 'blur' }
  ]
  // 移除 dateRange 的验证规则，因为它不是表单模型中的字段
}

// 监听类型变化
const handleTypeChange = () => {
  // 重置面值
  form.value = 0
  // 重新验证表单
  formRef.value?.clearValidate(['value', 'minAmount'])
}

// 处理日期范围变化
const handleDateRangeChange = (value: [string, string] | null) => {
  if (value) {
    form.startTime = value[0]
    form.endTime = value[1]
  } else {
    form.startTime = ''
    form.endTime = ''
  }
}

// 格式化预览日期
const formatPreviewDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 获取优惠券详情
const fetchCoupon = async () => {
  if (!isEdit.value) return
  
  try {
    const coupon = await couponApi.getCoupon(route.params.id as string)
    
    // 填充表单数据
    Object.assign(form, {
      title: coupon.title,
      type: coupon.type,
      value: coupon.value,
      minAmount: coupon.minAmount,
      startTime: coupon.startTime,
      endTime: coupon.endTime,
      total: coupon.total
    })
    
    // 设置日期范围
    dateRange.value = [coupon.startTime, coupon.endTime]
  } catch (error) {
    console.error('获取优惠券详情失败:', error)
    ElMessage.error('获取优惠券详情失败')
    goBack()
  }
}

// 保存优惠券
const handleSave = async () => {
  if (!formRef.value) return
  
  try {
    // 验证表单
    await formRef.value.validate()
    
    // 验证日期范围
    if (!dateRange.value || !dateRange.value[0] || !dateRange.value[1]) {
      ElMessage.error('请选择有效期')
      return
    }
    
    // 验证有效期不能早于当前时间
    const now = new Date()
    const startTime = new Date(dateRange.value[0])
    if (startTime < now) {
      ElMessage.error('有效期开始时间不能早于当前时间')
      return
    }
    
    saving.value = true
    
    // 将时间转换为ISO 8601格式（带时区信息）
    const formatToISO = (dateStr: string) => {
      const date = new Date(dateStr)
      // 转换为中国时区的ISO格式
      const offset = 8 * 60 // 中国时区偏移量（分钟）
      const localTime = new Date(date.getTime() + offset * 60 * 1000)
      return localTime.toISOString().replace('Z', '+08:00')
    }
    
    const submitData = {
      ...form,
      startTime: formatToISO(dateRange.value[0]),
      endTime: formatToISO(dateRange.value[1])
    }
    
    if (isEdit.value) {
      await couponApi.updateCoupon(route.params.id as string, submitData)
      ElMessage.success('更新成功')
    } else {
      await couponApi.createCoupon(submitData)
      ElMessage.success('创建成功')
    }
    
    goBack()
  } catch (error) {
    console.error('保存优惠券失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.push('/coupons')
}

// 页面加载时的处理
onMounted(() => {
  if (isEdit.value) {
    fetchCoupon()
  }
})

// 监听表单变化，实时验证
watch(() => [form.value, form.minAmount, form.type], () => {
  if (formRef.value) {
    formRef.value.clearValidate(['value', 'minAmount'])
  }
}, { deep: true })
</script>

<style scoped>
.coupon-form {
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

.coupon-form-content {
  padding: 20px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.coupon-preview {
  margin-bottom: 20px;
}

.coupon-preview h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.preview-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.preview-card.type-1 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.preview-card.type-2 {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.preview-header {
  padding: 15px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.value-amount {
  font-size: 24px;
  font-weight: bold;
}

.value-discount {
  font-size: 20px;
  font-weight: bold;
}

.preview-type {
  font-size: 12px;
  margin-top: 5px;
  opacity: 0.9;
}

.preview-body {
  padding: 15px;
}

.preview-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
}

.preview-condition {
  font-size: 12px;
  margin-bottom: 8px;
  opacity: 0.9;
}

.preview-validity {
  font-size: 11px;
  margin-bottom: 8px;
  opacity: 0.8;
}

.preview-validity .placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.preview-stock {
  font-size: 11px;
  opacity: 0.8;
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
  
  .coupon-form-content {
    padding: 15px;
  }
  
  .coupon-form-content :deep(.el-form-item__label) {
    width: 100px !important;
  }
}
</style>