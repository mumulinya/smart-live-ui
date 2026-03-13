<template>
  <div class="app-container ai-page" v-loading="isShopLoading">
    <div class="ai-layout">
      <aside class="ai-sidebar">
        <section class="sidebar-section">
          <div class="section-title">当前店铺</div>
          <el-select
            v-model="selectedShopId"
            class="shop-select"
            clearable
            filterable
            placeholder="请选择店铺"
            size="small"
            @change="handleShopChange"
          >
            <el-option
              v-for="shop in shopOptions"
              :key="shop.id"
              :label="shop.name"
              :value="shop.id"
            />
          </el-select>
        </section>

        <section class="sidebar-section">
          <div class="section-title">AI 功能</div>
          <button
            v-for="feature in featureOptions"
            :key="feature.type"
            class="feature-item"
            :class="{ active: feature.type === activeType }"
            type="button"
            @click="handleFeatureChange(feature.type)"
          >
            <span class="feature-icon" :class="feature.iconTone">{{ feature.badge }}</span>
            <span class="feature-text">{{ feature.title }}</span>
          </button>
        </section>

        <section class="session-section" v-loading="isSessionLoading">
          <div class="session-header">
            <div class="section-title">历史会话</div>
            <el-button
              plain
              size="mini"
              type="primary"
              :disabled="!hasSelectedShop || isMessageLoading"
              @click="handleCreateSession"
            >
              + 新建
            </el-button>
          </div>

          <div v-if="!hasSelectedShop" class="session-empty">
            选择店铺后可查看会话
          </div>
          <div v-else-if="!visibleSessions.length" class="session-empty">
            暂无会话
          </div>
          <div v-else class="session-list">
            <div
              v-for="session in visibleSessions"
              :key="session.id"
              class="session-item"
              :class="{ active: session.id === currentSessionId }"
              @click="handleSessionSelect(session.id)"
            >
              <div class="session-item-header">
                <el-input
                  v-if="editingSessionId === session.id"
                  :ref="'sessionTitleInput_' + session.id"
                  v-model="editingTitle"
                  class="session-title-input"
                  maxlength="30"
                  size="mini"
                  @click.native.stop
                  @keydown.enter.native.prevent="submitSessionTitleEdit"
                  @keydown.esc.native.prevent="cancelSessionTitleEdit"
                  @blur="submitSessionTitleEdit"
                />
                <span
                  v-else
                  class="session-name editable"
                  title="点击修改标题"
                  @click.stop="startSessionTitleEdit(session)"
                >{{ session.title }}</span>
                <el-button
                  class="session-delete"
                  icon="el-icon-delete"
                  size="mini"
                  type="text"
                  @click.stop="handleDeleteSession(session.id)"
                />
              </div>
              <div class="session-meta">
                <span>{{ getSessionTypeText(session) }}</span>
                <span>{{ formatSessionTime(session.updatedAt) }}</span>
              </div>
            </div>
          </div>
        </section>
      </aside>

      <section class="ai-main">
        <header class="main-header">
          <div class="main-header-content">
            <div class="main-title">{{ activeFeature.title }}</div>
            <div class="main-subtitle">
              {{ hasSelectedShop ? activeFeature.subtitle : '请先选择店铺' }}
            </div>
          </div>
          <div v-if="currentSession && hasSelectedShop" class="current-session-tag">
            {{ currentSession.title }}
          </div>
        </header>

        <div ref="messageListRef" class="message-list" v-loading="isMessageLoading">
          <div v-if="!hasSelectedShop" class="status-card">
            <div class="status-mark">店</div>
            <div class="status-title">请先选择店铺</div>
            <div class="status-text">选择店铺后即可开始使用 AI 助手。</div>
          </div>
          <div v-else-if="!currentSession" class="status-card">
            <div class="status-mark">AI</div>
            <div class="status-title">暂无会话</div>
            <div class="status-text">点击左侧“新建”或直接发送首条消息开始新的 AI 对话。</div>
          </div>
          <template v-else-if="!currentSession.messages.length">
            <div class="message-row ai">
              <div class="ai-avatar">AI</div>
              <div class="message-bubble ai">
                <div class="welcome-title">你好，当前功能：{{ activeFeature.title }}</div>
                <div class="welcome-text">{{ activeFeature.subtitle }}</div>
              </div>
            </div>
          </template>
          <template v-else>
            <div
              v-for="(message, index) in currentSession.messages"
              :key="(message.id || currentSession.id) + '_' + index"
              class="message-row"
              :class="message.role === 'user' ? 'user' : 'ai'"
            >
              <template v-if="message.role === 'ai'">
                <div class="ai-avatar">AI</div>
                <div class="message-bubble ai">
                  <div
                    v-if="!message.content && isStreaming && isStreamingMessage(index)"
                    class="typing-indicator"
                  >
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                  </div>
                  <div v-else class="message-content">{{ message.content }}</div>
                </div>
              </template>
              <template v-else>
                <div class="message-bubble user">
                  <div class="message-content">{{ message.content }}</div>
                </div>
              </template>
            </div>
          </template>
        </div>

        <footer class="input-area">
          <div class="input-panel" :class="{ disabled: !canInput }">
            <el-input
              v-model="inputMessage"
              :autosize="{ minRows: 2, maxRows: 5 }"
              :disabled="!canInput"
              :placeholder="hasSelectedShop ? activeFeature.placeholder : '请先选择店铺'"
              class="message-input"
              resize="none"
              type="textarea"
              @keydown.native="handleInputKeydown"
            />
            <el-button
              class="send-button"
              type="primary"
              :disabled="!canSubmit"
              @click="handleSendMessage"
            >
              发送
            </el-button>
          </div>
          <div class="input-hint">
            {{ isStreaming ? 'AI 正在回复中，请稍候...' : 'Enter 发送，Shift + Enter 换行' }}
          </div>
        </footer>
      </section>
    </div>
  </div>
