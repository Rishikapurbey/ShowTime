import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { USERNAME_PATTERN, normalizeUsername, usernameError, shareUrl } from './share';

describe('share links', () => {
  it('normalizes names to trimmed lowercase', () => {
    expect(normalizeUsername('  Movie_Fan ')).toBe('movie_fan');
  });

  it.each([
    ['ab', 'Use at least 3 characters.'],
    ['a'.repeat(21), 'Use at most 20 characters.'],
    ['has space', 'Use only letters, numbers and underscores.'],
    ['dash-name', 'Use only letters, numbers and underscores.'],
    ['café', 'Use only letters, numbers and underscores.'],
  ])('rejects %j', (name, message) => {
    expect(usernameError(name)).toBe(message);
  });

  it.each([['abc'], ['movie_fan_2024'], ['a'.repeat(20)]])('accepts %j', (name) => {
    expect(usernameError(name)).toBeNull();
  });

  it('uses the same name pattern as firestore.rules', () => {
    // If these drift apart, the app would offer names the database refuses (or the reverse).
    const rules = readFileSync('firestore.rules', 'utf8');
    const rulesPattern = rules.match(/username\.matches\('([^']+)'\)/)[1];
    expect(USERNAME_PATTERN.source).toBe(`^${rulesPattern}$`);
  });

  it('builds the link from the current site', () => {
    expect(shareUrl('movie_fan')).toBe(`${window.location.origin}/u/movie_fan`);
  });
});
