<template>
  <div class="app-container merchant-ai-page">
    <div class="assistant-shell" :style="assistantShellStyle" v-loading="isShopLoading">
      <header class="assistant-topbar">
        <div class="topbar-left">
          <div class="assistant-logo">AI 商家助手</div>
          <el-select
            v-model="selectedShopId"
            class="shop-select"
            clearable
            filterable
            size="mini"
            placeholder="请选择店铺以开启 AI 对话"
            @change="handleShopChange"
          >
            <el-option
              v-for="shop in shopOptions"
              :key="shop.id"
              :label="shop.name"
              :value="shop.id"
            />
          </el-select>
          <div class="topbar-divider"></div>
          <div class="feature-tabs">
            <button
              v-for="feature in featureOptions"
              :key="feature.type"
              class="feature-tab"
              :class="[{ active: feature.type === activeType }, feature.tone]"
              type="button"
              @click="handleFeatureChange(feature.type)"
            >
              <span class="feature-badge">{{ feature.badge }}</span>
              <span class="feature-label">{{ feature.title }}</span>
            </button>
          </div>
        </div>

        <div class="topbar-right">
          <div class="session-menu" ref="sessionMenu">
            <button
              class="session-trigger"
              type="button"
              :disabled="!hasSelectedShop || isSessionLoading"
              @click="toggleSessionDropdown"
            >
              <i class="el-icon-chat-line-square"></i>
              <span>会话历史</span>
              <i class="el-icon-arrow-down"></i>
            </button>
            <div v-if="sessionDropdownVisible" class="session-dropdown" @click.stop>
              <div class="dropdown-header">近期会话</div>
              <div v-if="!hasSelectedShop" class="dropdown-empty">请先选择店铺</div>
              <div v-else-if="isSessionLoading" class="dropdown-empty">正在加载历史会话...</div>
              <div v-else-if="!visibleSessions.length" class="dropdown-empty">暂无相关会话记录</div>
              <div v-else class="dropdown-list">
                <div
                  v-for="session in visibleSessions"
                  :key="session.id"
                  class="dropdown-item"
                  :class="{ active: String(session.id) === String(currentSessionId) }"
                  @click="handleSessionSelect(session.id)"
                >
                  <div class="dropdown-item-main">
                    <div class="dropdown-title">{{ session.title }}</div>
                    <div class="dropdown-meta">{{ formatSessionTime(session.updatedAt) }}</div>
                  </div>
                  <div class="dropdown-actions">
                    <button type="button" class="dropdown-action" @click.stop="handleRenameSession(session)">
                      <i class="el-icon-edit"></i>
                    </button>
                    <button type="button" class="dropdown-action delete" @click.stop="handleDeleteSession(session.id)">
                      <i class="el-icon-delete"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            class="new-session-btn"
            type="button"
            :disabled="!hasSelectedShop || isSessionLoading || isMessageLoading"
            @click="handleCreateSession"
          >
            + 新建会话
          </button>
        </div>
      </header>

      <div class="assistant-body">
        <aside :class="['assistant-left', activeType + '-panel']" v-loading="isPanelLoading">
          <template v-if="activeType === 'reply'">
            <div class="panel-header">
              <div class="panel-title">待回复评价</div>
              <div class="panel-subtitle">点击下方评价卡片，AI 将为您生成专业的回复建议。</div>
            </div>
            <div class="panel-filter-row">
              <el-input
                v-model="replyQuery"
                class="panel-search"
                prefix-icon="el-icon-search"
                size="mini"
                clearable
                placeholder="搜索评价内容或用户名..."
              />
            </div>
            <div class="panel-filter-chips">
              <button
                v-for="filter in replyFilters"
                :key="filter.value"
                class="filter-chip"
                :class="{ active: replyFilter === filter.value }"
                type="button"
                @click="replyFilter = filter.value"
              >
                {{ filter.label }}
              </button>
            </div>
            <div class="panel-summary-row">
              <span class="panel-summary-total">共 {{ replyTotal }} 条评价</span>
              <span class="panel-summary-badge">待回复 {{ pendingReplyCount }} 条</span>
            </div>
            <div v-if="!hasSelectedShop" class="panel-empty">请选择店铺以查看评价</div>
            <div v-else-if="!filteredReplyReviews.length" class="panel-empty">当前页暂无相关评价信息</div>
            <div v-else class="panel-list">
              <div
                v-for="review in filteredReplyReviews"
                :key="review.id"
                class="review-card"
                :class="{ active: String(review.id) === String(selectedReviewId) }"
                @click="handleReviewSelect(review)"
              >
                <div class="card-top">
                  <div class="card-rating" v-if="review.score > 0">
                    <span
                      v-for="starIndex in 5"
                      :key="'list_star_' + review.id + '_' + starIndex"
                      class="rating-star small"
                      :class="{ active: starIndex <= getScoreValue(review.score) }"
                    >★</span>
                  </div>
                  <div class="card-time">{{ formatReviewTime(review.createTime) }}</div>
                </div>
                <div class="card-content">{{ review.plainContent || "评价内容加载中..." }}</div>
                <div v-if="review.imageList && review.imageList.length" class="review-image-list compact">
                  <el-image
                    v-for="(image, imageIndex) in review.imageList"
                    :key="'list_image_' + review.id + '_' + imageIndex"
                    :src="image"
                    :preview-src-list="review.imageList"
                    fit="cover"
                    class="review-image-thumb compact"
                  />
                </div>
                <div class="card-bottom review-meta-line">
                  <span class="review-user-avatar">
                    <el-image
                      v-if="review.userIcon"
                      :src="review.userIcon"
                      :preview-src-list="[review.userIcon]"
                      fit="cover"
                      class="review-user-avatar-image"
                    />
                    <span v-else class="review-user-badge">{{ getNameAvatar(getReviewDisplayName(review)) }}</span>
                  </span>
                  <span class="review-user-name">{{ getReviewDisplayName(review) }}</span>
                  <span class="review-meta-sep">·</span>
                  <span class="review-source-name">{{ review.sourceName || "未知来源" }}</span>
                </div>
                <div class="card-actions">
                  <span class="card-tag" :class="review.isReplied ? 'success' : 'warning'">
                    {{ review.isReplied ? "已回复" : "待回复" }}
                  </span>
                  <button class="action-btn" type="button">
                    {{ review.isReplied ? "查看回复" : "生成回复" }}
                  </button>
                </div>
              </div>
            </div>
            <pagination
              v-show="hasSelectedShop && replyTotal > 0"
              class="panel-pagination"
              :total="replyPaginationTotal"
              :page.sync="replyPageNum"
              :limit.sync="replyPageSize"
              :page-sizes="[replyPageSize]"
              :pager-count="7"
              layout="total, prev, pager, next"
              :auto-scroll="false"
              @pagination="handleReplyPageChange"
            />
          </template>

          <template v-else-if="activeType === 'analysis'">
            <div class="panel-header">
              <div class="panel-title">经营状况分析</div>
              <div class="panel-subtitle">分析近期经营数据，并提供专业的改进建议。</div>
            </div>
            <div class="panel-filter-chips">
              <button
                v-for="item in analysisRanges"
                :key="item.value"
                class="filter-chip"
                :class="{ active: analysisRange === item.value }"
                type="button"
                @click="handleAnalysisRangeChange(item.value)"
              >
                {{ item.label }}
              </button>
            </div>
            <div class="panel-scroll-section">
              <div class="data-card-list placeholder-gap">
                <div v-for="card in analysisCards" :key="card.label" class="data-card">
                  <div class="data-label">{{ card.label }}</div>
                  <div class="data-value">{{ card.value }}</div>
                  <div class="data-sub">{{ card.sub }}</div>
                </div>
              </div>
              <div class="panel-note">注：以上数据仅供参考，AI 分析结果基于现有经营模型，请结合实际情况。</div>
            </div>
          </template>

          <template v-else-if="activeType === 'copywrite'">
            <div class="panel-header">
              <div class="panel-title">商品营销文案</div>
              <div class="panel-subtitle">为您的商品生成吸引人的营销文案。</div>
            </div>
            <div class="panel-filter-row">
              <el-input
                v-model="copywriteQuery"
                class="panel-search"
                prefix-icon="el-icon-search"
                size="mini"
                clearable
                placeholder="搜索商品名称或标题..."
              />
            </div>
            <div class="panel-summary-row">
              <span>共 {{ productTotal }} 个商品</span>
              <span>已选 {{ selectedProduct ? 1 : 0 }} 个</span>
            </div>
            <div v-if="!hasSelectedShop" class="panel-empty">请选择店铺以查看商品</div>
            <div v-else-if="!filteredProducts.length" class="panel-empty">当前页暂无商品信息</div>
            <div v-else class="panel-list">
              <div
                v-for="product in filteredProducts"
                :key="product.id"
                class="product-card"
                :class="{ active: String(product.id) === String(selectedProductId) }"
                @click="handleProductSelect(product)"
              >
                <div class="product-cover">
                  <el-image
                    v-if="product.coverImg"
                    :src="product.coverImg"
                    :preview-src-list="[product.coverImg]"
                    fit="cover"
                    class="product-cover-image"
                  />
                  <div v-else class="product-cover-fallback">{{ getProductAvatar(product.name) }}</div>
                </div>
                <div class="product-main">
                  <div class="product-name">{{ product.name }}</div>
                  <div class="product-subtitle">{{ product.subTitle || "商品描述加载中..." }}</div>
                  <div class="product-meta">
                    <span class="product-price">{{ formatCurrency(product.price) }}</span>
                    <span class="product-sold">累计销量 {{ product.sold || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
            <pagination
              v-show="hasSelectedShop && productTotal > 0"
              class="panel-pagination"
              :total="productPaginationTotal"
              :page.sync="productPageNum"
              :limit.sync="productPageSize"
              :page-sizes="[productPageSize]"
              :pager-count="7"
              layout="total, prev, pager, next"
              :auto-scroll="false"
              @pagination="handleProductPageChange"
            />
          </template>

          <template v-else>
            <div class="panel-header">
              <div class="panel-title">经营改进建议</div>
              <div class="panel-subtitle">基于经营数据，提供多维度的增长方案。</div>
            </div>
            <div class="panel-filter-chips">
              <button
                v-for="item in analysisRanges"
                :key="item.value"
                class="filter-chip"
                :class="{ active: analysisRange === item.value }"
                type="button"
                @click="handleAnalysisRangeChange(item.value)"
              >
                {{ item.label }}
              </button>
            </div>
            <div class="panel-scroll-section">
              <div class="data-card-list">
                <div v-for="card in suggestCards" :key="card.label" class="data-card">
                  <div class="data-label">{{ card.label }}</div>
                  <div class="data-value small">{{ card.value }}</div>
                  <div class="data-sub">{{ card.sub }}</div>
                </div>
              </div>
              <div class="panel-note">注：AI 辅助决策建议基于大数据分析，不构成法律声明及商业保证。</div>
            </div>
          </template>
        </aside>

        <section class="assistant-chat">
          <div class="chat-header">
            <div>
              <div class="chat-title">{{ activeFeature.title }}</div>
              <div class="chat-subtitle">{{ chatSubtitle }}</div>
            </div>
            <div v-if="currentSession" class="chat-session-tag">{{ currentSession.title }}</div>
          </div>

          <div ref="messageListRef" class="chat-message-list" v-loading="isMessageLoading">
            <div v-if="!hasSelectedShop" class="chat-empty-state">
              <div class="state-mark">AI</div>
              <div class="state-title">请选择店铺以开始</div>
              <div class="state-text">欢迎使用 AI 智能客服。请从左侧选择一个店铺或具体功能开始。</div>
            </div>

            <template v-else-if="!currentSession || !currentSession.messages.length">
              <div class="chat-welcome-card" v-if="activeType === 'copywrite' && selectedProduct">
                <article class="context-preview product">
                  <div class="context-head">
                    <div>
                      <div class="context-title">商品详情</div>
                    </div>
                    <div class="context-badge">营销场景</div>
                  </div>
                  <div class="message-product-card context">
                    <div class="product-cover large">
                      <el-image
                        v-if="selectedProduct.coverImg"
                        :src="selectedProduct.coverImg"
                        :preview-src-list="[selectedProduct.coverImg]"
                        fit="cover"
                        class="product-cover-image"
                      />
                      <div v-else class="product-cover-fallback">{{ getProductAvatar(selectedProduct.name) }}</div>
                    </div>
                    <div class="product-main">
                      <div class="product-name">{{ selectedProduct.name }}</div>
                      <div class="product-subtitle">{{ selectedProduct.subTitle || "商品描述加载中..." }}</div>
                      <div class="product-meta">
                        <span class="product-price">{{ formatCurrency(selectedProduct.price) }}</span>
                        <span class="product-sold">累计销量 {{ selectedProduct.sold || 0 }}</span>
                      </div>
                    </div>
                  </div>
                </article>
              </div>

              <div class="message-row ai">
                <div class="message-avatar">AI</div>
                <div class="message-bubble ai">
                  <div class="welcome-title">您好！我是您的 AI {{ activeFeature.title }} 助手</div>
                  <div class="welcome-text">{{ activeFeature.subtitle }}</div>
                </div>
              </div>
            </template>

            <template v-else>
              <div
                v-for="(message, index) in currentSession.messages"
                :key="String(currentSession.id) + '_' + index"
                class="message-row"
                :class="message.role === 'user' ? 'user' : 'ai'"
              >
                <template v-if="message.role === 'user'">
                  <div v-if="message.contextQuote" class="message-user-stack">
                    <div class="message-quote-card" :class="{ review: message.contextQuote.kind === 'review' }">
                      <div v-if="message.contextQuote.kind === 'product'" class="message-product-card compact">
                        <div class="product-cover quote">
                          <el-image
                            v-if="message.contextQuote.coverImg"
                            :src="message.contextQuote.coverImg"
                            :preview-src-list="[message.contextQuote.coverImg]"
                            fit="cover"
                            class="product-cover-image"
                          />
                          <div v-else class="product-cover-fallback">{{ getProductAvatar(message.contextQuote.name) }}</div>
                        </div>
                        <div class="product-main">
                          <div class="product-name">{{ message.contextQuote.name || "未命名商品" }}</div>
                          <div class="product-subtitle">{{ message.contextQuote.subTitle || "暂无商品描述" }}</div>
                          <div class="product-meta">
                            <span class="product-price">{{ formatCurrency(message.contextQuote.price) }}</span>
                            <span class="product-sold">累计销量 {{ message.contextQuote.sold || 0 }}</span>
                          </div>
                        </div>
                      </div>
                      <template v-else>
                        <div class="message-quote-head">
                          <span v-if="message.contextQuote.kind === 'review'" class="review-user-avatar small">
                            <el-image
                              v-if="message.contextQuote.userIcon"
                              :src="message.contextQuote.userIcon"
                              :preview-src-list="[message.contextQuote.userIcon]"
                              fit="cover"
                              class="review-user-avatar-image"
                            />
                            <span v-else class="review-user-badge">{{ getNameAvatar(getReviewDisplayName(message.contextQuote)) }}</span>
                          </span>
                          <span v-if="message.contextQuote.kind === 'review' && getReviewDisplayName(message.contextQuote)" class="message-quote-user">
                            {{ getReviewDisplayName(message.contextQuote) }}
                          </span>
                          <span class="message-quote-title">{{ message.contextQuote.title }}</span>
                          <template v-if="message.contextQuote.kind === 'review' && message.contextQuote.score > 0">
                            <span class="message-quote-stars">
                              <span
                                v-for="starIndex in 5"
                                :key="'quote_star_' + starIndex"
                                class="rating-star small"
                                :class="{ active: starIndex <= getScoreValue(message.contextQuote.score) }"
                              >★</span>
                            </span>
                          </template>
                          <span v-if="message.contextQuote.meta" class="message-quote-time">{{ message.contextQuote.meta }}</span>
                        </div>
                        <div class="message-quote-content">{{ message.contextQuote.content || "暂无内容" }}</div>
                        <div
                          v-if="message.contextQuote.kind === 'review' && message.contextQuote.imageList && message.contextQuote.imageList.length"
                          class="review-image-list compact"
                        >
                          <el-image
                            v-for="(image, imageIndex) in message.contextQuote.imageList"
                            :key="'quote_image_' + imageIndex"
                            :src="image"
                            :preview-src-list="message.contextQuote.imageList"
                            fit="cover"
                            class="review-image-thumb compact"
                          />
                        </div>
                      </template>
                    </div>
                    <div class="message-bubble user stacked">
                      <div class="message-content">{{ message.content }}</div>
                    </div>
                  </div>
                  <div v-else class="message-bubble user">
                    <div class="message-content">{{ message.content }}</div>
                  </div>
                </template>
                <template v-else>
                  <div class="message-avatar">AI</div>
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
              </div>
            </template>

            <div
              v-if="activeType === 'reply' && replyActionReview && generatedReplyContent"
              class="reply-action-bar"
            >
              <div>
                <div class="reply-action-title">AI 生成的回复内容：</div>
                <div class="reply-action-text">提示：您可以直接点击下方按钮进行快速回复，或在对话框中进行进一步修改。</div>
              </div>
              <div class="reply-action-buttons">
                <el-button size="small" :disabled="isStreaming" @click="handleRegenerateReply">
                  重新生成
                </el-button>
                <el-button type="primary" size="small" :loading="isReplySubmitting" @click="handleQuickReply">
                  发布回复
                </el-button>
              </div>
            </div>
          </div>

          <div class="chat-input-area">
            <div v-if="activeType === 'reply' && selectedReview" class="chat-context-card review">
              <div class="chat-context-head">
                <div class="chat-context-main">
                  <div class="chat-context-title">当前已绑定评价</div>
                  <div class="chat-context-meta">
                    <span class="context-user-meta">
                      <span class="review-user-avatar medium">
                        <el-image
                          v-if="selectedReview.userIcon"
                          :src="selectedReview.userIcon"
                          :preview-src-list="[selectedReview.userIcon]"
                          fit="cover"
                          class="review-user-avatar-image"
                        />
                        <span v-else class="review-user-badge">{{ getNameAvatar(getReviewDisplayName(selectedReview)) }}</span>
                      </span>
                      <span>{{ getReviewDisplayName(selectedReview) }}</span>
                    </span>
                    <span>{{ formatReviewTime(selectedReview.createTime) }}</span>
                    <span>{{ getReviewSourceLabel(selectedReview.sourceType) }} · {{ selectedReview.sourceName || '未知来源' }}</span>
                  </div>
                </div>
                <button class="chat-context-close" type="button" @click="clearSelectedReview">
                  <i class="el-icon-close"></i>
                </button>
              </div>
              <div class="context-rating" v-if="selectedReview.score > 0">
                <span
                  v-for="starIndex in 5"
                  :key="'input_context_star_' + starIndex"
                  class="rating-star small"
                  :class="{ active: starIndex <= getScoreValue(selectedReview.score) }"
                >★</span>
              </div>
              <div class="chat-context-content">{{ selectedReview.plainContent || '评价内容加载中...' }}</div>
              <div v-if="selectedReview.imageList && selectedReview.imageList.length" class="review-image-list compact">
                <el-image
                  v-for="(image, imageIndex) in selectedReview.imageList"
                  :key="'input_context_image_' + imageIndex"
                  :src="image"
                  :preview-src-list="selectedReview.imageList"
                  fit="cover"
                  class="review-image-thumb compact"
                />
              </div>
            </div>
            <div v-else-if="activeType === 'copywrite' && selectedProduct" class="chat-context-card product">
              <div class="chat-context-head">
                <div class="chat-context-main">
                  <div class="chat-context-title">当前已绑定商品</div>
                </div>
                <button class="chat-context-close" type="button" @click="clearSelectedProduct">
                  <i class="el-icon-close"></i>
                </button>
              </div>
              <div class="message-product-card compact">
                <div class="product-cover quote">
                  <el-image
                    v-if="selectedProduct.coverImg"
                    :src="selectedProduct.coverImg"
                    :preview-src-list="[selectedProduct.coverImg]"
                    fit="cover"
                    class="product-cover-image"
                  />
                  <div v-else class="product-cover-fallback">{{ getProductAvatar(selectedProduct.name) }}</div>
                </div>
                <div class="product-main">
                  <div class="product-name">{{ selectedProduct.name || '未命名商品' }}</div>
                  <div class="product-subtitle">{{ selectedProduct.subTitle || '暂无商品描述' }}</div>
                  <div class="product-meta">
                    <span class="product-price">{{ formatCurrency(selectedProduct.price) }}</span>
                    <span class="product-sold">累计销量 {{ selectedProduct.sold || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="chatContextTip" class="chat-context-tip">{{ chatContextTip }}</div>
            <div class="chat-input-box" :class="{ disabled: !canInput }">
              <textarea
                ref="messageInput"
                v-model="inputMessage"
                :disabled="!canInput"
                :placeholder="inputPlaceholder"
                class="chat-textarea"
                rows="1"
                @input="adjustInputHeight"
                @keydown="handleInputKeydown"
              ></textarea>
              <button class="send-button" type="button" :disabled="!canSubmit" @click="handleSendMessage">
                <i class="el-icon-position"></i>
              </button>
            </div>
            <div class="chat-hint">{{ inputHint }}</div>
          </div>
        </section>
      </div>
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
import { getReview, listReview } from '@/api/review/review'
import { listProduct, getProduct } from '@/api/product'
import { addComment } from '@/api/comment/comment'
import { getShopAnalysis, getShopSuggest } from '@/api/shop/shop'

const FEATURE_OPTIONS = [
  {
    type: 'reply',
    title: '评价回复',
    subtitle: '为顾客评价生成专业的商家回复建议。',
    placeholder: '可选输入回复要求，例如：语气真诚一些，控制在 60 字内。',
    badge: '评',
    tone: 'tone-blue'
  },
  {
    type: 'analysis',
    title: '经营状况分析',
    subtitle: '分析近期经营数据，并提供专业的改进建议。',
    placeholder: '请输入您想重点分析的问题，例如：关注近 30 天差评和复购。',
    badge: '析',
    tone: 'tone-green'
  },
  {
    type: 'copywrite',
    title: '商品营销文案',
    subtitle: '为您的商品生成吸引人的营销推广文案。',
    placeholder: '可选输入文案要求，例如：突出新品感和性价比。',
    badge: '文',
    tone: 'tone-orange'
  },
  {
    type: 'suggest',
    title: '经营改进建议',
    subtitle: '基于经营数据，提供多维度的增长方案。',
    placeholder: '请输入您希望 AI 重点给出的改进方向。',
    badge: '荐',
    tone: 'tone-purple'
  }
]

const FEATURE_MAP = FEATURE_OPTIONS.reduce(function (result, item) {
  result[item.type] = item
  return result
}, {})

const ANALYSIS_CARDS = [
  { label: '本周订单', value: '--', sub: '统计周期内已确认的订单数。' },
  { label: '预计营收', value: '--', sub: '当前选定范围内的预计营业收入。' },
  { label: '店铺评分', value: '--', sub: '当前店铺在相应周期内的平均评分。' },
  { label: '差评数量', value: '--', sub: '当前统计周期内的差评条数。' }
]

const SUGGEST_CARDS = [
  { label: '订单数量', value: '--', sub: '用于流量及转化率的改进建议。' },
  { label: '待处理评价', value: '--', sub: '用于服务质量及售后建议。' },
  { label: '平均评分', value: '--', sub: '当前店铺在统计周期内的平均评分。' },
  { label: '差评数量', value: '--', sub: '当前统计周期内的差评条数。' },
  { label: '热销商品', value: '--', sub: '当前周期内销量最高的商品。' },
  { label: '滞销商品', value: '--', sub: '近期销量较低，可能需要优化的商品。' }
]

export default {
  name: 'BusinessAiAssistant',
  data() {
    return {
      featureOptions: FEATURE_OPTIONS,
      analysisCards: ANALYSIS_CARDS.map(function (item) {
        return Object.assign({}, item)
      }),
      suggestCards: SUGGEST_CARDS.map(function (item) {
        return Object.assign({}, item)
      }),
      replyFilters: [
        { label: '全部评价', value: 'all' },
        { label: '待回复', value: 'pending' },
        { label: '差评建议', value: 'lowScore' }
      ],
      analysisRanges: [
        { label: '本周', value: 'week' },
        { label: '本月', value: 'month' },
        { label: '本季度', value: 'quarter' }
      ],
      shopOptions: [],
      selectedShopId: null,
      activeType: 'reply',
      sessions: [],
      currentSessionId: null,
      sessionDropdownVisible: false,
      inputMessage: '',
      replyQuery: '',
      replyFilter: 'all',
      copywriteQuery: '',
      analysisRange: 'week',
      replyReviews: [],
      products: [],
      replyPageNum: 1,
      replyPageSize: 10,
      replyTotal: 0,
      replyTotalExact: false,
      productPageNum: 1,
      productPageSize: 10,
      productTotal: 0,
      productTotalExact: false,
      selectedReviewId: null,
      selectedProductId: null,
      replyActionReview: null,
      reviewDetailCache: {},
      reviewDetailRequests: {},
      productNameMap: {},
      productDetailCache: {},
      productDetailRequests: {},
      isShopLoading: false,
      isPanelLoading: false,
      isSessionLoading: false,
      isMessageLoading: false,
      isReplySubmitting: false,
      isStreaming: false,
      activeStreamController: null,
      activeStreamPromise: null,
      activeStreamSessionId: null,
      activeStreamMessageIndex: -1,
      streamCharQueue: '',
      streamCharTimer: null,
      viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
      viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
      sessionLoadToken: 0,
      panelLoadToken: 0,
      messageLoadToken: 0
    }
  },
  computed: {
    activeFeature() {
      return FEATURE_MAP[this.activeType] || FEATURE_OPTIONS[0]
    },
    hasSelectedShop() {
      return this.selectedShopId !== null && this.selectedShopId !== undefined && this.selectedShopId !== ''
    },
    selectedShopName() {
      for (let index = 0; index < this.shopOptions.length; index++) {
        if (String(this.shopOptions[index].id) === String(this.selectedShopId)) {
          return this.shopOptions[index].name || ''
        }
      }
      return ''
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
      if (!this.currentSessionId) {
        return null
      }
      return this.findSession(this.currentSessionId)
    },
    selectedReview() {
      if (!this.selectedReviewId) {
        return null
      }
      for (let index = 0; index < this.replyReviews.length; index++) {
        if (String(this.replyReviews[index].id) === String(this.selectedReviewId)) {
          return this.replyReviews[index]
        }
      }
      return null
    },
    selectedProduct() {
      if (!this.selectedProductId) {
        return null
      }
      for (let index = 0; index < this.products.length; index++) {
        if (String(this.products[index].id) === String(this.selectedProductId)) {
          return this.products[index]
        }
      }
      return null
    },    filteredReplyReviews() {
      const keyword = String(this.replyQuery || '').trim().toLowerCase()
      return this.replyReviews.filter((item) => {
        if (this.replyFilter === 'pending' && item.isReplied) {
          return false
        }
        if (this.replyFilter === 'lowScore' && Number(item.score || 0) > 3) {
          return false
        }
        if (!keyword) {
          return true
        }
        const source = [item.plainContent, this.getReviewDisplayName(item), item.sourceName]
          .join(' ')
          .toLowerCase()
        return source.indexOf(keyword) !== -1
      })
    },
    filteredProducts() {
      const keyword = String(this.copywriteQuery || '').trim().toLowerCase()
      if (!keyword) {
        return this.products
      }
      return this.products.filter(function (item) {
        const source = [item.name, item.subTitle].join(' ').toLowerCase()
        return source.indexOf(keyword) !== -1
      })
    },
    pendingReplyCount() {
      return this.replyReviews.filter(function (item) {
        return !item.isReplied
      }).length
    },
    replyPaginationTotal() {
      if (this.replyTotalExact) {
        return Number(this.replyTotal || 0)
      }
      const size = Number(this.replyPageSize || 10)
      const page = Math.max(1, Number(this.replyPageNum || 1))
      const currentCount = Number((this.replyReviews && this.replyReviews.length) || 0)
      const loadedCount = (page - 1) * size + currentCount
      if (currentCount >= size) {
        return loadedCount + 1
      }
      return loadedCount
    },
    replyPageCount() {
      const total = Number(this.replyPaginationTotal || 0)
      if (total > 0) {
        return Math.max(1, Math.ceil(total / this.replyPageSize))
      }
      if (this.replyPageNum > 1 || this.replyReviews.length >= this.replyPageSize) {
        return this.replyPageNum + (this.replyReviews.length >= this.replyPageSize ? 1 : 0)
      }
      return 1
    },
    productPaginationTotal() {
      if (this.productTotalExact) {
        return Number(this.productTotal || 0)
      }
      const size = Number(this.productPageSize || 10)
      const page = Math.max(1, Number(this.productPageNum || 1))
      const currentCount = Number((this.products && this.products.length) || 0)
      const loadedCount = (page - 1) * size + currentCount
      if (currentCount >= size) {
        return loadedCount + 1
      }
      return loadedCount
    },
    productPageCount() {
      const total = Number(this.productPaginationTotal || 0)
      if (total > 0) {
        return Math.max(1, Math.ceil(total / this.productPageSize))
      }
      if (this.productPageNum > 1 || this.products.length >= this.productPageSize) {
        return this.productPageNum + (this.products.length >= this.productPageSize ? 1 : 0)
      }
      return 1
    },
    showReplyPagination() {
      return this.hasSelectedShop && this.replyPageCount > 1
    },
    showProductPagination() {
      return this.hasSelectedShop && this.productPageCount > 1
    },
    activePanelItemCount() {
      if (this.activeType === 'reply') {
        return this.filteredReplyReviews.length
      }
      if (this.activeType === 'copywrite') {
        return this.filteredProducts.length
      }
      if (this.activeType === 'analysis') {
        return this.analysisCards.length
      }
      if (this.activeType === 'suggest') {
        return this.suggestCards.length
      }
      return 0
    },
    assistantShellStyle() {
      const width = Number(this.viewportWidth || 0)
      if (width && width <= 1280) {
        return {}
      }
      const viewportHeight = Number(this.viewportHeight || 0)
      const availableHeight = Math.max(780, viewportHeight - 88)
      const listDrivenHeight = 700 + Math.min(this.activePanelItemCount, 10) * 42
      const targetHeight = Math.max(780, Math.min(listDrivenHeight, availableHeight))
      return {
        minHeight: targetHeight + 'px',
        height: targetHeight + 'px'
      }
    },
    canInput() {
      return this.hasSelectedShop && !this.isStreaming && !this.isSessionLoading && !this.isMessageLoading
    },
    canSubmit() {
      if (!this.canInput) {
        return false
      }
      if (this.activeType === 'reply') {
        return !!this.selectedReview
      }
      if (this.activeType === 'copywrite') {
        return !!this.selectedProduct
      }
      return !!String(this.inputMessage || '').trim()
    },
    inputPlaceholder() {
      if (!this.hasSelectedShop) {
        return '请先选择一个店铺。'
      }
      if (this.activeType === 'reply' && !this.selectedReview) {
        return '请先选择一条评价，然后可选输入补充回复要求。'
      }
      if (this.activeType === 'copywrite' && !this.selectedProduct) {
        return '请先选择一个商品，然后可选输入补充文案要求。'
      }
      return this.activeFeature.placeholder
    },
    inputHint() {
      if (this.isStreaming) {
        return 'AI 正在生成中，请耐心等待。'
      }
      if (this.activeType === 'reply' && !this.selectedReview) {
        return '请先在左侧选择一条评价，选中后再点击发送。'
      }
      if (this.activeType === 'reply' && this.selectedReview) {
        return '已选评价。可补充要求后发送，也可不填内容直接发送默认回复请求。'
      }
      if (this.activeType === 'copywrite') {
        return this.selectedProduct
          ? '已选商品。可补充要求后发送，也可不填内容直接发送默认文案请求。'
          : '请先在左侧选定商品，选中后再点击发送。'
      }
      if (this.activeType === 'analysis' || this.activeType === 'suggest') {
        return '按回车发送。当前分析周期为 ' + this.currentAnalysisRangeLabel + '。'
      }
      return '按回车发送。使用 Shift + Enter 换行。'
    },
    currentAnalysisRangeLabel() {
      const target = this.analysisRanges.find(function (item) {
        return item.value === this.analysisRange
      }, this)
      return (target && target.label) || '本周'
    },
    chatContextTip() {
      if (!this.hasSelectedShop) {
        return ''
      }
      if (this.activeType === 'reply' && this.selectedReview) {
        return '当前已绑定评价：' + this.getReviewDisplayName(this.selectedReview) + ' · ' + this.getReviewScoreText(this.selectedReview)
      }
      if (this.activeType === 'copywrite' && this.selectedProduct) {
        return '当前已绑定商品：' + (this.selectedProduct.name || '未命名商品')
      }
      if (this.activeType === 'analysis' || this.activeType === 'suggest') {
        return '当前分析周期：' + this.currentAnalysisRangeLabel
      }
      return ''
    },
    chatSubtitle() {
      if (!this.hasSelectedShop) {
        return '选择店铺以开始 AI 对话。'
      }
      if (this.activeType === 'reply' && this.selectedReview) {
        return '当前处于评价回复模式，后端将结合评价上下文和您的补充要求生成回复。'
      }
      if (this.activeType === 'copywrite' && this.selectedProduct) {
        return '当前处于文案生成模式，后端将结合商品上下文和您的补充要求生成文案。'
      }
      return this.activeFeature.subtitle
    },
    generatedReplyContent() {
      if (!this.currentSession || !Array.isArray(this.currentSession.messages)) {
        return ''
      }
      for (let index = this.currentSession.messages.length - 1; index >= 0; index--) {
        const message = this.currentSession.messages[index]
        if (message && message.role === 'ai' && String(message.content || '').trim()) {
          return this.normalizeReplyContent(message.content)
        }
      }
      return ''
    }
  },
  created() {
    this.loadShopOptions()
  },
  mounted() {
    this.handleWindowResize()
    window.addEventListener('resize', this.handleWindowResize)
    document.addEventListener('click', this.handleDocumentClick)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleWindowResize)
    document.removeEventListener('click', this.handleDocumentClick)
    if (this.activeStreamController) {
      this.activeStreamController.abort()
    }
    this.clearStreamTimer()
  },
  methods: {
    handleWindowResize() {
      if (typeof window === 'undefined') {
        return
      }
      this.viewportHeight = window.innerHeight
      this.viewportWidth = window.innerWidth
    },
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
    handleDocumentClick(event) {
      if (!this.sessionDropdownVisible) {
        return
      }
      const menu = this.$refs.sessionMenu
      if (menu && menu.contains(event.target)) {
        return
      }
      this.sessionDropdownVisible = false
    },
    toggleSessionDropdown() {
      this.sessionDropdownVisible = !this.sessionDropdownVisible
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
    readResponseData(response) {
      if (response && Object.prototype.hasOwnProperty.call(response, 'data')) {
        return response.data
      }
      return response
    },
    readResponseRows(response) {
      if (response && Array.isArray(response.rows)) {
        return response.rows
      }
      const data = this.readResponseData(response)
      return Array.isArray(data) ? data : []
    },
    readResponseTotal(response) {
      const data = this.readResponseData(response)
      const candidates = [
        response && response.total,
        data && typeof data === 'object' ? data.total : undefined,
        data && typeof data === 'object' ? data.count : undefined
      ]
      for (let index = 0; index < candidates.length; index++) {
        const value = Number(candidates[index])
        if (isFinite(value) && value > 0) {
          return value
        }
      }
      return 0
    },
    resolvePagingTotal(response, currentCount, pageNum, pageSize) {
      const safePageNum = Math.max(1, Number(pageNum || 1))
      const safePageSize = Math.max(1, Number(pageSize || 10))
      const safeCurrentCount = Math.max(0, Number(currentCount || 0))
      const loadedCount = (safePageNum - 1) * safePageSize + safeCurrentCount
      const previousPagesCapacity = (safePageNum - 1) * safePageSize
      const rawTotal = this.readResponseTotal(response)

      if (rawTotal > 0) {
        const invalidForCurrentPage = rawTotal < loadedCount
        const firstPageEchoSize =
          safePageNum === 1 &&
          safeCurrentCount >= safePageSize &&
          rawTotal === safeCurrentCount
        const cannotCoverPreviousPages = safePageNum > 1 && rawTotal <= previousPagesCapacity
        const totalLooksReliable =
          !invalidForCurrentPage &&
          !firstPageEchoSize &&
          !cannotCoverPreviousPages

        if (totalLooksReliable) {
          return {
            total: rawTotal,
            exact: true
          }
        }
      }

      if (safeCurrentCount >= safePageSize) {
        return {
          total: loadedCount + 1,
          exact: false
        }
      }
      return {
        total: loadedCount,
        exact: false
      }
    },
    readSessionId(response) {
      const data = this.readResponseData(response)
      if (data === null || data === undefined || data === '') {
        return null
      }
      return data
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
      return isNaN(timestamp) ? 0 : timestamp
    },
    normalizeMessageRole(role) {
      const normalizedRole = String(role || '').trim().toLowerCase()
      if (normalizedRole === 'user') {
        return 'user'
      }
      return 'ai'
    },
    normalizeMessageList(response, sessionType) {
      const rows = this.readResponseRows(response)
      return rows.map((item) => {
        return {
          id: item.id,
          role: this.normalizeMessageRole(item.role),
          content: item.content || '',
          createTime: this.normalizeTimestamp(item.createTime),
          type: item.type || sessionType || this.activeType,
          reviewId: item.reviewId || item.review_id || null,
          productId: item.productId || item.product_id || null,
          timeRange: item.timeRange || item.time_range || '',
          contextQuote: this.normalizeMessageContextQuote(item, sessionType)
        }
      })
    },
    normalizeMessageContextQuote(item, sessionType) {
      if (!item) {
        return null
      }
      const type = item.type || sessionType || this.activeType
      const reviewId = item.reviewId || item.review_id
      const productId = item.productId || item.product_id
      const timeRange = item.timeRange || item.time_range || ''

      if (type === 'reply' && reviewId && (item.reviewContent || item.reviewPlainContent)) {
        return {
          kind: 'review',
          title: '用户评价',
          score: Number(item.reviewScore || item.score || 0),
          meta: this.getRelativeMessageTime(item.reviewCreateTime || item.createTime),
          content: item.reviewContent || item.reviewPlainContent || '',
          imageList: this.parseImageList(item.reviewImages || item.images),
          nickName: item.reviewNickName || item.review_nick_name || item.nickName || item.nickname || item.nick_name || '',
          userName: item.reviewNickName || item.review_nick_name || item.nickName || item.nickname || item.nick_name || item.reviewUserName || item.userName || '匿名用户',
          userIcon: this.buildFileUrl(item.reviewUserIcon || item.userIcon || item.user_icon)
        }
      }

      if (type === 'copywrite' && productId && (item.productName || item.product_name || item.productSubTitle || item.product_sub_title)) {
        return {
          kind: 'product',
          title: '商品信息',
          score: 0,
          meta: '',
          content: '',
          name: item.productName || item.product_name || '未命名商品',
          subTitle: item.productSubTitle || item.product_sub_title || '暂无商品描述',
          price: Number(item.productPrice || item.product_price || item.price || 0),
          sold: Number(item.productSold || item.product_sold || item.sold || 0),
          coverImg: this.buildFileUrl(item.productCoverImg || item.product_cover_img || item.coverImg || item.cover_img)
        }
      }

      if ((type === 'analysis' || type === 'suggest') && timeRange) {
        return {
          kind: 'range',
          title: type === 'analysis' ? '经营分析' : '经营建议',
          score: 0,
          meta: this.getTimeRangeLabel(timeRange),
          content:
            (this.selectedShopName || '当前店铺') +
            ' · ' +
            this.getTimeRangeLabel(timeRange)
        }
      }
      return null
    },
    normalizeSessionList(response, sessionType) {
      const rows = this.readResponseRows(response)
      const currentMap = {}
      this.sessions.forEach(function (item) {
        currentMap[String(item.id)] = item
      })
      return rows.map((item) => {
        const existing = currentMap[String(item.id)] || {}
        const createdAt = this.normalizeTimestamp(item.createTime) || existing.createdAt || Date.now()
        const updatedAt = this.normalizeTimestamp(item.updateTime) || existing.updatedAt || createdAt
        return {
          id: item.id,
          shopId: item.shopId || this.selectedShopId,
          title: item.title || existing.title || '新会话',
          type: item.type || sessionType || existing.type || this.activeType,
          createdAt: createdAt,
          updatedAt: updatedAt,
          messages: Array.isArray(existing.messages) ? existing.messages : []
        }
      })
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
      return String(date.getMonth() + 1).padStart(2, '0') + '/' + String(date.getDate()).padStart(2, '0')
    },
    formatReviewTime(value) {
      const timestamp = this.normalizeTimestamp(value)
      if (!timestamp) {
        return '--'
      }
      const date = new Date(timestamp)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hour = String(date.getHours()).padStart(2, '0')
      const minute = String(date.getMinutes()).padStart(2, '0')
      return year + '-' + month + '-' + day + ' ' + hour + ':' + minute
    },
    getRelativeMessageTime(value) {
      const timestamp = this.normalizeTimestamp(value)
      if (!timestamp) {
        return ''
      }
      const diff = Date.now() - timestamp
      if (diff < 60 * 60 * 1000) {
        const minutes = Math.max(1, Math.floor(diff / (60 * 1000)))
        return minutes + '分钟前'
      }
      if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.max(1, Math.floor(diff / (60 * 60 * 1000)))
        return hours + '小时前'
      }
      const days = Math.max(1, Math.floor(diff / (24 * 60 * 60 * 1000)))
      return days + '天前'
    },
    parseImageList(images) {
      if (!images) {
        return []
      }
      if (Array.isArray(images)) {
        return images
          .map((item) => this.buildFileUrl(item))
          .filter(Boolean)
      }
      const text = String(images).trim()
      if (!text) {
        return []
      }
      if (text.charAt(0) === '[') {
        try {
          const parsed = JSON.parse(text)
          if (Array.isArray(parsed)) {
            return parsed
              .map((item) => this.buildFileUrl(item))
              .filter(Boolean)
          }
        } catch (error) {
        }
      }
      return text
        .split(',')
        .map((item) => this.buildFileUrl(item))
        .filter(Boolean)
    },
    buildFileUrl(value) {
      const text = String(value || '').trim()
      if (!text) {
        return ''
      }
      if (text.startsWith('http') || text.startsWith('https')) {
        return text
      }
      let base = process.env.VUE_APP_FILE_BASE_API || ''
      if (base.endsWith('/')) {
        base = base.slice(0, -1)
      }
      let url = text
      if (!url.startsWith('/')) {
        url = '/' + url
      }
      let fullUrl = base + url
      if (fullUrl.includes('/smart-live/smart-live')) {
        fullUrl = fullUrl.replace('/smart-live/smart-live', '/smart-live')
      }
      return fullUrl
    },
    getTimeRangeLabel(value) {
      const rangeMap = {
        week: '本周',
        month: '本月',
        quarter: '本季度'
      }
      return rangeMap[String(value || '').trim()] || '当前周期'
    },
    formatCurrency(value) {
      const amount = Number(value)
      if (!isFinite(amount) || amount === 0) {
        return 'CNY 0.00'
      }
      return 'CNY ' + amount.toFixed(2)
    },
    getScoreValue(score) {
      const value = Number(score || 0)
      if (!isFinite(value) || value <= 0) {
        return 0
      }
      return Math.max(0, Math.min(5, Math.round(value)))
    },
    formatScoreValue(score) {
      const value = Number(score || 0)
      if (!isFinite(value) || value <= 0) {
        return ''
      }
      return Number.isInteger(value) ? String(value) : value.toFixed(1)
    },
    getStarText(score) {
      const value = this.getScoreValue(score)
      return '*'.repeat(value) + '.'.repeat(5 - value)
    },
    getReviewScoreText(review) {
      const score = Number(review && review.score)
      if (!isFinite(score) || score <= 0) {
        return '暂无评分'
      }
      return this.formatScoreValue(score) + ' / 5'
    },
    getReviewSourceLabel(sourceType) {
      const sourceMap = {
        2: '店铺评价',
        4: '商品评价'
      }
      return sourceMap[Number(sourceType)] || '评价'
    },
    getReviewDisplayName(review) {
      if (!review || typeof review !== 'object') {
        return '匿名用户'
      }
      return (
        review.nickName ||
        review.nickname ||
        review.nick_name ||
        review.reviewNickName ||
        review.review_nick_name ||
        review.userName ||
        review.user_name ||
        '匿名用户'
      )
    },
    getNameAvatar(value) {
      const text = String(value || '').trim()
      return text ? text.charAt(0).toUpperCase() : '评'
    },
    getProductAvatar(name) {
      const text = String(name || '').trim()
      return text ? text.charAt(0).toUpperCase() : '商'
    },
    stripHtml(value) {
      return String(value || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    },
    createDefaultAnalysisCards() {
      return ANALYSIS_CARDS.map(function (item) {
        return Object.assign({}, item)
      })
    },
    createDefaultSuggestCards() {
      return SUGGEST_CARDS.map(function (item) {
        return Object.assign({}, item)
      })
    },
    resetPanelState(options) {
      const settings = Object.assign(
        {
          preserveReplyPage: false,
          preserveProductPage: false
        },
        options
      )
      this.replyReviews = []
      this.products = []
      this.analysisCards = this.createDefaultAnalysisCards()
      this.suggestCards = this.createDefaultSuggestCards()
      this.selectedReviewId = null
      this.selectedProductId = null
      if (!settings.preserveReplyPage) {
        this.replyPageNum = 1
      }
      if (!settings.preserveProductPage) {
        this.productPageNum = 1
      }
      if (!settings.preserveReplyPage) {
        this.replyTotal = 0
        this.replyTotalExact = false
      }
      if (!settings.preserveProductPage) {
        this.productTotal = 0
        this.productTotalExact = false
      }
    },
    resetTextInputs() {
      this.inputMessage = ''
      this.$nextTick(() => {
        this.resetInputHeight()
      })
    },
    clearSelectedReview() {
      this.selectedReviewId = null
    },
    clearSelectedProduct() {
      this.selectedProductId = null
    },
    resetInputHeight() {
      const input = this.$refs.messageInput
      if (!input) {
        return
      }
      input.style.height = 'auto'
    },
    adjustInputHeight() {
      const input = this.$refs.messageInput
      if (!input) {
        return
      }
      input.style.height = 'auto'
      input.style.height = Math.min(input.scrollHeight, 120) + 'px'
    },
    focusMessageInput() {
      this.$nextTick(() => {
        const input = this.$refs.messageInput
        if (input && typeof input.focus === 'function') {
          input.focus()
        }
      })
    },
    normalizeProductItem(item) {
      return {
        id: item.id,
        name: item.name || item.title || item.productName || '未命名商品',
        subTitle: item.subTitle || item.sub_title || '',
        price: Number(item.price || 0),
        originalPrice: Number(item.originalPrice || 0),
        sold: Number(item.sold || 0),
        stock: Number(item.stock || 0),
        rulesJson: item.rulesJson || '',
        category: item.category,
        activityType: item.activityType,
        shopId: item.shopId,
        coverImg: this.buildFileUrl(item.coverImg || item.cover_img || ''),
        updateTime: this.normalizeTimestamp(item.updateTime),
        createTime: this.normalizeTimestamp(item.createTime)
      }
    },
    async resolveProductDetail(productId) {
      const key = String(productId || '')
      if (!key) {
        return null
      }
      if (Object.prototype.hasOwnProperty.call(this.productDetailCache, key)) {
        return this.productDetailCache[key]
      }
      if (Object.prototype.hasOwnProperty.call(this.productDetailRequests, key)) {
        return this.productDetailRequests[key]
      }
      const request = (async () => {
        try {
          const response = await getProduct(productId)
          const product = this.normalizeProductItem(this.readResponseData(response) || {})
          this.$set(this.productDetailCache, key, product)
          return product
        } catch (error) {
          return null
        } finally {
          this.$delete(this.productDetailRequests, key)
        }
      })()
      this.$set(this.productDetailRequests, key, request)
      return await request
    },
    readMetricValue(source, keys) {
      if (!source || typeof source !== 'object' || !Array.isArray(keys)) {
        return undefined
      }
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index]
        if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== null && source[key] !== undefined && source[key] !== '') {
          return source[key]
        }
      }
      return undefined
    },
    formatMetricDisplay(value, options) {
      const settings = Object.assign(
        {
          type: 'text'
        },
        options
      )
      if (value === null || value === undefined || value === '') {
        return '--'
      }
      if (settings.type === 'currency') {
        const amount = Number(value)
        return isFinite(amount) ? this.formatCurrency(amount) : String(value)
      }
      if (settings.type === 'score') {
        const score = Number(value)
        return isFinite(score) && score > 0 ? score.toFixed(1) + ' / 5' : '--'
      }
      if (settings.type === 'count') {
        const count = Number(value)
        return isFinite(count) ? String(count) : String(value)
      }
      if (Array.isArray(value)) {
        return value
          .map((item) => {
            if (item && typeof item === 'object') {
              return item.name || item.title || item.productName || ''
            }
            return String(item || '')
          })
          .filter(Boolean)
          .slice(0, 3)
          .join('、') || '--'
      }
      if (value && typeof value === 'object') {
        return value.name || value.title || value.productName || value.label || '--'
      }
      return String(value)
    },
    formatProductSalesDisplay(value) {
      if (!Array.isArray(value) || !value.length) {
        return '--'
      }
      return value
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return String(item || '').trim()
          }
          const name = item.productName || item.name || item.title || ''
          const salesCount = Number(item.salesCount)
          if (!name) {
            return ''
          }
          if (isFinite(salesCount) && salesCount >= 0) {
            return name + ' ' + salesCount + '单'
          }
          return name
        })
        .filter(Boolean)
        .slice(0, 3)
        .join('、') || '--'
    },
    buildAnalysisCards(data) {
      const source = data && typeof data === 'object' ? data : {}
      return [
        {
          label: '订单数量',
          value: this.formatMetricDisplay(this.readMetricValue(source, ['totalOrders', 'orderCount', 'orders', 'weekOrderCount', 'totalOrderCount']), { type: 'count' }),
          sub: '统计周期内已确认的订单数。'
        },
        {
          label: '预计营收',
          value: this.formatMetricDisplay(this.readMetricValue(source, ['totalRevenue', 'estimatedRevenue', 'revenue', 'gmv', 'turnover', 'income']), { type: 'currency' }),
          sub: '当前选定范围内的预计营业收入。'
        },
        {
          label: '店铺评分',
          value: this.formatMetricDisplay(this.readMetricValue(source, ['avgScore', 'shopScore', 'rating', 'score']), { type: 'score' }),
          sub: '当前店铺在相应周期内的平均评分。'
        },
        {
          label: '差评数量',
          value: this.formatMetricDisplay(this.readMetricValue(source, ['badReviewCount', 'negativeReviewCount', 'badReviews']), { type: 'count' }),
          sub: '当前统计周期内的差评条数。'
        }
      ]
    },
    buildSuggestCards(data) {
      const source = data && typeof data === 'object' ? data : {}
      return [
        {
          label: '订单数量',
          value: this.formatMetricDisplay(this.readMetricValue(source, ['weekOrders', 'orderCount', 'orders', 'weekOrderCount', 'totalOrderCount']), { type: 'count' }),
          sub: '用于流量及转化率的改进建议。'
        },
        {
          label: '待处理评价',
          value: this.formatMetricDisplay(this.readMetricValue(source, ['pendingReviewCount', 'pendingReplyCount', 'unrepliedCount', 'waitReplyCount']), { type: 'count' }),
          sub: '用于服务质量及售后建议。'
        },
        {
          label: '平均评分',
          value: this.formatMetricDisplay(this.readMetricValue(source, ['avgScore', 'shopScore', 'rating', 'score']), { type: 'score' }),
          sub: '当前店铺在统计周期内的平均评分。'
        },
        {
          label: '差评数量',
          value: this.formatMetricDisplay(this.readMetricValue(source, ['badReviewCount', 'negativeReviewCount', 'badReviews']), { type: 'count' }),
          sub: '当前统计周期内的差评条数。'
        },
        {
          label: '热销商品',
          value: this.formatProductSalesDisplay(this.readMetricValue(source, ['hotProducts', 'hotProduct', 'topProducts', 'topProduct'])),
          sub: '当前周期内销量最高的商品。'
        },
        {
          label: '滞销商品',
          value: this.formatProductSalesDisplay(this.readMetricValue(source, ['slowProducts', 'slowProduct', 'slowMovingProducts', 'slowMovingProduct'])),
          sub: '近期销量较低，可能需要优化的商品。'
        }
      ]
    },
    async resolveReviewDetail(reviewId) {
      const key = String(reviewId || '')
      if (!key) {
        return null
      }
      if (Object.prototype.hasOwnProperty.call(this.reviewDetailCache, key)) {
        return this.reviewDetailCache[key]
      }
      try {
        const response = await getReview(reviewId)
        const raw = this.readResponseData(response) || {}
        const detail = Object.assign({}, raw, {
          id: raw.id || reviewId,
          plainContent: this.stripHtml(raw.content),
          score: Number(raw.score || 0),
          createTime: this.normalizeTimestamp(raw.createTime),
          nickName: raw.nickName || raw.nickname || raw.nick_name || '',
          userName: raw.nickName || raw.nickname || raw.nick_name || raw.userName || '匿名用户',
          userIcon: this.buildFileUrl(raw.userIcon || raw.user_icon || ''),
          imageList: this.parseImageList(raw.images)
        })
        this.$set(this.reviewDetailCache, key, detail)
        return detail
      } catch (error) {
        return null
      }
    },
    async hydrateSessionMessageQuotes(session) {
      if (!session || !Array.isArray(session.messages)) {
        return
      }
      const reviewIds = []
      const productIds = []
      const reviewIdMap = {}
      const productIdMap = {}
      session.messages.forEach((message) => {
        if (!message || message.role !== 'user') {
          return
        }
        const type = message.type || session.type || this.activeType
        const reviewId = String(message.reviewId || '')
        const productId = String(message.productId || '')
        if (type === 'reply' && reviewId && !reviewIdMap[reviewId]) {
          reviewIdMap[reviewId] = true
          reviewIds.push(reviewId)
        }
        if (type === 'copywrite' && productId && !productIdMap[productId]) {
          productIdMap[productId] = true
          productIds.push(productId)
        }
      })
      await Promise.all(
        reviewIds.map((reviewId) => this.resolveReviewDetail(reviewId)).concat(
          productIds.map((productId) => this.resolveProductDetail(productId))
        )
      )
      await Promise.all(
        session.messages.map(async (message) => {
          if (!message || message.role !== 'user') {
            return
          }
          const type = message.type || session.type || this.activeType
          if (type === 'reply' && message.reviewId) {
            const review = await this.resolveReviewDetail(message.reviewId)
            if (review) {
              this.$set(message, 'contextQuote', {
                kind: 'review',
                title: '用户评价',
                score: Number(review.score || 0),
                nickName: review.nickName || review.nickname || review.nick_name || '',
                userName: this.getReviewDisplayName(review),
                userIcon: review.userIcon || '',
                meta: this.getRelativeMessageTime(review.createTime),
                content: review.plainContent || '暂无评价内容',
                imageList: review.imageList || []
              })
            }
            return
          }
          if (message.contextQuote) {
            return
          }
          if (type === 'copywrite' && message.productId) {
            const product = await this.resolveProductDetail(message.productId)
            if (product) {
              this.$set(message, 'contextQuote', {
                kind: 'product',
                title: '商品信息',
                score: 0,
                meta: '',
                content: '',
                name: product.name || '未命名商品',
                subTitle: product.subTitle || '暂无商品描述',
                price: Number(product.price || 0),
                sold: Number(product.sold || 0),
                coverImg: product.coverImg || ''
              })
            }
            return
          }
          if ((type === 'analysis' || type === 'suggest') && message.timeRange) {
            this.$set(message, 'contextQuote', {
              kind: 'range',
              title: type === 'analysis' ? '经营分析' : '经营建议',
              score: 0,
              meta: this.getTimeRangeLabel(message.timeRange),
              content:
                (this.selectedShopName || '当前店铺') +
                ' · ' +
                this.getTimeRangeLabel(message.timeRange)
            })
          }
        })
      )
    },
    async loadReplyPanelData(shopId, loadToken) {
      this.isPanelLoading = true
      try {
        const response = await listReview({
          shopId: shopId,
          pageNum: this.replyPageNum,
          pageSize: this.replyPageSize
        })

        if (loadToken !== this.panelLoadToken) {
          return
        }

        const rows = this.readResponseRows(response).filter((item) => {
          const sourceType = Number(item && item.sourceType)
          return sourceType === 2 || sourceType === 4
        })
        const reviews = await Promise.all(rows.map(async (item) => {
          const plainContent = this.stripHtml(item.content)
          const score = Number(item.score || 0)
          const replyCount = Number(item.replyCount || 0)
          const sourceType = Number(item.sourceType || 0)
          let sourceName = item.sourceName || ''
          if (!sourceName) {
            if (sourceType === 2) {
              sourceName = this.selectedShopName || '选定店铺'
            } else {
              const product = await this.resolveProductDetail(item.sourceId)
              sourceName =
                (product && product.name) ||
                this.productNameMap[String(item.sourceId)] ||
                ('来源' + item.sourceId)
              if (product && product.name) {
                this.$set(this.productNameMap, String(item.sourceId), product.name)
              }
            }
          }
          return Object.assign({}, item, {
            plainContent: plainContent,
            score: score,
            imageList: this.parseImageList(item.images),
            replyCount: replyCount,
            isReplied: replyCount > 0,
            nickName: item.nickName || item.nickname || item.nick_name || '',
            userName: item.nickName || item.nickname || item.nick_name || item.userName || '匿名用户',
            userIcon: this.buildFileUrl(item.userIcon || item.user_icon || ''),
            sourceName: sourceName
          })
        }))

        this.replyReviews = reviews.sort((left, right) => {
          return this.normalizeTimestamp(right.createTime) - this.normalizeTimestamp(left.createTime)
        })
        const replyPaging = this.resolvePagingTotal(
          response,
          this.replyReviews.length,
          this.replyPageNum,
          this.replyPageSize
        )
        this.replyTotalExact = replyPaging.exact
        this.replyTotal = replyPaging.total

        if (!this.replyReviews.some((item) => String(item.id) === String(this.selectedReviewId))) {
          this.selectedReviewId = null
        }
      } catch (error) {
        if (loadToken !== this.panelLoadToken) {
          return
        }
        this.replyReviews = []
        this.replyTotal = 0
        this.replyTotalExact = false
        this.selectedReviewId = null
      } finally {
        if (loadToken === this.panelLoadToken) {
          this.isPanelLoading = false
        }
      }
    },
    async loadCopywritePanelData(shopId, loadToken) {
      this.isPanelLoading = true
      try {
        const response = await listProduct({
          shopId: shopId,
          pageNum: this.productPageNum,
          pageSize: this.productPageSize
        })
        if (loadToken !== this.panelLoadToken) {
          return
        }
        const rows = this.readResponseRows(response)
        this.products = rows.map((item) => this.normalizeProductItem(item)).sort(function (left, right) {
          if (right.sold !== left.sold) {
            return right.sold - left.sold
          }
          return (right.updateTime || right.createTime || 0) - (left.updateTime || left.createTime || 0)
        })
        this.products.forEach((item) => {
          this.$set(this.productNameMap, String(item.id), item.name)
        })
        const productPaging = this.resolvePagingTotal(
          response,
          this.products.length,
          this.productPageNum,
          this.productPageSize
        )
        this.productTotalExact = productPaging.exact
        this.productTotal = productPaging.total
        if (!this.products.some((item) => String(item.id) === String(this.selectedProductId))) {
          this.selectedProductId = null
        }
      } catch (error) {
        if (loadToken !== this.panelLoadToken) {
          return
        }
        this.products = []
        this.productTotal = 0
        this.productTotalExact = false
        this.selectedProductId = null
      } finally {
        if (loadToken === this.panelLoadToken) {
          this.isPanelLoading = false
        }
      }
    },
    async loadAnalysisPanelData(shopId, loadToken) {
      this.isPanelLoading = true
      try {
        const response = await getShopAnalysis(shopId, this.analysisRange)
        if (loadToken !== this.panelLoadToken) {
          return
        }
        this.analysisCards = this.buildAnalysisCards(this.readResponseData(response) || {})
      } catch (error) {
        if (loadToken !== this.panelLoadToken) {
          return
        }
        this.analysisCards = this.createDefaultAnalysisCards()
      } finally {
        if (loadToken === this.panelLoadToken) {
          this.isPanelLoading = false
        }
      }
    },
    async loadSuggestPanelData(shopId, loadToken) {
      this.isPanelLoading = true
      try {
        const response = await getShopSuggest(shopId, this.analysisRange)
        if (loadToken !== this.panelLoadToken) {
          return
        }
        this.suggestCards = this.buildSuggestCards(this.readResponseData(response) || {})
      } catch (error) {
        if (loadToken !== this.panelLoadToken) {
          return
        }
        this.suggestCards = this.createDefaultSuggestCards()
      } finally {
        if (loadToken === this.panelLoadToken) {
          this.isPanelLoading = false
        }
      }
    },
    async refreshActiveTabData(shopId, type, options) {
      const settings = Object.assign(
        {
          preserveReplyPage: false,
          preserveProductPage: false
        },
        options
      )
      const loadToken = ++this.panelLoadToken
      this.resetPanelState(settings)
      if (!shopId) {
        this.isPanelLoading = false
        return
      }
      if (type === 'reply') {
        await this.loadReplyPanelData(shopId, loadToken)
        return
      }
      if (type === 'copywrite') {
        await this.loadCopywritePanelData(shopId, loadToken)
        return
      }
      if (type === 'analysis') {
        await this.loadAnalysisPanelData(shopId, loadToken)
        return
      }
      if (type === 'suggest') {
        await this.loadSuggestPanelData(shopId, loadToken)
        return
      }
      this.isPanelLoading = false
    },
    async handleAnalysisRangeChange(value) {
      if (!value || value === this.analysisRange) {
        return
      }
      this.analysisRange = value
      if (!this.hasSelectedShop || (this.activeType !== 'analysis' && this.activeType !== 'suggest')) {
        return
      }
      try {
        await this.runAfterAbort(async () => {
          await this.refreshActiveTabData(this.selectedShopId, this.activeType)
        })
      } catch (error) {
      }
    },
    async handleReplyPageChange(page) {
      const nextPage = page && typeof page === 'object' ? Number(page.page) : Number(page)
      const nextSize = page && typeof page === 'object' ? Number(page.limit) : Number(this.replyPageSize)
      if (!this.hasSelectedShop || !nextPage) {
        return
      }
      this.replyPageNum = nextPage
      if (nextSize > 0) {
        this.replyPageSize = nextSize
      }
      try {
        this.selectedReviewId = null
        const loadToken = ++this.panelLoadToken
        await this.loadReplyPanelData(this.selectedShopId, loadToken)
      } catch (error) {
      }
    },
    async handleProductPageChange(page) {
      const nextPage = page && typeof page === 'object' ? Number(page.page) : Number(page)
      const nextSize = page && typeof page === 'object' ? Number(page.limit) : Number(this.productPageSize)
      if (!this.hasSelectedShop || !nextPage) {
        return
      }
      this.productPageNum = nextPage
      if (nextSize > 0) {
        this.productPageSize = nextSize
      }
      try {
        this.selectedProductId = null
        const loadToken = ++this.panelLoadToken
        await this.loadCopywritePanelData(this.selectedShopId, loadToken)
      } catch (error) {
      }
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
    async loadSessionMessages(sessionId) {
      const session = this.findSession(sessionId)
      if (!session) {
        return
      }
      const loadToken = ++this.messageLoadToken
      this.isMessageLoading = true
      try {
        const response = await getMerchantSessionMessages(sessionId)
        if (loadToken !== this.messageLoadToken) {
          return
        }
        session.messages = this.normalizeMessageList(response, session.type)
        await this.hydrateSessionMessageQuotes(session)
        session.updatedAt = session.updatedAt || Date.now()
      } catch (error) {
        if (loadToken !== this.messageLoadToken) {
          return
        }
        session.messages = []
      } finally {
        if (loadToken === this.messageLoadToken) {
          this.isMessageLoading = false
          this.$nextTick(() => {
            this.scrollToBottom()
          })
        }
      }
    },
    async loadSessionsByType(shopId, type, options) {
      const settings = Object.assign(
        {
          autoSelectFirst: true,
          preferredSessionId: this.currentSessionId
        },
        options
      )
      const loadToken = ++this.sessionLoadToken
      this.isSessionLoading = true
      try {
        const response = await listMerchantSessions({
          shopId: shopId,
          type: type
        })
        if (loadToken !== this.sessionLoadToken) {
          return
        }
        this.sessions = this.normalizeSessionList(response, type)
        let nextSessionId = null
        if (settings.preferredSessionId && this.findSession(settings.preferredSessionId)) {
          nextSessionId = settings.preferredSessionId
        } else if (settings.autoSelectFirst && this.visibleSessions.length) {
          nextSessionId = this.visibleSessions[0].id
        }
        this.currentSessionId = nextSessionId
        if (nextSessionId) {
          await this.loadSessionMessages(nextSessionId)
        }
      } catch (error) {
        if (loadToken !== this.sessionLoadToken) {
          return
        }
        this.sessions = []
        this.currentSessionId = null
      } finally {
        if (loadToken === this.sessionLoadToken) {
          this.isSessionLoading = false
        }
      }
    },
    async createAndSelectSession(type) {
      const sessionType = type || this.activeType
      const response = await createMerchantSession({
        shopId: this.selectedShopId,
        type: sessionType
      })
      const sessionId = this.readSessionId(response)
      if (!sessionId) {
        throw new Error('会话创建失败，请稍后重试')
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
      this.sessionDropdownVisible = false
      return this.findSession(sessionId)
    },
    async applyShopSelection(value) {
      this.sessionDropdownVisible = false
      this.currentSessionId = null
      this.replyActionReview = null
      this.resetTextInputs()
      this.resetPanelState()
      if (value === null || value === undefined || value === '') {
        this.sessions = []
        this.isPanelLoading = false
        return
      }
      await Promise.all([
        this.loadSessionsByType(value, this.activeType, { autoSelectFirst: true }),
        this.refreshActiveTabData(value, this.activeType)
      ])
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
      try {
        await this.runAfterAbort(async () => {
          this.activeType = type
          this.sessionDropdownVisible = false
          this.replyActionReview = null
          this.resetTextInputs()
          this.selectedReviewId = null
          this.selectedProductId = null
          if (!this.hasSelectedShop) {
            this.sessions = []
            this.currentSessionId = null
            this.resetPanelState()
            return
          }
          await Promise.all([
            this.loadSessionsByType(this.selectedShopId, type, { autoSelectFirst: true }),
            this.refreshActiveTabData(this.selectedShopId, type)
          ])
        })
      } catch (error) {
      }
    },
    async handleCreateSession() {
      if (!this.hasSelectedShop) {
        return
      }
      try {
        await this.runAfterAbort(async () => {
          this.resetTextInputs()
          this.currentSessionId = null
          this.replyActionReview = null
          this.selectedReviewId = null
          this.selectedProductId = null
          this.sessionDropdownVisible = false
          this.$nextTick(() => {
            this.scrollToBottom()
          })
        })
      } catch (error) {
        this.$message.error(error.message || '新建会话失败，请重试')
      }
    },
    async handleSessionSelect(sessionId) {
      const targetSession = this.findSession(sessionId)
      if (!targetSession) {
        return
      }
      try {
        await this.runAfterAbort(async () => {
          this.sessionDropdownVisible = false
          this.currentSessionId = sessionId
          this.replyActionReview = null
          this.selectedReviewId = null
          this.selectedProductId = null
          this.resetTextInputs()
          await this.loadSessionMessages(sessionId)
        })
      } catch (error) {
      }
    },
    async handleRenameSession(session) {
      if (!session || !session.id) {
        return
      }
      try {
        const result = await this.$prompt('请输入新的会话名称', '重命名会话', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputValue: session.title || '',
          inputPattern: /\S+/,
          inputErrorMessage: '名称不能为空'
        })
        const title = String((result && result.value) || '').trim()
        if (!title || title === session.title) {
          return
        }
        session.title = title
        session.updatedAt = Date.now()
        await updateMerchantSessionTitle(session.id, { title: title })
      } catch (error) {
        if (error !== 'cancel' && error !== 'close') {
          this.$message.error(error.message || '重命名失败，请重试')
        }
      }
    },
    async handleDeleteSession(sessionId) {
      try {
        await this.$confirm('是否确认删除该会话？一旦删除无法恢复。', '确认删除', {
          type: 'warning'
        })
      } catch (error) {
        return
      }
      try {
        await this.runAfterAbort(async () => {
          await deleteMerchantSession(sessionId)
          this.sessions = this.sessions.filter(function (item) {
            return String(item.id) !== String(sessionId)
          })
          this.sessionDropdownVisible = false
          if (String(this.currentSessionId) === String(sessionId)) {
            this.currentSessionId = null
            this.replyActionReview = null
            this.resetTextInputs()
            if (this.visibleSessions.length) {
              this.currentSessionId = this.visibleSessions[0].id
              await this.loadSessionMessages(this.currentSessionId)
            }
          }
        })
      } catch (error) {
        this.$message.error(error.message || '删除会话失败，请重试')
      }
    },
    buildReplySessionTitle(review) {
      const content = String((review && review.plainContent) || '').replace(/\s+/g, '')
      return '评价回复：' + (content.slice(0, 10) || '新评价回复')
    },
    buildReplyAutoMessage(review) {
      const targetName = (review && review.sourceName) || this.selectedShopName || '当前店铺'
      return '已选择一条评价，请基于该评价为「' + targetName + '」生成默认回复建议。'
    },
    buildReviewQuote(review) {
      if (!review) {
        return null
      }
      return {
        kind: 'review',
        title: '用户评价',
        score: Number(review.score || 0),
        nickName: review.nickName || review.nickname || review.nick_name || '',
        userName: this.getReviewDisplayName(review),
        userIcon: review.userIcon || '',
        meta: this.getRelativeMessageTime(review.createTime),
        content: review.plainContent || '',
        imageList: review.imageList || []
      }
    },
    buildProductQuote(product) {
      if (!product) {
        return null
      }
      return {
        kind: 'product',
        title: '商品信息',
        score: 0,
        meta: '',
        content: '',
        name: product.name || '未命名商品',
        subTitle: product.subTitle || '暂无商品描述',
        price: Number(product.price || 0),
        sold: Number(product.sold || 0),
        coverImg: product.coverImg || ''
      }
    },
    buildRangeQuote(type, timeRange) {
      const label = this.getTimeRangeLabel(timeRange || this.analysisRange)
      return {
        kind: 'range',
        title: type === 'analysis' ? '经营分析' : '经营建议',
        score: 0,
        meta: label,
        content: (this.selectedShopName || '当前店铺') + ' · ' + label
      }
    },
    normalizeReplyContent(value) {
      let content = String(value || '').trim()
      content = content.replace(/^(回复|AI回复|建议回复)[:：\s]*/i, '')
      content = content.replace(/^(根据评价内容，我建议如下：|我的回复建议如下：)[:：\s]*/i, '')
      content = content.replace(/^AI[:：\s]*/i, '')
      content = content.replace(/^[\"\“]/, '')
      content = content.replace(/[\"\”]$/, '')
      return content.trim()
    },
    async handleReviewSelect(review) {
      if (!review || !review.id) {
        return
      }
      try {
        await this.runAfterAbort(async () => {
          this.replyActionReview = null
          this.selectedReviewId = review.id
          this.activeType = 'reply'
          this.focusMessageInput()
        })
      } catch (error) {
      }
    },
    async handleRegenerateReply() {
      const targetReview = this.replyActionReview || this.selectedReview
      if (!targetReview) {
        return
      }
      try {
        await this.runAfterAbort(async () => {
          const session = await this.ensureSessionForSend('reply')
          const displayMessage = this.buildReplyAutoMessage(targetReview)
          await this.sendMessage('', {
            session: session,
            type: 'reply',
            displayMessage: displayMessage,
            sessionTitle: this.buildReplySessionTitle(targetReview),
            allowEmptyInstruction: true,
            reviewId: targetReview.id,
            review: targetReview
          })
        })
      } catch (error) {
      }
    },
    buildCopywriteSessionTitle(product) {
      const name = String((product && product.name) || '').trim()
      return '营销文案：' + (name.slice(0, 10) || '新营销文案')
    },
    buildCopywriteAutoMessage(product) {
      return '已选择商品「' + ((product && product.name) || '未命名商品') + '」，请基于商品上下文生成默认营销文案。'
    },
    getProductActivityText(activityType) {
      const map = {
        0: '普通日常销售（无特定大促活动，侧重长期口碑和日常转化率优化）。',
        1: '限时大促活动（如：百亿补贴、秒杀、限时折。侧重紧迫感和价格优势，引导快速下单）。'
      }
      return map[Number(activityType)] || '普通日常销售（无特定大促活动，侧重长期口碑和日常转化率优化）。'
    },
    async handleProductSelect(product) {
      if (!product || !product.id) {
        return
      }
      try {
        await this.runAfterAbort(async () => {
          this.selectedProductId = product.id
          this.activeType = 'copywrite'
          this.focusMessageInput()
        })
      } catch (error) {
      }
    },
    handleInputKeydown(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        this.handleSendMessage()
      }
    },
    async handleSendMessage() {
      if (!this.canSubmit) {
        return
      }
      const instruction = String(this.inputMessage || '').trim()
      const allowEmptyInstruction = this.activeType === 'reply' || this.activeType === 'copywrite'
      await this.sendMessage(instruction, {
        type: this.activeType,
        displayMessage: this.buildManualDisplayMessage(this.activeType, instruction),
        allowEmptyInstruction: allowEmptyInstruction,
        reviewId: this.activeType === 'reply' ? this.selectedReviewId : null,
        review: this.activeType === 'reply' ? this.selectedReview : null,
        productId: this.activeType === 'copywrite' ? this.selectedProductId : null,
        product: this.activeType === 'copywrite' ? this.selectedProduct : null,
        timeRange:
          this.activeType === 'analysis' || this.activeType === 'suggest'
            ? this.analysisRange
            : null
      })
    },
    async ensureSessionForSend(type) {
      if (this.currentSession && this.currentSession.type === (type || this.activeType)) {
        return this.currentSession
      }
      return this.createAndSelectSession(type || this.activeType)
    },
    buildManualDisplayMessage(type, instruction) {
      const content = String(instruction || '').trim()
      if (!content) {
        if (type === 'reply') {
          return '请基于当前评价生成回复建议'
        }
        if (type === 'copywrite') {
          return '请基于当前商品生成营销文案'
        }
        if (type === 'analysis') {
          return '请分析当前经营状况'
        }
        if (type === 'suggest') {
          return '请给出当前经营改进建议'
        }
          return '请生成内容'
        }
      return content
    },
    buildRequestMessage(type, instruction, options) {
      const requestInstruction = String(instruction || '').trim()
      if (requestInstruction) {
        return requestInstruction
      }
      const settings = options || {}
      if (type === 'reply') {
        const review = settings.review || this.selectedReview
        const reviewContent = String((review && review.plainContent) || '暂无评价内容')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 80)
        return '请基于当前评价生成默认回复建议。评分：' +
          this.getReviewScoreText(review) +
          '；评价内容：' +
          reviewContent
      }
      if (type === 'copywrite') {
        const product = settings.product || this.selectedProduct
        const productName = (product && product.name) || '未命名商品'
        const productDesc = String((product && product.subTitle) || '暂无商品描述')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 80)
        return '请基于当前商品生成默认营销文案。商品名称：' + productName + '；商品描述：' + productDesc
      }
      if (type === 'analysis') {
        return '请分析店铺 ' + this.currentAnalysisRangeLabel + ' 的经营状况，并输出关键问题与建议。'
      }
      if (type === 'suggest') {
        return '请基于店铺 ' + this.currentAnalysisRangeLabel + ' 的经营数据给出可执行的改进建议。'
      }
      return String(this.activeFeature.title || '请生成内容').trim()
    },
    buildChatRequestPayload(session, type, instruction, options) {
      const settings = options || {}
      const review = settings.review || this.selectedReview
      const product = settings.product || this.selectedProduct
      const reviewId = settings.reviewId || (review && review.id) || this.selectedReviewId || null
      const productId = settings.productId || (product && product.id) || this.selectedProductId || null
      const timeRange =
        type === 'analysis' || type === 'suggest'
          ? settings.timeRange || this.analysisRange
          : null
      return {
        sessionId: session.id,
        shopId: session.shopId,
        type: type,
        message: this.buildRequestMessage(type, instruction, options),
        reviewId: reviewId,
        productId: productId,
        timeRange: timeRange
      }
    },
    buildSessionTitle(message) {
      const title = String(message || '').trim().replace(/\s+/g, ' ').slice(0, 12)
      return title || '新对话'
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
    async sendMessage(message, options) {
      const settings = Object.assign(
        {
          session: null,
          type: this.activeType,
          displayMessage: '',
          sessionTitle: '',
          allowEmptyInstruction: false,
          reviewId: null,
          review: null,
          productId: null,
          product: null,
          timeRange: null
        },
        options
      )

      const requestInstruction = String(message || '').trim()
      const displayMessage = String(settings.displayMessage || requestInstruction).trim()
      if ((!requestInstruction && !settings.allowEmptyInstruction) || !displayMessage) {
        return
      }

      let session = settings.session
      if (!session) {
        session = await this.ensureSessionForSend(settings.type)
      }
      if (!session) {
        return
      }

      const hasUserMessage = (session.messages || []).some(function (item) {
        return item.role === 'user' && item.content
      })
      const now = Date.now()
      const targetReview = settings.review || this.selectedReview
      const targetProduct = settings.product || this.selectedProduct

      this.resetTextInputs()
      session.type = settings.type
      session.updatedAt = now
      session.messages.push({
        role: 'user',
        content: displayMessage,
        createTime: now,
        type: settings.type,
        reviewId: settings.reviewId || null,
        productId: settings.productId || null,
        timeRange: settings.timeRange || '',
        contextQuote:
          settings.type === 'reply'
            ? this.buildReviewQuote(targetReview)
            : settings.type === 'copywrite'
              ? this.buildProductQuote(targetProduct)
              : settings.type === 'analysis' || settings.type === 'suggest'
                ? this.buildRangeQuote(settings.type, settings.timeRange)
                : null
      })

      if (settings.type === 'reply') {
        this.replyActionReview = targetReview ? Object.assign({}, targetReview) : null
        this.selectedReviewId = null
      }
      if (settings.type === 'copywrite') {
        this.selectedProductId = null
      }

      if (!hasUserMessage) {
        session.title = settings.sessionTitle || this.buildSessionTitle(requestInstruction || displayMessage)
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
        this.buildChatRequestPayload(session, settings.type, requestInstruction, settings),
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
          this.$message.error(error.message || 'AI 响应出现异常，请检查网络或稍后重试')
        }
      } finally {
        this.endStreamState()
      }
    },
    async handleQuickReply() {
      const targetReview = this.replyActionReview || this.selectedReview
      if (!targetReview || !this.generatedReplyContent || this.isReplySubmitting) {
        return
      }
      const currentUserId = this.$store.getters.id
      if (!currentUserId) {
        this.$message.error('请先登录后再进行回复发布操作')
        return
      }
      this.isReplySubmitting = true
      try {
        await addComment({
          userId: currentUserId,
          sourceType: 7,
          sourceId: targetReview.id,
          parentId: 0,
          answerId: null,
          images: '',
          content: this.generatedReplyContent,
          status: 0
        })
        this.$message.success('回复内容已成功发布到对应的评价条目中')
        this.currentSessionId = null
        this.selectedReviewId = null
        this.replyActionReview = null
        this.resetTextInputs()
        await this.refreshActiveTabData(this.selectedShopId, 'reply', { preserveReplyPage: true })
        if (!this.replyReviews.length && this.replyPageNum > 1) {
          this.replyPageNum -= 1
          await this.refreshActiveTabData(this.selectedShopId, 'reply', { preserveReplyPage: true })
        }
      } catch (error) {
        this.$message.error(error.message || '回复发布失败，请手动处理')
      } finally {
        this.isReplySubmitting = false
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
.merchant-ai-page {
  padding: 20px;
  min-height: calc(100vh - 84px);
  background:
    radial-gradient(circle at top left, rgba(24, 95, 165, 0.08), transparent 28%),
    linear-gradient(180deg, #f7f8fb 0%, #eef1f6 100%);
}

.assistant-shell {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 96px);
  min-height: calc(100vh - 96px);
  border: 1px solid rgba(202, 210, 224, 0.9);
  border-radius: 22px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(14px);
}

.assistant-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border-bottom: 1px solid #e8ecf3;
  background: rgba(255, 255, 255, 0.92);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.assistant-logo {
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
}

.shop-select {
  width: 220px;
  flex-shrink: 0;
}

.topbar-divider {
  width: 1px;
  height: 22px;
  background: #dde3ec;
  flex-shrink: 0;
}

.feature-tabs {
  display: flex;
  gap: 8px;
  min-width: 0;
  overflow-x: auto;
}

.feature-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  color: #667085;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.feature-tab:hover {
  background: #f4f7fb;
}

.feature-tab.active {
  font-weight: 600;
}

.feature-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
}

.feature-tab.tone-blue .feature-badge {
  background: #b8d7f8;
  color: #114f90;
}

.feature-tab.tone-blue.active {
  background: #e8f2fd;
  border-color: #bfd8f7;
  color: #114f90;
}

.feature-tab.tone-blue.active .feature-badge {
  background: #185fa5;
  color: #ffffff;
}

.feature-tab.tone-green .feature-badge {
  background: #bde8d7;
  color: #0c6b55;
}

.feature-tab.tone-green.active {
  background: #e8f7f1;
  border-color: #c2e6d9;
  color: #0c6b55;
}

.feature-tab.tone-green.active .feature-badge {
  background: #0f6e56;
  color: #ffffff;
}

.feature-tab.tone-orange .feature-badge {
  background: #f9d7a4;
  color: #8b5408;
}.feature-tab.tone-orange.active {
  background: #fff3e3;
  border-color: #f6d8aa;
  color: #8b5408;
}

.feature-tab.tone-orange.active .feature-badge {
  background: #c17a1f;
  color: #ffffff;
}

.feature-tab.tone-purple .feature-badge {
  background: #ddd7fb;
  color: #4d43ae;
}

.feature-tab.tone-purple.active {
  background: #f0edff;
  border-color: #d9d1fb;
  color: #4d43ae;
}

.feature-tab.tone-purple.active .feature-badge {
  background: #5a50c5;
  color: #ffffff;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.session-menu {
  position: relative;
}

.session-trigger,
.new-session-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid #d7dde7;
  background: #ffffff;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease;
}

.session-trigger:hover,
.new-session-btn:hover:not(:disabled) {
  border-color: #bfd1e5;
  background: #f6f9fc;
}

.new-session-btn {
  border-color: #bdd5f3;
  background: #eaf3ff;
  color: #185fa5;
}

.session-trigger:disabled,
.new-session-btn:disabled,
.send-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.session-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  border: 1px solid #dde4ee;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
  z-index: 30;
  overflow: hidden;
}

