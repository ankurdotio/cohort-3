import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowUp } from 'lucide-react';
import { sendMessage } from '../../Hooks/useConversation.js';
import { selectCanSend, selectCurrentConversationId } from '../../State/conversation.slice.js';

const MAX_HEIGHT = 200;

export function Composer() {
  const dispatch = useDispatch();
  const canSend = useSelector(selectCanSend);
  const conversationId = useSelector(selectCurrentConversationId);
  const [value, setValue] = useState('');
  const textarea = useRef(null);
  const ready = canSend && value.trim().length > 0;

  useEffect(() => { textarea.current?.focus(); }, [conversationId]);

  useEffect(() => {
    const element = textarea.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  function submit(event) {
    event?.preventDefault();
    if (!ready) return;
    dispatch(sendMessage(value));
    setValue('');
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) submit(event);
  }

  return (
    <div className="shrink-0 px-4 pt-2 pb-5 sm:px-8">
      <form onSubmit={submit} className="mx-auto w-full max-w-3xl">
        <div className="flex items-end gap-3 rounded-2xl border border-field-line bg-surface p-2.5 pl-5 shadow-[0_8px_30px_-12px_rgb(0_0_0/0.18)] transition-colors focus-within:border-forest">
          <label htmlFor="chat-input" className="sr-only">Message Downbot</label>
          <textarea
            id="chat-input"
            ref={textarea}
            rows={1}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Downbot..."
            className="max-h-[200px] min-h-11 flex-1 resize-none bg-transparent py-2.5 text-[15px] leading-6 text-ink placeholder:text-placeholder focus:outline-none"
          />
          <button type="submit" disabled={!ready} aria-label="Send message"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-forest text-on-forest transition-colors hover:bg-forest-hover disabled:opacity-40">
            <ArrowUp size={18} />
          </button>
        </div>
        <p className="mt-2.5 text-center text-[11px] text-muted">Press Enter to send, Shift + Enter for a new line. Downbot can make mistakes.</p>
      </form>
    </div>
  );
}
