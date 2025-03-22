<template>
  <div class="chat-container">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 p-3 shadow-sm">
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <h1 class="text-lg font-medium text-gray-800">AI 聊天助手</h1>
        <button 
          @click="clearChat" 
          class="text-gray-600 hover:text-gray-800"
        >
          <span class="text-sm">清空对话</span>
        </button>
      </div>
    </header>
    
    <!-- Chat Messages Area -->
    <div class="chat-messages overflow-auto" ref="messagesContainer">
      <div v-if="messages.length === 0" class="flex items-center justify-center h-full w-full">
        <div class="text-center p-8 max-w-md">
          <div class="mb-4">
            <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900">开始一段对话</h3>
          <p class="mt-2 text-gray-500">随时提问，我将尽力帮助您！</p>
        </div>
      </div>
      
      <div v-else class="conversation-flow">
        <div v-for="(messageGroup, index) in messageGroups" :key="index" class="message-group mb-6">
          <!-- 用户消息 -->
          <div v-if="messageGroup.user" class="mb-4">
            <div class="section-header mb-2">
              <div class="font-medium text-gray-700">用户</div>
            </div>
            <ChatMessage 
              :content="messageGroup.user.content" 
              :role="messageGroup.user.role"
              :completed="messageGroup.user.completed"
              :timestamp="messageGroup.user.timestamp"
            />
          </div>
          
          <!-- 智能客服回复 -->
          <div v-if="messageGroup.assistant" class="mt-2">
            <div class="section-header mb-2">
              <div class="font-medium text-gray-700">智能客服</div>
            </div>
            <ChatMessage 
              :content="messageGroup.assistant.content" 
              :role="messageGroup.assistant.role"
              :completed="messageGroup.assistant.completed"
              :timestamp="messageGroup.assistant.timestamp"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Input Area -->
    <div class="input-container">
      <div class="max-w-7xl mx-auto flex flex-col">
        <div class="flex items-center">
          <textarea 
            v-model="userInput" 
            @keydown.enter.prevent="handleEnterKey"
            class="chat-input flex-1 resize-none"
            placeholder="在这里输入消息..."
            rows="1"
            ref="inputElement"
            :disabled="isLoading"
          ></textarea>
          <button 
            @click="sendMessage" 
            class="send-button flex items-center"
            :disabled="isLoading || !userInput.trim()"
          >
            <span v-if="isLoading">
              <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            <span v-else>发送</span>
          </button>
        </div>
        <div class="flex justify-between items-center pt-2">
          <div class="flex space-x-3">
            <button class="text-gray-500 p-1 hover:bg-gray-100 rounded" :disabled="isLoading">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
            </button>
            <button class="text-gray-500 p-1 hover:bg-gray-100 rounded" :disabled="isLoading">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
              </svg>
            </button>
          </div>
          <div>
            <span class="text-xs text-gray-500">Tokens: {{ userInput.trim().length }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useChatStore } from '../stores/chat'
import ChatMessage from './ChatMessage.vue'

const chatStore = useChatStore()
const userInput = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const inputElement = ref<HTMLTextAreaElement | null>(null)

const messages = computed(() => chatStore.messages)
const isLoading = computed(() => chatStore.isLoading)
const error = computed(() => chatStore.error)

// 整理消息为用户-助手的问答对话形式
const messageGroups = computed(() => {
  const groups = []
  const sortedMessages = [...messages.value].sort((a, b) => a.timestamp - b.timestamp)
  
  let currentUser = null
  let currentAssistant = null
  
  for (let i = 0; i < sortedMessages.length; i++) {
    const current = sortedMessages[i]
    
    if (current.role === 'user') {
      // 如果有上一组对话还未添加到groups，先添加
      if (currentUser || currentAssistant) {
        groups.push({
          user: currentUser,
          assistant: currentAssistant
        })
      }
      
      // 开始新的对话组
      currentUser = current
      currentAssistant = null
      
      // 寻找这条用户消息对应的助手回复
      if (i + 1 < sortedMessages.length && sortedMessages[i + 1].role === 'assistant') {
        currentAssistant = sortedMessages[i + 1]
        i++ // 跳过下一条消息，因为已经处理了
      }
      
      // 添加当前的对话组
      groups.push({
        user: currentUser,
        assistant: currentAssistant
      })
      
      // 重置当前组
      currentUser = null
      currentAssistant = null
    } else if (current.role === 'assistant' && i === 0) {
      // 处理对话开始就是助手消息的情况
      groups.push({
        user: null,
        assistant: current
      })
    } else if (current.role === 'assistant' && !currentAssistant) {
      // 处理孤立的助手消息
      currentAssistant = current
      groups.push({
        user: null,
        assistant: currentAssistant
      })
      currentAssistant = null
    }
  }
  
  return groups
})

// 获取当前时间，格式为 YYYY/MM/DD HH:MM
const getCurrentTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  
  return `${year}/${month}/${day} ${hours}:${minutes}`
}

// 获取指定角色的最后一条消息
const getLastMessage = (role: 'user' | 'assistant') => {
  for (let i = messages.value.length - 1; i >= 0; i--) {
    if (messages.value[i].role === role) {
      return messages.value[i]
    }
  }
  return null
}

const sendMessage = async () => {
  const message = userInput.value.trim()
  if (!message || isLoading.value) return
  
  userInput.value = ''
  
  // Resize textarea back to normal
  if (inputElement.value) {
    inputElement.value.style.height = 'auto'
  }
  
  await chatStore.sendMessage(message)
}

const handleEnterKey = (event: KeyboardEvent) => {
  if (event.shiftKey) return
  if (isLoading.value) return // 如果正在加载，不处理回车键
  sendMessage()
}

const clearChat = () => {
  chatStore.clearMessages()
}

// Scroll to bottom when new messages arrive
watch(() => messages.value.length, async () => {
  await nextTick()
  scrollToBottom()
})

// Also watch message content and loading state for updates
watch(
  [
    () => isLoading.value,
    () => {
      const lastMsg = messages.value[messages.value.length - 1]
      return lastMsg ? lastMsg.content : ''
    }
  ],
  async () => {
    await nextTick()
    scrollToBottom()
  }
)

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Auto-resize textarea based on content
watch(userInput, () => {
  if (!inputElement.value) return
  
  inputElement.value.style.height = 'auto'
  inputElement.value.style.height = `${inputElement.value.scrollHeight}px`
})

// 当加载状态变化时，处理输入框状态
watch(() => isLoading.value, (newValue) => {
  if (!newValue && inputElement.value) {
    // 当加载完成时，重新聚焦输入框
    nextTick(() => {
      inputElement.value?.focus()
    })
  }
})

// Focus input on mount
onMounted(() => {
  if (inputElement.value) {
    inputElement.value.focus()
  }
})
</script>

<style scoped>
.conversation-flow {
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
}

.message-group {
  margin-bottom: 1.5rem;
  background-color: #f7f7f8;
  border-radius: 0.5rem;
  padding: 1rem;
}

.section-header {
  padding: 0.25rem 0.5rem;
  border-bottom: 1px solid #eee;
}

/* 禁用状态的样式 */
textarea:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style> 