.dropdown-header {
  padding: 12px 14px 8px;
  font-size: 12px;
  color: #98a2b3;
  border-bottom: 1px solid #eef2f7;
}

.dropdown-list {
  max-height: 280px;
  overflow-y: auto;
  padding: 6px;
}

.dropdown-empty {
  padding: 18px 14px;
  font-size: 13px;
  color: #98a2b3;
  text-align: center;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #f6f9fc;
}

.dropdown-item.active {
  background: #eaf3ff;
}

.dropdown-item-main {
  min-width: 0;
  flex: 1;
}

.dropdown-title {
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #98a2b3;
}

.dropdown-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.dropdown-action {
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #98a2b3;
  cursor: pointer;
}

.dropdown-action:hover {
  background: #eef3f8;
  color: #185fa5;
}

.dropdown-action.delete:hover {
  color: #e24b4a;
}

.assistant-body {
  display: flex;
  flex: 1;
  height: calc(100% - 66px);
  min-height: 0;
  align-items: stretch;
}

.assistant-left {
  width: 368px;
  min-width: 368px;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e8ecf3;
  background: linear-gradient(180deg, #ffffff 0%, #f9fbfd 100%);
  overflow: hidden;
}

.panel-header {
  padding: 16px 16px 12px;
  border-bottom: 1px solid #eef2f7;
  flex-shrink: 0;
}

.panel-title {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
}

.panel-subtitle {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #98a2b3;
}

.panel-search {
  width: 100%;
}

.panel-filter-row {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #eef2f7;
  flex-shrink: 0;
}

.panel-filter-row.compact {
  padding-top: 14px;
}

.panel-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid #eef2f7;
  flex-shrink: 0;
}

