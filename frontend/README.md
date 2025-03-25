# Ollama 聊天界面

基于Vue 3、TypeScript、Pinia、TailwindCSS和HeadlessUI的Ollama聊天界面。

## 功能特点

- 多聊天会话管理
- 支持多种Ollama模型
- 流式响应渲染
- 响应式设计
- 消息复制

## 技术栈

- Vue 3
- TypeScript 
- Pinia (状态管理)
- Vue Router (路由)
- TailwindCSS (样式)
- HeadlessUI (UI组件)
- EventSource (流式响应)

## 安装

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 使用方法

1. 点击"新聊天"按钮创建一个新的聊天会话
2. 选择要使用的模型（deepseek-r1等）
3. 输入消息并发送
4. 查看AI助手的回复

## API接口

应用通过流式API接口与Ollama进行通信：

```
GET /api/v1/ollama/generate_stream?model={model}&message={message}
```

## 许可证

MIT 