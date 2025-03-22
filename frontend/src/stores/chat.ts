import { defineStore } from 'pinia'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: number
  completed?: boolean // 标记消息是否已完成接收
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [] as Message[],
    isLoading: false,
    error: null as string | null,
    eventSource: null as EventSource | null,
    timeoutId: null as number | null, // 新增：存储超时ID以便清除
  }),
  
  actions: {
    addMessage(role: 'user' | 'assistant', content: string) {
      this.messages.push({
        id: Date.now().toString(),
        content,
        role,
        timestamp: Date.now(),
        completed: role === 'user' // 用户消息默认完成，助手消息默认未完成
      })
    },
    
    clearMessages() {
      this.messages = []
      this.abortStream() // 清空消息时关闭SSE连接
    },
    
    abortStream() {
      // 清除可能存在的超时计时器
      if (this.timeoutId !== null) {
        clearTimeout(this.timeoutId)
        this.timeoutId = null
      }
      
      if (this.eventSource) {
        try {
          this.eventSource.close()
        } catch (e) {
          console.error('关闭SSE连接失败:', e)
        }
        this.eventSource = null
        this.isLoading = false
      }
    },
    
    async sendMessage(content: string) {
      // 如果有正在加载的消息，则先中止当前流
      if (this.isLoading) {
        this.abortStream()
      }
      
      // 添加用户消息
      this.addMessage('user', content)
      
      // 创建助手消息占位符 - 单独创建助手消息
      const assistantMessageId = `assistant-${Date.now().toString()}`
      this.messages.push({
        id: assistantMessageId,
        content: '',
        role: 'assistant', // 明确标记为assistant角色
        timestamp: Date.now() + 100, // 确保时间戳比用户消息略晚，便于排序和匹配
        completed: false // 标记为未完成
      })
      
      this.isLoading = true
      this.error = null
      
      try {
        // 构建请求URL
        const model = 'deepseek-r1:1.5b' // 可以根据需要调整模型
        const encodedMessage = encodeURIComponent(content)
        
        // 使用 generate_stream 端点而不是 generate
        const url = `/api/v1/ollama/generate_stream?model=${model}&message=${encodedMessage}`
        
        // 关闭旧的连接并创建新的连接
        this.abortStream()
        
        this.eventSource = new EventSource(url)
        
        // 处理连接打开事件
        this.eventSource.onopen = () => {
          console.log('SSE 连接已打开')
        }
        
        // 累积的消息内容
        let fullMessage = ''
        
        // 创建更健壮的消息移除函数
        const cleanMessage = (text: string) => {
          if (!text) return '';
          // 不再移除<think>标签及其内容，保留完整的think标签
          return text.trim();
        };
        
        // 处理消息事件
        this.eventSource.onmessage = (event) => {
          try {
            // 重置心跳检测计时器 - 每次收到消息都延长超时时间
            if (this.timeoutId !== null) {
              clearTimeout(this.timeoutId)
            }

            // 尝试解析服务器发送的数据
            const rawData = event.data;
            let messageContent = '';
            
            try {
              const data = JSON.parse(rawData);
              
              // 检查是否为完成消息
              if (data.done === true) {
                console.log('消息完成标志收到');
                // 更新消息的完成状态
                const index = this.messages.findIndex(msg => msg.id === assistantMessageId);
                if (index !== -1) {
                  this.messages[index].completed = true;
                  // 强制触发更新
                  this.messages = [...this.messages];
                }
                
                this.isLoading = false;
                this.abortStream(); // 消息完成时关闭连接
                return;
              }
              
              // 处理特殊的JSON格式，提取消息内容
              if (data.result?.output?.content) {
                messageContent = data.result.output.content;
              } else if (data.results?.[0]?.output?.content) {
                messageContent = data.results[0].output.content;
              } else if (data.content) {
                messageContent = data.content;
              } else if (data.output?.content) {
                messageContent = data.output.content;
              } else if (typeof data.result === 'string') {
                messageContent = data.result;
              } else if (typeof data.output === 'string') {
                messageContent = data.output;
              } else if (data.result) {
                // 尝试从复杂对象中提取content字段
                const resultStr = JSON.stringify(data.result);
                const contentMatch = resultStr.match(/"content"\s*:\s*"([^"]+)"/);
                if (contentMatch && contentMatch[1]) {
                  messageContent = contentMatch[1];
                }
              } else if (data.results && Array.isArray(data.results) && data.results.length > 0) {
                if (typeof data.results[0] === 'string') {
                  messageContent = data.results[0];
                } else if (data.results[0].content) {
                  messageContent = data.results[0].content;
                } else if (data.results[0].output?.content) {
                  messageContent = data.results[0].output.content;
                }
              }
            } catch (jsonError) {
              // 如果JSON解析失败，尝试直接使用原始数据
              if (rawData && typeof rawData === 'string') {
                messageContent = rawData;
              }
            }
            
            // 清理消息内容中的特殊标记，但保留有效的Markdown格式
            messageContent = cleanMessage(messageContent);
            
            if (messageContent) {
              // 累积消息内容
              fullMessage += messageContent;
              
              // 更新助手消息
              const index = this.messages.findIndex(msg => msg.id === assistantMessageId);
              if (index !== -1) {
                // 更新为累积的完整消息内容
                this.messages[index].content = fullMessage;
                // 强制触发更新
                this.messages = [...this.messages];
              }
            }
            
            // 设置新的超时检测 - 重置每个消息的超时时间
            this.timeoutId = setTimeout(() => {
              console.log('连接活动超时，但保持消息内容');
              
              // 只在真正没有收到任何内容时才显示超时消息
              const index = this.messages.findIndex(msg => msg.id === assistantMessageId);
              if (index !== -1) {
                if (this.messages[index].content.length === 0) {
                  this.messages[index].content = '响应超时，但连接仍然保持。请继续等待或重新发送消息。';
                }
                // 不将消息标记为completed，因为可能仍在接收
                // 强制触发更新
                this.messages = [...this.messages];
              }
              
              // 不关闭连接，仅记录超时情况
              console.log('已超过无活动时间，但保持连接以接收更多响应');
            }, 120000); // 增加到120秒超时检测
          } catch (error) {
            console.error('处理消息失败:', error, event.data);
          }
        };
        
        // 处理错误
        this.eventSource.onerror = (error) => {
          console.error('SSE 错误:', error);
          
          // 只有在真正出错时才更新错误消息
          if (fullMessage.length === 0) {
            this.error = '连接错误，请稍后再试';
            
            // 更新助手消息
            const index = this.messages.findIndex(msg => msg.id === assistantMessageId);
            if (index !== -1) {
              this.messages[index].content = '抱歉，处理您的请求时出现了错误。请稍后再试。';
              this.messages[index].completed = true;
              // 强制触发更新
              this.messages = [...this.messages];
            }
          } else {
            // 如果已经收到了一些内容，就将当前消息标记为完成
            const index = this.messages.findIndex(msg => msg.id === assistantMessageId);
            if (index !== -1) {
              this.messages[index].completed = true;
              // 强制触发更新
              this.messages = [...this.messages];
            }
          }
          
          this.isLoading = false;
          this.abortStream(); // 出错时关闭连接，但不重新连接
        };
        
        // 为了确保不会永远等待，设置初始超时检测
        this.timeoutId = setTimeout(() => {
          if (this.isLoading && this.eventSource) {
            console.log('初始响应超时，但保持连接');
            
            // 只在未收到任何内容时显示超时消息
            const index = this.messages.findIndex(msg => msg.id === assistantMessageId);
            if (index !== -1) {
              if (this.messages[index].content.length === 0) {
                this.messages[index].content = '响应时间较长，请耐心等待...';
              }
              // 不标记为完成，因为仍在等待响应
              // 强制触发更新
              this.messages = [...this.messages];
            }
            
            // 不关闭连接，继续等待
            console.log('初始超时已过，但保持连接以等待响应');
          }
        }, 30000); // 保持30秒的初始响应检测
        
      } catch (error: any) {
        console.error('创建SSE连接失败:', error);
        this.error = error.message || '发送消息失败';
        
        // 在错误时更新助手消息
        const index = this.messages.findIndex(msg => msg.id === assistantMessageId);
        if (index !== -1) {
          this.messages[index].content = '抱歉，无法连接到服务器。请检查网络连接后再试。';
          this.messages[index].completed = true;
          // 强制触发更新
          this.messages = [...this.messages];
        }
        
        this.isLoading = false;
      }
    }
  }
}) 