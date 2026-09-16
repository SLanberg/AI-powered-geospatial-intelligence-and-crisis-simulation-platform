import { ChatMessage } from "@/shared";

export interface SessionMemory {
  sessionId: string;
  history: ChatMessage[];
  lastActive: number;
}

export class MemoryStore {
  private sessions: Map<string, SessionMemory> = new Map();

  getMessages(sessionId: string): ChatMessage[] {
    const session = this.sessions.get(sessionId);
    return session ? [...session.history] : [];
  }

  appendMessage(sessionId: string, message: ChatMessage): void {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = { sessionId, history: [], lastActive: Date.now() };
      this.sessions.set(sessionId, session);
    }
    session.history.push(message);
    session.lastActive = Date.now();
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}

export const globalMemoryStore = new MemoryStore();
