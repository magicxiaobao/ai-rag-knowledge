<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden">
    <!-- 聊天内容区域 -->
    <div class="flex-1 overflow-y-auto p-4" ref="chatContainer">
      <!-- 空聊天状态 -->
      <div v-if="!chatStore.currentChat || chatStore.currentChat.messages.length === 0" class="h-full flex flex-col items-center justify-center text-center p-6">
        <div class="bg-gray-50 rounded-full p-6 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 text-gray-400">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium mb-2">{{ chatStore.currentChat ? 'Ollama 对话助手' : '选择或创建一个新对话' }}</h3>
        <p class="text-gray-500 max-w-md">
          {{ chatStore.currentChat 
            ? '发送消息开始对话，或从左侧选择一个已有的对话。' 
            : '点击左侧的"新聊天"按钮开始一个新的对话。' 
          }}
        </p>
      </div>

      <!-- 聊天消息列表 -->
      <div v-else class="space-y-6">
        <div 
          v-for="message in chatStore.currentChat.messages" 
          :key="message.id"
          :class="[
            'flex gap-4 max-w-3xl mx-auto',
            message.role === 'user' ? 'justify-end' : 'justify-start'
          ]"
        >
          <!-- 助手头像 -->
          <div v-if="message.role === 'assistant'" class="flex-shrink-0 mt-1">
            <div class="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            </div>
          </div>
          
          <div :class="['max-w-[85%]', message.role === 'user' ? 'order-first' : '']">
            <!-- 消息头部 -->
            <div class="flex items-center mb-1 text-sm">
              <span class="font-medium">{{ message.role === 'assistant' ? 'Ollama 助手' : '你' }}</span>
              <span class="ml-2 text-gray-500">{{ formatTime(message.timestamp) }}</span>
            </div>
            
            <!-- 消息内容 -->
            <div 
              :class="[
                'p-4 rounded-lg whitespace-pre-wrap',
                message.role === 'assistant' 
                  ? 'bg-white border border-gray-200' 
                  : 'bg-primary text-primary-foreground'
              ]"
            >
              {{ message.content }}
            </div>
            
            <!-- 消息操作按钮 (仅助手消息显示) -->
            <div v-if="message.role === 'assistant'" class="flex mt-2 gap-1">
              <button 
                @click="copyMessage(message.content)"
                class="p-1 text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
                title="复制"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5" />
                </svg>
                复制
              </button>
            </div>
          </div>
          
          <!-- 用户头像 -->
          <div v-if="message.role === 'user'" class="flex-shrink-0 mt-1">
            <div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 加载状态指示器 -->
      <div v-if="chatStore.isLoading" class="flex justify-center my-4">
        <div class="animate-pulse flex space-x-2">
          <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
          <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
          <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
        </div>
      </div>
    </div>
    
    <!-- 输入区域 -->
    <div class="border-t border-gray-200 p-4 bg-white">
      <div class="max-w-3xl mx-auto">
        <div class="flex items-end gap-2">
          <textarea
            v-model="inputMessage"
            placeholder="输入一条消息..."
            class="flex-1 p-3 border border-gray-300 rounded-md resize-none max-h-32"
            :rows="textareaRows"
            :disabled="!chatStore.currentChat || chatStore.isLoading"
            @input="autoResizeTextarea"
            @keydown.enter.prevent="handleEnterKey"
          ></textarea>
          
          <button 
            @click="sendMessage"
            :disabled="!canSendMessage"
            :class="[
              'px-4 py-3 rounded-md flex items-center justify-center',
              canSendMessage 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            ]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-2 text-center">
          <span class="truncate inline-block max-w-[150px] align-bottom">{{ chatStore.currentChat?.model || 'deepseek-r1' }}</span> 可能会产生不准确的信息。
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { useChatStore } from '../stores/chatStore';
import { format } from 'date-fns';

const chatStore = useChatStore();
const inputMessage = ref('');
const chatContainer = ref<HTMLElement | null>(null);
const textareaRows = ref(1);

// 是否可以发送消息
const canSendMessage = computed(() => {
  return chatStore.currentChat && inputMessage.value.trim() && !chatStore.isLoading;
});

// 自动调整文本框行数
function autoResizeTextarea(e: Event) {
  const textarea = e.target as HTMLTextAreaElement;
  const lineCount = textarea.value.split('\n').length;
  textareaRows.value = Math.min(Math.max(1, lineCount), 5);
}

// 处理回车键
function handleEnterKey(e: KeyboardEvent) {
  // 如果按住Shift键+回车，则插入换行符
  if (e.shiftKey) {
    return;
  }
  
  // 否则发送消息
  sendMessage();
}

// 发送消息
function sendMessage() {
  if (!canSendMessage.value) return;
  
  const message = inputMessage.value.trim();
  if (!message) return;
  
  // 使用流式API发送消息
  chatStore.streamMessage(message);
  
  // 清空输入框
  inputMessage.value = '';
  textareaRows.value = 1;
  
  // 滚动到底部
  scrollToBottom();
}

// 复制消息内容
function copyMessage(text: string) {
  navigator.clipboard.writeText(text);
}

// 格式化时间
function formatTime(date: Date) {
  return format(date, 'HH:mm:ss');
}

// 滚动到底部
function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
}

// 监听消息变化，自动滚动到底部
watch(() => chatStore.currentChat?.messages.length, () => {
  scrollToBottom();
});

// 当选中的聊天改变时，滚动到底部
watch(() => chatStore.currentChatId, () => {
  scrollToBottom();
});

// 组件挂载时，如果没有选中的聊天，则创建一个新聊天
onMounted(() => {
  if (chatStore.chats.length === 0) {
    chatStore.createChat();
  }
  
  scrollToBottom();
});
</script> 