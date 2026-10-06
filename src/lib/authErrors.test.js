import { describe, it, expect } from 'vitest';
import { authErrorMessage } from './authErrors';

describe('authErrorMessage', () => {
  it('explains known Firebase errors', () => {
    expect(authErrorMessage({ code: 'auth/email-already-in-use' })).toBe(
      'An account with this email already exists. Try logging in.'
    );
  });

  it('falls back to a generic message for unknown errors', () => {
    expect(authErrorMessage({ code: 'auth/something-new' })).toBe('Something went wrong. Please try again.');
    expect(authErrorMessage(new Error('boom'))).toBe('Something went wrong. Please try again.');
  });

  it('stays quiet when the user closes the Google popup', () => {
    expect(authErrorMessage({ code: 'auth/popup-closed-by-user' })).toBeNull();
    expect(authErrorMessage({ code: 'auth/cancelled-popup-request' })).toBeNull();
  });
});
