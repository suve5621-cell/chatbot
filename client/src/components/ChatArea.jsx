import React, { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { AlertCircle, X, Sparkles } from 'lucide-react';

export function ChatArea({
  conversation,
  isLoading,
  errorMessage,
  onClearError,
  onRegenerate,
  onSendPreset
}) {
  const scrollEndRef = useRef(null);
  const messages = conversation?.messages || [];

  const scrollToBottom = (behavior = 'smooth') => {
    scrollEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickPrompts = [
    { label: 'Explain quantum computing in simple terms', lang: 'English' },
    { label: 'வணக்கம்! எனக்கு ஒரு எளிய தமிழ் கவிதை எழுதுங்கள்', lang: 'தமிழ்' },
    { label: 'Enakku JavaScript closures pathi explain pannu', lang: 'Tanglish' }
  ];

  return (
    <div className="chat-area">
      {errorMessage && (
        <div className="error-banner" role="alert">
          <AlertCircle size={18} className="error-icon" />
          <span className="error-text">{errorMessage}</span>
          <button
            className="error-dismiss-btn"
            onClick={onClearError}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {messages.length === 0 ? (
        <div className="welcome-screen">
          <div className="welcome-icon-box">
            <Sparkles size={36} />
          </div>
          <h1 className="welcome-title">How can I help you today?</h1>
          <p className="welcome-subtitle">
            Ask questions in <strong>English</strong>, <strong>தமிழ்</strong>, or <strong>Tanglish</strong>.
          </p>

          <div className="quick-prompts-grid">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                className="quick-prompt-card"
                onClick={() => onSendPreset(p.label)}
              >
                <span className="prompt-badge">{p.lang}</span>
                <span className="prompt-text">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="messages-list">
          {messages.map((msg, index) => (
            <ChatMessage
              key={msg.id || index}
              message={msg}
              isLast={index === messages.length - 1}
              isLoading={isLoading}
              onRegenerate={onRegenerate}
            />
          ))}

          {isLoading && (
            <div className="chat-message assistant loading-message">
              <div className="message-wrapper">
                <div className="message-avatar" aria-hidden="true">
                  <Sparkles size={18} className="animate-spin-slow" />
                </div>
                <div className="message-content-container">
                  <div className="typing-indicator">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={scrollEndRef} style={{ height: '1px' }} />
        </div>
      )}
    </div>
  );
}
