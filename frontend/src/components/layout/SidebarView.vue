<template>
  <div class="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
    <!-- 顶部操作区 -->
    <div class="p-4 border-b border-gray-200 flex justify-between items-center">
      <button 
        @click="createNewChat"
        class="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        新聊天
      </button>
      
      <button class="p-2 text-gray-500 hover:text-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
      </button>
    </div>
    
    <!-- 聊天列表 -->
    <div class="flex-1 overflow-y-auto p-2">
      <div v-if="chatStore.chats.length === 0" class="text-center p-4 text-gray-500">
        没有聊天记录
      </div>
      
      <div v-else>
        <div 
          v-for="chat in chatStore.chats" 
          :key="chat.id"
          @click="selectChat(chat.id)"
          :class="[
            'p-3 rounded-md cursor-pointer mb-1 flex justify-between items-center group',
            chatStore.currentChatId === chat.id ? 'bg-gray-200' : 'hover:bg-gray-100'
          ]"
        >
          <div class="truncate flex-1">{{ chat.title }}</div>
          
          <div class="hidden group-hover:flex items-center gap-1">
            <button 
              @click.stop="openRenameDialog(chat)"
              class="p-1 text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
            </button>
            
            <button 
              @click.stop="deleteChat(chat.id)"
              class="p-1 text-gray-500 hover:text-red-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 重命名对话弹窗 -->
    <div v-if="showRenameDialog" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div class="bg-white p-4 rounded-lg shadow-lg w-80">
        <h3 class="text-lg font-medium mb-4">重命名对话</h3>
        <input 
          v-model="newChatTitle" 
          class="w-full p-2 border rounded-md mb-4"
          placeholder="输入新名称"
          ref="renameInput"
        />
        <div class="flex justify-end gap-2">
          <button 
            @click="showRenameDialog = false"
            class="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            取消
          </button>
          <button 
            @click="renameChat"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useChatStore, type Chat } from '../../stores/chatStore';

const chatStore = useChatStore();

// 重命名对话相关状态
const showRenameDialog = ref(false);
const newChatTitle = ref('');
const chatToRename = ref<Chat | null>(null);
const renameInput = ref<HTMLInputElement | null>(null);

// 创建新聊天
function createNewChat() {
  chatStore.createChat();
}

// 选择聊天
function selectChat(chatId: string) {
  chatStore.selectChat(chatId);
}

// 删除聊天
function deleteChat(chatId: string) {
  if (confirm('确定要删除此对话吗？')) {
    chatStore.deleteChat(chatId);
  }
}

// 打开重命名对话框
function openRenameDialog(chat: Chat) {
  chatToRename.value = chat;
  newChatTitle.value = chat.title;
  showRenameDialog.value = true;
  
  // 对话框打开后，自动聚焦输入框
  nextTick(() => {
    renameInput.value?.focus();
  });
}

// 确认重命名
function renameChat() {
  if (chatToRename.value && newChatTitle.value.trim()) {
    chatStore.renameChat(chatToRename.value.id, newChatTitle.value.trim());
    showRenameDialog.value = false;
    chatToRename.value = null;
    newChatTitle.value = '';
  }
}
</script>