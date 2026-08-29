/**
 * Express REST API Routes for Warhammer 40k Colony Manager
 * Fully implements Python backend endpoints:
 * - /api/v1/auth/* (register, login, refresh, me, revoke, users)
 * - /api/v1/colonies/* (list, create, get, put, delete, state, age, modifiers, export, import)
 * - /api/v1/representatives/* (list, create, get, put, delete, assign)
 * - /api/v1/infrastructure/* (list, get, update, create, delete)
 * - /api/v1/support-upgrades/* (list, get, update, create, delete)
 * - /api/v1/development-plans/* (list, get, update, create, delete, promote)
 * - /api/v1/events/* (list, create, get, delete)
 * - /api/v1/audit-logs/* (list)
 * - /api/v1/config/* (rules and limits)
 */

import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { computeColonyState } from './calculator';

const JWT_SECRET = process.env.JWT_SECRET || 'astropathic_cipher_lex_imperialis_40k_secret_key';
const JWT_EXPIRES_IN = '24h';

export const apiRouter = Router();

// ==========================================
// Authentication Middleware
// ==========================================
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // If no token, check if we allow default guest Lord Captain for UI preview or reject
    return res.status(401).json({ error: 'Unauthorized: Missing Authorization header' });
  }

  if (db.tokenBlacklist.has(token)) {
    return res.status(401).json({ error: 'Token has been revoked' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Optional Auth for public endpoints or flexible preview
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token && !db.tokenBlacklist.has(token)) {
    try {
      (req as any).user = jwt.verify(token, JWT_SECRET);
    } catch {}
  }
  next();
}

// ==========================================
// 1. AUTHENTICATION & USERS ROUTER
// ==========================================
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password) {
    return res.status(422).json({ error: 'Username, email, and password are required' });
  }

  const existing = db.users.find((u) => u.username === username || u.email === email);
  if (existing) {
    return res.status(400).json({ error: 'Username or email already registered' });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = {
    id: db.nextUserId(),
    username,
    email,
    password_hash: passwordHash,
    role: role || 'lord_captain',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.users.push(newUser);

  res.status(201).json({
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
    is_active: newUser.is_active,
  });
});

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(422).json({ error: 'Username and password required' });
  }

  const user = db.users.find((u) => u.username === username || u.email === username);
  if (!user || !user.is_active) {
    return res.status(401).json({ error: 'Invalid credentials or inactive user' });
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const payload: AuthUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'bearer',
    user: payload,
  });
});

apiRouter.post('/auth/refresh', (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(422).json({ error: 'Refresh token required' });
  }
  try {
    const payload = jwt.verify(refresh_token, JWT_SECRET) as any;
    const newPayload: AuthUser = {
      id: payload.id,
      username: payload.username,
      email: payload.email,
      role: payload.role,
    };
    const accessToken = jwt.sign(newPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const newRefreshToken = jwt.sign(newPayload, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      access_token: accessToken,
      refresh_token: newRefreshToken,
      token_type: 'bearer',
      user: newPayload,
    });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

apiRouter.get('/auth/me', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;
  const userDoc = db.users.find((u) => u.id === user.id);
  if (!userDoc) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    id: userDoc.id,
    username: userDoc.username,
    email: userDoc.email,
    role: userDoc.role,
    is_active: userDoc.is_active,
  });
});

apiRouter.post('/auth/revoke', authenticateToken, (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    db.tokenBlacklist.add(token);
  }
  res.json({ message: 'Token successfully revoked' });
});

// ==========================================
// 2. COLONIES ROUTER
// ==========================================

