<template>
  <div class="app-container">
    <el-card class="box-card mb-4" shadow="never">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px" class="search-form">
        <el-form-item label="用户ID" prop="userId">
            <el-input
            v-model="queryParams.userId"
            placeholder="请输入用户ID"
            clearable
            style="width: 180px"
            @keyup.enter.native="handleQuery"
            />
        </el-form-item>
        <el-form-item label="来源" prop="sourceType">
            <el-select v-model="queryParams.sourceType" placeholder="请选择来源" clearable style="width: 150px" @change="handleQuery">
            <el-option label="商品" value="4" />
            <el-option label="店铺" value="2" />
            </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 150px" @change="handleQuery">
            <el-option label="草稿" :value="0" />
            <el-option label="已发布" :value="1" />
            <el-option label="已下架" :value="2" />
            </el-select>
        </el-form-item>
        <el-form-item label="审核状态" prop="auditStatus">
            <el-select v-model="queryParams.auditStatus" placeholder="请选择审核状态" clearable style="width: 170px" @change="handleQuery">
            <el-option label="未审核" :value="0" />
            <el-option label="审核通过" :value="1" />
            <el-option label="人工审核驳回" :value="2" />
            <el-option label="自动审核驳回" :value="3" />
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
            v-hasPermi="['review:review:add']"
            >新增评价</el-button>
        </el-col>
        <el-col :span="1.5">
            <el-button
            type="success"
            plain
            icon="el-icon-edit"
            size="mini"
            :disabled="single"
            @click="handleUpdate"
            v-hasPermi="['review:review:edit']"
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
            v-hasPermi="['review:review:remove']"
            >删除</el-button>
        </el-col>
        <el-col :span="1.5">
            <el-button
            type="warning"
            plain
            icon="el-icon-download"
            size="mini"
            @click="handleExport"
            v-hasPermi="['review:review:export']"
            >导出</el-button>
        </el-col>
        <el-col :span="1.5">
            <el-button
            type="primary"
            plain
            icon="el-icon-magic-stick"
            size="mini"
            @click="handleAiCreate"
            >AI生成</el-button>
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
        <el-table v-loading="loading" :data="reviewList" @selection-change="handleSelectionChange" border stripe :header-cell-style="{background:'#f5f7fa',color:'#606266'}">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="来源信息" min-width="200" show-overflow-tooltip>
             <template slot-scope="scope">
                <div class="source-info">
                   <div class="source-line">
                       <el-tag size="mini" :type="Number(scope.row.sourceType) === 4 ? 'primary' : 'success'" effect="plain" class="type-tag">
                           {{ getSourceTypeText(scope.row.sourceType) }}
                       </el-tag>
                       <span class="source-name">{{ scope.row.sourceName || '--' }}</span>
                   </div>
                   <div class="user-line">
                       <i class="el-icon-user"></i> {{ scope.row.nickName || scope.row.userName || '--' }}
                   </div>
                </div>
            </template>
        </el-table-column>
        <el-table-column label="评价内容" min-width="300" prop="content">
             <template slot-scope="scope">
                 <div class="review-content-cell" v-html="scope.row.content"></div>
             </template>
        </el-table-column>
        <el-table-column label="评分" align="center" width="220" show-overflow-tooltip>
             <template slot-scope="scope">
                 <div>总体评分: <el-rate v-model="scope.row.score" disabled show-score text-color="#ff9900"></el-rate></div>
                 <div v-if="scope.row.serviceScore">服务评分: <el-rate v-model="scope.row.serviceScore" disabled></el-rate></div>
                 <div v-if="scope.row.tasteScore">口味评分: <el-rate v-model="scope.row.tasteScore" disabled></el-rate></div>
                 <div v-if="scope.row.envScore">环境评分: <el-rate v-model="scope.row.envScore" disabled></el-rate></div>
             </template>
        </el-table-column>
        <el-table-column label="点赞数" align="center" prop="liked" width="80">
             <template slot-scope="scope">
                 <span v-if="scope.row.liked > 0" class="liked-count"><i class="el-icon-thumb"></i> {{ scope.row.liked }}</span>
                 <span v-else class="text-muted">-</span>
             </template>
        </el-table-column>
        <el-table-column label="其他数" align="center" width="80">
            <template slot-scope="scope">
                <div v-if="scope.row.replyCount > 0" class="text-muted">回复: {{ scope.row.replyCount }}</div>
                <div v-if="scope.row.stared > 0" class="text-muted">收藏: {{ scope.row.stared }}</div>
                <span v-if="scope.row.replyCount === 0 && scope.row.stared === 0" class="text-muted">-</span>
            </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" width="100">
            <template slot-scope="scope">
             <el-tag effect="dark" size="small" :type="getStatusType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
            </el-tag>
            </template>
        </el-table-column>
        <el-table-column label="审核状态" align="center" prop="auditStatus" width="140">
            <template slot-scope="scope">
             <el-tag effect="dark" size="small" :type="getAuditStatusType(scope.row.auditStatus)">
                {{ getAuditStatusText(scope.row.auditStatus) }}
            </el-tag>
            <div v-if="isRejectedAuditStatus(scope.row.auditStatus) && scope.row.rejectReason" style="font-size: 12px; color: #f56c6c; margin-top: 5px;">
                拒绝原因: {{ scope.row.rejectReason }}
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
                v-hasPermi="['review:review:query']"
            >详情</el-button>
            <el-button
                size="mini"
                type="text"
                icon="el-icon-edit"
                @click="handleUpdate(scope.row)"
                v-hasPermi="['review:review:edit']"
            >修改</el-button>
            <el-button
                size="mini"
                type="text"
                icon="el-icon-delete"
                class="text-danger"
                @click="handleDelete(scope.row)"
                v-hasPermi="['review:review:remove']"
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

    <!-- 添加或修改评价对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body custom-class="review-edit-dialog">
        <el-form ref="form" :model="form" :rules="rules" label-width="80px" class="edit-form">
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="form.userId" placeholder="请输入用户ID" />
        </el-form-item>
        <el-row>
             <el-col :span="12">
                 <el-form-item label="来源类型" prop="sourceType">
                <el-select v-model="form.sourceType" placeholder="请选择来源类型" style="width: 100%">
                    <el-option label="商品" :value="4" />
                    <el-option label="店铺" :value="2" />
                </el-select>
                </el-form-item>
             </el-col>
             <el-col :span="12">
                 <el-form-item label="来源ID" prop="sourceId">
                <el-input v-model="form.sourceId" placeholder="请输入来源ID" />
                </el-form-item>
             </el-col>
        </el-row>
        
        <el-form-item label="评价内容">
          <editor v-model="form.content" :min-height="150"/>
        </el-form-item>
        
        <el-row>
             <el-col :span="12">
                 <el-form-item label="店铺ID" prop="shopId">
                <el-input v-model="form.shopId" placeholder="请输入店铺ID" />
                </el-form-item>
             </el-col>
             <el-col :span="12">
                 <el-form-item label="订单ID" prop="orderId">
                <el-input v-model="form.orderId" placeholder="请输入订单ID" />
                </el-form-item>
             </el-col>
        </el-row>
        
        <el-row>
             <el-col :span="12">
                 <el-form-item label="总体评分" prop="score">
                     <el-rate v-model="form.score" style="margin-top: 10px;"></el-rate>
                 </el-form-item>
             </el-col>
             <el-col :span="12">
                 <el-form-item label="是否匿名" prop="isAnonymous">
                    <el-switch v-model="form.isAnonymous" active-text="是" inactive-text="否"></el-switch>
                 </el-form-item>
             </el-col>
        </el-row>
        
        <el-form-item v-if="Number(form.sourceType) === 2 || Number(form.sourceType) === 4" label="服务评分" prop="serviceScore">
            <el-rate v-model="form.serviceScore" style="margin-top: 10px;"></el-rate>
        </el-form-item>
        
        <el-row v-if="Number(form.sourceType) === 2 || Number(form.sourceType) === 4">
             <el-col :span="12">
                 <el-form-item label="口味评分" prop="tasteScore">
                     <el-rate v-model="form.tasteScore" style="margin-top: 10px;"></el-rate>
                 </el-form-item>
             </el-col>
             <el-col :span="12">
                 <el-form-item label="环境评分" prop="envScore">
                     <el-rate v-model="form.envScore" style="margin-top: 10px;"></el-rate>
                 </el-form-item>
             </el-col>
        </el-row>
        
        <el-form-item label="图片链接" prop="images">
            <image-upload v-model="form.images" :limit="9" :file-size="2" />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
             <el-radio :label="0">草稿</el-radio>
             <el-radio :label="1">已发布</el-radio>
             <el-radio :label="2">已下架</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item v-if="form.status !== 0" label="拒绝原因" prop="rejectReason">
            <el-input type="textarea" v-model="form.rejectReason" placeholder="请输入拒绝原因" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 评价详情对话框 -->
    <el-dialog title="评价详情" :visible.sync="detailOpen" width="700px" append-to-body custom-class="review-detail-dialog">
       <div class="detail-container">
           <div class="user-meta">
               <div class="user-avatar-circle">
                   {{ (detailForm.nickName || detailForm.userName || 'U').charAt(0).toUpperCase() }}
               </div>
               <div class="meta-info">
                   <div class="u-name">{{ detailForm.nickName || detailForm.userName || '未知用户' }} <el-tag v-if="detailForm.isAnonymous" size="mini" type="info">匿名</el-tag></div>
                   <div class="c-time">{{ detailForm.createTime }}</div>
               </div>
               <div class="status-badge">
                   <el-tag :type="getStatusType(detailForm.status)">
                    {{ getStatusText(detailForm.status) }}
                   </el-tag>
                   <el-tag style="margin-left: 8px;" :type="getAuditStatusType(detailForm.auditStatus)">
                    {{ getAuditStatusText(detailForm.auditStatus) }}
                   </el-tag>
               </div>
           </div>
           
           <div class="source-ref">
               <span class="label">评价于:</span>
               <el-tag size="mini" :type="Number(detailForm.sourceType) === 4 ? 'primary' : 'success'" effect="plain">
                    {{ getSourceTypeText(detailForm.sourceType) }}
               </el-tag>
               <span class="ref-name">{{ detailForm.sourceName }}</span>
           </div>

           <div class="review-body">
                <div class="contenter-html" v-html="detailForm.content"></div>
           </div>

           <div class="review-scores" style="margin-bottom: 25px;">
               <div class="score-grid" style="display: flex; flex-wrap: wrap; gap: 20px;">
                   <div>总体评分 <el-rate v-model="detailForm.score" disabled></el-rate></div>
                   <div v-if="detailForm.serviceScore">服务评分 <el-rate v-model="detailForm.serviceScore" disabled></el-rate></div>
                   <div v-if="detailForm.tasteScore">口味评分 <el-rate v-model="detailForm.tasteScore" disabled></el-rate></div>
                   <div v-if="detailForm.envScore">环境评分 <el-rate v-model="detailForm.envScore" disabled></el-rate></div>
               </div>
           </div>

           <div class="review-images" v-if="detailForm.images && detailForm.images.length > 0">
               <div class="img-label">图片附件</div>
               <div class="img-grid">
                    <el-image
                    v-for="(image, index) in detailForm.images.split(',').filter(item => item)"
                    :key="index"
                    :src="image"
                    :preview-src-list="detailForm.images.split(',').filter(item => item)"
                    class="c-img"
                    fit="cover"
                    ></el-image>
               </div>
           </div>

           <div class="action-stats">
               <div class="stat"><i class="el-icon-thumb"></i> 点赞 {{ detailForm.liked || 0 }}</div>
               <div class="stat" style="margin-left: 15px;"><i class="el-icon-chat-dot-round"></i> 回复 {{ detailForm.replyCount || 0 }}</div>
               <div class="stat" style="margin-left: 15px;"><i class="el-icon-star-off"></i> 收藏 {{ detailForm.stared || 0 }}</div>
           </div>
           
           <div class="reject-reason" v-if="isRejectedAuditStatus(detailForm.auditStatus) && detailForm.rejectReason" style="margin-top: 15px; padding: 10px; background-color: #fef0f0; border-radius: 4px; color: #f56c6c;">
                <strong>拒绝原因：</strong>{{ detailForm.rejectReason }}
           </div>
       </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailOpen = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listReview, getReview, delReview, addReview, updateReview, aiCreateReview, publishReview, publishAllReview } from "@/api/review/review"
