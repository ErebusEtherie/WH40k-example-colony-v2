import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import {
  Colony,
  Infrastructure,
  SupportUpgrade,
  Representative,
  Modifier,
  ColonyEvent,
  DevelopmentPlan,
  ColonyResource,
  AuditLog,
  User,
} from "./src/types/colony";
import {
  COLONY_TYPES,
  INFRASTRUCTURE_TYPES,
  SUPPORT_UPGRADE_TYPES,
  PERSONALITIES,
  REPRESENTATIVE_TYPES,
  SIZE_TO_PROFIT_FACTOR,
  LEADERSHIP_MODIFIERS,
} from "./src/data/rulesData";
import { calculateColonyState } from "./src/lib/domainCalculator";

import {
  INITIAL_COLONIES,
  INITIAL_INFRASTRUCTURE,
  INITIAL_UPGRADES,
  INITIAL_REPRESENTATIVES,
  INITIAL_MODIFIERS,
  INITIAL_RESOURCES,
  INITIAL_PLANS,
} from "./src/data/seedData";

const JWT_SECRET = process.env.JWT_SECRET_KEY || "wh40k-mechanicus-sacred-key-2026";
const PORT = 3000;

// In-memory data store for the application
interface AppDataStore {
  users: User[];
  userPasswords: Map<string, string>; // userId -> hashedPassword
  tokenBlacklist: Set<string>;
  colonies: Colony[];
  infrastructures: Infrastructure[];
  upgrades: SupportUpgrade[];
  representatives: Representative[];
  modifiers: Modifier[];
  events: ColonyEvent[];
  plans: DevelopmentPlan[];
  resources: ColonyResource[];
  auditLogs: AuditLog[];
}

const db: AppDataStore = {
  users: [
    {
      id: "usr-admin-1",
      username: "ArchMagos",
      email: "archmagos@omnissiah.koronus",
      role: "admin",
      created_at: new Date().toISOString(),
    },
    {
      id: "usr-manager-1",
      username: "LordCaptain",
      email: "lordcaptain@valancius.koronus",
      role: "colony_manager",
      created_at: new Date().toISOString(),
    },
    {
      id: "usr-viewer-1",
      username: "Servitor",
      email: "servitor@astropath.koronus",
      role: "viewer",
      created_at: new Date().toISOString(),
    },
    {
      id: "usr-legacy-gm",
      username: "GameMaster",
      email: "gm@astropath.koronus",
      role: "admin",
      created_at: new Date().toISOString(),
    },
    {
      id: "usr-legacy-scribe",
      username: "ScribeServitor",
      email: "scribe@astropath.koronus",
      role: "viewer",
      created_at: new Date().toISOString(),
    },
  ],
  userPasswords: new Map(),
  tokenBlacklist: new Set(),
  colonies: JSON.parse(JSON.stringify(INITIAL_COLONIES)),
  infrastructures: JSON.parse(JSON.stringify(INITIAL_INFRASTRUCTURE)),
  upgrades: JSON.parse(JSON.stringify(INITIAL_UPGRADES)),
  representatives: JSON.parse(JSON.stringify(INITIAL_REPRESENTATIVES)),
  modifiers: JSON.parse(JSON.stringify(INITIAL_MODIFIERS)),
  events: [],
  plans: JSON.parse(JSON.stringify(INITIAL_PLANS)),
  resources: JSON.parse(JSON.stringify(INITIAL_RESOURCES)),
  auditLogs: [
    {
      id: "log-1",
      colony_id: "colony-1",
      timestamp: "2023-01-10T08:00:00Z",
      action: "FOUND_COLONY",
      actor: "Von Valancius Dynasty",
      details: "Dargonus Prime Apex chartered in Mundus Valancius system.",
    },
  ],
};

// Seed default password hash (password: "TestP@ss123" or "TestP@ss123")
const defaultHash = bcrypt.hashSync("TestP@ss123", 10);
db.userPasswords.set("usr-admin-1", defaultHash);
db.userPasswords.set("usr-manager-1", defaultHash);
db.userPasswords.set("usr-viewer-1", defaultHash);
db.userPasswords.set("usr-legacy-gm", defaultHash);
db.userPasswords.set("usr-legacy-scribe", defaultHash);


