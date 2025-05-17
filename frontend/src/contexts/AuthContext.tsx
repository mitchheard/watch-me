'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthContext] useEffect: Initializing session check.');
    const getSession = async () => {
      setIsLoading(true);
      console.log('[AuthContext] getSession: Fetching current session.');
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[AuthContext] getSession: Error getting session:', error.message);
      } else {
        console.log('[AuthContext] getSession: Fetched session data:', data.session);
        setSession(data.session);
        setUser(data.session?.user ?? null);
      }
      setIsLoading(false);
      console.log('[AuthContext] getSession: Finished. isLoading set to false.');
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('[AuthContext] onAuthStateChange: Event triggered. Event:', _event, 'Session:', session);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        console.log('[AuthContext] onAuthStateChange: State updated. isLoading set to false.');
      }
    );

    return () => {
      console.log('[AuthContext] useEffect: Cleaning up auth listener.');
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    const redirectToUrl = `${window.location.origin}/auth/callback`;
    console.log('[AuthContext] loginWithGoogle: Initiating Google OAuth. Redirecting to:', redirectToUrl);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectToUrl,
        queryParams: {
          prompt: 'select_account'
        }
      }
    });
    if (error) {
      console.error('[AuthContext] loginWithGoogle: Error:', error.message);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('Error logging in with email:', error.message);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      console.error('Error signing up with email:', error.message);
      throw error;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    console.log("[AuthContext] Attempting logout with scope: local");
    const { error } = await supabase.auth.signOut({ scope: 'local' }); 
    if (error) {
      console.error('[AuthContext] Error logging out (local scope attempt):', error.message);
      setSession(null);
      setUser(null);
    } else {
      console.log('[AuthContext] Successfully signed out (local scope attempt)');
    }
    setIsLoading(false);
    console.log('[AuthContext] logout: Finished. isLoading set to false.');
  };

  console.log('[AuthContext] Provider render. isLoading:', isLoading, 'User:', user?.id);

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      isLoading, 
      loginWithGoogle, 
      loginWithEmail, 
      signUpWithEmail, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 