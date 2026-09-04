/**
 * API Client and TanStack Query hooks for WH40k Colony Manager
 * 
 * This module provides:
 * - API client with automatic token refresh using HttpOnly cookies
 * - CSRF token management for state-changing requests
 * - TanStack Query hooks for all backend resources
 * 
 * SECURITY: Uses HttpOnly cookies + CSRF tokens instead of localStorage
 * Per 07-frontend-architecture.md: All server state lives in TanStack Query,
 * and the frontend never reimplements backend rule logic.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import type {
  Colony,
  Representative,
  Infrastructure,
  SupportUpgrade,
  Modifier,
  ColonyResource,
  DevelopmentPlan,
  User,
  ColonyStatsBreakdown,
  ColonyType,
  ModifierStat,
  InfrastructureState,
  UserRole,
} from '../types/colony';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

// ============================================================================
// Types (Backend API Schemas)
// ============================================================================

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface ColonyCreate {
  name: string;
  founder_name: string;
  patron_name?: string | null;
  colony_type: ColonyType;
}

export interface ColonyUpdate {
  name?: string | null;
  founder_name?: string | null;
  patron_name?: string | null;
  age_days?: number | null;
  current_event?: string | null;
}

export interface ModifierCreate {
  colony_id: string;
  name: string;
  modifier_stat: ModifierStat;
  modifier_value: number;
  source: string;
  is_active: boolean;
  description?: string | null;
}

export interface ModifierUpdate {
  name?: string;
  modifier_stat?: ModifierStat;
  modifier_value?: number;
  is_active?: boolean;
  description?: string | null;
}

export interface InfrastructureCreate {
  colony_id: string;
  infrastructure_type: string;
  name: string;
  state: InfrastructureState;
  notes?: string | null;
}

export interface SupportUpgradeCreate {
  colony_id: string;
  upgrade_type: string;
  name: string;
  chosen_stat?: ModifierStat | null;
  custom_product?: string | null;
  notes?: string | null;
}

export interface RepresentativeCreate {
  name: string;
  title: string;
  representative_type: string;
  personality: string;
  stat_bonus: number;
  skills?: string[];
  talents?: string[];
  notes?: string | null;
}

export interface DevelopmentPlanCreate {
  colony_id: string;
  name: string;
  category?: 'Hard Infrastructure' | 'Support Upgrade' | 'Specialty Project';
  target_category?: string;
  specific_type?: string;
  target_stat?: ModifierStat;
  target_value?: number;
  priority_rank?: number;
  status?: 'active' | 'in_progress' | 'planning' | 'completed' | 'abandoned';
}

// ============================================================================
// CSRF Token Management
// ============================================================================

/**
 * CSRF token for state-changing requests.
 * Fetched after login and included in POST/PUT/PATCH/DELETE requests.
 */
let csrfToken: string | null = null;

/**
 * Set the CSRF token (called after successful login).
 * @param token - CSRF token from backend
 */
export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

/**
 * Get the current CSRF token.
 * @returns CSRF token or null if not set
 */
export function getCsrfToken(): string | null {
  return csrfToken;
}

/**
 * Clear the CSRF token (called on logout).
 */
export function clearCsrfToken(): void {
  csrfToken = null;
}

// ============================================================================
// API Error Handling
// ============================================================================

export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(status: number, message: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// ============================================================================
// Core API Client
// ============================================================================

/**
 * Internal fetch wrapper with authentication and error handling.
 * Uses HttpOnly cookies for authentication and CSRF tokens for state-changing requests.
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as HeadersInit),
  };

  // Add CSRF token to state-changing requests
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && csrfToken) {
    (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Send cookies automatically for authentication
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Handle 401 - token expired, attempt refresh
    if (response.status === 401) {
      try {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          // Retry original request with refreshed cookies
          return fetchApi<T>(endpoint, options);
        }
      } catch {
        // Refresh failed - will be handled by caller (redirect to login)
        throw new ApiError(
          response.status,
          'Session expired. Please log in again.',
          errorData
        );
      }
    }

    throw new ApiError(
      response.status,
      errorData.detail || errorData.message || `HTTP ${response.status}`,
      errorData
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Session State Management
// ============================================================================

/**
 * Session storage key to track if user has authenticated in this session.
 * Used to distinguish between "never logged in" vs "session expired".
 */
const SESSION_AUTH_FLAG = 'rt_session_auth';

/**
 * Check if user has authenticated in this browser session.
 * @returns true if user has logged in during this session
 */
function hasAuthenticatedThisSession(): boolean {
  return sessionStorage.getItem(SESSION_AUTH_FLAG) === 'true';
}

/**
 * Mark that user has authenticated in this session.
 * Called after successful login.
 */
function markAuthenticatedThisSession(): void {
  sessionStorage.setItem(SESSION_AUTH_FLAG, 'true');
}

/**
 * Clear the authentication flag for this session.
 * Called on logout.
 */
function clearSessionAuthFlag(): void {
  sessionStorage.removeItem(SESSION_AUTH_FLAG);
}
// ============================================================================
// Authentication Functions
// ============================================================================

/**
 * Refresh access token using refresh token cookie.
 * @returns true if successful, false otherwise
 */
async function refreshAccessToken(): Promise<boolean> {
  // Only attempt refresh if user has authenticated in this session
  // Prevents unnecessary refresh calls on fresh sessions (never logged in)
  if (!hasAuthenticatedThisSession()) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Send refresh token cookie
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    // New access/refresh tokens are set via HttpOnly cookies by the backend
    return true;
  } catch {
    return false;
  }
}

