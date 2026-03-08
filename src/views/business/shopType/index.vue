<template>
  <div class="app-container">
    <!-- 搜索与操作栏 -->
    <el-card class="box-card mb-4" shadow="never">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px" class="search-form">
        <el-form-item label="分类名称" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入分类名称"
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
            v-hasPermi="['shop:shopType:add']"
          >新增分类</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="success"
            plain
            icon="el-icon-edit"
            size="mini"
            :disabled="single"
            @click="handleUpdate"
            v-hasPermi="['shop:shopType:edit']"
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
            v-hasPermi="['shop:shopType:remove']"
          >删除</el-button>
        </el-col>
        <div class="right-actions">
          <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        </div>
      </el-row>
    </el-card>

    <!-- 表格区域 -->
    <el-card class="box-card" shadow="never">
      <el-table v-loading="loading" :data="typeList" @selection-change="handleSelectionChange" border stripe :header-cell-style="{background:'#f5f7fa',color:'#606266'}">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="分类编号" align="center" prop="id" width="100" />
        <el-table-column label="分类图标" align="center" prop="icon" width="120">
          <template slot-scope="scope">
            <el-image
              v-if="scope.row.icon"
              style="width: 40px; height: 40px; border-radius: 4px;"
              :src="getFirstImage(scope.row.icon)"
              fit="cover"
            >
              <div slot="error" class="image-slot">
                <i class="el-icon-picture-outline" style="font-size: 20px; color: #909399;"></i>
              </div>
            </el-image>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="分类名称" align="center" prop="name" />
        <el-table-column label="排序" align="center" prop="sort" width="100" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="180">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180" fixed="right">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['shop:shopType:edit']"
            >修改</el-button>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-delete"
              class="text-danger"
              @click="handleDelete(scope.row)"
              v-hasPermi="['shop:shopType:remove']"
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

    <!-- 添加或修改店铺分类对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body top="10vh">
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="分类图标" prop="icon">
          <div class="upload-tip" style="color: #909399; font-size: 12px; margin-bottom: 5px;">建议上传正方形图标</div>
          <imageUpload v-model="form.icon" :fileSize="2" :limit="1" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" controls-position="right" :min="0" style="width: 100%;" />
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
import { listShopType, getType, delType, addType, updateType } from "@/api/shop/shopType";

export default {
  name: "ShopType",
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
      // 店铺分类表格数据
      typeList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        name: [
          { required: true, message: "分类名称不能为空", trigger: "blur" }
        ],
        sort: [
          { required: true, message: "排序不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询店铺分类列表 */
    getList() {
      this.loading = true;
      listShopType(this.queryParams).then(response => {
        // 由于listShopType原先返回 response.data 格式可能是不带分页或者带分页的
        // 这里需要适配若依的标准分页格式 response.rows 和 response.total
        // 如果后端返回的是普通列表格式（List<ShopType>），则需要处理
        if (response.rows) {
          this.typeList = response.rows;
          this.total = response.total || 0;
        } else if (response.data) {
          this.typeList = Array.isArray(response.data) ? response.data : [response.data];
          this.total = this.typeList.length;
        } else {
          this.typeList = [];
          this.total = 0;
        }
        this.loading = false;
      }).catch(() => {
        this.loading = false;
      });
    },
    // 处理图片显示地址
    getFirstImage(images) {
      if (!images) return '';
      const imageList = images.split(',').filter(img => img.trim());
      let url = imageList[0] || '';
      if (url.startsWith('http') || url.startsWith('https')) return url;
      
      let base = process.env.VUE_APP_FILE_BASE_API || '';
      if (base.endsWith('/')) base = base.slice(0, -1);
      if (!url.startsWith('/')) url = '/' + url;
      
      let fullUrl = base + url;
      if (fullUrl.includes('/smart-live/smart-live')) {
        fullUrl = fullUrl.replace('/smart-live/smart-live', '/smart-live');
      }
      return fullUrl;
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        name: null,
        icon: null,
        sort: 0
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加店铺分类";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids;
      getType(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改店铺分类";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateType(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addType(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除该店铺分类？数据项编号为"' + ids + '"可以恢复吗？').then(function() {
        return delType(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    }
  }
};
</script>

<style scoped>
.app-container {
  padding: 20px;
}
.op-btns {
  margin-bottom: 10px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}
.right-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
}
</style>
