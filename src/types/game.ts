export enum GameScreenState {
  TITLE_MENU = 'TITLE_MENU',
  PLAYING = 'PLAYING',
}

export enum ActiveBoardTab {
  STRATEGIC_MAP = 'STRATEGIC_MAP',
  PARLIAMENT_LAW = 'PARLIAMENT_LAW',
  CABINET_ECONOMY = 'CABINET_ECONOMY',
  ELECTION_PARTIES = 'ELECTION_PARTIES',
  NEWS_AUDIT = 'NEWS_AUDIT',
}

export enum PoliticalLayer {
  LIFE = 'LIFE',
  LAW = 'LAW',
  POWER = 'POWER',
  GOVERNANCE = 'GOVERNANCE',
}

export enum PlayerRole {
  CITIZEN = 'CITIZEN',
  LOCAL_ADMIN = 'LOCAL_ADMIN',
  PARTY_MEMBER = 'PARTY_MEMBER',
  MP_CANDIDATE = 'MP_CANDIDATE',
  MP_OPPOSITION = 'MP_OPPOSITION',
  MP_GOVERNMENT = 'MP_GOVERNMENT',
  OPPOSITION_LEADER = 'OPPOSITION_LEADER',
  PARTY_LEADER = 'PARTY_LEADER',
  MINISTER = 'MINISTER',
  PRIME_MINISTER = 'PRIME_MINISTER',
}

export enum CivilianCareer {
  PRIVATE_ANALYST = 'PRIVATE_ANALYST',
  CIVIL_SERVANT = 'CIVIL_SERVANT',
  LOCAL_ENTREPRENEUR = 'LOCAL_ENTREPRENEUR',
  CIVIC_ACTIVIST = 'CIVIC_ACTIVIST',
}

export enum EducationLevel {
  HIGH_SCHOOL = 'HIGH_SCHOOL',
  BACHELOR = 'BACHELOR',
  MASTER = 'MASTER',
  DOCTORATE = 'DOCTORATE',
}

export enum BillStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  FIRST_READING = 'FIRST_READING',
  COMMITTEE_REVIEW = 'COMMITTEE_REVIEW',
  SECOND_READING = 'SECOND_READING',
  THIRD_READING = 'THIRD_READING',
  SENATE_PROCESS = 'SENATE_PROCESS',
  FINAL_APPROVAL = 'FINAL_APPROVAL',
  PROMULGATED = 'PROMULGATED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
  RETURNED = 'RETURNED',
}

export enum FactCheckStatus {
  VERIFIED_FACT = 'VERIFIED_FACT',
  CLAIM = 'CLAIM',
  UNVERIFIED_INFO = 'UNVERIFIED_INFO',
}

export enum ScenarioId {
  MODERN_THAILAND = 'MODERN_THAILAND',
  ELECTION_CAMPAIGN = 'ELECTION_CAMPAIGN',
  COALITION_CRISIS = 'COALITION_CRISIS',
  MINORITY_GOV = 'MINORITY_GOV',
  NEW_CONSTITUTION = 'NEW_CONSTITUTION',
  SANDBOX = 'SANDBOX',
}

export enum FinancialLedgerType {
  NONE = 'NONE',
  PERSONAL = 'PERSONAL',
  PARTY = 'PARTY',
  STATE = 'STATE',
}

export type RegionId = 'NORTH' | 'NORTHEAST' | 'CENTRAL' | 'EAST' | 'WEST' | 'SOUTH';

export interface ConstitutionRuleset {
  name: string;
  version: string;
  isSandbox: boolean;
  totalSeats: number;
  constituencySeats: number;
  partyListSeats: number;
  maxCabinetMinisters: number;
  pmMaxCumulativeYears: number;
  pmNominationPartySeatThresholdPct: number;
  voterMinAge: number;
  mpMinAge: number;
  ministerMinAge: number;
  pmMinAge: number;
  normalPartyMembershipDays: number;
  dissolutionPartyMembershipDays: number;
  requireBirthThaiNationality: boolean;
  amendmentSupermajorityPct: number;
  senateApprovalRequiredForAmendment: boolean;
  termLengthMonths: number;
}

