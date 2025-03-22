# AI Chat Frontend

A Vue 3 frontend application for conversational AI interactions using a chat interface.

## Tech Stack

- Vue 3
- TypeScript
- Vite
- Pinia (State Management)
- Tailwind CSS (Styling)
- Headless UI (UI Components)
- PNPM (Package Manager)

## Features

- Conversational chat interface with an AI assistant
- Streaming responses from the backend
- Responsive design
- Message history
- TypeScript support

## Setup and Development

### Prerequisites

- Node.js (v18+)
- PNPM package manager

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Start the development server
pnpm dev
```

This will start the development server at http://localhost:5173

### Building for Production

```bash
# Build the application
pnpm build

# Preview the production build
pnpm serve
```

## API Integration

The application interfaces with the backend `OllamaController.generateStream` endpoint to generate AI responses. The API communication is handled through the Pinia store (`src/stores/chat.ts`).

## Folder Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── assets/          # Application assets
│   ├── components/      # Vue components
│   ├── stores/          # Pinia stores
│   ├── App.vue          # Main application component
│   ├── main.ts          # Application entry point
│   └── style.css        # Global styles with Tailwind
├── index.html
├── tailwind.config.js   # Tailwind configuration
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

## License

MIT
