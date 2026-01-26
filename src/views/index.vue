<template>
  <div class="app-container home">
    <!-- 统计卡片区域 - 调整间距 -->
    <div class="stats-section">
      <el-row :gutter="20" class="stats-row">
        <!-- 现有统计 -->
        <el-col :xs="12" :sm="8" :lg="4">
          <div class="stats-card">
            <div class="stats-icon" style="background: #409EFF;">
              <i class="el-icon-office-building"></i>
            </div>
            <div class="stats-content">
              <div class="stats-number">{{ statsData.totalShops }}</div>
              <div class="stats-label">总店铺数</div>
            </div>
          </div>
        </el-col>

        <el-col :xs="12" :sm="8" :lg="4">
          <div class="stats-card">
            <div class="stats-icon" style="background: #67C23A;">
              <i class="el-icon-notebook-1"></i>
            </div>
            <div class="stats-content">
              <div class="stats-number">{{ statsData.totalBlogs }}</div>
              <div class="stats-label">总博客数</div>
            </div>
          </div>
        </el-col>

        <el-col :xs="12" :sm="8" :lg="4">
          <div class="stats-card">
            <div class="stats-icon" style="background: #E6A23C;">
              <i class="el-icon-goods"></i>
            </div>
            <div class="stats-content">
              <div class="stats-number">{{ statsData.totalCoupons }}</div>
              <div class="stats-label">总代金券</div>
            </div>
          </div>
        </el-col>

        <el-col :xs="12" :sm="8" :lg="4">
          <div class="stats-card">
            <div class="stats-icon" style="background: #F56C6C;">
              <i class="el-icon-shopping-bag-1"></i>
            </div>
            <div class="stats-content">
              <div class="stats-number">{{ statsData.totalOrders }}</div>
              <div class="stats-label">总订单</div>
            </div>
          </div>
        </el-col>

        <!-- 新增统计: 用户和评论 -->
        <el-col :xs="12" :sm="8" :lg="4">
          <div class="stats-card">
            <div class="stats-icon" style="background: #909399;">
              <i class="el-icon-user"></i>
            </div>
            <div class="stats-content">
              <div class="stats-number">{{ statsData.totalUsers }}</div>
              <div class="stats-label">总用户</div>
            </div>
          </div>
        </el-col>

        <el-col :xs="12" :sm="8" :lg="4">
          <div class="stats-card">
            <div class="stats-icon" style="background: #36a3f7;">
              <i class="el-icon-chat-dot-square"></i>
            </div>
            <div class="stats-content">
              <div class="stats-number">{{ statsData.totalComments }}</div>
              <div class="stats-label">总评论</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :sm="12" :lg="8">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="chart-header">
              <span>店铺数据统计</span>
              <el-radio-group v-model="shopChartType" size="mini" @change="handleShopChartTypeChange">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div id="shopChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="chart-header">
              <span>订单统计</span>
              <el-radio-group v-model="orderChartType" size="mini" @change="handleOrderChartTypeChange">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div id="orderChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="chart-header">
              <span>代金券使用情况</span>
            </div>
          </template>
          <div id="couponChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最新动态 -->
    <el-row :gutter="20" class="dynamic-row">
      <el-col :xs="24" :sm="12" :lg="8">
        <el-card class="dynamic-card" shadow="never">
          <template #header>
            <div class="dynamic-header">
              <span>最新店铺</span>
              <el-button type="text" @click="$router.push('/business/shop')">查看全部</el-button>
            </div>
          </template>
          <div class="dynamic-list">
            <div v-for="shop in recentShops" :key="shop.id" class="dynamic-item">
              <div class="dynamic-item-main">
                <div class="dynamic-title">{{ shop.name }}</div>
                <div class="dynamic-desc">{{ getShopTypeName(shop.category)}} · {{ shop.address }}</div>
                <div class="dynamic-time">{{ shop.createTime }}</div>
              </div>
              <el-tag :type="shop.status === 1 ? 'success' : 'danger'" size="small">
                {{ shop.status === 1 ? '营业中' : '已关闭' }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8">
        <el-card class="dynamic-card" shadow="never">
          <template #header>
            <div class="dynamic-header">
              <span>最新订单</span>
              <el-button type="text" @click="$router.push('/business/order')">查看全部</el-button>
            </div>
          </template>
          <div class="dynamic-list">
            <div v-for="order in recentOrders" :key="order.id" class="dynamic-item">
              <div class="dynamic-item-main">
                <div class="dynamic-title">订单号：{{ order.orderNo }}</div>
                <div class="dynamic-desc">{{ order.shopName }} · ¥{{ order.amount }}</div>
                <div class="dynamic-time">{{ order.createTime }}</div>
              </div>
              <el-tag :type="getOrderStatusType(order.status)" size="small">
                {{ getOrderStatusText(order.status) }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8">
        <el-card class="dynamic-card" shadow="never">
          <template #header>
            <div class="dynamic-header">
              <span>最新博客</span>
              <el-button type="text" @click="$router.push('/business/blog')">查看全部</el-button>
            </div>
          </template>
          <div class="dynamic-list">
            <div v-for="blog in recentBlogs" :key="blog.id" class="dynamic-item">
              <div class="dynamic-item-main">
                <div class="dynamic-title">{{ blog.title }}</div>
                <div class="dynamic-desc">{{ blog.summary }}</div>
                <div class="dynamic-time">{{ blog.createTime }}</div>
              </div>
              <el-tag :type="blog.status === 1 ? 'success' : 'warning'" size="small">
                {{ blog.status === 1 ? '已发布' : '草稿' }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 新增: 最新用户 -->
      <el-col :xs="24" :sm="12" :lg="12">
        <el-card class="dynamic-card" shadow="never">
          <template #header>
            <div class="dynamic-header">
              <span>最新用户</span>
              <el-button type="text" @click="$router.push('/business/user')">查看全部</el-button>
            </div>
          </template>
          <div class="dynamic-list">
            <div v-for="user in recentUsers" :key="user.id" class="dynamic-item">
              <div class="dynamic-item-main">
                <div class="dynamic-title">{{ user.nickName }}</div>
                <div class="dynamic-desc">ID: {{ user.id }} · {{ user.city || '未知城市' }}</div>
                <div class="dynamic-time">{{ user.createTime }}</div>
              </div>
              <el-tag :type="user.status === '0' ? 'success' : 'danger'" size="small">
                {{ user.status === '0' ? '正常' : '禁用' }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 新增: 最新评论 -->
      <el-col :xs="24" :sm="12" :lg="12">
        <el-card class="dynamic-card" shadow="never">
          <template #header>
            <div class="dynamic-header">
              <span>最新评论</span>
              <el-button type="text" @click="$router.push('/business/comment')">查看全部</el-button>
            </div>
          </template>
          <div class="dynamic-list">
            <div v-for="comment in recentComments" :key="comment.id" class="dynamic-item">
              <div class="dynamic-item-main">
                <div class="dynamic-title">{{ comment.userName }}</div>
                <div class="dynamic-desc" v-html="comment.content"></div>
                <div class="dynamic-time">{{ comment.createTime }}</div>
              </div>
               <el-tag :type="comment.sourceType === '1' ? 'primary' : 'success'" size="small">
                {{ comment.sourceType === '1' ? '博客' : '店铺' }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts'
// 引入封装的首页API请求函数
import {
  getIndexStats,
  getShopStats,
  getOrderStats,
  getCouponStats,
  getRecentOrders,
  getRecentBlogs, getRecentShops
} from '@/api/index'
import {listShopType} from "@/api/shop/shopType";
import {listUser} from "@/api/user/user"
import {listComment} from "@/api/comment/comment"

export default {
  name: "Dashboard",
  data() {
    return {
      version: "1.0.0",
      shopChartType: 'week',
      orderChartType: 'week',
      loading: false, // 加载状态
      // 新增：店铺类型列表（下拉框数据源）
      shopTypeList: [],
      // 核心数据（匹配后端返回格式）
      statsData: {
        totalShops: 0,
        totalBlogs: 0,
        totalCoupons: 0,
        totalOrders: 0,
        totalUsers: 0, // 新增
        totalComments: 0, // 新增
        todayReviews: 0
      },
      recentShops: [], // 最新店铺列表
      recentOrders: [], // 最新订单列表
      recentBlogs: [], // 最新博客列表
      recentUsers: [], // 最新用户列表
      recentComments: [], // 最新评论列表
      // 列表总数（可选）
      shopTotal: 0,
      orderTotal: 0,
      blogTotal: 0,
      userTotal: 0,
      commentTotal: 0,

      // 图表实例
      shopChart: null,
      orderChart: null,
      couponChart: null,

      // 降级mock数据（接口失败时使用）
      mockData: {
        shopChart: {
          week: {
            dates: ['01-08', '01-09', '01-10', '01-11', '01-12', '01-13', '01-14'],
            newShops: [5, 8, 12, 6, 15, 9, 11],
            approvedShops: [4, 7, 10, 5, 13, 8, 10]
          },
          month: {
            dates: ['12-15', '12-20', '12-25', '12-30', '01-04', '01-09', '01-14'],
            newShops: [8, 12, 6, 15, 9, 11, 7],
            approvedShops: [7, 10, 5, 13, 8, 10, 6]
          }
        },
        orderChart: {
          week: {
            dates: ['01-08', '01-09', '01-10', '01-11', '01-12', '01-13', '01-14'],
            orders: [45, 52, 48, 60, 55, 58, 62],
            revenue: [1250, 1580, 1420, 1680, 1550, 1620, 1750]
          },
          month: {
            dates: ['12-15', '12-20', '12-25', '12-30', '01-04', '01-09', '01-14'],
            orders: [38, 45, 52, 48, 60, 55, 58],
            revenue: [980, 1250, 1580, 1420, 1680, 1550, 1620]
          }
        },
        couponChart: {
          used: 156,
          unused: 45,
          expired: 33
        },
        totalOrders: [
          {
            id: 1,
            name: '海底捞火锅(朝阳大悦城店)',
            category: '火锅',
            address: '朝阳区建国路88号',
            status: 1,
            createTime: '2024-01-15 14:30:22'
          },
          {
            id: 2,
            name: '星巴克臻选(三里屯店)',
            category: '咖啡',
            address: '朝阳区三里屯路19号',
            status: 1,
            createTime: '2024-01-15 11:20:15'
          },
          {
            id: 3,
            name: '西贝莜面村(王府井店)',
            category: '西北菜',
            address: '东城区王府井大街138号',
            status: 1,
            createTime: '2024-01-14 16:45:33'
          }
        ],
        recentOrders: [
          {
            id: 1,
            orderNo: 'DD202401150001',
            shopName: '海底捞火锅',
            amount: 268,
            status: 3,
            createTime: '2024-01-15 14:25:10'
          },
          {
            id: 2,
            orderNo: 'DD202401150002',
            shopName: '星巴克咖啡',
            amount: 45,
            status: 2,
            createTime: '2024-01-15 13:40:22'
          },
          {
            id: 3,
            orderNo: 'DD202401150003',
            shopName: '西贝莜面村',
            amount: 189,
            status: 1,
            createTime: '2024-01-15 12:15:35'
          }
        ],
        recentBlogs: [
          {
            id: 1,
            title: '2024年最值得尝试的10家餐厅，吃货必看！',
            summary: '本文为您推荐今年最受欢迎的餐厅，从环境、口味、服务等多个维度进行评价...',
            status: 1,
            createTime: '2024-01-15 10:20:15'
          },
          {
            id: 2,
            title: '冬日暖心美食推荐：火锅的正确打开方式',
            summary: '寒冷的冬天最适合吃火锅了，但你知道如何选择最适合自己的火锅店吗？...',
            status: 1,
            createTime: '2024-01-14 15:40:22'
          },
          {
            id: 3,
            title: '探店报告：新开业的日料店究竟如何？',
            summary: '实地探访最近新开的一家日料店，从食材新鲜度、服务态度、环境氛围等方面详细评测...',
            status: 0,
            createTime: '2024-01-14 11:25:18'
          }
        ],
        statsData: {
          totalShops: 156,
          totalBlogs: 89,
          totalCoupons: 234,
          totalOrders: 58,
          todayReviews: 89
        }
      }
    }
  },
  mounted() {
    this.getShopTypeList() // 初始化加载店铺类型列表
    this.initData()
    this.$nextTick(() => {
      this.initCharts()
    })
  },
  beforeUnmount() {
    // 销毁图表实例，避免内存泄漏
    if (this.shopChart) {
      this.shopChart.dispose()
    }
    if (this.orderChart) {
      this.orderChart.dispose()
    }
    if (this.couponChart) {
      this.couponChart.dispose()
    }
  },
  methods: {
    /**
     * 初始化页面数据（核心：调用真实接口，适配rows/total格式）
     */
    async initData() {
      this.loading = true
      try {
        // 1. 获取首页统计数据
        const statsRes = await getIndexStats()
        if (statsRes.code === 200) {
          this.statsData = statsRes.data
        } else {
          throw new Error('统计数据请求失败')
        }

        // 2. 获取最新店铺列表（指定的请求方式：rows/total）
        await getRecentShops({ limit: 5 }).then(response => {
          this.recentShops = response.data
        }).catch(() => {
          this.recentShops = this.mockData.recentShops
        })

        // 3. 获取最新订单列表（指定的请求方式：rows/total）
        await getRecentOrders({ limit: 5 }).then(response => {
          this.recentOrders = response.data.rows
          this.orderTotal = response.data.total
        }).catch(() => {
          this.recentOrders = this.mockData.recentOrders
        })

        // 4. 获取最新博客列表（指定的请求方式：rows/total）
        await getRecentBlogs({ limit: 5 }).then(response => {
          this.recentBlogs = response.data.rows
          this.blogTotal = response.data.total
        }).catch(() => {
          this.recentBlogs = this.mockData.recentBlogs
        })

        // 5. 获取最新用户列表 (复用查询列表接口)
        await listUser({ pageNum: 1, pageSize: 5 }).then(response => {
            this.recentUsers = response.rows || []
            this.userTotal = response.total
            this.statsData.totalUsers = response.total
        })

        // 6. 获取最新评论列表 (复用查询列表接口)
        await listComment({ pageNum: 1, pageSize: 5 }).then(response => {
            this.recentComments = response.rows || []
             // 简单的增强处理，模拟一些显示数据
            this.recentComments.forEach(item => {
               // 这里如果接口返回了userName最好，否则可能需要额外查询，暂时假设后端或者之前逻辑能处理
               // 实际comment list row里应该包含 userName 字段 if 联查
            })
            this.commentTotal = response.total
            this.statsData.totalComments = response.total
        })

      } catch (error) {
        console.error('初始化数据失败:', error)
        // 全部失败则使用mock数据降级
        this.useMockData()
      } finally {
        this.loading = false
      }
    },

    /**
     * 初始化图表实例
     */
    initCharts() {
      this.shopChart = echarts.init(document.getElementById('shopChart'))
      this.orderChart = echarts.init(document.getElementById('orderChart'))
      this.couponChart = echarts.init(document.getElementById('couponChart'))
      this.updateShopChart()
      this.updateOrderChart()
      this.updateCouponChart()

      // 监听窗口大小变化，自适应图表
      window.addEventListener('resize', () => {
        this.shopChart?.resize()
        this.orderChart?.resize()
        this.couponChart?.resize()
      })
    },

    /**
     * 更新店铺图表（调用真实接口）
     */
    async updateShopChart() {
      try {
        await getShopStats(this.shopChartType).then(response => {
          if (response.code === 200) {
            this.renderShopChart(response.data)
          } else {
            throw new Error(response.msg)
          }
        })
      } catch (error) {
        console.error('更新店铺图表失败:', error)
        this.renderShopChart(this.mockData.shopChart[this.shopChartType])
      }
    },

    /**
     * 更新订单图表（调用真实接口）
     */
    async updateOrderChart() {
      try {
        await getOrderStats(this.orderChartType).then(response => {
          if (response.code === 200) {
            this.renderOrderChart(response.data)
          } else {
            throw new Error(response.msg)
          }
        })
      } catch (error) {
        console.error('更新订单图表失败:', error)
        this.renderOrderChart(this.mockData.orderChart[this.orderChartType])
      }
    },

    /**
     * 更新代金券图表（调用真实接口）
     */
    async updateCouponChart() {
      try {
        await getCouponStats().then(response => {
          if (response.code === 200) {
            this.renderCouponChart(response.data)
          } else {
            throw new Error(response.msg)
          }
        })
      } catch (error) {
        console.error('更新代金券图表失败:', error)
        this.renderCouponChart(this.mockData.couponChart)
      }
    },

    /**
     * 渲染店铺图表
     */
    renderShopChart(data) {
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['新增店铺', '审核通过']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: data.dates
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '新增店铺',
            type: 'line',
            data: data.newShops,
            smooth: true,
            itemStyle: {
              color: '#409EFF'
            }
          },
          {
            name: '审核通过',
            type: 'line',
            data: data.approvedShops,
            smooth: true,
            itemStyle: {
              color: '#67C23A'
            }
          }
        ]
      }
      this.shopChart.setOption(option)
    },

    /**
     * 渲染订单图表
     */
    renderOrderChart(data) {
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            crossStyle: {
              color: '#999'
            }
          }
        },
        legend: {
          data: ['订单数量', '营收金额']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: data.dates
        },
        yAxis: [
          {
            type: 'value',
            name: '订单数量',
            position: 'left'
          },
          {
            type: 'value',
            name: '营收金额',
            position: 'right',
            axisLabel: {
              formatter: '¥{value}'
            }
          }
        ],
        series: [
          {
            name: '订单数量',
            type: 'bar',
            data: data.orders,
            itemStyle: {
              color: '#E6A23C'
            }
          },
          {
            name: '营收金额',
            type: 'line',
            yAxisIndex: 1,
            data: data.revenue,
            smooth: true,
            itemStyle: {
              color: '#F56C6C'
            }
          }
        ]
      }
      this.orderChart.setOption(option)
    },

    /**
     * 渲染代金券图表
     */
    renderCouponChart(data) {
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center',
          data: ['已使用', '未使用', '已过期']
        },
        series: [
          {
            name: '代金券状态',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: data.used, name: '已使用' },
              { value: data.unused, name: '未使用' },
              { value: data.expired, name: '已过期' }
            ]
          }
        ]
      }
      this.couponChart.setOption(option)
    },

    /**
     * 店铺图表类型切换
     */
    handleShopChartTypeChange() {
      this.updateShopChart()
    },

    /**
     * 订单图表类型切换
     */
    handleOrderChartTypeChange() {
      this.updateOrderChart()
    },

    /**
     * 获取订单状态标签类型
     */
    getOrderStatusType(status) {
      const statusMap = {
        1: 'primary',   // 待支付
        2: 'warning',   // 待使用
        3: 'success',   // 已完成
        4: 'info',      // 已退款
        5: 'danger'     // 已取消
      }
      return statusMap[status] || 'info'
    },

    /**
     * 获取订单状态文本
     */
    getOrderStatusText(status) {
      const statusMap = {
        1: '待支付',
        2: '待使用',
        3: '已完成',
        4: '已退款',
        5: '已取消'
      }
      return statusMap[status] || '未知状态'
    },

    /** 新增：加载店铺类型列表（下拉框数据源） */
    getShopTypeList() {
      listShopType().then(response => {
        this.shopTypeList = response.data || [] // 适配后端返回格式
      }).catch(error => {
        console.error('加载店铺类型失败:', error)
        this.$message.error('加载店铺类型失败，请刷新页面')
      })
    },
    /** 新增：根据typeId获取店铺类型名称 */
    getShopTypeName(typeId) {
      if (!typeId) return ''
      const type = this.shopTypeList.find(item => item.id === typeId)
      return type ? type.name : '未知类型'
    },

    /**
     * 降级使用mock数据
     */
    useMockData() {
      this.statsData = this.mockData.statsData
      this.totalOrders = this.mockData.totalOrders
      this.recentOrders = this.mockData.recentOrders
      this.recentBlogs = this.mockData.recentBlogs
    },

    /**
     * 打开新窗口（备用方法）
     */
    goTarget(url) {
      window.open(url, '_blank')
    }
  }
}
</script>

