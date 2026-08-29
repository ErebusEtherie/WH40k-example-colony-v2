/**
 * WH40k Colony Manager In-Memory & Persistent Storage
 * Modeled directly from the Python backend repositories and SQLAlchemy schema.
 */

import bcrypt from 'bcryptjs';

export interface UserEntity {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'lord_captain' | 'game_master' | 'scribe' | 'admin' | 'viewer';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ColonyEntity {
  id: number;
  name: string;
  owner: string;
  colony_type: string;
  age_days: number;
  age_last_updated: string;
  current_event: string | null;
  base_complacency: number;
  base_order: number;
  base_productivity: number;
  base_piety: number;
  base_size: number;
  representative_id: number | null;
  dynasty_outcome: string | null;
  complacency_locked: boolean;
  order_locked: boolean;
  productivity_locked: boolean;
  planetary_resources: string | null; // JSON string array
  cultural_improvement_stat?: string;
  description?: string;
  star_system?: string;
}

export interface RepresentativeEntity {
  id: number;
  name: string;
  type: string;
  personalities: string; // JSON
  stats: string; // JSON characteristics
  skills: string; // JSON string array
  talents: string; // JSON string array
  assigned_to_colony_id: number | null;
  dynasty_nepotism_roll?: number;
  dynasty_outcome_key?: string;
}

export interface ModifierEntity {
  id: number;
  colony_id: number;
  modifier_source_type: string;
  modifier_category: 'permanent' | 'conditional' | 'custom';
  modifier_stat: string;
  modifier_value: number;
  modifier_description: string;
  is_active: boolean;
  expires_at: string | null;
}

export interface InfrastructureEntity {
  id: number;
  colony_id: number;
  infrastructure_type: string;
  state: 'working' | 'not_working' | 'in_progress' | 'needed';
  notes: string;
}

export interface SupportUpgradeEntity {
  id: number;
  colony_id: number;
  upgrade_type: string;
  custom_stat_choice: string | null;
  custom_product: string | null;
  affiliated_group: string | null;
  status: 'working' | 'not_working' | 'in_progress';
  notes: string;
}

export interface DevelopmentPlanEntity {
  id: number;
  colony_id: number;
  upgrade_type: string;
  target_type: string;
  target_name: string;
  priority: number;
  status: 'planning' | 'in_progress';
  description: string;
  progress: string;
  created_by: number;
  created_at: string;
}

export interface EventEntity {
  id: number;
  colony_id: number;
  name: string;
  description: string;
  created_by: number;
  created_at: string;
  is_active: boolean;
}

export interface ResourceEntity {
  id: number;
  colony_id: number;
  resource_type: string;
  name: string;
  abundance: number;
  notes: string;
  discovered_date: string;
}

export interface AuditLogEntity {
  id: number;
  colony_id: number | null;
  user_id: number;
  action: string;
  target_type: string;
  target_id: string;
  details: string;
  timestamp: string;
}

// In-Memory Database Class with thread-safe ID counters
class Database {
  users: UserEntity[] = [];
  colonies: ColonyEntity[] = [];
  representatives: RepresentativeEntity[] = [];
  modifiers: ModifierEntity[] = [];
  infrastructure: InfrastructureEntity[] = [];
  support_upgrades: SupportUpgradeEntity[] = [];
  development_plans: DevelopmentPlanEntity[] = [];
  events: EventEntity[] = [];
  resources: ResourceEntity[] = [];
  audit_logs: AuditLogEntity[] = [];
  tokenBlacklist: Set<string> = new Set();

  private userSeq = 1;
  private colonySeq = 1;
  private repSeq = 1;
  private modSeq = 1;
  private infraSeq = 1;
  private supSeq = 1;
  private planSeq = 1;
  private eventSeq = 1;
  private resSeq = 1;
  private logSeq = 1;

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    // 1. Seed Default Administrator & Lord Captain Users
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('Password123!', salt);

