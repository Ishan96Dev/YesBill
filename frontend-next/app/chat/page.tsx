export const dynamic = 'force-dynamic'
// Chat page — SSE streaming from FastAPI backend
// Must be CSR because EventSource is browser-only.
import type { Metadata } from 'next'
import ChatClient from '@/components/pages/ChatClient'

export const metadata: Metadata = {
  title: 'AI Chat',
  robots: { index: false, follow: false },
}

export default function ChatPage() {
  return <ChatClient />
}
