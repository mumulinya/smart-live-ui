import request from '@/utils/request'

// 分页查询优惠券列表
export function listVoucher(query) {
  return request({
    url: '/marketing/voucher/list',
    method: 'get',
    params: query
  })
}

// 查询优惠券详细
export function getVoucher(id) {
  return request({
    url: '/marketing/voucher/' + id,
    method: 'get'
  })
}

// 新增优惠券
export function addVoucher(data) {
  return request({
    url: '/marketing/voucher',
    method: 'post',
    data: data
  })
}

// 修改优惠券
export function updateVoucher(data) {
  return request({
    url: '/marketing/voucher',
    method: 'put',
    data: data
  })
}

// 删除优惠券
export function delVoucher(id) {
  return request({
    url: '/marketing/voucher/' + id,
    method: 'delete'
  })
}
// 查询优惠券列表
export function voucherList() {
  return request({
    url: '/marketing/voucher/voucherList',
    method: 'get',
  })
}
export function allPublish() {
  return request({
    url: '/marketing/voucher/allPublish',
    method: 'post',
  })
}
export function publish(id) {
  return request({
    url: '/marketing/voucher/publish/' + id,
    method: 'post',
  })
}

// 增加库存（发送MQ消息）
export function addStock(id) {
  return request({
    url: '/marketing/voucher/addStock/' + id,
    method: 'post'
  })
}

// 修改优惠券状态（上架/下架）
export function changeVoucherStatus(id, status) {
  return request({
    url: '/marketing/voucher/changeStatus',
    method: 'put',
    data: { id, status }
  })
}

// 价格降低通知（发送MQ消息）
export function priceReduced(id) {
  return request({
    url: '/marketing/voucher/priceReduced/' + id,
    method: 'post'
  })
}
