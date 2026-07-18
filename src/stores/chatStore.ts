import { create } from 'zustand';
import type { ChatSession, ChatMessage } from '@/types';
import { getDatabase } from '@/database/connection';
import * as chatQueries from '@/database/chatQueries';
import * as queries from '@/database/queries';
import { callAIChat, buildChatSystemPrompt, AIMessage } from '@/engine/aiService';
import { useSettingsStore } from '@/stores/settingsStore';
import { generateId } from '@/utils/id';

function autoTitle(text: string): string {
  const words = text.trim().split(/\s+/).slice(0, 6).join(' ');
  return words.length > 48 ? words.slice(0, 45) + '…' : words || 'Chat';
}

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  messages: ChatMessage[];
  sending: boolean;

  loadSessions: () => void;
  /** Creates a session, makes it active and returns its id */
  newSession: (contextIds?: string[]) => string;
  openSession: (id: string) => void;
  closeSession: () => void;
  renameSession: (id: string, title: string) => void;
  togglePinSession: (id: string) => void;
  deleteSession: (id: string) => void;
  setSessionContexts: (contextIds: string[]) => void;
  clearMessages: () => void;

  /**
   * Sends a user message in the active session (creates one when none is active)
   * and appends the assistant reply. promptId marks messages produced from a
   * saved prompt, which drives next-step chain suggestions.
   */
  sendMessage: (text: string, opts?: { promptId?: string }) => Promise<string | null>;
  /** Re-asks the model for the last user message (drops the last assistant reply) */
  regenerateLast: () => Promise<string | null>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  sending: false,

  loadSessions: () => {
    try {
      const db = getDatabase();
      set({ sessions: chatQueries.getSessions(db) });
    } catch (e) {
      console.error('Failed to load chat sessions:', e);
    }
  },

  newSession: (contextIds = []) => {
    const db = getDatabase();
    const settings = useSettingsStore.getState();
    const provider = settings.aiProviders.find(p => p.id === settings.activeAIProvider);
    const now = Date.now();
    const session: ChatSession = {
      id: generateId(),
      title: 'Chat',
      providerId: provider?.id,
      model: provider?.model,
      contextIds,
      isPinned: false,
      createdAt: now,
      updatedAt: now,
    };
    chatQueries.insertSession(db, session);
    set({ activeSessionId: session.id, messages: [] });
    get().loadSessions();
    return session.id;
  },

  openSession: (id) => {
    try {
      const db = getDatabase();
      const messages = chatQueries.getMessages(db, id);
      set({ activeSessionId: id, messages });
    } catch (e) {
      console.error('Failed to open chat session:', e);
    }
  },

  closeSession: () => set({ activeSessionId: null, messages: [] }),

  renameSession: (id, title) => {
    const db = getDatabase();
    chatQueries.updateSession(db, id, { title });
    get().loadSessions();
  },

  togglePinSession: (id) => {
    const db = getDatabase();
    const session = chatQueries.getSessionById(db, id);
    if (!session) return;
    chatQueries.updateSession(db, id, { isPinned: !session.isPinned });
    get().loadSessions();
  },

  deleteSession: (id) => {
    const db = getDatabase();
    chatQueries.deleteSession(db, id);
    const { activeSessionId } = get();
    if (activeSessionId === id) {
      set({ activeSessionId: null, messages: [] });
    }
    get().loadSessions();
  },

  setSessionContexts: (contextIds) => {
    const { activeSessionId } = get();
    if (!activeSessionId) return;
    const db = getDatabase();
    chatQueries.updateSession(db, activeSessionId, { contextIds });
    get().loadSessions();
  },

  clearMessages: () => {
    const { activeSessionId } = get();
    if (!activeSessionId) return;
    const db = getDatabase();
    for (const m of chatQueries.getMessages(db, activeSessionId)) {
      chatQueries.deleteMessage(db, m.id);
    }
    set({ messages: [] });
  },

  sendMessage: async (text, opts) => {
    const trimmed = text.trim();
    if (!trimmed || get().sending) return null;

    const db = getDatabase();
    let sessionId = get().activeSessionId;
    if (!sessionId) {
      sessionId = get().newSession();
    }

    const userMsg: ChatMessage = {
      id: generateId(),
      sessionId,
      role: 'user',
      content: trimmed,
      promptId: opts?.promptId,
      createdAt: Date.now(),
    };
    chatQueries.insertMessage(db, userMsg);

    const history = [...get().messages, userMsg];
    set({ messages: history, sending: true });

    // Auto-title the session from its first user message
    const session = chatQueries.getSessionById(db, sessionId);
    if (session && (session.title === 'Chat' || !session.title)) {
      chatQueries.updateSession(db, sessionId, { title: autoTitle(trimmed) });
    } else {
      chatQueries.touchSession(db, sessionId);
    }

    try {
      const contexts = session ? queries.getPromptsByIds(db, session.contextIds) : [];
      const aiMessages: AIMessage[] = [
        { role: 'system', content: buildChatSystemPrompt(contexts) },
        ...history.map(m => ({ role: m.role, content: m.content } as AIMessage)),
      ];
      const response = await callAIChat(aiMessages);

      const assistantMsg: ChatMessage = {
        id: generateId(),
        sessionId,
        role: 'assistant',
        content: response,
        createdAt: Date.now(),
      };
      // The session may have been deleted while the request was in flight;
      // inserting then would violate the foreign key
      const sessionStillExists = chatQueries.getSessionById(db, sessionId) !== null;
      if (sessionStillExists) {
        chatQueries.insertMessage(db, assistantMsg);
        chatQueries.touchSession(db, sessionId);
      }
      set(state => ({
        messages: state.activeSessionId === sessionId && sessionStillExists
          ? [...state.messages, assistantMsg]
          : state.messages,
        sending: false,
      }));
      get().loadSessions();
      return response;
    } catch (e: any) {
      set({ sending: false });
      throw e;
    }
  },

  regenerateLast: async () => {
    const { messages, sending, activeSessionId } = get();
    if (sending || !activeSessionId) return null;

    // Hide trailing assistant message(s) so the last user message is re-asked.
    // They are only deleted from the DB once the new reply has arrived, so a
    // failed request never loses the previous answer.
    const trimmedMessages = [...messages];
    const removedMessages: ChatMessage[] = [];
    while (trimmedMessages.length > 0 && trimmedMessages[trimmedMessages.length - 1].role === 'assistant') {
      removedMessages.unshift(trimmedMessages.pop()!);
    }
    const lastUser = trimmedMessages[trimmedMessages.length - 1];
    if (!lastUser || lastUser.role !== 'user') return null;

    const db = getDatabase();
    set({ messages: trimmedMessages, sending: true });
    try {
      const session = chatQueries.getSessionById(db, activeSessionId);
      const contexts = session ? queries.getPromptsByIds(db, session.contextIds) : [];
      const aiMessages: AIMessage[] = [
        { role: 'system', content: buildChatSystemPrompt(contexts) },
        ...trimmedMessages.map(m => ({ role: m.role, content: m.content } as AIMessage)),
      ];
      const response = await callAIChat(aiMessages);
      const assistantMsg: ChatMessage = {
        id: generateId(),
        sessionId: activeSessionId,
        role: 'assistant',
        content: response,
        createdAt: Date.now(),
      };
      const sessionStillExists = chatQueries.getSessionById(db, activeSessionId) !== null;
      if (sessionStillExists) {
        for (const m of removedMessages) {
          chatQueries.deleteMessage(db, m.id);
        }
        chatQueries.insertMessage(db, assistantMsg);
        chatQueries.touchSession(db, activeSessionId);
      }
      set(state => ({
        messages: state.activeSessionId === activeSessionId && sessionStillExists
          ? [...state.messages, assistantMsg]
          : state.messages,
        sending: false,
      }));
      return response;
    } catch (e: any) {
      // Nothing was deleted from the DB — restore the previous reply
      set(state => ({
        messages: state.activeSessionId === activeSessionId
          ? [...trimmedMessages, ...removedMessages]
          : state.messages,
        sending: false,
      }));
      throw e;
    }
  },
}));
