<template>
  <div class="app-container">
    <el-card class="box-card mb-4" shadow="never">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px" class="search-form">
        <el-form-item label="用户名" prop="userId">
            <el-select
            v-model="queryParams.userId"
            placeholder="请选择用户"
            clearable
            filterable
            style="width: 180px"
             @change="handleQuery"
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
            style="width: 180px"
             @change="handleQuery"
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
            style="width: 180px"
             @change="handleQuery"
            >
            <el-option
                v-for="shop in shopList"
                :key="shop.id"
                :label="shop.name"
                :value="shop.id"
            />
            </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="订单状态" clearable style="width: 120px" @change="handleQuery">
            <el-option label="未支付" :value="1" />
            <el-option label="已支付" :value="2" />
            <el-option label="已核销" :value="3" />
            <el-option label="已取消" :value="4" />
            <el-option label="退款中" :value="5" />
            <el-option label="已退款" :value="6" />
            </el-select>
        </el-form-item>
         <el-form-item label="支付方式" prop="payType">
            <el-select v-model="queryParams.payType" placeholder="支付方式" clearable style="width: 120px" @change="handleQuery">
            <el-option label="余额支付" :value="1" />
            <el-option label="支付宝" :value="2" />
            <el-option label="微信" :value="3" />
            </el-select>
        </el-form-item>
        <el-form-item class="search-btns">
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
        </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8 op-btns">
        <el-col :span="1.5">
            <el-button
            type="primary"
            plain
            icon="el-icon-plus"
            size="mini"
            @click="handleAdd"
            v-hasPermi="['order:order:add']"
            >新增订单</el-button>
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
    </el-card>

    <el-card class="box-card" shadow="never">
        <el-table v-loading="loading" :data="orderList" @selection-change="handleSelectionChange" border stripe :header-cell-style="{background:'#f5f7fa',color:'#606266'}">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="订单号" align="center" prop="id" width="80" />
        <el-table-column label="商品信息" min-width="250">
             <template slot-scope="scope">
                <div class="order-goods-info">
                   <div class="voucher-title">{{ getVoucherTitle(scope.row.voucherId) }}</div>
                   <div class="shop-name"><i class="el-icon-shop"></i> {{ getShopName(scope.row.shopId) }}</div>
                </div>
            </template>
        </el-table-column>
        <el-table-column label="下单用户" align="center" prop="userName" width="120">
            <template slot-scope="scope">
            <div class="user-info">
                <i class="el-icon-user"></i>
                <span>{{ getUserName(scope.row.userId) }}</span>
            </div>
            </template>
        </el-table-column>
        <el-table-column label="支付金额" align="center" prop="amount" width="120">
            <template slot-scope="scope">
            <span class="price-text">¥{{ scope.row.amount || '0.00' }}</span>
            </template>
        </el-table-column>
         <el-table-column label="支付方式" align="center" prop="payType" width="100">
            <template slot-scope="scope">
            <el-tag
                :type="scope.row.payType == 1 ? 'primary' : scope.row.payType == 2 ? 'success' : 'warning'"
                effect="plain"
                size="small"
            >
                {{ getPayTypeText(scope.row.payType) }}
            </el-tag>
            </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" width="100">
            <template slot-scope="scope">
            <el-tag :type="getStatusTagType(scope.row.status)" effect="dark" size="small">
                {{ getStatusText(scope.row.status) }}
            </el-tag>
            </template>
        </el-table-column>
        <el-table-column label="支付 / 核销时间" align="center" min-width="200">
            <template slot-scope="scope">
                <div class="time-col">
                    <div v-if="scope.row.payTime" class="time-item">
                        <span class="label">支付:</span> {{ parseTime(scope.row.payTime, '{y}-{m}-{d} {h}:{i}') }}
                    </div>
                     <div v-if="scope.row.useTime" class="time-item">
                        <span class="label">核销:</span> {{ parseTime(scope.row.useTime, '{y}-{m}-{d} {h}:{i}') }}
                    </div>
                     <span v-if="!scope.row.payTime && !scope.row.useTime" class="text-muted">-</span>
                </div>
            </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180" fixed="right">
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
                class="text-danger"
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
    </el-card>

    <!-- 添加或修改订单对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body custom-class="order-edit-dialog">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px" class="edit-form">
        
        <div class="form-section-title">订单关联</div>
        <el-form-item label="用户" prop="userId">
          <el-select v-model="form.userId" placeholder="请选择用户" style="width: 100%" filterable>
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.nickName || user.userName"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="优惠券" prop="voucherId">
          <el-select v-model="form.voucherId" placeholder="请选择优惠券" style="width: 100%" filterable>
            <el-option
              v-for="voucher in voucherList"
              :key="voucher.id"
              :label="voucher.title"
              :value="voucher.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="店铺" prop="shopId">
          <el-select v-model="form.shopId" placeholder="请选择店铺" style="width: 100%" filterable>
            <el-option
              v-for="shop in shopList"
              :key="shop.id"
              :label="shop.name"
              :value="shop.id"
            />
          </el-select>
        </el-form-item>
        
        <div class="form-section-title">支付与状态</div>
        <el-row>
             <el-col :span="12">
                 <el-form-item label="订单金额" prop="amount">
                    <el-input-number
                        v-model="form.amount"
                        :precision="2"
                        :min="0"
                        :step="1"
                        style="width: 100%"
                        controls-position="right"
                    >
                     <template slot="prepend">¥</template>
                     </el-input-number>
                    </el-form-item>
             </el-col>
             <el-col :span="12">
                  <el-form-item label="支付方式" prop="payType">
                    <el-select v-model="form.payType" placeholder="支付方式" style="width: 100%">
                        <el-option label="余额支付" :value="1" />
                        <el-option label="支付宝" :value="2" />
                        <el-option label="微信" :value="3" />
                    </el-select>
                    </el-form-item>
             </el-col>
        </el-row>
       
        <el-form-item label="订单状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio-button :label="1">未支付</el-radio-button>
            <el-radio-button :label="2">已支付</el-radio-button>
            <el-radio-button :label="3">已核销</el-radio-button>
            <el-radio-button :label="4">已取消</el-radio-button>
            <el-radio-button :label="5">退款中</el-radio-button>
            <el-radio-button :label="6">已退款</el-radio-button>
          </el-radio-group>
        </el-form-item>

         <div class="form-section-title">时间节点</div>
         <el-row>
             <el-col :span="12">
                <el-form-item label="支付时间" prop="payTime">
                    <el-date-picker
                        v-model="form.payTime"
                        type="datetime"
                        placeholder="选择支付时间"
                        value-format="yyyy-MM-dd HH:mm:ss"
                        style="width: 100%"
                    />
                    </el-form-item>
             </el-col>
             <el-col :span="12">
                 <el-form-item label="核销时间" prop="useTime">
                <el-date-picker
                    v-model="form.useTime"
                    type="datetime"
                    placeholder="选择核销时间"
                    value-format="yyyy-MM-dd HH:mm:ss"
                    style="width: 100%"
                />
                </el-form-item>
             </el-col>
         </el-row>
         <el-row>
             <el-col :span="12">
                 <el-form-item label="退款时间" prop="refundTime">
                <el-date-picker
                    v-model="form.refundTime"
                    type="datetime"
                    placeholder="选择退款时间"
                    value-format="yyyy-MM-dd HH:mm:ss"
                    style="width: 100%"
                />
                </el-form-item>
             </el-col>
         </el-row>

      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 订单详情对话框 -->
    <el-dialog :visible.sync="detailOpen" width="750px" append-to-body custom-class="order-detail-dialog">
       <div class="detail-header-status">
            <div class="status-icon">
                <i :class="getOrderStatusIcon(currentOrder.status)"></i>
            </div>
            <div class="status-text">
                <div class="main-status">{{ getStatusText(currentOrder.status) }}</div>
                <div class="sub-status">订单号: {{ currentOrder.id }}</div>
            </div>
            <div class="status-amount">
                <span class="label">订单金额</span>
                <span class="amount">¥{{ currentOrder.amount }}</span>
            </div>
       </div>

       <div class="order-detail-body">
           <div class="detail-left">
               <div class="detail-card">
                   <div class="card-title">订单进度</div>
                    <el-steps direction="vertical" :active="getOrderStep(currentOrder.status)" finish-status="success">
                        <el-step title="订单创建" :description="parseTime(currentOrder.createTime)"></el-step>
                        <el-step title="支付成功" :description="parseTime(currentOrder.payTime)"></el-step>
                        
                        <template v-if="currentOrder.status === 5 || currentOrder.status === 6">
                             <el-step title="申请退款" status="process"></el-step>
                             <el-step title="退款完成" :description="parseTime(currentOrder.refundTime)" :status="currentOrder.status === 6 ? 'success' : 'wait'"></el-step>
                        </template>
                         <template v-else-if="currentOrder.status === 4">
                             <el-step title="订单取消" status="error"></el-step>
                        </template>
                        <template v-else>
                             <el-step title="已核销" :description="parseTime(currentOrder.useTime)" :status="currentOrder.status === 3 ? 'success' : 'wait'"></el-step>
                        </template>
                    </el-steps>
               </div>
           </div>
           
           <div class="detail-right">
               <div class="detail-card">
                   <div class="card-title">商品信息</div>
                   <div class="info-row">
                       <span class="label">优惠券:</span>
                       <span class="val">{{ getVoucherTitle(currentOrder.voucherId) }}</span>
                   </div>
                    <div class="info-row">
                       <span class="label">所属店铺:</span>
                       <span class="val">{{ getShopName(currentOrder.shopId) }}</span>
                   </div>
               </div>

                <div class="detail-card">
                   <div class="card-title">支付信息</div>
                   <div class="info-row">
                       <span class="label">支付方式:</span>
                       <span class="val">{{ getPayTypeText(currentOrder.payType) }}</span>
                   </div>
                    <div class="info-row">
                       <span class="label">支付金额:</span>
                       <span class="val price">¥{{ currentOrder.amount }}</span>
                   </div>
               </div>

               <div class="detail-card">
                   <div class="card-title">用户信息</div>
                   <div class="info-row">
                       <span class="label">用户名:</span>
                       <span class="val">{{ getUserName(currentOrder.userId) }}</span>
                   </div>
               </div>
           </div>
       </div>
    
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
    /** 获取订单状态图标 */
    getOrderStatusIcon(status) {
        const iconMap = {
            1: 'el-icon-wallet', // 未支付
            2: 'el-icon-circle-check', // 已支付
            3: 'el-icon-s-claim', // 已核销
            4: 'el-icon-circle-close', // 已取消
            5: 'el-icon-refresh-left', // 退款中
            6: 'el-icon-success' // 已退款
        }
        return iconMap[status] || 'el-icon-info'
    },
    /** 获取订单进度Step */
    getOrderStep(status) {
        // 1:未支付, 2:已支付, 3:已核销, 4:已取消, 5:退款中, 6:已退款
        if (status === 1) return 0;
        if (status === 2) return 2;
        if (status === 3) return 3;
        if (status === 5) return 2; // 退款中，进度在支付后
        if (status === 6) return 3; // 退款完成
        return 1;
    }
  }
}
</script>

