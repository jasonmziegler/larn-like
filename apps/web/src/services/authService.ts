import { supabase } from './supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export interface SignUpParams {
  email: string;
  password: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

/**
 * Sign up a new user with email and password
 */
export async function signUp({ email, password }: SignUpParams): Promise<{
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  return {
    user: data.user,
    session: data.session,
    error,
  };
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn({ email, password }: SignInParams): Promise<{
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    user: data.user,
    session: data.session,
    error,
  };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current session
 */
export async function getSession(): Promise<Session | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Subscribe to authentication state changes
 */
export function onAuthStateChange(
  callback: (user: User | null, session: Session | null) => void
) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(session?.user ?? null, session);
    }
  );

  return () => subscription.unsubscribe();
}
