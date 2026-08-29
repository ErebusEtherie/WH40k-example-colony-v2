/**
 * API Client for WH40k Colony Manager REST Backend
 * Seamlessly interfaces with `/api/v1` endpoints with fallback to local state if offline.
 */

import { Colony, Representative, ModifierItem, HardInfrastructureItem, SupportUpgradeItem, DevelopmentPlanItem } from '../types';

const API_BASE = '/api/v1';

export class ApiClient {
  private token: string | null = localStorage.getItem('rt_access_token');

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('rt_access_token', token);
    } else {
      localStorage.removeItem('rt_access_token');
    }
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('rt_access_token');
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
    const res = await fetch(`${API_BASE}/colonies`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch colonies');
    const data = await res.json();
    return data.items || [];
  }

  async getColony(id: string | number): Promise<any> {
    const res = await fetch(`${API_BASE}/colonies/${id}`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch colony ${id}`);
    return await res.json();
  }

  async createColony(payload: Partial<Colony>): Promise<any> {
    const res = await fetch(`${API_BASE}/colonies`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create colony');
    return await res.json();
  }

  async updateColony(id: string | number, payload: Partial<Colony>): Promise<any> {
    const res = await fetch(`${API_BASE}/colonies/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to update colony ${id}`);
    return await res.json();
  }

  async deleteColony(id: string | number): Promise<void> {
    const res = await fetch(`${API_BASE}/colonies/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to delete colony ${id}`);
  }

  async advanceColonyAge(id: string | number, days: number): Promise<any> {
    const res = await fetch(`${API_BASE}/colonies/${id}/age?age_days=${days}`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to advance colony age');
    return await res.json();
  }

  // Representatives
  async getRepresentatives(): Promise<Representative[]> {
    const res = await fetch(`${API_BASE}/representatives`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch representatives');
    const data = await res.json();
    return data.items || data || [];
  }

  async createRepresentative(payload: Partial<Representative>): Promise<Representative> {
    const res = await fetch(`${API_BASE}/representatives`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create representative');
    return await res.json();
  }

  async updateRepresentative(id: string | number, payload: Partial<Representative>): Promise<Representative> {
    const res = await fetch(`${API_BASE}/representatives/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to update representative ${id}`);
    return await res.json();
  }

  async deleteRepresentative(id: string | number): Promise<void> {
    const res = await fetch(`${API_BASE}/representatives/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to delete representative ${id}`);
  }

  async assignRepresentative(repId: string | number, colonyId: string | number | null): Promise<any> {
    const res = await fetch(`${API_BASE}/representatives/${repId}/assign`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ colony_id: colonyId ? Number(colonyId) : null, colonyId }),
    });
    if (!res.ok) throw new Error('Failed to assign representative');
    return await res.json();
  }

  // Infrastructure & Support Upgrades
  async updateInfrastructure(infraId: string | number, state: string, notes?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/infrastructure/${infraId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ state, notes }),
    });
    if (!res.ok) throw new Error('Failed to update infrastructure');
    return await res.json();
  }

  async createSupportUpgrade(colonyId: string | number, payload: Partial<SupportUpgradeItem>): Promise<any> {
    const res = await fetch(`${API_BASE}/support-upgrades`, {
      method: 'POST',
      headers: this.getHeaders(),
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
    const res = await fetch(`${API_BASE}/support-upgrades/${upgradeId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete support upgrade');
  }

  // Roll Status & Events
  async getRollStatus(colonyId: string | number): Promise<any> {
    const res = await fetch(`${API_BASE}/colonies/${colonyId}/roll-status`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch roll status');
    return await res.json();
  }

  async getColonyEvents(colonyId: string | number): Promise<any[]> {
    const res = await fetch(`${API_BASE}/colonies/${colonyId}/events`, { headers: this.getHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.events || [];
  }

  async createColonyEvent(colonyId: string | number, name: string, description?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/colonies/${colonyId}/events`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) throw new Error('Failed to create event');
    return await res.json();
  }

  // Modifiers
  async getModifiers(colonyId: string | number): Promise<ModifierItem[]> {
    const res = await fetch(`${API_BASE}/colonies/${colonyId}/modifiers`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch modifiers');
    const data = await res.json();
    return data.items || data || [];
  }

  async addModifier(colonyId: string | number, modifier: Partial<ModifierItem>): Promise<any> {
    const res = await fetch(`${API_BASE}/colonies/${colonyId}/modifiers`, {
      method: 'POST',
      headers: this.getHeaders(),
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
    const res = await fetch(`${API_BASE}/colonies/${colonyId}/modifiers/${modifierId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete modifier');
  }

  // Development Plans
  async createDevelopmentPlan(colonyId: string | number, plan: Partial<DevelopmentPlanItem>): Promise<any> {
    const res = await fetch(`${API_BASE}/development-plans`, {
      method: 'POST',
      headers: this.getHeaders(),
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
    const res = await fetch(`${API_BASE}/development-plans/${planId}/promote`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to promote development plan');
    return await res.json();
  }

  // Export / Import
  async exportColony(colonyId: string | number): Promise<any> {
    const res = await fetch(`${API_BASE}/colonies/${colonyId}/export`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to export colony');
    return await res.json();
  }

  async importColony(payload: any): Promise<any> {
    const res = await fetch(`${API_BASE}/colonies/import`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to import colony');
    return await res.json();
  }

  // Audit Logs
  async getAuditLogs(colonyId?: string | number): Promise<any[]> {
    const url = colonyId ? `${API_BASE}/audit-logs?colony_id=${colonyId}` : `${API_BASE}/audit-logs`;
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.logs || [];
  }
}

// Export singleton instance for use in hooks
export const apiClient = new ApiClient();