.filter-chip {
  padding: 5px 10px;
  border: 1px solid #d8dee8;
  border-radius: 999px;
  background: #ffffff;
  color: #667085;
  font-size: 12px;
  cursor: pointer;
}

.filter-chip.active {
  background: #eaf3ff;
  border-color: #bdd5f3;
  color: #185fa5;
}

.reply-panel .panel-header {
  padding: 18px 18px 14px;
}

.reply-panel .panel-title {
  font-size: 16px;
}

.reply-panel .panel-subtitle {
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.6;
}

.reply-panel ::v-deep .panel-search .el-input__inner {
  height: 44px;
  border: 1px solid #d4dbe6;
  border-radius: 14px;
  background: #ffffff;
  font-size: 15px;
  color: #111827;
}

.reply-panel ::v-deep .panel-search .el-input__prefix {
  left: 8px;
  color: #98a2b3;
}

.reply-panel ::v-deep .panel-search .el-input__inner::placeholder {
  color: #98a2b3;
}

.reply-panel .filter-chip {
  min-width: 74px;
  height: 34px;
  padding: 0 14px;
  border-color: #d7dee8;
  border-radius: 999px;
  font-size: 14px;
}

.reply-panel .filter-chip.active {
  background: #eaf3ff;
  border-color: #b8d5f4;
}