export interface PersonalFinances {
  cash: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  businessAssets: number;
  personalDebt: number;
}

export interface StateFinances {
  annualBudgetTotalMillion: number; // e.g., 3,000,000 Million THB
  taxRevenueMillion: number;
  expenditureMillion: number;
  publicDebtGDPPct: number;
  budgetBalanceMillion: number;
  centralReserveMillion: number;
}

export interface PlayerCharacter {
  name: string;
  ageYears: number;
  ageDaysRemainder: number;
  birthThaiNational: boolean;
  thaiNational: boolean;
  education: EducationLevel;
  homeRegion: RegionId;
  civilianCareer: CivilianCareer;
  role: PlayerRole;
  isMP: boolean;
  mpType: 'NONE' | 'CONSTITUENCY' | 'PARTY_LIST';
  partyId: string | null;
  partyJoinDayTick: number | null;
  isPartyExecutive: boolean;
  isPartyLeader: boolean;
  assignedMinistryId: string | null;
  cumulativePMDays: number;
  // 4 Dimensions
  health: number; // 0-100
  familyHarmony: number; // 0-100
  socialReputation: number; // 0-100
  networkStrength: number; // 0-100
  personalApproval: number; // 0-100
  politicalExperience: number; // 0-100
  integrityScore: number; // 0-100
  scandalRisk: number; // 0-100 (reaches 100% -> triggers Public Investigation)
  legalDisqualified: boolean;
  disqualificationReason: string | null;
  disqualificationUntilTick: number | null;
  activeInvestigations: number;
  finances: PersonalFinances;
}

export interface NPCPersonality {
  name: string;
  age: number;
  ambition: number;
  loyalty: number;
  negotiation: number;
  leadership: number;
  integrity: number;
  riskTolerance: number;
  policyKnowledge: number;
}

export interface PoliticalIdeology {
  economicAxis: number; // -100 Welfare/Populist to +100 Free-Market/Capital
  governanceAxis: number; // -100 Conservative/Traditional to +100 Reformist/Decentralized
  label: string;
  keyPolicies: string[];
}

export interface PoliticalParty {
  id: string;
  name: string;
  shortName: string;
  isMajor: boolean;
  color: string;
  logoFile?: string; // e.g. 'pty_01.svg' inside /public/assets/party-logos/
  leader: NPCPersonality;
  pmCandidates: string[];
  ideology: PoliticalIdeology;
  nationalPopularity: number; // 0-100 relative weight
  regionalStrength: Record<RegionId, number>; // multiplier 0.4 - 2.2
  constituencySeats: number;
  partyListSeats: number;
  totalSeats: number;
  partyFundsMillion: number;
  internalUnity: number; // 0-100
  publicReputation: number; // 0-100
  inCoalition: boolean;
  trustWithPlayer: number; // 0-100
  cabinetSatisfaction: number; // 0-100
  allocatedMinistries: string[];
  legalStatus: 'ACTIVE' | 'UNDER_REVIEW' | 'DISSOLVED';
}

export interface Ministry {
  id: string;
  name: string;
  shortName: string;
  mission: string;
  category: 'ECONOMIC' | 'SOCIAL' | 'SECURITY' | 'INFRASTRUCTURE' | 'GOVERNANCE';
  ministerPartyId: string | null;
  ministerName: string;
  isPlayerMinister: boolean;
  budgetSharePct: number; // sums with central reserve to 100%
  allocatedMillion: number;
  performanceScore: number; // 0-100
}