import { shopList } from "@/api/shop/shop"
import { listProduct, getProduct } from "@/api/product"

export default {
  name: "Review",
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
      // 评价表格数据
      reviewList: [],
      // 商品列表
      productList: [],
      // 店铺列表
      shopList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 是否显示详情弹出层
      detailOpen: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userId: null,
        sourceType: null,
        status: null,
        auditStatus: null,
      },
      // 表单参数
      form: {},
      // 详情表单参数
      detailForm: {},
      // 表单校验
      rules: {
        userId: [
          { required: true, message: "用户id不能为空", trigger: "blur" }
        ],
        sourceType: [
          { required: true, message: "来源类型不能为空", trigger: "change" }
        ],
        sourceId: [
          { required: true, message: "来源id不能为空", trigger: "blur" }
        ],
        content: [
          { required: true, message: "回复的内容不能为空", trigger: "blur" }
        ],
        score: [
          { required: true, message: "评分不能为空", trigger: "change" }
        ],
        status: [
          { required: true, message: "状态不能为空", trigger: "change" }
        ]
      }
    }
  },
  created() {
    this.getList()
  },
  methods: {
    /** 获取来源类型文本 */
    getSourceTypeText(sourceType) {
      const typeMap = {
        4: '商品',
        2: '店铺'
      }
      return typeMap[Number(sourceType)] || '未知'
    },

    getStatusText(status) {
      const statusMap = {
        0: '草稿',
        1: '已发布',
        2: '已下架'
      }
      return statusMap[Number(status)] || '未知'
    },
    getStatusType(status) {
      const typeMap = {
        0: 'info',
        1: 'success',
        2: 'warning'
      }
      return typeMap[Number(status)] || 'info'
    },

    getAuditStatusText(status) {
      const statusMap = {
        0: '未审核',
        1: '审核通过',
        2: '人工审核驳回',
        3: '自动审核驳回'
      }
      return statusMap[Number(status)] || '-'
    },
    getAuditStatusType(status) {
      const typeMap = {
        0: 'warning',
        1: 'success',
        2: 'danger',
        3: 'info'
      }
      return typeMap[Number(status)] || 'info'
    },
    isRejectedAuditStatus(status) {
      const code = Number(status)
      return code === 2 || code === 3
    },

    /** 查询评价列表 */
    getList() {
      this.loading = true

      // 构建查询参数
      const queryData = {
        pageNum: this.queryParams.pageNum,
        pageSize: this.queryParams.pageSize,
        userId: this.queryParams.userId,
        sourceType: this.queryParams.sourceType,
        status: this.queryParams.status,
        auditStatus: this.queryParams.auditStatus
      }

      // 移除空值参数
      Object.keys(queryData).forEach(key => {
        if (queryData[key] === null || queryData[key] === '' || queryData[key] === undefined) {
          delete queryData[key]
        }
      })

      listReview(queryData).then(response => {
        if (response.rows && response.rows.length > 0) {
          // 先设置评价列表基础数据
          this.reviewList = response.rows
          this.total = response.total

          // 然后加载关联数据并更新显示
          this.loadRelatedData()
        } else {
          this.reviewList = []
          this.total = 0
          this.loading = false
        }
      }).catch(error => {
        console.error('获取评价列表失败:', error)
        this.loading = false
      })
    },

    /** 加载关联数据并更新显示 */
    async loadRelatedData() {
      try {
        const [productsResponse, shopsResponse] = await Promise.all([
          listProduct({ pageNum: 1, pageSize: 2000 }),
          shopList()
        ])

        this.productList = productsResponse.rows || []
        this.shopList = shopsResponse.data || []

        const productMap = new Map(this.productList.map(product => [String(product.id), product]))
        const shopMap = new Map(this.shopList.map(shop => [String(shop.id), shop]))

        const missingProductIds = [...new Set(
          this.reviewList
                        .filter(item => Number(item.sourceType) !== 2)
            .map(item => String(item.sourceId || ""))
            .filter(id => id && !productMap.has(id))
        )]

        if (missingProductIds.length > 0) {
          const missingProducts = await Promise.all(
            missingProductIds.map(id => getProduct(id).then(res => res.data).catch(() => null))
          )
          missingProducts.filter(Boolean).forEach(product => {
            if (product && product.id != null) {
              productMap.set(String(product.id), product)
            }
          })
        }

        this.reviewList = this.reviewList.map(item => {
          const sourceId = String(item.sourceId || "")
          const sourceType = Number(item.sourceType)
          const product = productMap.get(sourceId)
          const shop = shopMap.get(sourceId)
          item.userName = item.nickName || item.userName || `用户${item.userId}`

          if (sourceType === 4 || (product && !shop)) {
            const productName = product && (product.name || product.title || product.productName)
            item.sourceType = 4
            item.sourceName = productName || item.sourceName || `商品${item.sourceId}`
          } else if (sourceType === 2 || shop) {
            item.sourceType = 2
            item.sourceName = (shop && shop.name) || item.sourceName || `店铺${item.sourceId}`
          } else {
            item.sourceName = item.sourceName || `未知类型${item.sourceId}`
          }

          return item
        })

        this.loading = false
      } catch (error) {
        console.error('加载关联数据失败:', error)
        this.loading = false
      }
    },
    /** 查看详情按钮操作 */
    handleDetail(row) {
      this.detailForm = {
        ...row
      }
      this.detailOpen = true
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
        shopId: null,
        orderId: null,
        sourceType: null,
        sourceId: null,
        content: null,
        images: null,
        liked: 0,
        replyCount: 0,
        stared: 0,
        status: 0,
        score: null,
        serviceScore: null,
        tasteScore: null,
        envScore: null,
        isAnonymous: false,
        rejectReason: null,
        createTime: null
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
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        userId: null,
        sourceType: null,
        status: null,
        auditStatus: null,
      }
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
      this.title = "添加评价"
    },

    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getReview(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改评价"
      })
    },

    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateReview(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addReview(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除评价编号为"' + ids + '"的数据项？').then(function() {
        return delReview(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },

    /** 导出按钮操作 */
    handleExport() {
      this.download('review/review/export', {
        ...this.queryParams
      }, `review_${new Date().getTime()}.xlsx`)
    },
    handleAiCreate(){
      aiCreateReview().then(response => {
        this.$modal.msgSuccess("创建成功")
        this.getList()
      })
    },
    /** 全量发布 */
    handleAllPublish(){
      publishAllReview().then(response => {
        response.msg && this.$modal.msgSuccess(response.msg)
      }).catch(() => {
      })
    },
    /** 发布选中 */
    handlePublish(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认发布评价？').then(function() {
        return publishReview(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("发布成功")
      }).catch(() => {})
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
.text-muted { color: #c0c4cc; }

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

/* 列表样式优化 */
.source-info {
    .source-line {
        display: flex;
        align-items: center;
        margin-bottom: 4px;
        .type-tag { margin-right: 6px; }
        .source-name { font-size: 13px; color: #303133; font-weight: 500; }
    }
    .user-line {
        font-size: 12px;
        color: #909399;
        i { margin-right: 4px; }
    }
}

.review-content-cell {
    font-size: 13px;
    color: #606266;
    line-height: 1.5;
    max-height: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
}

.liked-count {
    color: #f56c6c;
    font-weight: bold;
    i { margin-right: 3px; }
}

/* 详情弹窗优化 */
.detail-container {
    padding: 10px;
}

.user-meta {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    .user-avatar-circle {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #409EFF;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: bold;
        margin-right: 15px;
    }
    .meta-info {
        flex: 1;
        .u-name { font-size: 16px; font-weight: bold; color: #303133; margin-bottom: 4px; }
        .c-time { font-size: 12px; color: #909399; }
    }
}

.source-ref {
    background: #f4f4f5;
    padding: 10px 15px;
    border-radius: 4px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    .label { font-size: 13px; color: #909399; margin-right: 10px; }
    .ref-name { font-size: 14px; font-weight: 500; color: #303133; margin-left: 8px; }
}

.review-body {
    margin-bottom: 25px;
    .contenter-html {
        font-size: 14px;
        color: #303133;
        line-height: 1.6;
    }
}

.review-images {
    margin-bottom: 25px;
    .img-label { font-size: 13px; color: #909399; margin-bottom: 10px; }
    .img-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        .c-img {
            width: 100px;
            height: 100px;
            border-radius: 6px;
            cursor: pointer;
        }
    }
}

.action-stats {
    padding-top: 15px;
    border-top: 1px solid #ebeef5;
    .stat {
        display: inline-flex;
        align-items: center;
        color: #909399;
        font-size: 13px;
        i { margin-right: 5px; font-size: 16px; }
    }
}
</style>
