import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'

/**
 * Note: 璺敱閰嶇疆椤? *
 * hidden: true                     // 褰撹缃?true 鐨勬椂鍊欒璺敱涓嶄細鍐嶄晶杈规爮鍑虹幇 濡?01锛宭ogin绛夐〉闈紝鎴栬€呭涓€浜涚紪杈戦〉闈?edit/1
 * alwaysShow: true                 // 褰撲綘涓€涓矾鐢变笅闈㈢殑 children 澹版槑鐨勮矾鐢卞ぇ浜?涓椂锛岃嚜鍔ㄤ細鍙樻垚宓屽鐨勬ā寮?-濡傜粍浠堕〉闈? *                                  // 鍙湁涓€涓椂锛屼細灏嗛偅涓瓙璺敱褰撳仛鏍硅矾鐢辨樉绀哄湪渚ц竟鏍?-濡傚紩瀵奸〉闈? *                                  // 鑻ヤ綘鎯充笉绠¤矾鐢变笅闈㈢殑 children 澹版槑鐨勪釜鏁伴兘鏄剧ず浣犵殑鏍硅矾鐢? *                                  // 浣犲彲浠ヨ缃?alwaysShow: true锛岃繖鏍峰畠灏变細蹇界暐涔嬪墠瀹氫箟鐨勮鍒欙紝涓€鐩存樉绀烘牴璺敱
 * redirect: noRedirect             // 褰撹缃?noRedirect 鐨勬椂鍊欒璺敱鍦ㄩ潰鍖呭睉瀵艰埅涓笉鍙鐐瑰嚮
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
瑕佸～鍐欎笉鐒朵娇鐢?keep-alive>鏃朵細鍑虹幇鍚勭闂
 * query: '{"id": 1, "name": "ry"}' // 璁块棶璺敱鐨勯粯璁や紶閫掑弬鏁? * roles: ['admin', 'common']       // 璁块棶璺敱鐨勮鑹叉潈闄? * permissions: ['a:a:a', 'b:b:b']  // 璁块棶璺敱鐨勮彍鍗曟潈闄? * meta : {
    noCache: true                   // 濡傛灉璁剧疆涓簍rue锛屽垯涓嶄細琚?<keep-alive> 缂撳瓨(榛樿 false)
    title: 'title'                  // 璁剧疆璇ヨ矾鐢卞湪渚ц竟鏍忓拰闈㈠寘灞戜腑灞曠ず鐨勫悕瀛?    icon: 'svg-name'                // 璁剧疆璇ヨ矾鐢辩殑鍥炬爣锛屽搴旇矾寰剆rc/assets/icons/svg
    breadcrumb: false               // 濡傛灉璁剧疆涓篺alse锛屽垯涓嶄細鍦╞readcrumb闈㈠寘灞戜腑鏄剧ず
    activeMenu: '/system/user'      // 褰撹矾鐢辫缃簡璇ュ睘鎬э紝鍒欎細楂樹寒鐩稿搴旂殑渚ц竟鏍忋€?  }
 */

// 鍏叡璺敱
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
        meta: { title: '棣栭〉', icon: 'dashboard', affix: true }
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
        meta: { title: '涓汉涓績', icon: 'user' }
      }
    ]
  },
  {
    path: '/points',
    component: Layout,
    redirect: '/points/record',
    name: 'Points',
    meta: { title: '绉垎绠＄悊', icon: 'money' },
    children: [
      {
        path: 'record',
        name: 'PointsRecord',
        component: () => import('@/views/system/points/RecordList'),
        meta: { title: '绉垎鏄庣粏', icon: 'list' }
      },
      {
        path: 'lottery',
        name: 'LotteryConfig',
        component: () => import('@/views/system/points/LotteryConfig'),
        meta: { title: '鎶藉閰嶇疆', icon: 'star' }
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
        meta: { title: '鍒嗛厤瑙掕壊', activeMenu: '/system/user' }
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
        meta: { title: '鍒嗛厤鐢ㄦ埛', activeMenu: '/system/role' }
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
        meta: { title: '瀛楀吀鏁版嵁', activeMenu: '/system/dict' }
      }
    ]
  },
]

// 闃叉杩炵画鐐瑰嚮澶氭璺敱鎶ラ敊
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
  mode: 'history', // 鍘绘帀url涓殑#
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})

