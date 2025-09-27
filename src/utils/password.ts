// Simple password utilities for prototype only. Do NOT use this as-is for production security.
// In real implementation: enforce stronger rules, rate limiting, server-side hashing (e.g., bcrypt/argon2),
// and never store password hashes alongside public profile data.

export function validatePassword(pwd: string): string[] {
  const issues: string[] = [];
  if (pwd.length < 8) issues.push('At least 8 characters');
  if (!/[A-Z]/.test(pwd)) issues.push('One uppercase letter');
  if (!/[a-z]/.test(pwd)) issues.push('One lowercase letter');
  if (!/[0-9]/.test(pwd)) issues.push('One number');
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) issues.push('One special character');
  return issues;
}

export async function hashPassword(pwd: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pwd);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface StoredCredentials { username: string; passwordHash: string; createdAt: string; }

const CREDS_KEY = 'technova_auth_v1';

export function storeCredentials(creds: StoredCredentials) {
  try { localStorage.setItem(CREDS_KEY, JSON.stringify(creds)); } catch {}
}

export function getStoredCredentials(): StoredCredentials | null {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredCredentials;
  } catch { return null; }
}
