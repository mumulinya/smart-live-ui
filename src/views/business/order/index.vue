<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="100px">
      <el-form-item label="用户名" prop="userId">
        <el-select
          v-model="queryParams.userId"
          placeholder="请选择用户"
          clearable
          filterable
          style="width: 200px"
        >
          <el-option
            v-for="user in userList"
            :key="user.id"
            :label="user.nickName || user.userName"
            :value="user.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="优惠券" prop="voucherId">
        <el-select
          v-model="queryParams.voucherId"
          placeholder="请选择优惠券"
          clearable
          filterable
          style="width: 200px"
        >
          <el-option
            v-for="voucher in voucherList"
            :key="voucher.id"
            :label="voucher.title"
            :value="voucher.id"
          />
        </el-select>
      </el-form-item>
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
      <el-form-item label="支付方式" prop="payType">
        <el-select v-model="queryParams.payType" placeholder="请选择支付方式" clearable style="width: 120px">
          <el-option label="余额支付" :value="1" />
          <el-option label="支付宝" :value="2" />
          <el-option label="微信" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="订单状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择订单状态" clearable style="width: 120px">
          <el-option label="未支付" :value="1" />
          <el-option label="已支付" :value="2" />
          <el-option label="已核销" :value="3" />
          <el-option label="已取消" :value="4" />
          <el-option label="退款中" :value="5" />
          <el-option label="已退款" :value="6" />
        </el-select>
      </el-form-item>
      <el-form-item label="支付时间" prop="payTime">
        <el-date-picker
          v-model="queryParams.payTime"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd"
          style="width: 240px"
        >
        </el-date-picker>
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
          v-hasPermi="['order:order:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['order:order:edit']"
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
          v-hasPermi="['order:order:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['order:order:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="orderList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="订单ID" align="center" prop="id" width="80" />
      <el-table-column label="用户名" align="center" prop="userName" width="120">
        <template slot-scope="scope">
          <span>{{ getUserName(scope.row.userId) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="优惠券" align="center" prop="voucherTitle" min-width="150">
        <template slot-scope="scope">
          <el-tooltip :content="getVoucherInfo(scope.row.voucherId)" placement="top">
            <span>{{ getVoucherTitle(scope.row.voucherId) }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="店铺" align="center" prop="shopName" width="120">
        <template slot-scope="scope">
          <span>{{ getShopName(scope.row.shopId) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="支付方式" align="center" prop="payType" width="100">
        <template slot-scope="scope">
          <el-tag
            :type="scope.row.payType == 1 ? 'primary' : scope.row.payType == 2 ? 'success' : 'warning'"
            size="small"
          >
            {{ getPayTypeText(scope.row.payType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="订单状态" align="center" prop="status" width="100">
        <template slot-scope="scope">
          <el-tag
            :type="getStatusTagType(scope.row.status)"
            size="small"
          >
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="订单金额" align="center" prop="amount" width="100">
        <template slot-scope="scope">
          <span style="color: #f56c6c; font-weight: bold;">¥{{ scope.row.amount || '0.00' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="支付时间" align="center" prop="payTime" width="180">
        <template slot-scope="scope">
          <span v-if="scope.row.payTime">{{ parseTime(scope.row.payTime, '{y}-{m}-{d} {h}:{i}') }}</span>
          <span v-else style="color: #909399;">-</span>
        </template>
      </el-table-column>
      <el-table-column label="核销时间" align="center" prop="useTime" width="180">
        <template slot-scope="scope">
          <span v-if="scope.row.useTime">{{ parseTime(scope.row.useTime, '{y}-{m}-{d} {h}:{i}') }}</span>
          <span v-else style="color: #909399;">-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="200">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleDetail(scope.row)"
          >详情</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['order:order:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['order:order:remove']"
          >删除</el-button>
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

    <!-- 添加或修改优惠券订单表对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="用户" prop="userId">
          <el-select v-model="form.userId" placeholder="请选择用户" style="width: 100%">
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.nickName || user.userName"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="优惠券" prop="voucherId">
          <el-select v-model="form.voucherId" placeholder="请选择优惠券" style="width: 100%">
            <el-option
              v-for="voucher in voucherList"
              :key="voucher.id"
              :label="voucher.title"
              :value="voucher.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="店铺" prop="shopId">
          <el-select v-model="form.shopId" placeholder="请选择店铺" style="width: 100%">
            <el-option
              v-for="shop in shopList"
              :key="shop.id"
              :label="shop.name"
              :value="shop.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="支付方式" prop="payType">
          <el-radio-group v-model="form.payType">
            <el-radio :label="1">余额支付</el-radio>
            <el-radio :label="2">支付宝</el-radio>
            <el-radio :label="3">微信</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="订单状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">未支付</el-radio>
            <el-radio :label="2">已支付</el-radio>
            <el-radio :label="3">已核销</el-radio>
            <el-radio :label="4">已取消</el-radio>
            <el-radio :label="5">退款中</el-radio>
            <el-radio :label="6">已退款</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="订单金额" prop="amount">
          <el-input-number
            v-model="form.amount"
            :precision="2"
            :min="0"
            :step="0.01"
            style="width: 100%"
            placeholder="请输入订单金额"
          />
        </el-form-item>
        <el-form-item label="支付时间" prop="payTime">
          <el-date-picker
            v-model="form.payTime"
            type="datetime"
            placeholder="选择支付时间"
            value-format="yyyy-MM-dd HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="核销时间" prop="useTime">
          <el-date-picker
            v-model="form.useTime"
            type="datetime"
            placeholder="选择核销时间"
            value-format="yyyy-MM-dd HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="退款时间" prop="refundTime">
          <el-date-picker
            v-model="form.refundTime"
            type="datetime"
            placeholder="选择退款时间"
            value-format="yyyy-MM-dd HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 订单详情对话框 -->
    <el-dialog title="订单详情" :visible.sync="detailOpen" width="700px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单ID">{{ currentOrder.id }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="getStatusTagType(currentOrder.status)">
            {{ getStatusText(currentOrder.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="用户名">{{ getUserName(currentOrder.userId) }}</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{ currentOrder.userId }}</el-descriptions-item>
        <el-descriptions-item label="优惠券" :span="2">
          {{ getVoucherTitle(currentOrder.voucherId) }}
        </el-descriptions-item>
        <el-descriptions-item label="优惠券ID">{{ currentOrder.voucherId }}</el-descriptions-item>
        <el-descriptions-item label="优惠券详情" :span="2">
          {{ getVoucherInfo(currentOrder.voucherId) }}
        </el-descriptions-item>
        <el-descriptions-item label="店铺">{{ getShopName(currentOrder.shopId) }}</el-descriptions-item>
        <el-descriptions-item label="店铺ID">{{ currentOrder.shopId }}</el-descriptions-item>
        <el-descriptions-item label="店铺详情" :span="2">
          {{ getShopInfo(currentOrder.shopId) }}
        </el-descriptions-item>
        <el-descriptions-item label="支付方式">
          {{ getPayTypeText(currentOrder.payType) }}
        </el-descriptions-item>
        <el-descriptions-item label="订单金额">
          <span style="color: #f56c6c; font-weight: bold;">¥{{ currentOrder.amount || '0.00' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="支付时间">
          {{ currentOrder.payTime ? parseTime(currentOrder.payTime) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="核销时间">
          {{ currentOrder.useTime ? parseTime(currentOrder.useTime) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="退款时间">
          {{ currentOrder.refundTime ? parseTime(currentOrder.refundTime) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ currentOrder.createTime ? parseTime(currentOrder.createTime) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ currentOrder.updateTime ? parseTime(currentOrder.updateTime) : '-' }}
        </el-descriptions-item>
      </el-descriptions>
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailOpen = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listOrder, getOrder, delOrder, addOrder, updateOrder } from "@/api/order/order"
import {listUser, userList} from "@/api/user/user"
import {listVoucher, voucherList} from "@/api/marketing/voucher"
import {listShop, shopList} from "@/api/shop/shop"

export default {
  name: "Order",
  data() {
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
      // 优惠券订单表表格数据
      orderList: [],
      // 用户列表
      userList: [],
      // 优惠券列表
      voucherList: [],
      // 店铺列表
      shopList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 是否显示详情弹出层
      detailOpen: false,
      // 当前订单详情
      currentOrder: {},
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userId: null,
        voucherId: null,
        shopId: null,
        payType: null,
        status: null,
        payTime: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        userId: [
          { required: true, message: "请选择用户", trigger: "change" }
        ],
        voucherId: [
          { required: true, message: "请选择优惠券", trigger: "change" }
        ],
        shopId: [
          { required: true, message: "请选择店铺", trigger: "change" }
        ],
        payType: [
          { required: true, message: "请选择支付方式", trigger: "change" }
        ],
        status: [
          { required: true, message: "请选择订单状态", trigger: "change" }
        ],
        amount: [
          { required: true, message: "请输入订单金额", trigger: "blur" }
        ]
      }
    }
  },
  created() {
    this.getList()
    this.getUserList()
    this.getVoucherList()
    this.getShopList()
  },
  methods: {
    /** 查询优惠券订单表列表 */
    getList() {
      this.loading = true
      listOrder(this.queryParams).then(response => {
        this.orderList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    /** 获取用户列表 */
    getUserList() {
      userList().then(response => {
        this.userList = response.data
      })
    },
    /** 获取优惠券列表 */
    getVoucherList() {
      voucherList().then(response => {
        this.voucherList = response.data|| []
      })
    },
    /** 获取店铺列表 */
    getShopList() {
      shopList().then(response => {
        this.shopList = response.data|| []
      })
    },
    /** 根据用户ID获取用户名 */
    getUserName(userId) {
      const user = this.userList.find(item => item.id === userId)
      return user ? (user.nickName || user.userName) : '未知用户'
    },
    /** 根据优惠券ID获取优惠券标题 */
    getVoucherTitle(voucherId) {
      const voucher = this.voucherList.find(item => item.id === voucherId)
      return voucher ? voucher.title : '未知优惠券'
    },
    /** 根据优惠券ID获取优惠券详细信息 */
    getVoucherInfo(voucherId) {
      const voucher = this.voucherList.find(item => item.id === voucherId)
      if (!voucher) return '未知优惠券'
      return `优惠券: ${voucher.title}, 类型: ${voucher.type === 1 ? '代金券' : '折扣券'}, 面值: ${voucher.faceValue || voucher.discount}`
    },
    /** 根据店铺ID获取店铺名称 */
    getShopName(shopId) {
      const shop = this.shopList.find(item => item.id === shopId)
      return shop ? shop.name : '未知店铺'
    },
    /** 根据店铺ID获取店铺详细信息 */
    getShopInfo(shopId) {
      const shop = this.shopList.find(item => item.id === shopId)
      if (!shop) return '未知店铺'
      return `店铺: ${shop.name}, 地址: ${shop.address || '暂无地址'}, 电话: ${shop.phone || '暂无电话'}`
    },
    /** 获取支付方式文本 */
    getPayTypeText(payType) {
      const payTypeMap = {
        1: '余额支付',
        2: '支付宝',
        3: '微信'
      }
      return payTypeMap[payType] || '未知'
    },
    /** 获取订单状态文本 */
    getStatusText(status) {
      const statusMap = {
        1: '未支付',
        2: '已支付',
        3: '已核销',
        4: '已取消',
        5: '退款中',
        6: '已退款'
      }
      return statusMap[status] || '未知'
    },
    /** 获取状态标签类型 */
    getStatusTagType(status) {
      const typeMap = {
        1: 'info',
        2: 'success',
        3: 'primary',
        4: 'warning',
        5: 'danger',
        6: 'info'
      }
      return typeMap[status] || 'info'
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
        userId: null,
        voucherId: null,
        shopId: null,
        payType: 1,
        status: 1,
        amount: null,
        createTime: null,
        payTime: null,
        useTime: null,
        refundTime: null,
        updateTime: null
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
      this.handleQuery()
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = "添加订单"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getOrder(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改订单"
      })
    },
    /** 查看详情操作 */
    handleDetail(row) {
      this.currentOrder = row
      this.detailOpen = true
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateOrder(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addOrder(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除订单编号为"' + ids + '"的数据项？').then(function() {
        return delOrder(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('order/order/export', {
        ...this.queryParams
      }, `order_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}
.el-table {
  margin-top: 20px;
}
.el-descriptions {
  margin-top: 20px;
}
</style>