</template>

<script>
import {
  createAiChatStream,
  createMerchantSession,
  deleteMerchantSession,
  getMerchantSessionMessages,
  getShopOptions,
  listMerchantSessions,
  updateMerchantSessionTitle
} from '@/api/ai/assistant'

const FEATURE_OPTIONS = [
  {
    type: 'reply',
    title: '评价智能回复',
    subtitle: 'AI 帮你生成自然、专业的评价回复，提高店铺互动效率。',
    placeholder: '输入需要回复的评价内容，或告诉 AI 你的回复要求...',
    badge: '评',
    iconTone: 'tone-blue'
  },
  {
    type: 'analysis',
    title: '经营数据分析',
    subtitle: 'AI 分析店铺销售、评分趋势并给出运营建议。',
    placeholder: '输入想分析的经营问题，例如销量、评分或趋势变化...',
    badge: '析',
    iconTone: 'tone-green'
  },
  {
    type: 'copywrite',
    title: '商品文案生成',
    subtitle: 'AI 帮你生成商品卖点、推广文案和营销描述。',
    placeholder: '输入商品名称、卖点或希望生成的文案方向...',
    badge: '文',
    iconTone: 'tone-orange'
  },
  {
    type: 'suggest',
    title: '经营建议',
    subtitle: '结合店铺经营情况，给出可执行的优化建议。',
    placeholder: '输入你目前遇到的经营问题，获取可落地建议...',
    badge: '策',
    iconTone: 'tone-purple'
  }
]

const FEATURE_MAP = FEATURE_OPTIONS.reduce(function (result, item) {
  result[item.type] = item
  return result
}, {})

