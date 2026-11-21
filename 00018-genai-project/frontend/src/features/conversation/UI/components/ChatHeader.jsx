import { memo } from 'react';
import { useSelector } from 'react-redux';
import { Menu } from 'lucide-react';
import { selectCurrentTitle } from '../../State/conversation.slice.js';

export const ChatHeader = memo(function ChatHeader({ onOpenSidebar }) {
  const title = useSelector(selectCurrentTitle);
  return (
    <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-line px-4 sm:px-8">
      <button type="button" onClick={onOpenSidebar} aria-label="Open conversations"
        className="flex size-11 items-center justify-center rounded-lg text-muted hover:bg-sage lg:hidden">
        <Menu size={19} />
      </button>
      <h1 className="truncate font-display text-base font-semibold">{title}</h1>
    </header>
  );
});
