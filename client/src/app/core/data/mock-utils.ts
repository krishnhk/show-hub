/**
 * Deterministic helpers shared by the mock backend.
 *
 * The mock API has to behave like a real API: the same showtime must always
 * produce the same seat layout, and a seat that shows up as "Booked" for a
 * buyer must also be booked for the seller. Instead of persisting random
 * layouts we derive them from a stable hash of the identifiers.
 */

export function hashCode(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function pick<T>(items: readonly T[], seed: string): T {
  return items[hashCode(seed) % items.length];
}

export function isoNow(): string {
  return new Date().toISOString();
}

export function isoIn(hours: number, from: Date = new Date()): string {
  return new Date(from.getTime() + hours * 3600 * 1000).toISOString();
}

export function isoDaysAgo(days: number, hours = 0): string {
  return new Date(Date.now() - (days * 24 + hours) * 3600 * 1000).toISOString();
}

export function isoDaysAhead(days: number, hours = 0): string {
  return new Date(Date.now() + (days * 24 + hours) * 3600 * 1000).toISOString();
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function dateKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function daysBetween(from: string | Date, to: string | Date): number {
  const a = startOfDay(typeof from === 'string' ? new Date(from) : from).getTime();
  const b = startOfDay(typeof to === 'string' ? new Date(to) : to).getTime();
  return Math.round((b - a) / 86400000);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function randomConfirmationCode(prefix: string): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += alphabet[hashCode(`${prefix}-${i}-${Date.now()}`) % alphabet.length];
  }
  return code;
}

/** URL-safe pseudo QR payload rendered by the ticket card. */
export function fakeQrPayload(value: string): string {
  return `SHOWHUB:${value}`;
}

/** Splits a full name at its first space: "Aarav Kumar Sharma" becomes first "Aarav", last "Kumar Sharma". */
export function splitName(fullName: string): [string, string] {
  const trimmed = fullName.trim();
  const space = trimmed.indexOf(' ');
  return space === -1 ? [trimmed, ''] : [trimmed.slice(0, space), trimmed.slice(space + 1).trim()];
}
