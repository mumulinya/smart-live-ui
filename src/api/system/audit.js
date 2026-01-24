import request from '@/utils/request'

// 查询审核任务列表
export function listAudit(query) {
  return request({
    url: '/audit/list',
    method: 'post',
    data: query
  })
}

// 提交审核结果
export function auditAction(data) {
  return request({
    url: '/audit/action',
    method: 'post',
    data: data
  })
}