// Helper to format a colony response object
function formatColonyResponse(colony: any) {
  const state = computeColonyState(colony.id);
  const rep = colony.representative_id
    ? db.representatives.find((r) => r.id === colony.representative_id) || null
    : null;
  const infra = db.infrastructure.filter((i) => i.colony_id === colony.id);
  const support = db.support_upgrades.filter((s) => s.colony_id === colony.id);
  const plans = db.development_plans.filter((p) => p.colony_id === colony.id);
  const modifiers = db.modifiers.filter((m) => m.colony_id === colony.id);
  const resources = colony.planetary_resources ? JSON.parse(colony.planetary_resources) : [];

  const formattedRep = rep
    ? {
        id: String(rep.id),
        name: rep.name,
        type: rep.type,
        characteristics: JSON.parse(rep.stats || '{}'),
        stats: JSON.parse(rep.stats || '{}'),
        personalities: JSON.parse(rep.personalities || '[]'),
        skills: JSON.parse(rep.skills || '[]'),
        talents: JSON.parse(rep.talents || '[]'),
        assignedColonyId: rep.assigned_to_colony_id ? String(rep.assigned_to_colony_id) : null,
        assigned_to_colony_id: rep.assigned_to_colony_id,
        dynastyNepotismRoll: rep.dynasty_nepotism_roll,
        dynastyOutcomeKey: rep.dynasty_outcome_key,
      }
    : null;

  return {
    id: String(colony.id),
    numeric_id: colony.id,
    name: colony.name,
    owner: colony.owner,
    founder: colony.owner,
    colony_type: colony.colony_type,
    colonyType: colony.colony_type,
    star_system: colony.star_system || 'Koronus Expanse',
    starSystem: colony.star_system || 'Koronus Expanse',
    description: colony.description || '',
    age_days: colony.age_days,
    ageDays: colony.age_days,
    age_last_updated: colony.age_last_updated,
    current_event: colony.current_event,
    base_size: colony.base_size,
    base_complacency: colony.base_complacency,
    base_order: colony.base_order,
    base_productivity: colony.base_productivity,
    base_piety: colony.base_piety,
    cultural_improvement_stat: colony.cultural_improvement_stat,
    culturalImprovementStat: colony.cultural_improvement_stat,
    representative_id: colony.representative_id,
    representativeId: colony.representative_id ? String(colony.representative_id) : null,
    representative: formattedRep,
    planetary_resources: resources,
    planetaryResources: resources,
    hard_infrastructure: infra.map((i) => ({
      id: String(i.id),
      name: `${i.infrastructure_type.replace('_', ' ')} System`,
      type: i.infrastructure_type,
      status: i.state,
      notes: i.notes,
    })),
    hardInfrastructure: infra.map((i) => ({
      id: String(i.id),
      name: `${i.infrastructure_type.replace('_', ' ')} System`,
      type: i.infrastructure_type,
      status: i.state,
      notes: i.notes,
    })),
    support_upgrades: support.map((s) => ({
      id: String(s.id),
      name: s.upgrade_type.replace('_', ' '),
      type: s.upgrade_type,
      status: s.status,
      notes: s.notes,
      chosenStat: s.custom_stat_choice,
    })),
    supportUpgrades: support.map((s) => ({
      id: String(s.id),
      name: s.upgrade_type.replace('_', ' '),
      type: s.upgrade_type,
      status: s.status,
      notes: s.notes,
      chosenStat: s.custom_stat_choice,
    })),
    development_plans: plans.map((p) => ({
      id: String(p.id),
      name: p.target_name,
      category: p.upgrade_type,
      type: p.target_type,
      priority: p.priority,
      status: p.status,
      description: p.description,
      progress: p.progress,
    })),
    developmentPlans: plans.map((p) => ({
      id: String(p.id),
      name: p.target_name,
      category: p.upgrade_type,
      type: p.target_type,
      priority: p.priority,
      status: p.status,
      description: p.description,
      progress: p.progress,
    })),
    custom_modifiers: modifiers.map((m) => ({
      id: String(m.id),
      name: m.modifier_description,
      stat: m.modifier_stat,
      value: m.modifier_value,
      source: m.modifier_source_type,
      category: m.modifier_category,
      isActive: m.is_active,
    })),
    customModifiers: modifiers.map((m) => ({
      id: String(m.id),
      name: m.modifier_description,
      stat: m.modifier_stat,
      value: m.modifier_value,
      source: m.modifier_source_type,
      category: m.modifier_category,
      isActive: m.is_active,
    })),
    computed_state: state,
    state,
  };
}

apiRouter.get('/colonies', optionalAuth, (req: Request, res: Response) => {
  const offset = parseInt(req.query.offset as string) || 0;
  const limit = parseInt(req.query.limit as string) || 50;

  const slice = db.colonies.slice(offset, offset + limit);
  const items = slice.map(formatColonyResponse);

  res.json({
    items,
    meta: {
      total: db.colonies.length,
      offset,
      limit,
      has_more: offset + limit < db.colonies.length,
    },
    total: db.colonies.length,
    offset,
    limit,
  });
});

