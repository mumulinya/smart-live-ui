<template>
  <div class="app-container record-list">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <i class="el-icon-s-data"></i>
          积分明细
        </h2>
        <span class="page-desc">查看用户积分变动记录，支持按照用户、时间范围进行筛选</span>
      </div>
      <div class="header-right">
        <el-button type="primary" icon="el-icon-plus" @click="handleAdjust">调整积分</el-button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-wrapper">
      <el-form :model="queryParams" ref="queryForm" :inline="true" label-width="68px" class="search-form">
        <el-form-item label="用户ID" prop="userId">
          <el-input
            v-model="queryParams.userId"
            placeholder="请输入用户ID"
            clearable
            prefix-icon="el-icon-user"
            style="width: 200px"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="queryParams.phone"
            placeholder="请输入手机号"
            clearable
            prefix-icon="el-icon-mobile-phone"
            style="width: 200px"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            style="width: 240px"
            prefix-icon="el-icon-date"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleQuery">搜索</el-button>
          <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-wrapper">
      <el-table v-loading="loading" :data="recordList" stripe class="record-table">
        <el-table-column label="记录ID" align="center" prop="id" width="80" />
        <el-table-column label="用户信息" min-width="170">
          <template slot-scope="{ row }">
            <div class="user-info-cell">
              <div class="user-avatar-placeholder">
                <i class="el-icon-user-solid"></i>
              </div>
              <div class="user-detail">
                <div class="user-nick">{{ row.nickName || '未知用户' }}</div>
                <div class="user-sub">ID: {{ row.userId }}</div>
                <div class="user-sub" v-if="row.phone"><i class="el-icon-mobile"></i> {{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="变动积分" align="center" width="130">
          <template slot-scope="{ row }">
            <div class="points-cell" :class="row.points > 0 ? 'is-increase' : 'is-decrease'">
              <span class="points-sign">{{ row.points > 0 ? '+' : '' }}</span>
              <span class="points-num">{{ row.points }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="变动类型" align="center" prop="type" width="100">
          <template slot-scope="{ row }">
            <el-tag :type="row.type === 1 ? 'success' : 'danger'" effect="plain" class="type-tag">
              {{ formatType(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="业务类型" align="center" prop="bizType" width="120">
          <template slot-scope="{ row }">
            <el-tag type="info" effect="plain">{{ formatBizType(row.bizType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前积分" align="center" prop="currentPoints" width="110">
          <template slot-scope="{ row }">
            <div class="current-points">
              <i class="el-icon-coin"></i>
              <span>{{ row.currentPoints }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="描述" align="left" prop="description" min-width="220" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span class="desc-text">{{ row.description }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="170">
          <template slot-scope="{ row }">
            <span class="time-text"><i class="el-icon-time"></i> {{ parseTime(row.createTime) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>

    <!-- 调整积分弹窗 -->
    <el-dialog title="调整积分" :visible.sync="adjustVisible" width="480px" append-to-body class="adjust-dialog">
      <el-form ref="adjustForm" :model="adjustForm" :rules="adjustRules" label-width="90px">
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="adjustForm.userId" placeholder="请输入用户ID" prefix-icon="el-icon-user" />
        </el-form-item>
        <el-form-item label="调整类型" prop="type">
          <el-radio-group v-model="adjustForm.type" class="type-radio-group">
            <el-radio-button :label="1">
              <i class="el-icon-plus"></i> 增加积分
            </el-radio-button>
            <el-radio-button :label="2">
              <i class="el-icon-minus"></i> 扣除积分
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="积分数量" prop="points">
          <el-input-number v-model="adjustForm.points" :min="1" :max="999999" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注原因" prop="remark">
          <el-input 
            v-model="adjustForm.remark" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入调整原因（必填）"
            maxlength="50"
            show-word-limit 
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="adjustVisible = false">取 消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitAdjust">确认调整</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listPointsRecord, adjustUserPoints } from '@/api/points/points'

export default {
  name: 'RecordList',
  data() {
    return {
      loading: false,
      submitLoading: false,
      recordList: [],
      total: 0,
      dateRange: [],
      adjustVisible: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userId: undefined,
        phone: undefined
      },
      adjustForm: {
        userId: '',
        type: 1,
        points: 100,
        remark: ''
      },
      adjustRules: {
        userId: [{ required: true, message: '请输入用户ID', trigger: 'blur' }],
        type: [{ required: true, message: '请选择调整类型', trigger: 'change' }],
        points: [{ required: true, message: '请输入积分数量', trigger: 'blur' }],
        remark: [{ required: true, message: '请输入调整原因', trigger: 'blur' }]
      },
      // 变动类型字典
      typeOptions: [
        { value: 1, label: '收入', type: 'success' },
        { value: 2, label: '支出', type: 'danger' }
      ],
      // 业务类型字典
      bizTypeOptions: [
        { value: 1, label: '签到' },
        { value: 2, label: '消费' },
        { value: 4, label: '人工调整' },
        { value: 5, label: '抽奖' }
      ]
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 格式化类型 */
    formatType(type) {
      const item = this.typeOptions.find(k => k.value == type)
      return item ? item.label : type
    },
    /** 格式化业务类型 */
    formatBizType(type) {
      const item = this.bizTypeOptions.find(k => k.value == type)
      return item ? item.label : type
    },
    /** 获取类型标签颜色 */
    getTypeTag(type) {
      const item = this.typeOptions.find(k => k.value == type)
      return item ? item.type : ''
    },
    /** 查询列表 */
    getList() {
      this.loading = true
      const params = this.addDateRange(this.queryParams, this.dateRange)
      listPointsRecord(params).then(response => {
        this.recordList = response.rows
        this.total = response.total
      }).finally(() => {
        this.loading = false
      })
    },
    /** 搜索 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置 */
    resetQuery() {
      this.dateRange = []
      this.resetForm('queryForm')
      this.handleQuery()
    },
    /** 打开调整弹窗 */
    handleAdjust() {
      this.adjustForm = {
        userId: '',
        type: 1,
        points: 100,
        remark: ''
      }
      this.adjustVisible = true
      this.$nextTick(() => {
        this.$refs.adjustForm && this.$refs.adjustForm.clearValidate()
      })
    },
    /** 提交调整 */
    submitAdjust() {
      this.$refs.adjustForm.validate(valid => {
        if (valid) {
          this.submitLoading = true
          const data = {
            userId: this.adjustForm.userId,
            points: this.adjustForm.type === 2 ? -this.adjustForm.points : this.adjustForm.points,
            remark: this.adjustForm.remark
          }
          adjustUserPoints(data).then(() => {
            this.$message.success('积分调整成功')
            this.adjustVisible = false
            this.getList()
          }).finally(() => {
            this.submitLoading = false
          })
        }
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
  margin-bottom: 24px;
}
.page-title {
  margin: 0 0 4px;
  font-size: 20px;
  color: #303133;
  font-weight: 600;
}
.page-title i {
  color: #409EFF;
  margin-right: 8px;
}
.page-desc {
  font-size: 13px;
  color: #909399;
}

/* ===== 搜索栏 ===== */
.search-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 18px 20px 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}
.search-form .el-form-item {
  margin-bottom: 18px;
}

/* ===== 表格 ===== */
.table-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.user-info-cell {
  display: flex;
  align-items: center;
}
.user-avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f0f2f5;
  color: #c0c4cc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-right: 12px;
  flex-shrink: 0;
}
.user-detail {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.user-nick {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}
.user-sub {
  font-size: 12px;
  color: #909399;
}
.points-cell {
  font-family: 'Helvetica Neue', Arial, sans-serif;
}
.points-num {
  font-size: 18px;
  font-weight: 700;
}
.points-sign {
  font-size: 14px;
  margin-right: 2px;
}
.is-increase {
  color: #67C23A;
}
.is-decrease {
  color: #F56C6C;
}
.type-tag i {
  margin-right: 2px;
}
.current-points {
  display: inline-flex;
  align-items: center;
  background: #fdf6ec;
  color: #e6a23c;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}
.current-points i {
  margin-right: 4px;
}
.desc-text {
  color: #606266;
  font-size: 13px;
}
.time-text {
  color: #909399;
  font-size: 13px;
}
.time-text i {
  margin-right: 3px;
}

/* ===== 弹窗 ===== */
.type-radio-group {
  width: 100%;
  display: flex;
}
.type-radio-group .el-radio-button {
  flex: 1;
}
.type-radio-group ::v-deep .el-radio-button__inner {
  width: 100%;
}
.type-radio-group .el-radio-button__inner i {
  margin-right: 5px;
}
</style>
