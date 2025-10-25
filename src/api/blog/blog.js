import request from '@/utils/request'

// 分页查询博客列表
export function listBlog(query) {
  return request({
    url: '/blog/list',
    method: 'get',
    params: query
  })
}

// 查询博客详细
export function getBlog(id) {
  return request({
    url: '/blog/' + id,
    method: 'get'
  })
}

// 新增博客
export function addBlog(data) {
  return request({
    url: '/blog',
    method: 'post',
    data: data
  })
}

// 修改博客
export function updateBlog(data) {
  return request({
    url: '/blog',
    method: 'put',
    data: data
  })
}

// 删除博客
export function delBlog(id) {
  return request({
    url: '/blog/' + id,
    method: 'delete'
  })
}

// 查询博客列表
export function blogList() {
  return request({
    url: '/blog/blogList',
    method: 'get',
  })
}
export function allPublish(){
  return request({
    url: '/blog/allPublish',
    method: 'post',
  })
}
export function publish(id){
  return request({
    url: '/blog/publish/'+id,
    method: 'post',
  })
}
