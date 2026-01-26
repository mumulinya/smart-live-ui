<template>
  <div class="audit-center">
    <!-- 顶部Tab导航 -->
    <el-tabs v-model="activeTab" type="card" class="audit-tabs" @tab-click="handleTabChange">
      <el-tab-pane name="user">
        <span slot="label" class="tab-label">
          <i class="el-icon-user"></i>
          用户审核
          <el-badge v-if="getPendingCount('user')" :value="getPendingCount('user')" class="tab-badge" />
        </span>
      </el-tab-pane>
      <el-tab-pane name="blog">
        <span slot="label" class="tab-label">
          <i class="el-icon-document"></i>
          文章审核
          <el-badge v-if="getPendingCount('blog')" :value="getPendingCount('blog')" class="tab-badge" />
        </span>
      </el-tab-pane>
      <el-tab-pane name="shop">
        <span slot="label" class="tab-label">
          <i class="el-icon-s-shop"></i>
          店铺审核
          <el-badge v-if="getPendingCount('shop')" :value="getPendingCount('shop')" class="tab-badge" />
        </span>
      </el-tab-pane>
      <el-tab-pane name="comment">
        <span slot="label" class="tab-label">
          <i class="el-icon-chat-dot-round"></i>
          评论审核
          <el-badge v-if="getPendingCount('comment')" :value="getPendingCount('comment')" class="tab-badge" />
        </span>
      </el-tab-pane>
      <el-tab-pane name="voucher">
        <span slot="label" class="tab-label">
          <i class="el-icon-ticket"></i>
          代金券审核
          <el-tag type="danger" size="mini" class="risk-tag">高风险</el-tag>
          <el-badge v-if="getPendingCount('voucher')" :value="getPendingCount('voucher')" class="tab-badge" />
        </span>
      </el-tab-pane>
      <el-tab-pane name="group_buy">
        <span slot="label" class="tab-label">
          <i class="el-icon-shopping-cart-2"></i>
          团购套餐审核
          <el-tag type="danger" size="mini" class="risk-tag">高风险</el-tag>
          <el-badge v-if="getPendingCount('group_buy')" :value="getPendingCount('group_buy')" class="tab-badge" />
        </span>
      </el-tab-pane>
    </el-tabs>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 120px" @change="handleQuery">
            <el-option label="待审核" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="已驳回" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
          <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 列表区域 -->
    <el-table
      v-loading="loading"
      :data="currentList"
      border
      stripe
      class="audit-table"
    >
      <!-- 公共列 -->
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column label="提交人" width="150">
        <template slot-scope="{ row }">
          <div class="user-info">
            <span class="user-name">{{ row.userName }}</span>
            <span class="user-id">ID: {{ row.userId }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="submitTime" label="提交时间" width="170" />
      <el-table-column label="状态" width="100" align="center">
        <template slot-scope="{ row }">
          <el-tag :type="getStatusType(row.status)" effect="dark">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 用户审核专属列 -->
      <template v-if="activeTab === 'user'">
        <el-table-column label="头像对比" width="220" align="center">
          <template slot-scope="{ row }">
            <div class="avatar-compare">
              <div class="avatar-box">
                <el-image 
                  :src="getFileUrl(row.oldAvatar)" 
                  :preview-src-list="[getFileUrl(row.oldAvatar)]"
                  fit="cover"
                  class="avatar-thumb"
                >
                  <div slot="error" class="image-slot"><i class="el-icon-picture-outline"></i></div>
                </el-image>
                <span class="sub-label">旧</span>
              </div>
              <i class="el-icon-right arrow-icon"></i>
              <div class="avatar-box">
                <el-image 
                  :src="getFileUrl(row.newAvatar)" 
                  :preview-src-list="[getFileUrl(row.newAvatar)]"
                  fit="cover"
                  class="avatar-thumb"
                >
                  <div slot="error" class="image-slot"><i class="el-icon-picture-outline"></i></div>
                </el-image>
                <span class="sub-label">新</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="昵称变更" min-width="150">
          <template slot-scope="{ row }">
             <div v-if="row.newNickname">
               <span class="old-val">{{ row.oldNickname || '未设置' }}</span>
               <i class="el-icon-right"></i>
               <span class="new-val">{{ row.newNickname }}</span>
             </div>
             <div v-else class="text-gray">无变更</div>
          </template>
        </el-table-column>
      </template>

      <!-- 文章/评论专属列 -->
      <template v-if="activeTab === 'blog' || activeTab === 'comment'">
        <el-table-column :label="activeTab === 'blog' ? '标题' : '内容摘要'" min-width="200">
          <template slot-scope="{ row }">
            <el-tooltip :content="row.title || row.content" placement="top" :disabled="(row.title || row.content || '').length <= 50">
              <span class="text-ellipsis">{{ truncateText(row.title || row.content, 50) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
      </template>

      <!-- 店铺专属列 -->
      <template v-if="activeTab === 'shop'">
        <el-table-column prop="shopName" label="店铺名称" min-width="150" />
        <el-table-column prop="address" label="地址" min-width="200">
          <template slot-scope="{ row }">
            <el-tooltip :content="row.address" placement="top">
              <span class="text-ellipsis">{{ truncateText(row.address, 30) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
      </template>

      <!-- 代金券/团购专属列 -->
      <template v-if="activeTab === 'voucher' || activeTab === 'group_buy'">
        <el-table-column prop="name" label="名称" min-width="150" />
        <el-table-column label="价格信息" width="180">
          <template slot-scope="{ row }">
            <div class="price-info">
              <div class="price-row">
                <span class="label">原价：</span>
                <span class="original-price">¥{{ row.originalPrice }}</span>
              </div>
              <div class="price-row">
                <span class="label">优惠价：</span>
                <span :class="['sale-price', { 'text-danger': row.isHighRisk }]">¥{{ row.salePrice }}</span>
              </div>
              <div v-if="row.isHighRisk" class="risk-warning">
                <i class="el-icon-warning"></i> ⚠️ 价格异常
              </div>
            </div>
          </template>
        </el-table-column>
      </template>

      <!-- 操作列 -->
      <el-table-column label="操作" width="150" fixed="right" align="center">
        <template slot-scope="{ row }">
          <el-button type="primary" size="mini" @click="handleAudit(row)">
            {{ row.status === 0 ? '审核' : '详情' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        :current-page.sync="queryParams.pageNum"
        :page-size.sync="queryParams.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="getList"
        @current-change="getList"
      />
    </div>

    <!-- 审核详情弹窗 -->
    <el-dialog
      :visible.sync="dialogVisible"
      :title="currentItem ? '审核详情 - ' + getTypeName(activeTab) : ''"
      width="700px"
      :before-close="handleDialogClose"
    >
      <div v-if="currentItem" class="audit-detail">
        <!-- 公共信息 -->
        <el-descriptions title="基本信息" :column="2" border size="small" class="mb-20">
          <el-descriptions-item label="ID">{{ currentItem.id }}</el-descriptions-item>
          <el-descriptions-item label="提交人">{{ currentItem.userName }} (ID: {{ currentItem.userId }})</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentItem.submitTime }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentItem.status)" size="small">
              {{ getStatusText(currentItem.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- User类型详情：头像对比 -->
        <div v-if="activeTab === 'user'" class="detail-section">
          <div class="section-title">头像变更对比</div>
          <div class="avatar-compare-large">
            <div class="compare-item">
              <div class="label">当前头像</div>
              <el-image 
                :src="getFileUrl(currentItem.oldAvatar)" 
                :preview-src-list="[getFileUrl(currentItem.oldAvatar)]"
                fit="cover" 
                class="avatar-large"
              >
                <div slot="error" class="image-slot"><i class="el-icon-picture-outline"></i></div>
              </el-image>
            </div>
            <div class="compare-arrow"><i class="el-icon-right"></i></div>
            <div class="compare-item">
              <div class="label">新提交头像</div>
              <el-image 
                :src="getFileUrl(currentItem.newAvatar)" 
                :preview-src-list="[getFileUrl(currentItem.newAvatar)]"
                fit="cover" 
                class="avatar-large"
              >
                <div slot="error" class="image-slot"><i class="el-icon-picture-outline"></i></div>
              </el-image>
            </div>
          </div>
          <div v-if="currentItem.newNickname" class="nickname-section">
            <span class="label">昵称变更：</span>
            <span class="old">{{ currentItem.oldNickname || '未设置' }}</span>
            <i class="el-icon-right"></i>
            <span class="new">{{ currentItem.newNickname }}</span>
          </div>
        </div>

        <!-- Voucher/GroupBuy类型详情：券面信息 -->
        <div v-if="activeTab === 'voucher' || activeTab === 'group_buy'" class="detail-section">
          <div class="section-title">券面信息预览</div>
          <div class="voucher-card" :class="{ 'high-risk': currentItem.isHighRisk }">
             <div class="card-header">
               <span class="type-tag">{{ activeTab === 'voucher' ? '代金券' : '团购' }}</span>
               <span class="card-name">{{ currentItem.name }}</span>
               <el-tag v-if="currentItem.isHighRisk" type="danger" effect="dark" size="small">⚠️ 高风险</el-tag>
             </div>
             <div class="card-body">
               <div class="price-box">
                 <div class="orig-price">¥{{ currentItem.originalPrice }}</div>
                 <div class="arrow">↓</div>
                 <div class="sale-price">¥{{ currentItem.salePrice }}</div>
                 <div class="discount-tag">{{ calculateDiscount(currentItem.salePrice, currentItem.originalPrice) }}</div>
               </div>
               <div v-if="currentItem.isHighRisk" class="risk-alert">
                 <i class="el-icon-warning"></i> 价格异常：折扣力度过大，请谨慎审核
               </div>
               <div class="info-list">
                 <div class="info-item"><i class="el-icon-date"></i> 有效期：{{ currentItem.startTime }} 至 {{ currentItem.endTime }}</div>
                 <div class="info-item"><i class="el-icon-info"></i> 使用规则：{{ currentItem.rules }}</div>
                 <div class="info-item"><i class="el-icon-refresh-left"></i> 退款政策：{{ currentItem.refundPolicy }}</div>
               </div>
             </div>
          </div>
        </div>

        <!-- Shop类型详情：营业执照 -->
        <div v-if="activeTab === 'shop'" class="detail-section">
          <el-descriptions :column="1" border size="small" class="mb-20">
            <el-descriptions-item label="店铺名称">{{ currentItem.shopName }}</el-descriptions-item>
            <el-descriptions-item label="地址">{{ currentItem.address }}</el-descriptions-item>
            <el-descriptions-item label="电话">{{ currentItem.phone }}</el-descriptions-item>
          </el-descriptions>
          <div class="section-title">营业执照</div>
          <el-image 
            :src="getFileUrl(currentItem.licenseImage)" 
            :preview-src-list="[getFileUrl(currentItem.licenseImage)]"
            fit="contain"
            class="license-img"
          >
             <div slot="error" class="image-slot"><i class="el-icon-picture-outline"></i></div>
          </el-image>
        </div>

        <!-- Blog/Comment类型详情 -->
        <div v-if="activeTab === 'blog' || activeTab === 'comment'" class="detail-section">
          <div class="section-title">内容详情</div>
          <div v-if="activeTab === 'blog'" class="blog-preview">
             <h3>{{ currentItem.title }}</h3>
             <el-image v-if="currentItem.coverImage" :src="getFileUrl(currentItem.coverImage)" class="cover-img" />
             <div class="content-html" v-html="currentItem.content"></div>
          </div>
          <div v-else class="comment-preview">
            {{ currentItem.content }}
          </div>
        </div>
        
        <!-- 驳回原因展示 -->
        <div v-if="currentItem.status === 2 && currentItem.rejectReason" class="mt-20">
          <el-alert :title="'驳回原因: ' + currentItem.rejectReason" type="error" :closable="false" show-icon />
        </div>
      </div>

      <div slot="footer" class="dialog-footer">
        <template v-if="currentItem && currentItem.status === 0">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button type="danger" @click="openRejectDialog">驳回</el-button>
          <el-button type="success" :loading="btnLoading" @click="handlePass">通过</el-button>
        </template>
        <template v-else>
          <el-button @click="handleDialogClose">关闭</el-button>
        </template>
      </div>
    </el-dialog>

    <!-- 驳回输入弹窗 -->
    <el-dialog :visible.sync="rejectVisible" title="驳回审核" width="400px" append-to-body>
      <el-form ref="rejectFormRef" :model="rejectForm" :rules="rejectRules" label-width="0">
        <el-form-item prop="reason">
          <el-input 
            v-model="rejectForm.reason" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入驳回原因（必填）" 
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" :loading="btnLoading" @click="confirmReject">确认驳回</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
// 使用兼容 Vue 2 的语法
import { listAudit, auditAction } from '@/api/system/audit'

export default {
  name: 'AuditCenter',
  data() {
    return {
      activeTab: 'user',
      loading: false,
      btnLoading: false,
      dialogVisible: false,
      rejectVisible: false,
      baseUrl: process.env.VUE_APP_FILE_BASE_API,
      currentItem: null,
      currentList: [],
      total: 0,
      
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        status: 0,
        bizType: 'user'
      },
      
      // 驳回表单
      rejectForm: {
        reason: ''
      },
      rejectRules: {
        reason: [{ required: true, message: '请输入驳回原因', trigger: 'blur' }]
      },
      
      // 辅助映射
      typeMap: {
        user: '用户',
        blog: '文章',
        shop: '店铺',
        comment: '评论',
        voucher: '代金券',
        group_buy: '团购'
      }
    }
  },
  mounted() {
    // 默认高风险提示
    if (this.queryParams.bizType === 'voucher') {
       // logic if needed
    }
    this.getList()
  },
  methods: {
    getTypeName(type) {
      if (type === 'group_buy') return '团购'
      return this.typeMap[type] || ''
    },
    
    getStatusType(status) {
      const map = { 0: 'warning', 1: 'success', 2: 'danger' }
      return map[status] || 'info'
    },
    
    getStatusText(status) {
      const map = { 0: '待审核', 1: '已通过', 2: '已驳回' }
      return map[status] || '未知'
    },
    
    // 获取待审核统计（暂不实现或需后端支持）
    getPendingCount(type) {
      return 0
    },
    
    calculateDiscount(sale, original) {
      if (!original) return '-'
      return ((sale / original) * 10).toFixed(1) + '折'
    },
    
    truncateText(text, len) {
      if (!text) return ''
      return text.length > len ? text.slice(0, len) + '...' : text
    },

    getFileUrl(url) {
      if (!url) return ''
      if (url.startsWith('http') || url.startsWith('https')) return url
      
      let base = this.baseUrl || ''
      // 移除末尾斜杠
      if (base.endsWith('/')) base = base.slice(0, -1)
      // 移除开头斜杠
      if (url.startsWith('/')) url = url.slice(1)
      
      // 拼接
      let fullUrl = `${base}/${url}`
      
      // 处理重复的 /smart-live
      // 如果 base 包含 /smart-live 且 url 也以 smart-live 开头
      // 例如 base=.../smart-live, url=smart-live/...
      // 拼接后是 .../smart-live/smart-live/...
      // 我们将其替换为单个
      const doublePrefix = '/smart-live/smart-live'
      if (fullUrl.includes(doublePrefix)) {
          fullUrl = fullUrl.replace(doublePrefix, '/smart-live')
      }
      
      return fullUrl
    },
    
    async getList() {
      this.loading = true
      // 映射 bizType 字符串到枚举ID
      const typeEnumMap = {
          user: 1,
          shop: 2,
          blog: 3,
          voucher: 4,
          comment: 5,
          group_buy: 6
      }
      
      this.queryParams.bizType = typeEnumMap[this.activeTab]
      
      try {
        const response = await listAudit(this.queryParams)
        // Flatten auditContent
        this.currentList = response.rows.map(item => {
            const content = item.auditContent || {}
            return {
                ...item,
                ...content
            }
        })
        this.total = response.total
      } catch (error) {
        console.error(error)
      } finally {
        this.loading = false
      }
    },
    
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    
    resetQuery() {
      this.queryParams.status = 0
      this.handleQuery()
    },
    
    handleTabChange() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    
    handleAudit(row) {
      this.currentItem = Object.assign({}, row)
      this.dialogVisible = true
    },
    
    handleDialogClose() {
      this.dialogVisible = false
      this.currentItem = null
    },
    
    handlePass() {
      this.$confirm('确认通过该审核项吗？', '提示', { type: 'success' }).then(async () => {
        this.btnLoading = true
        try {
          await auditAction({
            id: this.currentItem.id,
            status: 1, // 1-通过
            reason: ''
          })
          this.$message.success('审核通过成功')
          this.dialogVisible = false
          this.getList()
        } catch (e) {
          console.error(e)
        } finally {
          this.btnLoading = false
        }
      }).catch(() => {})
    },
    
    openRejectDialog() {
      this.rejectForm.reason = ''
      this.rejectVisible = true
    },
    
    confirmReject() {
      this.$refs.rejectFormRef.validate(async (valid) => {
        if (valid) {
          this.btnLoading = true
          try {
            await auditAction({
              id: this.currentItem.id,
              status: 2, // 2-驳回
              reason: this.rejectForm.reason
            })
            
            this.$message.success('驳回成功')
            this.rejectVisible = false
            this.dialogVisible = false
            this.getList()
          } catch (e) {
            console.error(e)
          } finally {
            this.btnLoading = false
          }
        }
      })
    },
    
    // Mock 数据逻辑 (已弃用，保留作参考)
    async mockFetchLogic() {
      await new Promise(r => setTimeout(r, 300))
      const mockData = []
      const count = 10
      const type = this.activeTab
      
      for (let i = 0; i < count; i++) {
        const base = {
          id: i + 1,
          userId: 100 + i,
          userName: 'User_' + (100+i),
          submitTime: '2023-01-01 12:00:00',
          status: this.queryParams.status
        }
        
        if (type === 'user') {
          mockData.push(Object.assign(base, {
            oldAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
            newAvatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
            oldNickname: 'OldName',
            newNickname: 'NewName_' + i
          }))
        } else if (type === 'voucher' || type === 'group_buy') {
          const original = 100
          const sale = i % 2 === 0 ? 80 : 5
          mockData.push(Object.assign(base, {
            name: (type === 'voucher' ? '代金券' : '团购') + '_' + i,
            originalPrice: original,
            salePrice: sale,
            isHighRisk: sale < (original * 0.1),
            startTime: '2023-01-01',
            endTime: '2023-12-31',
            rules: '不可退款',
            refundPolicy: '过期作废'
          }))
        } else if (type === 'shop') {
          mockData.push(Object.assign(base, {
            shopName: '测试店铺_' + i,
            address: '某某街道123号',
            phone: '13800000000',
            licenseImage: 'https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg'
          }))
        } else {
          mockData.push(Object.assign(base, {
            title: '测试标题_' + i,
            content: new Array(5).fill('这是一段测试内容，用于展示摘要信息的截断效果...').join(''),
            coverImage: 'https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg'
          }))
        }
      }
      
      this.currentList = mockData
      this.total = 50
    }
  }
}
</script>

<style scoped>
.audit-center {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 84px);
}
.audit-tabs {
  background: #fff;
  padding: 10px 20px 0;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0,0,0,.05);
}
.tab-label {
  display: flex;
  align-items: center;
  gap: 5px;
}
.filter-section {
  background: #fff;
  padding: 18px 20px 0;
  margin: 10px 0;
  border-radius: 4px;
}
.audit-table {
  min-height: 400px;
}
.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.user-info {
  display: flex;
  flex-direction: column;
}
.user-name {
  font-weight: bold;
}
.price-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.original-price {
  text-decoration: line-through;
  color: #999;
}
.sale-price {
  font-weight: bold;
}
.text-danger {
  color: #f56c6c;
}
.risk-warning {
  color: #f56c6c;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

/* 头像对比样式 */
.avatar-compare {
  display: flex;
  align-items: center;
  justify-content: space-around;
}
.avatar-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.avatar-thumb {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  border: 1px solid #eee;
}
.sub-label {
  font-size: 12px;
  color: #666;
}
.arrow-icon {
  color: #909399;
  font-size: 16px;
}

/* 弹窗详情样式 */
.section-title {
  font-weight: bold;
  margin: 15px 0 10px;
  padding-left: 10px;
  border-left: 3px solid #409eff;
  font-size: 14px;
}
.avatar-compare-large {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  background: #f8f8f8;
  padding: 20px;
  border-radius: 8px;
}
.compare-item {
  text-align: center;
}
.avatar-large {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid #fff;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  margin-top: 10px;
}
.compare-arrow {
  font-size: 24px;
  color: #909399;
}
.nickname-section {
  text-align: center;
  margin-top: 15px;
  font-size: 16px;
}
.old {
  text-decoration: line-through;
  color: #999;
  margin-right: 10px;
}
.new {
  color: #409eff;
  font-weight: bold;
  margin-left: 10px;
}

/* 券面卡片样式 */
.voucher-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 20px;
  position: relative;
  overflow: hidden;
}
.voucher-card.high-risk {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%);
  color: #d9001b; /* 红色系字体 */
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.type-tag {
  background: rgba(255,255,255,0.2);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
.card-name {
  font-size: 18px;
  font-weight: bold;
  flex: 1;
  margin-left: 10px;
}
.price-box {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
}
.orig-price {
  text-decoration: line-through;
  opacity: 0.7;
}
.sale-price {
  font-size: 32px;
  font-weight: bold;
}
.discount-tag {
  background: #fff;
  color: #333;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
}
.risk-alert {
  background: rgba(255,0,0,0.1);
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: bold;
}
.info-list .info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 5px;
  opacity: 0.9;
}

.license-img {
  width: 100%;
  max-width: 400px;
  display: block;
  margin: 0 auto;
  border: 1px solid #ddd;
}
.blog-preview h3 {
  margin-top: 0;
}
.cover-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 10px;
}
.mb-20 {
  margin-bottom: 20px;
}
.mt-20 {
  margin-top: 20px;
}
</style>