export default {
  name: 'BusinessAiAssistant',
  data() {
    return {
      featureOptions: FEATURE_OPTIONS,
      shopOptions: [],
      isShopLoading: false,
      isSessionLoading: false,
      isMessageLoading: false,
      selectedShopId: null,
      activeType: FEATURE_OPTIONS[0].type,
      sessions: [],
      currentSessionId: null,
      inputMessage: '',
      isStreaming: false,
      activeStreamController: null,
      activeStreamPromise: null,
      activeStreamSessionId: null,
      activeStreamMessageIndex: -1,
      streamCharQueue: '',
      streamCharTimer: null,
      editingSessionId: null,
      editingTitle: '',
      isSavingSessionTitle: false
    }
  },
  computed: {
    activeFeature() {
      return this.getFeatureConfig(this.activeType)
    },
    hasSelectedShop() {
      return this.selectedShopId !== null && this.selectedShopId !== undefined && this.selectedShopId !== ''
    },
    visibleSessions() {
      return this.sessions.slice().sort(function (left, right) {
        if (right.updatedAt !== left.updatedAt) {
          return right.updatedAt - left.updatedAt
        }
        return Number(right.id) - Number(left.id)
      })
    },
    currentSession() {
      if (this.currentSessionId === null || this.currentSessionId === undefined || this.currentSessionId === '') {
        return null
      }
      return this.findSession(this.currentSessionId)
    },
    canInput() {
      return this.hasSelectedShop && !this.isStreaming && !this.isSessionLoading && !this.isMessageLoading
    },
    canSubmit() {
      return this.canInput && !!this.inputMessage.trim()
    }
  },
  created() {
    this.loadShopOptions()
  },
  beforeDestroy() {
    if (this.activeStreamController) {
      this.activeStreamController.abort()
    }
    this.clearStreamTimer()
  },
  methods: {
    async loadShopOptions() {
      this.isShopLoading = true
      try {
        const response = await getShopOptions()
        const options = this.normalizeShopOptions(response)
        this.shopOptions = options

        if (options.length === 1) {
          this.selectedShopId = options[0].id
          await this.applyShopSelection(options[0].id)
        }
      } catch (error) {
        this.shopOptions = []
      } finally {
        this.isShopLoading = false
      }
    },
    normalizeShopOptions(response) {
      const data = this.readResponseData(response)
      if (!Array.isArray(data)) {
        return []
      }
      return data.map(function (item) {
        return {
          id: item.id,
          name: item.name
        }
      })
    },
    normalizeSessionList(response) {
      const data = this.readResponseData(response)
      if (!Array.isArray(data)) {
        return []
      }

      const currentMap = {}
      for (let index = 0; index < this.sessions.length; index++) {
        currentMap[this.sessions[index].id] = this.sessions[index]
      }

      return data.map((item) => {
        const existing = currentMap[item.id] || {}
        const createdAt = this.normalizeTimestamp(item.createTime) || existing.createdAt || Date.now()
        const updatedAt = this.normalizeTimestamp(item.updateTime) || existing.updatedAt || createdAt
        return {
          id: item.id,
          shopId: item.shopId || this.selectedShopId,
          title: item.title || existing.title || '新会话',
          type: existing.type || '',
          createdAt: createdAt,
          updatedAt: updatedAt,
          messages: Array.isArray(existing.messages) ? existing.messages : []
        }
      })
    },
    normalizeMessageList(response) {
      const data = this.readResponseData(response)
      if (!Array.isArray(data)) {
        return []
      }
      return data.map((item) => {
        return {
          id: item.id,
          role: this.normalizeMessageRole(item.role),
          content: item.content || '',
          createTime: this.normalizeTimestamp(item.createTime)
        }
      })
    },
    normalizeMessageRole(role) {
      const normalizedRole = String(role || '').trim().toLowerCase()
      if (normalizedRole === 'user') {
        return 'user'
      }
      return 'ai'
    },
    normalizeTimestamp(value) {
      if (!value) {
        return 0
      }
      if (typeof value === 'number') {
        return value
      }
      if (Object.prototype.toString.call(value) === '[object Date]') {
        return value.getTime()
      }
      if (typeof value === 'string' && /^\d+$/.test(value)) {
        return Number(value)
      }
      const timestamp = Date.parse(String(value).replace(/-/g, '/'))
      return Number.isNaN(timestamp) ? 0 : timestamp
    },
    readResponseData(response) {
      if (response && Object.prototype.hasOwnProperty.call(response, 'data')) {
        return response.data
      }
      return response
    },
    readSessionId(response) {
      const data = this.readResponseData(response)
      if (data === null || data === undefined || data === '') {
        return null
      }
      return data
    },
    getFeatureConfig(type) {
      return FEATURE_MAP[type] || FEATURE_OPTIONS[0]
    },
    getSessionTypeText(session) {
      if (session && session.type) {
        return this.getFeatureConfig(session.type).title
      }
      return 'AI 会话'
    },
    formatSessionTime(timestamp) {
      if (!timestamp) {
        return '--'
      }

      const date = new Date(timestamp)
      const now = new Date()
      const isSameDay =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()

      if (isSameDay) {
        return [date.getHours(), date.getMinutes()]
          .map(function (value) {
            return String(value).padStart(2, '0')
          })
          .join(':')
      }

      return date.getMonth() + 1 + '/' + date.getDate()
    },
    findSession(sessionId) {
      for (let index = 0; index < this.sessions.length; index++) {
        if (String(this.sessions[index].id) === String(sessionId)) {
          return this.sessions[index]
        }
      }
      return null
    },
    upsertSession(session) {
      let targetIndex = -1
      for (let index = 0; index < this.sessions.length; index++) {
        if (String(this.sessions[index].id) === String(session.id)) {
          targetIndex = index
          break
        }
      }

      if (targetIndex === -1) {
        this.sessions.unshift(session)
        return
      }

      const merged = Object.assign({}, this.sessions[targetIndex], session)
      if (!Array.isArray(merged.messages)) {
        merged.messages = []
      }
      this.$set(this.sessions, targetIndex, merged)
    },
    async loadSessionsForShop(shopId) {
      this.isSessionLoading = true
      try {
        const response = await listMerchantSessions({ shopId: shopId })
        this.sessions = this.normalizeSessionList(response)
      } catch (error) {
        this.sessions = []
      } finally {
        this.isSessionLoading = false
      }
    },
    async loadSessionMessages(sessionId) {
      const session = this.findSession(sessionId)
      if (!session) {
        return
      }

      this.isMessageLoading = true
      try {
        const response = await getMerchantSessionMessages(sessionId)
        session.messages = this.normalizeMessageList(response)
        session.updatedAt = session.updatedAt || Date.now()
      } catch (error) {
        session.messages = []
      } finally {
        this.isMessageLoading = false
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }
    },
    async createAndSelectSession(type) {
      const sessionType = type || this.activeType
      const response = await createMerchantSession({
        shopId: this.selectedShopId
      })
      const sessionId = this.readSessionId(response)
      if (sessionId === null || sessionId === undefined || sessionId === '') {
        throw new Error('创建会话失败')
      }

      const now = Date.now()
      const session = {
        id: sessionId,
        shopId: this.selectedShopId,
        title: '新会话',
        type: sessionType,
        createdAt: now,
        updatedAt: now,
        messages: []
      }

      this.upsertSession(session)
      this.currentSessionId = sessionId
      this.activeType = sessionType
      return this.findSession(sessionId)
    },
    async applyShopSelection(value) {
      this.cancelSessionTitleEdit()
      this.sessions = []
      this.currentSessionId = null
      this.inputMessage = ''

      if (value === null || value === undefined || value === '') {
        return
      }

      await this.loadSessionsForShop(value)
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },
    async handleShopChange(value) {
      try {
        await this.runAfterAbort(async () => {
          await this.applyShopSelection(value)
        })
      } catch (error) {
      }
    },
    async handleFeatureChange(type) {
      if (type === this.activeType) {
        return
      }

      await this.runAfterAbort(() => {
        this.activeType = type
        if (this.currentSession) {
          this.currentSession.type = type
        }
      })
    },
    async handleCreateSession() {
      if (!this.hasSelectedShop) {
        return
      }

      try {
        await this.runAfterAbort(async () => {
          this.cancelSessionTitleEdit()
          this.inputMessage = ''
          await this.createAndSelectSession(this.activeType)
        })
      } catch (error) {
      }
    },
    async handleSessionSelect(sessionId) {
      const targetSession = this.findSession(sessionId)
      if (!targetSession) {
        return
      }

      try {
        await this.runAfterAbort(async () => {
          this.cancelSessionTitleEdit()
          this.currentSessionId = sessionId
          this.inputMessage = ''
          if (targetSession.type) {
            this.activeType = targetSession.type
          }
          await this.loadSessionMessages(sessionId)
        })
      } catch (error) {
      }
    },
    async handleDeleteSession(sessionId) {
      try {
        await this.runAfterAbort(async () => {
          await deleteMerchantSession(sessionId)
          await this.afterDeleteSession(sessionId)
        })
      } catch (error) {
      }
    },
    async afterDeleteSession(sessionId) {
      const deletingCurrent = String(sessionId) === String(this.currentSessionId)
      this.sessions = this.sessions.filter(function (item) {
        return String(item.id) !== String(sessionId)
      })

      if (!deletingCurrent) {
        return
      }

      this.inputMessage = ''

      if (this.visibleSessions.length) {
        const nextSession = this.visibleSessions[0]
        this.currentSessionId = nextSession.id
        if (nextSession.type) {
          this.activeType = nextSession.type
        }
        await this.loadSessionMessages(nextSession.id)
        return
      }

      this.currentSessionId = null
    },
    handleInputKeydown(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        this.handleSendMessage()
      }
    },
    async ensureSessionForSend() {
      if (this.currentSession) {
        return this.currentSession
      }
      return this.createAndSelectSession(this.activeType)
    },
    buildSessionTitle(message) {
      const title = String(message || '').trim().slice(0, 12)
      return title || '新会话'
    },
    async syncSessionTitle(sessionId, title) {
      if (!sessionId || !title) {
        return
      }
      try {
        await updateMerchantSessionTitle(sessionId, { title: title })
      } catch (error) {
      }
    },
    startSessionTitleEdit(session) {
      if (!session || !session.id) {
        return
      }
      this.editingSessionId = session.id
      this.editingTitle = session.title || ''
      this.$nextTick(() => {
        const inputRef = this.$refs['sessionTitleInput_' + session.id]
        if (!inputRef) {
          return
        }
        if (typeof inputRef.focus === 'function') {
          inputRef.focus()
        }
        if (typeof inputRef.select === 'function') {
          inputRef.select()
          return
        }
        if (inputRef.$refs && inputRef.$refs.input && typeof inputRef.$refs.input.select === 'function') {
          inputRef.$refs.input.select()
          return
        }
        if (inputRef.$refs && inputRef.$refs.textarea && typeof inputRef.$refs.textarea.select === 'function') {
          inputRef.$refs.textarea.select()
        }
      })
    },
    cancelSessionTitleEdit() {
      this.editingSessionId = null
      this.editingTitle = ''
    },
    async submitSessionTitleEdit() {
      if (!this.editingSessionId || this.isSavingSessionTitle) {
        return
      }

      const session = this.findSession(this.editingSessionId)
      const title = String(this.editingTitle || '').trim()

      if (!session) {
        this.cancelSessionTitleEdit()
        return
      }

      if (!title) {
        this.$message.warning('标题不能为空')
        this.cancelSessionTitleEdit()
        return
      }

      if (title === session.title) {
        this.cancelSessionTitleEdit()
        return
      }

      const previousTitle = session.title
      this.isSavingSessionTitle = true
      session.title = title
      session.updatedAt = Date.now()

      try {
        await updateMerchantSessionTitle(session.id, { title: title })
        this.cancelSessionTitleEdit()
      } catch (error) {
        session.title = previousTitle
        this.$message.error(error.message || '修改标题失败')
      } finally {
        this.isSavingSessionTitle = false
      }
    },
    async handleSendMessage() {
      if (!this.canSubmit) {
        return
      }

      const message = this.inputMessage.trim()
      let session

      try {
        session = await this.ensureSessionForSend()
      } catch (error) {
        return
      }

      if (!session) {
        return
      }

      const hasUserMessage = (session.messages || []).some(function (item) {
        return item.role === 'user' && item.content
      })
      const now = Date.now()

      this.inputMessage = ''
      session.type = this.activeType
      session.updatedAt = now
      session.messages.push({
        role: 'user',
        content: message,
        createTime: now
      })

      if (!hasUserMessage) {
        session.title = this.buildSessionTitle(message)
        this.syncSessionTitle(session.id, session.title)
      }

      session.messages.push({
        role: 'ai',
        content: '',
        createTime: now
      })

      this.beginStreamState(session.id, session.messages.length - 1)
      this.$nextTick(() => {
        this.scrollToBottom()
      })

      const streamTask = createAiChatStream(
        {
          sessionId: session.id,
          shopId: session.shopId,
          type: this.activeType,
          message: message
        },
        {
          onChunk: (chunk) => {
            this.enqueueStreamChunk(chunk)
          }
        }
      )

      this.activeStreamController = streamTask.controller
      this.activeStreamPromise = streamTask.promise

      try {
        await streamTask.promise
        this.flushStreamQueue()
        this.removeEmptyStreamingMessage()
      } catch (error) {
        const aborted = this.isAbortError(error)
        this.flushStreamQueue()
        this.removeEmptyStreamingMessage()

        if (!aborted) {
          this.$message.error(error.message || 'AI 回复失败')
        }
      } finally {
        this.endStreamState()
      }
    },
    beginStreamState(sessionId, messageIndex) {
      this.isStreaming = true
      this.activeStreamSessionId = sessionId
      this.activeStreamMessageIndex = messageIndex
      this.streamCharQueue = ''
      this.clearStreamTimer()
    },
    endStreamState() {
      this.clearStreamTimer()
      this.streamCharQueue = ''
      this.isStreaming = false
      this.activeStreamController = null
      this.activeStreamPromise = null
      this.activeStreamSessionId = null
      this.activeStreamMessageIndex = -1
    },
    enqueueStreamChunk(text) {
      if (!text) {
        return
      }

      this.streamCharQueue += text
      if (!this.streamCharTimer) {
        this.startStreamTimer()
      }
    },
    startStreamTimer() {
      this.streamCharTimer = setInterval(() => {
        if (!this.streamCharQueue) {
          return
        }

        const session = this.findSession(this.activeStreamSessionId)
        if (!session || this.activeStreamMessageIndex < 0) {
          this.clearStreamTimer()
          this.streamCharQueue = ''
          return
        }

        const targetMessage = session.messages[this.activeStreamMessageIndex]
        if (!targetMessage) {
          this.clearStreamTimer()
          this.streamCharQueue = ''
          return
        }

        const step = this.streamCharQueue.length > 18 ? 3 : this.streamCharQueue.length > 8 ? 2 : 1
        targetMessage.content += this.streamCharQueue.slice(0, step)
        this.streamCharQueue = this.streamCharQueue.slice(step)
        session.updatedAt = Date.now()
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }, 24)
    },
    flushStreamQueue() {
      if (!this.streamCharQueue) {
        return
      }

      const session = this.findSession(this.activeStreamSessionId)
      if (!session || this.activeStreamMessageIndex < 0) {
        this.streamCharQueue = ''
        return
      }

      const targetMessage = session.messages[this.activeStreamMessageIndex]
      if (!targetMessage) {
        this.streamCharQueue = ''
        return
      }

      targetMessage.content += this.streamCharQueue
      this.streamCharQueue = ''
      session.updatedAt = Date.now()
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },
    removeEmptyStreamingMessage() {
      const session = this.findSession(this.activeStreamSessionId)
      if (!session || this.activeStreamMessageIndex < 0) {
        return
      }

      const targetMessage = session.messages[this.activeStreamMessageIndex]
      if (!targetMessage || targetMessage.content) {
        return
      }

      session.messages.splice(this.activeStreamMessageIndex, 1)
      session.updatedAt = Date.now()
    },
    clearStreamTimer() {
      if (this.streamCharTimer) {
        clearInterval(this.streamCharTimer)
        this.streamCharTimer = null
      }
    },
    isAbortError(error) {
      return !!(
        error &&
        (error.name === 'AbortError' ||
          error.code === 20 ||
          error.message === 'Aborted' ||
          error.message === 'The user aborted a request.')
      )
    },
    async abortActiveStream() {
      if (!this.activeStreamController) {
        return
      }

      const activePromise = this.activeStreamPromise
      this.activeStreamController.abort()

      if (activePromise) {
        try {
          await activePromise
        } catch (error) {
        }
      }
    },
    async runAfterAbort(action) {
      if (this.isStreaming) {
        await this.abortActiveStream()
      }

      if (typeof action === 'function') {
        await Promise.resolve(action())
      }

      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },
    isStreamingMessage(index) {
      return (
        this.isStreaming &&
        this.currentSession &&
        String(this.currentSession.id) === String(this.activeStreamSessionId) &&
        index === this.activeStreamMessageIndex
      )
    },
    scrollToBottom() {
      const container = this.$refs.messageListRef
      if (!container) {
        return
      }
      container.scrollTop = container.scrollHeight
    }
  }
}
</script>

