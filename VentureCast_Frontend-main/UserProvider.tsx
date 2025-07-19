import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabaseClient';

interface UserContextType {
  user: any;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for an existing session on mount
    const getSession = async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (data && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    getSession();
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const lowerEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({ email: lowerEmail, password });
      console.log('Supabase signIn result:', { data, error });
      if (error) {
        setError(error.message);
      } else if (data && data.user) {
        setUser(data.user);
      } else {
        setError('Unknown error.');
      }
    } catch (e: any) {
      setError(e.message || 'Unknown error.');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    setUser(data?.user ?? null);
    setLoading(false);
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  };

  return (
    <UserContext.Provider value={{ user, loading, error, signIn, signUp, signOut }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 