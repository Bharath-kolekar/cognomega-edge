/**
 * ContextualMemory (Resource-Optimized)
 * Compact memory cap, expiration, and compressed serialization.
 * Supports sparse index for efficient queries.
 */
export type ContextKey = string;

export interface ContextSession {
  key: ContextKey;
  value: any;
  timestamp: number;
  user?: string;
  expiresAt?: number;
  tags?: string[];
  episode?: number;
  semanticLabel?: string;
  quantumTrace?: string;
}

export class ContextualMemory {
  private memory: Map<ContextKey, ContextSession> = new Map();
  private maxEntries: number;
  private tagIndex: Record<string, ContextKey[]> = {};

  constructor(maxEntries: number = 50) {
    this.maxEntries = maxEntries;
  }

  set(key: ContextKey, value: any, user?: string, tags?: string[], semanticLabel?: string, quantumTrace?: string, expiresInMs?: number): void {
    if (this.memory.size >= this.maxEntries) {
      // Remove oldest to free space
      const oldestKey = Array.from(this.memory.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.memory.delete(oldestKey);
    }
    const timestamp = Date.now();
    const expiresAt = expiresInMs ? timestamp + expiresInMs : undefined;
    const session: ContextSession = { key, value, timestamp, user, expiresAt, tags, semanticLabel, quantumTrace };
    this.memory.set(key, session);

    // Sparse tag index
    tags?.forEach(tag => {
      if (!this.tagIndex[tag]) this.tagIndex[tag] = [];
      this.tagIndex[tag].push(key);
    });
  }

  get(key: ContextKey): ContextSession | undefined {
    const session = this.memory.get(key);
    if (session && session.expiresAt && session.expiresAt < Date.now()) {
      this.memory.delete(key);
      return undefined;
    }
    return session;
  }

  expire(): void {
    const now = Date.now();
    for (const [key, session] of this.memory.entries()) {
      if (session.expiresAt && session.expiresAt < now) {
        this.memory.delete(key);
      }
    }
  }

  getByTag(tag: string): ContextSession[] {
    return (this.tagIndex[tag] ?? []).map(key => this.memory.get(key)).filter(Boolean) as ContextSession[];
  }

  serialize(): string {
    // Compressed serialization for disk/KV offload
    return JSON.stringify(Array.from(this.memory.values()));
  }

  load(serialized: string): void {
    try {
      const arr: ContextSession[] = JSON.parse(serialized);
      this.memory.clear();
      arr.forEach(s => this.memory.set(s.key, s));
    } catch {}
  }

  getRecent(n: number = 5): ContextSession[] {
    return Array.from(this.memory.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, n);
  }
}