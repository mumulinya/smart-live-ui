import request from '@/utils/request'

/**
 * 获取首页统计数据
 */
export function getIndexStats() {
  return request({
    url: '/index/stats',
    method: 'get'
  })
}

/**
 * 获取店铺统计图表数据
 * @param {string} type - 统计类型: week(本周)/month(本月)
 */
export function getShopStats(type = 'week') {
  return request({
    url: '/index/shop-stats',
    method: 'get',
    params: { type }
  })
}

/**
 * 获取订单统计图表数据
 * @param {string} type - 统计类型: week(本周)/month(本月)
 */
export function getOrderStats(type = 'week') {
  return request({
    url: '/index/order-stats',
    method: 'get',
    params: { type }
  })
}

/**
 * 获取代金券统计图表数据
 */
export function getCouponStats() {
  return request({
    url: '/index/coupon-stats',
    method: 'get'
  })
}

/**
 * 获取最新店铺列表
 * @param {number} limit - 返回数量
 */
export function getRecentShops(limit = 5) {
  return request({
    url: '/index/recent-shops',
    method: 'get',
    params: { limit }
  })
}

/**
 * 获取最新订单列表
 * @param {number} limit - 返回数量
 */
export function getRecentOrders(limit = 5) {
  return request({
    url: '/index/recent-orders',
    method: 'get',
    params: { limit }
  })
}

/**
 * 获取最新博客列表
 * @param {number} limit - 返回数量
 */
export function getRecentBlogs(limit = 5) {
  return request({
    url: '/index/recent-blogs',
    method: 'get',
    params: { limit }
  })
}
