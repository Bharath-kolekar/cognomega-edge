type EventCallback = (...args: unknown[]) => void;

export class EventEmitter {
  private events: Record<string, EventCallback[]> = {};
  on(event: string, callback: EventCallback): void {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }
  emit(event: string, ...args: unknown[]): void {
    (this.events[event] ?? []).forEach(cb => cb(...args));
  }
  off(event: string, callback: EventCallback): void {
    this.events[event] = (this.events[event] ?? []).filter(cb => cb !== callback);
  }
}
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
export function asyncTimeout(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
export function uniqueId(prefix: string = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}
export function log(message: string, ...args: unknown[]): void {
  console.log(`[${new Date().toISOString()}] ${message}`, ...args);
}