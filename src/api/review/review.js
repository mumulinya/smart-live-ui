import request from '@/utils/request'

// 查询评价列表
export function listReview(query) {
    return request({
        url: '/interaction/review/list',
        method: 'get',
        params: query
    })
}

// 查询评价详细
export function getReview(id) {
    return request({
        url: '/interaction/review/' + id,
        method: 'get'
    })
}

// 新增评价
export function addReview(data) {
    return request({
        url: '/interaction/review',
        method: 'post',
        data: data
    })
}

// 修改评价
export function updateReview(data) {
    return request({
        url: '/interaction/review',
        method: 'put',
        data: data
    })
}

// 删除评价
export function delReview(id) {
    return request({
        url: '/interaction/review/' + id,
        method: 'delete'
    })
}

// ai生成评价
export function aiCreateReview() {
    return request({
        url: '/interaction/review/aiCreateReview',
        method: 'post'
    })
}

// 发布评价 (选中)
export function publishReview(id) {
    return request({
        url: '/interaction/review/publish/' + id,
        method: 'post'
    })
}

// 全量发布评价
export function publishAllReview() {
    return request({
        url: '/interaction/review/allPublish',
        method: 'post'
    })
}

