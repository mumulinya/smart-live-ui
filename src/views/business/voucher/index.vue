<template>
  <div class="app-container">
     <el-card class="box-card mb-4" shadow="never">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px" class="search-form">
        <el-form-item label="店铺" prop="shopId">
            <el-select
            v-model="queryParams.shopId"
            placeholder="请选择店铺"
            clearable
            filterable
            style="width: 200px"
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
        <el-form-item label="类型" prop="type">
            <el-select
            v-model="queryParams.type"
            placeholder="优惠券类型"
            clearable
            style="width: 120px"
            @change="handleQuery"
            >
            <el-option label="普通券" :value="0" />
            <el-option label="秒杀券" :value="1" />
            </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
            <el-input
            v-model="queryParams.title"
            placeholder="请输入优惠券标题"
            clearable
            style="width: 200px"
            @keyup.enter.native="handleQuery"
            />
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
        <div class="right-actions">
           <el-button
            type="text"
            icon="el-icon-s-promotion"
            size="mini"
            @click="handleAllPublish"
          >全量发布</el-button>
          <el-button
            type="text"
            icon="el-icon-s-promotion"
            size="mini"
            @click="handlePublish"
          >发布选中</el-button>
          <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        </div>
        </el-row>
    </el-card>

    <el-card class="box-card" shadow="never">
        <el-table v-loading="loading" :data="voucherList" @selection-change="handleSelectionChange" border stripe :header-cell-style="{background:'#f5f7fa',color:'#606266'}">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="优惠券信息" min-width="220">
            <template slot-scope="scope">
                <div class="voucher-info-cell">
                    <div class="v-icon" :class="scope.row.type === 1 ? 'seckill' : 'normal'">
                        <i :class="scope.row.type === 1 ? 'el-icon-alarm-clock' : 'el-icon-tickets'"></i>
                    </div>
                    <div class="v-text">
                        <div class="v-title">{{ scope.row.title }}</div>
                        <div class="v-shop">
                             <i class="el-icon-shop"></i> {{ scope.row.shopName }}
                        </div>
                    </div>
                </div>
            </template>
        </el-table-column>
        <el-table-column label="类型" align="center" prop="type" width="100">
            <template slot-scope="scope">
            <el-tag :type="scope.row.type === 0 ? '' : 'danger'" effect="plain">
                {{ scope.row.type === 0 ? '普通券' : '秒杀券' }}
            </el-tag>
            </template>
        </el-table-column>
        <el-table-column label="面值 / 售价" align="center" width="160">
            <template slot-scope="scope">
                <div class="price-info">
                   <div class="actual-price">抵 ¥{{ (scope.row.actualValue / 1).toFixed(2) }}</div>
                   <div class="pay-price">售 ¥{{ (scope.row.payValue / 1).toFixed(2) }}</div>
                </div>
            </template>
        </el-table-column>
        <el-table-column label="库存" align="center" prop="stock" width="100">
            <template slot-scope="scope">
            <span v-if="scope.row.type === 1" class="stock-text">{{ scope.row.stock || 0 }}</span>
            <span v-else class="text-muted">-</span>
            </template>
        </el-table-column>
        <!-- 合并时间显示 -->
        <el-table-column label="有效期 / 抢购时间" align="center" min-width="240">
            <template slot-scope="scope">
                <div v-if="scope.row.type === 1" class="time-block seckill-time">
                     <div class="time-label">抢购:</div>
                     <div class="time-val">{{ parseTime(scope.row.beginTime, '{m}-{d} {h}:{i}') }} ~ {{ parseTime(scope.row.endTime, '{m}-{d} {h}:{i}') }}</div>
                </div>
                 <div class="time-block use-time">
                    <div class="time-label">使用:</div>
                     <div class="time-val" v-if="scope.row.validityType === 1">
                        {{ parseTime(scope.row.useStartTime, '{y}-{m}-{d}') }} ~ {{ parseTime(scope.row.useEndTime, '{y}-{m}-{d}') }}
                     </div>
                     <div class="time-val" v-else-if="scope.row.validityType === 2">
                        <el-tag type="success" size="mini">领取后{{ scope.row.validDays }}天有效</el-tag>
                     </div>
                </div>
            </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" width="100">
            <template slot-scope="scope">
            <el-tag
                :type="scope.row.status === 1 ? 'success' : (scope.row.status === 2 ? 'info' : 'warning')"
            >
                {{ scope.row.status === 1 ? '上架' : (scope.row.status === 2 ? '下架' : '过期') }}
            </el-tag>
            </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180" fixed="right">
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
                :class="scope.row.status === 1 ? 'text-warning' : 'text-success'"
                :icon="scope.row.status === 1 ? 'el-icon-bottom' : 'el-icon-top'"
                @click="handleStatusChange(scope.row)"
                v-hasPermi="['marketing:voucher:edit']"
            >{{ scope.row.status === 1 ? '下架' : '上架' }}</el-button>
             <el-button
                size="mini"
                type="text"
                icon="el-icon-delete"
                class="text-danger"
                @click="handleDelete(scope.row)"
                v-hasPermi="['marketing:voucher:remove']"
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

    <!-- 添加或修改优惠券对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="700px" append-to-body custom-class="voucher-edit-dialog" top="5vh">
      <el-form ref="form" :model="form" :rules="rules" label-width="120px" class="edit-form">
        
        <div class="form-section-title">基础信息</div>
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
          <el-radio-group v-model="form.type" @change="handleTypeChange" class="custom-radio-group">
            <el-radio :label="0" border>普通优惠券</el-radio>
            <el-radio :label="1" border>秒杀优惠券</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="主标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入优惠券标题 (如：满100减20)" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="副标题" prop="subTitle">
          <el-input v-model="form.subTitle" placeholder="请输入副标题 (选填)" maxlength="100" show-word-limit />
        </el-form-item>

        <div class="form-section-title">规则与金额</div>
         <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="支付金额" prop="payValue">
              <el-input-number
                v-model="form.payValue"
                :min="0"
                :precision="2"
                :step="1"
                style="width: 100%"
                controls-position="right"
              >
                  <template slot="prepend">¥</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="抵扣金额" prop="actualValue">
               <el-input-number
                v-model="form.actualValue"
                :min="0"
                :precision="2"
                :step="1"
                style="width: 100%"
                controls-position="right"
              >
                 <template slot="prepend">¥</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="使用规则" prop="rules">
          <el-input
            v-model="form.rules"
            type="textarea"
            placeholder="请输入详细使用规则与限制条件..."
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

         <!-- 秒杀券特有 -->
         <div v-if="form.type === 1" class="seckill-section">
             <div class="form-section-title highlight">秒杀设置</div>
              <el-row :gutter="20">
                <el-col :span="24">
                     <el-form-item
                        label="发放库存"
                        prop="stock"
                        :rules="form.type === 1 ? rules.stock : []"
                        >
                        <el-input-number
                            v-model="form.stock"
                            :min="0"
                            :max="99999"
                            style="width: 200px"
                            placeholder="库存数量"
                        />
                         <span class="tip-text ml-2">张</span>
                        </el-form-item>
                </el-col>
              </el-row>
             <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="抢购开始" prop="beginTime">
                    <el-date-picker
                        v-model="form.beginTime"
                        type="datetime"
                        placeholder="选择开始时间"
                        style="width: 100%"
                        value-format="yyyy-MM-dd HH:mm:ss"
                        :picker-options="beginTimePickerOptions"
                    />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="抢购结束" prop="endTime">
                    <el-date-picker
                        v-model="form.endTime"
                        type="datetime"
                        placeholder="选择结束时间"
                        style="width: 100%"
                        value-format="yyyy-MM-dd HH:mm:ss"
                        :picker-options="endTimePickerOptions"
                    />
                    </el-form-item>
                </el-col>
            </el-row>
         </div>

         <div class="form-section-title">使用有效期</div>
         <el-form-item label="有效期类型" prop="validityType">
            <el-radio-group v-model="form.validityType" @change="handleValidityTypeChange">
            <el-radio :label="1">固定日期范围</el-radio>
            <el-radio :label="2">领取后动态天数</el-radio>
            </el-radio-group>
        </el-form-item>
        
        <!-- 固定日期模式 -->
        <el-row v-if="form.validityType === 1">
          <el-col :span="12">
            <el-form-item label="开始使用" prop="useStartTime" :rules="form.validityType === 1 ? rules.useStartTime : []">
              <el-date-picker
                v-model="form.useStartTime"
                type="datetime"
                placeholder="选择开始时间"
                style="width: 100%"
                value-format="yyyy-MM-dd HH:mm:ss"
                :picker-options="useStartTimePickerOptions"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止使用" prop="useEndTime" :rules="form.validityType === 1 ? rules.useEndTime : []">
              <el-date-picker
                v-model="form.useEndTime"
                type="datetime"
                placeholder="选择结束时间"
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
          />
          <span class="validity-tip">天（自用户领取之日起计算）</span>
        </el-form-item>

      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 优惠券详情对话框 -->
    <el-dialog :visible.sync="viewOpen" width="650px" append-to-body custom-class="voucher-detail-dialog">
       <div class="voucher-ticket-header" :class="viewForm.type === 1 ? 'is-seckill' : 'is-normal'">
           <div class="ticket-left">
               <div class="ticket-val">
                   <span class="unit">¥</span>{{ viewForm.actualValue }}
               </div>
               <div class="ticket-tag">{{ viewForm.type === 1 ? '秒杀券' : '普通券' }}</div>
           </div>
           <div class="ticket-right">
               <div class="t-title">{{ viewForm.title }}</div>
               <div class="t-sub">{{ viewForm.subTitle || '暂无副标题' }}</div>
               <div class="t-shop"><i class="el-icon-shop"></i> {{ viewForm.shopName }}</div>
           </div>
           
           <!-- 状态印章 -->
           <div class="ticket-status-stamp" v-if="viewForm.status !== 1">
               {{ viewForm.status === 2 ? '已下架' : '已过期' }}
           </div>
       </div>

       <div class="voucher-detail-content">
            <div class="detail-section">
                <div class="section-title">基本信息</div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">售价:</span>
                        <span class="value price">¥{{ viewForm.payValue }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">库存:</span>
                        <span class="value">{{ viewForm.type === 1 ? viewForm.stock : '不限' }}</span>
                    </div>
                     <div class="info-item full">
                        <span class="label">使用规则:</span>
                        <span class="value">{{ viewForm.rules || '暂无详细规则' }}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <div class="section-title">时间设置</div>
                 <div class="info-grid single-col">
                    <!-- 有效期 -->
                    <div class="info-item" v-if="viewForm.validityType === 1">
                         <i class="el-icon-date"></i>
                         <span class="label">使用有效期:</span>
                         <span class="value">{{ parseTime(viewForm.useStartTime, '{y}-{m}-{d} {h}:{i}') }} 至 {{ parseTime(viewForm.useEndTime, '{y}-{m}-{d} {h}:{i}') }}</span>
                    </div>
                    <div class="info-item" v-else>
                         <i class="el-icon-timer"></i>
                         <span class="label">使用有效期:</span>
                         <span class="value">领取后 {{ viewForm.validDays }} 天内有效</span>
                    </div>

                    <!-- 抢购时间 -->
                    <div class="info-item" v-if="viewForm.type === 1">
                         <i class="el-icon-alarm-clock"></i>
                         <span class="label">抢购时间:</span>
                         <span class="value">{{ parseTime(viewForm.beginTime, '{y}-{m}-{d} {h}:{i}') }} 至 {{ parseTime(viewForm.endTime, '{y}-{m}-{d} {h}:{i}') }}</span>
                    </div>

                     <div class="info-item">
                         <i class="el-icon-time"></i>
                         <span class="label">创建时间:</span>
                         <span class="value">{{ parseTime(viewForm.createTime) }}</span>
                    </div>
                 </div>
            </div>
       </div>

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
.ml-2 {
    margin-left: 10px;
}
.text-danger { color: #f56c6c; }
.text-success { color: #67c23a; }
.text-warning { color: #e6a23c; }
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
    .right-actions {
        margin-left: auto;
        display: flex;
        gap: 10px;
        align-items: center;
    }
}

/* 优惠券表格样式 */
.voucher-info-cell {
    display: flex;
    align-items: center;
    padding: 8px 0;
    .v-icon {
        width: 44px;
        height: 44px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        margin-right: 12px;
        flex-shrink: 0;
        
        &.normal {
            background-color: #ecf5ff;
            color: #409EFF;
        }
        &.seckill {
            background-color: #fef0f0;
            color: #f56c6c;
        }
    }
    .v-text {
        overflow: hidden;
        .v-title {
            font-size: 14px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .v-shop {
            font-size: 12px;
            color: #909399;
            display: flex;
            align-items: center;
            i {
                margin-right: 4px;
            }
        }
    }
}

.price-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    .actual-price {
        font-size: 14px;
         font-weight: 600;
        color: #f56c6c;
    }
    .pay-price {
        font-size: 12px;
        color: #909399;
        text-decoration: line-through;
        margin-top: 2px;
    }
}

.stock-text {
    font-weight: 500;
    color: #303133;
}

.time-block {
    font-size: 12px;
    display: flex;
    justify-content: center;
    margin: 2px 0;
    
    .time-label {
        color: #909399;
        margin-right: 6px;
    }
    .time-val {
        color: #606266;
    }
    
    &.seckill-time .time-val {
        color: #f56c6c;
        font-weight: 500;
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
    
    &.highlight {
        border-color: #f56c6c;
    }
}
.seckill-section {
    background-color: #fef0f0;
    padding: 15px;
    border-radius: 6px;
    margin-bottom: 20px;
    .form-section-title {
        margin-top: 0;
        background: none;
        padding-left: 0;
        border: none;
        color: #f56c6c;
        font-size: 14px;
    }
}

/* 详情弹窗优化 */
.voucher-ticket-header {
    display: flex;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    margin-bottom: 25px;
    
    &.is-normal {
        .ticket-left { background: linear-gradient(135deg, #409EFF, #79bbff); }
        .ticket-tag { color: #409EFF; }
    }
    &.is-seckill {
        .ticket-left { background: linear-gradient(135deg, #f56c6c, #fab6b6); }
        .ticket-tag { color: #f56c6c; }
    }
    
    .ticket-left {
        width: 140px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #fff;
        border-right: 2px dashed rgba(255,255,255,0.4);
        position: relative;
        
        .ticket-val {
            font-size: 32px;
            font-weight: bold;
            .unit { font-size: 16px; margin-right: 2px; }
        }
        .ticket-tag {
            background: #fff;
            padding: 2px 10px;
            border-radius: 10px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 8px;
        }
        
        // 票据圆角效果
        &::after, &::before {
            content: '';
            position: absolute;
            right: -6px;
            width: 12px;
            height: 12px;
            background: #fff;
            border-radius: 50%;
        }
        &::before { top: -6px; }
        &::after { bottom: -6px; }
    }
    
    .ticket-right {
        flex: 1;
        padding: 20px;
        background: #fff;
        display: flex;
        flex-direction: column;
        justify-content: center;
        
        .t-title { font-size: 18px; font-weight: bold; color: #303133; margin-bottom: 8px; }
        .t-sub { font-size: 13px; color: #909399; margin-bottom: 12px; }
        .t-shop { font-size: 12px; color: #606266; }
    }
    
    .ticket-status-stamp {
        position: absolute;
        right: 20px;
        top: 10px;
        border: 2px solid #909399;
        color: #909399;
        border-radius: 50%;
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        transform: rotate(-15deg);
        opacity: 0.5;
    }
}

.voucher-detail-content {
    .detail-section {
        margin-bottom: 25px;
        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 15px;
            border-left: 3px solid #dcdfe6;
            padding-left: 8px;
        }
    }
    
    .info-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        
        &.single-col {
             flex-direction: column;
             gap: 12px;
             .info-item { width: 100%; }
        }
        
        .info-item {
            width: calc(50% - 15px);
            background: #f8f9fa;
            padding: 10px 15px;
            border-radius: 4px;
            display: flex;
            align-items: center;
             &.full { width: 100%; }
             
             i { margin-right: 8px; color: #909399; }
             .label { color: #606266; margin-right: 10px; min-width: 60px; font-size: 13px;}
             .value { color: #303133; font-weight: 500; font-size: 13px; flex: 1;
                 &.price { color: #f56c6c; font-size: 16px; }
             }
        }
    }
}
</style>
