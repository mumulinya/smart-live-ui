<template>
  <div class="app-container">
    <el-card class="box-card mb-4" shadow="never">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px" class="search-form">
        <el-form-item label="店铺类型" prop="typeId">
            <el-select
            v-model="queryParams.typeId"
            placeholder="请选择店铺类型"
            clearable
            style="width: 180px"
            @change="handleQuery"
            >
            <el-option
                v-for="type in shopTypeList"
                :key="type.id"
                :label="type.name"
                :value="type.id"
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
        <el-form-item label="用户" prop="userId">
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
                :label="user.nickName"
                :value="user.id"
            />
            </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
            <el-input
            v-model="queryParams.title"
            placeholder="请输入标题"
            clearable
            @keyup.enter.native="handleQuery"
            style="width: 200px"
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
            v-hasPermi="['blog:blog:add']"
            >新增笔记</el-button>
        </el-col>
        <el-col :span="1.5">
            <el-button
            type="success"
            plain
            icon="el-icon-edit"
            size="mini"
            :disabled="single"
            @click="handleUpdate"
            v-hasPermi="['blog:blog:edit']"
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
            v-hasPermi="['blog:blog:remove']"
            >删除</el-button>
        </el-col>
        <el-col :span="1.5">
            <el-button
            type="warning"
            plain
            icon="el-icon-download"
            size="mini"
            @click="handleExport"
            v-hasPermi="['blog:blog:export']"
            >导出</el-button>
        </el-col>
          <div class="right-actions">
            <!-- 假设这些按钮是需要的，保留但优化样式 -->
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
        <el-table v-loading="loading" :data="blogList" @selection-change="handleSelectionChange" border stripe :header-cell-style="{background:'#f5f7fa',color:'#606266'}">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="笔记ID" align="center" prop="id" width="80" />
        <el-table-column label="来源信息" min-width="200" show-overflow-tooltip>
             <template slot-scope="scope">
                <div class="source-info">
                   <div class="shop-line">
                       <el-tag size="mini" effect="plain" type="info" class="type-tag">{{ getShopTypeName(scope.row.typeId) }}</el-tag>
                       <span class="shop-name"><i class="el-icon-shop"></i> {{ getShopName(scope.row.shopId) }}</span>
                   </div>
                   <div class="user-line">
                       <i class="el-icon-user"></i> {{ getUserName(scope.row.userId) }}
                   </div>
                </div>
            </template>
        </el-table-column>
        <el-table-column label="标题" min-width="200" prop="title" show-overflow-tooltip>
             <template slot-scope="scope">
                 <span style="font-weight: 500;">{{ scope.row.title }}</span>
             </template>
        </el-table-column>
        <el-table-column label="互动数据" align="center" width="180">
             <template slot-scope="scope">
                 <div class="interaction-stats">
                     <div class="stat-item like">
                         <i class="el-icon-thumb"></i> {{ scope.row.liked || 0 }}
                     </div>
                     <div class="stat-item comment">
                         <i class="el-icon-chat-line-round"></i> {{ scope.row.comments || 0 }}
                     </div>
                 </div>
            </template>
        </el-table-column>
        
        <el-table-column label="创建时间" align="center" prop="createTime" width="160">
            <template slot-scope="scope">
            <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
            </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="200" fixed="right">
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
                v-hasPermi="['blog:blog:edit']"
            >修改</el-button>
            <el-button
                size="mini"
                type="text"
                icon="el-icon-delete"
                class="text-danger"
                @click="handleDelete(scope.row)"
                v-hasPermi="['blog:blog:remove']"
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

    <!-- 添加或修改博客对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="800px" append-to-body custom-class="note-edit-dialog">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px" class="edit-form">
        <el-row>
             <el-col :span="12">
                 <el-form-item label="店铺类型" prop="typeId">
                <el-select
                    v-model="form.typeId"
                    placeholder="请选择店铺类型"
                    style="width: 100%"
                    @change="handleTypeChange"
                >
                    <el-option
                    v-for="type in shopTypeList"
                    :key="type.id"
                    :label="type.name"
                    :value="type.id"
                    />
                </el-select>
                </el-form-item>
             </el-col>
             <el-col :span="12">
                  <el-form-item label="关联店铺" prop="shopId">
                <el-select
                    v-model="form.shopId"
                    placeholder="请选择店铺"
                    style="width: 100%"
                    :disabled="!form.typeId"
                >
                    <el-option
                    v-for="shop in filteredShopList"
                    :key="shop.id"
                    :label="shop.name"
                    :value="shop.id"
                    />
                </el-select>
                </el-form-item>
             </el-col>
        </el-row>
        
        <el-form-item label="发布用户" prop="userId">
          <el-select v-model="form.userId" placeholder="请选择用户" style="width: 100%" filterable>
            <el-option
              v-for="user in userList"
              :key="user.userId"
              :label="user.nickName"
              :value="user.userId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="笔记标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入引人注目的标题" />
        </el-form-item>

        <!-- 图片上传部分 -->
        <el-form-item label="探店照片" prop="images">
          <div class="upload-container">
            <el-upload
              action="#"
              list-type="picture-card"
              :file-list="fileList"
              :before-upload="beforeUpload"
              :on-remove="handleRemove"
              :on-change="handleChange"
              :auto-upload="false"
              multiple
              :limit="9"
              :on-exceed="handleExceed"
              class="visual-upload"
            >
              <i class="el-icon-plus"></i>
              <div class="upload-text" slot="default">点击或拖拽上传</div>
            </el-upload>
            <div class="tips">
              <i class="el-icon-info"></i> 最多9张，JPG/PNG格式，单张&lt;2MB
            </div>
          </div>
        </el-form-item>

        <el-form-item label="详细内容" prop="content">
          <editor v-model="form.content" :min-height="300"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 博客详情对话框 -->
    <el-dialog :title="detailForm.title" :visible.sync="detailOpen" width="900px" append-to-body custom-class="note-detail-dialog">
        <div class="detail-container">
             <div class="detail-meta-bar">
                 <div class="meta-left">
                     <span class="meta-tag shop-type">{{ getShopTypeName(detailForm.typeId) }}</span>
                     <span class="meta-text shop"><i class="el-icon-shop"></i> {{ getShopName(detailForm.shopId) }}</span>
                 </div>
                 <div class="meta-right">
                      <span class="meta-text user"><i class="el-icon-user"></i> {{ getUserName(detailForm.userId) }}</span>
                      <span class="meta-text time">{{ parseTime(detailForm.createTime) }}</span>
                 </div>
             </div>

             <div class="detail-stats-row">
                 <div class="stat-box">
                     <div class="label">点赞</div>
                     <div class="val like">{{ detailForm.liked || 0 }}</div>
                 </div>
                 <div class="stat-box">
                     <div class="label">评论</div>
                     <div class="val comment">{{ detailForm.comments || 0 }}</div>
                 </div>
             </div>

             <div class="detail-gallery" v-if="detailForm.imageList && detailForm.imageList.length > 0">
                <div class="gallery-title">相册 ({{ detailForm.imageList.length }})</div>
                <div class="gallery-grid">
                    <el-image
                    v-for="(img, index) in detailForm.imageList"
                    :key="index"
                    :src="img"
                    fit="cover"
                    class="gallery-item"
                    :preview-src-list="detailForm.imageList"
                    >
                    </el-image>
                </div>
             </div>

             <div class="detail-content">
                 <div class="content-title">内容详情</div>
                 <div class="content-body" v-html="detailForm.content"></div>
             </div>
        </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="detailOpen = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listBlog, getBlog, delBlog, addBlog, updateBlog,publish,allPublish } from "@/api/blog/blog"
