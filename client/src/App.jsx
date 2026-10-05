import React, { useState } from 'react';
import { useChat } from './hooks/useChat';
import { useTheme } from './hooks/useTheme';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ChatArea } from './components/ChatArea';
import { ChatInput } from './components/ChatInput';

export default function App() {
  const {
    conversations,
    activeConversation,
    activeId,
    isLoading,
    errorMessage,
    clearError,
    startNewChat,
    selectChat,
    deleteChat,
    clearAllChats,
    sendMessage,
    regenerate
  } = useChat();

  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectChat={selectChat}
        onNewChat={startNewChat}
        onDeleteChat={deleteChat}
        onClearAll={clearAllChats}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main-content">
        <Header
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          theme={theme}
          onToggleTheme={toggleTheme}
          activeTitle={activeConversation?.title !== 'New Chat' ? activeConversation?.title : ''}
        />

        <ChatArea
          conversation={activeConversation}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onClearError={clearError}
          onRegenerate={regenerate}
          onSendPreset={(promptText) => sendMessage(promptText)}
        />

        <footer className="footer-area">
          <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
          <p className="footer-disclaimer">
            AI can make mistakes. Verify important information.
          </p>
        </footer>
      </main>
    </div>
  );
}
