<template>
  <div class="app-container">
    <!-- 搜索与操作栏 -->
    <el-card class="box-card mb-4" shadow="never">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px" class="search-form">
        <el-form-item label="店铺类型" prop="typeId">
          <el-select
            v-model="queryParams.typeId"
            placeholder="请选择店铺类型"
            clearable
            @change="handleQuery"
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
        <el-form-item label="商铺名称" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入商铺名称"
            clearable
            @keyup.enter.native="handleQuery"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input
            v-model="queryParams.address"
            placeholder="请输入地址"
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
            v-hasPermi="['shop:shop:add']"
          >新增店铺</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="success"
            plain
            icon="el-icon-edit"
            size="mini"
            :disabled="single"
            @click="handleUpdate"
            v-hasPermi="['shop:shop:edit']"
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
            v-hasPermi="['shop:shop:remove']"
          >删除</el-button>
        </el-col>
        <el-col :span="1.5">
          <el-button
            type="warning"
            plain
            icon="el-icon-download"
            size="mini"
            @click="handleExport"
            v-hasPermi="['shop:shop:export']"
          >导出</el-button>
        </el-col>
        <div class="right-actions">
           <el-button
            type="text"
            icon="el-icon-refresh"
            size="mini"
            @click="handleFlushCache"
          >刷新缓存</el-button>
           <el-button
            type="text"
            icon="el-icon-s-promotion"
            size="mini"
            @click="handleAllPublish"
          >全量发布</el-button>
          <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        </div>
      </el-row>
    </el-card>

    <!-- 表格区域 -->
    <el-card class="box-card" shadow="never">
        <el-table v-loading="loading" :data="shopList" @selection-change="handleSelectionChange" border stripe :header-cell-style="{background:'#f5f7fa',color:'#606266'}">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="店铺信息" min-width="250">
            <template slot-scope="scope">
                <div class="shop-info-cell">
                    <el-image
                        class="shop-list-img"
                        :src="getFirstImage(scope.row.images)"
                        fit="cover"
                    >
                        <div slot="error" class="image-slot">
                            <i class="el-icon-picture-outline"></i>
                        </div>
                    </el-image>
                    <div class="shop-list-text">
                        <div class="shop-name">{{ scope.row.name }}</div>
                        <div class="shop-sub">{{ scope.row.address }}</div>
                    </div>
                </div>
            </template>
        </el-table-column>
        <el-table-column label="类型" align="center" prop="typeId" width="120">
            <template slot-scope="scope">
            <el-tag size="small" effect="plain">{{ getShopTypeName(scope.row.typeId) || '未分类' }}</el-tag>
            </template>
        </el-table-column>
        <el-table-column label="商圈" align="center" prop="area" width="150" />
        <el-table-column label="均价" align="center" prop="avgPrice" width="100">
            <template slot-scope="scope">
            <span class="price-text" v-if="scope.row.avgPrice">¥{{ scope.row.avgPrice }}</span>
            <span v-else>-</span>
            </template>
        </el-table-column>
        <el-table-column label="数据概览" align="center" width="180">
            <template slot-scope="scope">
                <div class="data-preview">
                    <span>销量: {{ scope.row.sold || 0 }}</span>
                    <el-divider direction="vertical"></el-divider>
                    <span>评分: {{ scope.row.score ? (scope.row.score / 10).toFixed(1) : '-' }}</span>
                </div>
            </template>
        </el-table-column>
        <el-table-column label="营业时间" align="center" prop="openHours" width="150" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180" fixed="right">
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
                v-hasPermi="['shop:shop:edit']"
            >修改</el-button>
            <el-button
                size="mini"
                type="text"
                icon="el-icon-delete"
                class="text-danger"
                @click="handleDelete(scope.row)"
                v-hasPermi="['shop:shop:remove']"
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

    <!-- 添加或修改店铺对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="900px" append-to-body custom-class="shop-edit-dialog" top="5vh">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px" class="edit-form">
        
        <div class="form-section-title">基础信息</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商铺名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入商铺名称" maxlength="50" show-word-limit />
            </el-form-item>
          </el-col>
           <el-col :span="12">
            <el-form-item label="店铺类型" prop="typeId">
              <el-select
                v-model="form.typeId"
                placeholder="请选择店铺类型"
                clearable
                style="width: 100%"
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
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="商圈" prop="area">
              <el-input v-model="form.area" placeholder="请输入商圈" maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
             <el-form-item label="均价" prop="avgPrice">
              <el-input-number
                v-model="form.avgPrice"
                placeholder="均价"
                :min="0"
                :max="10000"
                :precision="0"
                controls-position="right"
                style="width: 100%"
              >
                <template slot="prepend">¥</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="营业时间" prop="openHours">
              <el-input v-model="form.openHours" placeholder="例：10:00-22:00" maxlength="20" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="form-section-title">图片素材</div>
        <el-row>
          <el-col :span="24">
            <el-form-item label="商铺图片" prop="images">
               <div class="upload-tip">建议上传高清实拍图，第一张将作为封面图展示</div>
              <imageUpload v-model="form.images" :fileSize="2" :limit="5"  />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="form-section-title">地理位置</div>
        <el-row>
          <el-col :span="24">
             <el-form-item label="详细地址" prop="address">
              <el-input v-model="form.address" placeholder="请输入详细地址" maxlength="100" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="地图定位" required>
              <div class="location-selector is-edit">
                <div class="location-search-bar">
                  <el-input
                    v-model="locationKeyword"
                    placeholder="输入地址搜索 (如：北京市朝阳区)"
                    clearable
                    @clear="handleClearSearch"
                    @keyup.enter.native="handleSearchLocation"
                    size="small"
                  >
                     <el-button slot="append" icon="el-icon-search" @click="handleSearchLocation" :loading="searchLoading">搜索</el-button>
                  </el-input>
                </div>

                <div class="map-wrapper">
                  <div id="map-container" class="map"></div>
                   <div class="map-tools">
                    <el-button size="mini" type="default" icon="el-icon-location" circle @click="handleLocateMe" :loading="locating" title="定位当前位置"></el-button>
                  </div>
                </div>

                <div class="location-status">
                   <span v-if="selectedLocation.address" class="seccess-text"><i class="el-icon-location-information"></i> 已选：{{ selectedLocation.address }}</span>
                   <span v-else class="info-text"><i class="el-icon-warning-outline"></i> 请在地图点击选择位置</span>
                </div>
                
                 <!-- 隐藏的经纬度输入框，用于表单提交 -->
                 <div style="display:none">
                    <el-input v-model="form.x" />
                    <el-input v-model="form.y" />
                 </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 店铺详情对话框 -->
    <el-dialog :visible.sync="detailOpen" width="800px" append-to-body custom-class="shop-detail-dialog" :show-close="true">
       <div class="shop-detail-content" v-if="detailOpen">
           <!-- 头部主要信息 -->
           <div class="detail-header">
               <div class="detail-cover">
                    <el-image 
                        :src="getFirstImage(detailForm.images)" 
                        fit="cover"
                        class="cover-img"
                    >
                        <div slot="error" class="image-slot">
                            <i class="el-icon-picture-outline"></i>
                        </div>
                    </el-image>
               </div>
               <div class="detail-main-info">
                   <div class="d-title">{{ detailForm.name }}</div>
                   <div class="d-tags">
                       <el-tag size="small" type="primary">{{ getShopTypeName(detailForm.typeId) || '未知类型' }}</el-tag>
                       <el-tag size="small" type="warning" plain>{{ detailForm.area || '暂无商圈' }}</el-tag>
                   </div>
                   <div class="d-score">
                       <el-rate
                        :value="detailForm.score ? detailForm.score / 10 : 0"
                        disabled
                        show-score
                        text-color="#ff9900"
                        score-template="{value}分">
                        </el-rate>
                   </div>
                   <div class="d-stats">
                       <div class="stat-item">
                           <span class="label">销量</span>
                           <span class="val">{{ detailForm.sold || 0 }}</span>
                       </div>
                       <div class="stat-divider"></div>
                        <div class="stat-item">
                           <span class="label">评论</span>
                           <span class="val">{{ detailForm.comments || 0 }}</span>
                       </div>
                       <div class="stat-divider"></div>
                        <div class="stat-item">
                           <span class="label">人均</span>
                           <span class="val price">¥{{ detailForm.avgPrice || '-' }}</span>
                       </div>
                   </div>
               </div>
           </div>
            
           <el-divider></el-divider>

           <!-- 详细属性表格 -->
           <div class="detail-grid">
               <div class="grid-item full">
                   <i class="el-icon-location-outline"></i>
                   <span class="label">详细地址:</span>
                   <span class="value">{{ detailForm.address }}</span>
               </div>
               <div class="grid-item">
                   <i class="el-icon-time"></i>
                   <span class="label">营业时间:</span>
                   <span class="value">{{ detailForm.openHours }}</span>
               </div>
               <div class="grid-item">
                   <i class="el-icon-date"></i>
                   <span class="label">入驻时间:</span>
                   <span class="value">{{ detailForm.createTime }}</span>
               </div>
                <div class="grid-item">
                   <i class="el-icon-map-location"></i>
                   <span class="label">经纬坐标:</span>
                   <span class="value">{{ detailForm.x }}, {{ detailForm.y }}</span>
               </div>
           </div>

           <!-- 图片展示 -->
           <div class="detail-gallery mt-4" v-if="detailForm.images">
               <div class="gallery-title">店铺相册</div>
               <div class="gallery-list">
                    <el-image
                    v-for="(image, index) in getImageList(detailForm.images)"
                    :key="index"
                    :src="image"
                    fit="cover"
                    class="gallery-img"
                    :preview-src-list="getImageList(detailForm.images)"
                    />
               </div>
           </div>
       </div>
    </el-dialog>
  </div>
