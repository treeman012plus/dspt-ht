<template>
  <div class="table-pagination">
    <el-table
      :data="data"
      :loading="loading"
      v-bind="$attrs"
      @selection-change="handleSelectionChange"
    >
      <slot></slot>
    </el-table>
    
    <div class="pagination-wrapper" v-if="showPagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizes"
        :total="total"
        :layout="layout"
        :background="background"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  data: any[]
  total: number
  loading?: boolean
  page?: number
  pageSize?: number
  pageSizes?: number[]
  layout?: string
  background?: boolean
  showPagination?: boolean
}

interface Emits {
  (e: 'update:page', page: number): void
  (e: 'update:pageSize', pageSize: number): void
  (e: 'pagination-change', params: { page: number; pageSize: number }): void
  (e: 'selection-change', selection: any[]): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  page: 1,
  pageSize: 20,
  pageSizes: () => [10, 20, 50, 100],
  layout: 'total, sizes, prev, pager, next, jumper',
  background: true,
  showPagination: true
})

const emit = defineEmits<Emits>()

const currentPage = ref(props.page)
const pageSize = ref(props.pageSize)

// 监听props变化
watch(() => props.page, (newPage) => {
  currentPage.value = newPage
})

watch(() => props.pageSize, (newPageSize) => {
  pageSize.value = newPageSize
})

// 处理页码变化
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  emit('update:page', page)
  emit('pagination-change', { page, pageSize: pageSize.value })
}

// 处理每页条数变化
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1 // 重置到第一页
  emit('update:pageSize', size)
  emit('update:page', 1)
  emit('pagination-change', { page: 1, pageSize: size })
}

// 处理选择变化
const handleSelectionChange = (selection: any[]) => {
  emit('selection-change', selection)
}
</script>

<style scoped>
.table-pagination {
  width: 100%;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>