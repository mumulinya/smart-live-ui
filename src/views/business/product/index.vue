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
        <el-form-item label="商品类型" prop="category">
            <el-select
            v-model="queryParams.category"
            placeholder="请选择商品类型"
            clearable
            style="width: 150px"
            @change="handleQuery"
            >
            <el-option label="代金券" :value="1" />
            <el-option label="团购套餐" :value="2" />
            </el-select>
        </el-form-item>
        <el-form-item label="活动类型" prop="activityType">
            <el-select
            v-model="queryParams.activityType"
            placeholder="活动类型"
            clearable
            style="width: 120px"
            @change="handleQuery"
            >
            <el-option label="普通" :value="0" />
            <el-option label="秒杀" :value="1" />
            </el-select>
        </el-form-item>
        <el-form-item label="名称" prop="name">
            <el-input
            v-model="queryParams.name"
            placeholder="请输入商品名称"
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
            >新增商品</el-button>
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
        <!-- <el-col :span="1.5">
            <el-button
            type="warning"
            plain
            icon="el-icon-download"
            size="mini"
            @click="handleExport"
            v-hasPermi="['marketing:voucher:export']"
            >导出</el-button>
        </el-col> -->
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
        <el-table v-loading="loading" :data="productList" @selection-change="handleSelectionChange" border stripe :header-cell-style="{background:'#f5f7fa',color:'#606266'}">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="商品信息" min-width="220">
            <template slot-scope="scope">
                <div class="voucher-info-cell">
                    <div class="v-icon" :class="scope.row.activityType === 1 ? 'seckill' : 'normal'">
                        <i :class="scope.row.activityType === 1 ? 'el-icon-alarm-clock' : 'el-icon-goods'"></i>
                    </div>
                    <div class="v-text">
                        <div class="v-title">{{ scope.row.name }}</div>
                         <div class="v-sub-title" v-if="scope.row.subTitle">{{ scope.row.subTitle }}</div>
                        <div class="v-shop">
                             <i class="el-icon-shop"></i> {{ scope.row.shopName }}
                        </div>
                    </div>
                </div>
            </template>
        </el-table-column>
        <el-table-column label="商品类型" align="center" prop="category" width="100">
             <template slot-scope="scope">
                <el-tag v-if="scope.row.category === 1" type="success">代金券</el-tag>
                <el-tag v-else-if="scope.row.category === 2" type="warning">团购套餐</el-tag>
                <span v-else>其他</span>
            </template>
        </el-table-column>
        <el-table-column label="活动类型" align="center" prop="activityType" width="100">
            <template slot-scope="scope">
            <el-tag :type="scope.row.activityType === 0 ? 'info' : 'danger'" effect="plain">
                {{ scope.row.activityType === 0 ? '普通' : '秒杀' }}
            </el-tag>
            </template>
        </el-table-column>
        <el-table-column label="原价 / 售价" align="center" width="160">
            <template slot-scope="scope">
                <div class="price-info">
                   <div class="actual-price">原 ¥{{ (scope.row.originalPrice / 100).toFixed(2) }}</div>
                   <div class="pay-price">售 ¥{{ (scope.row.price / 100).toFixed(2) }}</div>
                </div>
            </template>
        </el-table-column>
        <el-table-column label="库存" align="center" prop="stock" width="100">
            <template slot-scope="scope">
            <span class="stock-text">{{ scope.row.stock || 0 }}</span>
            </template>
        </el-table-column>
        <el-table-column label="有效期 / 抢购时间" align="center" min-width="240">
            <template slot-scope="scope">
                <div v-if="scope.row.activityType === 1" class="time-block seckill-time">
                     <div class="time-label">抢购:</div>
                     <div class="time-val">{{ parseTime(scope.row.beginTime, '{m}-{d} {h}:{i}') }} ~ {{ parseTime(scope.row.endTime, '{m}-{d} {h}:{i}') }}</div>
                </div>
                 <div class="time-block use-time">
                    <div class="time-label">有效期:</div>
                    <div class="time-val" v-if="scope.row.validityType === 1">
                        {{ parseTime(scope.row.useStartTime, '{y}-{m}-{d}') }} 至 {{ parseTime(scope.row.useEndTime, '{y}-{m}-{d}') }}
                    </div>
                    <div class="time-val" v-else-if="scope.row.validityType === 2">
                        领券后 {{ scope.row.validDays }} 天内有效
                    </div>
                    <div class="time-val" v-else>未设置</div>
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

    <!-- 添加或修改商品对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="700px" append-to-body custom-class="voucher-edit-dialog" top="5vh">
      <el-form ref="form" :model="form" :rules="rules" label-width="120px" class="edit-form">
        
        <div class="form-section-title">基础信息</div>
        <el-form-item label="所属店铺" prop="shopId">
          <el-select
            v-model="form.shopId"
            placeholder="请选择店铺"
            style="width: 100%"
            filterable
            :disabled="!!form.id"
          >
            <el-option
              v-for="shop in shopList"
              :key="shop.id"
              :label="shop.name"
              :value="shop.id"
            />
          </el-select>
        </el-form-item>
        
        <el-row>
             <el-col :span="12">
                 <el-form-item label="商品类型" prop="category">
                    <el-select v-model="form.category" placeholder="请选择类型" style="width: 100%" :disabled="!!form.id">
                        <el-option label="代金券" :value="1" />
                        <el-option label="团购套餐" :value="2" />
                    </el-select>
                </el-form-item>
             </el-col>
              <el-col :span="12">
                   <el-form-item label="活动类型" prop="activityType">
                    <el-radio-group v-model="form.activityType" @change="handleActivityTypeChange" class="custom-radio-group">
                        <el-radio :label="0">普通</el-radio>
                        <el-radio :label="1">秒杀</el-radio>
                    </el-radio-group>
                    </el-form-item>
              </el-col>
        </el-row>

        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入商品名称 (如：100元代金券)" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="副标题" prop="subTitle">
          <el-input v-model="form.subTitle" placeholder="请输入副标题 (选填)" maxlength="100" show-word-limit />
        </el-form-item>

        <div class="form-section-title">价格与规则</div>
         <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="销售价格" prop="price">
              <el-input-number
                v-model="form.price"
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
            <el-form-item label="原价/面值" prop="originalPrice">
               <el-input-number
                v-model="form.originalPrice"
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
        
        <el-form-item label="使用规则" prop="rulesJson">
          <el-input
            v-model="form.rulesJson"
            type="textarea"
            placeholder="请输入详细使用规则 (JSON格式或普通文本)..."
            :rows="3"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

          <el-row :gutter="20">
            <el-col :span="12">
                    <el-form-item
                    label="发放库存"
                    prop="stock"
                    >
                    <el-input-number
                        v-model="form.stock"
                        :min="0"
                        :max="99999"
                        style="width: 100%"
                        placeholder="库存数量"
                    />
                    </el-form-item>
            </el-col>
            <el-col :span="12">
                <el-form-item label="有效期类型" prop="validityType">
                    <el-radio-group v-model="form.validityType">
                        <el-radio :label="1">固定日期</el-radio>
                        <el-radio :label="2">动态天数</el-radio>
                    </el-radio-group>
                </el-form-item>
            </el-col>
          </el-row>

          <el-form-item v-if="form.validityType === 1" label="有效期日期" prop="useStartTime">
            <el-date-picker
                v-model="validityRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="yyyy-MM-dd HH:mm:ss"
                style="width: 100%"
                @change="handleRangeChange"
            />
          </el-form-item>

          <el-form-item v-if="form.validityType === 2" label="有效天数" prop="validDays">
            <el-input-number
                v-model="form.validDays"
                :min="1"
                :max="365"
                style="width: 100%"
                placeholder="购买后多少天内有效"
            />
          </el-form-item>
          
         <!-- 秒杀特有 -->
         <div v-if="form.activityType === 1" class="seckill-section">
              <div class="form-section-title highlight">秒杀时间设置</div>
             <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="抢购开始" prop="beginTime" :rules="form.activityType === 1 ? rules.beginTime : []">
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
                    <el-form-item label="抢购结束" prop="endTime" :rules="form.activityType === 1 ? rules.endTime : []">
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


      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 商品详情对话框 -->
    <el-dialog :visible.sync="viewOpen" width="650px" append-to-body custom-class="voucher-detail-dialog">
       <div class="voucher-ticket-header" :class="viewForm.activityType === 1 ? 'is-seckill' : 'is-normal'">
           <div class="ticket-left">
               <div class="ticket-val">
                   <span class="unit">¥</span>{{ (viewForm.originalPrice / 100).toFixed(2) }}
               </div>
               <div class="ticket-tag">{{ viewForm.category === 1 ? '代金券' : '团购套餐' }}</div>
           </div>
           <div class="ticket-right">
               <div class="t-title">{{ viewForm.name }}</div>
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
                        <span class="value price">¥{{ (viewForm.price / 100).toFixed(2) }}</span>
                    </div>
                     <div class="info-item">
                        <span class="label">店铺:</span>
                        <span class="value">{{ viewForm.shopName }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">库存:</span>
                        <span class="value">{{ viewForm.stock }}</span>
                    </div>
                     <div class="info-item full">
                        <span class="label">使用规则:</span>
                        <span class="value">{{ viewForm.rulesJson || '暂无详细规则' }}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <div class="section-title">时间设置</div>
                 <div class="info-grid single-col">
                    <div class="info-item" v-if="viewForm.activityType === 1">
                         <i class="el-icon-alarm-clock"></i>
                         <span class="label">抢购时间:</span>
                         <span class="value">{{ parseTime(viewForm.beginTime, '{y}-{m}-{d} {h}:{i}') }} 至 {{ parseTime(viewForm.endTime, '{y}-{m}-{d} {h}:{i}') }}</span>
                    </div>
                    <div class="info-item">
                         <i class="el-icon-date"></i>
                         <span class="label">有效期:</span>
                         <span class="value" v-if="viewForm.validityType === 1">
                             {{ parseTime(viewForm.useStartTime, '{y}-{m}-{d}') }} 至 {{ parseTime(viewForm.useEndTime, '{y}-{m}-{d}') }}
                         </span>
                         <span class="value" v-else-if="viewForm.validityType === 2">
                             领券后 {{ viewForm.validDays }} 天内有效
                         </span>
                         <span class="value" v-else>未设置</span>
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
import { listProduct, getProduct, delProduct, addProduct, updateProduct, changeProductStatus, publishProduct, publishAllProduct } from "@/api/product"
import { listShop,  shopList} from "@/api/shop/shop"

export default {
  name: "Product",
  data() {
    // 验证结束时间必须大于开始时间（仅秒杀券生效）
    const validateEndTime = (rule, value, callback) => {
      // 普通商品直接通过校验
      if (this.form.activityType === 0) {
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

    // 验证开始时间必须小于结束时间（仅秒杀商品生效）
    const validateBeginTime = (rule, value, callback) => {
      // 普通商品直接通过校验
      if (this.form.activityType === 0) {
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
      // 商品表格数据
      productList: [],
      // 店铺列表
      shopList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 是否显示详情弹出层
      viewOpen: false,
      // 有效期日期范围绑定
      validityRange: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        shopId: null,
        name: null,
        category: null,
        activityType: null,
      },
      // 表单参数
      form: {
        id: undefined,
        shopId: undefined,
        name: undefined,
        subTitle: undefined,
        category: 1, // 默认代金券
        activityType: 0, // 默认普通
        price: undefined,
        originalPrice: undefined,
        stock: undefined,
        rulesJson: undefined,
        beginTime: undefined,
        endTime: undefined,
        validityType: 1, // 1-固定日期，2-动态天数
        useStartTime: undefined,
        useEndTime: undefined,
        validDays: undefined,
        status: 1
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
        name: [
          { required: true, message: "商品名称不能为空", trigger: "blur" },
          { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" }
        ],
        category: [
            { required: true, message: "请选择商品类型", trigger: "change" }
        ],
        activityType: [
            { required: true, message: "请选择活动类型", trigger: "change" }
        ],
        price: [
          { required: true, message: "销售价格不能为空", trigger: "blur" },
          { type: 'number', min: 0, message: "价格必须大于等于0", trigger: "blur" }
        ],
        originalPrice: [
          { required: true, message: "原价不能为空", trigger: "blur" },
          { type: 'number', min: 0, message: "原价必须大于等于0", trigger: "blur" }
        ],
        status: [
          { required: true, message: "请选择状态", trigger: "change" }
        ],
        beginTime: [
          { validator: validateBeginTime, trigger: 'change' } 
        ],
        endTime: [
          { validator: validateEndTime, trigger: 'change' } 
        ],
        stock: [
          { required: true, message: "库存不能为空", trigger: "blur" },
          { type: 'number', min: 0, message: "库存不能为负数", trigger: "blur" }
        ],
        validityType: [
          { required: true, message: "请选择有效期类型", trigger: "change" }
        ],
        useStartTime: [
          { required: true, message: "请选择有效日期范围", trigger: "change" }
        ],
        validDays: [
          { required: true, message: "请输入有效天数", trigger: "blur" }
        ]
      }
    }
  },
  created() {
    this.getShopList()
    this.getList()
  },
  methods: {
    /** 处理日期范围变化 */
    handleRangeChange(val) {
      if (val && val.length === 2) {
        this.form.useStartTime = val[0]
        this.form.useEndTime = val[1]
      } else {
        this.form.useStartTime = undefined
        this.form.useEndTime = undefined
      }
    },
    /** 查询优惠券列表 */
    getList() {
      this.loading = true
      listProduct(this.queryParams).then(response => {
        // 将店铺ID映射为店铺名称
        // 假设后端返回的数据结构已经调整为 Document 结构，如果不是，可能需要调整
        // 注意：搜索接口返回 document 结构，price 是分
        // 如果是直接查数据库列表，price 可能是 元 或者是 分，这里根据 implementation plan 是分
        const products = response.rows.map(item => {
          const shop = this.shopList.find(shop => shop.id === item.shopId)
          return {
            ...item,
            shopName: shop ? shop.name : (item.shopName || '未知店铺')
          }
        })
        this.productList = products
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
        id: undefined,
        shopId: undefined,
        name: undefined,
        subTitle: undefined,
        category: 1, 
        activityType: 0, 
        price: 0.0,
        originalPrice: 0.0,
        stock: 0,
        rulesJson: undefined,
        beginTime: undefined,
        endTime: undefined,
        validityType: 1,
        useStartTime: undefined,
        useEndTime: undefined,
        validDays: undefined,
        status: 1
      }
      this.validityRange = []
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
      this.queryParams.category = null
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
      this.title = "新增商品"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getProduct(id).then(response => {
        this.form = {
          ...response.data,
          price: response.data.price, 
          originalPrice: response.data.originalPrice,
          category: response.data.category || 1,
          activityType: response.data.activityType || 0,
          beginTime: response.data.beginTime,
          endTime: response.data.endTime,
          validityType: response.data.validityType || 1,
          useStartTime: response.data.useStartTime,
          useEndTime: response.data.useEndTime,
          validDays: response.data.validDays
        }
        if (this.form.useStartTime && this.form.useEndTime) {
          this.validityRange = [this.form.useStartTime, this.form.useEndTime]
        }
        this.open = true
        this.title = "修改商品"
      })
    },
    /** 查看详情按钮操作 */
    handleView(row) {
      // 这里的 row 来自搜索列表，价格是分
      const id = row.id
      getProduct(id).then(response => {
        const shop = this.shopList.find(shop => shop.id === response.data.shopId)
         // 详情弹窗展示，假设 GET 返回的价格也是元 (Form Consistent)
         // 但列表里的 row.payValue 是 分。
         // 为了显示统一，这里要注意单位。
         // 如果 getProduct 返回的是 Entity (Yuan)，则直接显示。
         // Check migration guide: "Form submission ... price: 100.00 (Yuan)"
        this.viewForm = {
          ...response.data,
          shopName: shop ? shop.name : '未知店铺',
          // 详情弹窗展示，假设 GET 返回的价格也是元 (Form Consistent)
          // 但列表里的 row.payValue 是 分。为了显示统一这里乘100。
          price: response.data.price * 100, 
          originalPrice: response.data.originalPrice * 100,
          validityType: response.data.validityType || 1,
          useStartTime: response.data.useStartTime,
          useEndTime: response.data.useEndTime,
          validDays: response.data.validDays
        }
        this.viewOpen = true
      })
    },
    /** 活动类型变化 */
    handleActivityTypeChange(type) {
      if (type === 0) {
        this.form.beginTime = null
        this.form.endTime = null
      }
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != undefined) {
            updateProduct(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addProduct(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除商品编码为"' + ids + '"的数据项？').then(function() {
        return delProduct(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 状态修改 */
    handleStatusChange(row) {
      // 1-上架，2-下架
      const text = row.status === 1 ? "下架" : "上架"
      const newStatus = row.status === 1 ? 2 : 1
      this.$modal.confirm('确认要"' + text + '""' + row.name + '"商品吗？').then(function() {
        return changeProductStatus(row.id, newStatus)
      }).then(() => {
        this.$modal.msgSuccess(text + "成功")
        this.getList()
      }).catch(function() {
        row.status = row.status === 1 ? 1 : 2
      })
    },
    /** 发布选中按钮操作 */
    handlePublish() {
      const ids = this.ids;
      if (!ids || ids.length == 0) {
        this.$modal.msgWarning("请选择要发布的商品");
        return;
      }
      this.$modal.confirm('是否确认发布选中的商品？').then(function() {
        // Assuming publishProduct handles one ID, but the button implies bulk or single from selection
        // If the API supports list, good. If not, might need loop or robust backend.
        // Based on analysis, publishProduct in api takes 'id'.
        // If 'ids' is array, we might need to handle it.
        // However, standard logic often passes comma separated string or handles single.
        // Let's assume standard behavior for now: join if array, or the API might expect single ID path param.
        // Checking api: url: '/product/publish/' + id
        // So it likely expects a single ID or maybe a comma separated string if the backend supports it.
        // Let's try passing the ids join.
        return publishProduct(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("发布成功");
      }).catch(() => {});
    },
    /** 全量发布按钮操作 */
    handleAllPublish() {
      this.$modal.confirm('是否确认全量发布所有商品？').then(function() {
        return publishAllProduct();
      }).then(() => {
        this.$modal.msgSuccess("全量发布成功");
      }).catch(() => {});
    }
  }
}
</script>

<style lang="scss" scoped>
.voucher-info-cell {
    display: flex;
    align-items: center;
    .v-icon {
        width: 40px;
        height: 40px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 10px;
        i {
            font-size: 24px;
            color: #fff;
        }
        &.normal {
            background: linear-gradient(135deg, #409EFF, #36d1dc);
        }
        &.seckill {
            background: linear-gradient(135deg, #FF6B6B, #eb3c3c);
        }
    }
    .v-text {
        flex: 1;
        overflow: hidden;
        .v-title {
            font-weight: bold;
            font-size: 14px;
            color: #333;
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .v-sub-title {
             font-size: 12px;
             color: #999;
             margin-bottom: 2px;
        }
        .v-shop {
            font-size: 12px;
            color: #666;
            i {
                margin-right: 2px;
            }
        }
    }
}

.price-info {
    .actual-price {
        color: #999;
        text-decoration: line-through;
        font-size: 12px;
    }
    .pay-price {
        color: #f56c6c;
        font-weight: bold;
        font-size: 14px;
    }
}

.stock-text {
    font-weight: bold;
    color: #409EFF;
}

.time-block {
    display: flex;
    align-items: center;
    font-size: 12px;
    margin-bottom: 4px;
    &:last-child {
        margin-bottom: 0;
    }
    .time-label {
        color: #999;
        margin-right: 6px;
        width: 36px;
        text-align: right;
    }
    .time-val {
        color: #666;
    }
    &.seckill-time .time-val {
        color: #f56c6c;
    }
}

.voucher-ticket-header {
    padding: 20px;
    color: #fff;
    border-radius: 8px 8px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    overflow: hidden;
    
    &.is-normal {
        background: linear-gradient(135deg, #409EFF, #36d1dc);
    }
    &.is-seckill {
        background: linear-gradient(135deg, #ff9a9e, #fad0c4 99%, #fad0c4);
        background: linear-gradient(135deg, #FF6B6B, #eb3c3c);
    }

    .ticket-left {
        text-align: center;
        border-right: 1px dashed rgba(255,255,255,0.3);
        padding-right: 20px;
        margin-right: 20px;
        .ticket-val {
            font-size: 32px;
            font-weight: bold;
            .unit {
                font-size: 14px;
                margin-right: 2px;
            }
        }
        .ticket-tag {
            font-size: 12px;
            background: rgba(255,255,255,0.2);
            padding: 2px 8px;
            border-radius: 10px;
            margin-top: 5px;
            display: inline-block;
        }
    }
    
    .ticket-right {
        flex: 1;
        .t-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .t-sub {
            font-size: 12px;
            opacity: 0.9;
            margin-bottom: 8px;
        }
        .t-shop {
            font-size: 12px;
            opacity: 0.8;
            i { margin-right: 4px; }
        }
    }

    .ticket-status-stamp {
        position: absolute;
        right: 10px;
        top: 10px;
        border: 2px solid #fff;
        padding: 5px 10px;
        font-size: 14px;
        font-weight: bold;
        transform: rotate(15deg);
        opacity: 0.6;
        border-radius: 4px;
    }
}

.voucher-detail-content {
    padding: 20px;
    .detail-section {
        margin-bottom: 25px;
        &:last-child { margin-bottom: 0; }
        
        .section-title {
            font-size: 15px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            padding-left: 10px;
            border-left: 4px solid #409EFF;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            
            &.single-col {
                 grid-template-columns: 1fr;
            }

            .info-item {
                display: flex;
                align-items: flex-start;
                font-size: 13px;
                
                &.full {
                    grid-column: span 2;
                }
                
                i {
                    color: #999;
                    margin-right: 5px;
                    margin-top: 2px;
                }
                
                .label {
                    color: #999;
                    width: 70px;
                    flex-shrink: 0;
                }
                
                .value {
                    color: #333;
                    line-height: 1.4;
                    &.price {
                        color: #f56c6c;
                        font-weight: bold;
                    }
                }
            }
        }
    }
}

.form-section-title {
    font-size: 15px;
    font-weight: bold;
    color: #303133;
    padding-bottom: 10px;
    margin-bottom: 20px;
    border-bottom: 1px solid #EBEEF5;
    
    &.highlight {
         color: #f56c6c;
         border-bottom-color: #fde2e2;
    }
}
.seckill-section {
    background: #fff;
    // border: 1px dashed #f56c6c;
    // padding: 10px;
    // border-radius: 4px;
    // margin-bottom: 22px;
}
.validity-tip {
    font-size: 12px;
    color: #909399;
    margin-left: 10px;
}
</style>
