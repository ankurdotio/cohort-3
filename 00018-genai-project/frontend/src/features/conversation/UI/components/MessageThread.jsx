import { memo, useLayoutEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RotateCw, Sparkles } from 'lucide-react';
import { ErrorMessage, Spinner } from '../../../auth/UI/components/Feedback.jsx';
import { MarkdownMessage } from './MarkdownMessage.jsx';
import { useCurrentMessages } from '../../Hooks/useConversation.js';
import { selectCurrentAiMessage, selectHasCurrentAiMessage } from '../../State/conversation.slice.js';

const SCROLL_SELECTOR = '[data-chat-scroll]';
const STICK_THRESHOLD = 160;

function AssistantAvatar() {
  return (
    <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sage text-forest">
      <Sparkles size={15} />
    </span>
  );
}

export const MessageBubble = memo(function MessageBubble({ role, content }) {
  if (role === 'user') {
    return (
      <article aria-label="You" className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-md bg-sage px-5 py-3.5 text-[15px] leading-7 break-words whitespace-pre-wrap text-ink">{content}</p>
      </article>
    );
  }
  return (
    <article aria-label="Downbot" className="flex gap-4">
      <AssistantAvatar />
      <div className="min-w-0 flex-1 pt-0.5"><MarkdownMessage content={content} /></div>
    </article>
  );
});

/**
 * The in-flight AI reply. It is the only component subscribed to `aiLatestMessage`,
 * so token updates never re-render the committed message list.
 */
export function StreamingMessage() {
  const latest = useSelector(selectCurrentAiMessage);
  const ref = useRef(null);
  const content = latest?.content;

  useLayoutEffect(() => {
    const container = ref.current?.closest(SCROLL_SELECTOR);
    if (!container) return;
    // Follow the stream only if the reader hasn't scrolled up to read earlier messages.
    const distance = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distance < STICK_THRESHOLD) container.scrollTop = container.scrollHeight;
  }, [content]);

  if (!latest) return null;
  return (
    <article ref={ref} aria-label="Downbot" aria-busy={latest.status !== 'error'} className="flex gap-4">
      <AssistantAvatar />
      <div className="min-w-0 flex-1 space-y-4 pt-0.5">
        {latest.status === 'pending' ? (
          <p role="status" className="flex items-center gap-2 text-sm text-muted">
            <span className="flex gap-1" aria-hidden="true">
              {[0, 150, 300].map((delay) => (
                <span key={delay} className="size-1.5 animate-bounce rounded-full bg-forest motion-reduce:animate-none" style={{ animationDelay: `${delay}ms` }} />
              ))}
            </span>
            Downbot is thinking...
          </p>
        ) : latest.content && (
          <div className={latest.status === 'streaming' ? 'markdown-streaming' : undefined}>
            <MarkdownMessage content={latest.content} />
          </div>
        )}
        <ErrorMessage>{latest.status === 'error' ? latest.error : null}</ErrorMessage>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <span className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-sage text-forest"><Sparkles size={24} strokeWidth={1.5} /></span>
      <h2 className="font-display text-3xl font-semibold tracking-[-1px]">What&apos;s on your mind?</h2>
      <p className="mt-3 max-w-sm text-sm leading-7 text-muted">Ask anything. Your conversation will be saved on the left so you can come back to it.</p>
    </div>
  );
}

function MessageList() {
  const { messages, loading, error, retry } = useCurrentMessages();
  const hasAiMessage = useSelector(selectHasCurrentAiMessage);
  const ref = useRef(null);
  const count = messages.length;
  const firstId = messages[0]?.id;

  // Jump to the newest message when switching conversations or when a message is committed.
  useLayoutEffect(() => {
    const container = ref.current?.closest(SCROLL_SELECTOR);
    if (container) container.scrollTop = container.scrollHeight;
  }, [count, firstId]);

  if (loading) {
    return <p role="status" className="flex flex-1 items-center justify-center gap-3 text-sm text-muted"><Spinner /> Loading messages...</p>;
  }
  if (error) {
    return (
      <div className="mx-auto w-full max-w-sm space-y-4 py-16 text-center">
        <ErrorMessage>{error}</ErrorMessage>
        <button type="button" onClick={retry} className="button-secondary gap-2 px-4 text-sm"><RotateCw size={14} /> Try again</button>
      </div>
    );
  }
  if (messages.length === 0 && !hasAiMessage) return <EmptyState />;
  return (
    <div ref={ref} className="flex flex-col gap-12">
      {messages.map((message) => <MessageBubble key={message.id} role={message.role} content={message.content} />)}
    </div>
  );
}

export function MessageThread() {
  return (
    <section data-chat-scroll aria-label="Messages" className="flex flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-6 py-12 sm:px-10 sm:py-16">
        <MessageList />
        <StreamingMessage />
      </div>
    </section>
  );
}