.reply-panel .card-top {
  align-items: flex-start;
}

.reply-panel .card-time {
  font-size: 14px;
  color: #667085;
}

.panel-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  font-size: 12px;
  color: #98a2b3;
  flex-shrink: 0;
}

.panel-summary-total {
  color: #667085;
}

.panel-summary-badge {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: #fff4de;
  color: #bf7a14;
  font-weight: 600;
}

.panel-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px;
  background: #fafbfd;
}

.panel-scroll-section {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background: #fafbfd;
}

.panel-pagination {
  padding: 10px 12px 14px;
  border-top: 1px solid #eef2f7;
  background: #ffffff;
  flex-shrink: 0;
}

.panel-pagination ::v-deep .el-pagination {
  display: flex;
  justify-content: center;
}

.panel-pagination ::v-deep .btn-prev,
.panel-pagination ::v-deep .btn-next,
.panel-pagination ::v-deep .el-pager li {
  min-width: 28px;
  height: 28px;
  line-height: 28px;
  border-radius: 8px;
}

.panel-pagination ::v-deep .el-pager li.active {
  background: #185fa5;
  color: #ffffff;
}

.panel-empty,
.panel-note {
  padding: 18px 16px;
  font-size: 13px;
  line-height: 1.7;
  color: #98a2b3;
}

