import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__
  ? 'http://localhost:3001'
  : 'https://api.venturecast.app';

interface User {
  _id: string;
  name: string;
  email: string;
  stripeCustomerId?: string;
  stripeAccountId?: string;
  treasuryBalance?: {
    available: number;
    pending: number;
    currency: string;
  };
}

interface UserContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load stored token and user data on mount
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        setLoading(true);
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUser = await AsyncStorage.getItem('userData');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          // Optionally refresh user data from backend
          await refreshUserData(storedToken);
        }
      } catch (e: any) {
        console.error('Error loading stored auth:', e);
        // Clear invalid stored data
        await AsyncStorage.multiRemove(['authToken', 'userData']);
      } finally {
        setLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const refreshUserData = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      }
    } catch (e) {
      console.error('Error refreshing user data:', e);
    }
  };

  const refreshUser = async () => {
    if (token) {
      await refreshUserData(token);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const lowerEmail = email.trim().toLowerCase();

      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: lowerEmail, password }),
      });

      const data = await response.json();
      console.log('Backend signIn result:', data);

      if (!response.ok || data.message === 'Invalid credentials') {
        setError(data.message || 'Sign in failed');
        return;
      }

      if (data.token && data.userId) {
        setToken(data.token);

        // Fetch full user data
        const userResponse = await fetch(`${API_BASE_URL}/users/${data.userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${data.token}`,
            'x-user-id': data.userId,
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);

          // Store auth data
          await AsyncStorage.setItem('authToken', data.token);
          await AsyncStorage.setItem('userData', JSON.stringify(userData));
        }
      } else {
        setError('Invalid response from server');
      }
    } catch (e: any) {
      console.error('Sign in error:', e);
      setError(e.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      console.log('Backend signUp result:', data);

      if (!response.ok || data.message === 'User already exists') {
        setError(data.message || 'Sign up failed');
        return;
      }

      if (data.message === 'User created successfully') {
        // Auto sign in after successful signup
        await signIn(email, password);
      }
    } catch (e: any) {
      console.error('Sign up error:', e);
      setError(e.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      // Clear local state
      setUser(null);
      setToken(null);

      // Clear stored data
      await AsyncStorage.multiRemove(['authToken', 'userData']);
    } catch (e: any) {
      console.error('Sign out error:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ user, token, loading, error, signIn, signUp, signOut, refreshUser }}>
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
