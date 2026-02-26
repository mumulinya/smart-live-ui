# SmartLive UI

<p align="center">
  <img alt="Vue" src="https://img.shields.io/badge/Vue-2.6.x-42b883" />
  <img alt="Element UI" src="https://img.shields.io/badge/Element--UI-2.15.x-409EFF" />
  <img alt="Node" src="https://img.shields.io/badge/Node-%3E%3D14-success" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
</p>

SmartLive UI 是一个基于 Vue 2 + Element UI 的本地生活业务运营管理后台，覆盖店铺、商品/代金券、订单、笔记、评论、积分、审核、系统管理、监控与开发工具模块。项目基于 RuoYi-Vue 二次开发，适合快速搭建运营后台并对接 Spring Boot 后端。

## 目录

- [项目亮点](#项目亮点)
- [页面预览](#页面预览)
- [功能模块](#功能模块)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [常用命令](#常用命令)
- [环境变量](#环境变量)
- [后端代理](#后端代理)
- [项目结构](#项目结构)
- [路线图](#路线图)
- [参与贡献](#参与贡献)
- [开源协议](#开源协议)
- [致谢](#致谢)

## 项目亮点

- 动态权限路由：菜单与按钮权限由后端返回，前端按权限动态加载
- 业务链路完整：店铺、商品/代金券、订单、内容、评论、审核、积分全覆盖
- 运维工具齐全：内置表单构建与代码生成工具
- 可视化看板：集成 ECharts 展示核心运营数据
- 工程化可落地：环境隔离、代理转发、Gzip 压缩、代码分包

## 页面预览

建议将截图放在 `docs/images` 目录，并按如下命名维护：

```text
docs/images/
├─ dashboard.png
├─ business-shop.png
├─ business-product.png
├─ audit-center.png
└─ points-center.png
```

可直接在 README 中启用以下预览块：

```md
<!--
## 页面预览

### 首页看板
![首页看板](docs/images/dashboard.png)

### 店铺管理
![店铺管理](docs/images/business-shop.png)
-->
```

## 功能模块

### 认证与首页

| 页面 | 路径 | 功能说明 |
| --- | --- | --- |
| 登录 | `src/views/login.vue` | 验证码登录、Token 鉴权 |
| 注册 | `src/views/register.vue` | 用户注册 |
| 首页看板 | `src/views/index.vue` | KPI 卡片、趋势图、最新动态 |
| 个人中心 | `src/views/system/user/profile/*` | 资料维护、头像、密码修改 |
| 错误页 | `src/views/error/401.vue` `src/views/error/404.vue` | 异常页面处理 |

### 业务管理

| 页面 | 路径 | 功能说明 |
| --- | --- | --- |
| 店铺管理 | `src/views/business/shop/index.vue` | CRUD、分类筛选、地图选点、图片上传、缓存刷新、发布 |
| 商品管理 | `src/views/business/product/index.vue` | CRUD、普通/秒杀、库存、有效期、状态切换、批量发布 |
| 代金券管理 | `src/views/business/voucher/index.vue` | CRUD、库存变更、降价通知、状态切换 |
| 订单管理 | `src/views/business/order/index.vue` | CRUD、状态流转、支付方式、时间轴详情 |
| 笔记/博客管理 | `src/views/business/blog/index.vue` | CRUD、富文本、图片上传、发布 |
| 评论管理 | `src/views/business/comment/index.vue` | CRUD、来源过滤、状态控制、AI 生成评论 |
| APP 用户管理 | `src/views/business/user/index.vue` | CRUD、头像、发布 |

### 审核中心

| 页面 | 路径 | 功能说明 |
| --- | --- | --- |
| 审核中心 | `src/views/system/audit/index.vue` | 多业务审核（用户/文章/店铺/评价/评论/代金券/团购），支持通过/驳回 |

### 积分中心

| 页面 | 路径 | 功能说明 |
| --- | --- | --- |
| 积分明细 | `src/views/system/points/RecordList.vue` | 流水查询、时间筛选、用户筛选 |
| 积分调整 | `src/views/system/points/RecordList.vue` | 手动加减积分并记录备注 |
| 抽奖奖品配置 | `src/views/system/points/LotteryConfig.vue` | 奖品 CRUD、概率、库存、上下架 |

### 系统管理

| 页面 | 路径 | 功能说明 |
| --- | --- | --- |
| 用户管理 | `src/views/system/user/index.vue` | CRUD、角色分配、状态管理、重置密码 |
| 角色管理 | `src/views/system/role/index.vue` | CRUD、数据权限、分配用户 |
| 菜单管理 | `src/views/system/menu/index.vue` | 菜单/按钮权限配置 |
| 部门管理 | `src/views/system/dept/index.vue` | 组织架构维护 |
| 岗位管理 | `src/views/system/post/index.vue` | 岗位维护 |
| 字典管理 | `src/views/system/dict/index.vue` `src/views/system/dict/data.vue` | 字典类型与数据维护 |
| 参数设置 | `src/views/system/config/index.vue` | 系统参数与缓存刷新 |
| 通知公告 | `src/views/system/notice/index.vue` | 公告发布 |
| 操作日志 | `src/views/system/operlog/index.vue` | 操作日志查询 |
| 登录日志 | `src/views/system/logininfor/index.vue` | 登录日志、解锁、清理 |

### 监控中心

| 页面 | 路径 | 功能说明 |
| --- | --- | --- |
| 在线用户 | `src/views/monitor/online/index.vue` | 在线会话监控、强制下线 |
| 定时任务 | `src/views/monitor/job/index.vue` | CRUD、启停、立即执行 |
| 调度日志 | `src/views/monitor/job/log.vue` | 执行日志查询 |

### 开发工具

| 页面 | 路径 | 功能说明 |
| --- | --- | --- |
| 表单构建 | `src/views/tool/build/index.vue` | 拖拽式表单设计 |
| 代码生成 | `src/views/tool/gen/index.vue` | 表导入、配置、预览、生成、同步 |

## 技术栈

- Vue 2.6.x
- Element UI 2.15.x
- Vue Router + Vuex
- Axios
- ECharts 5.x
- Quill 2.x
- Sass
- Vue CLI 4 / Webpack 4

## 快速开始

### 环境要求

- Node.js：推荐 `14.x` 或 `16.x`
- npm：`>= 6`
- 后端服务：默认 `http://localhost:8080`

### 安装依赖

```bash
npm install --registry=https://registry.npmmirror.com
```

### 启动项目

```bash
npm run dev
```

启动后访问：`http://localhost:80`

## 常用命令

```bash
# 启动开发环境
npm run dev

# 构建测试环境
npm run build:stage

# 构建生产环境
npm run build:prod

# 预览构建结果
npm run preview
```

## 环境变量

| 文件 | 说明 |
| --- | --- |
| `.env.development` | 开发环境配置 |
| `.env.staging` | 测试环境配置 |
| `.env.production` | 生产环境配置 |

常用变量：

- `VUE_APP_TITLE`：系统标题
- `VUE_APP_BASE_API`：接口前缀（如 `/dev-api/admin`）
- `VUE_APP_FILE_BASE_API`：文件服务地址
- `VUE_FILE_PREFIX` / `VUE_APP_FILE_PREFIX`：文件路径前缀

## 后端代理

- 代理配置位置：`vue.config.js`
- 默认映射规则：`/dev-api/admin/** -> http://localhost:8080/admin/**`
- 动态菜单接口：`/system/menu/getRouters`

## 项目结构

```text
smartLive-ui
├─ public
├─ src
│  ├─ api
│  ├─ assets
│  ├─ components
│  ├─ directive
│  ├─ layout
│  ├─ router
│  ├─ store
│  ├─ utils
│  └─ views
│     ├─ business
│     ├─ system
│     ├─ monitor
│     └─ tool
├─ .env.development
├─ .env.staging
├─ .env.production
├─ vue.config.js
└─ package.json
```

## 路线图

- 补充真实页面截图到 `docs/images`
- 在仓库根目录补充 `LICENSE` 文件（当前 package 声明为 MIT）
- 更新 `package.json` 的作者和仓库地址为开源仓库信息
- 使用 `cross-env` 改造脚本，提升 Linux/macOS 兼容性

## 参与贡献

1. Fork 本仓库
2. 新建分支：`feature/your-feature`
3. 提交代码：`git commit -m "feat: add xxx"`
4. 推送分支并发起 Pull Request

## 开源协议

MIT

## 致谢

- [RuoYi-Vue](https://gitee.com/y_project/RuoYi-Vue)
- [Vue.js](https://vuejs.org/)
- [Element UI](https://element.eleme.cn/)
- [ECharts](https://echarts.apache.org/)