</template>

<script>
import {listShop, getShop, delShop, addShop, updateShop, flushCache, allPublish, publish} from "@/api/shop/shop"
// 新增：导入店铺类型列表接口（需后端提供）
import { listShopType } from "@/api/shop/shopType"

// 简化版地图加载函数
function loadMapScript() {
  return new Promise((resolve, reject) => {
    if (window.AMap) {
      resolve(window.AMap)
    } else {
        // 简单轮询等待地图加载完成
        let tries = 0
        const timer = setInterval(() => {
            if (window.AMap) {
                clearInterval(timer)
                resolve(window.AMap)
            }
            tries++
            if (tries > 20) { // 最多等待 20*200ms = 4秒
                clearInterval(timer)
                reject(new Error('地图加载超时'))
            }
        }, 200)
    }
  })
}

export default {
  name: "Shop",
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
      // 店铺表格数据
      shopList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 详情弹出层
      detailOpen: false,
      // 详情表单
      detailForm: {},

      // 新增：店铺类型列表（下拉框数据源）
      shopTypeList: [],

      // 图片上传相关
      fileList: [],
      dialogImageUrl: "",
      dialogVisible: false,
      filePrefix: process.env.VUE_FILE_PREFIX,
      // 地图相关数据
      map: null,
      marker: null,
      geocoder: null,
      placeSearch: null,
      locationKeyword: '',
      selectedLocation: {
        address: '',
        lng: null,
        lat: null
      },
      isMapLoaded: false,
      locating: false,
      searchLoading: false,
      locationError: '',

      // 查询参数：新增typeId
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: null,
        address: null,
        openHours: null,
        typeId: null // 店铺类型ID
      },
      // 表单参数：新增typeId
      form: {
        id: null,
        name: null,
        typeId: null, // 店铺类型ID
        images: null,
        area: null,
        address: null,
        x: null,
        y: null,
        avgPrice: null,
        sold: null,
        comments: null,
        score: null,
        openHours: null,
        createTime: null,
        updateTime: null
      },
      // 表单校验：新增typeId校验
      rules: {
        name: [
          { required: true, message: "商铺名称不能为空", trigger: "blur" },
          { min: 2, max: 50, message: "商铺名称长度在 2 到 50 个字符", trigger: "blur" }
        ],
        address: [
          { required: true, message: "地址不能为空", trigger: "blur" }
        ],
        area: [
          { required: true, message: "商圈不能为空", trigger: "blur" }
        ],
        openHours: [
          { required: true, message: "营业时间不能为空", trigger: "blur" }
        ],
        typeId: [ // 店铺类型必填校验
          { required: true, message: "店铺类型不能为空", trigger: "change" }
        ],
        x: [
          { required: true, message: "请选择店铺位置", trigger: "blur" }
        ],
        y: [
          { required: true, message: "请选择店铺位置", trigger: "blur" }
        ],
        avgPrice: [
          { type: 'number', min: 0, message: '均价必须大于等于0', trigger: 'blur' }
        ],
        sold: [
          { type: 'number', min: 0, message: '销量必须大于等于0', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.getList()
    this.getShopTypeList() // 初始化加载店铺类型列表
  },
  mounted() {
    this.initMap()
  },
  methods: {
    /** 查询店铺列表 */
    getList() {
      this.loading = true
      listShop(this.queryParams).then(response => {
        this.shopList = response.rows
        this.total = response.total
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },

    /** 新增：加载店铺类型列表（下拉框数据源） */
    getShopTypeList() {
      listShopType().then(response => {
        this.shopTypeList = response.data || [] // 适配后端返回格式
      }).catch(error => {
        console.error('加载店铺类型失败:', error)
        this.$message.error('加载店铺类型失败，请刷新页面')
      })
    },

    /** 新增：根据typeId获取店铺类型名称 */
    getShopTypeName(typeId) {
      if (!typeId) return ''
      const type = this.shopTypeList.find(item => item.id === typeId)
      return type ? type.name : '未知类型'
    },

    getFirstImage(images) {
      if (!images) return ''
      const imageList = images.split(',').filter(img => img.trim())
      let url = imageList[0] || ''
      if (url.startsWith('http') || url.startsWith('https')) return url
      
      let base = process.env.VUE_APP_FILE_BASE_API || ''
      // 确保 base 不以 / 结尾
      if (base.endsWith('/')) base = base.slice(0, -1)
      // 确保 url 以 / 开头
      if (!url.startsWith('/')) url = '/' + url
      
      let fullUrl = base + url
      if (fullUrl.includes('/smart-live/smart-live')) {
          fullUrl = fullUrl.replace('/smart-live/smart-live', '/smart-live')
      }
      return fullUrl
    },

    /** 获取图片列表 */
    getImageList(images) {
      if (!images) return []
      const baseRaw = process.env.VUE_APP_FILE_BASE_API || ''
      // 确保 base 不以 / 结尾
      const base = baseRaw.endsWith('/') ? baseRaw.slice(0, -1) : baseRaw
      
      return images.split(',').filter(img => img.trim()).map(img => {
          if (img.startsWith('http') || img.startsWith('https')) return img
          
          let url = img
          if (!url.startsWith('/')) url = '/' + url
          
          let fullUrl = base + url
          if (fullUrl.includes('/smart-live/smart-live')) {
             return fullUrl.replace('/smart-live/smart-live', '/smart-live')
          }
          return fullUrl
      })
    },

    /** 图片上传前校验 */
    beforeUpload(file) {
      const isImage = file.type.includes('image/')
      const isLt5M = file.size / 1024 / 1024 < 5

      if (!isImage) {
        this.$message.error('只能上传图片格式!')
        return false
      }
      if (!isLt5M) {
        this.$message.error('图片大小不能超过5MB!')
        return false
      }
      return true
    },

    /** 处理文件变化 */
    handleChange(file, fileList) {
      this.fileList = fileList
      const imageUrls = fileList.map(file => file.url || file.response?.url).filter(url => url)
      this.form.images = imageUrls.join(',')
    },

    /** 删除图片 */
    handleRemove(file, fileList) {
      this.fileList = fileList
      const imageUrls = fileList.map(file => file.url || file.response?.url).filter(url => url)
      this.form.images = imageUrls.join(',')
    },

    /** 预览图片 */
    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url
      this.dialogVisible = true
    },

    /** 初始化文件列表 */
    initFileList() {
      if (this.form.images) {
        const imageUrls = this.form.images.split(',').filter(img => img.trim())
        this.fileList = imageUrls.map((url, index) => ({
          name: `image-${index + 1}`,
          url: url
        }))
      } else {
        this.fileList = []
      }
    },

    /** 初始化地图 */
    async initMap() {
      try {
        await loadMapScript()
        this.isMapLoaded = true
        console.log('地图初始化成功')
      } catch (error) {
        console.error('地图加载失败:', error)
        this.locationError = '地图加载失败，请检查网络连接'
        this.$message.error('地图加载失败')
      }
    },

    /** 创建地图 */
    createMap() {
      if (!this.isMapLoaded) {
        this.$message.warning('地图正在加载中，请稍后...')
        return
      }

      try {
        // 创建基础地图
        this.map = new AMap.Map('map-container', {
          zoom: 13,
          center: [116.397428, 39.90923], // 北京中心
          viewMode: '2D'
        })

        // 初始化地理编码器（如果插件可用）
        if (AMap.Geocoder) {
          this.geocoder = new AMap.Geocoder({
            city: '全国'
          })
        }

        // 初始化地点搜索（如果插件可用）
        if (AMap.PlaceSearch) {
          this.placeSearch = new AMap.PlaceSearch({
            city: '全国',
            pageSize: 10
          })
        }

        // 地图点击事件
        this.map.on('click', (e) => {
          this.handleMapClick(e)
        })

        // 如果已有坐标，定位到该位置
        if (this.form.x && this.form.y) {
          this.setMarker(this.form.x, this.form.y)
          this.map.setCenter([this.form.x, this.form.y])
          this.map.setZoom(15)
        }

        console.log('地图创建成功')
      } catch (error) {
        console.error('地图创建失败:', error)
        this.locationError = '地图创建失败，请刷新页面重试'
        this.$message.error('地图创建失败')
      }
    },

    /** 地图点击事件 */
    handleMapClick(e) {
      const lng = e.lnglat.getLng()
      const lat = e.lnglat.getLat()
      this.setMarker(lng, lat)
      this.reverseGeocode(lng, lat)
    },

    /** 设置标记点 */
    setMarker(lng, lat) {
      // 清除旧标记
      if (this.marker) {
        this.map.remove(this.marker)
      }

      // 创建新标记
      this.marker = new AMap.Marker({
        position: [lng, lat],
        draggable: true
      })

      this.map.add(this.marker)
      this.map.setCenter([lng, lat])

      // 标记拖动事件
      this.marker.on('dragend', (e) => {
        const position = e.target.getPosition()
        this.reverseGeocode(position.lng, position.lat)
      })
    },

    /** 反向地理编码 */
    reverseGeocode(lng, lat) {
      if (!this.geocoder) {
        // 如果没有地理编码器，直接使用坐标
        this.selectedLocation = {
          address: `位置 (${lng.toFixed(6)}, ${lat.toFixed(6)})`,
          lng: lng,
          lat: lat
        }
        this.form.x = lng
        this.form.y = lat
        this.form.address = this.selectedLocation.address
        return
      }

      this.geocoder.getAddress([lng, lat], (status, result) => {
        if (status === 'complete' && result.regeocode) {
          const address = result.regeocode.formattedAddress
          this.selectedLocation = {
            address: address,
            lng: lng,
            lat: lat
          }
          this.form.x = lng
          this.form.y = lat
          // 自动填充地址字段
          this.form.address = address
        } else {
          this.selectedLocation = {
            address: `位置 (${lng.toFixed(6)}, ${lat.toFixed(6)})`,
            lng: lng,
            lat: lat
          }
          this.form.x = lng
          this.form.y = lat
          this.form.address = this.selectedLocation.address
        }
      })
    },

    /** 搜索地点 */
    handleSearchLocation() {
      if (!this.locationKeyword.trim()) {
        this.$message.warning('请输入搜索关键词')
        return
      }

      if (!this.placeSearch) {
        this.$message.warning('搜索功能暂不可用，请直接在地图上选择位置')
        return
      }

      this.searchLoading = true
      this.locationError = ''

      this.placeSearch.search(this.locationKeyword, (status, result) => {
        this.searchLoading = false

        if (status === 'complete' && result.poiList.pois.length > 0) {
          const poi = result.poiList.pois[0]
          const lng = poi.location.getLng()
          const lat = poi.location.getLat()

          this.setMarker(lng, lat)
          this.map.setCenter([lng, lat])
          this.map.setZoom(16)

          this.selectedLocation = {
            address: `${poi.name} - ${poi.address}`,
            lng: lng,
            lat: lat
          }
          this.form.x = lng
          this.form.y = lat
          this.form.address = poi.address

          this.$message.success('位置搜索成功')
        } else {
          console.error('地图搜索失败:', status, result)
          let errorMsg = '未找到相关地点，请尝试其他关键词'
          if (status === 'error') {
             errorMsg = '搜索出错：' + (result.info || status)
          } else if (status === 'no_data') {
             errorMsg = '未找到结果，请更换关键词'
          }
          this.locationError = errorMsg
          this.$message.error(errorMsg)
        }
      })
    },

    /** 清除搜索 */
    handleClearSearch() {
      this.locationKeyword = ''
      this.locationError = ''
    },

    /** 定位到我的位置 */
    handleLocateMe() {
      this.locating = true
      this.locationError = ''

      if (!navigator.geolocation) {
        this.locationError = '您的浏览器不支持地理定位功能'
        this.locating = false
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.locating = false
          const lng = position.coords.longitude
          const lat = position.coords.latitude

          this.setMarker(lng, lat)
          this.map.setCenter([lng, lat])
          this.map.setZoom(15)
          this.reverseGeocode(lng, lat)
        },
        (error) => {
          this.locating = false
          console.error('定位失败:', error)

          switch(error.code) {
            case error.PERMISSION_DENIED:
              this.locationError = '位置权限被拒绝，请在浏览器设置中允许位置访问'
              break
            case error.POSITION_UNAVAILABLE:
              this.locationError = '无法获取当前位置信息'
              break
            case error.TIMEOUT:
              this.locationError = '定位请求超时'
              break
            default:
              this.locationError = '定位失败'
          }
          this.$message.warning('定位失败，请手动在地图上选择位置')
        }
      )
    },

    /** 确认位置 */
    handleConfirmLocation() {
      if (!this.form.x || !this.form.y) {
        this.$message.warning('请先选择位置')
        return
      }
      if (this.selectedLocation && this.selectedLocation.address) {
        this.form.address = this.selectedLocation.address
      }
      this.$message.success('位置已确认')
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
        name: null,
        typeId: null, // 重置店铺类型
        images: null,
        area: null,
        address: null,
        x: null,
        y: null,
        avgPrice: null,
        sold: null,
        comments: null,
        score: null,
        openHours: null,
        createTime: null,
        updateTime: null
      }
      this.fileList = []
      this.locationKeyword = ''
      this.selectedLocation = {
        address: '',
        lng: null,
        lat: null
      }
      this.locationError = ''
      this.locating = false
      this.searchLoading = false

      // 清除地图
      if (this.map) {
        this.map.destroy()
        this.map = null
        this.marker = null
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
      // 重置后清空typeId
      this.queryParams.typeId = null
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
      this.title = "添加店铺"

      this.$nextTick(() => {
        setTimeout(() => {
          this.createMap()
        }, 300)
      })
    },

    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset()
      const id = row.id || this.ids
      getShop(id).then(response => {
        this.form = response.data
        this.initFileList()
        this.open = true
        this.title = "修改店铺"

        this.$nextTick(() => {
          setTimeout(() => {
            this.createMap()
            if (this.form.x && this.form.y) {
              this.reverseGeocode(this.form.x, this.form.y)
            }
          }, 300)
        })
      })
    },

    /** 详情按钮操作 */
    handleDetail(row) {
      const id = row.id
      getShop(id).then(response => {
        this.detailForm = response.data
        this.detailOpen = true
      })
    },

    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        this.form.images = this.form.images
          .split(',')
          .map(url => {
            const index = url.indexOf(this.filePrefix);
            return index !== -1 ? url.substring(index + this.filePrefix.length) : url;
          })
          .join(',');
        if (valid) {
          if (this.form.id != null) {
            updateShop(this.form).then(response => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addShop(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除店铺？').then(function() {
        return delShop(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },

    /** 导出按钮操作 */
    handleExport() {
      this.download('shop/shop/export', {
        ...this.queryParams
      }, `shop_${new Date().getTime()}.xlsx`)
    },
    /** 店铺列表存入缓存 */
    handleFlushCache() {
      flushCache().then(response => {
        response.msg && this.$modal.msgSuccess(response.msg)
      }).catch(() => {
      })
    },
    handleAllPublish(){
      allPublish().then(response => {
        response.msg && this.$modal.msgSuccess(response.msg)
      }).catch(() => {
      })
    },
    handlePublish(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认发布店铺？').then(function() {
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
.mt-4 {
    margin-top: 20px;
}

/* 搜索栏优化 */
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

/* 表格优化 */
.shop-info-cell {
    display: flex;
    align-items: center;
    padding: 5px 0;
    .shop-list-img {
        width: 48px;
        height: 48px;
        border-radius: 6px;
        border: 1px solid #eee;
        margin-right: 12px;
        flex-shrink: 0;
    }
    .shop-list-text {
        overflow: hidden;
        .shop-name {
            font-size: 14px;
            font-weight: 500;
            color: #333;
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .shop-sub {
            font-size: 12px;
            color: #999;
             white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }
}

.price-text {
    font-weight: 600;
    color: #f56c6c;
}

.data-preview {
    font-size: 12px;
    color: #606266;
    display: flex;
    align-items: center;
    justify-content: center;
}

.text-danger {
    color: #f56c6c;
}

/* 编辑弹窗优化 */
.form-section-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    padding-left: 10px;
    border-left: 4px solid #409EFF;
    margin-bottom: 20px;
    margin-top: 10px;
}

.upload-tip {
    font-size: 12px;
    color: #909399;
    margin-bottom: 10px;
}

/* 详情弹窗优化 */
.shop-detail-content {
    padding: 0 10px;
}

.detail-header {
    display: flex;
    .detail-cover {
        width: 120px;
        height: 120px;
        flex-shrink: 0;
        margin-right: 20px;
        .cover-img {
            width: 100%;
            height: 100%;
            border-radius: 8px;
            box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
        }
    }
    .detail-main-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        .d-title {
            font-size: 20px;
            font-weight: bold;
            color: #303133;
        }
        .d-tags {
            margin: 8px 0;
            display: flex;
            gap: 8px;
        }
        .d-stats {
            display: flex;
            align-items: center;
            background: #f8f9fa;
            padding: 10px 15px;
            border-radius: 6px;
            width: fit-content;
            
            .stat-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                min-width: 60px;
                .label {
                    font-size: 12px;
                    color: #909399;
                }
                .val {
                    font-size: 16px;
                    font-weight: 600;
                    color: #303133;
                    margin-top: 4px;
                    &.price {
                        color: #f56c6c;
                    }
                }
            }
            .stat-divider {
                width: 1px;
                height: 20px;
                background: #dcdfe6;
                margin: 0 15px;
            }
        }
    }
}

.detail-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    .grid-item {
        width: calc(50% - 15px);
        display: flex;
        align-items: center;
        padding: 10px;
        background: #f5f7fa;
        border-radius: 4px;
         &.full {
            width: 100%;
        }
        i {
            margin-right: 8px;
            color: #909399;
            font-size: 16px;
        }
        .label {
            color: #606266;
            margin-right: 10px;
            min-width: 70px;
        }
        .value {
            color: #303133;
            font-weight: 500;
        }
    }
}

.detail-gallery {
    .gallery-title {
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 12px;
        color: #303133;
    }
    .gallery-list {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        .gallery-img {
            width: 100px;
            height: 100px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s;
            &:hover {
                transform: scale(1.02);
            }
        }
    }
}

/* 地图相关样式优化 */
.location-selector.is-edit {
    .map-wrapper {
        position: relative;
        height: 300px;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #dcdfe6;
        .map {
            width: 100%;
            height: 100%;
        }
        .map-tools {
             position: absolute;
             bottom: 20px;
             right: 20px;
             z-index: 999;
        }
    }
    .location-search-bar {
        margin-bottom: 12px;
    }
    .location-status {
        margin-top: 10px;
        font-size: 13px;
        .seccess-text {
            color: #67c23a;
        }
        .info-text {
            color: #909399;
        }
    }
}
</style>
