<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="店铺类型" prop="typeId">
        <el-select
          v-model="queryParams.typeId"
          placeholder="请选择店铺类型"
          clearable
          @change="handleQuery"
          style="width: 180px"
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
        />
      </el-form-item>
      <el-form-item label="地址" prop="address">
        <el-input
          v-model="queryParams.address"
          placeholder="请输入地址"
          clearable
          @keyup.enter.native="handleQuery"
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
          v-hasPermi="['shop:shop:add']"
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
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-refresh"
          size="mini"
          @click="handleFlushCache"
        >刷新缓存</el-button>
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

    <el-table v-loading="loading" :data="shopList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="店铺类型" align="center" prop="typeId">
        <template slot-scope="scope">
          <span>{{ getShopTypeName(scope.row.typeId) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="商铺名称" align="center" prop="name" :show-overflow-tooltip="true" />
      <el-table-column label="地址" align="center" prop="address" :show-overflow-tooltip="true" />
      <el-table-column label="商圈" align="center" prop="area" />
      <el-table-column label="均价" align="center" prop="avgPrice">
        <template slot-scope="scope">
          <span v-if="scope.row.avgPrice">¥{{ scope.row.avgPrice }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="销量" align="center" prop="sold" />
      <el-table-column label="评分" align="center" prop="score">
        <template slot-scope="scope">
          <span v-if="scope.row.score">{{ (scope.row.score / 10).toFixed(1) }}分</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="营业时间" align="center" prop="openHours" width="120" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="220">
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

    <!-- 添加或修改店铺对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="900px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="商铺名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入商铺名称" maxlength="50" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="8">
            <el-form-item label="商圈" prop="area">
              <el-input v-model="form.area" placeholder="请输入商圈" maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <!-- 新增：店铺类型表单项 -->
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
          <el-col :span="8">
            <el-form-item label="营业时间" prop="openHours">
              <el-input v-model="form.openHours" placeholder="例如：10:00-22:00" maxlength="20" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="地址" prop="address">
              <el-input v-model="form.address" placeholder="请输入详细地址" maxlength="100" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="均价" prop="avgPrice">
              <el-input-number
                v-model="form.avgPrice"
                placeholder="请输入均价"
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
        </el-row>

        <!-- 图片上传部分 -->
        <el-row>
          <el-col :span="24">
            <el-form-item label="商铺图片">
              <imageUpload v-model="form.images" :fileSize="2" :limit="1"  />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 简化版地图选点部分 -->
        <el-row>
          <el-col :span="24">
            <el-form-item label="店铺位置" required>
              <div class="location-selector">
                <div class="location-search">
                  <el-input
                    v-model="locationKeyword"
                    placeholder="输入地址搜索位置（如：北京市朝阳区）"
                    clearable
                    @clear="handleClearSearch"
                    @keyup.enter.native="handleSearchLocation"
                  >
                    <el-button
                      slot="append"
                      icon="el-icon-search"
                      @click="handleSearchLocation"
                      :loading="searchLoading"
                    >搜索</el-button>
                  </el-input>
                  <div class="search-tips">
                    <span>支持搜索具体地址、地标建筑、商圈名称等</span>
                  </div>
                </div>

                <div class="map-container">
                  <div id="map-container" class="map"></div>
                  <div class="map-actions">
                    <el-button
                      size="mini"
                      icon="el-icon-location"
                      @click="handleLocateMe"
                      :loading="locating"
                    >我的位置</el-button>
                    <el-button
                      size="mini"
                      icon="el-icon-aim"
                      @click="handleConfirmLocation"
                      type="primary"
                      :disabled="!form.x || !form.y"
                    >确认位置</el-button>
                  </div>
                </div>

                <div class="location-info">
                  <el-alert
                    v-if="selectedLocation.address"
                    :title="`已选择位置：${selectedLocation.address}`"
                    type="success"
                    :closable="false"
                    show-icon
                  />
                  <el-alert
                    v-else
                    title="请在地图上点击选择店铺位置，或使用搜索功能"
                    type="info"
                    :closable="false"
                    show-icon
                  />

                  <el-alert
                    v-if="locationError"
                    :title="locationError"
                    type="warning"
                    :closable="true"
                    show-icon
                    @close="locationError = ''"
                  />
                </div>

                <el-row :gutter="10">
                  <el-col :span="12">
                    <el-form-item label="经度" prop="x">
                      <el-input
                        v-model="form.x"
                        placeholder="经度"
                        readonly
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="纬度" prop="y">
                      <el-input
                        v-model="form.y"
                        placeholder="纬度"
                        readonly
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
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
    <el-dialog title="店铺详情" :visible.sync="detailOpen" width="800px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="商铺名称">{{ detailForm.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="商圈">{{ detailForm.area || '-' }}</el-descriptions-item>
        <!-- 新增：详情显示店铺类型 -->
        <el-descriptions-item label="店铺类型">{{ getShopTypeName(detailForm.typeId) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="营业时间">{{ detailForm.openHours || '-' }}</el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ detailForm.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="均价">
          <span v-if="detailForm.avgPrice">¥{{ detailForm.avgPrice }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="销量">{{ detailForm.sold || 0 }}</el-descriptions-item>
        <el-descriptions-item label="评分">
          <span v-if="detailForm.score">{{ (detailForm.score / 10).toFixed(1) }}分</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="评论数量">{{ detailForm.comments || 0 }}</el-descriptions-item>
        <el-descriptions-item label="经度">{{ detailForm.x || '-' }}</el-descriptions-item>
        <el-descriptions-item label="纬度">{{ detailForm.y || '-' }}</el-descriptions-item>
        <el-descriptions-item label="商铺图片" :span="2">
          <div class="detail-images">
            <el-image
              v-for="(image, index) in getImageList(detailForm.images)"
              :key="index"
              :src="image"
              fit="cover"
              style="width: 100px; height: 100px; margin-right: 10px; border-radius: 4px;"
              :preview-src-list="getImageList(detailForm.images)"
            />
            <span v-if="!detailForm.images || !detailForm.images.trim()">暂无图片</span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detailForm.createTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detailForm.updateTime || '-' }}</el-descriptions-item>
      </el-descriptions>
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailOpen = false">关 闭</el-button>
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
      return
    }

    const script = document.createElement('script')
    // 使用最稳定的配置，只加载基础功能
    script.src = `https://webapi.amap.com/maps?v=1.4.15&key=60bdbf9b9cf98025c397ee43e8c25871`
    script.onload = () => {
      console.log('高德地图基础版加载成功')
      // 动态加载必要的插件
      const pluginScript = document.createElement('script')
      pluginScript.src = 'https://webapi.amap.com/maps?v=1.4.15&key=60bdbf9b9cf98025c397ee43e8c25871&plugin=AMap.Geocoder,AMap.PlaceSearch'
      pluginScript.onload = () => {
        console.log('地图插件加载成功')
        resolve(window.AMap)
      }
      pluginScript.onerror = () => {
        console.log('地图插件加载失败，使用基础功能')
        resolve(window.AMap) // 即使插件加载失败，也继续使用基础功能
      }
      document.head.appendChild(pluginScript)
    }
    script.onerror = (error) => {
      console.error('地图加载失败:', error)
      reject(new Error('地图加载失败'))
    }
    document.head.appendChild(script)
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

    /** 获取第一张图片 */
    getFirstImage(images) {
      if (!images) return ''
      const imageList = images.split(',').filter(img => img.trim())
      console.log(imageList)
      return 'http://192.168.182.20:9000/smart-live'+imageList[0] || ''
    },

    /** 获取图片列表 */
    getImageList(images) {
      if (!images) return []
      return images.split(',').filter(img => img.trim())
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
          if (!this.form.address) {
            this.form.address = address
          }
        } else {
          this.selectedLocation = {
            address: `位置 (${lng.toFixed(6)}, ${lat.toFixed(6)})`,
            lng: lng,
            lat: lat
          }
          this.form.x = lng
          this.form.y = lat
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
          this.locationError = '未找到相关地点，请尝试其他关键词'
          this.$message.error('未找到相关地点')
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

<style scoped>
.el-form-item__tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.image-uploader {
  width: 100%;
}

.image-uploader ::v-deep .el-upload--picture-card {
  width: 100px;
  height: 100px;
  line-height: 100px;
}

.image-uploader ::v-deep .el-upload-list--picture-card .el-upload-list__item {
  width: 100px;
  height: 100px;
}

.no-image {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  background-color: #f5f7fa;
}

/* 搜索相关样式 */
.search-tips {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.location-selector {
  width: 100%;
}

.location-search {
  margin-bottom: 15px;
}

.map-container {
  position: relative;
  height: 300px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  margin-bottom: 15px;
}

.map {
  width: 100%;
  height: 100%;
}

.map-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
}

.location-info {
  margin-bottom: 15px;
}

.detail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

@media (max-width: 768px) {
  .map-container {
    height: 250px;
  }

  .map-actions {
    position: relative;
    top: 0;
    right: 0;
    margin-bottom: 10px;
  }

  .map-actions .el-button {
    margin-bottom: 5px;
  }
}
</style>