<style scoped>
.ai-page {
  padding: 20px;
  min-height: calc(100vh - 84px);
  background: #f5f7fa;
}

.ai-layout {
  display: flex;
  min-height: calc(100vh - 124px);
  background: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(31, 45, 61, 0.06);
}

.ai-sidebar {
  width: 300px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #ebeef5;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.sidebar-section {
  padding: 20px;
  border-bottom: 1px solid #f0f2f5;
}

.section-title {
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
}

.shop-select {
  width: 100%;
}

.feature-item {
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 10px;
  padding: 12px 14px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.feature-item:last-child {
  margin-bottom: 0;
}

.feature-item:hover {
  background: #f5f9ff;
  border-color: #d9ecff;
}

.feature-item.active {
  background: #ecf5ff;
  border-color: #b3d8ff;
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.12);
}

.feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-right: 12px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
}

.feature-text {
  font-size: 14px;
  color: #303133;
}

.tone-blue {
  color: #409eff;
  background: #ecf5ff;
}

.tone-green {
  color: #67c23a;
  background: #f0f9eb;
}

.tone-orange {
  color: #e6a23c;
  background: #fdf6ec;
}

.tone-purple {
  color: #8e6af3;
  background: #f4f1ff;
}

.session-section {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 20px;
}

.session-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.session-list {
  flex: 1;
  overflow-y: auto;
}

