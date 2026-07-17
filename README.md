# ChaiGPT (ChatGPT Clone)

ChaiGPT is a minimalistic, high-performance, and feature-rich ChatGPT clone built with Next.js, Tailwind CSS, Prisma, the Vercel AI SDK, and Clerk Authentication.

---

## 📸 Tool Calling in Action
Below is a screenshot demonstrating the real-time search tool calling capability:

![Web Search Tool Calling](/tool_calling.png)

---

## 🚀 Key Features

- **Clerk Authentication**: Secure sign-up, sign-in, and account management.
- **Vercel AI SDK Integration**: Seamless real-time streaming text responses.
- **Web Search Tool Calling**: Real-time Tavily search integration that the AI can call automatically when asked about current events.
- **Independent Conversation Branching**: Create a brand-new independent chat thread from any message in the current conversation, preserving parent history.
- **Theme Support**: Seamless dark and light modes powered by `next-themes`.
- **Markdown & Code Syntax Highlighting**: Premium syntax highlighting for code blocks, math formatting, and mermaid diagrams.
- **Clerk User Settings & Action Toolbars**: Beautiful micro-interactions and animations.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16.2 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **AI Libraries**: Vercel AI SDK, `@ai-sdk/openai`
- **Search Tool**: Tavily API
- **Styling**: Tailwind CSS, Shadcn, Base UI
- **Components**: Radix, Base UI

---

## 📦 Installation & Setup

Follow these steps to set up the project locally:

### 1. Clone the Repository
```bash
git clone https://github.com/Vaibhav2024/chatgpt-clone.git
cd chat-gpt-clone
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory and add the following keys:
```env
# Database connection
DATABASE_URL="postgresql://your-db-url"

# Clerk authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# OpenAI api key for chat model
OPENAI_API_KEY="sk-proj-..."

# Tavily search api key for web search
TAVILY_API_KEY="tvly-..."
```

### 4. Push Database Schema
Ensure your database is running, then synchronize the Prisma schema:
```bash
npx prisma db push
```

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.
