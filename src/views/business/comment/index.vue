<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="用户名称" prop="userId">
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
            :label="user.nickName"
            :value="user.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="来源" prop="sourceType">
        <el-select v-model="queryParams.sourceType" placeholder="请选择来源" clearable>
          <el-option label="博客" value="1" />
          <el-option label="店铺" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
          <el-option label="正常" value="0" />
          <el-option label="禁用" value="1" />
        </el-select>
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
          v-hasPermi="['comment:comment:add']"
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
          v-hasPermi="['comment:comment:edit']"
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
          v-hasPermi="['comment:comment:remove']"
        >删除</el-button>
      </el-col>
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

    <el-table v-loading="loading" :data="commentList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="用户名称" align="center" prop="userName">
        <template slot-scope="scope">
          <span>{{ scope.row.userName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="来源" align="center" prop="sourceType">
        <template slot-scope="scope">
          <el-tag :type="scope.row.sourceType === '1' ? 'primary' : 'success'">
            {{ getSourceTypeText(scope.row.sourceType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="名称" align="center" prop="sourceName">
        <template slot-scope="scope">
          <span>{{ scope.row.sourceName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="回复内容" align="center" prop="content" :show-overflow-tooltip="true" />
      <el-table-column label="点赞数" align="center" prop="liked" />
      <el-table-column label="状态" align="center" prop="status">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'danger'">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleDetail(scope.row)"
            v-hasPermi="['comment:comment:query']"
          >查看详情</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['comment:comment:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['comment:comment:remove']"
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

    <!-- 添加或修改评论对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户" prop="userId">
          <el-select v-model="form.userId" placeholder="请选择用户" style="width: 100%">
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.nickName"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="来源类型" prop="sourceType">
          <el-select v-model="form.sourceType" placeholder="请选择来源类型">
            <el-option label="博客" value="1" />
            <el-option label="店铺" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源ID" prop="sourceId">
          <el-input v-model="form.sourceId" placeholder="请输入来源ID" />
        </el-form-item>
        <el-form-item label="回复内容">
          <editor v-model="form.content" :min-height="192"/>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="正常" value="0" />
            <el-option label="禁用" value="1" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 评论详情对话框 -->
    <el-dialog title="评论详情" :visible.sync="detailOpen" width="600px" append-to-body>
      <el-form ref="detailForm" :model="detailForm" label-width="100px">
        <el-form-item label="用户名称:">
          <span>{{ detailForm.userName }}</span>
        </el-form-item>
        <el-form-item label="来源类型:">
          <el-tag :type="detailForm.sourceType === '1' ? 'primary' : 'success'">
            {{ getSourceTypeText(detailForm.sourceType) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="所属对象:">
          <span>{{ detailForm.sourceName }}</span>
        </el-form-item>
        <el-form-item label="回复内容:">
          <div v-html="detailForm.content" style="border: 1px solid #e6e6e6; padding: 10px; border-radius: 4px; min-height: 60px;"></div>
        </el-form-item>
        <el-form-item label="评论图片:" v-if="detailForm.images && detailForm.images.length > 0">
          <div class="image-preview">
            <el-image
              v-for="(image, index) in detailForm.images.split(',')"
              :key="index"
              :src="image"
              :preview-src-list="detailForm.images.split(',')"
              style="width: 100px; height: 100px; margin-right: 10px; margin-bottom: 10px;"
              fit="cover"
            ></el-image>
          </div>
        </el-form-item>
        <el-form-item label="点赞数:">
          <span>{{ detailForm.liked }}</span>
        </el-form-item>
        <el-form-item label="状态:">
          <el-tag :type="detailForm.status === '0' ? 'success' : 'danger'">
            {{ getStatusText(detailForm.status) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="创建时间:">
          <span>{{ detailForm.createTime }}</span>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailOpen = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listComment, getComment, delComment, addComment, updateComment } from "@/api/comment/comment"
import { listUser } from "@/api/user/user"
import { listBlog } from "@/api/blog/blog"
import { listShop } from "@/api/shop/shop"

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
      // 博客列表
      blogList: [],
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
    // 先加载用户列表，再加载评论列表
    this.loadUserList()
  },
  methods: {
    /** 加载用户列表 */
    async loadUserList() {
      try {
        const response = await listUser()
        this.userList = response.rows || []
        // 用户列表加载完成后，再加载评论列表
        this.getList()
      } catch (error) {
        console.error('加载用户列表失败:', error)
        this.userList = []
        this.loading = false
      }
    },

    /** 获取来源类型文本 */
    getSourceTypeText(sourceType) {
      const typeMap = {
        '1': '博客',
        '2': '店铺'
      }
      return typeMap[sourceType] || '未知'
    },

    /** 获取状态文本 */
    getStatusText(status) {
      const statusMap = {
        '0': '正常',
        '1': '禁用'
      }
      return statusMap[status] || '未知'
    },

    /** 查询评论列表 */
    getList() {
      this.loading = true

      // 构建查询参数
      const queryData = {
        pageNum: this.queryParams.pageNum,
        pageSize: this.queryParams.pageSize,
        userId: this.queryParams.userId,
        sourceType: this.queryParams.sourceType,
        status: this.queryParams.status
      }

      // 移除空值参数
      Object.keys(queryData).forEach(key => {
        if (queryData[key] === null || queryData[key] === '' || queryData[key] === undefined) {
          delete queryData[key]
        }
      })

      listComment(queryData).then(response => {
        if (response.rows && response.rows.length > 0) {
          // 先设置评论列表基础数据
          this.commentList = response.rows
          this.total = response.total

          // 然后加载关联数据并更新显示
          this.loadRelatedData()
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

    /** 加载关联数据并更新显示 */
    async loadRelatedData() {
      try {
        // 并行加载博客和店铺列表
        const [blogsResponse, shopsResponse] = await Promise.all([
          listBlog(),
          listShop()
        ])

        this.blogList = blogsResponse.rows || []
        this.shopList = shopsResponse.rows || []

        // 更新评论列表的显示数据
        this.commentList = this.commentList.map(item => {
          // 设置用户名称
          const user = this.userList.find(user => user.id == item.userId)
          item.userName = user ? user.nickName : `用户${item.userId}`

          // 设置来源名称 - 严格按照你的逻辑
          if (item.sourceType == '1') {
            // 博客评论 - 从博客列表查询
            const blog = this.blogList.find(blog => blog.id == item.sourceId)
            item.sourceName = blog ? blog.title : `博客${item.sourceId}`
          } else if (item.sourceType == '2') {
            // 店铺评论 - 从店铺列表查询
            const shop = this.shopList.find(shop => shop.id == item.sourceId)
            item.sourceName = shop ? shop.name : `店铺${item.sourceId}`
          } else {
            item.sourceName = `未知类型${item.sourceId}`
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
        sourceType: null,
        status: null,
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

<style scoped>
.image-preview {
  display: flex;
  flex-wrap: wrap;
}
</style>
