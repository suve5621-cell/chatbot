/**
 * Prepares messages according to token rules:
 * - Send only the last 8 messages plus a short running summary of older ones.
 * - Deduplicate adjacent identical messages.
 * - No extra API calls.
 */
export function prepareMessages(rawMessages, systemPrompt) {
  if (!Array.isArray(rawMessages)) return [];

  // Deduplicate consecutive identical messages
  const deduplicated = [];
  for (const msg of rawMessages) {
    if (!msg || !msg.content || typeof msg.content !== 'string') continue;
    const cleanContent = msg.content.trim();
    if (!cleanContent) continue;

    const last = deduplicated[deduplicated.length - 1];
    if (last && last.role === msg.role && last.content === cleanContent) {
      continue; // Skip duplicate
    }
    deduplicated.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: cleanContent
    });
  }

  const MAX_RECENT = 8;
  if (deduplicated.length <= MAX_RECENT) {
    return deduplicated;
  }

  const olderMessages = deduplicated.slice(0, deduplicated.length - MAX_RECENT);
  const recentMessages = deduplicated.slice(-MAX_RECENT);

  // Generate concise running summary of older turns without extra API calls
  const summaryLines = olderMessages.map((m) => {
    const speaker = m.role === 'user' ? 'User' : 'Assistant';
    const snippet = m.content.length > 80 ? m.content.substring(0, 80).replace(/\n/g, ' ') + '...' : m.content.replace(/\n/g, ' ');
    return `${speaker}: ${snippet}`;
  });
  const runningSummary = `[Summary of earlier conversation:\n${summaryLines.join('\n')}]`;

  // Attach the running summary to the first user message in recentMessages
  let attached = false;
  const formattedRecent = recentMessages.map((m) => {
    if (!attached && m.role === 'user') {
      attached = true;
      return {
        ...m,
        content: `${runningSummary}\n\n${m.content}`
      };
    }
    return m;
  });

  if (!attached) {
    formattedRecent.unshift({ role: 'user', content: runningSummary });
  }

  return formattedRecent;
}
