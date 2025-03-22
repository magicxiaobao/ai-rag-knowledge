<template>
  <div :class="[
    'message', 
    role === 'user' ? 'user-message' : 'bot-message'
  ]">
    <div class="message-header">
      <div class="flex items-center">
        <div class="avatar mr-2">
          <span class="text-white text-sm">{{ role === 'user' ? 'U' : 'A' }}</span>
        </div>
        <div class="font-medium">{{ role === 'user' ? '用户' : '智能客服' }}</div>
        <div class="text-xs text-gray-500 ml-2">{{ formattedTime }}</div>
      </div>
    </div>
    <div class="message-content ml-8 mt-2">
      <div v-if="content">
        <!-- 思考过程部分 -->
        <div v-if="hasThinkingContent" class="thinking-indicator mb-3">
          <div class="thinking-label text-sm text-blue-600 font-medium mb-2">
            智能助手在思考中...
          </div>
          <div v-if="thinkingContent" class="thinking-content bg-blue-50 p-3 rounded-md text-gray-700 text-sm whitespace-pre-wrap">
            {{ thinkingContent }}
          </div>
        </div>
        
        <!-- 回答内容部分 -->
        <div v-if="finalContent" class="final-content">
          <div v-html="parsedFinalContent" class="markdown-content"></div>
        </div>
        
        <!-- 旧的渲染方式作为备份 -->
        <div v-if="!hasThinkingContent && !finalContent" v-html="parsedContent" class="markdown-content"></div>
      </div>
      <div v-else-if="!completed">
        <div class="flex items-center space-x-2">
          <div class="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></div>
          <div class="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          <div class="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
        </div>
      </div>
      <div v-else>...</div>
    </div>
    <div v-if="role === 'assistant' && content && content.includes('JSON')" class="mt-4 ml-8 bg-gray-100 rounded p-3">
      <div class="text-sm text-gray-700 font-mono whitespace-pre-wrap">
        &lt;JSON&gt;
        {{ formatJSON(content) }}
      </div>
    </div>
    <div v-if="role === 'assistant' && hasError" class="mt-4 ml-8 bg-red-50 text-red-700 p-3 rounded">
      身份验证失败，请检查 API 密钥是否正确
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import DOMPurify from 'dompurify'

// 配置Marked
marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  })
);

// 设置Marked选项
marked.setOptions({
  gfm: true, // GitHub风格Markdown
  breaks: true, // 允许回车换行
  headerIds: false, // 禁用自动生成header IDs
  mangle: false, // 禁用转义标记
  sanitize: false // 允许HTML标签
});

interface Props {
  content: string
  role: 'user' | 'assistant'
  timestamp: number
  completed?: boolean
}

const props = defineProps<Props>()
const messageContent = ref(props.content || '')

// 提取思考内容
const hasThinkingContent = computed(() => {
  if (!props.content) return false;
  return props.content.includes('<think>');
});

// 提取think标签中的内容
const thinkingContent = computed(() => {
  if (!props.content) return '';
  const match = props.content.match(/<think>([\s\S]*?)<\/think>/);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // 如果没有闭合标签，但有开始标签
  if (props.content.includes('<think>') && !props.content.includes('</think>')) {
    const parts = props.content.split('<think>');
    if (parts.length > 1) {
      return parts[1].trim();
    }
  }
  
  return '';
});

// 提取最终回答内容（think标签之外的内容）
const finalContent = computed(() => {
  if (!props.content) return '';
  
  // 如果有完整的think标签对
  if (props.content.includes('<think>') && props.content.includes('</think>')) {
    // 移除所有<think>...</think>部分
    const withoutThinking = props.content.replace(/<think>[\s\S]*?<\/think>/g, '');
    return withoutThinking.trim();
  }
  
  // 如果只有开始标签没有结束标签（不完整的think）
  if (props.content.includes('<think>') && !props.content.includes('</think>')) {
    const parts = props.content.split('<think>');
    if (parts.length > 0) {
      return parts[0].trim();
    }
  }
  
  return '';
});