.panel-scroll-section .data-card-list {
  border-bottom: none;
}

.panel-scroll-section .panel-note {
  padding-top: 0;
}

.review-card,
.product-card {
  margin-bottom: 10px;
  padding: 14px;
  border: 1px solid #e4e9f1;
  border-radius: 16px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.18s ease;
}

.review-card:hover,
.product-card:hover {
  border-color: #bfd1e5;
  transform: translateY(-1px);
}

.review-card.active,
.product-card.active {
  border-color: #bed4ef;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(24, 95, 165, 0.12);
}

.card-top,
.card-bottom,
.card-actions,
.product-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.card-stars {
  font-size: 12px;
  color: #ef9f27;
}

.card-rating,
.context-rating {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.context-rating {
  margin-top: 12px;
}

.rating-star {
  font-size: 16px;
  line-height: 1;
  color: #d0d7e2;
}

.rating-star.small {
  font-size: 13px;
}

.rating-star.active {
  color: #ef9f27;
}

.rating-text {
  margin-left: 4px;
  font-size: 12px;
  color: #667085;
}

.rating-text.inline {
  margin-left: 2px;
}

.card-time,
.card-source,
.product-subtitle,
.product-sold,
.data-sub,
.chat-subtitle,
.context-meta,
.reply-action-text,
.chat-hint,
.welcome-text,
.state-text {
  color: #98a2b3;
}
.card-time,
.card-source,
.product-subtitle,
.product-meta,
.context-meta,
.reply-action-text,
.chat-hint {
  font-size: 12px;
}
.card-content,
.context-content,
.message-content,
.welcome-text,
.state-text {
  word-break: break-word;
  white-space: pre-wrap;
}

.card-content {
  margin: 10px 0;
  font-size: 14px;
  line-height: 1.7;
  color: #111827;
  display: block;
  overflow: visible;
}

.review-meta-line {
  justify-content: flex-start;
  flex-wrap: wrap;
  min-width: 0;
  gap: 6px;
  color: #667085;
}

.review-user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #e6f0fb;
}