    this.users.push({
      id: this.userSeq++,
      username: 'lord_captain',
      email: 'captain@vonvalancius.com',
      password_hash: passwordHash,
      role: 'lord_captain',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    this.users.push({
      id: this.userSeq++,
      username: 'game_master',
      email: 'gm@imperium.org',
      password_hash: passwordHash,
      role: 'game_master',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 2. Seed Default Representatives
    const rep1: RepresentativeEntity = {
      id: this.repSeq++,
      name: 'Arch-Satrap Alexis Valancius',
      type: 'satrap',
      personalities: JSON.stringify([
        { personalityKey: 'scholarly', chosenStat: 'productivity' },
        { personalityKey: 'firm_hand' },
      ]),
      stats: JSON.stringify({
        ws: 35,
        bs: 40,
        s: 30,
        t: 38,
        ag: 35,
        int: 52,
        per: 45,
        wp: 48,
        fel: 55,
      }),
      skills: JSON.stringify(['Commerce', 'Scholastic Lore (Imperial Bureaucracy)', 'Logic', 'Deceive']),
      talents: JSON.stringify(['Peer (Nobility)', 'Air of Authority', 'Master Orator']),
      assigned_to_colony_id: 1,
    };

    const rep2: RepresentativeEntity = {
      id: this.repSeq++,
      name: 'Magos Dominus Cassian-7',
      type: 'colonist_representative',
      personalities: JSON.stringify([
        { personalityKey: 'religious' },
        { personalityKey: 'stubborn' },
      ]),
      stats: JSON.stringify({
        ws: 28,
        bs: 45,
        s: 42,
        t: 50,
        ag: 25,
        int: 60,
        per: 40,
        wp: 52,
        fel: 22,
      }),
      skills: JSON.stringify(['Tech-Use', 'Logic', 'Common Lore (Machine Cult)', 'Security']),
      talents: JSON.stringify(['Machinator Array', 'Electro-Graft Use', 'Binary Voice']),
      assigned_to_colony_id: 2,
    };

    const rep3: RepresentativeEntity = {
      id: this.repSeq++,
      name: 'Canoness Martha the Vindicated',
      type: 'cardinal',
      personalities: JSON.stringify([
        { personalityKey: 'zealous' },
        { personalityKey: 'inspirational' },
      ]),
      stats: JSON.stringify({
        ws: 42,
        bs: 38,
        s: 36,
        t: 40,
        ag: 32,
        int: 45,
        per: 38,
        wp: 58,
        fel: 50,
      }),
      skills: JSON.stringify(['Common Lore (Ecclesiarchy)', 'Scholastic Lore (Imperial Creed)', 'Charm', 'Command']),
      talents: JSON.stringify(['Pure Faith', 'Hatred (Heretics)', 'Radiant Aura']),
      assigned_to_colony_id: 3,
    };

    this.representatives.push(rep1, rep2, rep3);

    // 3. Seed Default Colonies
    const colony1: ColonyEntity = {
      id: this.colonySeq++,
      name: 'Dargonus Prime Apex',
      owner: 'Von Valancius Dynasty',
      colony_type: 'mining_and_industry',
      star_system: 'Mundus Valancius',
      description: 'The primary administrative seat and industrial core world of the Von Valancius Dynasty.',
      age_days: 1420,
      age_last_updated: new Date().toISOString().split('T')[0],
      current_event: null,
      base_complacency: 2,
      base_order: 3,
      base_productivity: 5,
      base_piety: 2,
      base_size: 4,
      representative_id: 1,
      dynasty_outcome: null,
      complacency_locked: false,
      order_locked: false,
      productivity_locked: false,
      planetary_resources: JSON.stringify([
        { id: 'res_1', name: 'Adamantium Ore Veins', type: 'Mineral', abundance: 'Abundant', notes: 'Core deep-crust excavation complexes' },
        { id: 'res_2', name: 'Promethium Deep Reserves', type: 'Fuel / Energy', abundance: 'Plentiful', notes: 'Refined fuel exports' },
      ]),
    };

    const colony2: ColonyEntity = {
      id: this.colonySeq++,
      name: 'Vheabos VI Forge Station',
      owner: 'Adeptus Mechanicus Conclave',
      colony_type: 'research_mission',
      star_system: 'Vheabos Expanse',
      description: 'A secretive archeotech and plasma research sanctum governed under Mechanicum pacts.',
      age_days: 680,
      age_last_updated: new Date().toISOString().split('T')[0],
      current_event: null,
      base_complacency: 1,
      base_order: 4,
      base_productivity: 4,
      base_piety: 3,
      base_size: 3,
      representative_id: 2,
      dynasty_outcome: null,
      complacency_locked: false,
      order_locked: false,
      productivity_locked: false,
      planetary_resources: JSON.stringify([
        { id: 'res_3', name: 'Archeotech Datacores', type: 'Archeotech', abundance: 'Plentiful', notes: 'Untapped Pre-Heresy cogitator banks' },
      ]),
    };

    const colony3: ColonyEntity = {
      id: this.colonySeq++,
      name: 'Sanctus Thule Cathedral Reach',
      owner: 'Ecclesiarchy of the Expanse',
      colony_type: 'ecclesiastical',
      star_system: 'Grace of the Throne',
      description: 'A shrine world dedicated to the eternal praise of the God-Emperor and pilgrims.',
      age_days: 930,
      age_last_updated: new Date().toISOString().split('T')[0],
      current_event: null,
      base_complacency: 3,
      base_order: 3,
      base_productivity: 2,
      base_piety: 6,
      base_size: 3,
      representative_id: 3,
      dynasty_outcome: null,
      complacency_locked: false,
      order_locked: false,
      productivity_locked: false,
      cultural_improvement_stat: 'piety',
      planetary_resources: JSON.stringify([
        { id: 'res_4', name: 'Saint Katherine Sacred Water Spring', type: 'Organic', abundance: 'Moderate', notes: 'Blessed water holy site' },
      ]),
    };

    this.colonies.push(colony1, colony2, colony3);

    // 4. Seed Infrastructure
    const infraTypes = ['transport', 'power', 'water', 'food_production', 'communications'] as const;
    [colony1.id, colony2.id, colony3.id].forEach((cId) => {
      infraTypes.forEach((type) => {
        this.infrastructure.push({
          id: this.infraSeq++,
          colony_id: cId,
          infrastructure_type: type,
          state: 'working',
          notes: `Operational Imperial-grade standard ${type} network.`,
        });
      });
    });

    // 5. Seed Support Upgrades
    this.support_upgrades.push(
      {
        id: this.supSeq++,
        colony_id: 1,
        upgrade_type: 'arbites_precinct',
        custom_stat_choice: null,
        custom_product: null,
        affiliated_group: 'Adeptus Arbites',
        status: 'working',
        notes: 'Enforces Imperial Lex and suppresses sedition.',
      },
      {
        id: this.supSeq++,
        colony_id: 1,
        upgrade_type: 'industrial_facility',
        custom_stat_choice: null,
        custom_product: 'Heavy Munitions',
        affiliated_group: 'Manufactorum Guilds',
        status: 'working',
        notes: 'Manufactures macro-cannon shells and void armor plating.',
      },
      {
        id: this.supSeq++,
        colony_id: 2,
        upgrade_type: 'mechanicum_station',
        custom_stat_choice: null,
        custom_product: null,
        affiliated_group: 'Adeptus Mechanicus',
        status: 'working',
        notes: 'Plasma reactor containment & cogitation engine.',
      }
    );

    // 6. Seed Development Plans
    this.development_plans.push(
      {
        id: this.planSeq++,
        colony_id: 1,
        upgrade_type: 'support_upgrade',
        target_type: 'infantry_garrison',
        target_name: 'Imperial Guard Garrison Bastion',
        priority: 1,
        status: 'in_progress',
        description: 'Establishment of standard Kasrkin defense bunker perimeter.',
        progress: '65% complete (plasteel foundations poured)',
        created_by: 1,
        created_at: new Date().toISOString(),
      },
      {
        id: this.planSeq++,
        colony_id: 2,
        upgrade_type: 'support_upgrade',
        target_type: 'imperial_navy_station',
        target_name: 'Orbital Void Dock Spire',
        priority: 2,
        status: 'planning',
        description: 'Orbital dock for frigate repair and sensor relays.',
        progress: 'Planning & schematic sanctification phase',
        created_by: 1,
        created_at: new Date().toISOString(),
      }
    );

    // 7. Seed Custom Modifiers
    this.modifiers.push(
      {
        id: this.modSeq++,
        colony_id: 1,
        modifier_source_type: 'gm_ruling',
        modifier_category: 'custom',
        modifier_stat: 'order',
        modifier_value: 1,
        modifier_description: 'Lord Captain Warrant of Trade Imperial Mandate',
        is_active: true,
        expires_at: null,
      },
      {
        id: this.modSeq++,
        colony_id: 1,
        modifier_source_type: 'dynasty_edict',
        modifier_category: 'custom',
        modifier_stat: 'profit_factor',
        modifier_value: 2,
        modifier_description: 'Monopolized Cold Trade Smuggling Tariffs',
        is_active: true,
        expires_at: null,
      }
    );

    // 8. Seed Audit Log
    this.audit_logs.push({
      id: this.logSeq++,
      colony_id: 1,
      user_id: 1,
      action: 'COLONY_INITIALIZED',
      target_type: 'colony',
      target_id: '1',
      details: 'Colony Dargonus Prime Apex sanctified and initialized under Lex Imperialis.',
      timestamp: new Date().toISOString(),
    });
  }

  // Sequences
  nextUserId() { return this.userSeq++; }
  nextColonyId() { return this.colonySeq++; }
  nextRepId() { return this.repSeq++; }
  nextModId() { return this.modSeq++; }
  nextInfraId() { return this.infraSeq++; }
  nextSupId() { return this.supSeq++; }
  nextPlanId() { return this.planSeq++; }
  nextEventId() { return this.eventSeq++; }
  nextResId() { return this.resSeq++; }
  nextLogId() { return this.logSeq++; }
}

export const db = new Database();
