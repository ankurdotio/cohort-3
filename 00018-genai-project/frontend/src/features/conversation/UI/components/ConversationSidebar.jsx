import { memo, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import { LogOut, MessageSquare, Plus, RotateCw, UserRound, X } from 'lucide-react';
import { Brand } from '../../../auth/UI/components/Brand.jsx';
import { Spinner } from '../../../auth/UI/components/Feedback.jsx';
import { useSignOut } from '../../../auth/Hooks/useAuth.js';
import { useConversationListLoader } from '../../Hooks/useConversation.js';
import {
  conversationSelected, newConversationOpened, selectConversationList, selectIsCurrent,
} from '../../State/conversation.slice.js';

const ConversationItem = memo(function ConversationItem({ id, title, onSelect }) {
  const isCurrent = useSelector(useMemo(() => selectIsCurrent(id), [id]));
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(id)}
        aria-current={isCurrent ? 'page' : undefined}
        title={title}
        className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
          isCurrent ? 'bg-sage font-medium text-forest' : 'text-ink hover:bg-sage/60'
        }`}
      >
        <MessageSquare size={15} className="shrink-0 opacity-70" aria-hidden="true" />
        <span className="truncate">{title}</span>
      </button>
    </li>
  );
});

function ConversationList({ onSelect }) {
  const conversations = useSelector(selectConversationList);
  const { status, error, retry } = useConversationListLoader();

  if (status === 'loading' && conversations.length === 0) {
    return <p role="status" className="flex items-center gap-2 px-3 py-4 text-xs text-muted"><Spinner className="size-4" /> Loading conversations...</p>;
  }
  return (
    <>
      {status === 'error' && (
        <div role="alert" className="mx-1 mb-3 rounded-lg border border-error-line bg-error-soft p-3 text-xs leading-5 text-error">
          <p>{error}</p>
          <button type="button" onClick={retry} className="mt-2 inline-flex items-center gap-1.5 font-semibold underline-offset-4 hover:underline">
            <RotateCw size={12} /> Try again
          </button>
        </div>
      )}
      {conversations.length === 0 && status === 'ready' ? (
        <p className="px-3 py-4 text-xs leading-5 text-muted">No conversations yet. Say hello to start one.</p>
      ) : (
        <ul className="space-y-1" aria-label="Conversations">
          {conversations.map(({ id, title }) => <ConversationItem key={id} id={id} title={title} onSelect={onSelect} />)}
        </ul>
      )}
    </>
  );
}

function SidebarAccount() {
  const name = useSelector((state) => state.auth.user?.name ?? '');
  const { pending, error, signOut } = useSignOut();
  return (
    <div className="border-t border-line p-3">
      {error && <p role="alert" className="mb-2 px-2 text-xs leading-5 text-error">{error}</p>}
      <div className="flex items-center gap-2">
        <Link to="/account" className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-sage/60">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sage font-display text-sm font-semibold text-forest">
            {name.slice(0, 1).toUpperCase() || <UserRound size={15} />}
          </span>
          <span className="truncate text-sm font-medium">{name}</span>
        </Link>
        <button type="button" onClick={signOut} disabled={pending} aria-label="Sign out" title="Sign out"
          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-sage hover:text-forest disabled:opacity-60">
          {pending ? <Spinner className="size-4" /> : <LogOut size={16} />}
        </button>
      </div>
    </div>
  );
}

export const ConversationSidebar = memo(function ConversationSidebar({ open, onClose }) {
  const dispatch = useDispatch();
  const select = useCallback((id) => { dispatch(conversationSelected(id)); onClose(); }, [dispatch, onClose]);
  const startNew = () => { dispatch(newConversationOpened()); onClose(); };

  return (
    <>
      {open && <button type="button" aria-label="Close conversations" onClick={onClose} className="fixed inset-0 z-30 bg-ink/30 lg:hidden" />}
      <aside
        aria-label="Conversation history"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-line bg-surface transition-transform motion-reduce:transition-none lg:static lg:visible lg:translate-x-0 ${
          open ? 'translate-x-0' : 'max-lg:invisible -translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <Brand />
          <button type="button" onClick={onClose} aria-label="Close sidebar" className="flex size-11 items-center justify-center rounded-lg text-muted hover:bg-sage lg:hidden">
            <X size={18} />
          </button>
        </div>
        <div className="px-3 pb-3">
          <button type="button" onClick={startNew} className="button-secondary w-full gap-2 px-4 text-sm">
            <Plus size={16} /> New chat
          </button>
        </div>
        <p className="eyebrow px-6 pt-3 pb-2">Conversations</p>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <ConversationList onSelect={select} />
        </nav>
        <SidebarAccount />
      </aside>
    </>
  );
});
