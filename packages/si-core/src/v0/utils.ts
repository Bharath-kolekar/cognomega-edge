// RESOLVED CONFLICT: Merged Tailwind class combiner (cn) from feat/v0-import with utility EventEmitter, deepClone, asyncTimeout, uniqueId, and log from main.

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind + clsx class combiner
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// EventEmitter utility
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

// Deep clone utility
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Async timeout utility
export function asyncTimeout(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Unique ID generator
export function uniqueId(prefix: string = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

// Timestamped logger
export function log(message: string, ...args: unknown[]): void {
  console.log(`[${new Date().toISOString()}] ${message}`, ...args);
}