.review-user-avatar.medium {
  width: 24px;
  height: 24px;
}

.review-user-avatar.small {
  width: 20px;
  height: 20px;
}

.review-user-avatar-image {
  width: 100%;
  height: 100%;
}

.review-user-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #e6f0fb;
  color: #185fa5;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.context-user-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.message-quote-user {
  font-weight: 600;
  color: #5b6b7f;
}

.review-user-name,
.review-source-name {
  max-width: none;
  overflow: visible;
  font-size: 13px;
  text-overflow: initial;
  white-space: normal;
}

.review-source-name {
  color: #98a2b3;
}

.review-meta-sep {
  color: #c0c8d2;
  flex-shrink: 0;
}

.card-tag {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 13px;
}

.card-tag.success {
  background: #eaf5e4;
  color: #3c6d13;
}

.card-tag.warning {
  background: #fff1df;
  color: #a15b00;
}

.action-btn {
  min-width: 102px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid #d7dee8;
  border-radius: 14px;
  background: #ffffff;
  color: #111827;
  font-size: 15px;
  line-height: 38px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.action-btn:hover {
  border-color: #9fc0e4;
  color: #185fa5;
  box-shadow: 0 8px 18px rgba(24, 95, 165, 0.1);
}

.ghost-action {
  margin-top: 10px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid #bdd5f3;
  border-radius: 10px;
  background: #ffffff;
  color: #185fa5;
  cursor: pointer;
}

.product-card {
  display: flex;
  gap: 10px;
}

.product-cover {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #d8e2ee;
  background: #f8fafc;
  flex-shrink: 0;
}

.product-cover.large {
  width: 56px;
  height: 56px;
  border-radius: 14px;
}

.product-cover.quote {
  width: 44px;
  height: 44px;
  border-radius: 12px;
}

.product-cover-image {
  width: 100%;
  height: 100%;
}

.product-cover-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #eff5ff 0%, #dbeafe 100%);
  color: #185fa5;
  font-size: 16px;
  font-weight: 700;
}

