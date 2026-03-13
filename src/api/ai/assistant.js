import request from '@/utils/request'
import { shopList } from '@/api/shop/shop'
import { getToken } from '@/utils/auth'

const STREAM_ENDPOINT = '/ai/merchant/chat'
const SESSION_ENDPOINT = '/ai/merchant/session'
const STREAM_TEXT_KEYS = [
  ['content'],
  ['delta'],
  ['text'],
  ['message'],
  ['data', 'content'],
  ['data', 'delta'],
  ['data', 'text'],
  ['data', 'message'],
  ['result', 'content'],
  ['result', 'delta'],
  ['result', 'text'],
  ['delta', 'content'],
  ['message', 'content'],
  ['choices', 0, 'delta', 'content'],
  ['choices', 0, 'text'],
  ['choices', 0, 'message', 'content']
]

export function getShopOptions() {
  return shopList()
}

export function listMerchantSessions(params) {
  return request({
    url: SESSION_ENDPOINT + '/list',
    method: 'get',
    params: params
  })
}

export function createMerchantSession(data) {
  return request({
    url: SESSION_ENDPOINT,
    method: 'post',
    data: data
  })
}

export function updateMerchantSessionTitle(sessionId, data) {
  return request({
    url: SESSION_ENDPOINT + '/' + sessionId + '/title',
    method: 'put',
    data: data
  })
}

export function deleteMerchantSession(sessionId) {
  return request({
    url: SESSION_ENDPOINT + '/' + sessionId,
    method: 'delete'
  })
}

export function getMerchantSessionMessages(sessionId) {
  return request({
    url: SESSION_ENDPOINT + '/' + sessionId + '/messages',
    method: 'get'
  })
}

export function createAiChatStream(payload, handlers) {
  const controller = new AbortController()

  return {
    controller: controller,
    promise: runAiChatStream(payload, handlers || {}, controller)
  }
}

