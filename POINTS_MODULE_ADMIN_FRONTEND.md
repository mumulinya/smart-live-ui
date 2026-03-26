# 积分模块后台管理端 - 前端设计文档 (Vue + Element Plus)

鉴于当前项目为移动端 App (Vant UI)，但 `package.json` 中已包含 `element-plus`，我们建议在同一项目中新增 `/admin` 路由模块，作为 PC 管理端入口。

## 1. 目录结构规划

建议在 `src/views` 下建立独立的 `admin` 目录：

```
src/
├── api/
│   └── admin/
│       └── points.js      // 管理端积分接口封装
├── views/
│   └── admin/
│       ├── layout/
│       │   └── Index.vue  // 管理端布局（侧边栏、头部）
│       └── points/
│           ├── RecordList.vue   // 积分明细查询
│           └── LotteryConfig.vue // 抽奖配置管理
└── router/
    └── index.js           // 增加 admin 路由配置
```

## 2. 路由配置

在 `src/router/index.js` 中增加如下路由：

```javascript
{
    path: '/admin',
    component: () => import('@/views/admin/layout/Index.vue'),
    redirect: '/admin/points/record',
    children: [
        {
            path: 'points/record',
            name: 'AdminPointsRecord',
            component: () => import('@/views/admin/points/RecordList.vue'),
            meta: { title: '积分明细管理' }
        },
        {
            path: 'points/lottery',
            name: 'AdminLotteryConfig',
            component: () => import('@/views/admin/points/LotteryConfig.vue'),
            meta: { title: '抽奖配置' }
        }
    ]
}
```

## 3. 页面功能设计

### 3.1 积分明细管理 (`RecordList.vue`)

- **组件**: 使用 `el-table` 展示数据，`el-pagination` 分页。
- **搜索栏**: `el-form` + `el-date-picker`。
- **操作**:
  - **手动发放/扣减**: 页面顶部提供一个“调整积分”按钮，点击弹出 `el-dialog`。
  - Dialog 中包含：用户ID/手机号输入框、调整类型（增加/减少）、金额、备注。

**Api 调用**:
- `getPointsRecordList(params)`
- `adjustUserPoints(data)`

### 3.2 抽奖配置管理 (`LotteryConfig.vue`)

- **展示**: `el-table` 展示当前奖品列表。
- **操作**:
  - **新增奖品**: 弹窗表单。
  - **编辑**: 点击行编辑，弹窗回显数据。
  - **上下架**: `el-switch` 开关直接调用状态切换接口。
  - **删除**: `el-popconfirm` 确认删除。

**表单字段**:
- 奖品名称 (`el-input`)
- 类型 (`el-select`: 积分/优惠券)
- 价值 (`el-input-number`)
- 库存 (`el-input-number`)
- 中奖概率 (`el-input-number`: 0.0-1.0)
- 排序 (`el-input-number`)

## 4. 开发步骤建议

1. **创建布局**: 若项目尚无 Admin 布局，先创建一个简单的左右结构布局 (`admin/layout/Index.vue`)。
2. **封装接口**: 创建 `src/api/admin/points.js`，对应后端文档中的 5 个接口。
3. **开发页面**: 依次开发 `RecordList.vue` 和 `LotteryConfig.vue`。
4. **权限控制**: (可选) 在路由守卫中增加 `/admin` 路径的管理员权限校验。
