const CONVERSATIONS_KEY = 'chat_conversations';
const ACTIVE_ID_KEY = 'chat_active_id';

export function createId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

export function loadConversations() {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load conversations:', e);
    return [];
  }
}

export function saveConversations(conversations) {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (e) {
    console.error('Failed to save conversations:', e);
  }
}

export function loadActiveId() {
  try {
    return localStorage.getItem(ACTIVE_ID_KEY) || null;
  } catch (e) {
    return null;
  }
}

export function saveActiveId(id) {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_ID_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_ID_KEY);
    }
  } catch (e) {
    console.error('Failed to save active id:', e);
  }
}

export function createNewConversation(initialTitle = 'New Chat') {
  return {
    id: createId(),
    title: initialTitle,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: []
  };
}

export function deriveTitle(content) {
  if (!content) return 'New Chat';
  const clean = content.trim().replace(/\n+/g, ' ');
  return clean.length > 28 ? clean.substring(0, 28) + '...' : clean;
}