/**
 * Login with username and password.
 * Sets HttpOnly cookies and fetches CSRF token on success.
 */
export async function loginApi(username: string, password: string): Promise<AuthSession> {
  // Login sets HttpOnly cookies on the response
  await fetchApi<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  // Fetch current user info (authentication via cookies)
  const user = await fetchApi<User>('/auth/me');

  // Fetch CSRF token for state-changing requests
  const csrfResponse = await fetchApi<{ csrf_token: string }>('/auth/csrf-token');
  setCsrfToken(csrfResponse.csrf_token);
// Mark that user has authenticated in this session
  // This enables automatic token refresh on 401 for future requests
  markAuthenticatedThisSession();

  // Return session info (tokens are in cookies, not stored client-side)
  const session: AuthSession = {
    access_token: '', // Not stored client-side anymore
    refresh_token: '', // Not stored client-side anymore
    token_type: 'bearer',
    expires_in: 1800,
    user,
  };

  return session;
}

/**
 * Register a new user account.
 * Sets HttpOnly cookies and fetches CSRF token on success.
 */
export async function registerApi(data: RegisterRequest): Promise<AuthSession> {
  // Register sets HttpOnly cookies on the response
  await fetchApi<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Fetch current user info (authentication via cookies)
  const user = await fetchApi<User>('/auth/me');

  // Fetch CSRF token for state-changing requests
  const csrfResponse = await fetchApi<{ csrf_token: string }>('/auth/csrf-token');
  setCsrfToken(csrfResponse.csrf_token);

  // Return session info (tokens are in cookies, not stored client-side)
  const session: AuthSession = {
    access_token: '', // Not stored client-side anymore
    refresh_token: '', // Not stored client-side anymore
    token_type: 'bearer',
    expires_in: 1800,
    user,
  };

  return session;
}

/**
 * Logout and revoke tokens.
 * Clears CSRF token on completion.
 */
export async function logoutApi(): Promise<void> {
  try {
    await fetchApi('/auth/revoke', {
      method: 'POST',
      body: JSON.stringify({ reason: 'logout' }),
    });
  } catch {
    // Ignore errors on logout - still clear local state
  }
  clearCsrfToken();
  clearSessionAuthFlag();
}

// ============================================================================
// TanStack Query Hooks - Authentication
// ============================================================================

