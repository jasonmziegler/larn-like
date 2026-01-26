import { describe, it, expect, beforeAll } from 'vitest';
import { signUp, signIn, signOut, getCurrentUser } from '../../src/services/authService';

describe('Authentication Service', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  it('should sign up a new user', async () => {
    const { user, session, error } = await signUp({
      email: testEmail,
      password: testPassword,
    });

    expect(error).toBeNull();
    expect(user).toBeDefined();
    expect(user?.email).toBe(testEmail);
    expect(session).toBeDefined();
  });

  it('should sign in an existing user', async () => {
    const { user, session, error } = await signIn({
      email: testEmail,
      password: testPassword,
    });

    expect(error).toBeNull();
    expect(user).toBeDefined();
    expect(user?.email).toBe(testEmail);
    expect(session).toBeDefined();
  });

  it('should get current user', async () => {
    // First sign in
    await signIn({
      email: testEmail,
      password: testPassword,
    });

    const user = await getCurrentUser();
    expect(user).toBeDefined();
    expect(user?.email).toBe(testEmail);
  });

  it('should sign out the current user', async () => {
    const { error } = await signOut();
    expect(error).toBeNull();

    const user = await getCurrentUser();
    expect(user).toBeNull();
  });
});
