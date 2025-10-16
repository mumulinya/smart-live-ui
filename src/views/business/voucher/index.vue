<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="店铺" prop="shopId">
        <el-select
          v-model="queryParams.shopId"
          placeholder="请选择店铺"
          clearable
          filterable
          style="width: 200px"
        >
          <el-option
            v-for="shop in shopList"
            :key="shop.id"
            :label="shop.name"
            :value="shop.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="优惠券类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择优惠券类型"
          clearable
          style="width: 120px"
        >
          <el-option label="普通券" :value="0" />
          <el-option label="秒杀券" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="优惠券标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入优惠券标题"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['marketing:voucher:add']"
        >新增优惠券</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['marketing:voucher:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['marketing:voucher:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['marketing:voucher:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="voucherList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="优惠券ID" align="center" prop="id" width="80" />
      <el-table-column label="所属店铺" align="center" prop="shopName" min-width="120" />
      <el-table-column label="优惠券标题" align="center" prop="title" min-width="150" show-overflow-tooltip />
      <el-table-column label="优惠券类型" align="center" prop="type" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.type === 0 ? '' : 'danger'">
            {{ scope.row.type === 0 ? '普通券' : '秒杀券' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="库存" align="center" prop="stock" width="100">
        <template slot-scope="scope">
          <span v-if="scope.row.type === 1">{{ scope.row.stock || 0 }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="支付金额" align="center" prop="payValue" width="100">
        <template slot-scope="scope">
          <span>{{ (scope.row.payValue / 100).toFixed(2) }}元</span>
        </template>
      </el-table-column>
      <el-table-column label="抵扣金额" align="center" prop="actualValue" width="100">
        <template slot-scope="scope">
          <span>{{ (scope.row.actualValue / 100).toFixed(2) }}元</span>
        </template>
      </el-table-column>
      <el-table-column label="生效时间" align="center" prop="beginTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.beginTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="失效时间" align="center" prop="endTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.endTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="优惠券状态" align="center" prop="status" width="100">
        <template slot-scope="scope">
          <el-tag
            :type="scope.row.status === 1 ? 'success' : (scope.row.status === 2 ? 'info' : 'warning')"
          >
            {{ scope.row.status === 1 ? '上架' : (scope.row.status === 2 ? '下架' : '过期') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="200">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleView(scope.row)"
          >详情</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['marketing:voucher:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['marketing:voucher:remove']"
          >删除</el-button>
          <el-button
            size="mini"
            type="text"
            :icon="scope.row.status === 1 ? 'el-icon-bottom' : 'el-icon-top'"
            @click="handleStatusChange(scope.row)"
            v-hasPermi="['marketing:voucher:edit']"
          >{{ scope.row.status === 1 ? '下架' : '上架' }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改优惠券对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="700px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="所属店铺" prop="shopId">
          <el-select
            v-model="form.shopId"
            placeholder="请选择店铺"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="shop in shopList"
              :key="shop.id"
              :label="shop.name"
              :value="shop.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="优惠券类型" prop="type">
          <el-radio-group v-model="form.type" @change="handleTypeChange">
            <el-radio :label="0">普通券</el-radio>
            <el-radio :label="1">秒杀券</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="优惠券标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入优惠券标题" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="副标题" prop="subTitle">
          <el-input v-model="form.subTitle" placeholder="请输入副标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="使用规则" prop="rules">
          <el-input
            v-model="form.rules"
            type="textarea"
            placeholder="请输入使用规则"
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="支付金额(元)" prop="payValue">
              <el-input-number
                v-model="form.payValue"
                :min="0"
                :precision="2"
                :step="0.01"
                style="width: 100%"
                placeholder="请输入支付金额"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="抵扣金额(元)" prop="actualValue">
              <el-input-number
                v-model="form.actualValue"
                :min="0"
                :precision="2"
                :step="0.01"
                style="width: 100%"
                placeholder="请输入抵扣金额"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="生效时间" prop="beginTime">
              <el-date-picker
                v-model="form.beginTime"
                type="datetime"
                placeholder="选择生效时间"
                style="width: 100%"
                value-format="yyyy-MM-dd HH:mm:ss"
                :picker-options="beginTimePickerOptions"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="失效时间" prop="endTime">
              <el-date-picker
                v-model="form.endTime"
                type="datetime"
                placeholder="选择失效时间"
                style="width: 100%"
                value-format="yyyy-MM-dd HH:mm:ss"
                :picker-options="endTimePickerOptions"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item
          label="库存"
          prop="stock"
          v-if="form.type === 1"
          :rules="form.type === 1 ? rules.stock : []"
        >
          <el-input-number
            v-model="form.stock"
            :min="1"
            :max="99999"
            style="width: 100%"
            placeholder="请输入库存数量"
          />
        </el-form-item>
        <el-form-item label="优惠券状态" prop="status" v-if="form.id">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">上架</el-radio>
            <el-radio :label="2">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 优惠券详情对话框 -->
    <el-dialog title="优惠券详情" :visible.sync="viewOpen" width="600px" append-to-body>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="优惠券ID">{{ viewForm.id }}</el-descriptions-item>
        <el-descriptions-item label="所属店铺">{{ viewForm.shopName }}</el-descriptions-item>
        <el-descriptions-item label="优惠券类型">
          <el-tag :type="viewForm.type === 0 ? '' : 'danger'">
            {{ viewForm.type === 0 ? '普通券' : '秒杀券' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="优惠券标题">{{ viewForm.title }}</el-descriptions-item>
        <el-descriptions-item label="副标题">{{ viewForm.subTitle || '-' }}</el-descriptions-item>
        <el-descriptions-item label="使用规则">{{ viewForm.rules || '-' }}</el-descriptions-item>
        <el-descriptions-item label="支付金额">{{ (viewForm.payValue / 100).toFixed(2) }}元</el-descriptions-item>
        <el-descriptions-item label="抵扣金额">{{ (viewForm.actualValue / 100).toFixed(2) }}元</el-descriptions-item>
        <el-descriptions-item label="库存" v-if="viewForm.type === 1">
          {{ viewForm.stock || 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="生效时间">
          {{ parseTime(viewForm.beginTime, '{y}-{m}-{d} {h}:{i}:{s}') }}
        </el-descriptions-item>
        <el-descriptions-item label="失效时间">
          {{ parseTime(viewForm.endTime, '{y}-{m}-{d} {h}:{i}:{s}') }}
        </el-descriptions-item>
        <el-descriptions-item label="优惠券状态">
          <el-tag :type="viewForm.status === 1 ? 'success' : (viewForm.status === 2 ? 'info' : 'warning')">
            {{ viewForm.status === 1 ? '上架' : (viewForm.status === 2 ? '下架' : '过期') }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ parseTime(viewForm.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ parseTime(viewForm.updateTime, '{y}-{m}-{d} {h}:{i}:{s}') }}
        </el-descriptions-item>
      </el-descriptions>
      <div slot="footer" class="dialog-footer">
        <el-button @click="viewOpen = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listVoucher, getVoucher, delVoucher, addVoucher, updateVoucher, changeVoucherStatus } from "@/api/marketing/voucher"
import { listShop } from "@/api/shop/shop"

export default {
  name: "Voucher",
  data() {
    // 验证结束时间必须大于开始时间
    const validateEndTime = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请选择失效时间'))
      } else if (this.form.beginTime && new Date(value) <= new Date(this.form.beginTime)) {
        callback(new Error('失效时间必须大于生效时间'))
      } else {
        callback()
      }
    }

    // 验证开始时间必须小于结束时间
    const validateBeginTime = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请选择生效时间'))
      } else if (this.form.endTime && new Date(value) >= new Date(this.form.endTime)) {
        callback(new Error('生效时间必须小于失效时间'))
      } else {
        callback()
      }
    }

    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 优惠券表格数据
      voucherList: [],
      // 店铺列表
      shopList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 是否显示详情弹出层
      viewOpen: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        shopId: null,
        title: null,
        type: null,
      },
      // 表单参数
      form: {
        type: 0,
        status: 1,
        stock: null
      },
      // 详情表单参数
      viewForm: {},
      // 开始时间选择器配置
      beginTimePickerOptions: {
        disabledDate: (time) => {
          if (this.form.endTime) {
            return time.getTime() > new Date(this.form.endTime).getTime()
          }
          return false
        }
      },
      // 结束时间选择器配置
      endTimePickerOptions: {
        disabledDate: (time) => {
          if (this.form.beginTime) {
            return time.getTime() < new Date(this.form.beginTime).getTime()
          }
          return false
        }
      },
      // 表单校验
      rules: {
        shopId: [
          { required: true, message: "请选择店铺", trigger: "change" }
        ],
        title: [
          { required: true, message: "优惠券标题不能为空", trigger: "blur" },
          { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" }
        ],
        subTitle: [
          { min: 0, max: 100, message: "长度不能超过 100 个字符", trigger: "blur" }
        ],
        rules: [
          { min: 0, max: 200, message: "长度不能超过 200 个字符", trigger: "blur" }
        ],
        payValue: [
          { required: true, message: "支付金额不能为空", trigger: "blur" },
          { type: 'number', min: 0, message: "支付金额必须大于等于0", trigger: "blur" }
        ],
        actualValue: [
          { required: true, message: "抵扣金额不能为空", trigger: "blur" },
          { type: 'number', min: 0, message: "抵扣金额必须大于等于0", trigger: "blur" }
        ],
        type: [
          { required: true, message: "请选择优惠券类型", trigger: "change" }
        ],
        status: [
          { required: true, message: "请选择优惠券状态", trigger: "change" }
        ],
        beginTime: [
          { required: true, validator: validateBeginTime, trigger: 'change' }
        ],
        endTime: [
          { required: true, validator: validateEndTime, trigger: 'change' }
        ],
        stock: [
          { required: true, message: "库存不能为空", trigger: "blur" },
          { type: 'number', min: 1, message: "库存必须大于0", trigger: "blur" }
        ]
      }
    }
  },
  created() {
    this.getShopList()
    this.getList()
  },
  methods: {
    /** 查询优惠券列表 */
    getList() {
      this.loading = true
      listVoucher(this.queryParams).then(response => {
        // 将店铺ID映射为店铺名称
        const vouchersWithShopName = response.rows.map(voucher => {
          const shop = this.shopList.find(shop => shop.id === voucher.shopId)
          return {
            ...voucher,
            shopName: shop ? shop.name : '未知店铺'
          }
        })
        this.voucherList = vouchersWithShopName
        this.total = response.total
        this.loading = false
      })
    },
    /** 获取店铺列表 */
    getShopList() {
      listShop({ pageNum: 1, pageSize: 1000 }).then(response => {
        this.shopList = response.rows || response.data || []
      }).catch(error => {
        console.error('获取店铺列表失败:', error)
        this.shopList = []
      })
    },
    // 取消按钮
    cancel() {
      this.open = false
      this.reset()
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        shopId: null,
        title: null,
        subTitle: null,
        rules: null,
        payValue: null,
        actualValue: null,
        type: 0,
        status: 1,
        stock: null,
        beginTime: null,
        endTime: null
      }
      this.resetForm("form")
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm")
      this.queryParams.shopId = null
      this.queryParams.type = null
      this.handleQuery()
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = "新增优惠券"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getVoucher(id).then(response => {
        // 将金额从分转换为元，并确保类型正确映射
        this.form = {
          ...response.data,
          payValue: response.data.payValue / 100,
          actualValue: response.data.actualValue / 100,
          type: Number(response.data.type), // 确保类型是数字
          status: Number(response.data.status), // 确保状态是数字
          stock: response.data.stock,
          beginTime: response.data.beginTime,
          endTime: response.data.endTime
        }
        this.open = true
        this.title = "修改优惠券"
      })
    },
    /** 查看详情按钮操作 */
    handleView(row) {
      const id = row.id
      getVoucher(id).then(response => {
        // 获取店铺名称
        const shop = this.shopList.find(shop => shop.id === response.data.shopId)
        this.viewForm = {
          ...response.data,
          shopName: shop ? shop.name : '未知店铺'
        }
        this.viewOpen = true
      })
    },
    /** 优惠券类型变化事件 */
    handleTypeChange(type) {
      // 如果是普通券，清空库存
      if (type === 0) {
        this.form.stock = null
      }
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          // 将金额从元转换为分
          const formData = {
            ...this.form,
            payValue: Math.round(this.form.payValue * 100),
            actualValue: Math.round(this.form.actualValue * 100)
          }

          // 如果是普通券，不传库存字段
          if (formData.type === 0) {
            delete formData.stock
          }

          if (this.form.id != null) {
            updateVoucher(formData).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addVoucher(formData).then(response => {
              this.$modal.msgSuccess("新增成功")
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认删除优惠券编号为"' + ids + '"的数据项？').then(function() {
        return delVoucher(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 上下架操作 */
    handleStatusChange(row) {
      const newStatus = row.status === 1 ? 2 : 1
      const statusText = newStatus === 1 ? '上架' : '下架'

      this.$modal.confirm(`确认要${statusText}优惠券"${row.title}"吗？`).then(function() {
        return changeVoucherStatus(row.id, newStatus)
      }).then(() => {
        this.$modal.msgSuccess(`${statusText}成功`)
        this.getList()
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('marketing/voucher/export', {
        ...this.queryParams
      }, `voucher_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}
.mb8 {
  margin-bottom: 16px;
}
.el-table {
  margin-top: 16px;
}
</style>
