import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

export type MessageKind = 'status' | 'alert';

interface Message {
  id: number;
  kind: MessageKind;
  text: string;
}

interface Messages {
  messages: Message[];
  add(kind: MessageKind, text: string): number;
  remove(id: number): void;
}

const MessagesContext = createContext<Messages | null>(null);

function useMessages(): Messages {
  const context = useContext(MessagesContext);
  if (!context) throw new Error('MessagesProvider fehlt');
  return context;
}

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const nextId = useRef(0);
  const add = useCallback((kind: MessageKind, text: string) => {
    const id = ++nextId.current;
    setMessages((current) => [...current, { id, kind, text }]);
    return id;
  }, []);
  const remove = useCallback((id: number) => setMessages((current) => current.filter((m) => m.id !== id)), []);
  const value = useMemo(() => ({ messages, add, remove }), [messages, add, remove]);
  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

/** Meldet in den Stapel oben; ersetzt die vorige Meldung derselben Stelle, ohne Text entfernt es sie. */
export function useReport() {
  const { add, remove } = useMessages();
  const current = useRef<number | undefined>(undefined);
  return useCallback(
    (kind?: MessageKind, text?: string) => {
      if (current.current !== undefined) remove(current.current);
      current.current = kind && text ? add(kind, text) : undefined;
    },
    [add, remove],
  );
}

/** Meldung zu einem Ereignis; schließt sich über das Kreuz am rechten Rand. */
export function MessageRow({ kind, text, onClose }: { kind: MessageKind; text: string; onClose: () => void }) {
  return (
    <div role={kind} className={`message ${kind}`}>
      <span>{text}</span>
      <button type="button" className="message-close" aria-label="Meldung schließen" onClick={onClose}>
        ×
      </button>
    </div>
  );
}

export function ReportedMessages() {
  const { messages, remove } = useMessages();
  return messages.map((message) => <MessageRow key={message.id} kind={message.kind} text={message.text} onClose={() => remove(message.id)} />);
}
