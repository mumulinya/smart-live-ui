<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="店铺类型" prop="typeId">
        <el-select
          v-model="queryParams.typeId"
          placeholder="请选择店铺类型"
          clearable
          style="width: 200px"
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
      <el-form-item label="用户" prop="userId">
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
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入标题"
          clearable
          @keyup.enter.native="handleQuery"
          style="width: 200px"
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
          v-hasPermi="['blog:blog:add']"
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

    <el-table v-loading="loading" :data="blogList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="店铺类型" align="center" width="120" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ getShopTypeName(scope.row.typeId) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="店铺" align="center" width="120" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ getShopName(scope.row.shopId) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="用户" align="center" width="120" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ getUserName(scope.row.userId) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="标题" align="center" prop="title" show-overflow-tooltip />
      <el-table-column label="点赞数" align="center" prop="liked" width="80">
        <template slot-scope="scope">
          <el-tag size="small" type="danger">{{ scope.row.liked || 0 }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="评论数" align="center" prop="comments" width="80">
        <template slot-scope="scope">
          <el-tag size="small" type="info">{{ scope.row.comments || 0 }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
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
            v-hasPermi="['blog:blog:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
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

    <!-- 添加或修改博客对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="700px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
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
        <el-form-item label="店铺" prop="shopId">
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
        <el-form-item label="用户" prop="userId">
          <el-select v-model="form.userId" placeholder="请选择用户" style="width: 100%">
            <el-option
              v-for="user in userList"
              :key="user.userId"
              :label="user.nickName"
              :value="user.userId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
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
            >
              <i class="el-icon-plus"></i>
            </el-upload>
            <div class="tips">
              <p>提示：</p>
              <p>1. 最多可上传9张图片</p>
              <p>2. 支持 JPG、PNG 格式</p>
              <p>3. 单张图片不超过 2MB</p>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="文字描述" prop="content">
          <editor v-model="form.content" :min-height="192"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 博客详情对话框 -->
    <el-dialog title="博客详情" :visible.sync="detailOpen" width="800px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="博客ID">{{ detailForm.id }}</el-descriptions-item>
        <el-descriptions-item label="店铺类型">
          {{ getShopTypeName(detailForm.typeId) }}
        </el-descriptions-item>
        <el-descriptions-item label="店铺">
          {{ getShopName(detailForm.shopId) }}
        </el-descriptions-item>
        <el-descriptions-item label="用户">
          {{ getUserName(detailForm.userId) }}
        </el-descriptions-item>
        <el-descriptions-item label="标题" :span="2">
          <span style="font-weight: bold; font-size: 16px;">{{ detailForm.title }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="点赞数">
          <el-tag type="danger" size="medium">{{ detailForm.liked || 0 }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="评论数">
          <el-tag type="info" size="medium">{{ detailForm.comments || 0 }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ parseTime(detailForm.createTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ parseTime(detailForm.updateTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="图片" :span="2" v-if="detailForm.imageList && detailForm.imageList.length > 0">
          <div class="image-preview-detail">
            <el-image
              v-for="(img, index) in detailForm.imageList"
              :key="index"
              :src="img"
              fit="cover"
              style="width: 120px; height: 120px; margin: 5px; border-radius: 8px;"
              :preview-src-list="detailForm.imageList"
            >
              <div slot="error" class="image-slot">
                <i class="el-icon-picture-outline"></i>
                <div>加载失败</div>
              </div>
            </el-image>
          </div>
          <div class="image-count-tip">共 {{ detailForm.imageList.length }} 张图片，点击可预览</div>
        </el-descriptions-item>
        <el-descriptions-item label="内容描述" :span="2">
          <div class="content-detail" v-html="detailForm.content"></div>
        </el-descriptions-item>
      </el-descriptions>
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

<style scoped>
.upload-container {
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  padding: 12px;
  background: #fafafa;
}

.tips {
  background: #f0f9ff;
  border: 1px solid #bae7ff;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
  color: #1890ff;
  margin-top: 12px;
}

.tips p {
  margin: 2px 0;
}

.image-preview-detail {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
}

.image-count-tip {
  text-align: center;
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
}

.content-detail {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e6e6e6;
  padding: 12px;
  border-radius: 4px;
  background: #fafafa;
}

.image-slot {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  border-radius: 8px;
}
</style>