<style scoped lang="scss">
.app-container {
    padding: 20px;
    background-color: #f0f2f5;
    min-height: 100vh;
}
.box-card {
    border-radius: 8px;
    border: none;
    .el-card__body {
        padding: 20px;
    }
}
.mb-4 {
    margin-bottom: 20px;
}
.text-danger { color: #f56c6c; }
.text-muted { color: #909399; }

/* 搜索与操作相关 */
.search-form {
    .el-form-item {
        margin-bottom: 10px;
        margin-right: 20px;
    }
}
.search-btns {
    margin-left: 10px;
}
.op-btns {
    margin-top: 15px;
    display: flex;
    align-items: center;
}

/* 表格样式优化 */
.order-goods-info {
    .voucher-title {
        font-weight: 600;
        color: #303133;
        font-size: 14px;
        margin-bottom: 4px;
    }
    .shop-name {
        font-size: 12px;
        color: #909399;
        i { margin-right: 4px; }
    }
}
.user-info {
    i { margin-right: 4px; color: #409EFF; }
}
.price-text {
    font-weight: 600;
    color: #f56c6c;
}
.time-col {
    font-size: 12px;
    text-align: left;
    .time-item {
        margin-bottom: 4px;
        .label { color: #909399; min-width: 36px; display: inline-block; }
    }
}

/* 编辑弹窗优化 */
.edit-form {
    padding: 0 10px;
}
.form-section-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    padding-left: 10px;
    border-left: 4px solid #409EFF;
    margin-bottom: 20px;
    margin-top: 10px;
}

/* 详情弹窗优化 */
.detail-header-status {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    
    .status-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: #ecf5ff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 30px;
        color: #409EFF;
        margin-right: 20px;
    }
    
    .status-text {
        flex: 1;
        .main-status { font-size: 20px; font-weight: bold; color: #303133; margin-bottom: 6px; }
        .sub-status { font-size: 13px; color: #909399; }
    }
    
    .status-amount {
        text-align: right;
        display: flex;
        flex-direction: column;
        .label { font-size: 12px; color: #909399; margin-bottom: 4px; }
        .amount { font-size: 24px; font-weight: bold; color: #f56c6c; }
    }
}

.order-detail-body {
    display: flex;
    gap: 20px;
    
    .detail-left {
        width: 35%;
    }
    .detail-right {
        width: 65%;
    }
    
    .detail-card {
        background: #fff;
        border: 1px solid #ebeef5;
        border-radius: 4px;
        padding: 15px;
        margin-bottom: 15px;
        
        .card-title {
            font-size: 14px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ebeef5;
        }
        
        .info-row {
            display: flex;
            margin-bottom: 10px;
            font-size: 13px;
            &:last-child { margin-bottom: 0; }
            
            .label { color: #909399; width: 70px; }
            .val { 
                flex: 1; 
                color: #606266;
                &.price { color: #f56c6c; font-weight: 600; }
            }
        }
    }
}
</style>