import { listUser,userList } from "@/api/user/user"
import { listShop,  shopList} from "@/api/shop/shop"
import { shopTypeList } from "@/api/shop/shop"

export default {
  name: "Blog",
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
      // 博客表格数据
      blogList: [],
      // 用户列表
      userList: [],
      // 店铺列表
      shopList: [],
      // 店铺类型列表
      shopTypeList: [],
      // 过滤后的店铺列表（根据类型筛选）
      filteredShopList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 详情弹出层
      detailOpen: false,
      // 上传文件列表
      fileList: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        typeId: null,
        shopId: null,
        userId: null,
        title: null,
      },
      // 表单参数
      form: {
        id: null,
        typeId: null,
        shopId: null,
        userId: null,
        title: null,
        images: null,
        content: null,
        liked: null,
        comments: null,
        createTime: null,
        updateTime: null
      },
      // 详情表单
      detailForm: {},
      // 表单校验
      rules: {
        typeId: [
          { required: true, message: "请选择店铺类型", trigger: "change" }
        ],
        shopId: [
          { required: true, message: "请选择店铺", trigger: "change" }
        ],
        userId: [
          { required: true, message: "请选择用户", trigger: "change" }
        ],
        title: [
          { required: true, message: "标题不能为空", trigger: "blur" }
        ],
        images: [
          { required: true, message: "探店照片不能为空", trigger: "blur" }
        ],
        content: [
          { required: true, message: "探店的文字描述不能为空", trigger: "blur" }
        ]
      }
    }
  },
  created() {
    this.getList()
    this.getUserList()
    this.getShopList()
    this.getShopTypeList()
  },
  methods: {
    /** 查询博客列表 */
    getList() {
      this.loading = true
      listBlog(this.queryParams).then(response => {
        this.blogList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    /** 查询用户列表 */
    getUserList() {
      userList().then(response => {
        this.userList = response.data || []
      })
    },
    /** 查询店铺列表 */
    getShopList() {
      shopList().then(response => {
        this.shopList = response.data || []
        this.filteredShopList = [...this.shopList]
      })
    },
    /** 查询店铺类型列表 */
    getShopTypeList() {
      shopTypeList().then(response => {
        this.shopTypeList = response.data || []
      })
    },
    /** 根据店铺类型ID获取店铺类型名称 */
    getShopTypeName(typeId) {
      if (!typeId) return '未知类型'
      const type = this.shopTypeList.find(item => item.id == typeId)
      return type ? type.name : '未知类型'
    },
    /** 根据店铺ID获取店铺名称 */
    getShopName(shopId) {
      if (!shopId) return '未知店铺'
      const shop = this.shopList.find(item => item.id == shopId)
      return shop ? shop.name : '未知店铺'
    },
    /** 根据用户ID获取用户名称 */
    getUserName(userId) {
      if (!userId) return '未知用户'
      const user = this.userList.find(item => item.id == userId)
      return user ? user.nickName : '未知用户'
    },
    /** 店铺类型改变时的处理 */
    handleTypeChange(typeId) {
      // 清空已选择的店铺
      this.form.shopId = null

      if (typeId) {
        // 根据类型筛选店铺
        this.filteredShopList = this.shopList.filter(shop => shop.typeId == typeId)
      } else {
        // 如果没有选择类型，显示所有店铺
        this.filteredShopList = [...this.shopList]
      }
    },

    /** 上传前校验 */
    beforeUpload(file) {
      const isJPG = file.type === 'image/jpeg' || file.type === 'image/jpg'
      const isPNG = file.type === 'image/png'
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isJPG && !isPNG) {
        this.$message.error('上传图片只能是 JPG/PNG 格式!')
        return false
      }
      if (!isLt2M) {
        this.$message.error('上传图片大小不能超过 2MB!')
        return false
      }
      return true
    },

    /** 文件状态改变时的处理 */
    handleChange(file, fileList) {
      this.fileList = fileList
      // 更新表单中的图片路径（这里需要根据实际的上传逻辑调整）
      const imageUrls = fileList.map(item => {
        if (item.response) {
          return item.response.url // 假设后端返回图片URL
        }
        return item.url || ''
      }).filter(url => url)
      this.form.images = imageUrls.join(',')
    },

    /** 移除文件 */
    handleRemove(file, fileList) {
      this.fileList = fileList
      const imageUrls = fileList.map(item => {
        if (item.response) {
          return item.response.url
        }
        return item.url || ''
      }).filter(url => url)
      this.form.images = imageUrls.join(',')
    },

    /** 文件超出限制 */
    handleExceed(files, fileList) {
      this.$message.warning(`当前限制选择 9 个文件，本次选择了 ${files.length} 个文件，共选择了 ${files.length + fileList.length} 个文件`)
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
        typeId: null,
        shopId: null,
        userId: null,
        title: null,
        images: null,
        content: null,
        liked: null,
        comments: null,
        createTime: null,
        updateTime: null
      }
      this.fileList = []
      this.filteredShopList = [...this.shopList]
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
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset()
      this.open = true
      this.title = "添加博客"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getBlog(id).then(response => {
        this.form = response.data
        // 根据店铺ID设置类型ID
        if (this.form.shopId) {
          const shop = this.shopList.find(item => item.id == this.form.shopId)
          if (shop) {
            this.form.typeId = shop.typeId
            this.handleTypeChange(shop.typeId)
          }
        }
        // 将图片字符串转换为文件列表格式
        if (this.form.images) {
          const imageUrls = this.form.images.split(',').filter(img => img.trim())
          this.fileList = imageUrls.map((url, index) => ({
            name: `image_${index + 1}`,
            url: url
          }))
        }
        this.open = true
        this.title = "修改博客"
      })
    },
    /** 查看详情按钮操作 */
    handleDetail(row) {
      getBlog(row.id).then(response => {
        this.detailForm = response.data
        this.detailForm.imageList = this.detailForm.images ?
          this.detailForm.images.split(',').map(img => img.trim()).filter(img => img) : []
        this.detailOpen = true
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          // 这里需要实现图片上传逻辑
          // 1. 先上传所有图片
          // 2. 获取图片URL
          // 3. 将URL拼接成逗号分隔的字符串赋值给 this.form.images
          // 4. 提交表单数据

          // 模拟上传完成后的提交
          if (this.form.id != null) {
            updateBlog(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addBlog(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除博客编号为"' + ids + '"的数据项？').then(function() {
        return delBlog(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('blog/blog/export', {
        ...this.queryParams
      }, `blog_${new Date().getTime()}.xlsx`)
    },
    handleAllPublish(){
      allPublish().then(response => {
        response.msg && this.$modal.msgSuccess(response.msg)
      }).catch(() => {
      })
    },
    handlePublish(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认发布博客？').then(function() {
        return publish(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("发布成功")
      }).catch(() => {})
    },
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

/* 列表样式优化 */
.source-info {
    .shop-line {
        display: flex;
        align-items: center;
        margin-bottom: 4px;
        .type-tag { margin-right: 6px; }
        .shop-name { font-size: 13px; color: #303133; i { margin-right: 2px; } }
    }
    .user-line {
        font-size: 12px;
        color: #909399;
        i { margin-right: 4px; }
    }
}

.interaction-stats {
    display: flex;
    justify-content: center;
    gap: 15px;
    .stat-item {
        display: flex;
        align-items: center;
        font-size: 13px;
        i { margin-right: 4px; font-size: 14px; }
        &.like { color: #f56c6c; }
        &.comment { color: #409EFF; }
    }
}

/* 上传样式优化 */
.upload-container {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  background-color: #fafafa;
  padding: 20px;
  text-align: center;
  transition: border-color .3s;
  
  &:hover {
      border-color: #409EFF;
  }

  .visual-upload {
      ::v-deep .el-upload--picture-card {
          width: 100px;
          height: 100px;
          line-height: 100px;
      }
      ::v-deep .el-upload-list--picture-card .el-upload-list__item {
          width: 100px;
          height: 100px;
      }
  }

  .tips {
      margin-top: 10px;
      font-size: 12px;
      color: #909399;
      i { margin-right: 4px; }
  }
}

/* 详情弹窗优化 */
.detail-container {
    padding: 0 10px;
}

.detail-meta-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 15px;
    border-bottom: 1px solid #ebeef5;
    margin-bottom: 20px;
    
    .meta-left, .meta-right {
        display: flex;
        align-items: center;
    }
    
    .meta-text {
        font-size: 13px;
        color: #606266;
        margin-left: 15px;
        display: flex;
        align-items: center;
        i { margin-right: 4px; }
        &.shop { color: #303133; font-weight: 500; }
    }
    
    .meta-tag {
        background: #ecf5ff;
        color: #409EFF;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
    }
}

.detail-stats-row {
    display: flex;
    gap: 40px;
    margin-bottom: 25px;
    
    .stat-box {
        text-align: center;
        .label { font-size: 12px; color: #909399; margin-bottom: 4px; }
        .val { 
            font-size: 20px; 
            font-weight: bold; 
            &.like { color: #f56c6c; }
            &.comment { color: #409EFF; }
        }
    }
}

.detail-gallery {
    margin-bottom: 30px;
    .gallery-title { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 10px; }
    .gallery-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 10px;
        .gallery-item {
            width: 100%;
            height: 100px;
            border-radius: 6px;
            cursor: pointer;
        }
    }
}

.detail-content {
    .content-title { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 10px; }
    .content-body {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 6px;
        min-height: 100px;
        line-height: 1.6;
        font-size: 14px;
        color: #606266;
    }
}
</style>
