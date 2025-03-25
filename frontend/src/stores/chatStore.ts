import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  model: string
}

export const useChatStore = defineStore('chat', () => {
  const chats = ref<Chat[]>([])
  const currentChatId = ref<string | null>(null)
  const isLoading = ref(false)
  const isStreaming = ref(false)
  const eventSource = ref<EventSource | null>(null)

  const currentChat = computed(() => {
    return chats.value.find(chat => chat.id === currentChatId.value) || null
  })

  function createChat(model: string = 'deepseek-r1:1.5b') {
    const newChat: Chat = {
      id: uuidv4(),
      title: '新对话',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      model
    }

    chats.value.push(newChat)
    currentChatId.value = newChat.id
    return newChat
  }

  function selectChat(chatId: string) {
    currentChatId.value = chatId
  }

  function deleteChat(chatId: string) {
    const index = chats.value.findIndex(chat => chat.id === chatId)
    if (index !== -1) {
      chats.value.splice(index, 1)

      // 如果删除的是当前选中的聊天，则选中最新的聊天
      if (currentChatId.value === chatId) {
        currentChatId.value = chats.value.length > 0 ? chats.value[0].id : null
      }
    }
  }

  function renameChat(chatId: string, newTitle: string) {
    const chat = chats.value.find(chat => chat.id === chatId)
    if (chat) {
      chat.title = newTitle
      chat.updatedAt = new Date()
    }
  }

  function addMessage(message: Message) {
    if (!currentChatId.value) {
      const newChat = createChat()
      newChat.messages.push(message)
    } else {
      const chat = chats.value.find(chat => chat.id === currentChatId.value)
      if (chat) {
        chat.messages.push(message)
        // 根据第一条用户消息自动设置聊天标题
        if (message.role === 'user' && chat.messages.filter(m => m.role === 'user').length === 1) {
          chat.title = message.content.substring(0, 20) + (message.content.length > 20 ? '...' : '')
        }
        chat.updatedAt = new Date()
      }
    }
  }

  function clearMessages(chatId: string) {
    const chat = chats.value.find(chat => chat.id === chatId)
    if (chat) {
      chat.messages = []
      chat.updatedAt = new Date()
    }
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function streamMessage(message: string, model: string = currentChat.value?.model || 'deepseek-r1:1.5b') {
    if (isStreaming.value) {
      stopStreaming()
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date()
    }
    addMessage(userMessage)

    const assistantMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }
    addMessage(assistantMessage)

    isLoading.value = true
    isStreaming.value = true

    const apiUrl = `/api/v1/ollama/generate_stream?model=${encodeURIComponent(model)}&message=${encodeURIComponent(message)}`;
    eventSource.value = new EventSource(apiUrl);

    eventSource.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const result = data.result;

        if (result && result.output && result.output.content) {
          // 追加内容
          assistantMessage.content += result.output.content;

          // 查找当前聊天中的消息并更新
          const chat = chats.value.find(chat => chat.id === currentChatId.value);
          if (chat) {
            const msgIndex = chat.messages.findIndex(msg => msg.id === assistantMessage.id);
            if (msgIndex !== -1) {
              chat.messages[msgIndex].content = assistantMessage.content;
            }
          }
        }

        // 检查是否结束
        if (result && result.metadata && result.metadata.finishReason === 'STOP') {
          stopStreaming();
        }
      } catch (error) {
        console.error('Error parsing event data:', error);
      }
    };

    eventSource.value.onerror = (error) => {
      console.error('EventSource error:', error);
      stopStreaming();
    };
  }

  function stopStreaming() {
    if (eventSource.value) {
      eventSource.value.close();
      eventSource.value = null;
    }
    isLoading.value = false;
    isStreaming.value = false;
  }

  return {
    chats,
    currentChatId,
    currentChat,
    isLoading,
    isStreaming,
    createChat,
    selectChat,
    deleteChat,
    renameChat,
    addMessage,
    clearMessages,
    setLoading,
    streamMessage,
    stopStreaming
  }
})
