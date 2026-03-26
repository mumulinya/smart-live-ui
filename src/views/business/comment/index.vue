<template>
  <div class="app-container">
    <el-card class="box-card mb-4" shadow="never">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px" class="search-form">
        <el-form-item label="用户名称" prop="userId">
            <el-select
            v-model="queryParams.userId"
            placeholder="请输入用户名称搜索"
            clearable
            filterable
            remote
            reserve-keyword
            :remote-method="searchUsers"
            :loading="userSearchLoading"
            style="width: 180px"
            @focus="searchUsers('')"
            @change="handleQuery"
            >
            <el-option
                v-for="user in userList"
                :key="user.id"
                :label="user.nickName"
                :value="user.id"
            />
            </el-select>
        </el-form-item>
        <el-form-item label="博客标题" prop="blogId">
            <el-select
            v-model="queryParams.blogId"
            placeholder="请输入博客标题搜索"
            clearable
            filterable
            remote
            reserve-keyword
            :remote-method="searchBlogs"
            :loading="blogSearchLoading"
            style="width: 200px"
            @focus="searchBlogs('')"
            @change="handleQuery"
            >
            <el-option
                v-for="blog in blogOptions"
                :key="blog.id"
                :label="blog.title"
                :value="blog.id"
            />
            </el-select>
        </el-form-item>
        <el-form-item label="来源" prop="sourceType">
            <el-select v-model="queryParams.sourceType" placeholder="请选择来源" clearable style="width: 150px" @change="handleQuery">
            <el-option label="博客" value="3" />
            <el-option label="评论" value="5" />
            <el-option label="评价" value="7" />
            </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 150px" @change="handleQuery">
            <el-option label="正常" value="0" />
            <el-option label="禁用" value="1" />
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
            type="warning"
            plain
            icon="el-icon-download"
            size="mini"
            @click="handleExport"
            v-hasPermi="['comment:comment:export']"
            >导出</el-button>
        </el-col>
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
    </el-card>

    <el-card class="box-card" shadow="never">
        <el-table v-loading="loading" :data="commentList" @selection-change="handleSelectionChange" border stripe :header-cell-style="{background:'#f5f7fa',color:'#606266'}">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="来源信息" min-width="200" show-overflow-tooltip>
             <template slot-scope="scope">
                <div class="source-info">
                   <div class="source-line">
                       <el-tag size="mini" :type="Number(scope.row.sourceType) === 3 ? 'primary' : 'success'" effect="plain" class="type-tag">
                           {{ getSourceTypeText(scope.row.sourceType) }}
                       </el-tag>
                       <span class="source-name">{{ scope.row.sourceName || '--' }}</span>
                   </div>
                   <div class="user-line">
                       <i class="el-icon-user"></i> {{ scope.row.userName || '--' }}
                   </div>
                </div>
            </template>
        </el-table-column>
        <el-table-column label="回复内容" min-width="300" prop="content">
             <template slot-scope="scope">
                 <div class="comment-content-cell" v-html="scope.row.content"></div>
             </template>
        </el-table-column>
        <el-table-column label="点赞数" align="center" prop="liked" width="100">
             <template slot-scope="scope">
                 <span v-if="scope.row.liked > 0" class="liked-count"><i class="el-icon-thumb"></i> {{ scope.row.liked }}</span>
                 <span v-else class="text-muted">-</span>
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
            </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="100" fixed="right">
            <template slot-scope="scope">
            <el-button
                size="mini"
                type="text"
                icon="el-icon-view"
                @click="handleDetail(scope.row)"
                v-hasPermi="['comment:comment:query']"
            >详情</el-button>
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

    <!-- 添加或修改评论对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body custom-class="comment-edit-dialog">
      <el-form ref="form" :model="form" :rules="rules" label-width="80px" class="edit-form">
        <el-form-item label="用户" prop="userId">
          <el-select
            v-model="form.userId"
            placeholder="请输入用户名称搜索"
            style="width: 100%"
            filterable
            remote
            reserve-keyword
            :remote-method="searchUsers"
            :loading="userSearchLoading"
            @focus="searchUsers('')"
          >
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.nickName"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-row>
             <el-col :span="12">
                 <el-form-item label="来源类型" prop="sourceType">
                <el-select v-model="form.sourceType" placeholder="请选择来源类型" style="width: 100%">
                    <el-option label="博客" value="3" />
                    <el-option label="评论" value="5" />
                    <el-option label="评价" value="7" />
                </el-select>
                </el-form-item>
             </el-col>
             <el-col :span="12">
                 <el-form-item label="来源ID" prop="sourceId">
                <el-input v-model="form.sourceId" placeholder="请输入来源ID" />
                </el-form-item>
             </el-col>
        </el-row>
        
        <el-form-item label="回复内容">
          <editor v-model="form.content" :min-height="150"/>
        </el-form-item>
        <el-form-item label="图片" prop="images">
          <image-upload v-model="form.images" :limit="9" :file-size="2" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
             <el-radio label="0">正常</el-radio>
             <el-radio label="1">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 评论详情对话框 -->
    <el-dialog title="评论详情" :visible.sync="detailOpen" width="700px" append-to-body custom-class="comment-detail-dialog">
       <div class="detail-container">
           <div class="user-meta">
               <div class="user-avatar-circle">
                   {{ (detailForm.userName || 'U').charAt(0).toUpperCase() }}
               </div>
               <div class="meta-info">
                   <div class="u-name">{{ detailForm.userName || '未知用户' }}</div>
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
               <span class="label">回复于:</span>
               <el-tag size="mini" :type="Number(detailForm.sourceType) === 3 ? 'primary' : 'success'" effect="plain">
                    {{ getSourceTypeText(detailForm.sourceType) }}
               </el-tag>
               <span class="ref-name">{{ detailForm.sourceName }}</span>
           </div>

           <div class="comment-body">
                <div class="contenter-html" v-html="detailForm.content"></div>
           </div>

           <div class="comment-images" v-if="detailForm.imageList && detailForm.imageList.length > 0">
               <div class="img-label">图片附件</div>
               <div class="img-grid">
                    <el-image
                    v-for="(image, index) in detailForm.imageList"
                    :key="index"
                    :src="image"
                    :preview-src-list="detailForm.imageList"
                    class="c-img"
                    fit="cover"
                    ></el-image>
               </div>
           </div>

           <div class="action-stats">
               <div class="stat"><i class="el-icon-thumb"></i> 点赞 {{ detailForm.liked || 0 }}</div>
           </div>
       </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailOpen = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listComment,
  getComment,
  delComment,
  addComment,
  updateComment
} from "@/api/comment/comment"
import { searchUserOptions } from "@/api/user/user"
import { searchBlogOptions } from "@/api/blog/blog"

