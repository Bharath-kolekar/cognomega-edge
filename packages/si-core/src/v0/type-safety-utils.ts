/**
 * Type Safety Utilities (Resource-Optimized)
 * Stateless, rapid, quantum-safe.
 */
export function isString(val: unknown): val is string {
  return typeof val === 'string';
}
export function isNumber(val: unknown): val is number {
  return typeof val === 'number';
}
export function isObject(val: unknown): val is object {
  return typeof val === 'object' && val !== null;
}
export function assert<T>(condition: any, msg?: string): asserts condition {
  if (!condition) throw new Error(msg || 'Assertion failed');
}
export function validateSchema(obj: Record<string, any>, schema: Record<string, string>): boolean {
  for (const key in schema) {
    if (typeof obj[key] !== schema[key]) return false;
  }
  return true;
}
export function inferType(val: unknown): string {
  if (isString(val)) return 'string';
  if (isNumber(val)) return 'number';
  if (Array.isArray(val)) return 'array';
  if (isObject(val)) return 'object';
  if (typeof val === 'undefined') return 'quantum-undefined';
  return typeof val;
}