export interface LegislativeBill {
  id: string;
  title: string;
  category: 'ECONOMIC' | 'SOCIAL' | 'GOVERNANCE' | 'CONSTITUTIONAL' | 'BUDGET';
  description: string;
  proposerName: string;
  proposerPartyId: string;
  status: BillStatus;
  submittedTick: number;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  effectsSummary: string;
  constitutionalChange?: Partial<ConstitutionRuleset>;
  economicImpact?: {
    gdpGrowthDelta?: number;
    approvalDelta?: number;
    inequalityDelta?: number;
    stateCostMillion?: number;
  };
}

export interface RegionData {
  id: RegionId;
  name: string;
  provincesCount: number;
  sampleProvinces: string[];
  populationMillion: number;
  constituencySeats: number;
  localEconomyScore: number; // 0-100
  infrastructureScore: number; // 0-100
  environmentScore: number; // 0-100
  govApproval: number; // 0-100
  dominantPartyId: string;
  activeCrisis: string | null;
  chaosScore: number; // 0-100
  chaosTrend: number[]; // Last 4 weeks
}

export interface VoterDemographic {
  id: string;
  name: string;
  populationSharePct: number;
  avgMonthlyIncomeTHB: number;
  topConcern: string;
  govSatisfaction: number; // 0-100
  playerSupport: number; // 0-100
}

export interface EconomicIndicators {
  gdpGrowthPct: number;
  inflationPct: number;
  unemploymentPct: number;
  publicDebtGDPPct: number;
  taxRevenueGrowthPct: number;
  householdIncomeIndex: number; // baseline 100
  privateInvestmentIndex: number; // baseline 100
  exportGrowthPct: number;
  importGrowthPct: number;
  consumerConfidence: number; // 0-100
  qualityOfLifeIndex: number; // 0-100
  inequalityGini: number; // 0.30 - 0.55
}

export interface EconomicHistoryPoint {
  turn: number;
  label: string;
  gdpGrowthPct: number;
  inflationPct: number;
  unemploymentPct: number;
  govApproval: number;
  governmentStability: number;
}

export interface PolicyCard {
  id: string;
  title: string;
  layer: PoliticalLayer;
  categoryLabel: string;
  isAggressive?: boolean;
  apCost: number;
  ledgerType: FinancialLedgerType;
  moneyCost: number; // THB if PERSONAL, Million THB if PARTY or STATE
  requiredRoles: PlayerRole[];
  minPartyDays?: number;
  requiresParliamentOpen?: boolean;
  legalBasis: string;
  description: string;
  effectPreview: string;
  effects: {
    personalCashDelta?: number;
    personalIncomeDelta?: number;
    reputationDelta?: number;
    networkDelta?: number;
    personalApprovalDelta?: number;
    experienceDelta?: number;
    integrityDelta?: number;
    scandalRiskDelta?: number;
    healthDelta?: number;
    partyPopularityDelta?: number;
    partyUnityDelta?: number;
    partyFundsMillionDelta?: number;
    govStabilityDelta?: number;
    frictionDelta?: number;
    gdpGrowthDelta?: number;
    inflationDelta?: number;
    unemploymentDelta?: number;
    consumerConfidenceDelta?: number;
    qolDelta?: number;
    regionalApprovalDelta?: number;
    specialAction?:
      | 'JOIN_SELECTED_PARTY'
      | 'RUN_LOCAL_ELECTION'
      | 'REGISTER_MP_CANDIDATE'
      | 'CHALLENGE_PARTY_LEADER'
      | 'FOUND_NEW_PARTY'
      | 'PROPOSE_WELFARE_BILL'
      | 'PROPOSE_TRANSPARENCY_BILL'
      | 'PROPOSE_INFRASTRUCTURE_BILL'
      | 'PROPOSE_CONSTITUTION_AMENDMENT'
      | 'CALL_CENSURE_DEBATE'
      | 'COALITION_NEGOTIATE_MODAL'
      | 'DISSOLVE_PARLIAMENT';
  };
}

