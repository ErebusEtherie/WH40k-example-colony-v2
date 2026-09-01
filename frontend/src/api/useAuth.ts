/**
 * useAuth Hook - Authentication state management with TanStack Query
 * 
 * Features:
 * - Automatic token refresh on 401 (handled by apiClient)
 * - Proactive refresh at 25 minutes (before 30-minute expiry)
 * - Session persistence via httpOnly cookies
 * - Role-based access (admin/user/viewer)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';
import { UserResponse, AuthState } from '../types';

const AUTH_QUERY_KEYS = {
  all: ['auth'] as const,
  user: () => [...AUTH_QUERY_KEYS.all, 'user'] as const,
};

const PROACTIVE_REFRESH_INTERVAL = 25 * 60 * 1000; // 25 minutes (before 30-min token expiry)

export function useAuth() {
  const queryClient = useQueryClient();

  // Get current user - determines auth state
  const {
    data: user,
    isLoading,
    error,
    refetch: _refetch,
  } = useQuery<UserResponse | null, Error>({
    queryKey: AUTH_QUERY_KEYS.user(),
    queryFn: async () => {
      try {
        return await apiClient.getCurrentUser();
      } catch (err) {
        // Only return null for auth errors (expected when not logged in)
        const errorMessage = err instanceof Error ? err.message : String(err);
        // Check for auth-related errors: HTTP status codes or session expired
        if (
          errorMessage.includes('401') || 
          errorMessage.includes('403') || 
          errorMessage.includes('Session expired') ||
          errorMessage.includes('refresh failed')
        ) {
          return null;
        }
        // Log unexpected errors for debugging
        console.error('Auth check failed:', err);
        throw err; // Let React Query handle retry/error state
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Proactive token refresh
  useQuery({
    queryKey: ['auth', 'refresh'],
    queryFn: async () => {
      try {
        const response = await apiClient.refreshToken();
        return response;
      } catch {
        return null;
      }
    },
    refetchInterval: PROACTIVE_REFRESH_INTERVAL,
    enabled: !!user, // Only refresh when authenticated
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiClient.login(credentials.username, credentials.password);
      return response;
    },
    onSuccess: () => {
      // Invalidate user query to trigger refetch
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user() });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: { username: string; email: string; password: string; role?: string }) => {
      const response = await apiClient.register(data.username, data.email, data.password, data.role);
      return response;
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.logout();
    },
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      await apiClient.changePassword(data.currentPassword, data.newPassword);
    },
  });

  const isAuthenticated = !!user;
  const authState: AuthState = {
    user: user || null,
    isAuthenticated,
    isLoading,
    error: error ? error.message : null,
  };

  return {
    // State
    ...authState,
    
    // Actions
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,
    
    // Status
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error?.message || null,
    registerError: registerMutation.error?.message || null,
  };
}

export { AUTH_QUERY_KEYS };