import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHookWithProviders } from '../test/utils'
import { useAuth, AUTH_QUERY_KEYS } from './useAuth'
import { waitFor } from '@testing-library/react'
import { apiClient } from '../utils/apiClient'

vi.mock('../utils/apiClient', () => ({
  apiClient: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
    refreshToken: vi.fn(),
  },
}))

const mockUser = {
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  role: 'admin' as const,
  is_active: true,
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useAuth query', () => {
    it('returns authenticated state when user is logged in', async () => {
      vi.mocked(apiClient.getCurrentUser).mockResolvedValue(mockUser)
      const { result } = renderHookWithProviders(() => useAuth())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(apiClient.getCurrentUser).toHaveBeenCalled()
    })

    it('returns unauthenticated state when not logged in', async () => {
      vi.mocked(apiClient.getCurrentUser).mockRejectedValue(new Error('401 Unauthorized'))
      const { result } = renderHookWithProviders(() => useAuth())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
    })

    it('handles non-auth errors', async () => {
      vi.mocked(apiClient.getCurrentUser).mockRejectedValue(new Error('Network error'))
      const { result } = renderHookWithProviders(() => useAuth())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.error).toBe('Network error')
    })
  })

  describe('login', () => {
    it('logs in successfully', async () => {
      vi.mocked(apiClient.login).mockResolvedValue({ access_token: 'mock-jwt-token-12345', refresh_token: 'mock-refresh-token', token_type: 'bearer' as const, expires_in: 3600 })
      vi.mocked(apiClient.getCurrentUser).mockResolvedValue(mockUser)
      const { result } = renderHookWithProviders(() => useAuth())
      await result.current.login({ username: 'admin', password: 'password' })
      await waitFor(() => expect(result.current.isLoggingIn).toBe(false))
      expect(apiClient.login).toHaveBeenCalledWith('admin', 'password')
    })

    it('handles login failure', async () => {
      vi.mocked(apiClient.login).mockRejectedValue(new Error('Invalid credentials'))
      const { result } = renderHookWithProviders(() => useAuth())
      try { await result.current.login({ username: 'admin', password: 'wrong' }) } catch {}
      await waitFor(() => expect(result.current.isLoggingIn).toBe(false))
      expect(result.current.loginError).toBe('Invalid credentials')
    })
  })

  describe('register', () => {
    it('registers a new user successfully', async () => {
      vi.mocked(apiClient.register).mockResolvedValue({ id: 123, username: 'newuser', email: 'new@example.com', role: 'user' as const, is_active: true })
      const { result } = renderHookWithProviders(() => useAuth())
      await result.current.register({ username: 'newuser', email: 'new@example.com', password: 'password123' })
      await waitFor(() => expect(result.current.isRegistering).toBe(false))
      expect(apiClient.register).toHaveBeenCalledWith('newuser', 'new@example.com', 'password123', undefined)
    })

    it('handles registration failure', async () => {
      vi.mocked(apiClient.register).mockRejectedValue(new Error('Username already exists'))
      const { result } = renderHookWithProviders(() => useAuth())
      try { await result.current.register({ username: 'existing', email: 'existing@example.com', password: 'password123' }) } catch {}
      await waitFor(() => expect(result.current.isRegistering).toBe(false))
      expect(result.current.registerError).toBe('Username already exists')
    })
  })

  describe('logout', () => {
    it('logs out successfully', async () => {
      vi.mocked(apiClient.logout).mockResolvedValue(undefined)
      const { result } = renderHookWithProviders(() => useAuth())
      await result.current.logout()
      await waitFor(() => expect(result.current.isLoggingOut).toBe(false))
      expect(apiClient.logout).toHaveBeenCalled()
    })
  })

  describe('changePassword', () => {
    it('changes password successfully', async () => {
      vi.mocked(apiClient.changePassword).mockResolvedValue(undefined)
      const { result } = renderHookWithProviders(() => useAuth())
      await result.current.changePassword({ currentPassword: 'oldPassword', newPassword: 'newPassword' })
      expect(apiClient.changePassword).toHaveBeenCalledWith('oldPassword', 'newPassword')
    })

    it('handles change password failure', async () => {
      vi.mocked(apiClient.changePassword).mockRejectedValue(new Error('Current password is incorrect'))
      const { result } = renderHookWithProviders(() => useAuth())
      await expect(result.current.changePassword({ currentPassword: 'wrongPassword', newPassword: 'newPassword' })).rejects.toThrow('Current password is incorrect')
      expect(apiClient.changePassword).toHaveBeenCalledWith('wrongPassword', 'newPassword')
    })
  })
})

describe('AUTH_QUERY_KEYS', () => {
  it('defines correct query key structure', () => {
    expect(AUTH_QUERY_KEYS.all).toEqual(['auth'])
    expect(AUTH_QUERY_KEYS.user()).toEqual(['auth', 'user'])
  })
})