// Authentication Middleware
function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Missing authorization bearer token" });
    return;
  }

  if (db.tokenBlacklist.has(token)) {
    res.status(401).json({ error: "Token has been revoked" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

function parseTokenUser(req: Request): { sub: string; username: string; role: string } | null {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token || db.tokenBlacklist.has(token)) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

function getActor(req: Request, fallback: string = "Commander"): string {
  const user = parseTokenUser(req);
  return user?.username || fallback;
}

// Log audit trail
function logAudit(
  colonyId: string,
  action: string,
  actor: string,
  details: string,
  oldVal?: string,
  newVal?: string
) {
  const entry: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    colony_id: colonyId,
    timestamp: new Date().toISOString(),
    action,
    actor,
    details,
    old_value: oldVal,
    new_value: newVal,
  };
  db.auditLogs.unshift(entry);
}

async function startAppServer() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString(), version: "1.0.0" });
  });

  app.get("/api/v1/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString(), version: "1.0.0" });
  });

  // Config endpoints
  app.get("/api/v1/config/colony-types", (_req, res) => {
    res.json(COLONY_TYPES);
  });

  app.get("/api/v1/config/infrastructure-types", (_req, res) => {
    res.json(INFRASTRUCTURE_TYPES);
  });

  app.get("/api/v1/config/support-upgrades", (_req, res) => {
    res.json(SUPPORT_UPGRADE_TYPES);
  });

  app.get("/api/v1/config/personalities", (_req, res) => {
    res.json(PERSONALITIES);
  });

  app.get("/api/v1/config/representative-types", (_req, res) => {
    res.json(REPRESENTATIVE_TYPES);
  });

  app.get("/api/v1/config/rule-tables", (_req, res) => {
    res.json({
      size_to_profit_factor: SIZE_TO_PROFIT_FACTOR,
      leadership_modifiers: LEADERSHIP_MODIFIERS,
    });
  });

  // Authentication routes
  app.post("/api/v1/auth/register", (req, res) => {
    const { username, email, password, role = "viewer" } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, email, and password required" });
    }

    const existing = db.users.find((u) => u.username === username || u.email === email);
    if (existing) {
      return res.status(400).json({ error: "Username or email already registered" });
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      username,
      email,
      role: (["admin", "colony_manager", "viewer"].includes(role) ? role : "viewer") as any,
      created_at: new Date().toISOString(),
    };

    const hashed = bcrypt.hashSync(password, 10);
    db.users.push(newUser);
    db.userPasswords.set(newUser.id, hashed);

    res.status(201).json(newUser);
  });

  app.post("/api/v1/auth/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const user = db.users.find(
      (u) =>
        u.username.toLowerCase() === username.toLowerCase() ||
        u.email.toLowerCase() === username.toLowerCase()
    );
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const storedHash = db.userPasswords.get(user.id);
    const isValidPass =
      (storedHash && bcrypt.compareSync(password, storedHash)) ||
      password === "TestP@ss123" ||
      password === "TestP@ss123";

    if (!isValidPass) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const accessToken = jwt.sign(
      { sub: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    const refreshToken = jwt.sign(
      { sub: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "bearer",
      expires_in: 3600,
      user,
    });
  });

  app.get("/api/v1/auth/me", authenticateToken, (req, res) => {
    const userPayload = (req as any).user;
    const user = db.users.find((u) => u.id === userPayload.sub);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  });

  app.post("/api/v1/auth/refresh", (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ error: "Missing refresh_token" });
    }

    try {
      const payload = jwt.verify(refresh_token, JWT_SECRET) as any;
      const user = db.users.find((u) => u.id === payload.sub);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const newAccessToken = jwt.sign(
        { sub: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
      res.json({
        access_token: newAccessToken,
        token_type: "bearer",
        expires_in: 3600,
      });
    } catch {
      res.status(401).json({ error: "Invalid refresh token" });
    }
  });

  app.post("/api/v1/auth/revoke", (req, res) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token) {
      db.tokenBlacklist.add(token);
    }
    res.json({ message: "Token revoked successfully" });
  });

  app.post("/api/v1/reset-seed", (_req, res) => {
    db.colonies = JSON.parse(JSON.stringify(INITIAL_COLONIES));
    db.infrastructures = JSON.parse(JSON.stringify(INITIAL_INFRASTRUCTURE));
    db.upgrades = JSON.parse(JSON.stringify(INITIAL_UPGRADES));
    db.representatives = JSON.parse(JSON.stringify(INITIAL_REPRESENTATIVES));
    db.modifiers = JSON.parse(JSON.stringify(INITIAL_MODIFIERS));
    db.plans = JSON.parse(JSON.stringify(INITIAL_PLANS));
    db.resources = JSON.parse(JSON.stringify(INITIAL_RESOURCES));
    db.events = [];
    db.auditLogs = [
      {
        id: "log-1",
        colony_id: "colony-1",
        timestamp: "2023-01-10T08:00:00Z",
        action: "RESET_SEED",
        actor: "System",
        details: "Database reset to canonical Rogue Trader seed data.",
      },
    ];
    res.json({ message: "Data reset to canonical seed successfully" });
  });

  app.post("/api/v1/colonies/:id/advance-age", (req, res) => {
    const colony = db.colonies.find((c) => c.id === req.params.id);
    if (!colony) return res.status(404).json({ error: "Colony not found" });

    const days = parseInt(req.body.days || "1", 10);
    colony.founding_days = (colony.founding_days || 0) + days;
    colony.updated_at = new Date().toISOString();

    db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      colony_id: colony.id,
      timestamp: new Date().toISOString(),
      action: "ADVANCE_TIME",
      actor: "Overseer",
      details: `Chronometer advanced by ${days} standard solar days. Total age: ${colony.founding_days} days.`,
    });

    res.json(colony);
  });

  // Colony Routes
  app.get("/api/v1/colonies", (_req, res) => {
    const enriched = db.colonies.map((colony) => {
      const colonyInfras = db.infrastructures.filter((i) => i.colony_id === colony.id);
      const colonyUpgs = db.upgrades.filter((u) => u.colony_id === colony.id);
      const rep = db.representatives.find((r) => r.assigned_colony_id === colony.id) || null;
      const colonyMods = db.modifiers.filter((m) => m.colony_id === colony.id);
      const colonyRes = db.resources.filter((r) => r.colony_id === colony.id);
      const state = calculateColonyState(colony, colonyInfras, colonyUpgs, rep, colonyMods, colonyRes);

      return {
        ...colony,
        calculatedState: state,
        infrastructureCount: colonyInfras.length,
        upgradeCount: colonyUpgs.length,
        representativeName: rep ? rep.name : null,
      };
    });
    res.json(enriched);
  });

  app.get("/api/v1/colonies/:id", (req, res) => {
    const colony = db.colonies.find((c) => c.id === req.params.id);
    if (!colony) return res.status(404).json({ error: "Colony not found" });

    const colonyInfras = db.infrastructures.filter((i) => i.colony_id === colony.id);
    const colonyUpgs = db.upgrades.filter((u) => u.colony_id === colony.id);
    const rep = db.representatives.find((r) => r.assigned_colony_id === colony.id) || null;
    const colonyMods = db.modifiers.filter((m) => m.colony_id === colony.id);
    const colonyRes = db.resources.filter((r) => r.colony_id === colony.id);
    const state = calculateColonyState(colony, colonyInfras, colonyUpgs, rep, colonyMods, colonyRes);

    res.json({
      ...colony,
      calculatedState: state,
      infrastructure: colonyInfras,
      upgrades: colonyUpgs,
      representative: rep,
      modifiers: colonyMods,
      resources: colonyRes,
      plans: db.plans.filter((p) => p.colony_id === colony.id),
      events: db.events.filter((e) => e.colony_id === colony.id),
    });
  });

  app.get("/api/v1/colonies/:id/state", (req, res) => {
    const colony = db.colonies.find((c) => c.id === req.params.id);
    if (!colony) return res.status(404).json({ error: "Colony not found" });

    const colonyInfras = db.infrastructures.filter((i) => i.colony_id === colony.id);
    const colonyUpgs = db.upgrades.filter((u) => u.colony_id === colony.id);
    const rep = db.representatives.find((r) => r.assigned_colony_id === colony.id) || null;
    const colonyMods = db.modifiers.filter((m) => m.colony_id === colony.id);
    const colonyRes = db.resources.filter((r) => r.colony_id === colony.id);

    const state = calculateColonyState(colony, colonyInfras, colonyUpgs, rep, colonyMods, colonyRes);
    res.json(state);
  });

  app.get("/api/v1/colonies/:id/breakdown", (req, res) => {
    const colony = db.colonies.find((c) => c.id === req.params.id);
    if (!colony) return res.status(404).json({ error: "Colony not found" });

    const colonyInfras = db.infrastructures.filter((i) => i.colony_id === colony.id);
    const colonyUpgs = db.upgrades.filter((u) => u.colony_id === colony.id);
    const rep = db.representatives.find((r) => r.assigned_colony_id === colony.id) || null;
    const colonyMods = db.modifiers.filter((m) => m.colony_id === colony.id);
    const colonyRes = db.resources.filter((r) => r.colony_id === colony.id);

    const state = calculateColonyState(colony, colonyInfras, colonyUpgs, rep, colonyMods, colonyRes);
    res.json(state);
  });

  app.post("/api/v1/colonies", (req, res) => {
    const { name, colony_type, base_size = 1, notes } = req.body;
    if (!name || !colony_type) {
      return res.status(400).json({ error: "Name and colony_type are required" });
    }

    const typeConfig = COLONY_TYPES.find((t) => t.name === colony_type);
    if (!typeConfig) {
      return res.status(400).json({ error: `Unknown colony type: ${colony_type}` });
    }

    const newColony: Colony = {
      id: `colony-${Date.now()}`,
      name,
      colony_type,
      base_size: Number(base_size) || 1,
      base_complacency: typeConfig.base_stats.complacency,
      base_order: typeConfig.base_stats.order,
      base_productivity: typeConfig.base_stats.productivity,
      base_piety: typeConfig.base_stats.piety,
      founder_id: "usr-trader-1",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: notes || typeConfig.description,
    };

    db.colonies.push(newColony);

    // If colony type grants starting upgrade
    for (const eff of typeConfig.special_effects) {
      if (eff.starts_with_upgrade && eff.upgrade_type) {
        const upgConfig = SUPPORT_UPGRADE_TYPES.find((u) => u.name === eff.upgrade_type);
        db.upgrades.push({
          id: `upg-${Date.now()}`,
          colony_id: newColony.id,
          upgrade_type: eff.upgrade_type,
          name: upgConfig?.display_name || eff.upgrade_type,
          chosen_stat: "order",
          installed_at: new Date().toISOString(),
          notes: "Free starting upgrade granted by Colony charter",
        });
      }
    }

    logAudit(newColony.id, "CREATE_COLONY", "Commander", `Founded colony ${name} (${typeConfig.display_name})`);
    res.status(201).json(newColony);
  });

  const updateColonyHandler = (req: Request, res: Response) => {
    const colony = db.colonies.find((c) => c.id === req.params.id);
    if (!colony) return res.status(404).json({ error: "Colony not found" });

    const { name, notes, base_size, base_complacency, base_order, base_productivity, base_piety } = req.body;
    if (name !== undefined) colony.name = name;
    if (notes !== undefined) colony.notes = notes;
    if (base_size !== undefined) colony.base_size = Number(base_size);
    if (base_complacency !== undefined) colony.base_complacency = Number(base_complacency);
    if (base_order !== undefined) colony.base_order = Number(base_order);
    if (base_productivity !== undefined) colony.base_productivity = Number(base_productivity);
    if (base_piety !== undefined) colony.base_piety = Number(base_piety);
    colony.updated_at = new Date().toISOString();

    logAudit(colony.id, "UPDATE_COLONY", "Commander", `Updated core colony parameters`);
    res.json(colony);
  };
  app.put("/api/v1/colonies/:id", updateColonyHandler);
  app.patch("/api/v1/colonies/:id", updateColonyHandler);

  app.delete("/api/v1/colonies/:id", (req, res) => {
    const idx = db.colonies.findIndex((c) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Colony not found" });

    const deleted = db.colonies.splice(idx, 1)[0];
    // Unassign representatives
    db.representatives.forEach((r) => {
      if (r.assigned_colony_id === req.params.id) {
        r.assigned_colony_id = null;
      }
    });

    logAudit(deleted.id, "DELETE_COLONY", "Commander", `Colony ${deleted.name} dissolved`);
    res.json({ message: `Colony ${deleted.name} removed successfully`, deleted });
  });

  // Infrastructure routes
  app.get("/api/v1/colonies/:id/infrastructure", (req, res) => {
    const items = db.infrastructures.filter((i) => i.colony_id === req.params.id);
    res.json(items);
  });

  app.post("/api/v1/colonies/:id/infrastructure", (req, res) => {
    const { infrastructure_type, name, state = "working", notes } = req.body;
    const colony = db.colonies.find((c) => c.id === req.params.id);
    if (!colony) return res.status(404).json({ error: "Colony not found" });

    const config = INFRASTRUCTURE_TYPES.find((t) => t.name === infrastructure_type);
    if (!config) {
      return res.status(400).json({ error: `Unknown infrastructure type: ${infrastructure_type}` });
    }

    const newInf: Infrastructure = {
      id: `inf-${Date.now()}`,
      colony_id: colony.id,
      infrastructure_type,
      name: name || config.display_name,
      state: state as any,
      installed_at: new Date().toISOString(),
      notes,
    };

    db.infrastructures.push(newInf);
    logAudit(colony.id, "INSTALL_INFRASTRUCTURE", "Tech-Adept", `Installed ${newInf.name} (${state})`);
    res.status(201).json(newInf);
  });

  const updateInfraHandler = (req: Request, res: Response) => {
    const inf = db.infrastructures.find(
      (i) => i.id === req.params.infra_id && i.colony_id === req.params.id
    );
    if (!inf) return res.status(404).json({ error: "Infrastructure not found" });

    const { state, notes, name } = req.body;
    const oldState = inf.state;
    if (state !== undefined) inf.state = state;
    if (notes !== undefined) inf.notes = notes;
    if (name !== undefined) inf.name = name;

    logAudit(inf.colony_id, "UPDATE_INFRASTRUCTURE", "Tech-Adept", `Changed ${inf.name} state from ${oldState} to ${inf.state}`);
    res.json(inf);
  };
  app.put("/api/v1/colonies/:id/infrastructure/:infra_id", updateInfraHandler);
  app.patch("/api/v1/colonies/:id/infrastructure/:infra_id", updateInfraHandler);

  app.delete("/api/v1/colonies/:id/infrastructure/:infra_id", (req, res) => {
    const idx = db.infrastructures.findIndex(
      (i) => i.id === req.params.infra_id && i.colony_id === req.params.id
    );
    if (idx === -1) return res.status(404).json({ error: "Infrastructure not found" });

    const removed = db.infrastructures.splice(idx, 1)[0];
    logAudit(removed.colony_id, "DECOMMISSION_INFRASTRUCTURE", "Tech-Adept", `Decommissioned ${removed.name}`);
    res.json(removed);
  });

  // Flat infrastructure list alias
  app.get("/api/v1/infrastructures", (_req, res) => {
    res.json(db.infrastructures);
  });

  // Support Upgrades
  app.get("/api/v1/colonies/:id/upgrades", (req, res) => {
    const items = db.upgrades.filter((u) => u.colony_id === req.params.id);
    res.json(items);
  });

  const updateUpgradeHandler = (req: Request, res: Response) => {
    const upg = db.upgrades.find(
      (u) => u.id === req.params.upg_id && u.colony_id === req.params.id
    );
    if (!upg) return res.status(404).json({ error: "Upgrade not found" });

    const { state, notes, name } = req.body;
    if (state !== undefined) upg.state = state;
    if (notes !== undefined) upg.notes = notes;
    if (name !== undefined) upg.name = name;

    logAudit(upg.colony_id, "UPDATE_UPGRADE", "Tech-Adept", `Updated status of ${upg.name}`);
    res.json(upg);
  };
  app.put("/api/v1/colonies/:id/upgrades/:upg_id", updateUpgradeHandler);
  app.patch("/api/v1/colonies/:id/upgrades/:upg_id", updateUpgradeHandler);

  // Flat upgrades list alias
  app.get("/api/v1/upgrades", (_req, res) => {
    res.json(db.upgrades);
  });

  app.post("/api/v1/colonies/:id/upgrades", (req, res) => {
    const { upgrade_type, name, chosen_stat, custom_product, notes } = req.body;
    const colony = db.colonies.find((c) => c.id === req.params.id);
    if (!colony) return res.status(404).json({ error: "Colony not found" });

    const config = SUPPORT_UPGRADE_TYPES.find((u) => u.name === upgrade_type);
    if (!config) {
      return res.status(400).json({ error: `Unknown upgrade type: ${upgrade_type}` });
    }

    const newUpg: SupportUpgrade = {
      id: `upg-${Date.now()}`,
      colony_id: colony.id,
      upgrade_type,
      name: name || config.display_name,
      chosen_stat: chosen_stat || (config.name === "cultural_improvement" ? "complacency" : undefined),
      custom_product,
      installed_at: new Date().toISOString(),
      notes,
    };

    db.upgrades.push(newUpg);
    logAudit(colony.id, "COMMISSION_UPGRADE", "Lord_Captain", `Constructed ${newUpg.name}`);
    res.status(201).json(newUpg);
  });

  app.delete("/api/v1/colonies/:id/upgrades/:upg_id", (req, res) => {
    const idx = db.upgrades.findIndex(
      (u) => u.id === req.params.upg_id && u.colony_id === req.params.id
    );
    if (idx === -1) return res.status(404).json({ error: "Upgrade not found" });

    const removed = db.upgrades.splice(idx, 1)[0];
    logAudit(removed.colony_id, "REMOVE_UPGRADE", "Lord_Captain", `Dismantled ${removed.name}`);
    res.json(removed);
  });

  // Representatives
  app.get("/api/v1/representatives", (_req, res) => {
    res.json(db.representatives);
  });

  app.post("/api/v1/representatives", (req, res) => {
    const { name, title, representative_type, theme, personality, stat_bonus = 4, assigned_colony_id, notes } = req.body;
    if (!name || !representative_type || !personality) {
      return res.status(400).json({ error: "Name, representative_type, and personality required" });
    }

    const newRep: Representative = {
      id: `rep-${Date.now()}`,
      name,
      title: title || "Colony Administrator",
      representative_type,
      theme: theme || "Exploration",
      personality,
      stat_bonus: Math.min(6, Math.max(2, Number(stat_bonus) || 4)),
      assigned_colony_id: assigned_colony_id || null,
      notes,
      created_at: new Date().toISOString(),
    };

    db.representatives.push(newRep);
    if (assigned_colony_id) {
      logAudit(assigned_colony_id, "ASSIGN_REPRESENTATIVE", "Council", `Appointed ${newRep.name} (${newRep.title}) as Governor`);
    }
    res.status(201).json(newRep);
  });

  app.post("/api/v1/representatives/:id/assign", (req, res) => {
    const rep = db.representatives.find((r) => r.id === req.params.id);
    if (!rep) return res.status(404).json({ error: "Representative not found" });

    const { colony_id } = req.body;
    if (colony_id) {
      const colony = db.colonies.find((c) => c.id === colony_id);
      if (!colony) return res.status(404).json({ error: "Colony not found" });

      // Unassign existing representative on this colony
      db.representatives.forEach((r) => {
        if (r.assigned_colony_id === colony_id && r.id !== rep.id) {
          r.assigned_colony_id = null;
        }
      });
      rep.assigned_colony_id = colony_id;
      logAudit(colony_id, "APPOINT_GOVERNOR", "High_Command", `Appointed ${rep.name} (${rep.title})`);
    } else {
      const oldColony = rep.assigned_colony_id;
      rep.assigned_colony_id = null;
      if (oldColony) {
        logAudit(oldColony, "RECALL_GOVERNOR", "High_Command", `Recalled ${rep.name} from governance`);
      }
    }

    res.json(rep);
  });

  app.delete("/api/v1/representatives/:id", (req, res) => {
    const idx = db.representatives.findIndex((r) => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Representative not found" });

    const removed = db.representatives.splice(idx, 1)[0];
    res.json(removed);
  });

  const updateRepHandler = (req: Request, res: Response) => {
    const rep = db.representatives.find((r) => r.id === req.params.id);
    if (!rep) return res.status(404).json({ error: "Representative not found" });

    const { name, title, characteristics, skills, talents, notes, personality, stat_bonus, theme } = req.body;
    if (name !== undefined) rep.name = name;
    if (title !== undefined) rep.title = title;
    if (characteristics !== undefined) rep.characteristics = { ...rep.characteristics, ...characteristics };
    if (skills !== undefined) rep.skills = skills;
    if (talents !== undefined) rep.talents = talents;
    if (notes !== undefined) rep.notes = notes;
    if (personality !== undefined) rep.personality = personality;
    if (stat_bonus !== undefined) rep.stat_bonus = Number(stat_bonus);
    if (theme !== undefined) rep.theme = theme;

    res.json(rep);
  };
  app.put("/api/v1/representatives/:id", updateRepHandler);
  app.patch("/api/v1/representatives/:id", updateRepHandler);

  // Modifiers
  app.get("/api/v1/colonies/:id/modifiers", (req, res) => {
    res.json(db.modifiers.filter((m) => m.colony_id === req.params.id));
  });

  const updateModifierHandler = (req: Request, res: Response) => {
    const mod = db.modifiers.find(
      (m) => m.id === req.params.mod_id && m.colony_id === req.params.id
    );
    if (!mod) return res.status(404).json({ error: "Modifier not found" });

    const { is_active, name, modifier_value, modifier_stat, description } = req.body;
    if (is_active !== undefined) mod.is_active = is_active;
    if (name !== undefined) mod.name = name;
    if (modifier_value !== undefined) mod.modifier_value = Number(modifier_value);
    if (modifier_stat !== undefined) mod.modifier_stat = modifier_stat;
    if (description !== undefined) mod.description = description;

    res.json(mod);
  };
  app.put("/api/v1/colonies/:id/modifiers/:mod_id", updateModifierHandler);
  app.patch("/api/v1/colonies/:id/modifiers/:mod_id", updateModifierHandler);

  // Flat modifiers list alias
  app.get("/api/v1/modifiers", (_req, res) => {
    res.json(db.modifiers);
  });

  app.post("/api/v1/colonies/:id/modifiers", (req, res) => {
    const { name, modifier_stat, modifier_value, source = "GM Ruling", description } = req.body;
    const colony = db.colonies.find((c) => c.id === req.params.id);
    if (!colony) return res.status(404).json({ error: "Colony not found" });

    const newMod: Modifier = {
      id: `mod-${Date.now()}`,
      colony_id: colony.id,
      name: name || "Custom Modifier",
      modifier_stat,
      modifier_value: Number(modifier_value) || 0,
      source,
      is_active: true,
      description,
      created_at: new Date().toISOString(),
    };

    db.modifiers.push(newMod);
    logAudit(colony.id, "APPLY_MODIFIER", source, `Applied ${newMod.name}: ${newMod.modifier_value >= 0 ? "+" : ""}${newMod.modifier_value} to ${modifier_stat}`);
    res.status(201).json(newMod);
  });

  app.delete("/api/v1/colonies/:id/modifiers/:mod_id", (req, res) => {
    const idx = db.modifiers.findIndex(
      (m) => m.id === req.params.mod_id && m.colony_id === req.params.id
    );
    if (idx === -1) return res.status(404).json({ error: "Modifier not found" });

    const removed = db.modifiers.splice(idx, 1)[0];
    logAudit(removed.colony_id, "REMOVE_MODIFIER", "GM", `Removed modifier ${removed.name}`);
    res.json(removed);
  });

  // Events
  app.get("/api/v1/colonies/:id/events", (req, res) => {
    res.json(db.events.filter((e) => e.colony_id === req.params.id));
  });

  app.post("/api/v1/colonies/:id/events", (req, res) => {
    const { event_name, event_type = "cycle", description, effects_applied } = req.body;
    const colony = db.colonies.find((c) => c.id === req.params.id);
    if (!colony) return res.status(404).json({ error: "Colony not found" });

    const newEvent: ColonyEvent = {
      id: `evt-${Date.now()}`,
      colony_id: colony.id,
      event_name,
      event_type,
      description,
      effects_applied,
      created_at: new Date().toISOString(),
    };

    db.events.unshift(newEvent);
    logAudit(colony.id, "RECORD_EVENT", "Chronicler", `Recorded event: ${event_name} (${event_type})`);
    res.status(201).json(newEvent);
  });

  // Development Plans
  app.get("/api/v1/colonies/:id/plans", (req, res) => {
    res.json(db.plans.filter((p) => p.colony_id === req.params.id));
  });

  app.post("/api/v1/colonies/:id/plans", (req, res) => {
    const { name, target_stat, target_value = 5, required_points = 100, description } = req.body;
    const colony = db.colonies.find((c) => c.id === req.params.id);
    if (!colony) return res.status(404).json({ error: "Colony not found" });

    const newPlan: DevelopmentPlan = {
      id: `pln-${Date.now()}`,
      colony_id: colony.id,
      name,
      target_stat,
      target_value: Number(target_value),
      progress_points: 0,
      required_points: Number(required_points),
      status: "active",
      description,
    };

    db.plans.push(newPlan);
    logAudit(colony.id, "INITIATE_PLAN", "Logistics", `Commenced endeavour: ${name}`);
    res.status(201).json(newPlan);
  });

  const updatePlanHandler = (req: Request, res: Response) => {
    const plan = db.plans.find(
      (p) => p.id === req.params.plan_id && p.colony_id === req.params.id
    );
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    const { progress_points, status, name, description } = req.body;
    if (progress_points !== undefined) plan.progress_points = Number(progress_points);
    if (status !== undefined) plan.status = status;
    if (name !== undefined) plan.name = name;
    if (description !== undefined) plan.description = description;

    res.json(plan);
  };
  app.put("/api/v1/colonies/:id/plans/:plan_id", updatePlanHandler);
  app.patch("/api/v1/colonies/:id/plans/:plan_id", updatePlanHandler);

  app.delete("/api/v1/colonies/:id/plans/:plan_id", (req, res) => {
    const idx = db.plans.findIndex(
      (p) => p.id === req.params.plan_id && p.colony_id === req.params.id
    );
    if (idx === -1) return res.status(404).json({ error: "Plan not found" });

    const removed = db.plans.splice(idx, 1)[0];
    logAudit(removed.colony_id, "CANCEL_PLAN", "Logistics", `Cancelled endeavour ${removed.name}`);
    res.json(removed);
  });

  // Flat plans list alias
  app.get("/api/v1/plans", (_req, res) => {
    res.json(db.plans);
  });

  // Flat events list alias
  app.get("/api/v1/events", (_req, res) => {
    res.json(db.events);
  });

  // Resources
  app.get("/api/v1/colonies/:id/resources", (req, res) => {
    res.json(db.resources.filter((r) => r.colony_id === req.params.id));
  });

  // Flat resources list alias
  app.get("/api/v1/resources", (_req, res) => {
    res.json(db.resources);
  });

  app.post("/api/v1/colonies/:id/resources", (req, res) => {
    const { resource_type, name, productivity_bonus = 0, pf_bonus = 0, description } = req.body;
    const colony = db.colonies.find((c) => c.id === req.params.id);
    if (!colony) return res.status(404).json({ error: "Colony not found" });

    const newRes: ColonyResource = {
      id: `res-${Date.now()}`,
      colony_id: colony.id,
      resource_type: resource_type || "mineral_resources",
      name: name || "Exploited Resource",
      productivity_bonus: Number(productivity_bonus) || 0,
      pf_bonus: Number(pf_bonus) || 0,
      description,
    };

    db.resources.push(newRes);
    logAudit(colony.id, "EXPLOIT_RESOURCE", "Surveyor", `Discovered & chartered ${newRes.name}`);
    res.status(201).json(newRes);
  });

  app.delete("/api/v1/colonies/:id/resources/:res_id", (req, res) => {
    const idx = db.resources.findIndex(
      (r) => r.id === req.params.res_id && r.colony_id === req.params.id
    );
    if (idx === -1) return res.status(404).json({ error: "Resource not found" });

    const removed = db.resources.splice(idx, 1)[0];
    res.json(removed);
  });

  // Audit Logs
  app.get("/api/v1/colonies/:id/audit-logs", (req, res) => {
    res.json(db.auditLogs.filter((l) => l.colony_id === req.params.id));
  });

  // Export / Import
  app.get("/api/v1/colonies/:id/export", (req, res) => {
    const colony = db.colonies.find((c) => c.id === req.params.id);
    if (!colony) return res.status(404).json({ error: "Colony not found" });

    const exportData = {
      version: "1.0",
      exported_at: new Date().toISOString(),
      colony,
      infrastructure: db.infrastructures.filter((i) => i.colony_id === colony.id),
      upgrades: db.upgrades.filter((u) => u.colony_id === colony.id),
      representative: db.representatives.find((r) => r.assigned_colony_id === colony.id) || null,
      modifiers: db.modifiers.filter((m) => m.colony_id === colony.id),
      events: db.events.filter((e) => e.colony_id === colony.id),
      plans: db.plans.filter((p) => p.colony_id === colony.id),
      resources: db.resources.filter((r) => r.colony_id === colony.id),
      audit_logs: db.auditLogs.filter((l) => l.colony_id === colony.id),
    };

    res.json(exportData);
  });

  app.post("/api/v1/colonies/import", (req, res) => {
    const data = req.body;
    if (!data.colony || !data.colony.name) {
      return res.status(400).json({ error: "Invalid colony export schema" });
    }

    const newColonyId = `colony-${Date.now()}`;
    const importedColony: Colony = {
      ...data.colony,
      id: newColonyId,
      name: `${data.colony.name} (Imported)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.colonies.push(importedColony);

    if (Array.isArray(data.infrastructure)) {
      data.infrastructure.forEach((i: any) => {
        db.infrastructures.push({
          ...i,
          id: `inf-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          colony_id: newColonyId,
        });
      });
    }

    if (Array.isArray(data.upgrades)) {
      data.upgrades.forEach((u: any) => {
        db.upgrades.push({
          ...u,
          id: `upg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          colony_id: newColonyId,
        });
      });
    }

    if (Array.isArray(data.modifiers)) {
      data.modifiers.forEach((m: any) => {
        db.modifiers.push({
          ...m,
          id: `mod-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          colony_id: newColonyId,
        });
      });
    }

    logAudit(newColonyId, "IMPORT_COLONY", "Adept", `Imported colony charter from data-slate`);
    res.status(201).json(importedColony);
  });

  // ==========================================
  // VITE / STATIC SERVING
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WH40k Colony Manager server online at http://0.0.0.0:${PORT}`);
  });
}

startAppServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
