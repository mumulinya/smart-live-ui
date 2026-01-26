<template>
  <el-image
    :src="`${realSrc}`"
    fit="cover"
    :style="`width:${realWidth};height:${realHeight};`"
    :preview-src-list="realSrcList"
  >
    <div slot="error" class="image-slot">
      <i class="el-icon-picture-outline"></i>
    </div>
  </el-image>
</template>

<script>
export default {
  name: "ImagePreview",
  props: {
    src: {
      type: String,
      default: ""
    },
    width: {
      type: [Number, String],
      default: ""
    },
    height: {
      type: [Number, String],
      default: ""
    }
  },
  computed: {
    realSrc() {
      if (!this.src) {
        return
      }
      let real_src = this.src.split(",")[0]
      if (real_src) {
          if (real_src.startsWith('http') || real_src.startsWith('https')) {
              // pass
          } else {
              let base = process.env.VUE_APP_FILE_BASE_API || ''
              if (base.endsWith('/')) base = base.slice(0, -1)
              
              let url = real_src
              if (!url.startsWith('/')) url = '/' + url
              
              let fullUrl = base + url
              if (fullUrl.includes('/smart-live/smart-live')) {
                  fullUrl = fullUrl.replace('/smart-live/smart-live', '/smart-live')
              }
              real_src = fullUrl
          }
      }
      return real_src 
    },
    realSrcList() {
      if (!this.src) {
        return
      }
      let real_src_list = this.src.split(",")
      let srcList = []
      real_src_list.forEach(item => {
        if (item.trim()) {
            let url = item.trim()
            if (url.startsWith('http') || url.startsWith('https')) {
               // pass
            } else {
               let base = process.env.VUE_APP_FILE_BASE_API || ''
               if (base.endsWith('/')) base = base.slice(0, -1)
               
               if (!url.startsWith('/')) url = '/' + url
               
               let fullUrl = base + url
               if (fullUrl.includes('/smart-live/smart-live')) {
                   fullUrl = fullUrl.replace('/smart-live/smart-live', '/smart-live')
               }
               url = fullUrl
            }
            srcList.push(url)
        }
      })
      return srcList
    },
    realWidth() {
      return typeof this.width == "string" ? this.width : `${this.width}px`
    },
    realHeight() {
      return typeof this.height == "string" ? this.height : `${this.height}px`
    }
  },
}
</script>

<style lang="scss" scoped>
.el-image {
  border-radius: 5px;
  background-color: #ebeef5;
  box-shadow: 0 0 5px 1px #ccc;
  ::v-deep .el-image__inner {
    transition: all 0.3s;
    cursor: pointer;
    &:hover {
      transform: scale(1.2);
    }
  }
  ::v-deep .image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    color: #909399;
    font-size: 30px;
  }
}
</style>
