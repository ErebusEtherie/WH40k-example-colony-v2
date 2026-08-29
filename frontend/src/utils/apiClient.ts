/**
 * API Client for WH40k Colony Manager REST Backend
 * Seamlessly interfaces with `/api/v1` endpoints with fallback to local state if offline.
 * 
 * Security: Uses httpOnly cookies for token storage (set by backend).
 * Tokens are automatically refreshed on 401 responses.
 */

import { Colony, Representative, ModifierItem, SupportUpgradeItem, DevelopmentPlanItem, LoginResponse, UserResponse, RefreshResponse } from '../types';

const API_BASE = '/api/v1';
const AUTH_BASE = '/api/v1/auth';

// Token refresh state - Promise-based to handle race conditions properly
let refreshPromise: Promise<string> | null = null;

export class ApiClient {
  // No localStorage for tokens - httpOnly cookies handle storage
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    // Tokens are stored in httpOnly cookies by backend
    // This is kept for API header compatibility if needed
  }

  getToken(): string | null {
    return this.token;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Internal fetch with automatic token refresh on 401
   * Uses Promise-based queue to handle race conditions properly
   */
  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers as Record<string, string>),
      },
      credentials: 'include', // Include httpOnly cookies
    });

    // Handle 401 - attempt token refresh
    if (response.status === 401 && !url.includes('/auth/refresh')) {
      // Use Promise-based approach to handle concurrent 401s
      if (!refreshPromise) {
        refreshPromise = this.refreshToken()
          .then(refreshResponse => {
            const newToken = refreshResponse.access_token;
            this.setToken(newToken);
            return newToken;
          })
          .catch((_error) => {
            // Refresh failed - clear token
            this.setToken(null);
            throw new Error('Session expired');
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      try {
        await refreshPromise;
      } catch {
        // Refresh failed - redirect to login using relative path
        // Use relative path to work with any base URL deployment
        window.location.href = 'login';
        throw new Error('Session expired');
      }

      // Retry original request with new token
      return await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...(options.headers as Record<string, string>),
        },
        credentials: 'include',
      });
    }

    return response;
  }

  // ==================== AUTH METHODS ====================

  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${AUTH_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    this.setToken(data.access_token);
    return data;
  }

  async register(username: string, email: string, password: string, role?: string): Promise<UserResponse> {
    const response = await fetch(`${AUTH_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, role }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(error.detail || 'Registration failed');
    }

    return await response.json();
  }

  async logout(): Promise<void> {
    try {
      await this.fetchWithAuth(`${AUTH_BASE}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'logout' }),
      });
    } catch {
      // Ignore errors - still clear local state
    } finally {
      this.setToken(null);
    }
  }

  async refreshToken(): Promise<RefreshResponse> {
    const response = await fetch(`${AUTH_BASE}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: '' }), // Token comes from cookie
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return await response.json();
  }

  async getCurrentUser(): Promise<UserResponse> {
    const response = await this.fetchWithAuth(`${AUTH_BASE}/me`);
    if (!response.ok) {
      throw new Error('Failed to get current user');
    }
    return await response.json();
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await this.fetchWithAuth(`${AUTH_BASE}/change-password`, {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Password change failed' }));
      throw new Error(error.detail || 'Password change failed');
    }
  }

  // ==================== EXISTING METHODS (updated to use fetchWithAuth) ====================

  // Health
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch('/api/health');
      return res.ok;
    } catch {
      return false;
    }
  }

  // Colonies
  async getColonies(): Promise<any[]> {
    const res = await this.fetchWithAuth(`${API_BASE}/colonies`);
    if (!res.ok) throw new Error('Failed to fetch colonies');
    const data = await res.json();
    return data.items || [];
  }

  async getColony(id: string | number): Promise<any> {
    const res = await this.fetchWithAuth(`${API_BASE}/colonies/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch colony ${id}`);
    return await res.json();
  }

  async createColony(payload: Partial<Colony>): Promise<any> {
    const res = await this.fetchWithAuth(`${API_BASE}/colonies`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create colony');
    return await res.json();
  }

  async updateColony(id: string | number, payload: Partial<Colony>): Promise<any> {
    const res = await this.fetchWithAuth(`${API_BASE}/colonies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to update colony ${id}`);
    return await res.json();
  }

  async deleteColony(id: string | number): Promise<void> {
    const res = await this.fetchWithAuth(`${API_BASE}/colonies/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete colony ${id}`);
  }

  async advanceColonyAge(id: string | number, days: number): Promise<any> {
    const res = await this.fetchWithAuth(`${API_BASE}/colonies/${id}/age?age_days=${days}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to advance colony age');
    return await res.json();
  }

  // Representatives
  async getRepresentatives(): Promise<Representative[]> {
    const res = await this.fetchWithAuth(`${API_BASE}/representatives`);
    if (!res.ok) throw new Error('Failed to fetch representatives');
    const data = await res.json();
    return data.items || data || [];
  }

  async createRepresentative(payload: Partial<Representative>): Promise<Representative> {
    const res = await this.fetchWithAuth(`${API_BASE}/representatives`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create representative');
    return await res.json();
  }

  async updateRepresentative(id: string | number, payload: Partial<Representative>): Promise<Representative> {
    const res = await this.fetchWithAuth(`${API_BASE}/representatives/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to update representative ${id}`);
    return await res.json();
  }

  async deleteRepresentative(id: string | number): Promise<void> {
    const res = await this.fetchWithAuth(`${API_BASE}/representatives/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete representative ${id}`);
  }

  async assignRepresentative(repId: string | number, colonyId: string | number | null): Promise<any> {
    const res = await this.fetchWithAuth(`${API_BASE}/representatives/${repId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ colony_id: colonyId ? Number(colonyId) : null, colonyId }),
    });
    if (!res.ok) throw new Error('Failed to assign representative');
    return await res.json();
  }

  // Infrastructure & Support Upgrades
  async updateInfrastructure(infraId: string | number, state: string, notes?: string): Promise<any> {
    const res = await this.fetchWithAuth(`${API_BASE}/infrastructure/${infraId}`, {
      method: 'PUT',
      body: JSON.stringify({ state, notes }),
    });
    if (!res.ok) throw new Error('Failed to update infrastructure');
    return await res.json();
  }

  async createSupportUpgrade(colonyId: string | number, payload: Partial<SupportUpgradeItem>): Promise<any> {
    const res = await this.fetchWithAuth(`${API_BASE}/support-upgrades`, {
      method: 'POST',
      body: JSON.stringify({
        colony_id: Number(colonyId),
        upgrade_type: payload.type,
        custom_stat_choice: payload.chosenStat || null,
        status: payload.status || 'working',
        notes: payload.notes || '',
      }),
    });
    if (!res.ok) throw new Error('Failed to create support upgrade');
    return await res.json();
  }

  async deleteSupportUpgrade(upgradeId: string | number): Promise<void> {
    const res = await this.fetchWithAuth(`${API_BASE}/support-upgrades/${upgradeId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete support upgrade');
  }

  // Roll Status & Events
  async getRollStatus(colonyId: string | number): Promise<any> {
    const res = await this.fetchWithAuth(`${API_BASE}/colonies/${colonyId}/roll-status`);
    if (!res.ok) throw new Error('Failed to fetch roll status');
    return await res.json();
  }

  async getColonyEvents(colonyId: string | number): Promise<any[]> {
    const res = await this.fetchWithAuth(`${API_BASE}/colonies/${colonyId}/events`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.events || [];
  }

  async createColonyEvent(colonyId: string | number, name: string, description?: string): Promise<any> {
    const res = await this.fetchWithAuth(`${API_BASE}/colonies/${colonyId}/events`, {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) throw new Error('Failed to create event');
    return await res.json();
  }

  // Modifiers
  async getModifiers(colonyId: string | number): Promise<ModifierItem[]> {
    const res = await this.fetchWithAuth(`${API_BASE}/colonies/${colonyId}/modifiers`);
    if (!res.ok) throw new Error('Failed to fetch modifiers');
    const data = await res.json();
    return data.items || data || [];
  }

  async addModifier(colonyId: string | number, modifier: Partial<ModifierItem>): Promise<any> {
    const res = await this.fetchWithAuth(`${API_BASE}/colonies/${colonyId}/modifiers`, {
      method: 'POST',
      body: JSON.stringify({
        modifier_source_type: modifier.source || 'custom',
        modifier_category: modifier.category || 'custom',
        modifier_stat: modifier.stat,
        modifier_value: modifier.value,
        modifier_description: modifier.name,
      }),
    });
    if (!res.ok) throw new Error('Failed to add modifier');
    return await res.json();
  }

  async deleteModifier(colonyId: string | number, modifierId: string | number): Promise<void> {
    const res = await this.fetchWithAuth(`${API_BASE}/colonies/${colonyId}/modifiers/${modifierId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete modifier');
  }

  // Development Plans
  async createDevelopmentPlan(colonyId: string | number, plan: Partial<DevelopmentPlanItem>): Promise<any> {
    const res = await this.fetchWithAuth(`${API_BASE}/development-plans`, {
      method: 'POST',
      body: JSON.stringify({
        colony_id: Number(colonyId),
        upgrade_type: plan.category || 'support_upgrade',
        target_type: plan.type,
        target_name: plan.name,
        priority: plan.priority,
        status: plan.status,
        description: plan.description,
        progress: plan.progress,
      }),
    });
    if (!res.ok) throw new Error('Failed to create plan');
    return await res.json();
  }

  async promoteDevelopmentPlan(planId: string | number): Promise<any> {
    const res = await this.fetchWithAuth(`${API_BASE}/development-plans/${planId}/promote`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to promote development plan');
    return await res.json();
  }

  // Export / Import
  async exportColony(colonyId: string | number): Promise<any> {
    const res = await this.fetchWithAuth(`${API_BASE}/colonies/${colonyId}/export`);
    if (!res.ok) throw new Error('Failed to export colony');
    return await res.json();
  }

  async importColony(payload: any): Promise<any> {
    const res = await this.fetchWithAuth(`${API_BASE}/colonies/import`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to import colony');
    return await res.json();
  }

  // Audit Logs
  async getAuditLogs(colonyId?: string | number): Promise<any[]> {
    const url = colonyId ? `${API_BASE}/audit-logs?colony_id=${colonyId}` : `${API_BASE}/audit-logs`;
    const res = await this.fetchWithAuth(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.logs || [];
  }
}

// Export singleton instance for use in hooks
export const apiClient = new ApiClient();
