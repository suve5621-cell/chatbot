import { useState, useEffect, useCallback, useRef } from 'react';
import {
  loadConversations,
  saveConversations,
  loadActiveId,
  saveActiveId,
  createNewConversation,
  deriveTitle,
  createId
} from '../state/chatStorage.js';

export function useChat() {
  const [conversations, setConversations] = useState(() => {
    const saved = loadConversations();
    if (saved.length > 0) return saved;
    const initial = createNewConversation();
    return [initial];
  });

  const [activeId, setActiveId] = useState(() => {
    const savedId = loadActiveId();
    const savedConvs = loadConversations();
    if (savedId && savedConvs.some((c) => c.id === savedId)) {
      return savedId;
    }
    return savedConvs[0]?.id || null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Keep a ref to current conversations to avoid stale state in async calls
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  // Persist conversations
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // Persist active id
  useEffect(() => {
    if (activeId) {
      saveActiveId(activeId);
    }
  }, [activeId]);

  // Ensure an active conversation always exists
  useEffect(() => {
    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0].id);
    } else if (conversations.length === 0) {
      const newConv = createNewConversation();
      setConversations([newConv]);
      setActiveId(newConv.id);
    }
  }, [conversations, activeId]);

  const activeConversation = conversations.find((c) => c.id === activeId) || conversations[0];

  const startNewChat = useCallback(() => {
    const newConv = createNewConversation();
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
    setErrorMessage('');
  }, []);

  const selectChat = useCallback((id) => {
    setActiveId(id);
    setErrorMessage('');
  }, []);

  const deleteChat = useCallback((id, e) => {
    if (e) e.stopPropagation();
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length === 0) {
        const fresh = createNewConversation();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (activeIdRef.current === id) {
        setActiveId(filtered[0].id);
      }
      return filtered;
    });
  }, []);

  const clearAllChats = useCallback(() => {
    const fresh = createNewConversation();
    setConversations([fresh]);
    setActiveId(fresh.id);
    setErrorMessage('');
  }, []);

  const sendMessage = useCallback(async (content) => {
    if (isLoading) return;

    const trimmed = (content || '').trim();
    if (!trimmed) {
      setErrorMessage('Message cannot be empty.');
      return;
    }

    setErrorMessage('');

    const currentConv = conversationsRef.current.find((c) => c.id === activeIdRef.current);
    if (!currentConv) return;

    const userMessage = {
      id: createId(),
      role: 'user',
      content: trimmed,
      createdAt: Date.now()
    };

    const isFirstUserMessage = currentConv.messages.length === 0;
    const newTitle = isFirstUserMessage ? deriveTitle(trimmed) : currentConv.title;

    const updatedMessages = [...currentConv.messages, userMessage];

    // Update state immediately with user message
    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentConv.id
          ? {
              ...c,
              title: newTitle,
              updatedAt: Date.now(),
              messages: updatedMessages
            }
          : c
      )
    );

    setIsLoading(true);

    try {
      // Prepare payload with minimal role + content
      const payloadMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errMsg = data?.error || 'An unexpected error occurred. Please try again.';
        setErrorMessage(errMsg);
        return;
      }

      const assistantMessage = {
        id: createId(),
        role: 'assistant',
        content: data.response || '',
        createdAt: Date.now()
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentConv.id
            ? {
                ...c,
                updatedAt: Date.now(),
                messages: [...c.messages, assistantMessage]
              }
            : c
        )
      );
    } catch (err) {
      setErrorMessage('Network error: Unable to reach the server.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const regenerate = useCallback(async (assistantMessageId) => {
    if (isLoading) return;

    const currentConv = conversationsRef.current.find((c) => c.id === activeIdRef.current);
    if (!currentConv || currentConv.messages.length === 0) return;

    // Find index of target assistant message
    const targetIdx = currentConv.messages.findIndex((m) => m.id === assistantMessageId);
    if (targetIdx === -1) return;

    // We want all messages up to the user message immediately preceding targetIdx
    const messagesToKeep = currentConv.messages.slice(0, targetIdx);
    if (messagesToKeep.length === 0) return;

    setErrorMessage('');
    setIsLoading(true);

    // Remove the target assistant message from UI while regenerating
    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentConv.id
          ? {
              ...c,
              updatedAt: Date.now(),
              messages: messagesToKeep
            }
          : c
      )
    );

    try {
      const payloadMessages = messagesToKeep.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errMsg = data?.error || 'An unexpected error occurred. Please try again.';
        setErrorMessage(errMsg);
        return;
      }

      const newAssistantMsg = {
        id: createId(),
        role: 'assistant',
        content: data.response || '',
        createdAt: Date.now()
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentConv.id
            ? {
                ...c,
                updatedAt: Date.now(),
                messages: [...messagesToKeep, newAssistantMsg]
              }
            : c
        )
      );
    } catch (err) {
      setErrorMessage('Network error: Unable to reach the server.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  return {
    conversations,
    activeConversation,
    activeId,
    isLoading,
    errorMessage,
    clearError: () => setErrorMessage(''),
    startNewChat,
    selectChat,
    deleteChat,
    clearAllChats,
    sendMessage,
    regenerate
  };
}
