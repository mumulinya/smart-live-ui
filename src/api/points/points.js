import request from '@/utils/request'

// 查询积分明细列表
export function listPointsRecord(query) {
    return request({
        url: '/points/record/list',
        method: 'get',
        params: query
    })
}

// 手动调整用户积分
export function adjustUserPoints(data) {
    return request({
        url: '/points/adjust',
        method: 'post',
        data: data
    })
}

// 查询抽奖奖品列表
export function listLotteryPrize(query) {
    return request({
        url: '/points/lottery/prize/list',
        method: 'get',
        params: query
    })
}

// 新增/编辑奖品
export function saveLotteryPrize(data) {
    return request({
        url: '/points/lottery/prize',
        method: 'post',
        data: data
    })
}

// 删除奖品
export function deleteLotteryPrize(id) {
    return request({
        url: '/points/lottery/prize/' + id,
        method: 'delete'
    })
}

// 上下架奖品
export function toggleLotteryPrize(id) {
    return request({
        url: '/points/lottery/prize/toggle/' + id,
        method: 'put'
    })
}
