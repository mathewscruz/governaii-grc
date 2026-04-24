import { useCallback, useEffect, useState } from "react";

export type AkurIAMsg = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

export interface AkurIAConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: AkurIAMsg[];
}

const STORAGE_PREFIX = "akuria:conversations:";
const MAX_CONVERSATIONS = 20;

const keyFor = (userId: string | null) => `${STORAGE_PREFIX}${userId || "anon"}`;

function loadAll(userId: string | null): AkurIAConversation[] {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveAll(userId: string | null, list: AkurIAConversation[]) {
  try {
    const trimmed = list.slice(0, MAX_CONVERSATIONS);
    localStorage.setItem(keyFor(userId), JSON.stringify(trimmed));
  } catch {
    // Ignora quotaExceeded silenciosamente
  }
}

function makeTitle(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 40) return cleaned || "Nova conversa";
  return cleaned.slice(0, 40) + "…";
}

export function useAkurIASession(userId: string | null) {
  const [conversations, setConversations] = useState<AkurIAConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Carrega na inicialização
  useEffect(() => {
    const loaded = loadAll(userId);
    setConversations(loaded);
    if (loaded.length > 0) setActiveId(loaded[0].id);
  }, [userId]);

  const persist = useCallback(
    (next: AkurIAConversation[]) => {
      setConversations(next);
      saveAll(userId, next);
    },
    [userId]
  );

  const active = conversations.find((c) => c.id === activeId) || null;

  const newConversation = useCallback(() => {
    const id = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const conv: AkurIAConversation = {
      id,
      title: "Nova conversa",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    const next = [conv, ...conversations];
    persist(next);
    setActiveId(id);
    return conv;
  }, [conversations, persist]);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      const next = conversations.filter((c) => c.id !== id);
      persist(next);
      if (activeId === id) {
        setActiveId(next[0]?.id || null);
      }
    },
    [conversations, activeId, persist]
  );

  const appendMessage = useCallback(
    (msg: AkurIAMsg) => {
      let convId = activeId;
      let list = conversations;

      // Cria conversa lazy se não houver ativa
      if (!convId) {
        const id = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const conv: AkurIAConversation = {
          id,
          title: msg.role === "user" ? makeTitle(msg.content) : "Nova conversa",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [msg],
        };
        list = [conv, ...list];
        convId = id;
        setActiveId(id);
        persist(list);
        return;
      }

      const next = list.map((c) => {
        if (c.id !== convId) return c;
        const isFirstUserMsg = c.messages.length === 0 && msg.role === "user";
        return {
          ...c,
          title: isFirstUserMsg ? makeTitle(msg.content) : c.title,
          messages: [...c.messages, msg],
          updatedAt: Date.now(),
        };
      });
      persist(next);
    },
    [activeId, conversations, persist]
  );

  const updateLastAssistant = useCallback(
    (content: string) => {
      if (!activeId) return;
      const next = conversations.map((c) => {
        if (c.id !== activeId) return c;
        const msgs = [...c.messages];
        const last = msgs[msgs.length - 1];
        if (last?.role === "assistant") {
          msgs[msgs.length - 1] = { ...last, content };
        } else {
          msgs.push({ role: "assistant", content, timestamp: Date.now() });
        }
        return { ...c, messages: msgs, updatedAt: Date.now() };
      });
      persist(next);
    },
    [activeId, conversations, persist]
  );

  const clearAll = useCallback(() => {
    persist([]);
    setActiveId(null);
  }, [persist]);

  return {
    conversations,
    active,
    activeId,
    newConversation,
    selectConversation,
    deleteConversation,
    appendMessage,
    updateLastAssistant,
    clearAll,
  };
}
