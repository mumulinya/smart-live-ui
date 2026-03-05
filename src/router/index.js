import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'

/**
 * Note: 路由配置项
 *
 * hidden: true                     // 当设置 true 的时候该路由不会再侧边栏出现 如 401，login等页面，或者如一些编辑页面 /edit/1
 * alwaysShow: true                 // 褰撲綘涓€涓矾鐢变笅闈㈢殑 children 澹版槑鐨勮矾鐢卞ぇ浜?涓椂锛岃嚜鍔ㄤ細鍙樻垚宓屽鐨勬ā寮?-濡傜粍浠堕〉闈? *                                  // 鍙湁涓€涓椂锛屼細灏嗛偅涓瓙璺敱褰撳仛鏍硅矾鐢辨樉绀哄湪渚ц竟鏍?-濡傚紩瀵奸〉闈? *                                  // 鑻ヤ綘鎯充笉绠¤矾鐢变笅闈㈢殑 children 澹版槑鐨勪釜鏁伴兘鏄剧ず浣犵殑鏍硅矾鐢? *                                  // 浣犲彲浠ヨ缃?alwaysShow: true锛岃繖鏍峰畠灏变細蹇界暐涔嬪墠瀹氫箟鐨勮鍒欙紝涓€鐩存樉绀烘牴璺敱
 * redirect: noRedirect             // 当设置 noRedirect 的时候该路由在面包屑导航中不可被点击
 * name:'router-name'               // 鍋囪璺敱閰嶇疆鍦ㄥ悗绔姩鎬佽繑鍥烇紝鎴栬€呭湪杩欓噷闈欐€佸畾涔夈€?// 濡傛灉鏄潤鎬佸畾涔夛紝闇€瑕佹壘鍒?voucher 鐨勮矾鐢卞苟淇敼銆?// 濡傛灉鏄姩鎬佽矾鐢憋紝鍓嶇閫氬父涓嶉渶瑕佹敼 router/index.js锛岃€屾槸鏀规暟鎹簱鑿滃崟 (Task #11)銆?// 浣嗘煡鐪?constantRoutes锛屼技涔庡彧鏈?login/404 绛夈€?// 璁╂垜浠鏌ユ槸鍚︽湁 moduleRoutes 鎴栬€?business 璺敱瀹氫箟銆?// 鏍规嵁涔嬪墠鐨?grep锛宻rc/router/index.js 鍙湁鍩虹璺敱銆?// 涓氬姟璺敱閫氬父鐢卞悗绔繑鍥?(userMenu)銆?// 鎵€浠ヨ繖閲屽彲鑳戒笉闇€瑕佷慨鏀?router/index.js锛岄櫎闈炴湁纭紪鐮佺殑璺宠浆銆?// 浣?Task #11 says "Update Router/Menu".
// Let's check src/store/modules/permission.js or similar file, or confirm whether it's all dynamic routing.
// Since grep didn't find voucher in router/index.js, it's likely dynamic routing.
// So we only need to ensure api/product.js and views/business/product/index.vue exist.
// Menu modification is usually done in the backend (sys_menu table).
// But to ensure frontend access, I can add a static route for testing, or prompt the user to modify the backend menu.
// "22.md" says: 1. Update API Paths. 2. Update Field Binding. 3. Handle Price Units.
// It doesn't explicitly say "Update Router File", just "Action Items".
// My Implementation Plan says "Router/Menu: Update Router/Menu to replace Marketing Management".
// Let's assume dynamic routing.
// However, I should check if there are any other references to 'marketing/voucher' in the codebase.
// 设定路由的名字，一定要填写不然使用 <keep-alive> 时会出现各种问题
 * query: '{"id": 1, "name": "ry"}' // 访问路由的默认传递参数
 * roles: ['admin', 'common']       // 访问路由的角色权限
 * permissions: ['a:a:a', 'b:b:b']  // 访问路由的菜单权限
 * meta : {
    noCache: true                   // 如果设置为true，则不会被 <keep-alive> 缓存(默认 false)
    title: 'title'                  // 设置该路由在侧边栏和面包屑中展示的名字
    icon: 'svg-name'                // 设置该路由的图标，对应路径src/assets/icons/svg
    breadcrumb: false               // 如果设置为false，则不会在breadcrumb面包屑中显示
    activeMenu: '/system/user'      // 当路由设置了该属性，则会高亮对应的侧边栏。
  }
 */

