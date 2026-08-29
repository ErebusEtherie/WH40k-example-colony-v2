export type StatName = 'complacency' | 'order' | 'productivity' | 'piety' | 'size' | 'profit_factor';

export type ColonyTypeKey = 'research_mission' | 'mining_and_industry' | 'ecclesiastical' | 'agricultural';

export type HardInfrastructureTypeKey = 'transport' | 'power' | 'water' | 'food_production' | 'communications';

export type HardInfrastructureStatus = 'working' | 'not_working' | 'in_progress' | 'needed';

export type SupportUpgradeTypeKey = 
  | 'arbites_precinct'
  | 'ecclesiarchy_mission'
  | 'mechanicum_station'
  | 'infantry_garrison'
  | 'imperial_navy_station'
  | 'cultural_improvement'
  | 'industrial_facility'
  | 'personal_lodgings'
  | 'contacts'
  | 'trappings';

export type SupportUpgradeStatus = 'working' | 'not_working' | 'in_progress';

export type PlanStatus = 'planning' | 'in_progress';

export type RepresentativeTypeKey = 
  | 'satrap'
  | 'judge'
  | 'cardinal'
  | 'colonist_representative'
  | 'military_commander'
  | 'dynasty_member';

export type ModifierCategory = 'permanent' | 'conditional' | 'custom';

export interface ModifierItem {
  id: string;
  name: string;
  stat: StatName;
  value: number;
  source: string;
  category: ModifierCategory;
  isActive?: boolean;
  dateApplied?: string;
  notes?: string;
}

export interface PlanetaryResource {
  id: string;
  name: string;
  type: string;
  subtype?: string;
  abundance: 'Scarce' | 'Moderate' | 'Plentiful' | 'Abundant' | 'Rich';
  notes?: string;
}

export interface HardInfrastructureItem {
  id: string;
  name: string;
  type: HardInfrastructureTypeKey;
  status: HardInfrastructureStatus;
  notes: string;
}

export interface SupportUpgradeItem {
  id: string;
  name: string;
  type: SupportUpgradeTypeKey;
  status: SupportUpgradeStatus;
  notes: string;
  chosenStat?: StatName; // For Cultural Improvement
  contactCount?: number; // 1-5 for Contacts
  contactDetails?: string; // For Contacts
}

export interface DevelopmentPlanItem {
  id: string;
  name: string;
  category: 'hard_infrastructure' | 'support_upgrade';
  type: HardInfrastructureTypeKey | SupportUpgradeTypeKey;
  priority: number; // integer 1-10
  status: PlanStatus; // 'planning' | 'in_progress'
  description: string;
  progress: string;
  chosenStat?: StatName;
}

export interface RepresentativeCharacteristics {
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

export interface RepresentativePersonalitySelection {
  personalityKey: string;
  chosenStat?: StatName; // for Scholarly, Ties With...
  madOrderRoll?: number; // 1-5 physical roll result for Mad
  dynastyOutcome?: string; // For Dynasty Member nepotism outcome
}

export interface Representative {
  id: string;
  name: string;
  type: RepresentativeTypeKey;
  personalities: RepresentativePersonalitySelection[];
  characteristics: RepresentativeCharacteristics;
  skills: string[];
  talents: string[];
  dynastyNepotismRoll?: number; // 1-100 physical roll
  dynastyOutcomeKey?: string;
  assignedColonyId?: string | null;
}

export interface Colony {
  id: string;
  name: string;
  starSystem: string;
  colonyType: ColonyTypeKey;
  founder: string;
  description?: string;
  ageDays: number;
  representativeId: string | null;
  planetaryResources: PlanetaryResource[];
  hardInfrastructure: HardInfrastructureItem[];
  supportUpgrades: SupportUpgradeItem[];
  developmentPlans: DevelopmentPlanItem[];
  customModifiers: ModifierItem[];
  culturalImprovementStat?: StatName; // From free ecclesiastical upgrade
}

export interface StatCalculation {
  stat: StatName;
  baseValue: number;
  modifiers: ModifierItem[];
  total: number;
  finalValue: number;
  loreState: string;
  loreLabel: string;
  isCrisis: boolean;
  isPositive: boolean;
}

export interface ColonyCalculations {
  size: StatCalculation;
  sizeLoreLabel: string; // e.g. "Freehold (3)"
  complacency: StatCalculation;
  order: StatCalculation;
  productivity: StatCalculation;
  piety: StatCalculation;
  profitFactor: {
    baseFromSize: number;
    stateBonuses: { name: string; value: number }[];
    modifiers: ModifierItem[];
    total: number;
  };
  activeStateBadges: { stat: StatName; state: string; label: string; type: 'positive' | 'crisis' | 'stable' }[];
}

export type AppTheme = 
  | 'mechanicus_amber'
  | 'canonical_mechanicum'
  | 'darktide_forge'
  | 'void_cyan'
  | 'inquisition_crimson'
  | 'auspex_emerald'
  | 'vellum_parchment';

export interface ThemeConfig {
  id: AppTheme;
  name: string;
  subtitle: string;
  description: string;
  badge: string;
  badgeColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgMain: string;
  previewColors: string[];
}

export type AccessibilityPalette = 'mechanicus' | 'high_contrast' | 'protanopia' | 'tritanopia';
export type ColorPalette = AccessibilityPalette;
export type FontSizeSetting = 'standard' | 'large' | 'xlarge';
export type NavTab = 'at_a_glance' | 'colony_details' | 'representative' | 'infrastructure';

export type CustomModifierItem = ModifierItem;
export type RepresentativePersonalityItem = RepresentativePersonalitySelection;
export type PersonalityKey = 
  | 'beloved'
  | 'military_minded'
  | 'corrupt'
  | 'idle'
  | 'ambitious'
  | 'zealous'
  | 'patron_of_the_arts'
  | 'unlucky'
  | 'ties_with'
  | 'administrative_expert'
  | 'cruel'
  | 'spymaster'
  | 'generalissimo'
  | 'paranoid'
  | 'mad'
  | 'charitable'
  | 'vainglorious'
  | 'scholarly'
  | 'avaricious'
  | 'quite_a_character';

// API Create/Update types for mutations
export type ColonyCreate = Partial<Colony>;
export type ColonyUpdate = Partial<Colony>;
export type RepresentativeCreate = Partial<Representative>;
export type Modifier = ModifierItem;
export type ModifierCreate = Partial<ModifierItem>;

// ==================== AUTH TYPES ====================

export type UserRole = 'admin' | 'user' | 'viewer';

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
