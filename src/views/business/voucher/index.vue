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
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-s-promotion"
          size="mini"
          @click="handleAllPublish"
        >全量发布</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-s-promotion"
          size="mini"
          @click="handlePublish"
        >发布</el-button>
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
          <span>{{ (scope.row.payValue / 1).toFixed(2) }}元</span>
        </template>
      </el-table-column>
      <el-table-column label="抵扣金额" align="center" prop="actualValue" width="100">
        <template slot-scope="scope">
          <span>{{ (scope.row.actualValue / 1).toFixed(2) }}元</span>
        </template>
      </el-table-column>
      <!-- 秒杀券开始时间 -->
      <el-table-column label="开始时间" align="center" prop="beginTime" width="160">
        <template slot-scope="scope">
          <span v-if="scope.row.type === 1">
            {{ parseTime(scope.row.beginTime, '{y}-{m}-{d} {h}:{i}') }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <!-- 秒杀券结束时间 -->
      <el-table-column label="结束时间" align="center" prop="endTime" width="160">
        <template slot-scope="scope">
          <span v-if="scope.row.type === 1">
            {{ parseTime(scope.row.endTime, '{y}-{m}-{d} {h}:{i}') }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="有效期类型" align="center" prop="validityType" width="110">
        <template slot-scope="scope">
          <el-tag :type="scope.row.validityType === 1 ? 'primary' : 'success'" size="small">
            {{ scope.row.validityType === 1 ? '固定日期' : '领取后N天' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="使用有效期" align="center" min-width="180">
        <template slot-scope="scope">
          <span v-if="scope.row.validityType === 1">
            {{ parseTime(scope.row.useStartTime, '{y}-{m}-{d}') }} 至 {{ parseTime(scope.row.useEndTime, '{y}-{m}-{d}') }}
          </span>
          <span v-else-if="scope.row.validityType === 2">
            <el-tag type="success" size="small">领取后{{ scope.row.validDays }}天有效</el-tag>
          </span>
          <span v-else>-</span>
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
        <el-form-item label="优惠券类型" prop="type" v-if="!form.id">
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
        <!-- 修改：仅秒杀券显示生效/失效时间 -->
        <el-row v-if="form.type === 1">
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
            :min="0"
            :max="99999"
            style="width: 100%"
            placeholder="请输入库存数量"
          />
        </el-form-item>
        
        <!-- 使用有效期设置 -->
        <el-divider content-position="left">使用有效期设置</el-divider>
        <el-form-item label="有效期类型" prop="validityType">
          <el-radio-group v-model="form.validityType" @change="handleValidityTypeChange">
            <el-radio :label="1">固定日期</el-radio>
            <el-radio :label="2">动态有效期</el-radio>
          </el-radio-group>
        </el-form-item>
        <!-- 固定日期模式 -->
        <el-row v-if="form.validityType === 1">
          <el-col :span="12">
            <el-form-item label="使用开始时间" prop="useStartTime" :rules="form.validityType === 1 ? rules.useStartTime : []">
              <el-date-picker
                v-model="form.useStartTime"
                type="datetime"
                placeholder="选择使用开始时间"
                style="width: 100%"
                value-format="yyyy-MM-dd HH:mm:ss"
                :picker-options="useStartTimePickerOptions"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="使用结束时间" prop="useEndTime" :rules="form.validityType === 1 ? rules.useEndTime : []">
              <el-date-picker
                v-model="form.useEndTime"
                type="datetime"
                placeholder="选择使用结束时间"
                style="width: 100%"
                value-format="yyyy-MM-dd HH:mm:ss"
                :picker-options="useEndTimePickerOptions"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <!-- 动态有效期模式 -->
        <el-form-item label="有效天数" prop="validDays" v-if="form.validityType === 2" :rules="form.validityType === 2 ? rules.validDays : []">
          <el-input-number
            v-model="form.validDays"
            :min="1"
            :max="365"
            style="width: 200px"
            placeholder="请输入有效天数"
          />
          <span class="validity-tip">天（领取后生效）</span>
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
        <el-descriptions-item label="支付金额">{{ viewForm.payValue }}元</el-descriptions-item>
        <el-descriptions-item label="抵扣金额">{{ viewForm.actualValue }}元</el-descriptions-item>
        <el-descriptions-item label="库存" v-if="viewForm.type === 1">
          {{ viewForm.stock || 0 }}
        </el-descriptions-item>
        <!-- 有效期类型展示 -->
        <el-descriptions-item label="有效期类型">
          <el-tag :type="viewForm.validityType === 1 ? 'primary' : 'success'" size="small">
            {{ viewForm.validityType === 1 ? '固定日期' : '动态有效期' }}
          </el-tag>
        </el-descriptions-item>
        <!-- 固定日期模式显示使用时间 -->
        <el-descriptions-item label="使用开始时间" v-if="viewForm.validityType === 1">
          {{ parseTime(viewForm.useStartTime, '{y}-{m}-{d} {h}:{i}:{s}') || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="使用结束时间" v-if="viewForm.validityType === 1">
          {{ parseTime(viewForm.useEndTime, '{y}-{m}-{d} {h}:{i}:{s}') || '-' }}
        </el-descriptions-item>
        <!-- 动态有效期模式显示天数 -->
        <el-descriptions-item label="有效天数" v-if="viewForm.validityType === 2">
          <span>领取后 <strong>{{ viewForm.validDays }}</strong> 天有效</span>
        </el-descriptions-item>
        <!-- 秒杀券抢购时间 -->
        <el-descriptions-item label="抢购开始时间" v-if="viewForm.type === 1">
          {{ parseTime(viewForm.beginTime, '{y}-{m}-{d} {h}:{i}:{s}') || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="抢购结束时间" v-if="viewForm.type === 1">
          {{ parseTime(viewForm.endTime, '{y}-{m}-{d} {h}:{i}:{s}') || '-' }}
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
import { listVoucher, getVoucher, delVoucher, addVoucher, updateVoucher, changeVoucherStatus, allPublish, publish, addStock, priceReduced } from "@/api/marketing/voucher"
import { listShop,  shopList} from "@/api/shop/shop"

export default {
  name: "Voucher",
  data() {
    // 验证结束时间必须大于开始时间（仅秒杀券生效）
    const validateEndTime = (rule, value, callback) => {
      // 普通券直接通过校验
      if (this.form.type === 0) {
        callback()
        return
      }
      if (!value) {
        callback(new Error('请选择失效时间'))
      } else if (this.form.beginTime && new Date(value) <= new Date(this.form.beginTime)) {
        callback(new Error('失效时间必须大于生效时间'))
      } else {
        callback()
      }
    }

    // 验证开始时间必须小于结束时间（仅秒杀券生效）
    const validateBeginTime = (rule, value, callback) => {
      // 普通券直接通过校验
      if (this.form.type === 0) {
        callback()
        return
      }
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
        stock: null,
        validityType: 1, // 有效期类型：1-固定日期，2-动态有效期
        useStartTime: null,
        useEndTime: null,
        validDays: null
      },
      // 原始库存（用于检测库存增加）
      originalStock: null,
      // 原始支付金额（用于检测价格降低）
      originalPayValue: null,
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
      // 使用开始时间选择器配置
      useStartTimePickerOptions: {
        disabledDate: (time) => {
          if (this.form.useEndTime) {
            return time.getTime() > new Date(this.form.useEndTime).getTime()
          }
          return false
        }
      },
      // 使用结束时间选择器配置
      useEndTimePickerOptions: {
        disabledDate: (time) => {
          if (this.form.useStartTime) {
            return time.getTime() < new Date(this.form.useStartTime).getTime()
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
          { validator: validateBeginTime, trigger: 'change' } // 移除required，改为动态校验
        ],
        endTime: [
          { validator: validateEndTime, trigger: 'change' } // 移除required，改为动态校验
        ],
        stock: [
          { required: true, message: "库存不能为空", trigger: "blur" },
          { type: 'number', min: 0, message: "库存不能为负数", trigger: "blur" }
        ],
        validityType: [
          { required: true, message: "请选择有效期类型", trigger: "change" }
        ],
        useStartTime: [
          { required: true, message: "请选择使用开始时间", trigger: "change" }
        ],
        useEndTime: [
          { required: true, message: "请选择使用结束时间", trigger: "change" }
        ],
        validDays: [
          { required: true, message: "请输入有效天数", trigger: "blur" },
          { type: 'number', min: 1, max: 365, message: "有效天数必须在1-365之间", trigger: "blur" }
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
      shopList().then(response => {
        this.shopList = response.data || []
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
        endTime: null,
        validityType: 1, // 默认固定日期
        useStartTime: null,
        useEndTime: null,
        validDays: null
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
        // 确保类型正确映射
        this.form = {
          ...response.data,
          payValue: response.data.payValue,
          actualValue: response.data.actualValue,
          type: Number(response.data.type),
          status: Number(response.data.status),
          stock: response.data.stock,
          beginTime: response.data.type === 1 ? response.data.beginTime : null,
          endTime: response.data.type === 1 ? response.data.endTime : null,
          // 有效期相关字段
          validityType: response.data.validityType || 1,
          useStartTime: response.data.useStartTime,
          useEndTime: response.data.useEndTime,
          validDays: response.data.validDays
        }
        // 记录原始库存，用于检测库存增加
        this.originalStock = response.data.stock || 0
        // 记录原始支付金额，用于检测价格降低
        this.originalPayValue = response.data.payValue || 0
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
      // 如果是普通券，清空库存和抢购时间
      if (type === 0) {
        this.form.stock = null
        this.form.beginTime = null
        this.form.endTime = null
      }
    },
    /** 有效期类型变化事件 */
    handleValidityTypeChange(validityType) {
      // 切换有效期类型时清空对应字段并清除验证状态
      if (validityType === 1) {
        // 固定日期模式，清空动态有效期天数
        this.form.validDays = null
        // 使用$nextTick确保DOM更新后再清除验证
        this.$nextTick(() => {
          this.$refs.form && this.$refs.form.clearValidate(['validDays'])
        })
      } else if (validityType === 2) {
        // 动态有效期模式，清空固定日期
        this.form.useStartTime = null
        this.form.useEndTime = null
        // 使用$nextTick确保DOM更新后再清除验证
        this.$nextTick(() => {
          this.$refs.form && this.$refs.form.clearValidate(['useStartTime', 'useEndTime'])
        })
      }
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          const formData = {
            ...this.form
          }

          // 如果是普通券，删除库存、抢购时间字段
          if (formData.type === 0) {
            delete formData.stock
            delete formData.beginTime
            delete formData.endTime
          }
          
          // 根据有效期类型处理字段
          if (formData.validityType === 1) {
            // 固定日期模式，清空动态有效期天数
            delete formData.validDays
          } else if (formData.validityType === 2) {
            // 动态有效期模式，清空固定日期
            delete formData.useStartTime
            delete formData.useEndTime
          }

          if (this.form.id != null) {
            // 修改操作
            const currentStock = this.form.stock || 0
            const stockDiff = currentStock - this.originalStock
            const currentPayValue = this.form.payValue || 0
            const isPriceReduced = currentPayValue < this.originalPayValue
            
            // 先更新优惠券数据
            updateVoucher(formData).then(() => {
              const promises = []
              
              // 如果是秒杀券且库存增加了，发送库存增加MQ消息
              if (this.form.type === 1 && stockDiff > 0) {
                promises.push(addStock(this.form.id))
              }
              
              // 如果价格降低了，发送价格降低MQ消息
              if (isPriceReduced) {
                promises.push(priceReduced(this.form.id))
              }
              
              return Promise.all(promises)
            }).then(() => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            }).catch(() => {})
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

      this.$modal.confirm(`确认要${statusText}优惠券"${row.title}"吗？`).then(() => {
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
    },
    handleAllPublish(){
      allPublish().then(response => {
        response.msg && this.$modal.msgSuccess(response.msg)
      }).catch(() => {
      })
    },
    handlePublish(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认发布代金券？').then(function() {
        return publish(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("发布成功")
      }).catch(() => {})
    },
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
.validity-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
.el-divider--horizontal {
  margin: 20px 0 16px;
}
.el-divider__text {
  color: #606266;
  font-weight: 500;
}
</style>