export type EventTargetRegionScope =
  | 'HOME_REGION'
  | 'LOWEST_APPROVAL_REGION'
  | 'LOWEST_ECONOMY_REGION'
  | RegionId;

export interface StoryArcDecisionLog {
  chainId: string;
  chainTitle: string;
  episodeNumber: number;
  totalEpisodes: number;
  eventId: string;
  eventTitle: string;
  choiceId: string;
  choiceLabel: string;
  outcomeSummary: string;
  turn: number;
  dateLabel: string;
  targetRegionId?: RegionId;
}

export interface NarrativeChoice {
  id: string;
  label: string;
  requirementText?: string;
  requiredFlag?: string;
  requiredFlagHint?: string;
  ledgerType: FinancialLedgerType;
  cost: number;
  outcomeSummary: string;
  setFlag?: string;
  newsHeadline?: string;
  newsFactStatus?: FactCheckStatus;
  effects: {
    personalCashDelta?: number;
    reputationDelta?: number;
    personalApprovalDelta?: number;
    integrityDelta?: number;
    scandalRiskDelta?: number;
    govStabilityDelta?: number;
    frictionDelta?: number;
    gdpGrowthDelta?: number;
    inflationDelta?: number;
    consumerConfidenceDelta?: number;
    partyTrustDelta?: number;
    partyUnityDelta?: number;
    partyPopularityDelta?: number;
    coalitionSatisfactionDelta?: number;
    targetRegionApprovalDelta?: number;
    targetRegionEconomyDelta?: number;
    targetRegionInfrastructureDelta?: number;
    targetRegionPartyStrengthDelta?: number;
    setRegionalCrisis?: string | null;
    triggerInvestigation?: boolean;
    publicInquiryPenalty?:
      | 'SACRIFICE_CABINET_POST'
      | 'SLASH_MINISTRY_BUDGET'
      | 'DEFY_PUBLIC_INQUIRY';
  };
}

export interface NarrativeEvent {
  id: string;
  category: 'LIFE' | 'POLITICAL' | 'ECONOMIC' | 'DISASTER' | 'LEGAL';
  title: string;
  severity: number;
  description: string;
  contextQuote: string;
  // Multi-part Story Chain Metadata
  chainId?: string;
  chainTitle?: string;
  episodeNumber?: number;
  totalEpisodes?: number;
  minTurnsAfterPreviousEpisode?: number;
  // Role, Flag & Parliamentary Prerequisites
  requiredRoles?: PlayerRole[];
  requiresPartyMembership?: boolean;
  requiresParliamentActive?: boolean;
  requiredFlag?: string;
  requiredFlagsAny?: string[];
  excludedFlag?: string;
  minTurn?: number;
  // Real Economic, Political & 6-Region Causal Triggers
  targetRegionScope?: EventTargetRegionScope;
  maxRegionalApproval?: number;
  maxRegionalEconomy?: number;
  maxRegionalInfrastructure?: number;
  minFriction?: number;
  maxGovStability?: number;
  maxGdpGrowthPct?: number;
  minInflationPct?: number;
  maxConsumerConfidence?: number;
  maxMonthsUntilElection?: number;
  // Runtime-bound live context when event triggers
  boundTargetRegionId?: RegionId;
  liveTriggerSummary?: string;
  choices: NarrativeChoice[];
}

export interface NewsItem {
  id: string;
  eventId: string;
  tick: number;
  dateLabel: string;
  category: 'การเมือง' | 'รัฐสภา' | 'เศรษฐกิจ' | 'ตรวจสอบภาครัฐ' | 'ภัยพิบัติและสังคม';
  headline: string;
  summary: string;
  factStatus: FactCheckStatus;
  sourceName: string;
}

export interface AuditLogEntry {
  id: string;
  tick: number;
  dateLabel: string;
  layer: PoliticalLayer;
  actor: string;
  action: string;
  legalAuthority: string;
  outcome: string;
}

