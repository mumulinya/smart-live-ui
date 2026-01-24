import request from '@/utils/request'

/**
 * 获取审核列表
 * @param {Object} params - 查询参数
 * @param {string} params.bizType - 业务类型: user|blog|shop|comment|voucher|group_buy
 * @param {number} params.status - 状态: 0=待审核, 1=通过, 2=驳回
 * @param {number} [params.pageNum] - 页码
 * @param {number} [params.pageSize] - 每页条数
 * @returns {Promise} 返回Promise对象，resolve后返回查询结果
 */
export function getAuditList(params) {
    return request({
        url: '/system/audit/list',
        method: 'get',
        params
    })
}

/**
 * 提交审核结果
 * @param {Object} data - 提交数据
 * @param {number} data.id - 审核项ID
 * @param {string} data.bizType - 业务类型
 * @param {number} data.action - 动作: 1=通过, 2=驳回
 * @param {string} [data.rejectReason] - 驳回原因(action=2时必填)
 * @returns {Promise} 返回Promise对象
 */
export function submitAuditAction(data) {
    return request({
        url: '/system/audit/action',
        method: 'post',
        data
    })
}
