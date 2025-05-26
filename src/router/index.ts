import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      redirect: '/dashboard',
      component: () => import('../views/LayoutView.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
          meta: { title: '仪表盘', requiresAuth: true }
        },
        {
          path: 'products',
          name: 'products',
          component: () => import('../views/ProductListView.vue'),
          meta: { title: '商品列表', requiresAuth: true }
        },
        {
          path: 'products/add',
          name: 'product-add',
          component: () => import('../views/ProductFormView.vue'),
          meta: { title: '新增商品', requiresAuth: true }
        },
        {
          path: 'products/edit/:id',
          name: 'product-edit',
          component: () => import('../views/ProductFormView.vue'),
          meta: { title: '编辑商品', requiresAuth: true }
        },
        {
          path: 'categories',
          name: 'categories',
          component: () => import('../views/CategoryView.vue'),
          meta: { title: '商品分类', requiresAuth: true }
        },
        {
          path: 'orders',
          name: 'orders',
          component: () => import('../views/OrderListView.vue'),
          meta: { title: '订单列表', requiresAuth: true }
        },
        {
          path: 'orders/:id',
          name: 'order-detail',
          component: () => import('../views/OrderDetailView.vue'),
          meta: { title: '订单详情', requiresAuth: true }
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('../views/UserListView.vue'),
          meta: { title: '用户列表', requiresAuth: true }
        },
        {
          path: 'users/:id',
          name: 'user-detail',
          component: () => import('../views/UserDetailView.vue'),
          meta: { title: '用户详情', requiresAuth: true }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: { requiresAuth: false }
    }
  ],
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // 检查是否需要认证
  if (to.meta.requiresAuth !== false) {
    if (!authStore.isLoggedIn) {
      ElMessage.warning('请先登录')
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
    
    // 检查token是否过期
    if (!authStore.checkTokenExpire()) {
      next({ name: 'login' })
      return
    }
  }
  
  // 如果已登录且访问登录页，重定向到首页
  if (to.name === 'login' && authStore.isLoggedIn) {
    next({ name: 'dashboard' })
    return
  }
  
  next()
})

// 设置页面标题
router.afterEach((to) => {
  const title = to.meta.title as string
  if (title) {
    document.title = `${title} - 电商后台管理系统`
  } else {
    document.title = '电商后台管理系统'
  }
})

export default router
