/**
 * Idempotenz-Cache (In-Memory, später austauschbar durch KV/SQLite)
 */
export class IdempotencyBus {
  private cache: Map<string, { timestamp: number; data: unknown }> = new Map();
  private ttlMs: number;

  constructor(ttlMs = 86400000) {
    // Default: 24h TTL
    this.ttlMs = ttlMs;
  }

  /**
   * Prüft, ob Request-ID bereits verarbeitet wurde
   */
  isDuplicate(requestId: string): boolean {
    const entry = this.cache.get(requestId);
    if (!entry) {
      return false;
    }

    // TTL-Check
    const age = Date.now() - entry.timestamp;
    if (age > this.ttlMs) {
      this.cache.delete(requestId);
      return false;
    }

    return true;
  }

  /**
   * Markiert Request-ID als verarbeitet
   */
  markProcessed(requestId: string, data?: unknown): void {
    this.cache.set(requestId, {
      timestamp: Date.now(),
      data,
    });
  }

  /**
   * Löscht alle abgelaufenen Einträge
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttlMs) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Gibt Cache-Größe zurück
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Leert Cache vollständig
   */
  clear(): void {
    this.cache.clear();
  }
}

