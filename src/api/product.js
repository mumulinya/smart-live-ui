import request from '@/utils/request'

// Query Product List
export function listProduct(query) {
    return request({
        url: '/product/list',
        method: 'get',
        params: query
    })
}

// Get Product Details
export function getProduct(id) {
    return request({
        url: '/product/' + id,
        method: 'get'
    })
}

// Add Product
export function addProduct(data) {
    return request({
        url: '/product',
        method: 'post',
        data: data
    })
}

// Update Product
export function updateProduct(data) {
    return request({
        url: '/product',
        method: 'put',
        data: data
    })
}

// Delete Product
export function delProduct(id) {
    return request({
        url: '/product/' + id,
        method: 'delete'
    })
}

// Publish Product (Batch)
// Note: Adjusted from allPublish/publish in voucher.js
// If backend API for publishing changed, update here. Assuming generic /product/... or keeping mostly same structure but under /product
export function publishProduct(id) {
    return request({
        url: '/product/publish/' + id,
        method: 'post',
    })
}

// Publish All Products
export function publishAllProduct() {
    return request({
        url: '/product/allPublish',
        method: 'post',
    })
}

// Change Product Status (Up/Down shelf)
export function changeProductStatus(id, status) {
    return request({
        url: '/product/changeStatus',
        method: 'put',
        data: { id, status }
    })
}

// Add Stock
export function addProductStock(id) {
    return request({
        url: '/product/addStock/' + id,
        method: 'post'
    })
}
