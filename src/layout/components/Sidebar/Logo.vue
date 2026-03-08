<template>
  <div class="sidebar-logo-container" :class="[{'collapse':collapse}, sideTheme]" :style="{ backgroundColor: sideTheme === 'theme-dark' ? variables.menuBackground : variables.menuLightBackground }">
    <transition name="sidebarLogoFade">
      <router-link v-if="collapse" key="collapse" class="sidebar-logo-link" to="/">
        <img v-if="logo" :src="logo" class="sidebar-logo" />
        <h1 v-else class="sidebar-title">{{ title }} </h1>
      </router-link>
      <router-link v-else key="expand" class="sidebar-logo-link" to="/">
        <img v-if="logo" :src="logo" class="sidebar-logo" />
        <h1 class="sidebar-title">{{ title }} </h1>
      </router-link>
    </transition>
  </div>
</template>

<script>
import logoImg from '@/assets/logo/logo.png'
import variables from '@/assets/styles/variables.scss'

export default {
  name: 'SidebarLogo',
  props: {
    collapse: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    variables() {
      return variables
    },
    sideTheme() {
      return this.$store.state.settings.sideTheme
    }
  },
  data() {
    return {
      title: process.env.VUE_APP_TITLE,
      logo: logoImg
    }
  }
}
</script>

<style lang="scss" scoped>
.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 64px;
  line-height: 64px;
  text-align: center;
  overflow: hidden;

  // 底部渐变分隔线
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 16px;
    right: 16px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  }

  & .sidebar-logo-link {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px;

    & .sidebar-logo {
      width: 34px;
      height: 34px;
      vertical-align: middle;
      margin-right: 10px;
      filter: drop-shadow(0 0 6px rgba(99, 135, 255, 0.4));
      transition: filter 0.3s;
    }

    &:hover .sidebar-logo {
      filter: drop-shadow(0 0 10px rgba(99, 135, 255, 0.6));
    }

    & .sidebar-title {
      display: inline-block;
      margin: 0;
      color: #fff;
      font-weight: 600;
      line-height: 64px;
      font-size: 15px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      vertical-align: middle;
      letter-spacing: 1px;
      background: linear-gradient(135deg, #ffffff 0%, rgba(185, 195, 215, 0.9) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  &.collapse {
    .sidebar-logo {
      margin-right: 0px;
    }
  }

  // ============================
  // 浅色主题适配
  // ============================
  &.theme-light {
    // 浅色底部分隔线
    &::after {
      background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.06), transparent);
    }

    .sidebar-logo {
      filter: drop-shadow(0 0 4px rgba(64, 128, 255, 0.25));
    }

    .sidebar-logo-link:hover .sidebar-logo {
      filter: drop-shadow(0 0 8px rgba(64, 128, 255, 0.4));
    }

    .sidebar-title {
      background: linear-gradient(135deg, #1a1e2e 0%, #3a4565 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }
}
</style>