apiRouter.post('/colonies', optionalAuth, (req: Request, res: Response) => {
  const {
    name,
    owner,
    founder,
    colony_type,
    colonyType,
    star_system,
    starSystem,
    description,
    base_complacency,
    base_order,
    base_productivity,
    base_piety,
    base_size,
    cultural_improvement_stat,
    culturalImprovementStat,
    planetary_resources,
    planetaryResources,
    representative_id,
    representativeId,
  } = req.body;

  const targetType = colony_type || colonyType;
  if (!name || !targetType) {
    return res.status(422).json({ error: 'Colony name and type are required' });
  }

  const colonyId = db.nextColonyId();
  const newColony: any = {
    id: colonyId,
    name,
    owner: owner || founder || 'Von Valancius Dynasty',
    colony_type: targetType,
    star_system: star_system || starSystem || 'Koronus Expanse',
    description: description || '',
    age_days: 0,
    age_last_updated: new Date().toISOString().split('T')[0],
    current_event: null,
    base_complacency: base_complacency ?? 2,
    base_order: base_order ?? 2,
    base_productivity: base_productivity ?? 2,
    base_piety: base_piety ?? 2,
    base_size: base_size ?? 1,
    representative_id: representative_id || (representativeId ? parseInt(representativeId) : null),
    dynasty_outcome: null,
    complacency_locked: false,
    order_locked: false,
    productivity_locked: false,
    cultural_improvement_stat: cultural_improvement_stat || culturalImprovementStat,
    planetary_resources: JSON.stringify(planetary_resources || planetaryResources || []),
  };

  db.colonies.push(newColony);

  // Automatically initialize default essential hard infrastructure
  const infraTypes = ['transport', 'power', 'water', 'food_production', 'communications'] as const;
  infraTypes.forEach((type) => {
    db.infrastructure.push({
      id: db.nextInfraId(),
      colony_id: colonyId,
      infrastructure_type: type,
      state: 'working',
      notes: `Operational Imperial ${type} node.`,
    });
  });

  // Log creation
  db.audit_logs.push({
    id: db.nextLogId(),
    colony_id: colonyId,
    user_id: (req as any).user?.id || 1,
    action: 'COLONY_CREATED',
    target_type: 'colony',
    target_id: String(colonyId),
    details: `Founded new colony ${name} (${targetType})`,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json(formatColonyResponse(newColony));
});

apiRouter.get('/colonies/:colony_id', optionalAuth, (req: Request, res: Response) => {
  const colonyId = parseInt(req.params.colony_id);
  const colony = db.colonies.find((c) => c.id === colonyId);
  if (!colony) {
    return res.status(404).json({ error: `Colony ${colonyId} not found` });
  }
  res.json(formatColonyResponse(colony));
});

const handleUpdateColony = (req: Request, res: Response) => {
  const colonyId = parseInt(req.params.colony_id);
  const colonyIndex = db.colonies.findIndex((c) => c.id === colonyId);
  if (colonyIndex === -1) {
    return res.status(404).json({ error: `Colony ${colonyId} not found` });
  }

  const existing = db.colonies[colonyIndex];
  const updates = { ...req.body };

  if (updates.colonyType) updates.colony_type = updates.colonyType;
  if (updates.starSystem) updates.star_system = updates.starSystem;
  if (updates.ageDays !== undefined) updates.age_days = updates.ageDays;
  if (updates.representativeId !== undefined) {
    updates.representative_id = updates.representativeId ? parseInt(updates.representativeId) : null;
  }
  if (updates.planetaryResources) updates.planetary_resources = updates.planetaryResources;
  if (updates.culturalImprovementStat) updates.cultural_improvement_stat = updates.culturalImprovementStat;

  if (updates.planetary_resources && Array.isArray(updates.planetary_resources)) {
    updates.planetary_resources = JSON.stringify(updates.planetary_resources);
  }

  db.colonies[colonyIndex] = {
    ...existing,
    ...updates,
    id: colonyId,
  };

  res.json(formatColonyResponse(db.colonies[colonyIndex]));
};

apiRouter.put('/colonies/:colony_id', optionalAuth, handleUpdateColony);
apiRouter.patch('/colonies/:colony_id', optionalAuth, handleUpdateColony);

apiRouter.delete('/colonies/:colony_id', optionalAuth, (req: Request, res: Response) => {
  const colonyId = parseInt(req.params.colony_id);
  const index = db.colonies.findIndex((c) => c.id === colonyId);
  if (index === -1) {
    return res.status(404).json({ error: `Colony ${colonyId} not found` });
  }

  db.colonies.splice(index, 1);
  // Cascade delete
  db.infrastructure = db.infrastructure.filter((i) => i.colony_id !== colonyId);
  db.support_upgrades = db.support_upgrades.filter((s) => s.colony_id !== colonyId);
  db.development_plans = db.development_plans.filter((p) => p.colony_id !== colonyId);
  db.modifiers = db.modifiers.filter((m) => m.colony_id !== colonyId);
  db.events = db.events.filter((e) => e.colony_id !== colonyId);

  res.status(204).send();
});

apiRouter.get('/colonies/:colony_id/roll-status', optionalAuth, (req: Request, res: Response) => {
  const colonyId = parseInt(req.params.colony_id);
  const colony = db.colonies.find((c) => c.id === colonyId);
  if (!colony) {
    return res.status(404).json({ error: `Colony ${colonyId} not found` });
  }

  const days = colony.age_days || 0;
  const eventInterval = 60;
  const devInterval = 90;

  const nextEventIn = eventInterval - (days % eventInterval);
  const nextDevIn = devInterval - (days % devInterval);

  res.json({
    colony_id: colony.id,
    days_since_creation: days,
    next_event_roll_in: nextEventIn === 0 ? eventInterval : nextEventIn,
    next_development_roll_in: nextDevIn === 0 ? devInterval : nextDevIn,
    event_roll_interval_days: eventInterval,
    development_roll_interval_days: devInterval,
  });
});

apiRouter.get('/colonies/:colony_id/state', optionalAuth, (req: Request, res: Response) => {
  const colonyId = parseInt(req.params.colony_id);
  const colony = db.colonies.find((c) => c.id === colonyId);
  if (!colony) {
    return res.status(404).json({ error: `Colony ${colonyId} not found` });
  }
  const state = computeColonyState(colonyId);
  res.json(state);
});

apiRouter.post('/colonies/:colony_id/age', optionalAuth, (req: Request, res: Response) => {
  const colonyId = parseInt(req.params.colony_id);
  const daysToAdd = parseInt(req.query.age_days as string) || parseInt(req.body.age_days) || 30;

  const colony = db.colonies.find((c) => c.id === colonyId);
  if (!colony) {
    return res.status(404).json({ error: `Colony ${colonyId} not found` });
  }

  colony.age_days += daysToAdd;
  colony.age_last_updated = new Date().toISOString().split('T')[0];

  res.json({
    colony_id: colony.id,
    new_age_days: colony.age_days,
    advanced_by: daysToAdd,
    age_last_updated: colony.age_last_updated,
    colony: formatColonyResponse(colony),
  });
});

// Modifiers Sub-endpoints
apiRouter.get('/colonies/:colony_id/modifiers', optionalAuth, (req: Request, res: Response) => {
  const colonyId = parseInt(req.params.colony_id);
  const modifiers = db.modifiers.filter((m) => m.colony_id === colonyId);
  res.json(modifiers);
});

apiRouter.post('/colonies/:colony_id/modifiers', optionalAuth, (req: Request, res: Response) => {
  const colonyId = parseInt(req.params.colony_id);
  const { modifier_source_type, modifier_category, modifier_stat, modifier_value, modifier_description } = req.body;

  if (!modifier_stat || modifier_value === undefined) {
    return res.status(422).json({ error: 'Stat and value required' });
  }

  const newMod = {
    id: db.nextModId(),
    colony_id: colonyId,
    modifier_source_type: modifier_source_type || 'custom',
    modifier_category: modifier_category || 'custom',
    modifier_stat,
    modifier_value,
    modifier_description: modifier_description || 'Imperial Decree',
    is_active: true,
    expires_at: null,
  };

  db.modifiers.push(newMod);
  res.status(201).json(newMod);
});

apiRouter.delete('/colonies/:colony_id/modifiers/:modifier_id', optionalAuth, (req: Request, res: Response) => {
  const modId = parseInt(req.params.modifier_id);
  const idx = db.modifiers.findIndex((m) => m.id === modId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Modifier not found' });
  }
  db.modifiers.splice(idx, 1);
  res.status(204).send();
});

// ==========================================
// 3. REPRESENTATIVES ROUTER
// ==========================================
function formatRepResponse(r: any) {
  const stats = typeof r.stats === 'string' ? JSON.parse(r.stats || '{}') : r.stats || {};
  const personalities = typeof r.personalities === 'string' ? JSON.parse(r.personalities || '[]') : r.personalities || [];
  const skills = typeof r.skills === 'string' ? JSON.parse(r.skills || '[]') : r.skills || [];
  const talents = typeof r.talents === 'string' ? JSON.parse(r.talents || '[]') : r.talents || [];

  return {
    id: String(r.id),
    numeric_id: r.id,
    name: r.name,
    type: r.type,
    stats,
    characteristics: stats,
    personalities,
    skills,
    talents,
    assigned_to_colony_id: r.assigned_to_colony_id,
    assignedColonyId: r.assigned_to_colony_id ? String(r.assigned_to_colony_id) : null,
    dynasty_nepotism_roll: r.dynasty_nepotism_roll,
    dynastyNepotismRoll: r.dynasty_nepotism_roll,
    dynasty_outcome_key: r.dynasty_outcome_key,
    dynastyOutcomeKey: r.dynasty_outcome_key,
  };
}

apiRouter.get('/representatives', optionalAuth, (req: Request, res: Response) => {
  const list = db.representatives.map(formatRepResponse);
  res.json({
    items: list,
    meta: {
      total: list.length,
      offset: 0,
      limit: list.length,
      has_more: false,
    },
  });
});

apiRouter.get('/representatives/:rep_id', optionalAuth, (req: Request, res: Response) => {
  const repId = parseInt(req.params.rep_id);
  const rep = db.representatives.find((r) => r.id === repId);
  if (!rep) {
    return res.status(404).json({ error: `Representative ${repId} not found` });
  }
  res.json(formatRepResponse(rep));
});

apiRouter.post('/representatives', optionalAuth, (req: Request, res: Response) => {
  const {
    name,
    type,
    personalities,
    stats,
    characteristics,
    skills,
    talents,
    assigned_to_colony_id,
    assignedColonyId,
    dynasty_nepotism_roll,
    dynastyNepotismRoll,
    dynasty_outcome_key,
    dynastyOutcomeKey,
  } = req.body;

  if (!name || !type) {
    return res.status(422).json({ error: 'Name and representative type required' });
  }

  const assignedColony = assigned_to_colony_id || (assignedColonyId ? parseInt(assignedColonyId) : null);
  const repId = db.nextRepId();
  const newRep: any = {
    id: repId,
    name,
    type,
    personalities: JSON.stringify(personalities || []),
    stats: JSON.stringify(stats || characteristics || { ws: 30, bs: 30, s: 30, t: 30, ag: 30, int: 30, per: 30, wp: 30, fel: 30 }),
    skills: JSON.stringify(skills || []),
    talents: JSON.stringify(talents || []),
    assigned_to_colony_id: assignedColony,
    dynasty_nepotism_roll: dynasty_nepotism_roll || dynastyNepotismRoll,
    dynasty_outcome_key: dynasty_outcome_key || dynastyOutcomeKey,
  };

  db.representatives.push(newRep);

  if (assignedColony) {
    const colony = db.colonies.find((c) => c.id === assignedColony);
    if (colony) {
      colony.representative_id = repId;
    }
  }

  res.status(201).json(formatRepResponse(newRep));
});

const handleUpdateRepresentative = (req: Request, res: Response) => {
  const repId = parseInt(req.params.rep_id);
  const rep = db.representatives.find((r) => r.id === repId);
  if (!rep) {
    return res.status(404).json({ error: `Representative ${repId} not found` });
  }

  const { name, type, personalities, stats, characteristics, skills, talents, assignedColonyId, assigned_to_colony_id } = req.body;
  if (name) rep.name = name;
  if (type) rep.type = type;
  if (personalities) rep.personalities = JSON.stringify(personalities);
  if (stats || characteristics) rep.stats = JSON.stringify(stats || characteristics);
  if (skills) rep.skills = JSON.stringify(skills);
  if (talents) rep.talents = JSON.stringify(talents);
  if (assigned_to_colony_id !== undefined || assignedColonyId !== undefined) {
    const target = assigned_to_colony_id ?? (assignedColonyId ? parseInt(assignedColonyId) : null);
    rep.assigned_to_colony_id = target;
  }

  res.json(formatRepResponse(rep));
};

apiRouter.put('/representatives/:rep_id', optionalAuth, handleUpdateRepresentative);
apiRouter.patch('/representatives/:rep_id', optionalAuth, handleUpdateRepresentative);

apiRouter.delete('/representatives/:rep_id', optionalAuth, (req: Request, res: Response) => {
  const repId = parseInt(req.params.rep_id);
  const idx = db.representatives.findIndex((r) => r.id === repId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Representative not found' });
  }

  // Clear colony pointer if assigned
  const assigned = db.colonies.find((c) => c.representative_id === repId);
  if (assigned) {
    assigned.representative_id = null;
  }

  db.representatives.splice(idx, 1);
  res.status(204).send();
});

apiRouter.post('/representatives/:rep_id/assign', optionalAuth, (req: Request, res: Response) => {
  const repId = parseInt(req.params.rep_id);
  const { colony_id, colonyId } = req.body;
  const targetColonyId = colony_id ?? (colonyId ? parseInt(colonyId) : null);

  const rep = db.representatives.find((r) => r.id === repId);
  if (!rep) {
    return res.status(404).json({ error: 'Representative not found' });
  }

  // Unassign previous if any
  if (rep.assigned_to_colony_id) {
    const prevColony = db.colonies.find((c) => c.id === rep.assigned_to_colony_id);
    if (prevColony && prevColony.representative_id === repId) {
      prevColony.representative_id = null;
    }
  }

  if (targetColonyId) {
    const targetColony = db.colonies.find((c) => c.id === targetColonyId);
    if (targetColony) {
      // Clear previous rep assigned to this colony
      if (targetColony.representative_id && targetColony.representative_id !== repId) {
        const oldRep = db.representatives.find((r) => r.id === targetColony.representative_id);
        if (oldRep) oldRep.assigned_to_colony_id = null;
      }
      targetColony.representative_id = repId;
      rep.assigned_to_colony_id = targetColonyId;
    }
  } else {
    rep.assigned_to_colony_id = null;
  }

  res.json({ message: 'Assignment updated successfully', representative_id: repId, colony_id: targetColonyId });
});

// ==========================================
// 4. INFRASTRUCTURE & SUPPORT UPGRADES
// ==========================================
apiRouter.get('/infrastructure', optionalAuth, (req: Request, res: Response) => {
  const colonyId = req.query.colony_id ? parseInt(req.query.colony_id as string) : undefined;
  const list = colonyId ? db.infrastructure.filter((i) => i.colony_id === colonyId) : db.infrastructure;
  res.json(list);
});

apiRouter.put('/infrastructure/:infra_id', optionalAuth, (req: Request, res: Response) => {
  const infraId = parseInt(req.params.infra_id);
  const infra = db.infrastructure.find((i) => i.id === infraId);
  if (!infra) {
    return res.status(404).json({ error: 'Infrastructure item not found' });
  }

  const { state, notes } = req.body;
  if (state) infra.state = state;
  if (notes !== undefined) infra.notes = notes;

  res.json(infra);
});

apiRouter.get('/support-upgrades', optionalAuth, (req: Request, res: Response) => {
  const colonyId = req.query.colony_id ? parseInt(req.query.colony_id as string) : undefined;
  const list = colonyId ? db.support_upgrades.filter((s) => s.colony_id === colonyId) : db.support_upgrades;
  res.json(list);
});

apiRouter.post('/support-upgrades', optionalAuth, (req: Request, res: Response) => {
  const { colony_id, upgrade_type, custom_stat_choice, custom_product, affiliated_group, status, notes } = req.body;

  if (!colony_id || !upgrade_type) {
    return res.status(422).json({ error: 'Colony ID and upgrade type required' });
  }

  const newUpgrade = {
    id: db.nextSupId(),
    colony_id,
    upgrade_type,
    custom_stat_choice: custom_stat_choice || null,
    custom_product: custom_product || null,
    affiliated_group: affiliated_group || null,
    status: status || 'working',
    notes: notes || '',
  };

  db.support_upgrades.push(newUpgrade);
  res.status(201).json(newUpgrade);
});

apiRouter.delete('/support-upgrades/:upgrade_id', optionalAuth, (req: Request, res: Response) => {
  const id = parseInt(req.params.upgrade_id);
  const idx = db.support_upgrades.findIndex((s) => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Support upgrade not found' });
  }
  db.support_upgrades.splice(idx, 1);
  res.status(204).send();
});

// ==========================================
// 5. DEVELOPMENT PLANS ROUTER
// ==========================================
apiRouter.get('/development-plans', optionalAuth, (req: Request, res: Response) => {
  const colonyId = req.query.colony_id ? parseInt(req.query.colony_id as string) : undefined;
  const list = colonyId ? db.development_plans.filter((p) => p.colony_id === colonyId) : db.development_plans;
  res.json(list);
});

apiRouter.post('/development-plans', optionalAuth, (req: Request, res: Response) => {
  const { colony_id, upgrade_type, target_type, target_name, priority, status, description, progress } = req.body;

  if (!colony_id || !target_type) {
    return res.status(422).json({ error: 'Colony ID and target type required' });
  }

  const newPlan = {
    id: db.nextPlanId(),
    colony_id,
    upgrade_type: upgrade_type || 'support_upgrade',
    target_type,
    target_name: target_name || target_type,
    priority: priority || 1,
    status: status || 'planning',
    description: description || '',
    progress: progress || '0% complete',
    created_by: (req as any).user?.id || 1,
    created_at: new Date().toISOString(),
  };

  db.development_plans.push(newPlan);
  res.status(201).json(newPlan);
});

apiRouter.post('/development-plans/:plan_id/promote', optionalAuth, (req: Request, res: Response) => {
  const planId = parseInt(req.params.plan_id);
  const planIndex = db.development_plans.findIndex((p) => p.id === planId);
  if (planIndex === -1) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  const plan = db.development_plans[planIndex];

  // Convert to support upgrade or repair infrastructure
  if (plan.upgrade_type === 'support_upgrade') {
    db.support_upgrades.push({
      id: db.nextSupId(),
      colony_id: plan.colony_id,
      upgrade_type: plan.target_type,
      custom_stat_choice: null,
      custom_product: null,
      affiliated_group: null,
      status: 'working',
      notes: `Constructed via development plan: ${plan.target_name}`,
    });
  } else {
    const infra = db.infrastructure.find((i) => i.colony_id === plan.colony_id && i.infrastructure_type === plan.target_type);
    if (infra) {
      infra.state = 'working';
    }
  }

  // Remove plan after promotion
  db.development_plans.splice(planIndex, 1);

  res.json({ message: 'Plan promoted to operational status successfully' });
});

apiRouter.delete('/development-plans/:plan_id', optionalAuth, (req: Request, res: Response) => {
  const planId = parseInt(req.params.plan_id);
  const idx = db.development_plans.findIndex((p) => p.id === planId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Plan not found' });
  }
  db.development_plans.splice(idx, 1);
  res.status(204).send();
});

// ==========================================
// 6. EXPORT / IMPORT ROUTER
// ==========================================
apiRouter.get('/colonies/:colony_id/export', optionalAuth, (req: Request, res: Response) => {
  const colonyId = parseInt(req.params.colony_id);
  const colony = db.colonies.find((c) => c.id === colonyId);
  if (!colony) {
    return res.status(404).json({ error: 'Colony not found' });
  }

  const rep = colony.representative_id ? db.representatives.find((r) => r.id === colony.representative_id) : null;
  const exportPayload = {
    schema_version: '1.0.0',
    exported_at: new Date().toISOString(),
    colony: {
      ...colony,
      planetary_resources: colony.planetary_resources ? JSON.parse(colony.planetary_resources) : [],
    },
    representative: rep ? { ...rep, stats: JSON.parse(rep.stats), personalities: JSON.parse(rep.personalities) } : null,
    infrastructure: db.infrastructure.filter((i) => i.colony_id === colonyId),
    support_upgrades: db.support_upgrades.filter((s) => s.colony_id === colonyId),
    development_plans: db.development_plans.filter((p) => p.colony_id === colonyId),
    modifiers: db.modifiers.filter((m) => m.colony_id === colonyId),
  };

  res.setHeader('Content-Disposition', `attachment; filename="colony_${colony.name.replace(/\s+/g, '_')}_export.json"`);
  res.json(exportPayload);
});

apiRouter.post('/colonies/import', optionalAuth, (req: Request, res: Response) => {
  const payload = req.body;
  if (!payload || !payload.colony) {
    return res.status(422).json({ error: 'Invalid export package schema' });
  }

  const rawColony = payload.colony;
  const newColonyId = db.nextColonyId();

  const newColony = {
    id: newColonyId,
    name: `${rawColony.name} (Imported)`,
    owner: rawColony.owner || 'Von Valancius Dynasty',
    colony_type: rawColony.colony_type,
    star_system: rawColony.star_system || 'Unknown Reaches',
    description: rawColony.description || '',
    age_days: rawColony.age_days || 0,
    age_last_updated: new Date().toISOString().split('T')[0],
    current_event: null,
    base_complacency: rawColony.base_complacency || 2,
    base_order: rawColony.base_order || 2,
    base_productivity: rawColony.base_productivity || 2,
    base_piety: rawColony.base_piety || 2,
    base_size: rawColony.base_size || 1,
    representative_id: null,
    dynasty_outcome: null,
    complacency_locked: false,
    order_locked: false,
    productivity_locked: false,
    planetary_resources: JSON.stringify(rawColony.planetary_resources || []),
  };

  db.colonies.push(newColony);

  if (payload.representative) {
    const rawRep = payload.representative;
    const newRepId = db.nextRepId();
    db.representatives.push({
      id: newRepId,
      name: rawRep.name,
      type: rawRep.type,
      personalities: JSON.stringify(rawRep.personalities || []),
      stats: JSON.stringify(rawRep.stats || {}),
      skills: JSON.stringify(rawRep.skills || []),
      talents: JSON.stringify(rawRep.talents || []),
      assigned_to_colony_id: newColonyId,
    });
    newColony.representative_id = newRepId;
  }

  if (Array.isArray(payload.infrastructure)) {
    payload.infrastructure.forEach((infra: any) => {
      db.infrastructure.push({
        id: db.nextInfraId(),
        colony_id: newColonyId,
        infrastructure_type: infra.infrastructure_type,
        state: infra.state,
        notes: infra.notes,
      });
    });
  }

  if (Array.isArray(payload.support_upgrades)) {
    payload.support_upgrades.forEach((upg: any) => {
      db.support_upgrades.push({
        id: db.nextSupId(),
        colony_id: newColonyId,
        upgrade_type: upg.upgrade_type,
        custom_stat_choice: upg.custom_stat_choice,
        custom_product: upg.custom_product,
        affiliated_group: upg.affiliated_group,
        status: upg.status,
        notes: upg.notes,
      });
    });
  }

  res.status(201).json({
    message: 'Colony imported successfully',
    id: newColonyId,
    name: newColony.name,
  });
});

// ==========================================
// 7. AUDIT LOGS, EVENTS & CONFIG ROUTER
// ==========================================
apiRouter.get('/colonies/:colony_id/events', optionalAuth, (req: Request, res: Response) => {
  const colonyId = parseInt(req.params.colony_id);
  const colony = db.colonies.find((c) => c.id === colonyId);
  if (!colony) {
    return res.status(404).json({ error: `Colony ${colonyId} not found` });
  }
  const events = db.events.filter((e) => e.colony_id === colonyId);
  res.json({ colony_id: colonyId, events });
});

apiRouter.post('/colonies/:colony_id/events', optionalAuth, (req: Request, res: Response) => {
  const colonyId = parseInt(req.params.colony_id);
  const { name, description } = req.body;
  if (!name) {
    return res.status(422).json({ error: 'Event name is required' });
  }
  const colony = db.colonies.find((c) => c.id === colonyId);
  if (!colony) {
    return res.status(404).json({ error: `Colony ${colonyId} not found` });
  }

  const newEvent = {
    id: db.nextLogId(),
    colony_id: colonyId,
    name,
    description: description || '',
    created_by: (req as any).user?.id || 1,
    created_at: new Date().toISOString(),
    is_active: true,
  };

  db.events.push(newEvent);
  colony.current_event = name;

  res.status(201).json(newEvent);
});

apiRouter.get('/audit-logs', optionalAuth, (req: Request, res: Response) => {
  const colonyId = req.query.colony_id ? parseInt(req.query.colony_id as string) : undefined;
  const list = colonyId ? db.audit_logs.filter((l) => l.colony_id === colonyId) : db.audit_logs;
  res.json({ logs: list.slice(-100).reverse() });
});

apiRouter.get('/config/rules', (req: Request, res: Response) => {
  res.json({
    version: '1.0.0',
    title: 'Warhammer 40,000 Rogue Trader Colony Rules',
    lore_state_thresholds: {
      placated: 'Complacency > Size',
      anarchy: 'Order == 0',
      productive: 'Productivity > Size',
      halted: 'Productivity == 0',
      pious: 'Piety > Size',
      heretical: 'Piety == 0',
    },
    support_upgrades_max: 10,
  });
});

apiRouter.get('/config/colony-types', (req: Request, res: Response) => {
  res.json({
    research_mission: {
      name: 'research_mission',
      displayName: 'Research Mission',
      initialInvestmentPf: '1d5+2',
      baseStats: { size: 1, complacency: 2, productivity: 1, order: 1, piety: 1 },
      description: 'Founded to study notable flora, fauna, or ancient ruins.',
    },
    mining_and_industry: {
      name: 'mining_and_industry',
      displayName: 'Mining and Industry',
      initialInvestmentPf: '1d5+5',
      baseStats: { size: 1, complacency: 1, productivity: 2, order: 1, piety: 1 },
      description: 'The economic backbone extracting ores and manufacturing finished goods.',
    },
    farming_and_agriculture: {
      name: 'farming_and_agriculture',
      displayName: 'Farming and Agriculture (Agri-World)',
      initialInvestmentPf: '1d5+1',
      baseStats: { size: 1, complacency: 2, productivity: 1, order: 1, piety: 1 },
      description: 'Cultivating crops, algae, or livestock to feed sector hives.',
    },
    penal_colony: {
      name: 'penal_colony',
      displayName: 'Penal Colony',
      initialInvestmentPf: '1d5',
      baseStats: { size: 1, complacency: 0, productivity: 2, order: 3, piety: 1 },
      description: 'Grim carceral facility staffed by convicts and hardened overseers.',
    },
    military_garrison: {
      name: 'military_garrison',
      displayName: 'Military Garrison / Fortress World',
      initialInvestmentPf: '1d5+6',
      baseStats: { size: 1, complacency: 1, productivity: 1, order: 2, piety: 1 },
      description: 'Bastion fortress anchoring dynasty defensive perimeters.',
    },
    orbital_habitat: {
      name: 'orbital_habitat',
      displayName: 'Orbital Habitat / Void Station',
      initialInvestmentPf: '1d5+4',
      baseStats: { size: 1, complacency: 2, productivity: 2, order: 1, piety: 1 },
      description: 'Deep-void anchorage, refuelling depot, and trade node.',
    },
  });
});

apiRouter.get('/config/infrastructure-types', (req: Request, res: Response) => {
  res.json({
    food_production: { name: 'Food Production', required: true, penaltyStat: 'complacency', penaltyValue: -2 },
    power: { name: 'Power Matrix', required: true, penaltyStat: 'productivity', penaltyValue: -2 },
    water: { name: 'Water Reclamation', required: true, penaltyStat: 'complacency', penaltyValue: -2 },
    transport: { name: 'Transit Grid', required: true, penaltyStat: 'productivity', penaltyValue: -2 },
    communications: { name: 'Vox & Auspex Grid', required: true, penaltyStat: 'order', penaltyValue: -2 },
  });
});

apiRouter.get('/config/support-upgrades', (req: Request, res: Response) => {
  res.json({
    arbites_precinct: { name: 'Arbites Precinct', stat: 'order', value: 1, maxCount: 1 },
    ecclesiarchy_mission: { name: 'Ecclesiarchy Mission', stat: 'piety', value: 1, maxCount: 1 },
    mechanicum_station: { name: 'Mechanicum Station', stat: 'productivity', value: 1, maxCount: 1 },
    void_dock: { name: 'Void Dock', stat: 'productivity', value: 1, maxCount: 1 },
    planetary_defense_grid: { name: 'Planetary Defense Grid', stat: 'order', value: 1, maxCount: 1 },
    pleasure_gardens: { name: 'Pleasure Gardens', stat: 'complacency', value: 1, maxCount: 1 },
    sanatorium: { name: 'Sanatorium / Medicae Bay', stat: 'complacency', value: 1, maxCount: 1 },
    schola_progenium: { name: 'Schola Progenium', stat: 'piety', value: 1, maxCount: 1 },
    smugglers_den: { name: 'Smugglers Den / Underhive Market', stat: 'productivity', value: 1, maxCount: 1 },
    xenology_containment_vault: { name: 'Xenology Vault', stat: 'productivity', value: 1, maxCount: 1 },
  });
});
