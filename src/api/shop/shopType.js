import request from '@/utils/request'

// 查询【请填写功能名称】列表
export function listShopType(query) {
  return request({
    url: '/shop/shop-type/list',
    method: 'get',
    params: query
  })
}

// 查询【请填写功能名称】详细
export function getType(id) {
  return request({
    url: '/shop/shop-type/' + id,
    method: 'get'
  })
}

// 新增【请填写功能名称】
export function addType(data) {
  return request({
    url: '/shop/shop-type',
    method: 'post',
    data: data
  })
}

// 修改【请填写功能名称】
export function updateType(data) {
  return request({
    url: '/shop/shop-type',
    method: 'put',
    data: data
  })
}

// 删除【请填写功能名称】
export function delType(id) {
  return request({
    url: '/shop/shop-type/' + id,
    method: 'delete'
  })
}