export function useCurrentUser() {
  return useQuery<User | null, ApiError>({
    queryKey: ['auth', 'me'],
    queryFn: () => fetchApi<User | null>('/auth/me'),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<AuthSession, ApiError, LoginRequest>({
    mutationFn: ({ username, password }) => loginApi(username, password),
    onSuccess: () => {
      // Invalidate the current user query so it refetches with the new session
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation<AuthSession, ApiError, RegisterRequest>({
    mutationFn: registerApi,
    onSuccess: () => {
      // Invalidate the current user query so it refetches with the new session
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      queryClient.clear();
      clearCsrfToken();
    },
  });
}

// ============================================================================
// TanStack Query Hooks - Colonies
// ============================================================================

export function useColonies() {
  return useQuery<Colony[], ApiError>({
    queryKey: ['colonies'],
    queryFn: () => fetchApi<Colony[]>('/colonies'),
    enabled: true, // Auth handled by cookies
  });
}

export function useColony(colonyId: number | string | null) {
  return useQuery<Colony, ApiError>({
    queryKey: ['colonies', colonyId],
    queryFn: () => fetchApi<Colony>(`/colonies/${colonyId}`),
    enabled: !!colonyId, // Only fetch if colonyId is provided
  });
}

export function useColonyStats(colonyId: number | string | null) {
  return useQuery<ColonyStatsBreakdown, ApiError>({
    queryKey: ['colonies', colonyId, 'stats'],
    queryFn: () => fetchApi<ColonyStatsBreakdown>(`/colonies/${colonyId}/stats`),
    enabled: !!colonyId,
  });
}

export function useCreateColony() {
  const queryClient = useQueryClient();

  return useMutation<Colony, ApiError, ColonyCreate>({
    mutationFn: (data) =>
      fetchApi<Colony>('/colonies', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colonies'] });
    },
  });
}

export function useUpdateColony(colonyId: number | string) {
  const queryClient = useQueryClient();

  return useMutation<Colony, ApiError, ColonyUpdate>({
    mutationFn: (data) =>
      fetchApi<Colony>(`/colonies/${colonyId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colonies', colonyId] });
      queryClient.invalidateQueries({ queryKey: ['colonies'] });
    },
  });
}

export function useDeleteColony() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number | string>({
    mutationFn: (colonyId) =>
      fetchApi<void>(`/colonies/${colonyId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, colonyId) => {
      queryClient.invalidateQueries({ queryKey: ['colonies'] });
      queryClient.removeQueries({ queryKey: ['colonies', colonyId] });
    },
  });
}

// ============================================================================
// TanStack Query Hooks - Representatives
// ============================================================================

export function useRepresentatives(colonyId?: number | string) {
  const url = colonyId
    ? `/colonies/${colonyId}/representative`
    : '/representatives';

  return useQuery<Representative[] | Representative, ApiError>({
    queryKey: ['representatives', colonyId || 'all'],
    queryFn: () => fetchApi<Representative[] | Representative>(url),
    enabled: true, // Auth handled by cookies
  });
}

export function useCreateRepresentative() {
  const queryClient = useQueryClient();

  return useMutation<Representative, ApiError, RepresentativeCreate>({
    mutationFn: (data) =>
      fetchApi<Representative>('/representatives', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representatives'] });
    },
  });
}

export function useAssignRepresentative(repId: number | string) {
  const queryClient = useQueryClient();

  return useMutation<Representative, ApiError, { colony_id: number | string }>({
    mutationFn: ({ colony_id }) =>
      fetchApi<Representative>(`/representatives/${repId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ colony_id }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representatives'] });
      queryClient.invalidateQueries({ queryKey: ['colonies'] });
    },
  });
}

export function useUnassignRepresentative() {
  const queryClient = useQueryClient();

  return useMutation<Representative, ApiError, { colony_id: number | string }>({
    mutationFn: ({ colony_id }) =>
      fetchApi<Representative>(`/colonies/${colony_id}/representative`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representatives'] });
      queryClient.invalidateQueries({ queryKey: ['colonies'] });
    },
  });
}

// ============================================================================
// TanStack Query Hooks - Infrastructure
// ============================================================================

export function useInfrastructure(colonyId: number | string | null) {
  return useQuery<Infrastructure[], ApiError>({
    queryKey: ['infrastructure', colonyId],
    queryFn: () =>
      fetchApi<Infrastructure[]>(`/colonies/${colonyId}/infrastructure`),
    enabled: !!colonyId,
  });
}

export function useCreateInfrastructure() {
  const queryClient = useQueryClient();

  return useMutation<Infrastructure, ApiError, InfrastructureCreate>({
    mutationFn: (data) =>
      fetchApi<Infrastructure>(`/colonies/${data.colony_id}/infrastructure`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['infrastructure', variables.colony_id],
      });
      queryClient.invalidateQueries({ queryKey: ['colonies'] });
    },
  });
}

export function useUpdateInfrastructure(infrastructureId: number | string) {
  const queryClient = useQueryClient();

  return useMutation<Infrastructure, ApiError, InfrastructureCreate>({
    mutationFn: (data) =>
      fetchApi<Infrastructure>(`/infrastructure/${infrastructureId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: ['infrastructure', updated.colony_id],
      });
      queryClient.invalidateQueries({ queryKey: ['colonies'] });
    },
  });
}

export function useDeleteInfrastructure() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number | string>({
    mutationFn: (infrastructureId) =>
      fetchApi<void>(`/infrastructure/${infrastructureId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, infrastructureId) => {
      queryClient.invalidateQueries({ queryKey: ['infrastructure'] });
    },
  });
}

// ============================================================================
// TanStack Query Hooks - Support Upgrades
// ============================================================================

export function useSupportUpgrades(colonyId: number | string | null) {
  return useQuery<SupportUpgrade[], ApiError>({
    queryKey: ['upgrades', colonyId],
    queryFn: () =>
      fetchApi<SupportUpgrade[]>(`/colonies/${colonyId}/upgrades`),
    enabled: !!colonyId,
  });
}

export function useCreateSupportUpgrade() {
  const queryClient = useQueryClient();

  return useMutation<SupportUpgrade, ApiError, SupportUpgradeCreate>({
    mutationFn: (data) =>
      fetchApi<SupportUpgrade>(`/colonies/${data.colony_id}/upgrades`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['upgrades', variables.colony_id],
      });
      queryClient.invalidateQueries({ queryKey: ['colonies'] });
    },
  });
}

export function useUpdateSupportUpgrade(upgradeId: number | string) {
  const queryClient = useQueryClient();

  return useMutation<SupportUpgrade, ApiError, SupportUpgradeCreate>({
    mutationFn: (data) =>
      fetchApi<SupportUpgrade>(`/upgrades/${upgradeId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: ['upgrades', updated.colony_id],
      });
      queryClient.invalidateQueries({ queryKey: ['colonies'] });
    },
  });
}

export function useDeleteSupportUpgrade() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number | string>({
    mutationFn: (upgradeId) =>
      fetchApi<void>(`/upgrades/${upgradeId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, upgradeId) => {
      queryClient.invalidateQueries({ queryKey: ['upgrades'] });
    },
  });
}


// ============================================================================
// TanStack Query Hooks - Modifiers
// ============================================================================

export function useModifiers(colonyId: number | string | null) {
  return useQuery<Modifier[], ApiError>({
    queryKey: ['modifiers', colonyId],
    queryFn: () => fetchApi<Modifier[]>(`/colonies/${colonyId}/modifiers`),
    enabled: !!colonyId,
  });
}

export function useCreateModifier() {
  const queryClient = useQueryClient();

  return useMutation<Modifier, ApiError, ModifierCreate>({
    mutationFn: (data) =>
      fetchApi<Modifier>('/modifiers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['modifiers', variables.colony_id],
      });
      queryClient.invalidateQueries({ queryKey: ['colonies'] });
    },
  });
}

export function useUpdateModifier(modifierId: number | string) {
  const queryClient = useQueryClient();

  return useMutation<Modifier, ApiError, ModifierUpdate>({
    mutationFn: (data) =>
      fetchApi<Modifier>(`/modifiers/${modifierId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: ['modifiers', updated.colony_id],
      });
      queryClient.invalidateQueries({ queryKey: ['colonies'] });
    },
  });
}

export function useDeleteModifier() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number | string>({
    mutationFn: (modifierId) =>
      fetchApi<void>(`/modifiers/${modifierId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, modifierId) => {
      queryClient.invalidateQueries({ queryKey: ['modifiers'] });
    },
  });
}

// ============================================================================
// TanStack Query Hooks - Resources
// ============================================================================

export function useResources(colonyId: number | string | null) {
  return useQuery<ColonyResource[], ApiError>({
    queryKey: ['resources', colonyId],
    queryFn: () => fetchApi<ColonyResource[]>(`/colonies/${colonyId}/resources`),
    enabled: !!colonyId,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation<ColonyResource, ApiError, Omit<ColonyResource, 'id'>>({
    mutationFn: (data) =>
      fetchApi<ColonyResource>('/resources', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['resources', variables.colony_id],
      });
    },
  });
}

export function useUpdateResource(resourceId: number | string) {
  const queryClient = useQueryClient();

  return useMutation<ColonyResource, ApiError, Omit<ColonyResource, 'id'>>({
    mutationFn: (data) =>
      fetchApi<ColonyResource>(`/resources/${resourceId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: ['resources', updated.colony_id],
      });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number | string>({
    mutationFn: (resourceId) =>
      fetchApi<void>(`/resources/${resourceId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, resourceId) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}

// ============================================================================
// TanStack Query Hooks - Development Plans
// ============================================================================

export function useDevelopmentPlans(colonyId: number | string | null) {
  return useQuery<DevelopmentPlan[], ApiError>({
    queryKey: ['plans', colonyId],
    queryFn: () =>
      fetchApi<DevelopmentPlan[]>(`/colonies/${colonyId}/development-plans`),
    enabled: !!colonyId,
  });
}

export function useCreateDevelopmentPlan() {
  const queryClient = useQueryClient();

  return useMutation<DevelopmentPlan, ApiError, DevelopmentPlanCreate>({
    mutationFn: (data) =>
      fetchApi<DevelopmentPlan>('/development-plans', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['plans', variables.colony_id],
      });
    },
  });
}

export function useUpdateDevelopmentPlan(planId: number | string) {
  const queryClient = useQueryClient();

  return useMutation<DevelopmentPlan, ApiError, Partial<DevelopmentPlanCreate>>({
    mutationFn: (data) =>
      fetchApi<DevelopmentPlan>(`/development-plans/${planId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: ['plans', updated.colony_id],
      });
    },
  });
}

export function useDeleteDevelopmentPlan() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, number | string>({
    mutationFn: (planId) =>
      fetchApi<void>(`/development-plans/${planId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export function useInstallDevelopmentPlan() {
  const queryClient = useQueryClient();

  return useMutation<
    DevelopmentPlan,
    ApiError,
    { planId: number | string; install_as_infrastructure?: boolean }
  >({
    mutationFn: ({ planId, install_as_infrastructure }) =>
      fetchApi<DevelopmentPlan>(`/development-plans/${planId}/install`, {
        method: 'POST',
        body: JSON.stringify({ install_as_infrastructure }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['infrastructure'] });
      queryClient.invalidateQueries({ queryKey: ['upgrades'] });
    },
  });
}

// ============================================================================
// TanStack Query Hooks - Config (Rule Tables)
// ============================================================================

export function useColonyTypes() {
  return useQuery<ColonyType[], ApiError>({
    queryKey: ['config', 'colony-types'],
    queryFn: () => fetchApi<ColonyType[]>('/config/colony-types'),
  });
}

export function useInfrastructureTypes() {
  return useQuery<
    { type: string; name: string; description: string; effects: Record<string, number> }[],
    ApiError
  >({
    queryKey: ['config', 'infrastructure-types'],
    queryFn: () =>
      fetchApi<
        { type: string; name: string; description: string; effects: Record<string, number> }[]
      >('/config/infrastructure-types'),
  });
}

export function useSupportUpgradeTypes() {
  return useQuery<
    { type: string; name: string; description: string; stat_options: ModifierStat[] }[],
    ApiError
  >({
    queryKey: ['config', 'support-upgrades'],
    queryFn: () =>
      fetchApi<
        { type: string; name: string; description: string; stat_options: ModifierStat[] }[]
      >('/config/support-upgrades'),
  });
}

export function useRepresentativeTypes() {
  return useQuery<
    { type: string; name: string; description: string }[],
    ApiError
  >({
    queryKey: ['config', 'representative-types'],
    queryFn: () =>
      fetchApi<{ type: string; name: string; description: string }[]>(
        '/config/representative-types'
      ),
  });
}

// ============================================================================
// Legacy API Fetch (for backward compatibility during migration)
// Returns Response object for compatibility with existing code
// New code should use TanStack Query hooks instead
// ============================================================================

export const apiFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  // Determine if this is a full URL or just a path
  // API_BASE_URL already includes '/api/v1', so we need to avoid duplicating it
  let normalizedUrl = url;
  
  // Remove leading '/api/v1' if present, since API_BASE_URL already includes it
  if (normalizedUrl.startsWith('/api/v1')) {
    normalizedUrl = normalizedUrl.substring(8); // Remove '/api/v1'
  }
  
  // Ensure the path starts with '/'
  if (!normalizedUrl.startsWith('/')) {
    normalizedUrl = '/' + normalizedUrl;
  }
  
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${normalizedUrl}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options?.headers as HeadersInit),
  };

  // Add CSRF token to state-changing requests
  const method = (options?.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && csrfToken) {
    (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers,
    credentials: 'include', // Send cookies automatically for authentication
  });

  // Handle 401 - token expired, attempt refresh
  if (!response.ok && response.status === 401) {
    try {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry original request with refreshed cookies
        return apiFetch(url, options);
      }
    } catch {
      // Refresh failed - will be handled by caller
      clearCsrfToken();
    }
  }

  return response;
};