export default {
  name: "Comment",
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
      // 评论表格数据
      commentList: [],
      // 用户列表
      userList: [],
      // 博客选项
      blogOptions: [],
      // 远程搜索状态
      userSearchLoading: false,
      blogSearchLoading: false,
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
        blogId: null,
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
        parentId: [
          { required: true, message: "关联的1级评论id不能为空", trigger: "blur" }
        ],
        content: [
          { required: true, message: "回复的内容不能为空", trigger: "blur" }
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
        3: '博客',
        5: '评论',
        7: '评价'
      }
      return typeMap[Number(sourceType)] || '未知'
    },
    readSearchRows(response) {
      if (response && Array.isArray(response.rows)) {
        return response.rows
      }
      if (response && Array.isArray(response.data)) {
        return response.data
      }
      return []
    },
    mergeOption(list, option, keys) {
      if (!option || option.id === null || option.id === undefined || option.id === '') {
        return list
      }
      const exists = list.some(item => String(item.id) === String(option.id))
      if (exists) {
        return list
      }
      return [option].concat(list).slice(0, 20)
    },
    async searchUsers(keyword) {
      this.userSearchLoading = true
      try {
        const response = await searchUserOptions(keyword || '')
        this.userList = this.readSearchRows(response).map(item => ({
          id: item.id,
          nickName: item.nickName || item.userName || item.name || `用户${item.id}`
        }))
      } catch (error) {
        this.userList = []
      } finally {
        this.userSearchLoading = false
      }
    },
    async searchBlogs(keyword) {
      this.blogSearchLoading = true
      try {
        const response = await searchBlogOptions(keyword || '')
        this.blogOptions = this.readSearchRows(response).map(item => ({
          id: item.id,
          title: item.title || item.name || `博客${item.id}`
        }))
      } catch (error) {
        this.blogOptions = []
      } finally {
        this.blogSearchLoading = false
      }
    },
    getStatusText(status) {
      const statusMap = {
        '0': '正常',
        '1': '禁用'
      }
      return statusMap[String(status)] || '未知'
    },
    getStatusType(status) {
      const typeMap = {
        '0': 'success',
        '1': 'danger'
      }
      return typeMap[String(status)] || 'info'
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

    /** 查询评论列表 */
    getList() {
      this.loading = true

      // 构建查询参数
      const queryData = {
        pageNum: this.queryParams.pageNum,
        pageSize: this.queryParams.pageSize,
        userId: this.queryParams.userId,
        blogId: this.queryParams.blogId,
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

      listComment(queryData).then(response => {
        if (response.rows && response.rows.length > 0) {
          this.commentList = (response.rows || []).filter(item => {
            const sourceType = Number(item && item.sourceType)
            return sourceType === 3 || sourceType === 5 || sourceType === 7
          }).map(item => {
            return Object.assign({}, item, {
              userName: item.nickName || item.userName || `用户${item.userId}`,
              sourceName: item.sourceName || `${this.getSourceTypeText(item.sourceType)}${item.sourceId || ''}`
            })
          })
          this.total = response.total
          this.loading = false
        } else {
          this.commentList = []
          this.total = 0
          this.loading = false
        }
      }).catch(error => {
        console.error('获取评论列表失败:', error)
        this.loading = false
      })
    },

    /** 查看详情按钮操作 */
    handleDetail(row) {
      this.detailForm = {
        ...row
      }
      this.detailForm.imageList = this.detailForm.images ?
          this.detailForm.images.split(',').map(img => img.trim()).filter(img => img).map(img => img.startsWith('http') ? img : process.env.VUE_APP_BASE_API + img) : []
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
        sourceType: null,
        sourceId: null,
        parentId: null,
        answerId: null,
        content: null,
        images: null,
        liked: null,
        status: null,
        createTime: null,
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
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        userId: null,
        blogId: null,
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
      this.title = "添加评论"
    },

    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getComment(id).then(response => {
        this.form = response.data
        this.userList = this.mergeOption(this.userList, {
          id: this.form.userId,
          nickName: this.form.nickName || this.form.userName || `用户${this.form.userId}`
        })
        this.open = true
        this.title = "修改评论"
      })
    },

    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateComment(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addComment(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除评论编号为"' + ids + '"的数据项？').then(function() {
        return delComment(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },

    /** 导出按钮操作 */
    handleExport() {
      this.download('comment/comment/export', {
        ...this.queryParams
      }, `comment_${new Date().getTime()}.xlsx`)
    }
  }
}
</script>

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

.comment-content-cell {
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

.comment-body {
    margin-bottom: 25px;
    .contenter-html {
        font-size: 14px;
        color: #303133;
        line-height: 1.6;
    }
}

.comment-images {
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


