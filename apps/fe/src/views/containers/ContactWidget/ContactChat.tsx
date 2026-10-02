import type { Component } from 'solid-js';
import { createEffect, createSignal, createUniqueId, For, onCleanup, Show } from 'solid-js';

import { visuallyHidden } from '@/assets/styles/visually-hidden.css';
import { useI18n } from '@/common/libs/i18n';
import { useLogger } from '@/common/libs/logger';
import { AppButton } from '@/views/components/Button/AppButton';

import * as styles from './styles.css';

interface ChatMessage {
  id: number;
  from: 'user' | 'agent';
  text: string;
}

let nextMessageId = 0;
const createMessage = (from: ChatMessage['from'], text: string): ChatMessage => ({
  id: nextMessageId++,
  from,
  text,
});

const REPLY_DELAY_MS = 500;

/**
 * A scripted, frontend-only stand-in for a live chat — there's no support backend in this app.
 * Replies are a small rotating pool of generic acknowledgements (`common.contact.commonReplies`),
 * not content-aware, so the bot never has to parse free text in a locale-safe way. See
 * ContactWidget/AGENTS.md.
 */
export const ContactChat: Component = () => {
  const { t } = useI18n();
  const logger = useLogger();
  const [messages, setMessages] = createSignal<ChatMessage[]>([createMessage('agent', t().common.contact.greeting)]);
  const [draft, setDraft] = createSignal('');
  const [typing, setTyping] = createSignal(false);
  const inputId = createUniqueId();
  let replyIndex = 0;
  let logRef: HTMLDivElement | undefined;
  let replyTimeout: ReturnType<typeof setTimeout> | undefined;

  // Scrolls to the newest message/typing-indicator whenever either changes — a chat log that
  // silently grew below the fold, with the user having to scroll to notice a reply, defeats the
  // "feels live" point of a typing indicator in the first place.
  createEffect(() => {
    messages();
    typing();
    if (logRef) logRef.scrollTop = logRef.scrollHeight;
  });

  onCleanup(() => clearTimeout(replyTimeout));

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    const text = draft().trim();
    if (!text) return;
    logger.event('contact.chat.message', { length: text.length });
    setMessages((prev) => [...prev, createMessage('user', text)]);
    setDraft('');
    setTyping(true);
    replyTimeout = setTimeout(() => {
      const replies = t().common.contact.commonReplies;
      const reply = replies[replyIndex % replies.length];
      replyIndex += 1;
      setTyping(false);
      setMessages((prev) => [...prev, createMessage('agent', reply)]);
    }, REPLY_DELAY_MS);
  };

  return (
    <div class={styles.chat}>
      <div role="log" aria-label={t().common.contact.logLabel} class={styles.log} ref={(el) => (logRef = el)}>
        <For each={messages()}>
          {(message) => (
            <p class={message.from === 'user' ? styles.messageUser : styles.messageAgent}>{message.text}</p>
          )}
        </For>
        <Show when={typing()}>
          <p class={styles.typingIndicator}>
            <span aria-hidden="true" class={styles.typingDot} />
            <span aria-hidden="true" class={styles.typingDot} />
            <span aria-hidden="true" class={styles.typingDot} />
            <span class={visuallyHidden}>{t().common.contact.typingIndicator}</span>
          </p>
        </Show>
      </div>
      <form onSubmit={handleSubmit} class={styles.composer}>
        <label for={inputId} class={visuallyHidden}>
          {t().common.contact.inputLabel}
        </label>
        <input
          id={inputId}
          type="text"
          autocomplete="off"
          placeholder={t().common.contact.placeholder}
          value={draft()}
          onInput={(event) => setDraft(event.target.value)}
          required
          class={styles.messageInput}
        />
        <AppButton type="submit">{t().common.contact.sendBtn}</AppButton>
      </form>
    </div>
  );
};