.session-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 120px;
  padding: 24px 16px;
  border: 1px dashed #dcdfe6;
  border-radius: 12px;
  color: #909399;
  text-align: center;
  background: #fafafa;
}

.session-item {
  width: 100%;
  margin-bottom: 10px;
  padding: 14px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.session-item:hover {
  border-color: #dcdfe6;
  background: #f8fbff;
}

.session-item.active {
  border-color: #b3d8ff;
  background: #f5faff;
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.12);
}

.session-item-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.session-name {
  flex: 1;
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-name.editable {
  cursor: text;
}

.session-name.editable:hover {
  color: #409eff;
}

.session-title-input {
  flex: 1;
}

.session-title-input /deep/ .el-input__inner {
  height: 30px;
  padding: 0 10px;
  border-radius: 8px;
}

.session-delete {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.session-item:hover .session-delete,
.session-item.active .session-delete {
  opacity: 1;
}

.session-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.ai-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  background: linear-gradient(180deg, #ffffff 0%, #f7f9fc 100%);
}

.main-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px;
  border-bottom: 1px solid #ebeef5;
  background: rgba(255, 255, 255, 0.92);
}

.main-title {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.main-subtitle {
  margin-top: 8px;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.current-session-tag {
  flex-shrink: 0;
  max-width: 220px;
  padding: 8px 14px;
  border: 1px solid #e4e7ed;
  border-radius: 999px;
  background: #f7faff;
  font-size: 12px;
  color: #409eff;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 28px;
}

.status-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 48px 24px;
  text-align: center;
  color: #606266;
}

.status-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: 18px;
  border-radius: 18px;
  background: #ecf5ff;
  color: #409eff;
  font-size: 24px;
  font-weight: 700;
}

.status-title {
  margin-bottom: 10px;
  font-size: 22px;
  font-weight: 700;
  color: #303133;
}

.status-text {
  font-size: 14px;
  color: #909399;
}

.message-row {
  display: flex;
  margin-bottom: 18px;
}

.message-row.user {
  justify-content: flex-end;
}

.message-row.ai {
  justify-content: flex-start;
  align-items: flex-start;
}

.ai-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin-right: 12px;
  border: 1px solid #d9ecff;
  border-radius: 50%;
  background: #ecf5ff;
  color: #409eff;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.message-bubble {
  max-width: 76%;
  padding: 16px 18px;
  border-radius: 18px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
}