.message-product-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.message-product-card.context {
  margin-top: 12px;
}

.message-product-card.compact .product-subtitle {
  -webkit-line-clamp: 1;
}

.product-main {
  min-width: 0;
  flex: 1;
}

.product-name {
  overflow: hidden;
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-subtitle {
  margin-top: 4px;
  line-height: 1.5;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-meta {
  margin-top: 8px;
}

.product-price {
  font-size: 13px;
  font-weight: 700;
  color: #e24b4a;
}

.data-card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px 16px;
  border-bottom: 1px solid #eef2f7;
}

.data-card-list.no-border {
  border-bottom: none;
}

.data-card {
  padding: 12px 14px;
  border-radius: 14px;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  border: 1px solid #e7ecf3;
}

.data-label {
  font-size: 12px;
  color: #667085;
}

.data-value {
  margin-top: 4px;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

.data-value.small {
  font-size: 15px;
}

.placeholder-gap {
  padding-top: 16px;
}

.assistant-chat {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background:
    radial-gradient(circle at top right, rgba(24, 95, 165, 0.05), transparent 32%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.chat-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  border-bottom: 1px solid #e8ecf3;
  background: rgba(255, 255, 255, 0.9);
}

.chat-title,
.welcome-title,
.state-title,
.reply-action-title,
.context-title {
  color: #111827;
}

.chat-title {
  font-size: 18px;
  font-weight: 700;
}

.chat-subtitle {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.6;
}

.chat-session-tag,
.context-badge {
  display: inline-flex;
  align-items: center;
  max-width: 240px;
  padding: 7px 12px;
  border-radius: 999px;
  background: #eef5ff;
  color: #185fa5;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border: 1px solid #d9e7f7;
}

.chat-message-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 20px 22px;
}

.context-card {
  margin-bottom: 18px;
  padding: 16px 18px;
  border: 1px solid #e4e9f1;
  border-radius: 18px;
  background: linear-gradient(135deg, #f8fbff 0%, #ffffff 100%);
}

.context-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.context-title {
  font-size: 15px;
  font-weight: 700;
}

.context-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 6px;
}

.context-content {
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.8;
  color: #374151;
}

.review-image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.review-image-list.compact {
  margin-top: 8px;
}

.review-image-thumb {
  width: 56px;
  height: 56px;
  overflow: hidden;
  border: 1px solid #dbe3ee;
  border-radius: 10px;
  background: #f8fafc;
  flex-shrink: 0;
}

.review-image-thumb.compact {
  width: 42px;
  height: 42px;
  border-radius: 8px;
}

.review-image-thumb ::v-deep .el-image__inner {
  width: 100%;
  height: 100%;
}

.chat-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 40px 24px;
  text-align: center;
}

.state-mark,
.message-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #eaf3ff;
  color: #185fa5;
  font-size: 14px;
  font-weight: 700;
  border: 1px solid #d8e6f5;
}