<style scoped lang="scss">
.home {
  padding-bottom: 20px;

  .stats-section {
    margin-bottom: 20px;
  }

  .stats-row {
    margin-bottom: 20px;
  }

  .stats-card {
    background: #fff;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.05); // softer shadow
    display: flex;
    align-items: center;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    border: none; // remove border for cleaner look
    height: 120px;
    position: relative;
    overflow: hidden;

    &::after {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
        transform: rotate(30deg);
        opacity: 0;
        transition: opacity 0.5s;
        pointer-events: none;
    }

    &:hover {
      box-shadow: 0 10px 30px 0 rgba(0, 0, 0, 0.1);
      transform: translateY(-5px);
      &::after {
          opacity: 0.1;
      }
    }
  }

  .stats-icon {
    width: 60px;
    height: 60px;
    border-radius: 16px; // softer corners
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20px;
    flex-shrink: 0;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);

    i {
      font-size: 28px;
      color: white;
    }
  }

  .stats-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .stats-number {
    font-size: 32px;
    font-weight: 700;
    color: #2c3e50;
    line-height: 1.1;
    margin-bottom: 4px;
    letter-spacing: -0.5px;
  }

  .stats-label {
    font-size: 14px;
    color: #909399;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .chart-row {
    margin-bottom: 25px;
  }

  .chart-card, .dynamic-card {
    border: none;
    border-radius: 12px;
    box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.05);
    margin-bottom: 20px;
    background: #fff;

    ::v-deep(.el-card__header) {
      border-bottom: 1px solid #f0f2f5;
      padding: 20px 25px;
      font-weight: 600;
      font-size: 16px;
      color: #303133;
    }
    
    ::v-deep(.el-card__body) {
        padding: 20px;
    }
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    span {
        position: relative;
        padding-left: 12px;
        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 16px;
            background: #409EFF;
            border-radius: 2px;
        }
    }
  }

  .dynamic-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    span {
        position: relative;
        padding-left: 12px;
        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 16px;
            background: #67C23A; // Different color for lists
            border-radius: 2px;
        }
    }
    .el-button {
        font-size: 13px;
        padding: 0;
    }
  }

  .dynamic-list {
    .dynamic-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start; // Align top for better multiline support
      padding: 15px 0;
      border-bottom: 1px solid #f2f6fc;
      transition: background-color 0.2s;
      
      &:last-child {
        border-bottom: none;
      }
      
      &:hover {
          background-color: #f9fafc;
          border-radius: 8px;
          padding-left: 10px;
          padding-right: 10px;
          margin: 0 -10px; // Compensate padding
      }

      .dynamic-item-main {
        flex: 1;
        margin-right: 15px;

        .dynamic-title {
          font-size: 14px;
          color: #303133;
          font-weight: 500;
          margin-bottom: 6px;
          line-height: 1.4;
        }

        .dynamic-desc {
          font-size: 12px;
          color: #909399;
          margin-bottom: 6px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .dynamic-time {
          font-size: 12px;
          color: #C0C4CC;
        }
      }
    }
  }
}

  // 响应式调整
  @media (max-width: 768px) {
    .stats-card {
      padding: 15px;
      height: auto;
    }

    .stats-icon {
      width: 50px;
      height: 50px;
      margin-right: 15px;

      i {
        font-size: 24px;
      }
    }

    .stats-number {
      font-size: 24px;
    }
  }
</style>