.message-bubble.ai {
  border: 1px solid #e4e7ed;
  background: #ffffff;
  border-top-left-radius: 6px;
}

.message-bubble.user {
  border: 1px solid #409eff;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border-top-right-radius: 6px;
}

.welcome-title {
  margin-bottom: 10px;
  font-size: 17px;
  font-weight: 700;
  color: #303133;
}

.welcome-text {
  font-size: 14px;
  line-height: 1.8;
  color: #606266;
}

.message-content {
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-bubble.user .message-content {
  color: #ffffff;
}

.typing-indicator {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  margin-right: 6px;
  border-radius: 50%;
  background: #c0c4cc;
  animation: typing-bounce 1s infinite ease-in-out;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dot:nth-child(3) {
  margin-right: 0;
  animation-delay: 0.3s;
}

.input-area {
  padding: 20px 28px 24px;
  border-top: 1px solid #ebeef5;
  background: rgba(255, 255, 255, 0.96);
}

.input-panel {
  display: flex;
  align-items: flex-end;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 18px;
  background: #f9fafc;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input-panel:focus-within {
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.08);
}

.input-panel.disabled {
  background: #f5f7fa;
}

.message-input {
  flex: 1;
}

.message-input /deep/ .el-textarea__inner {
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  font-size: 14px;
  line-height: 1.8;
}

.send-button {
  min-width: 88px;
  margin-left: 14px;
  border-radius: 12px;
}

.input-hint {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
  text-align: center;
}

@keyframes typing-bounce {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.35;
  }

  50% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

@media (max-width: 1200px) {
  .ai-layout {
    flex-direction: column;
  }

  .ai-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #ebeef5;
  }

  .session-section {
    min-height: 240px;
  }

  .message-bubble {
    max-width: 88%;
  }
}

@media (max-width: 768px) {
  .ai-page {
    padding: 12px;
  }

  .main-header,
  .message-list,
  .input-area,
  .sidebar-section,
  .session-section {
    padding-left: 16px;
    padding-right: 16px;
  }

  .main-header {
    flex-direction: column;
  }

  .main-title {
    font-size: 20px;
  }

  .message-bubble {
    max-width: 100%;
  }

  .input-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .send-button {
    margin-top: 12px;
    margin-left: 0;
  }
}
</style>















