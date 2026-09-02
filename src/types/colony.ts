export type ColonyType =
  | "research_mission"
  | "mining_and_industry"
  | "ecclesiastical"
  | "agricultural"
  | "military_outpost"
  | "penal_colony"
  | "feudal_world"
  | "pleasure_planet";

export type ModifierStat =
  | "size"
  | "complacency"
  | "order"
  | "productivity"
  | "piety"
  | "profit_factor";

export type ColonyStatKey = ModifierStat;
export type InfrastructureType = string;
export type UpgradeType = string;
export type RepresentativeType = string;

export type InfrastructureState = "in_progress" | "working" | "not_working" | "needed";

export type UserRole = "admin" | "colony_manager" | "viewer";

export interface Characteristics {
  ws: number;
  bs: number;
  s: number;
  t: number;
  ag: number;
  int: number;
  per: number;
  wp: number;
  fel: number;
}

export interface StatContribution {
  source: string;
  sourceType?: "base" | "perm" | "custom" | "state_bonus" | "rep";
  value: number;
  description?: string;
}

export interface StatBreakdown {
  base: number;
  modifiersTotal: number;
  final: number;
  isLocked: boolean;
  lockReason?: string;
  contributions: StatContribution[];
}

export interface ColonyStatsBreakdown {
  size: StatBreakdown;
  complacency: StatBreakdown;
  order: StatBreakdown;
  productivity: StatBreakdown;
  piety: StatBreakdown;
  profitFactor: {
    baseFromSize: number;
    placatedBonus: number;
    productiveBonus: number;
    orderlyBonus: number;
    specialtyBonus?: number;
    leadershipModifier: number;
    modifiersTotal: number;
    penaltyMultiplier: number; // 0 for anarchy, 0.5 for halted, 1 for normal
    final: number;
    contributions?: StatContribution[];
  };
  states: {
    isPlacated: boolean;
    isProductive: boolean;
    isOrderly: boolean;
    isPious: boolean;
    hasAnarchy: boolean;
    isHalted: boolean;
    hasRiots: boolean;
    isHeretical: boolean;
  };
}

export interface Modifier {
  id: string;
  colony_id: string;
  name: string;
  modifier_stat: ModifierStat;
  modifier_value: number;
  source: string;
  is_active: boolean;
  description?: string;
  created_at?: string;
}

export interface Infrastructure {
  id: string;
  colony_id: string;
  infrastructure_type: string;
  name: string;
  state: InfrastructureState;
  installed_at?: string;
  notes?: string;
  active_effects?: { stat: string; value: number }[];
}

export interface SupportUpgrade {
  id: string;
  colony_id: string;
  upgrade_type: string;
  name: string;
  state?: InfrastructureState;
  chosen_stat?: ModifierStat;
  custom_product?: string;
  installed_at?: string;
  notes?: string;
  description?: string;
  mechanical_description?: string;
}

export interface RepresentativeTrait {
  id: string;
  name: string;
  stat_tag?: string;
  description: string;
  effect: string;
}

export interface Representative {
  id: string;
  name: string;
  title: string;
  representative_type: string;
  theme?: string;
  personality: string;
  personality_traits?: RepresentativeTrait[];
  characteristics?: Characteristics;
  skills?: string[];
  talents?: string[];
  special_mechanics?: string;
  assigned_colony_id?: string | null;
  stat_bonus: number; // 2-6
  notes?: string;
  created_at?: string;
}

export interface ColonyEvent {
  id: string;
  colony_id: string;
  event_name: string;
  event_type: "cycle" | "crisis" | "gm_ruling" | "development" | "narrative";
  description: string;
  effects_applied?: string;
  created_at?: string;
}

export interface DevelopmentPlan {
  id: string;
  colony_id: string;
  name: string;
  category?: "Hard Infrastructure" | "Support Upgrade" | "Specialty Project";
  target_category?: string;
  specific_type?: string;
  target_stat?: ModifierStat;
  target_value?: number;
  priority_rank?: number; // 1-10
  progress_percent?: number;
  progress_details?: string;
  progress_points?: number;
  required_points?: number;
  status: "active" | "in_progress" | "planning" | "completed" | "abandoned";
  description?: string;
}

export interface ColonyResource {
  id: string;
  colony_id: string;
  resource_type: string;
  category?: string;
  subtype?: string;
  abundance?: "Scarce" | "Moderate" | "Abundant" | "Plentiful" | "Rich";
  name: string;
  productivity_bonus: number;
  pf_bonus: number;
  description?: string;
}

export interface AuditLog {
  id: string;
  colony_id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  old_value?: string;
  new_value?: string;
}

export interface Colony {
  id: string;
  name: string;
  star_system?: string;
  colony_type: ColonyType;
  base_size: number;
  base_complacency: number;
  base_order: number;
  base_productivity: number;
  base_piety: number;
  founder_id?: string;
  founder_name?: string;
  founding_days?: number;
  quote?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface OpticsSettings {
  theme?: "theme-grimdark" | "theme-mechanicus" | "theme-inquisition" | string;
  high_contrast?: boolean;
  large_text?: boolean;
  dyslexia_font?: boolean;
  crt_flicker?: boolean;
  audio_chimes?: boolean;
  dyslexicFont?: boolean;
  highContrast?: boolean;
  colorBlindMode?: "default" | "monochrome" | "deuteranopia" | "tritanopia";
  displayScale?: "100" | "115" | "130";
}

