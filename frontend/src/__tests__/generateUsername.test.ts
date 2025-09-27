import { describe, it, expect } from 'vitest';
import { generateUsername } from '../utils/generateUsername';

describe('generateUsername', () => {
  it('generates with first+last', () => {
    const u = generateUsername('Jane','Doe');
    expect(u.startsWith('janedoe')).toBe(true);
    expect(u.length).toBeGreaterThan(7);
  });
  it('fallback when empty', () => {
    const u = generateUsername('','');
    expect(u.startsWith('member')).toBe(true);
  });
});
