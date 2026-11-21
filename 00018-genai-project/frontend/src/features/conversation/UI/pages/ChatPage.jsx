import { useCallback, useEffect, useState } from 'react';
import { cancelActiveStream } from '../../Hooks/useConversation.js';
import { ConversationSidebar } from '../components/ConversationSidebar.jsx';
import { ChatHeader } from '../components/ChatHeader.jsx';
import { MessageThread } from '../components/MessageThread.jsx';
import { Composer } from '../components/Composer.jsx';

export function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Stop streaming into the store once the user leaves the chat (e.g. signs out).
  useEffect(() => cancelActiveStream, []);

  return (
    <div className="flex h-dvh overflow-hidden">
      <a href="#main" className="sr-only z-50 rounded bg-forest p-3 text-on-forest focus:not-sr-only focus:absolute">Skip to chat</a>
      <ConversationSidebar open={sidebarOpen} onClose={closeSidebar} />
      <main id="main" className="flex min-w-0 flex-1 flex-col">
        <ChatHeader onOpenSidebar={openSidebar} />
        <MessageThread />
        <Composer />
      </main>
    </div>
  );
}