async function runAiChatStream(payload, handlers, controller) {
  let response
  let reader
  let decoder
  let buffer = ''
  let fullText = ''
  let isDone = false

  try {
    response = await fetch(buildStreamUrl(), {
      method: 'POST',
      headers: buildStreamHeaders(),
      body: JSON.stringify(payload || {}),
      signal: controller.signal
    })

    if (!response.ok) {
      throw await createStreamError(response)
    }

    if (typeof handlers.onOpen === 'function') {
      handlers.onOpen(response)
    }

    if (!response.body || typeof response.body.getReader !== 'function') {
      const fallbackText = await response.text()
      if (fallbackText) {
        fullText += fallbackText
        emitChunk(handlers, fallbackText)
      }
      if (typeof handlers.onDone === 'function') {
        handlers.onDone(fullText)
      }
      return fullText
    }

    reader = response.body.getReader()
    decoder = new TextDecoder('utf-8')

    while (!isDone) {
      const readResult = await reader.read()
      const value = readResult.value
      const done = readResult.done

      if (done) {
        buffer += decoder.decode()
        fullText += flushEventBuffer(buffer, handlers)
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const parsed = splitEventBuffer(buffer, handlers)
      buffer = parsed.buffer
      fullText += parsed.text
      isDone = parsed.done
    }

    if (typeof handlers.onDone === 'function') {
      handlers.onDone(fullText)
    }

    return fullText
  } catch (error) {
    if (typeof handlers.onError === 'function') {
      handlers.onError(error)
    }
    throw error
  } finally {
    if (reader && typeof reader.releaseLock === 'function') {
      try {
        reader.releaseLock()
      } catch (e) {
      }
    }
    if (typeof handlers.onFinally === 'function') {
      handlers.onFinally()
    }
  }
}

function buildStreamUrl() {
  const baseUrl = (process.env.VUE_APP_BASE_API || '').replace(/\/$/, '')
  return baseUrl + STREAM_ENDPOINT
}

function buildStreamHeaders() {
  const headers = {
    'Content-Type': 'application/json;charset=utf-8',
    Accept: 'text/event-stream'
  }
  const token = getToken()
  if (token) {
    headers.Authorization = 'Bearer ' + token
  }
  return headers
}

async function createStreamError(response) {
  let message = 'AI 助手请求失败'
  try {
    const responseText = await response.text()
    if (responseText) {
      try {
        const parsed = JSON.parse(responseText)
        message = extractErrorMessage(parsed) || responseText || message
      } catch (e) {
        message = responseText
      }
    }
  } catch (e) {
  }
  return new Error(message)
}

function splitEventBuffer(buffer, handlers) {
  let separator = findEventSeparator(buffer)
  let text = ''
  let done = false

  while (separator.index !== -1) {
    const eventBlock = buffer.slice(0, separator.index)
    buffer = buffer.slice(separator.index + separator.length)
    const eventResult = parseEventBlock(eventBlock)

    if (eventResult.done) {
      done = true
      break
    }

    if (eventResult.text) {
      text += eventResult.text
      emitChunk(handlers, eventResult.text)
    }

    separator = findEventSeparator(buffer)
  }

  return {
    buffer: buffer,
    text: text,
    done: done
  }
}

function flushEventBuffer(buffer, handlers) {
  const eventResult = parseEventBlock(buffer)
  if (eventResult.done) {
    return ''
  }
  if (eventResult.text) {
    emitChunk(handlers, eventResult.text)
    return eventResult.text
  }
  return ''
}

function findEventSeparator(buffer) {
  let separator = '\n\n'
  let separatorIndex = buffer.indexOf(separator)
  if (separatorIndex !== -1) {
    return {
      index: separatorIndex,
      length: separator.length
    }
  }

  separator = '\r\n\r\n'
  separatorIndex = buffer.indexOf(separator)
  return {
    index: separatorIndex,
    length: separator.length
  }
}

function parseEventBlock(eventBlock) {
  const payload = extractEventData(eventBlock)
  if (!payload) {
    return { text: '', done: false }
  }

  if (payload === '[DONE]') {
    return { text: '', done: true }
  }

  return {
    text: parseStreamPayload(payload),
    done: false
  }
}

function extractEventData(eventBlock) {
  if (!eventBlock) {
    return ''
  }

  const lines = eventBlock.split(/\r?\n/)
  const dataLines = []

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    if (!line || line.indexOf(':') === 0) {
      continue
    }
    if (line.indexOf('data:') === 0) {
      dataLines.push(line.replace(/^data:\s?/, ''))
    }
  }

  if (!dataLines.length) {
    return eventBlock.trim()
  }

  return dataLines.join('\n').trim()
}

function parseStreamPayload(payload) {
  if (!payload) {
    return ''
  }

  try {
    const parsed = JSON.parse(payload)

    if (typeof parsed === 'string' || typeof parsed === 'number') {
      return String(parsed)
    }

    if (parsed && typeof parsed === 'object') {
      const errorMessage = extractErrorMessage(parsed)
      if (errorMessage) {
        throw new Error(errorMessage)
      }
      return extractTextFromObject(parsed)
    }
  } catch (error) {
    if (error && error.name && error.name !== 'SyntaxError') {
      throw error
    }
    return payload
  }

  return ''
}

function extractTextFromObject(source) {
  for (let index = 0; index < STREAM_TEXT_KEYS.length; index++) {
    const value = readValueByPath(source, STREAM_TEXT_KEYS[index])
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value)
    }
  }
  return ''
}

function extractErrorMessage(source) {
  if (!source || typeof source !== 'object') {
    return ''
  }

  if (source.error && typeof source.error === 'string') {
    return source.error
  }

  if (source.error && source.error.message) {
    return source.error.message
  }

  if (source.code && Number(source.code) !== 200 && source.msg) {
    return source.msg
  }

  return ''
}

function readValueByPath(source, path) {
  let current = source
  for (let index = 0; index < path.length; index++) {
    if (current === null || current === undefined) {
      return undefined
    }
    current = current[path[index]]
  }
  return current
}

function emitChunk(handlers, text) {
  if (typeof handlers.onChunk === 'function' && text) {
    handlers.onChunk(text)
  }
}
