import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../lib/api';
import type { User, AuthState } from '../types/auth';

// Global variable to store the current auth token
let currentAuthToken: string | null = null;

// Function to get the current auth token for API requests
export function getCurrentAuthToken(): string | null {
  return currentAuthToken;
}

// Function to update auth headers
function updateAuthHeaders(token: string | null) {
  currentAuthToken = token;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      updateAuthHeaders(storedToken);
    }
    return storedToken;
  });

  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: !!token,
    retry: false
  });

  const setToken = (newToken: string) => {
    localStorage.setItem('auth_token', newToken);
    setTokenState(newToken);
    // Update API request headers
    updateAuthHeaders(newToken);
  };

  const login = async (email: string, password: string) => {
    console.log('🔐 Auth: Starting login process');
    const { user, token: newToken } = await authApi.login({ email, password });
    console.log('🔐 Auth: Received token from login:', newToken.substring(0, 20) + '...');
    
    setToken(newToken);
    // Force update the auth headers immediately
    updateAuthHeaders(newToken);
    
    console.log('🔐 Auth: Token stored, current auth token:', getCurrentAuthToken()?.substring(0, 20) + '...');
    await refetch();
  };

  const logout = () => {
    // Call logout API first while we still have the token
    if (token) {
      authApi.logout().catch(() => {
        // Ignore errors on logout
      });
    }
    
    // Then clear local state
    localStorage.removeItem('auth_token');
    setTokenState(null);
    updateAuthHeaders(null);
    
    // Force redirect to login page
    window.location.href = '/login';
  };

  // Update API headers when token changes
  useEffect(() => {
    updateAuthHeaders(token);
  }, [token]);

  const value: AuthContextType = {
    user: user || null,
    token,
    isLoading,
    login,
    logout,
    setToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
