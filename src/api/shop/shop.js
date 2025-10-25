import request from '@/utils/request'

// 查询店铺列表
export function listShop(query) {
  return request({
    url: '/shop/list',
    method: 'get',
    params: query
  })
}

// 查询店铺详细
export function getShop(id) {
  return request({
    url: '/shop/' + id,
    method: 'get'
  })
}

// 新增店铺
export function addShop(data) {
  return request({
    url: '/shop',
    method: 'post',
    data: data
  })
}

// 修改店铺
export function updateShop(data) {
  return request({
    url: '/shop',
    method: 'put',
    data: data
  })
}

// 删除店铺
export function delShop(id) {
  return request({
    url: '/shop/' + id,
    method: 'delete'
  })
}
//刷新缓存
export function flushCache() {
  return request({
    url: '/shop/flushCache' ,
    method: 'get'
  })
}
// 查询店铺列表
export function shopList() {
  return request({
    url: '/shop/shopList',
    method: 'get',
  })
}
// 查询店铺列表
export function shopTypeList() {
  return request({
    url: '/shop/shop-type/list',
    method: 'get',
  })
}
export function allPublish(){
  return request({
    url: '/shop/allPublish',
    method: 'post',
  })
}
export function publish(id){
  return request({
    url: '/shop/publish/'+id,
    method: 'post',
  })
}