export interface ElectionResultRecord {
  electionNumber: number;
  tick: number;
  dateLabel: string;
  turnoutPct: number;
  invalidBallotsPct: number;
  certifiedByECT: boolean;
  quotaPerPartyListSeat: number;
  totalValidPartyListVotes: number;
  partyBreakdowns: {
    partyId: string;
    partyName: string;
    partyListVotes: number;
    constituencySeats: number;
    partyListSeats: number;
    totalSeats: number;
  }[];
}

export interface IndependentAgencyCase {
  id: string;
  agency: 'กกต.' | 'ป.ป.ช.' | 'ศาลรัฐธรรมนูญ' | 'สตง.';
  targetName: string;
  subject: string;
  status: 'PENDING' | 'CLEARED' | 'SANCTIONED';
  openedTick: number;
  legalBasis: string;
}

export type AchievementCategory = 'ELECTION' | 'GOVERNANCE' | 'INTEGRITY' | 'CAREER';

export type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface UnlockedAchievementRecord {
  id: string;
  unlockedTurn: number;
  unlockedDateLabel: string;
  roleAtUnlock: PlayerRole;
}

export interface CareerStatsTracker {
  budgetAdjustmentsCount: number;
  electionsWonCount: number;
  localElectionsWonCount: number;
  billsProposedCount: number;
  coalitionsFormedCount: number;
  everInvestigated: boolean;
  monthsInPublicOffice: number;
}

export interface GameState {
  screen: GameScreenState;
  activeTab: ActiveBoardTab;
  scenario: ScenarioId;
  turn: number; // 1 Turn = 1 Month
  dayTick: number; // 1 Tick = 1 Day (starts at 1, +7 per weekly turn)
  weekInMonth: number; // 1-4
  yearBE: number; // e.g., 2569
  monthIndex: number; // 0-11
  currentMonthHeadlines: string[]; // Stores 4 headlines for monthly summary
  actionPoints: number;
  maxActionPoints: number;
  constitution: ConstitutionRuleset;
  player: PlayerCharacter;
  parties: PoliticalParty[];
  ministries: Ministry[];
  bills: LegislativeBill[];
  regions: RegionData[];
  demographics: VoterDemographic[];
  economy: EconomicIndicators;
  stateFinances: StateFinances;
  economicHistory: EconomicHistoryPoint[];
  // Parliament & Government status
  parliamentStatus: 'ACTIVE' | 'DISSOLVED_CARETAKER' | 'COALITION_FORMATION';
  monthsUntilElection: number;
  isDissolutionElection: boolean;
  primeMinisterName: string;
  primeMinisterPartyId: string | null;
  coalitionSeatCount: number;
  oppositionSeatCount: number;
  governmentStability: number; // 0-100
  politicalFrictionIndex: number; // 0-100
  lastQuorumPresent: number; // out of 500
  // Cards & Narrative
  handCardIds: string[];
  playedThisTurnIds: string[];
  activeNarrativeEvent: NarrativeEvent | null;
  resolvedEventIds: string[];
  storyFlags: string[];
  storyArcHistory: StoryArcDecisionLog[];
  chainLastResolvedTurn: Record<string, number>;
  // Logs, News, Agencies & Elections
  newsFeed: NewsItem[];
  auditLog: AuditLogEntry[];
  agencyCases: IndependentAgencyCase[];
  lastElectionResult: ElectionResultRecord | null;
  // Career Achievements & Progression Stats
  unlockedAchievements: UnlockedAchievementRecord[];
  careerStats: CareerStatsTracker;
  selectedRegionId: RegionId;
  selectedPartyIdForAction: string;
  soundEnabled: boolean;
}

export interface SaveSlotMetadata {
  slotId: string;
  slotName: string;
  savedAtISO: string;
  playerName: string;
  roleLabel: string;
  turn: number;
  dateLabel: string;
  scenario: ScenarioId;
  achievementsCount?: number;
}
