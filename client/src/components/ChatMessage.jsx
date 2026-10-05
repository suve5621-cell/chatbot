import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import { Copy, Check, RotateCcw, User, Bot } from 'lucide-react';

// Configure marked renderer for code blocks
const renderer = new marked.Renderer();

renderer.code = function (arg1, arg2) {
  // Support both marked v15 object token and classic (text, lang)
  const codeText = (typeof arg1 === 'object' && arg1 !== null ? arg1.text : arg1) || '';
  const rawLang = typeof arg1 === 'object' && arg1 !== null ? arg1.lang : arg2;
  const cleanLang = (rawLang || '').trim().split(/\s+/)[0];
  const language = cleanLang && Prism.languages[cleanLang] ? cleanLang : 'javascript';
  const grammar = Prism.languages[language] || Prism.languages.javascript;
  const highlighted = Prism.highlight(codeText, grammar, language);
  const safeLang = cleanLang || 'code';
  const encoded = encodeURIComponent(codeText);

  return `
    <div class="code-block">
      <div class="code-header">
        <span class="code-lang">${safeLang}</span>
        <button class="code-copy-btn" data-code="${encoded}" aria-label="Copy code">
          <svg class="copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          <span class="btn-text">Copy</span>
        </button>
      </div>
      <pre><code class="language-${safeLang}">${highlighted}</code></pre>
    </div>
  `;
};

marked.setOptions({
  renderer,
  breaks: true,
  gfm: true
});

export function ChatMessage({ message, isLast, isLoading, onRegenerate }) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  const htmlContent = useMemo(() => {
    if (!isAssistant) return '';
    try {
      return marked.parse(message.content || '');
    } catch (e) {
      return message.content || '';
    }
  }, [message.content, isAssistant]);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleContainerClick = async (e) => {
    const copyBtn = e.target.closest('.code-copy-btn');
    if (!copyBtn) return;

    const encoded = copyBtn.getAttribute('data-code');
    if (!encoded) return;

    try {
      const code = decodeURIComponent(encoded);
      await navigator.clipboard.writeText(code);
      const textSpan = copyBtn.querySelector('.btn-text');
      if (textSpan) {
        const originalText = textSpan.textContent;
        textSpan.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          textSpan.textContent = originalText;
          copyBtn.classList.remove('copied');
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy code snippet:', err);
    }
  };

  return (
    <div className={`chat-message ${isAssistant ? 'assistant' : 'user'}`}>
      <div className="message-wrapper">
        <div className="message-avatar" aria-hidden="true">
          {isAssistant ? <Bot size={18} /> : <User size={18} />}
        </div>

        <div className="message-content-container">
          <div className="message-header-row">
            <span className="sender-name">{isAssistant ? 'Assistant' : 'You'}</span>
          </div>

          {isAssistant ? (
            <div
              className="message-markdown markdown-body"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
              onClick={handleContainerClick}
            />
          ) : (
            <div className="message-text user-text">{message.content}</div>
          )}

          <div className="message-actions">
            <button
              className="action-btn copy-btn"
              onClick={handleCopyMessage}
              title="Copy message"
              aria-label="Copy full message"
            >
              {copied ? <Check size={14} className="success-icon" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {isAssistant && isLast && !isLoading && (
              <button
                className="action-btn regenerate-btn"
                onClick={() => onRegenerate(message.id)}
                title="Regenerate response (manual)"
                aria-label="Regenerate response"
              >
                <RotateCcw size={14} />
                <span>Regenerate</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