.state-mark {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  margin-bottom: 14px;
  font-size: 22px;
}

.state-title {
  font-size: 22px;
  font-weight: 700;
}

.state-text {
  margin-top: 10px;
  max-width: 420px;
  font-size: 14px;
  line-height: 1.7;
}

.message-row {
  display: flex;
  margin-bottom: 18px;
}

.message-row.user {
  justify-content: flex-end;
}

.message-row.ai {
  align-items: flex-start;
}

.message-avatar {
  margin-right: 12px;
  flex-shrink: 0;
}

.message-bubble {
  max-width: 78%;
  padding: 14px 16px;
  border-radius: 18px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.message-bubble.ai {
  border: 1px solid #e4e9f1;
  border-top-left-radius: 6px;
  background: #ffffff;
}

.message-bubble.user {
  border: 1px solid #1b6bb7;
  border-top-right-radius: 6px;
  background: linear-gradient(135deg, #185fa5 0%, #2d7fca 100%);
}

.message-user-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 100%;
  max-width: 78%;
}

.message-user-stack .message-bubble.user {
  max-width: 100%;
}

.message-bubble.user.stacked {
  margin-top: -2px;
  padding: 12px 18px;
  border-top-right-radius: 0;
  border-top-left-radius: 14px;
  box-shadow: 0 8px 20px rgba(24, 95, 165, 0.2);
}

.message-quote-card {
  width: 100%;
  margin: 0;
  padding: 11px 14px;
  border-left: 3px solid #8fc0f1;
  border-radius: 14px 14px 0 14px;
  background: #f7f4ef;
  box-shadow: inset 0 0 0 1px #edf1f6;
}

.message-quote-card.review {
  background: #f6f4ef;
}

.message-quote-card .product-name,
.context-preview .product-name {
  white-space: normal;
}

.message-quote-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 12px;
  line-height: 1.4;
  color: #5b6b7f;
  flex-wrap: wrap;
}

.message-quote-title {
  font-weight: 700;
  color: #356ea8;
}

.message-quote-stars {
  color: #ef9f27;
}

.message-quote-time {
  color: #98a2b3;
}

.message-quote-content {
  font-size: 13px;
  line-height: 1.6;
  color: #1f2937;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-bubble.user .message-content {
  color: #ffffff;
}

.message-content {
  font-size: 14px;
  line-height: 1.8;
  color: #1f2937;
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
  background: #c0c8d2;
  animation: typing-bounce 1s infinite ease-in-out;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dot:nth-child(3) {
  margin-right: 0;
  animation-delay: 0.3s;
}

.reply-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 20px;
  padding: 16px 18px;
  border: 1px solid #dce9f6;
  border-radius: 18px;
  background: #f4f9ff;
}

.reply-action-title {
  font-size: 14px;
  font-weight: 700;
}

.reply-action-buttons {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.chat-input-area {
  padding: 18px 22px 22px;
  border-top: 1px solid #e8ecf3;
  background: rgba(255, 255, 255, 0.92);
}

.chat-context-card {
  margin-bottom: 10px;
  padding: 12px 14px;
  border: 1px solid #dce9f6;
  border-radius: 16px;
  background: #f7fbff;
}

.chat-context-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.chat-context-main {
  min-width: 0;
  flex: 1;
}

.chat-context-title {
  font-size: 13px;
  font-weight: 700;
  color: #185fa5;
}

.chat-context-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid #d6e3f1;
  border-radius: 999px;
  background: #ffffff;
  color: #7c8aa0;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.18s ease;
}

.chat-context-close:hover {
  border-color: #b8cfe7;
  color: #185fa5;
  background: #f3f8fe;
}

.chat-context-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: #667085;
}

.chat-context-content {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: #1f2937;
  white-space: pre-wrap;
  word-break: break-word;
}

.chat-context-tip {
  margin-bottom: 10px;
  padding: 10px 12px;
  border: 1px solid #dce9f6;
  border-radius: 14px;
  background: #f4f9ff;
  color: #185fa5;
  font-size: 12px;
  line-height: 1.6;
}

.chat-input-box {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #d7dde7;
  border-radius: 18px;
  background: #f8fafc;
  transition: all 0.2s ease;
}

.chat-input-box:focus-within {
  border-color: #185fa5;
  box-shadow: 0 0 0 4px rgba(24, 95, 165, 0.08);
}

.chat-input-box.disabled {
  background: #f1f5f9;
}

.chat-textarea {
  flex: 1;
  min-height: 28px;
  max-height: 120px;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  color: #111827;
  font-size: 14px;
  line-height: 1.7;
  resize: none;
  font-family: inherit;
}

.send-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 12px;
  background: #185fa5;
  color: #ffffff;
  cursor: pointer;
}

.chat-hint {
  margin-top: 10px;
  font-size: 12px;
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

@media (max-width: 1280px) {
  .assistant-shell {
    height: auto;
  }

  .assistant-body {
    height: auto;
    flex-direction: column;
  }

  .assistant-left {
    width: 100%;
    min-width: 0;
    height: auto;
    border-right: none;
    border-bottom: 1px solid #e8ecf3;
  }

  .panel-list {
    max-height: 320px;
  }

  .panel-scroll-section {
    max-height: 320px;
  }
}

@media (max-width: 1500px) and (min-width: 1281px) {
  .assistant-left {
    width: 340px;
    min-width: 340px;
  }
}

@media (max-width: 900px) {
  .merchant-ai-page {
    padding: 12px;
  }

  .assistant-topbar,
  .chat-header,
  .chat-message-list,
  .chat-input-area {
    padding-left: 14px;
    padding-right: 14px;
  }

  .assistant-topbar,
  .topbar-left,
  .chat-header,
  .context-head,
  .reply-action-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .topbar-left,
  .topbar-right {
    width: 100%;
  }

  .shop-select {
    width: 100%;
  }

  .topbar-right {
    justify-content: space-between;
  }

  .feature-tabs {
    width: 100%;
  }

  .session-menu,
  .session-trigger,
  .new-session-btn {
    width: 100%;
  }

  .session-dropdown {
    left: 0;
    right: auto;
    width: 100%;
  }

  .message-bubble {
    max-width: 100%;
  }

  .reply-action-buttons {
    width: 100%;
  }

  .reply-action-buttons .el-button {
    flex: 1;
  }
}
</style>