// 解析Markdown内容
const parsedContent = computed(() => {
  if (!props.content) return '';
  try {
    // 预处理文本，改善Markdown解析
    let preprocessedContent = props.content.replace(/<think>[\s\S]*?<\/think>/g, '');
    
    // 自动检测Python代码块 - 针对不带反引号的完整代码
    // 查找潜在的Python代码模式
    const pythonPatterns = [
      // 变量赋值模式
      /\b[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[^=]/,
      // 函数定义
      /\bdef\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(/,
      // 类定义
      /\bclass\s+[a-zA-Z_][a-zA-Z0-9_]*\s*[:\(]/,
      // Python关键字后跟冒号
      /\b(if|for|while|else|elif)\s+.*:/,
      // 导入语句
      /\b(import|from)\s+[a-zA-Z_][a-zA-Z0-9_.]*/,
      // print语句
      /\bprint\s*\(/,
      // 列表/字典/集合定义
      /\b[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[\[\{\(]/,
      // return语句
      /\breturn\s+/
    ];
    
    // 检测连续的代码行
    const lines = preprocessedContent.split('\n');
    let inCodeBlock = false;
    let codeBlockStart = -1;
    let pythonCodeCount = 0;
    let resultLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 跳过已经标记的代码块
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        resultLines.push(lines[i]);
        continue;
      }
      
      if (inCodeBlock) {
        resultLines.push(lines[i]);
        continue;
      }
      
      // 检测是否为Python代码
      const isPythonCode = pythonPatterns.some(pattern => pattern.test(line));
      
      if (isPythonCode && line.length > 0) {
        if (pythonCodeCount === 0) {
          // 开始新的代码块
          codeBlockStart = i;
        }
        pythonCodeCount++;
      } else if (pythonCodeCount > 0 && (line.length === 0 || i === lines.length - 1)) {
        // 代码块结束，需要处理最后一行
        if (i === lines.length - 1 && line.length > 0 && !isPythonCode) {
          resultLines.push(lines[i]);
        }
        
        // 如果检测到至少2行连续的Python代码，将其作为代码块处理
        if (pythonCodeCount >= 2 || (pythonCodeCount === 1 && line.includes('#'))) {
          resultLines.push('```python');
          for (let j = codeBlockStart; j < i; j++) {
            if (j === lines.length - 1 && !isPythonCode) continue;
            resultLines.push(lines[j]);
          }
          resultLines.push('```');
          
          // 添加空行后面的非代码内容
          if (line.length > 0 && i !== lines.length - 1 && !isPythonCode) {
            resultLines.push(line);
          }
        } else {
          // 不足以构成代码块，恢复原始行
          for (let j = codeBlockStart; j < i; j++) {
            resultLines.push(lines[j]);
          }
          if (line.length > 0 && !isPythonCode) {
            resultLines.push(line);
          }
        }
        
        pythonCodeCount = 0;
        codeBlockStart = -1;
      } else {
        resultLines.push(lines[i]);
      }
    }
    
    preprocessedContent = resultLines.join('\n');
    
    // 标准化已有的代码块
    preprocessedContent = preprocessedContent.replace(
      /```(?:python)?\s*\n?([\s\S]*?)\n?```/g, 
      '```python\n$1\n```'
    );
    
    // 改善Markdown列表识别
    preprocessedContent = preprocessedContent.replace(
      /(?:^|\n)(\d+\.|\*|\-)\s+([^\n]+)/g,
      '\n$1 $2\n'
    );
    
    // 检测和标准化标题格式（#号开头）
    preprocessedContent = preprocessedContent.replace(
      /(?:^|\n)(#+)([^#\n]+)/g,
      '\n$1 $2\n'
    );
    
    // 使用DOMPurify净化输出的HTML
    const html = marked(preprocessedContent);
    return DOMPurify.sanitize(html, {
      ADD_ATTR: ['target'], // 允许target属性
      ADD_TAGS: ['iframe'] // 允许iframe标签，可以根据需要配置
    });
  } catch (error) {
    console.error('Markdown解析错误:', error);
    return props.content;
  }
});

// 解析最终的内容（不包含think部分）
const parsedFinalContent = computed(() => {
  if (!finalContent.value) return '';
  try {
    // 预处理文本，改善Markdown解析
    let preprocessedContent = finalContent.value;
    
    // 自动检测Python代码块 - 针对不带反引号的完整代码
    // 查找潜在的Python代码模式
    const pythonPatterns = [
      // 变量赋值模式
      /\b[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[^=]/,
      // 函数定义
      /\bdef\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(/,
      // 类定义
      /\bclass\s+[a-zA-Z_][a-zA-Z0-9_]*\s*[:\(]/,
      // Python关键字后跟冒号
      /\b(if|for|while|else|elif)\s+.*:/,
      // 导入语句
      /\b(import|from)\s+[a-zA-Z_][a-zA-Z0-9_.]*/,
      // print语句
      /\bprint\s*\(/,
      // 列表/字典/集合定义
      /\b[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[\[\{\(]/,
      // return语句
      /\breturn\s+/
    ];
    
    // 检测连续的代码行
    const lines = preprocessedContent.split('\n');
    let inCodeBlock = false;
    let codeBlockStart = -1;
    let pythonCodeCount = 0;
    let resultLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 跳过已经标记的代码块
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        resultLines.push(lines[i]);
        continue;
      }
      
      if (inCodeBlock) {
        resultLines.push(lines[i]);
        continue;
      }
      
      // 检测是否为Python代码
      const isPythonCode = pythonPatterns.some(pattern => pattern.test(line));
      
      if (isPythonCode && line.length > 0) {
        if (pythonCodeCount === 0) {
          // 开始新的代码块
          codeBlockStart = i;
        }
        pythonCodeCount++;
      } else if (pythonCodeCount > 0 && (line.length === 0 || i === lines.length - 1)) {
        // 代码块结束，需要处理最后一行
        if (i === lines.length - 1 && line.length > 0 && !isPythonCode) {
          resultLines.push(lines[i]);
        }
        
        // 如果检测到至少2行连续的Python代码，将其作为代码块处理
        if (pythonCodeCount >= 2 || (pythonCodeCount === 1 && line.includes('#'))) {
          resultLines.push('```python');
          for (let j = codeBlockStart; j < i; j++) {
            if (j === lines.length - 1 && !isPythonCode) continue;
            resultLines.push(lines[j]);
          }
          resultLines.push('```');
          
          // 添加空行后面的非代码内容
          if (line.length > 0 && i !== lines.length - 1 && !isPythonCode) {
            resultLines.push(line);
          }
        } else {
          // 不足以构成代码块，恢复原始行
          for (let j = codeBlockStart; j < i; j++) {
            resultLines.push(lines[j]);
          }
          if (line.length > 0 && !isPythonCode) {
            resultLines.push(line);
          }
        }
        
        pythonCodeCount = 0;
        codeBlockStart = -1;
      } else {
        resultLines.push(lines[i]);
      }
    }
    
    preprocessedContent = resultLines.join('\n');
    
    // 标准化已有的代码块
    preprocessedContent = preprocessedContent.replace(
      /```(?:python)?\s*\n?([\s\S]*?)\n?```/g, 
      '```python\n$1\n```'
    );
    
    // 改善Markdown列表识别
    preprocessedContent = preprocessedContent.replace(
      /(?:^|\n)(\d+\.|\*|\-)\s+([^\n]+)/g,
      '\n$1 $2\n'
    );
    
    // 检测和标准化标题格式（#号开头）
    preprocessedContent = preprocessedContent.replace(
      /(?:^|\n)(#+)([^#\n]+)/g,
      '\n$1 $2\n'
    );
    
    // 使用DOMPurify净化输出的HTML
    const html = marked(preprocessedContent);
    return DOMPurify.sanitize(html, {
      ADD_ATTR: ['target'], 
      ADD_TAGS: ['iframe']
    });
  } catch (error) {
    console.error('Markdown解析错误:', error);
    return finalContent.value;
  }
});

// 监听内容变化
watch(() => props.content, (newContent) => {
  if (newContent) {
    messageContent.value = newContent
  }
}, { immediate: true })

// 检测是否有错误消息
const hasError = computed(() => {
  if (!props.content) return false
  return props.content.includes('Invalid token') || props.content.includes('error')
})

// 格式化时间显示
const formattedTime = computed(() => {
  const date = new Date(props.timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}/${month}/${day} ${hours}:${minutes}`
})

// 格式化JSON
const formatJSON = (content: string) => {
  try {
    // 尝试提取可能存在的JSON内容
    const jsonMatch = content.match(/\{.*\}/s)
    if (jsonMatch) {
      const jsonString = jsonMatch[0]
      const parsed = JSON.parse(jsonString)
      return JSON.stringify(parsed, null, 2)
    }
    return content
  } catch (error) {
    return content
  }
}
</script>

<style>
/* Markdown 样式 */
.markdown-content {
  font-size: 14px;
  line-height: 1.6;
}

.markdown-content h1 {
  font-size: 1.8em;
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.markdown-content h2 {
  font-size: 1.5em;
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.markdown-content h3 {
  font-size: 1.3em;
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.markdown-content p {
  margin-bottom: 1em;
}

.markdown-content ul, .markdown-content ol {
  margin-left: 2em;
  margin-bottom: 1em;
}

.markdown-content ul {
  list-style-type: disc;
}

.markdown-content ol {
  list-style-type: decimal;
}

.markdown-content li {
  margin-bottom: 0.3em;
}

.markdown-content code {
  font-family: monospace;
  padding: 2px 4px;
  background-color: #f0f0f0;
  border-radius: 3px;
}

.markdown-content pre {
  margin-bottom: 1em;
  padding: 1em;
  border-radius: 5px;
  background-color: #f6f8fa;
  overflow-x: auto;
}

.markdown-content pre code {
  background-color: transparent;
  padding: 0;
}

.markdown-content blockquote {
  margin-left: 0;
  padding-left: 1em;
  border-left: 4px solid #ddd;
  color: #666;
}

.markdown-content table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 1em;
}

.markdown-content table th,
.markdown-content table td {
  border: 1px solid #ddd;
  padding: 8px;
}

.markdown-content table th {
  background-color: #f0f0f0;
  font-weight: bold;
}

.markdown-content img {
  max-width: 100%;
}

.markdown-content a {
  color: #0366d6;
  text-decoration: none;
}

.markdown-content a:hover {
  text-decoration: underline;
}

/* 思考内容样式 */
.thinking-indicator {
  border-bottom: 1px dashed #ccc;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.thinking-content {
  font-style: italic;
  border-left: 3px solid #3b82f6;
}

.final-content {
  margin-top: 10px;
}
</style>

<style scoped>
.message {
  margin-bottom: 1rem;
  position: relative;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #4b5563;
}

.user-message .avatar {
  background-color: #059669;
}

.bot-message .avatar {
  background-color: #4f46e5;
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.25rem;
}

.message-content {
  line-height: 1.5;
}
</style> 