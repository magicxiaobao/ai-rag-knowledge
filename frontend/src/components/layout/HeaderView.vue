<template>
  <header class="border-b border-gray-200 p-4 flex justify-between items-center">
    <div class="flex-1"></div>

    <!-- 模型选择下拉菜单 -->
    <div class="relative" v-if="chatStore.currentChat">
      <button
        @click.stop="toggleModelDropdown"
        class="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md min-w-[200px] justify-between"
      >
        <div class="flex items-center gap-2 overflow-hidden">
          <img :src="getModelLogo(selectedModel)" alt="Model" class="w-5 h-5 rounded-full flex-shrink-0" />
          <span class="truncate">{{ selectedModel }}</span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          class="w-4 h-4 flex-shrink-0"
          :class="showModelDropdown ? 'rotate-180' : ''"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        v-if="showModelDropdown"
        class="absolute mt-1 py-1 w-[240px] bg-white border border-gray-200 rounded-md shadow-lg z-10 right-0"
      >
        <div
          v-for="model in modelOptions"
          :key="model.id"
          @click.stop="selectModel(model.id)"
          class="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
          :class="{'bg-gray-100': model.id === selectedModel}"
        >
          <img :src="model.logo" :alt="model.name" class="w-5 h-5 rounded-full flex-shrink-0" />
          <span class="truncate">{{ model.name }}</span>
        </div>
      </div>
    </div>

    <!-- 右侧占位 -->
    <div class="flex-1 flex justify-end">
      <button class="p-2 text-gray-500 hover:text-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.869a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useChatStore } from '../../stores/chatStore';

const chatStore = useChatStore();
const showModelDropdown = ref(false);

// 模型选项
const modelOptions = [
  { id: 'deepseek-r1', name: 'deepseek-r1', logo: '/deepseek-logo.png' },
  { id: 'deepseek-r1:1.5b', name: 'deepseek-r1:1.5b', logo: '/deepseek-logo.png' },
  { id: 'llama3', name: 'llama3', logo: '/llama-logo.png' }
];

// 当前选中的模型
const selectedModel = computed(() => {
  return chatStore.currentChat?.model || '选择模型';
});

// 获取模型的logo
function getModelLogo(modelId: string) {
  const model = modelOptions.find(m => m.id === modelId);
  return model?.logo || '/deepseek-logo.png';
}

// 切换模型下拉菜单
function toggleModelDropdown(event: MouseEvent) {
  event.stopPropagation();
  showModelDropdown.value = !showModelDropdown.value;
}

// 选择模型
function selectModel(modelId: string) {
  if (chatStore.currentChat) {
    // 更新当前聊天的模型
    const chat = chatStore.chats.find(chat => chat.id === chatStore.currentChatId);
    if (chat) {
      chat.model = modelId;
    }
  }
  showModelDropdown.value = false;
}

// 点击外部关闭下拉菜单
function handleClickOutside(event: MouseEvent) {
  if (showModelDropdown.value) {
    showModelDropdown.value = false;
  }
}

// 挂载时添加点击外部事件监听
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

// 卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