// 公共路由
export const constantRoutes = [
  {
    path: '/redirect',
    component: Layout,
    hidden: true,
    children: [
      {
        path: '/redirect/:path(.*)',
        component: () => import('@/views/redirect')
      }
    ]
  },
  {
    path: '/login',
    component: () => import('@/views/login'),
    hidden: true
  },
  {
    path: '/register',
    component: () => import('@/views/register'),
    hidden: true
  },
  {
    path: '/404',
    component: () => import('@/views/error/404'),
    hidden: true
  },
  {
    path: '/401',
    component: () => import('@/views/error/401'),
    hidden: true
  },
  {
    path: '',
    component: Layout,
    redirect: 'index',
    children: [
      {
        path: 'index',
        component: () => import('@/views/index'),
        name: 'Index',
        meta: { title: '首页', icon: 'dashboard', affix: true }
      }
    ]
  },
  {
    path: '/user',
    component: Layout,
    hidden: true,
    redirect: 'noredirect',
    children: [
      {
        path: 'profile',
        component: () => import('@/views/system/user/profile/index'),
        name: 'Profile',
        meta: { title: '个人中心', icon: 'user' }
      }
    ]
  },
  {
    path: '/points',
    component: Layout,
    redirect: '/points/record',
    name: 'Points',
    meta: { title: '积分管理', icon: 'money' },
    children: [
      {
        path: 'record',
        name: 'PointsRecord',
        component: () => import('@/views/system/points/RecordList'),
        meta: { title: '积分明细', icon: 'list' }
      },
      {
        path: 'lottery',
        name: 'LotteryConfig',
        component: () => import('@/views/system/points/LotteryConfig'),
        meta: { title: '抽奖配置', icon: 'star' }
      }
    ]
  },
]

// 鍔ㄦ€佽矾鐢憋紝鍩轰簬鐢ㄦ埛鏉冮檺鍔ㄦ€佸幓鍔犺浇
export const dynamicRoutes = [
  {
    path: '/system/user-auth',
    component: Layout,
    hidden: true,
    permissions: ['system:user:edit'],
    children: [
      {
        path: 'role/:userId(\\d+)',
        component: () => import('@/views/system/user/authRole'),
        name: 'AuthRole',
        meta: { title: '分配角色', activeMenu: '/system/user' }
      }
    ]
  },
  {
    path: '/system/role-auth',
    component: Layout,
    hidden: true,
    permissions: ['system:role:edit'],
    children: [
      {
        path: 'user/:roleId(\\d+)',
        component: () => import('@/views/system/role/authUser'),
        name: 'AuthUser',
        meta: { title: '分配用户', activeMenu: '/system/role' }
      }
    ]
  },
  {
    path: '/system/dict-data',
    component: Layout,
    hidden: true,
    permissions: ['system:dict:list'],
    children: [
      {
        path: 'index/:dictId(\\d+)',
        component: () => import('@/views/system/dict/data'),
        name: 'Data',
        meta: { title: '字典数据', activeMenu: '/system/dict' }
      }
    ]
  },
]

// 防止连续点击多次路由报错
let routerPush = Router.prototype.push
let routerReplace = Router.prototype.replace
// push
Router.prototype.push = function push(location) {
  return routerPush.call(this, location).catch(err => err)
}
// replace
Router.prototype.replace = function push(location) {
  return routerReplace.call(this, location).catch(err => err)
}

export default new Router({
  mode: 'history', // 去掉url中的#
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})

