<template>
  <div class="app-container lottery-config">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <i class="el-icon-present"></i>
          抽奖奖品配置
        </h2>
        <span class="page-desc">管理抽奖活动中的奖品，包括奖品类型、库存及中奖概率</span>
      </div>
      <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增奖品</el-button>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <div class="stat-card stat-total">
          <div class="stat-icon"><i class="el-icon-box"></i></div>
          <div class="stat-content">
            <div class="stat-value">{{ prizeList.length }}</div>
            <div class="stat-label">奖品总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-online">
          <div class="stat-icon"><i class="el-icon-circle-check"></i></div>
          <div class="stat-content">
            <div class="stat-value">{{ onlineCount }}</div>
            <div class="stat-label">上架中</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-stock">
          <div class="stat-icon"><i class="el-icon-goods"></i></div>
          <div class="stat-content">
            <div class="stat-value">{{ totalStock }}</div>
            <div class="stat-label">总库存</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-low">
          <div class="stat-icon"><i class="el-icon-warning-outline"></i></div>
          <div class="stat-content">
            <div class="stat-value">{{ lowStockCount }}</div>
            <div class="stat-label">低库存</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 奖品列表 -->
    <div class="table-wrapper">
      <el-table v-loading="loading" :data="prizeList" stripe class="prize-table">
        <el-table-column label="ID" align="center" prop="id" width="60" />
        <el-table-column label="奖品名称" align="left" min-width="180">
          <template slot-scope="{ row }">
            <div class="prize-name-cell">
              <span class="prize-icon-box" :class="row.type === 'points' ? 'type-points' : 'type-coupon'">
                <i :class="row.type === 'points' ? 'el-icon-coin' : 'el-icon-ticket'"></i>
              </span>
              <div class="prize-name-info">
                <span class="prize-name">{{ row.name }}</span>
                <el-tag :type="row.type === 'points' ? 'primary' : 'success'" size="mini" effect="plain">
                  {{ row.type === 'points' ? '积分奖品' : '优惠券奖品' }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="价值" align="center" width="120">
          <template slot-scope="{ row }">
            <span class="value-text">
              <span class="value-num">{{ row.value }}</span>
              <span class="value-unit">{{ row.type === 'points' ? '积分' : '元' }}</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="库存" align="center" width="120">
          <template slot-scope="{ row }">
            <div class="stock-cell">
              <span :class="['stock-num', { 'stock-low': row.stock <= 10, 'stock-out': row.stock === 0 }]">
                {{ row.stock }}
              </span>
              <el-tag v-if="row.stock === 0" type="danger" size="mini" effect="dark" class="stock-tag">已空</el-tag>
              <el-tag v-else-if="row.stock <= 10" type="warning" size="mini" effect="light" class="stock-tag">低库存</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="中奖概率" align="center" width="140">
          <template slot-scope="{ row }">
            <div class="probability-cell">
              <el-progress
                :percentage="row.probability * 100"
                :stroke-width="8"
                :show-text="false"
                :color="getProbabilityColor(row.probability)"
                style="width: 60px; display: inline-block; vertical-align: middle; margin-right: 6px"
              />
              <span class="probability-text">{{ (row.probability * 100).toFixed(1) }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="排序" align="center" prop="sort" width="80">
          <template slot-scope="{ row }">
            <span class="sort-badge">{{ row.sort }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="100">
          <template slot-scope="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              active-color="#67C23A"
              inactive-color="#dcdfe6"
              @change="handleToggle(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="170">
          <template slot-scope="{ row }">
            <span class="time-text"><i class="el-icon-time"></i> {{ parseTime(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="180" fixed="right">
          <template slot-scope="{ row }">
            <el-button size="mini" type="text" icon="el-icon-edit" @click="handleEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除该奖品吗？" icon="el-icon-warning" icon-color="#F56C6C" @confirm="handleDelete(row)">
              <el-button slot="reference" size="mini" type="text" icon="el-icon-delete" class="text-danger" style="margin-left: 10px">删除</el-button>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑奖品弹窗 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="580px" append-to-body class="prize-dialog">
      <el-form ref="prizeForm" :model="prizeForm" :rules="prizeRules" label-width="100px" class="prize-form">
        <el-form-item label="奖品名称" prop="name">
          <el-input v-model="prizeForm.name" placeholder="请输入奖品名称" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="奖品类型" prop="type">
          <el-radio-group v-model="prizeForm.type" class="type-radio-group">
            <el-radio-button label="points">
              <i class="el-icon-coin"></i> 积分
            </el-radio-button>
            <el-radio-button label="coupon">
              <i class="el-icon-ticket"></i> 优惠券
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="价值" prop="value">
              <el-input-number v-model="prizeForm.value" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="库存" prop="stock">
              <el-input-number v-model="prizeForm.stock" :min="0" :max="999999" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="中奖概率" prop="probability">
          <div class="probability-input-wrapper">
            <el-slider v-model="probabilityPercent" :max="100" :step="0.1" :format-tooltip="val => val + '%'" style="flex: 1; margin-right: 16px" />
            <el-input-number v-model="prizeForm.probability" :min="0" :max="1" :step="0.01" :precision="4" style="width: 150px" />
          </div>
          <div class="form-tip">
            <i class="el-icon-info"></i>
            范围 0 ~ 1.0，例如 0.05 = 5% 概率
          </div>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="prizeForm.sort" :min="0" :max="999" style="width: 160px" />
          <span class="form-tip inline-tip">数字越小越靠前</span>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">
          {{ prizeForm.id ? '保存修改' : '确认添加' }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listLotteryPrize, saveLotteryPrize, deleteLotteryPrize, toggleLotteryPrize } from '@/api/points/points'

export default {
  name: 'LotteryConfig',
  data() {
    return {
      loading: false,
      submitLoading: false,
      prizeList: [],
      dialogVisible: false,
      dialogTitle: '',
      prizeForm: {
        id: undefined,
        name: '',
        type: 'points',
        value: 0,
        stock: 0,
        probability: 0,
        sort: 0
      },
      prizeRules: {
        name: [{ required: true, message: '请输入奖品名称', trigger: 'blur' }],
        type: [{ required: true, message: '请选择奖品类型', trigger: 'change' }],
        value: [{ required: true, message: '请输入奖品价值', trigger: 'blur' }],
        stock: [{ required: true, message: '请输入库存数量', trigger: 'blur' }],
        probability: [{ required: true, message: '请输入中奖概率', trigger: 'blur' }]
      }
    }
  },
  computed: {
    onlineCount() {
      return this.prizeList.filter(item => item.status === 1).length
    },
    totalStock() {
      return this.prizeList.reduce((sum, item) => sum + (item.stock || 0), 0)
    },
    lowStockCount() {
      return this.prizeList.filter(item => item.stock <= 10).length
    },
    probabilityPercent: {
      get() {
        return +(this.prizeForm.probability * 100).toFixed(2)
      },
      set(val) {
        this.prizeForm.probability = +(val / 100).toFixed(4)
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 查询奖品列表 */
    getList() {
      this.loading = true
      listLotteryPrize().then(response => {
        this.prizeList = response.rows || response.data || []
      }).finally(() => {
        this.loading = false
      })
    },
    /** 概率颜色 */
    getProbabilityColor(probability) {
      if (probability >= 0.3) return '#67C23A'
      if (probability >= 0.1) return '#E6A23C'
      return '#F56C6C'
    },
    /** 新增 */
    handleAdd() {
      this.resetPrizeForm()
      this.dialogTitle = '新增奖品'
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.prizeForm && this.$refs.prizeForm.clearValidate()
      })
    },
    /** 编辑 */
    handleEdit(row) {
      this.prizeForm = Object.assign({}, row)
      this.dialogTitle = '编辑奖品'
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.prizeForm && this.$refs.prizeForm.clearValidate()
      })
    },
    /** 重置表单 */
    resetPrizeForm() {
      this.prizeForm = {
        id: undefined,
        name: '',
        type: 'points',
        value: 0,
        stock: 0,
        probability: 0,
        sort: 0
      }
    },
    /** 提交表单 */
    submitForm() {
      this.$refs.prizeForm.validate(valid => {
        if (valid) {
          this.submitLoading = true
          saveLotteryPrize(this.prizeForm).then(() => {
            this.$message.success(this.prizeForm.id ? '修改成功' : '新增成功')
            this.dialogVisible = false
            this.getList()
          }).finally(() => {
            this.submitLoading = false
          })
        }
      })
    },
    /** 上下架 */
    handleToggle(row) {
      const text = row.status === 1 ? '上架' : '下架'
      toggleLotteryPrize(row.id).then(() => {
        this.$message.success(text + '成功')
      }).catch(() => {
        row.status = row.status === 1 ? 0 : 1
      })
    },
    /** 删除 */
    handleDelete(row) {
      deleteLotteryPrize(row.id).then(() => {
        this.$message.success('删除成功')
        this.getList()
      })
    }
  }
}
</script>

<style scoped>
/* ===== 页面头部 ===== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-title {
  margin: 0 0 4px;
  font-size: 20px;
  color: #303133;
  font-weight: 600;
}
.page-title i {
  color: #409EFF;
  margin-right: 6px;
}
.page-desc {
  font-size: 13px;
  color: #909399;
}

/* ===== 统计卡片 ===== */
.stats-row {
  margin-bottom: 20px;
}
.stat-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin-right: 14px;
  flex-shrink: 0;
}
.stat-total .stat-icon {
  background: rgba(64, 158, 255, 0.1);
  color: #409EFF;
}
.stat-online .stat-icon {
  background: rgba(103, 194, 58, 0.1);
  color: #67C23A;
}
.stat-stock .stat-icon {
  background: rgba(230, 162, 60, 0.1);
  color: #E6A23C;
}
.stat-low .stat-icon {
  background: rgba(245, 108, 108, 0.1);
  color: #F56C6C;
}
.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 2px;
}

/* ===== 表格 ===== */
.table-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.prize-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.prize-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.prize-icon-box.type-points {
  background: linear-gradient(135deg, #f6d365, #fda085);
  color: #fff;
}
.prize-icon-box.type-coupon {
  background: linear-gradient(135deg, #a1c4fd, #c2e9fb);
  color: #fff;
}
.prize-name-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.prize-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}
.value-text {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
}
.value-num {
  font-size: 18px;
  font-weight: 700;
  color: #E6A23C;
}
.value-unit {
  font-size: 12px;
  color: #909399;
}
.stock-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.stock-num {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}
.stock-num.stock-low {
  color: #E6A23C;
}
.stock-num.stock-out {
  color: #F56C6C;
}
.probability-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}
.probability-text {
  font-weight: 600;
  font-size: 13px;
  color: #606266;
  min-width: 42px;
  text-align: right;
}
.sort-badge {
  display: inline-block;
  background: #f0f2f5;
  color: #606266;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
}
.time-text {
  color: #909399;
  font-size: 13px;
}
.time-text i {
  margin-right: 3px;
}

/* ===== 弹窗表单 ===== */
.probability-input-wrapper {
  display: flex;
  align-items: center;
}
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
.form-tip i {
  margin-right: 4px;
}
.inline-tip {
  margin-left: 10px;
  margin-top: 0;
  display: inline;
}
.type-radio-group .el-radio-button__inner i {
  margin-right: 4px;
}
.text-danger {
  color: #F56C6C;
}
.text-danger:hover {
  color: #ff7875;
}
</style>
