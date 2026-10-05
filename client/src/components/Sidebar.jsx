import React from 'react';
import { Plus, Trash2, MessageSquare, X } from 'lucide-react';

export function Sidebar({
  conversations,
  activeId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onClearAll,
  isOpen,
  onClose
}) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button
            className="new-chat-btn"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            aria-label="New chat"
          >
            <Plus size={18} />
            <span>New Chat</span>
          </button>
          <button
            className="mobile-close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-history-container">
          <div className="history-label">Recent Chats</div>
          <div className="conversations-list" role="list">
            {conversations.length === 0 ? (
              <div className="empty-history-text">No previous chats</div>
            ) : (
              conversations.map((conv) => {
                const isActive = conv.id === activeId;
                return (
                  <div
                    key={conv.id}
                    role="listitem"
                    className={`conversation-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onSelectChat(conv.id);
                      onClose();
                    }}
                  >
                    <MessageSquare size={16} className="conv-icon" />
                    <span className="conv-title" title={conv.title}>
                      {conv.title || 'New Chat'}
                    </span>
                    <button
                      className="delete-conv-btn"
                      onClick={(e) => onDeleteChat(conv.id, e)}
                      title="Delete chat"
                      aria-label={`Delete chat ${conv.title}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <button
            className="clear-all-btn"
            onClick={onClearAll}
            title="Clear all chat history"
            aria-label="Clear chat history"
          >
            <Trash2 size={16} />
            <span>Clear Chats</span>
          </button>
        </div>
      </aside>
    </>
  );
}
