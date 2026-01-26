<template>
  <div class="app-container">
    <el-card class="box-card mb-4" shadow="never">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px" class="search-form">
        <el-form-item label="手机号码" prop="phone">
            <el-input
            v-model="queryParams.phone"
            placeholder="请输入手机号码"
            clearable
            @keyup.enter.native="handleQuery"
            style="width: 200px"
            />
        </el-form-item>
        <el-form-item label="昵称" prop="nickName">
            <el-input
            v-model="queryParams.nickName"
            placeholder="请输入昵称"
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
            v-hasPermi="['user:user:add']"
            >新增用户</el-button>
        </el-col>
        <el-col :span="1.5">
            <el-button
            type="success"
            plain
            icon="el-icon-edit"
            size="mini"
            :disabled="single"
            @click="handleUpdate"
            v-hasPermi="['user:user:edit']"
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
            v-hasPermi="['user:user:remove']"
            >删除</el-button>
        </el-col>
        <el-col :span="1.5">
            <el-button
            type="warning"
            plain
            icon="el-icon-download"
            size="mini"
            @click="handleExport"
            v-hasPermi="['user:user:export']"
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
        <el-table v-loading="loading" :data="userList" @selection-change="handleSelectionChange" border stripe :header-cell-style="{background:'#f5f7fa',color:'#606266'}">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="用户ID" align="center" prop="id" width="80" />
        <el-table-column label="用户" min-width="200">
            <template slot-scope="scope">
                <div class="user-profile-cell">
                    <div class="user-avatar">
                        <image-preview :src="scope.row.icon" :width="40" :height="40" v-if="scope.row.icon"/>
                        <div class="avatar-placeholder" v-else>
                            {{ (scope.row.nickName || 'U').charAt(0).toUpperCase() }}
                        </div>
                    </div>
                    <div class="user-info">
                        <div class="user-name">{{ scope.row.nickName || '未命名用户' }}</div>
                        <div class="user-phone" v-if="scope.row.phone"><i class="el-icon-mobile-phone"></i> {{ scope.row.phone }}</div>
                    </div>
                </div>
            </template>
        </el-table-column>
        <el-table-column label="手机号码" align="center" prop="phone" width="150" />
        
        <el-table-column label="创建时间" align="center" prop="createTime" width="160">
            <template slot-scope="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
            </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150" fixed="right">
            <template slot-scope="scope">
            <el-button
                size="mini"
                type="text"
                icon="el-icon-edit"
                @click="handleUpdate(scope.row)"
                v-hasPermi="['user:user:edit']"
            >修改</el-button>
            <el-button
                size="mini"
                type="text"
                icon="el-icon-delete"
                class="text-danger"
                @click="handleDelete(scope.row)"
                v-hasPermi="['user:user:remove']"
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

    <!-- 添加或修改用户对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body custom-class="user-edit-dialog">
      <el-form ref="form" :model="form" :rules="rules" label-width="80px" class="edit-form">
        <div class="dialog-profile-header" v-if="form.id">
             <div class="header-avatar">
                  <image-preview :src="form.icon" :width="60" :height="60" v-if="form.icon"/>
                   <div class="avatar-placeholder large" v-else>
                        {{ (form.nickName || 'U').charAt(0).toUpperCase() }}
                    </div>
             </div>
             <div class="header-info">
                 <div class="h-name">{{ form.nickName || '未命名' }}</div>
                 <div class="h-id">ID: {{ form.id }}</div>
             </div>
        </div>

        <el-form-item label="手机号码" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号码" maxlength="11" show-word-limit/>
        </el-form-item>
        <el-form-item label="登录密码" prop="password">
            <el-input v-model="form.password" placeholder="请输入密码 (加密存储)" show-password />
        </el-form-item>
        <el-form-item label="用户昵称" prop="nickName">
          <el-input v-model="form.nickName" placeholder="请输入昵称" maxlength="30" show-word-limit/>
        </el-form-item>
        <el-form-item label="用户头像" prop="icon">
          <image-upload v-model="form.icon" :limit="1"/>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listUser, getUser, delUser, addUser, updateUser,allPublish,publish } from "@/api/user/user"
export default {
  name: "User",
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
      // 用户表格数据
      userList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        phone: null,
        password: null,
        nickName: null,
        icon: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        phone: [
          { required: true, message: "手机号码不能为空", trigger: "blur" }
        ],
        createTime: [
          { required: true, message: "创建时间不能为空", trigger: "blur" }
        ],
        updateTime: [
          { required: true, message: "更新时间不能为空", trigger: "blur" }
        ]
      }
    }
  },
  created() {
    this.getList()
    console.log("文件上传路径"+process.env.VUE_APP_FILE_BASE_API)
  },
  methods: {
    /** 查询用户列表 */
    getList() {
      this.loading = true
      listUser(this.queryParams).then(response => {
        this.userList = response.rows
        this.total = response.total
        this.loading = false
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
        phone: null,
        password: null,
        nickName: null,
        icon: null,
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
      this.title = "添加用户"
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getUser(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改用户"
      })
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateUser(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addUser(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除用户编号为"' + ids + '"的数据项？').then(function() {
        return delUser(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('user/user/export', {
        ...this.queryParams
      }, `user_${new Date().getTime()}.xlsx`)
    },
    handleAllPublish(){
      allPublish().then(response => {
        response.msg && this.$modal.msgSuccess(response.msg)
      }).catch(() => {
      })
    },
    handlePublish(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认发布用户？').then(function() {
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
.user-profile-cell {
    display: flex;
    align-items: center;
    padding: 5px 0;
    
    .user-avatar {
        margin-right: 12px;
        .avatar-placeholder {
            width: 40px;
            height: 40px;
            background: #409EFF;
            color: #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: bold;
        }
    }
    
    .user-info {
        .user-name {
            font-weight: 600;
            color: #303133;
            font-size: 14px;
        }
        .user-phone {
            font-size: 12px;
            color: #909399;
            margin-top: 2px;
            display: flex;
            align-items: center;
            i { margin-right: 3px; }
        }
    }
}

/* 弹窗样式优化 */
.dialog-profile-header {
    display: flex;
    align-items: center;
    background: #f8f9fa;
    padding: 20px;
    margin: -20px -20px 20px -20px; /* 抵消dialog padding */
    border-bottom: 1px solid #ebeef5;
    
    .header-avatar {
        margin-right: 15px;
        .avatar-placeholder.large {
            width: 60px;
            height: 60px;
            font-size: 24px;
            background: #409EFF;
            color: #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }
    
    .header-info {
        .h-name { font-size: 18px; font-weight: bold; color: #303133; margin-bottom: 5px; }
        .h-id { font-size: 12px; color: #909399; }
    }
}

.edit-form {
    padding: 0 10px;
}
</style>
