<template>
  <div class="app-container home">
    <!-- 统计卡片区域 - 调整间距 -->
    <div class="stats-section">
      <el-row :gutter="50" class="stats-row">
        <el-col :xs="12" :sm="8" :lg="6">
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

        <el-col :xs="12" :sm="8" :lg="6">
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

        <el-col :xs="12" :sm="8" :lg="6">
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

        <el-col :xs="12" :sm="8" :lg="6">
          <div class="stats-card">
            <div class="stats-icon" style="background: #F56C6C;">
              <i class="el-icon-shopping-bag-1"></i>
            </div>
            <div class="stats-content">
              <div class="stats-number">{{ statsData.todayOrders }}</div>
              <div class="stats-label">今日订单</div>
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
              <el-button type="text" @click="$router.push('/shop/manage')">查看全部</el-button>
            </div>
          </template>
          <div class="dynamic-list">
            <div v-for="shop in recentShops" :key="shop.id" class="dynamic-item">
              <div class="dynamic-item-main">
                <div class="dynamic-title">{{ shop.name }}</div>
                <div class="dynamic-desc">{{ shop.category }} · {{ shop.address }}</div>
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
              <el-button type="text" @click="$router.push('/order/manage')">查看全部</el-button>
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
              <el-button type="text" @click="$router.push('/blog/manage')">查看全部</el-button>
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
    </el-row>

    <!-- 快捷操作 -->
    <el-card class="quick-action-card" shadow="never">
      <template #header>
        <span>快捷操作</span>
      </template>
      <div class="quick-actions">
        <el-button type="primary" icon="el-icon-plus" @click="$router.push('/shop/add')">
          新增店铺
        </el-button>
        <el-button type="success" icon="el-icon-edit" @click="$router.push('/blog/add')">
          发布博客
        </el-button>
        <el-button type="warning" icon="el-icon-goods" @click="$router.push('/coupon/add')">
          创建代金券
        </el-button>
        <el-button type="info" icon="el-icon-shopping-bag-1" @click="$router.push('/order/manage')">
          订单管理
        </el-button>
        <el-button type="danger" icon="el-icon-data-analysis" @click="$router.push('/statistics')">
          数据统计
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: "Dashboard",
  data() {
    return {
      version: "1.0.0",
      shopChartType: 'week',
      orderChartType: 'week',

      // 数据
      statsData: {
        totalShops: 0,
        totalBlogs: 0,
        totalCoupons: 0,
        todayOrders: 0,
        todayReviews: 0
      },
      recentShops: [],
      recentOrders: [],
      recentBlogs: [],

      shopChart: null,
      orderChart: null,
      couponChart: null,

      // 临时模拟数据
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
        }
      }
    }
  },
  mounted() {
    this.initData()
    this.$nextTick(() => {
      this.initCharts()
    })
  },
  beforeUnmount() {
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
     * 初始化页面数据
     */
    async initData() {
      try {
        // 使用模拟数据
        await this.useMockData()

      } catch (error) {
        console.error('初始化数据失败:', error)
        await this.useMockData()
      }
    },

    /**
     * 初始化图表
     */
    initCharts() {
      this.shopChart = echarts.init(document.getElementById('shopChart'))
      this.orderChart = echarts.init(document.getElementById('orderChart'))
      this.couponChart = echarts.init(document.getElementById('couponChart'))
      this.updateShopChart()
      this.updateOrderChart()
      this.updateCouponChart()
    },

    /**
     * 更新店铺图表
     */
    async updateShopChart() {
      try {
        const data = this.mockData.shopChart[this.shopChartType]
        this.renderShopChart(data)

      } catch (error) {
        console.error('更新店铺图表失败:', error)
        const data = this.mockData.shopChart[this.shopChartType]
        this.renderShopChart(data)
      }
    },

    /**
     * 更新订单图表
     */
    async updateOrderChart() {
      try {
        const data = this.mockData.orderChart[this.orderChartType]
        this.renderOrderChart(data)

      } catch (error) {
        console.error('更新订单图表失败:', error)
        const data = this.mockData.orderChart[this.orderChartType]
        this.renderOrderChart(data)
      }
    },

    /**
     * 更新代金券图表
     */
    async updateCouponChart() {
      try {
        const data = this.mockData.couponChart
        this.renderCouponChart(data)

      } catch (error) {
        console.error('更新代金券图表失败:', error)
        const data = this.mockData.couponChart
        this.renderCouponChart(data)
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
     * 处理店铺图表类型切换
     */
    handleShopChartTypeChange() {
      this.updateShopChart()
    },

    /**
     * 处理订单图表类型切换
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

    /**
     * 使用模拟数据
     */
    async useMockData() {
      // 模拟统计数据
      this.statsData = {
        totalShops: 156,
        totalBlogs: 89,
        totalCoupons: 234,
        todayOrders: 58,
        todayReviews: 89
      }

      // 模拟最新店铺
      this.recentShops = [
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
      ]

      // 模拟最新订单
      this.recentOrders = [
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
      ]

      // 模拟最新博客
      this.recentBlogs = [
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
      ]
    },

    goTarget(url) {
      window.open(url, '_blank')
    }
  }
}
</script>

<style scoped lang="scss">
.home {
  .stats-section {
    margin-bottom: 24px;
  }

  .stats-row {
    margin-bottom: 20px;
  }

  .stats-card {
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
    border: 1px solid #ebeef5;
    height: 120px;

    &:hover {
      box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }
  }

  .stats-icon {
    width: 70px;
    height: 70px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20px;
    flex-shrink: 0;

    i {
      font-size: 32px;
      color: white;
    }
  }

  .stats-content {
    flex: 1;
  }

  .stats-number {
    font-size: 28px;
    font-weight: 600;
    color: #303133;
    line-height: 1.2;
    margin-bottom: 6px;
  }

  .stats-label {
    font-size: 14px;
    color: #909399;
    font-weight: 400;
  }

  .chart-row {
    margin-bottom: 20px;
  }

  .chart-card, .dynamic-card {
    border: none;

    ::v-deep(.el-card__header) {
      border-bottom: 1px solid #EBEEF5;
      padding: 15px 20px;
    }
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .dynamic-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .dynamic-list {
    .dynamic-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 12px 0;
      border-bottom: 1px solid #F2F6FC;

      &:last-child {
        border-bottom: none;
      }
    }

    .dynamic-item-main {
      flex: 1;
      margin-right: 15px;
    }

    .dynamic-title {
      font-weight: 500;
      color: #303133;
      margin-bottom: 4px;
      line-height: 1.4;
    }

    .dynamic-desc {
      font-size: 12px;
      color: #909399;
      margin-bottom: 4px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .dynamic-time {
      font-size: 12px;
      color: #C0C4CC;
    }
  }

  .quick-action-card {
    border: none;

    .quick-actions {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .home {
    .quick-actions {
      justify-content: center;
    }

    .stats-card {
      padding: 20px;
      height: 100px;
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
      font-size: 22px;
    }
  }
}

@media (max-width: 1200px) {
  .home {
    .stats-card {
      padding: 20px;
    }

    .stats-icon {
      width: 60px;
      height: 60px;

      i {
        font-size: 28px;
      }
    }

    .stats-number {
      font-size: 24px;
    }
  }
}
</style>
