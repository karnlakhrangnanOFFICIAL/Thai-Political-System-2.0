import { NARRATIVE_EVENTS, POLICY_CARDS } from '../data/cardsAndStories';
import {
  createInitial57Parties,
  createInitialDemographics,
  createInitialMinistries,
  createInitialRegions,
  getDefaultConstitution,
} from '../data/initialData';
import {
  ActiveBoardTab,
  BillStatus,
  CivilianCareer,
  ConstitutionRuleset,
  EducationLevel,
  EventTargetRegionScope,
  FactCheckStatus,
  FinancialLedgerType,
  GameScreenState,
  GameState,
  NarrativeChoice,
  NarrativeEvent,
  PlayerRole,
  PolicyCard,
  PoliticalLayer,
  RegionData,
  RegionId,
  ScenarioId,
} from '../types/game';
import { formatThaiDate } from '../utils/storage';
import {
  DEFAULT_CAREER_STATS,
  ensureAchievementFields,
  isHoldingPublicOffice,
} from './achievementEngine';
import {
  advanceParliamentaryBills,
  assertAndRepairDataIntegrity,
  createAuditEntry,
  createSampleBill,
  runIndependentAgenciesTick,
  validateCardPlay,
} from './legalEngine';
import {
  allocateCabinetMinistries,
  executeNoConfidenceVote,
  runGeneralElection,
  updatePlayerParliamentaryRole,
} from './politicalEngine';

export interface CharacterInitOptions {
  name: string;
  ageYears: number;
  education: EducationLevel;
  homeRegion: RegionId;
  civilianCareer: CivilianCareer;
  scenario: ScenarioId;
  customConstitution?: Partial<ConstitutionRuleset>;
}

const CAREER_STARTING_STATS: Record<
  CivilianCareer,
  { monthlyIncome: number; monthlyExpenses: number; cash: number; reputation: number; network: number; experience: number }
> = {
  [CivilianCareer.PRIVATE_ANALYST]: {
    monthlyIncome: 38000,
    monthlyExpenses: 22000,
    cash: 120000,
    reputation: 50,
    network: 38,
    experience: 14,
  },
  [CivilianCareer.CIVIL_SERVANT]: {
    monthlyIncome: 26500,
    monthlyExpenses: 17500,
    cash: 100000,
    reputation: 54,
    network: 44,
    experience: 20,
  },
  [CivilianCareer.LOCAL_ENTREPRENEUR]: {
    monthlyIncome: 52000,
    monthlyExpenses: 31000,
    cash: 185000,
    reputation: 48,
    network: 50,
    experience: 10,
  },
  [CivilianCareer.CIVIC_ACTIVIST]: {
    monthlyIncome: 24000,
    monthlyExpenses: 16500,
    cash: 90000,
    reputation: 60,
    network: 48,
    experience: 22,
  },
};

export function createInitialGameState(opts: CharacterInitOptions): GameState {
  const baseConstitution = getDefaultConstitution(opts.scenario);
  const constitution: ConstitutionRuleset = {
    ...baseConstitution,
    ...(opts.customConstitution || {}),
  };
  constitution.totalSeats = constitution.constituencySeats + constitution.partyListSeats;

  const regions = createInitialRegions(constitution.constituencySeats);
  const parties = createInitial57Parties(constitution.constituencySeats, constitution.partyListSeats);
  const ministries = createInitialMinistries(3000000);
  const demographics = createInitialDemographics();
  const careerProfile = CAREER_STARTING_STATS[opts.civilianCareer];

  let monthsUntilElection = 14;
  let friction = 36;
  let stability = 68;

  if (opts.scenario === ScenarioId.ELECTION_CAMPAIGN) {
    monthsUntilElection = 4; // Gives player time to join party (>=90 days / 3 turns) & campaign!
  } else if (opts.scenario === ScenarioId.COALITION_CRISIS) {
    friction = 68;
    stability = 42;
    monthsUntilElection = 8;
  } else if (opts.scenario === ScenarioId.MINORITY_GOV) {
    // Set minority coalition
    parties.forEach((p) => {
      p.inCoalition = p.id === 'PTY_02' || p.id === 'PTY_03';
    });
    friction = 58;
    stability = 44;
    monthsUntilElection = 9;
  }

  const state: GameState = {
    screen: GameScreenState.PLAYING,
    activeTab: ActiveBoardTab.STRATEGIC_MAP,
    scenario: opts.scenario,
    turn: 1,
    dayTick: 1,
    weekInMonth: 1,
    yearBE: 2569,
    monthIndex: 0, // มกราคม
    currentMonthHeadlines: [],
    actionPoints: 3,
    maxActionPoints: 3,
    constitution,
    player: {
      name: opts.name.trim() || 'พลเมืองตัวอย่าง',
      ageYears: opts.ageYears,
      ageDaysRemainder: 0,
      birthThaiNational: true,
      thaiNational: true,
      education: opts.education,
      homeRegion: opts.homeRegion,
      civilianCareer: opts.civilianCareer,
      // Always start as a Citizen per confirmed user choice!
      role: PlayerRole.CITIZEN,
      isMP: false,
      mpType: 'NONE',
      partyId: null,
      partyJoinDayTick: null,
      isPartyExecutive: false,
      isPartyLeader: false,
      assignedMinistryId: null,
      cumulativePMDays: 0,
      health: 88,
      familyHarmony: 85,
      socialReputation: careerProfile.reputation,
      networkStrength: careerProfile.network,
      personalApproval: 22,
      politicalExperience: careerProfile.experience,
      integrityScore: 82,
      scandalRisk: 8,
      legalDisqualified: false,
      disqualificationReason: null,
      disqualificationUntilTick: null,
      activeInvestigations: 0,
      finances: {
        cash: careerProfile.cash,
        monthlyIncome: careerProfile.monthlyIncome,
        monthlyExpenses: careerProfile.monthlyExpenses,
        businessAssets: opts.civilianCareer === CivilianCareer.LOCAL_ENTREPRENEUR ? 350000 : 0,
        personalDebt: 0,
      },
    },
    parties,
    ministries,
    bills: [
      {
        id: 'BILL_INIT_01',
        title: 'ร่าง พ.ร.บ. งบประมาณรายจ่ายประจำปีงบประมาณ พ.ศ. 2569',
        category: 'BUDGET',
        description: 'กรอบงบประมาณแผ่นดินวงเงิน 3,000,000 ล้านบาท เพื่อขับเคลื่อนเศรษฐกิจและบริการสาธารณะ 18 กระทรวง',
        proposerName: 'คณะรัฐมนตรี',
        proposerPartyId: 'PTY_02',
        status: BillStatus.SECOND_READING,
        submittedTick: 1,
        yesVotes: 298,
        noVotes: 186,
        abstainVotes: 16,
        effectsSummary: 'อนุมัติกรอบวงเงินงบประมาณประจำปีและสำรองงบกลางฉุกเฉิน',
        economicImpact: {
          gdpGrowthDelta: 0.2,
          approvalDelta: 1,
        },
      },
      {
        id: 'BILL_INIT_02',
        title: 'ร่าง พ.ร.บ. อากาศสะอาดและจัดการฝุ่นมลพิษข้ามพรมแดน พ.ศ. ....',
        category: 'SOCIAL',
        description: 'บูรณาการมาตรการลดฝุ่น PM 2.5 และกำหนดสิทธิประชาชนในการเข้าถึงอากาศสะอาด',
        proposerName: 'ส.ส. บูรณาการหลายพรรค',
        proposerPartyId: 'PTY_01',
        status: BillStatus.FIRST_READING,
        submittedTick: 1,
        yesVotes: 0,
        noVotes: 0,
        abstainVotes: 0,
        effectsSummary: '+3 คุณภาพชีวิตและคะแนนนิยมในเขตเมืองและภาคเหนือ',
        economicImpact: {
          approvalDelta: 2,
        },
      },
    ],
    regions,
    demographics,
    economy: {
      gdpGrowthPct: 2.7,
      inflationPct: 1.9,
      unemploymentPct: 1.4,
      publicDebtGDPPct: 62.4,
      taxRevenueGrowthPct: 2.5,
      householdIncomeIndex: 100,
      privateInvestmentIndex: 99,
      exportGrowthPct: 3.1,
      importGrowthPct: 2.8,
      consumerConfidence: 53,
      qualityOfLifeIndex: 61,
      inequalityGini: 0.431,
    },
    stateFinances: {
      annualBudgetTotalMillion: 3000000,
      taxRevenueMillion: 2780000,
      expenditureMillion: 3000000,
      publicDebtGDPPct: 62.4,
      budgetBalanceMillion: -220000,
      centralReserveMillion: 180000,
    },
    economicHistory: [
      {
        turn: 1,
        label: 'ม.ค. 69',
        gdpGrowthPct: 2.7,
        inflationPct: 1.9,
        unemploymentPct: 1.4,
        govApproval: 52,
        governmentStability: stability,
      },
    ],
    parliamentStatus: 'ACTIVE',
    monthsUntilElection,
    isDissolutionElection: false,
    primeMinisterName: 'แพรวา ชินวัตรกุล',
    primeMinisterPartyId: 'PTY_02',
    coalitionSeatCount: 0,
    oppositionSeatCount: 0,
    governmentStability: stability,
    politicalFrictionIndex: friction,
    lastQuorumPresent: 462,
    handCardIds: [],
    playedThisTurnIds: [],
    activeNarrativeEvent: null,
    resolvedEventIds: [],
    storyFlags: [],
    storyArcHistory: [],
    chainLastResolvedTurn: {},
    newsFeed: [
      {
        id: 'NWS_START_01',
        eventId: 'WORLD_INIT',
        tick: 1,
        dateLabel: formatThaiDate(0, 2569),
        category: 'การเมือง',
        headline: 'เปิดสมัยประชุมสามัญประจำปี รัฐบาลผสมเดินหน้าพิจารณางบประมาณ 3 ล้านล้านบาท',
        summary: '57 พรรคการเมืองเตรียมพร้อมขับเคลื่อนนโยบาย ขณะที่ภาคประชาชนจับตาค่าครองชีพและโอกาสการเลือกตั้งรอบหน้า',
        factStatus: FactCheckStatus.VERIFIED_FACT,
        sourceName: 'สำนักข่าวแห่งชาติ',
      },
      {
        id: 'NWS_START_02',
        eventId: 'WORLD_INIT_CLAIM',
        tick: 1,
        dateLabel: formatThaiDate(0, 2569),
        category: 'เศรษฐกิจ',
        headline: 'แกนนำฝ่ายค้านอ้างตัวเลขหนี้ครัวเรือนพุ่งเกินควบคุม จี้รัฐบาลทบทวนงบลงทุน',
        summary: 'โฆษกรัฐบาลโต้กลับว่าตัวเลขยังอยู่ในกรอบวินัยการเงินการคลังและกำลังเร่งมาตรการสินเชื่อรายย่อย',
        factStatus: FactCheckStatus.CLAIM,
        sourceName: 'โต๊ะข่าวเศรษฐกิจการเมือง',
      },
    ],
    auditLog: [],
    agencyCases: [],
    lastElectionResult: null,
    unlockedAchievements: [],
    careerStats: { ...DEFAULT_CAREER_STATS },
    selectedRegionId: opts.homeRegion,
    selectedPartyIdForAction: 'PTY_01',
    soundEnabled: true,
  };

  allocateCabinetMinistries(state);
  if (opts.scenario === ScenarioId.COALITION_CRISIS || opts.scenario === ScenarioId.MINORITY_GOV) {
    state.politicalFrictionIndex = friction;
    state.governmentStability = stability;
  }

  state.auditLog.unshift(
    createAuditEntry(
      state,
      PoliticalLayer.LIFE,
      state.player.name,
      'เริ่มต้นเส้นทางชีวิตในฐานะประชาชนไทยภายใต้ระบบการเมือง 3 ชั้น',
      constitution.name,
      `อายุ ${state.player.ageYears} ปี · เงินออมส่วนตัว ${state.player.finances.cash.toLocaleString()} บาท · สภาผู้แทนราษฎร ${constitution.totalSeats} ที่นั่ง`
    )
  );

  state.handCardIds = drawHandForPlayer(state);
  return state;
}

/**
 * Draws 5 balanced cards relevant to the player's current role plus aspirational next-step cards
 * (so the player can see legal prerequisites on upcoming political cards!).
 */
export function drawHandForPlayer(state: GameState): string[] {
  const playableNow = POLICY_CARDS.filter((c) => c.requiredRoles.includes(state.player.role));
  const aspirational = POLICY_CARDS.filter((c) => !c.requiredRoles.includes(state.player.role));

  // Prioritize role-specific power/law/governance cards + citizen cards + at least 1 aggressive risk/reward option
  const aggressivePlayable = playableNow.filter((c) => Boolean(c.isAggressive));
  const roleSpecific = playableNow.filter((c) => c.layer !== PoliticalLayer.LIFE && !c.isAggressive);
  const lifeCards = playableNow.filter((c) => c.layer === PoliticalLayer.LIFE && !c.isAggressive);

  const selected: PolicyCard[] = [];
  const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  // Guarantee 1 tempting Aggressive Policy Card in hand so player constantly weighs reward vs Scandal Risk
  const pickedAggressive = shuffle(aggressivePlayable)[0];
  if (pickedAggressive) {
    selected.push(pickedAggressive);
  }

  // If Scandal Risk is elevated (>= 50%), surface a transparency/disclosure card if playable
  if ((state.player.scandalRisk || 0) >= 50) {
    const cleanCard = playableNow.find(
      (c) => (c.effects.scandalRiskDelta || 0) < 0 && !selected.some((s) => s.id === c.id)
    );
    if (cleanCard) selected.push(cleanCard);
  }

  for (const c of shuffle(roleSpecific)) {
    if (selected.length < 3 && !selected.some((s) => s.id === c.id)) selected.push(c);
  }
  for (const c of shuffle(lifeCards)) {
    if (selected.length < 5 && !selected.some((s) => s.id === c.id)) {
      selected.push(c);
    }
  }
  // Include 1 aspirational card if citizen so player sees how to progress legally
  if (state.player.role === PlayerRole.CITIZEN && aspirational.length > 0) {
    const regCard = POLICY_CARDS.find((c) => c.id === 'CRD_PWR_REGISTER_MP');
    if (regCard && !selected.some((s) => s.id === regCard.id)) {
      if (selected.length >= 5) selected.pop();
      selected.push(regCard);
    }
  }

  // Fill up to 5
  for (const c of shuffle(playableNow)) {
    if (selected.length >= 5) break;
    if (!selected.some((s) => s.id === c.id)) selected.push(c);
  }

  return selected.map((c) => c.id);
}

/**
 * Builds the mandatory 'Public Investigation' narrative event when Scandal Risk hits 100%,
 * directly putting Cabinet Positions and Ministerial Budgets on the line.
 */
export function buildPublicInvestigationEvent(state: GameState): NarrativeEvent {
  const playerMin = state.ministries.find((m) => m.isPlayerMinister);
  const isMinister = state.player.role === PlayerRole.MINISTER && Boolean(playerMin);
  const isPM = state.player.role === PlayerRole.PRIME_MINISTER;

  const cabinetLabel = isMinister
    ? `สละเก้าอี้รัฐมนตรีว่าการ${playerMin!.shortName} เพื่อแสดงความรับผิดชอบทางการเมือง`
    : isPM
    ? 'สั่งปรับคณะรัฐมนตรีฉุกเฉิน ปลดรัฐมนตรีสายตรงรับผิดชอบเพื่อรักษาเก้าอี้นายกฯ'
    : 'สละตำแหน่งบริหารพรรค/ท้องถิ่น และรับแรงสั่นสะเทือนต่อโควตารัฐมนตรีของขั้วการเมือง';

  const cabinetOutcome = isMinister
    ? `คุณพ้นจากเก้าอี้รัฐมนตรี (${playerMin!.shortName}) กลับไปทำหน้าที่ในสภา แต่รักษางบประมาณกระทรวงไว้ได้และลดความเสี่ยงข่าวฉาวลงเหลือ 22%`
    : isPM
    ? 'ปลดรัฐมนตรีรับผิดชอบแทน เสียเสถียรภาพรัฐบาล -14% และพรรคร่วมไม่พอใจ แต่ลดความเสี่ยงข่าวฉาวลงเหลือ 22%'
    : 'ถอยออกจากตำแหน่งบริหารและเสียคะแนนนิยมส่วนตัว -10 แต่ยุติกระแสกดดันสาธารณะ ลดความเสี่ยงข่าวฉาวลงเหลือ 22%';

  const targetMinLabel = playerMin ? playerMin.shortName : '3 กระทรวงหลักฝ่ายบริหาร';

  return {
    id: `EVT_PUBLIC_INVESTIGATION_${state.dayTick}`,
    category: 'LEGAL',
    title: 'การไต่สวนสาธารณะฉุกเฉิน: วิกฤตความเสี่ยงข่าวฉาวแตะเพดาน 100%!',
    severity: 95,
    description:
      'ผลจากการเดินเกมและการใช้นโยบายเชิงรุกสะสมจนดัชนีความเสี่ยงข่าวฉาวพุ่งแตะ 100%! คณะกรรมาธิการตรวจสอบงบประมาณ สตง. และสื่อมวลชนร่วมกันเปิดเวทีไต่สวนสาธารณะ กดดันให้ต้องแสดงความรับผิดชอบด้วยตำแหน่งรัฐมนตรี หรือยอมถูกตัดลดงบประมาณกระทรวงและอายัดงบกลางทันที',
    contextQuote:
      '“เมื่อแสงสปอตไลต์ส่องถึงเพดานความอดทนของสังคม อำนาจรัฐมนตรีและเม็ดเงินงบประมาณคือสิ่งแรกที่ต้องถูกวางเป็นเดิมพัน”',
    choices: [
      {
        id: 'CH_PUB_INQ_SACRIFICE_CABINET',
        label: cabinetLabel,
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary: cabinetOutcome,
        effects: {
          personalApprovalDelta: -8,
          integrityDelta: 4,
          publicInquiryPenalty: 'SACRIFICE_CABINET_POST',
        },
      },
      {
        id: 'CH_PUB_INQ_SLASH_BUDGET',
        label: `ยอมให้ สตง. และสภาตัดงบประมาณ ${targetMinLabel} ลง 15% และอายัดงบกลาง 40,000 ล้าน ฿`,
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'รักษาตำแหน่งในคณะรัฐมนตรีไว้ได้ แต่งบกระทรวงหลักถูกหั่น 15% งบกลางรัฐลดลง 40,000 ล้าน ฿ และ GDP ชะลอตัว -0.30% (ความเสี่ยงลดเหลือ 30%)',
        effects: {
          gdpGrowthDelta: -0.3,
          govStabilityDelta: -8,
          consumerConfidenceDelta: -4,
          publicInquiryPenalty: 'SLASH_MINISTRY_BUDGET',
        },
      },
      {
        id: 'CH_PUB_INQ_DEFY_ALL',
        label: 'ปฏิเสธการลาออกและขวางการตัดงบ เดินหน้าชนคดีในชั้น ป.ป.ช. และศาลรัฐธรรมนูญ',
        ledgerType: FinancialLedgerType.PERSONAL,
        cost: 25000,
        outcomeSummary:
          'เปิดสำนวนสอบสวนจริยธรรมร้ายแรงทันที! เสียจริยธรรม -16 เสถียรภาพรัฐบาล -15 (หากจริยธรรมต่ำกว่า 55 จะถูกสั่งหยุดปฏิบัติหน้าที่รัฐมนตรีทันที และความเสี่ยงค้างอยู่ที่ 52%)',
        effects: {
          integrityDelta: -16,
          personalApprovalDelta: -14,
          govStabilityDelta: -15,
          frictionDelta: 10,
          triggerInvestigation: true,
          publicInquiryPenalty: 'DEFY_PUBLIC_INQUIRY',
        },
      },
    ],
  };
}

export function checkAndTriggerPublicInvestigation(state: GameState): boolean {
  if ((state.player.scandalRisk || 0) < 100) return false;
  if (state.activeNarrativeEvent?.id.startsWith('EVT_PUBLIC_INVESTIGATION_')) return false;

  ensureAchievementFields(state);
  state.player.scandalRisk = 100;
  state.careerStats.everInvestigated = true;

  const dateLabel = formatThaiDate(state.monthIndex, state.yearBE);
  state.activeNarrativeEvent = buildPublicInvestigationEvent(state);

  state.newsFeed.unshift({
    id: `NWS_PUB_INQ_${state.dayTick}_${Math.random().toString(36).slice(2, 5)}`,
    eventId: state.activeNarrativeEvent.id,
    tick: state.dayTick,
    dateLabel,
    category: 'ตรวจสอบภาครัฐ',
    headline: `ด่วน! เปิดไต่สวนสาธารณะ "${state.player.name}" หลังความเสี่ยงข่าวฉาวนโยบายเชิงรุกพุ่งแตะ 100%`,
    summary:
      'กรรมาธิการและ สตง. ยื่นคำขาดให้รับผิดชอบด้วยการปรับพ้นเก้าอี้รัฐมนตรี หรือยอมตัดลดงบประมาณกระทรวงหลักทันที',
    factStatus: FactCheckStatus.VERIFIED_FACT,
    sourceName: 'คณะกรรมาธิการตรวจสอบอำนาจรัฐ',
  });

  state.auditLog.unshift(
    createAuditEntry(
      state,
      PoliticalLayer.LAW,
      'คณะกรรมาธิการและ สตง.',
      `เปิดกระบวนการไต่สวนสาธารณะกรณีความเสี่ยงข่าวฉาวแตะ 100% ของ ${state.player.name}`,
      'รัฐธรรมนูญ หมวดการตรวจสอบการใช้อำนาจรัฐ และ พ.ร.บ. วินัยการเงินการคลัง',
      'เข้าสู่การตัดสินใจชี้ชะตาตำแหน่งรัฐมนตรีและวงเงินงบประมาณกระทรวง'
    )
  );

  return true;
}

/**
 * Executes a Policy/Action Card after passing strict Layer 01 Legal Validation.
 */
export function playPolicyCard(
  prevState: GameState,
  cardId: string
): { nextState: GameState; openCoalitionModal?: boolean; message: string; success: boolean } {
  const card = POLICY_CARDS.find((c) => c.id === cardId);
  if (!card) {
    return { nextState: prevState, message: 'ไม่พบข้อมูลการ์ด', success: false };
  }

  const validation = validateCardPlay(prevState, card);
  if (!validation.valid) {
    return {
      nextState: prevState,
      message: `ไม่สามารถดำเนินการได้: ${validation.reason} (${validation.legalCitation})`,
      success: false,
    };
  }

  const state: GameState = structuredClone(prevState);
  state.actionPoints -= card.apCost;
  state.playedThisTurnIds.push(card.id);
  state.handCardIds = state.handCardIds.filter((id) => id !== card.id);

  // Deduct strictly from the authorized separate financial ledger
  if (card.ledgerType === FinancialLedgerType.PERSONAL) {
    state.player.finances.cash -= card.moneyCost;
  } else if (card.ledgerType === FinancialLedgerType.PARTY) {
    const p = state.parties.find((pt) => pt.id === state.player.partyId);
    if (p) p.partyFundsMillion = Number((p.partyFundsMillion - card.moneyCost).toFixed(2));
  } else if (card.ledgerType === FinancialLedgerType.STATE) {
    state.stateFinances.centralReserveMillion = Math.max(0, state.stateFinances.centralReserveMillion - card.moneyCost);
    state.stateFinances.expenditureMillion += card.moneyCost;
    state.stateFinances.budgetBalanceMillion =
      state.stateFinances.taxRevenueMillion - state.stateFinances.expenditureMillion;
  }

  // Apply numeric deltas
  const ef = card.effects;
  if (ef.personalCashDelta) state.player.finances.cash += ef.personalCashDelta;
  if (ef.personalIncomeDelta) state.player.finances.monthlyIncome += ef.personalIncomeDelta;
  if (ef.reputationDelta) state.player.socialReputation = clamp(state.player.socialReputation + ef.reputationDelta, 0, 100);
  if (ef.networkDelta) state.player.networkStrength = clamp(state.player.networkStrength + ef.networkDelta, 0, 100);
  if (ef.personalApprovalDelta) state.player.personalApproval = clamp(state.player.personalApproval + ef.personalApprovalDelta, 0, 100);
  if (ef.experienceDelta) state.player.politicalExperience = clamp(state.player.politicalExperience + ef.experienceDelta, 0, 100);
  if (ef.integrityDelta) state.player.integrityScore = clamp(state.player.integrityScore + ef.integrityDelta, 0, 100);
  if (ef.scandalRiskDelta) {
    state.player.scandalRisk = clamp((state.player.scandalRisk || 0) + ef.scandalRiskDelta, 0, 100);
  }
  if (ef.healthDelta) state.player.health = clamp(state.player.health + ef.healthDelta, 5, 100);

  if (ef.partyPopularityDelta && state.player.partyId) {
    const p = state.parties.find((pt) => pt.id === state.player.partyId);
    if (p) {
      p.nationalPopularity = Number(clamp(p.nationalPopularity + ef.partyPopularityDelta, 0.1, 58).toFixed(2));
    }
  }
  if (ef.partyUnityDelta && state.player.partyId) {
    const p = state.parties.find((pt) => pt.id === state.player.partyId);
    if (p) p.internalUnity = clamp(p.internalUnity + ef.partyUnityDelta, 10, 100);
  }

  if (ef.govStabilityDelta) state.governmentStability = clamp(state.governmentStability + ef.govStabilityDelta, 5, 98);
  if (ef.frictionDelta) state.politicalFrictionIndex = clamp(state.politicalFrictionIndex + ef.frictionDelta, 5, 98);
  if (ef.gdpGrowthDelta) state.economy.gdpGrowthPct = Number((state.economy.gdpGrowthPct + ef.gdpGrowthDelta).toFixed(2));
  if (ef.inflationDelta) state.economy.inflationPct = Number(Math.max(-0.5, state.economy.inflationPct + ef.inflationDelta).toFixed(2));
  if (ef.unemploymentDelta) state.economy.unemploymentPct = Number(Math.max(0.4, state.economy.unemploymentPct + ef.unemploymentDelta).toFixed(2));
  if (ef.consumerConfidenceDelta) state.economy.consumerConfidence = clamp(state.economy.consumerConfidence + ef.consumerConfidenceDelta, 10, 98);
  if (ef.qolDelta) state.economy.qualityOfLifeIndex = clamp(state.economy.qualityOfLifeIndex + ef.qolDelta, 10, 98);

  if (ef.regionalApprovalDelta) {
    state.regions.forEach((r) => {
      const boost = r.id === state.player.homeRegion ? ef.regionalApprovalDelta! + 1 : ef.regionalApprovalDelta!;
      r.govApproval = clamp(r.govApproval + boost, 5, 95);
    });
  }

  let message = `ดำเนินการ "${card.title}" สำเร็จ`;
  let openCoalitionModal = false;

  // Special Institutional & Career Actions
  switch (ef.specialAction) {
    case 'JOIN_SELECTED_PARTY': {
      const targetParty =
        state.parties.find((p) => p.id === state.selectedPartyIdForAction) || state.parties[0];
      state.player.partyId = targetParty.id;
      state.player.partyJoinDayTick = state.dayTick;
      if (state.player.role === PlayerRole.CITIZEN) {
        state.player.role = PlayerRole.PARTY_MEMBER;
      }
      targetParty.trustWithPlayer = clamp(targetParty.trustWithPlayer + 12, 0, 100);
      message = `เข้าเป็นสมาชิก "${targetParty.name}" อย่างเป็นทางการ (เริ่มนับอายุสมาชิกพรรคตั้งแต่วันที่ ${state.dayTick})`;
      break;
    }

    case 'RUN_LOCAL_ELECTION': {
      ensureAchievementFields(state);
      const score = state.player.socialReputation * 0.5 + state.player.personalApproval * 0.6 + state.player.networkStrength * 0.3;
      if (score >= 46) {
        state.player.role = PlayerRole.LOCAL_ADMIN;
        state.careerStats.localElectionsWonCount += 1;
        state.player.finances.monthlyIncome = Math.max(state.player.finances.monthlyIncome, 65000);
        state.player.personalApproval = clamp(state.player.personalApproval + 10, 0, 100);
        message = `ชนะการเลือกตั้งท้องถิ่น! ก้าวขึ้นดำรงตำแหน่งผู้บริหารท้องถิ่น (นายกเทศมนตรี) ในพื้นที่บ้านเกิด`;
      } else {
        message = `พ่ายแพ้การเลือกตั้งท้องถิ่นอย่างฉิวเฉียด (ต้องการชื่อเสียงและคะแนนนิยมเพิ่มอีกเล็กน้อย) แต่ได้รับประสบการณ์ล้ำค่า`;
      }
      break;
    }

    case 'REGISTER_MP_CANDIDATE': {
      state.player.role = PlayerRole.MP_CANDIDATE;
      const p = state.parties.find((pt) => pt.id === state.player.partyId);
      message = `ขึ้นทะเบียนเป็นผู้สมัคร ส.ส. สังกัด${p?.name || 'พรรค'} สำเร็จ! พร้อมลงสนามในการเลือกตั้งทั่วไป (อีก ${state.monthsUntilElection} เดือน)`;
      break;
    }

    case 'CHALLENGE_PARTY_LEADER': {
      const p = state.parties.find((pt) => pt.id === state.player.partyId);
      if (p) {
        const power = state.player.networkStrength * 0.45 + state.player.politicalExperience * 0.4 + state.player.personalApproval * 0.35;
        if (power >= 48) {
          state.player.isPartyLeader = true;
          state.player.isPartyExecutive = true;
          p.leader.name = state.player.name;
          if (!p.pmCandidates.includes(state.player.name)) {
            p.pmCandidates.unshift(state.player.name);
          }
          updatePlayerParliamentaryRole(state);
          message = `ที่ประชุมใหญ่วิสามัญมีมติเลือกคุณเป็นหัวหน้า "${p.name}" และแคนดิเดตนายกรัฐมนตรีลำดับที่ 1!`;
        } else {
          message = `คะแนนเสียงในที่ประชุมใหญ่พรรคยังไม่ถึงกึ่งหนึ่ง (สะสมเครือข่ายและประสบการณ์การเมืองเพิ่มเพื่อชิงตำแหน่งใหม่)`;
        }
      }
      break;
    }

    case 'PROPOSE_WELFARE_BILL': {
      ensureAchievementFields(state);
      state.careerStats.billsProposedCount += 1;
      const bill = createSampleBill(state, 'WELFARE');
      state.bills.unshift(bill);
      message = `ยื่น "${bill.title}" เข้าสู่วาระที่ 1 ของสภาผู้แทนราษฎรเรียบร้อยแล้ว`;
      break;
    }

    case 'PROPOSE_TRANSPARENCY_BILL': {
      ensureAchievementFields(state);
      state.careerStats.billsProposedCount += 1;
      const bill = createSampleBill(state, 'TRANSPARENCY');
      state.bills.unshift(bill);
      message = `ยื่น "${bill.title}" เข้าสู่วาระที่ 1 ของสภาผู้แทนราษฎรเรียบร้อยแล้ว`;
      break;
    }

    case 'PROPOSE_INFRASTRUCTURE_BILL': {
      ensureAchievementFields(state);
      state.careerStats.billsProposedCount += 1;
      const bill = createSampleBill(state, 'INFRASTRUCTURE');
      state.bills.unshift(bill);
      message = `ยื่น "${bill.title}" เข้าสู่วาระที่ 1 ของสภาผู้แทนราษฎรเรียบร้อยแล้ว`;
      break;
    }

    case 'PROPOSE_CONSTITUTION_AMENDMENT': {
      ensureAchievementFields(state);
      state.careerStats.billsProposedCount += 1;
      const bill = createSampleBill(state, 'CONSTITUTION');
      state.bills.unshift(bill);
      message = `ยื่นญัตติแก้ไขเพิ่มเติมรัฐธรรมนูญเข้าสู่รัฐสภา (ต้องการเสียงเกินร้อยละ ${state.constitution.amendmentSupermajorityPct})`;
      break;
    }

    case 'CALL_CENSURE_DEBATE': {
      const res = executeNoConfidenceVote(state);
      message = res.summary;
      break;
    }

    case 'COALITION_NEGOTIATE_MODAL': {
      openCoalitionModal = true;
      message = 'เปิดโต๊ะเจรจาพรรคร่วมรัฐบาลและจัดสรรโควตาคณะรัฐมนตรี';
      break;
    }

    case 'DISSOLVE_PARLIAMENT': {
      state.parliamentStatus = 'DISSOLVED_CARETAKER';
      state.isDissolutionElection = true;
      state.monthsUntilElection = 2; // 60 days according to Section 103
      message = 'ประกาศพระราชกฤษฎีกายุบสภา! รัฐบาลเข้าสู่สถานะรักษาการ และกำหนดเลือกตั้งทั่วไปใหม่ในอีก 2 เดือน';
      state.newsFeed.unshift({
        id: `NWS_DISSOLVE_${state.dayTick}`,
        eventId: `DISSOLVE_${state.turn}`,
        tick: state.dayTick,
        dateLabel: formatThaiDate(state.monthIndex, state.yearBE),
        category: 'การเมือง',
        headline: `นายกฯ ${state.primeMinisterName} ประกาศยุบสภา คืนอำนาจประชาชน เลือกตั้งใหม่ใน 60 วัน!`,
        summary: 'กกต. เตรียมจัดการเลือกตั้งใหม่ โดยเกณฑ์สังกัดพรรคของผู้สมัคร ส.ส. ลดลงเหลือ 30 วันตามรัฐธรรมนูญ',
        factStatus: FactCheckStatus.VERIFIED_FACT,
        sourceName: 'ราชกิจจานุเบกษา',
      });
      break;
    }
  }

  state.auditLog.unshift(
    createAuditEntry(state, card.layer, state.player.name, card.title, card.legalBasis, message)
  );

  const triggeredInquiry = checkAndTriggerPublicInvestigation(state);
  if (triggeredInquiry) {
    message = `${message} · คำเตือน: ความเสี่ยงข่าวฉาวพุ่งแตะ 100% เปิดเวทีไต่สวนสาธารณะทันที!`;
  }

  assertAndRepairDataIntegrity(state);
  return { nextState: state, openCoalitionModal, message, success: true };
}

function applyPublicInquiryPenalty(
  state: GameState,
  penalty: NonNullable<NarrativeChoice['effects']['publicInquiryPenalty']>
): string {
  if (penalty === 'SACRIFICE_CABINET_POST') {
    state.player.scandalRisk = 22;
    const playerMin = state.ministries.find((m) => m.isPlayerMinister);
    if (playerMin) {
      const party = state.parties.find((p) => p.id === playerMin.ministerPartyId);
      playerMin.isPlayerMinister = false;
      playerMin.ministerName = party
        ? `ผู้แทน${party.shortName} (${playerMin.shortName})`
        : 'รัฐมนตรีรักษาการ';
      state.player.assignedMinistryId = null;
      if (state.player.role === PlayerRole.MINISTER) {
        state.player.role = state.player.isMP ? PlayerRole.MP_GOVERNMENT : PlayerRole.PARTY_MEMBER;
      }
      updatePlayerParliamentaryRole(state);
      return `คุณสละตำแหน่งรัฐมนตรีว่าการ${playerMin.shortName} เพื่อรับผิดชอบทางการเมือง (ความเสี่ยงข่าวฉาวลดลงเหลือ 22%)`;
    }

    if (state.player.role === PlayerRole.PRIME_MINISTER) {
      state.governmentStability = clamp(state.governmentStability - 14, 10, 95);
      state.politicalFrictionIndex = clamp(state.politicalFrictionIndex + 12, 10, 95);
      state.parties
        .filter((p) => p.inCoalition)
        .forEach((p) => {
          p.cabinetSatisfaction = clamp(p.cabinetSatisfaction - 15, 20, 98);
        });
      // Replace 2 non-player ministerial appointees in reshuffle
      state.ministries.slice(0, 2).forEach((m) => {
        m.performanceScore = clamp(m.performanceScore - 8, 25, 98);
        m.ministerName = `รัฐมนตรีปรับใหม่ (${m.shortName})`;
      });
      return 'สั่งปรับ ครม. ฉุกเฉินปลดรัฐมนตรีสายตรงรับผิดชอบ เสียเสถียรภาพรัฐบาล -14% (ความเสี่ยงข่าวฉาวลดเหลือ 22%)';
    }

    // Non-cabinet roles: lose local admin / party executive office & trigger coalition shake-up
    state.player.isPartyExecutive = false;
    if (state.player.role === PlayerRole.LOCAL_ADMIN) {
      state.player.role = state.player.partyId ? PlayerRole.PARTY_MEMBER : PlayerRole.CITIZEN;
    }
    state.player.personalApproval = clamp(state.player.personalApproval - 10, 0, 100);
    state.governmentStability = clamp(state.governmentStability - 8, 10, 95);
    return 'ถอยจากตำแหน่งบริหารเพื่อรับผิดชอบต่อสังคม คะแนนนิยมลดลงแต่ความเสี่ยงข่าวฉาวคลี่คลายเหลือ 22%';
  }

  if (penalty === 'SLASH_MINISTRY_BUDGET') {
    state.player.scandalRisk = 30;
    const playerMin = state.ministries.find((m) => m.isPlayerMinister);
    const targets = playerMin
      ? [playerMin, ...state.ministries.filter((m) => m.id !== playerMin.id).slice(0, 1)]
      : [...state.ministries].sort((a, b) => b.allocatedMillion - a.allocatedMillion).slice(0, 3);

    let totalCutMillion = 0;
    targets.forEach((m) => {
      const cut = Math.round(m.allocatedMillion * 0.15);
      totalCutMillion += cut;
      m.allocatedMillion = Math.max(10000, m.allocatedMillion - cut);
      m.performanceScore = clamp(m.performanceScore - 10, 20, 98);
    });

    // Rebalance statutory share percentages cleanly across remaining ministries
    const totalAlloc = state.ministries.reduce((s, m) => s + m.allocatedMillion, 0);
    if (totalAlloc > 0) {
      state.ministries.forEach((m) => {
        m.budgetSharePct = Number(((m.allocatedMillion / totalAlloc) * 100).toFixed(1));
      });
    }

    state.stateFinances.centralReserveMillion = Math.max(
      0,
      state.stateFinances.centralReserveMillion - 40000
    );
    state.parties
      .filter((p) => p.inCoalition)
      .forEach((p) => {
        p.cabinetSatisfaction = clamp(p.cabinetSatisfaction - 12, 20, 98);
      });

    return `ถูกตัดงบประมาณกระทรวงหลักรวม ${totalCutMillion.toLocaleString()} ล้าน ฿ และอายัดงบกลาง 40,000 ล้าน ฿ เพื่อแลกกับการรักษาเก้าอี้รัฐมนตรี (ความเสี่ยงลดเหลือ 30%)`;
  }

  // DEFY_PUBLIC_INQUIRY
  state.player.scandalRisk = 52;
  state.stateFinances.centralReserveMillion = Math.max(
    0,
    state.stateFinances.centralReserveMillion - 20000
  );

  // If integrity has fallen below 55, immediate suspension from Cabinet ministry + budget freeze!
  const playerMin = state.ministries.find((m) => m.isPlayerMinister);
  if (state.player.integrityScore < 55 && playerMin) {
    playerMin.isPlayerMinister = false;
    playerMin.ministerName = `ปลัดกระทรวงรักษาราชการแทน (${playerMin.shortName})`;
    playerMin.allocatedMillion = Math.round(playerMin.allocatedMillion * 0.9);
    state.player.assignedMinistryId = null;
    if (state.player.role === PlayerRole.MINISTER) {
      state.player.role = state.player.isMP ? PlayerRole.MP_GOVERNMENT : PlayerRole.PARTY_MEMBER;
    }
    updatePlayerParliamentaryRole(state);
    return `ดึงดันสู้คดีแต่คะแนนจริยธรรมต่ำกว่าเกณฑ์! ศาลสั่งหยุดปฏิบัติหน้าที่รัฐมนตรี ${playerMin.shortName} และอายัดงบกระทรวง 10% ทันที`;
  }

  return 'ปฏิเสธข้อเรียกร้องสาธารณะ! ป.ป.ช. เปิดสำนวนสอบสวนจริยธรรมร้ายแรงและอายัดงบกลาง 20,000 ล้าน ฿ (ความเสี่ยงยังค้างอยู่ที่ 52%)';
}

function resolveTargetRegionForEvent(
  state: GameState,
  scope?: EventTargetRegionScope
): RegionData {
  if (!state.regions || state.regions.length === 0) {
    throw new Error('Regions array must not be empty');
  }
  if (scope === 'LOWEST_APPROVAL_REGION') {
    return [...state.regions].sort(
      (a, b) => a.govApproval - b.govApproval || a.localEconomyScore - b.localEconomyScore
    )[0];
  }
  if (scope === 'LOWEST_ECONOMY_REGION') {
    return [...state.regions].sort(
      (a, b) => a.localEconomyScore - b.localEconomyScore || a.govApproval - b.govApproval
    )[0];
  }
  if (!scope || scope === 'HOME_REGION') {
    return state.regions.find((r) => r.id === state.player.homeRegion) || state.regions[0];
  }
  return state.regions.find((r) => r.id === scope) || state.regions[0];
}

function interpolateEventText(
  template: string,
  state: GameState,
  targetRegion: RegionData
): string {
  const homeRegion =
    state.regions.find((r) => r.id === state.player.homeRegion) || targetRegion;
  const playerParty = state.parties.find((p) => p.id === state.player.partyId);
  const gdpStr =
    state.economy.gdpGrowthPct >= 0
      ? `+${state.economy.gdpGrowthPct}`
      : `${state.economy.gdpGrowthPct}`;

  return template
    .replaceAll('{{targetRegionName}}', targetRegion.name)
    .replaceAll('{{homeRegionName}}', homeRegion.name)
    .replaceAll('{{playerPartyName}}', playerParty?.name || 'กลุ่มการเมืองอิสระ')
    .replaceAll('{{playerName}}', state.player.name)
    .replaceAll('{{gdpGrowth}}', gdpStr)
    .replaceAll('{{inflation}}', String(state.economy.inflationPct))
    .replaceAll('{{consumerConfidence}}', String(state.economy.consumerConfidence))
    .replaceAll('{{friction}}', String(state.politicalFrictionIndex))
    .replaceAll('{{govStability}}', String(state.governmentStability))
    .replaceAll('{{monthsUntilElection}}', String(Math.max(1, state.monthsUntilElection)));
}

export function evaluateAndBindNarrativeEvent(
  state: GameState,
  ev: NarrativeEvent
): { boundEvent: NarrativeEvent; priorityScore: number; isContinuation: boolean } | null {
  if (state.resolvedEventIds.includes(ev.id)) return null;
  if (ev.minTurn !== undefined && state.turn < ev.minTurn) return null;
  if (ev.requiresParliamentActive && state.parliamentStatus !== 'ACTIVE') return null;
  if (ev.requiresPartyMembership && !state.player.partyId) return null;
  if (ev.requiredRoles && !ev.requiredRoles.includes(state.player.role)) return null;
  if (ev.requiredFlag && !state.storyFlags.includes(ev.requiredFlag)) return null;
  if (
    ev.requiredFlagsAny &&
    ev.requiredFlagsAny.length > 0 &&
    !ev.requiredFlagsAny.some((flag) => state.storyFlags.includes(flag))
  ) {
    return null;
  }
  if (ev.excludedFlag && state.storyFlags.includes(ev.excludedFlag)) return null;

  if (ev.chainId && ev.minTurnsAfterPreviousEpisode) {
    const lastTurn = state.chainLastResolvedTurn?.[ev.chainId];
    if (typeof lastTurn === 'number' && state.turn - lastTurn < ev.minTurnsAfterPreviousEpisode) {
      return null;
    }
  }

  const targetRegion = resolveTargetRegionForEvent(state, ev.targetRegionScope);
  if (ev.maxRegionalApproval !== undefined && targetRegion.govApproval > ev.maxRegionalApproval) {
    return null;
  }
  if (
    ev.maxRegionalEconomy !== undefined &&
    targetRegion.localEconomyScore > ev.maxRegionalEconomy
  ) {
    return null;
  }
  if (
    ev.maxRegionalInfrastructure !== undefined &&
    targetRegion.infrastructureScore > ev.maxRegionalInfrastructure
  ) {
    return null;
  }
  if (ev.minFriction !== undefined && state.politicalFrictionIndex < ev.minFriction) {
    return null;
  }
  if (ev.maxGovStability !== undefined && state.governmentStability > ev.maxGovStability) {
    return null;
  }
  if (ev.maxGdpGrowthPct !== undefined && state.economy.gdpGrowthPct > ev.maxGdpGrowthPct) {
    return null;
  }
  if (ev.minInflationPct !== undefined && state.economy.inflationPct < ev.minInflationPct) {
    return null;
  }
  if (
    ev.maxConsumerConfidence !== undefined &&
    state.economy.consumerConfidence > ev.maxConsumerConfidence
  ) {
    return null;
  }
  if (
    ev.maxMonthsUntilElection !== undefined &&
    state.monthsUntilElection > ev.maxMonthsUntilElection
  ) {
    return null;
  }

  const isContinuation = Boolean(
    ev.requiredFlag || (ev.requiredFlagsAny && ev.requiredFlagsAny.length > 0)
  );

  const reasons: string[] = [];
  if (ev.chainId && (ev.episodeNumber || 1) >= 2) {
    const prevLog = [...(state.storyArcHistory || [])]
      .reverse()
      .find((h) => h.chainId === ev.chainId && h.episodeNumber === (ev.episodeNumber || 2) - 1);
    if (prevLog) {
      reasons.push(`ผลสืบเนื่องจากตอนที่ ${prevLog.episodeNumber} (${prevLog.choiceLabel})`);
    } else {
      reasons.push(`ต่อเนื่องจากเหตุการณ์ตอนก่อนหน้า`);
    }
  }

  if (
    ev.targetRegionScope ||
    ev.maxRegionalApproval !== undefined ||
    ev.maxRegionalEconomy !== undefined ||
    ev.maxRegionalInfrastructure !== undefined
  ) {
    reasons.push(
      `พื้นที่${targetRegion.name} (นิยมรัฐบาล ${targetRegion.govApproval}% · เศรษฐกิจพื้นที่ ${targetRegion.localEconomyScore}/100 · โครงสร้างพื้นฐาน ${targetRegion.infrastructureScore}/100)`
    );
  }

  if (
    ev.maxGdpGrowthPct !== undefined ||
    ev.minInflationPct !== undefined ||
    ev.maxConsumerConfidence !== undefined ||
    ev.category === 'ECONOMIC'
  ) {
    const gdpStr =
      state.economy.gdpGrowthPct >= 0
        ? `+${state.economy.gdpGrowthPct}`
        : `${state.economy.gdpGrowthPct}`;
    reasons.push(
      `ดัชนีเศรษฐกิจจริง (GDP ${gdpStr}% · เงินเฟ้อ ${state.economy.inflationPct}% · ความเชื่อมั่นผู้บริโภค ${state.economy.consumerConfidence}/100)`
    );
  }

  if (
    ev.minFriction !== undefined ||
    ev.maxGovStability !== undefined ||
    ev.maxMonthsUntilElection !== undefined ||
    ev.requiresParliamentActive
  ) {
    reasons.push(
      `ดุลการเมืองสภา (เสถียรภาพรัฐบาล ${state.governmentStability}% · ความขัดแย้งพรรคร่วม ${state.politicalFrictionIndex}% · เลือกตั้งในอีก ${state.monthsUntilElection} เดือน)`
    );
  }

  if (reasons.length === 0) {
    reasons.push(
      `พื้นที่${targetRegion.name} · ความเชื่อมั่นผู้บริโภค ${state.economy.consumerConfidence}/100`
    );
  }

  const boundEvent: NarrativeEvent = {
    ...structuredClone(ev),
    title: interpolateEventText(ev.title, state, targetRegion),
    description: interpolateEventText(ev.description, state, targetRegion),
    contextQuote: interpolateEventText(ev.contextQuote, state, targetRegion),
    boundTargetRegionId: targetRegion.id,
    liveTriggerSummary: reasons.join(' · '),
    choices: ev.choices.map((ch) => ({
      ...structuredClone(ch),
      label: interpolateEventText(ch.label, state, targetRegion),
      outcomeSummary: interpolateEventText(ch.outcomeSummary, state, targetRegion),
      newsHeadline: ch.newsHeadline
        ? interpolateEventText(ch.newsHeadline, state, targetRegion)
        : undefined,
    })),
  };

  let priorityScore = ev.severity;
  if (isContinuation) {
    priorityScore += 220 + (ev.episodeNumber || 1) * 25;
  } else if (ev.chainId) {
    priorityScore += 95;
  }

  return { boundEvent, priorityScore, isContinuation };
}

/**
 * Resolves a player's choice on an active Branching Narrative Event.
 */
export function resolveNarrativeChoice(prevState: GameState, choice: NarrativeChoice): { nextState: GameState; message: string } {
  const state: GameState = structuredClone(prevState);
  const event = state.activeNarrativeEvent;
  if (!event) return { nextState: state, message: '' };

  if (!Array.isArray(state.storyArcHistory)) state.storyArcHistory = [];
  if (!state.chainLastResolvedTurn || typeof state.chainLastResolvedTurn !== 'object') {
    state.chainLastResolvedTurn = {};
  }

  if (choice.requiredFlag && !state.storyFlags.includes(choice.requiredFlag)) {
    return {
      nextState: prevState,
      message: choice.requiredFlagHint || 'ยังไม่ผ่านเงื่อนไขจากการตัดสินใจในตอนก่อนหน้า',
    };
  }

  if (choice.ledgerType === FinancialLedgerType.PERSONAL && choice.cost > 0) {
    if (state.player.finances.cash < choice.cost) {
      return { nextState: prevState, message: `เงินส่วนตัวไม่เพียงพอสำหรับทางเลือกนี้ (${choice.cost.toLocaleString()} ฿)` };
    }
    state.player.finances.cash -= choice.cost;
  }

  if (choice.setFlag && !state.storyFlags.includes(choice.setFlag)) {
    state.storyFlags.push(choice.setFlag);
  }

  const targetRegionId = event.boundTargetRegionId || state.player.homeRegion;
  const targetRegion =
    state.regions.find((r) => r.id === targetRegionId) || state.regions[0];

  const ef = choice.effects;
  if (ef.personalCashDelta) state.player.finances.cash += ef.personalCashDelta;
  if (ef.reputationDelta) state.player.socialReputation = clamp(state.player.socialReputation + ef.reputationDelta, 0, 100);
  if (ef.personalApprovalDelta) state.player.personalApproval = clamp(state.player.personalApproval + ef.personalApprovalDelta, 0, 100);
  if (ef.integrityDelta) state.player.integrityScore = clamp(state.player.integrityScore + ef.integrityDelta, 0, 100);
  if (ef.scandalRiskDelta) {
    state.player.scandalRisk = clamp((state.player.scandalRisk || 0) + ef.scandalRiskDelta, 0, 100);
  }
  if (ef.govStabilityDelta) state.governmentStability = clamp(state.governmentStability + ef.govStabilityDelta, 5, 98);
  if (ef.frictionDelta) state.politicalFrictionIndex = clamp(state.politicalFrictionIndex + ef.frictionDelta, 5, 98);
  if (ef.gdpGrowthDelta) state.economy.gdpGrowthPct = Number((state.economy.gdpGrowthPct + ef.gdpGrowthDelta).toFixed(2));
  if (ef.inflationDelta) {
    state.economy.inflationPct = Number(Math.max(-0.5, state.economy.inflationPct + ef.inflationDelta).toFixed(2));
  }
  if (ef.consumerConfidenceDelta) state.economy.consumerConfidence = clamp(state.economy.consumerConfidence + ef.consumerConfidenceDelta, 10, 98);

  const playerParty = state.parties.find((pt) => pt.id === state.player.partyId);
  if (playerParty) {
    if (ef.partyTrustDelta) {
      playerParty.trustWithPlayer = clamp(playerParty.trustWithPlayer + ef.partyTrustDelta, 0, 100);
    }
    if (ef.partyUnityDelta) {
      playerParty.internalUnity = clamp(playerParty.internalUnity + ef.partyUnityDelta, 10, 100);
    }
    if (ef.partyPopularityDelta) {
      playerParty.nationalPopularity = Number(
        clamp(playerParty.nationalPopularity + ef.partyPopularityDelta, 0.1, 58).toFixed(2)
      );
    }
  }

  if (ef.coalitionSatisfactionDelta) {
    state.parties
      .filter((p) => p.inCoalition)
      .forEach((p) => {
        p.cabinetSatisfaction = clamp(p.cabinetSatisfaction + ef.coalitionSatisfactionDelta!, 20, 98);
      });
  }

  if (targetRegion) {
    if (ef.targetRegionApprovalDelta) {
      targetRegion.govApproval = clamp(
        targetRegion.govApproval + ef.targetRegionApprovalDelta,
        5,
        95
      );
    }
    if (ef.targetRegionEconomyDelta) {
      targetRegion.localEconomyScore = clamp(
        targetRegion.localEconomyScore + ef.targetRegionEconomyDelta,
        10,
        98
      );
    }
    if (ef.targetRegionInfrastructureDelta) {
      targetRegion.infrastructureScore = clamp(
        targetRegion.infrastructureScore + ef.targetRegionInfrastructureDelta,
        10,
        98
      );
    }
    if (ef.setRegionalCrisis !== undefined) {
      targetRegion.activeCrisis = ef.setRegionalCrisis;
    }
    if (ef.targetRegionPartyStrengthDelta && playerParty) {
      const currentMult = playerParty.regionalStrength[targetRegion.id] || 0.7;
      playerParty.regionalStrength[targetRegion.id] = Number(
        clamp(currentMult + ef.targetRegionPartyStrengthDelta, 0.4, 2.4).toFixed(2)
      );
      // Re-evaluate dominant party in this region if player's party surges ahead
      const rankedInRegion = [...state.parties].sort(
        (a, b) =>
          b.nationalPopularity * (b.regionalStrength[targetRegion.id] || 0.5) -
          a.nationalPopularity * (a.regionalStrength[targetRegion.id] || 0.5)
      );
      if (rankedInRegion[0]) {
        targetRegion.dominantPartyId = rankedInRegion[0].id;
      }
    }
  }

  if (ef.triggerInvestigation) {
    ensureAchievementFields(state);
    state.careerStats.everInvestigated = true;
    state.player.activeInvestigations += 1;
    state.agencyCases.unshift({
      id: `CASE_${state.dayTick}_${Math.random().toString(36).slice(2, 6)}`,
      agency: 'ป.ป.ช.',
      targetName: state.player.name,
      subject: event.title,
      status: 'PENDING',
      openedTick: state.dayTick,
      legalBasis: 'พ.ร.ป. ว่าด้วยการป้องกันและปราบปรามการทุจริต พ.ศ. 2561',
    });
  }

  let finalSummary = choice.outcomeSummary;
  if (ef.publicInquiryPenalty) {
    finalSummary = applyPublicInquiryPenalty(state, ef.publicInquiryPenalty);
  }

  const dateLabel = formatThaiDate(state.monthIndex, state.yearBE);

  if (event.chainId) {
    state.chainLastResolvedTurn[event.chainId] = state.turn;
    state.storyArcHistory.unshift({
      chainId: event.chainId,
      chainTitle: event.chainTitle || event.title,
      episodeNumber: event.episodeNumber || 1,
      totalEpisodes: event.totalEpisodes || 3,
      eventId: event.id,
      eventTitle: event.title,
      choiceId: choice.id,
      choiceLabel: choice.label,
      outcomeSummary: finalSummary,
      turn: state.turn,
      dateLabel,
      targetRegionId: targetRegion?.id,
    });
  }

  if (choice.newsHeadline) {
    const newsCategory =
      event.category === 'LEGAL'
        ? 'ตรวจสอบภาครัฐ'
        : event.category === 'ECONOMIC'
        ? 'เศรษฐกิจ'
        : event.category === 'DISASTER'
        ? 'ภัยพิบัติและสังคม'
        : event.requiresParliamentActive
        ? 'รัฐสภา'
        : 'การเมือง';

    state.newsFeed.unshift({
      id: `NWS_EVT_${state.dayTick}_${Math.random().toString(36).slice(2, 6)}`,
      eventId: event.id,
      tick: state.dayTick,
      dateLabel,
      category: newsCategory,
      headline: choice.newsHeadline,
      summary: finalSummary,
      factStatus: choice.newsFactStatus || FactCheckStatus.VERIFIED_FACT,
      sourceName: event.requiresParliamentActive ? 'สำนักข่าวรัฐสภา' : 'โต๊ะข่าวการเมืองและภูมิภาค',
    });
    state.newsFeed = state.newsFeed.slice(0, 35);
  }

  state.resolvedEventIds.push(event.id);
  state.activeNarrativeEvent = null;

  const auditLayer =
    event.category === 'POLITICAL'
      ? PoliticalLayer.POWER
      : event.category === 'LEGAL'
      ? PoliticalLayer.LAW
      : event.category === 'ECONOMIC'
      ? PoliticalLayer.GOVERNANCE
      : PoliticalLayer.LIFE;

  state.auditLog.unshift(
    createAuditEntry(
      state,
      auditLayer,
      state.player.name,
      `ตัดสินใจในเหตุการณ์${event.chainTitle ? ` [${event.chainTitle} ตอนที่ ${event.episodeNumber}/${event.totalEpisodes}]` : ''} "${event.title}": ${choice.label}`,
      event.chainId
        ? 'กลไกการต่อรองทางการเมือง รัฐสภา และดุลอำนาจภูมิภาค'
        : 'ดุลพินิจและการกระทำที่มีผลผูกพันในโลกจำลอง',
      finalSummary
    )
  );

  // If a regular narrative choice pushed Scandal Risk to 100%, immediately trigger Public Investigation!
  if (!ef.publicInquiryPenalty) {
    checkAndTriggerPublicInvestigation(state);
  }

  assertAndRepairDataIntegrity(state);
  return { nextState: state, message: finalSummary };
}

/**
 * Calculates regional chaos scores based on approval, economy, and active crises.
 * Chaos affects approval and consumer confidence.
 */
function calculateWeeklyChaos(state: GameState) {
  state.regions.forEach((r) => {
    let delta = 0;
    if (r.govApproval < 40) delta += 1.5;
    if (r.localEconomyScore < 45) delta += 1.0;
    if (r.activeCrisis) delta += 2.0;
    if (r.govApproval > 70) delta -= 1.0;

    // Drifts towards baseline 15 if no severe factors
    if (delta === 0) {
      if (r.chaosScore > 15) delta -= 0.5;
      if (r.chaosScore < 15) delta += 0.5;
    }

    r.chaosScore = clamp(r.chaosScore + delta, 0, 100);

    // Update trend (last 4 weeks)
    r.chaosTrend = [...(r.chaosTrend || []).slice(-3), r.chaosScore];

    // Apply chaos effects
    if (r.chaosScore > 50) {
      r.govApproval = clamp(r.govApproval - 0.5, 5, 95);
    }
    if (r.chaosScore > 75) {
      state.economy.consumerConfidence = clamp(state.economy.consumerConfidence - 0.3, 10, 95);
    }
  });
}

/**
 * Generates a short headline for the week based on the current situation.
 */
function generateWeeklyHeadline(state: GameState): string {
  const avgChaos = state.regions.reduce((s, r) => s + r.chaosScore, 0) / state.regions.length;
  const avgApproval = state.regions.reduce((s, r) => s + r.govApproval, 0) / state.regions.length;

  if (avgChaos > 60) return 'สถานการณ์ความวุ่นวายในหลายภูมิภาคเริ่มส่งผลกระทบต่อความเชื่อมั่นสาธารณะ';
  if (state.economy.inflationPct > 5) return 'ราคาพิกัดสินค้าอุปโภคบริโภคพุ่งสูงขึ้นอย่างต่อเนื่องในสัปดาห์นี้';
  if (avgApproval < 35) return 'กระแสวิพากษ์วิจารณ์การทำงานของรัฐบาลหนาหูขึ้นในสื่อสังคมออนไลน์';
  if (state.economy.gdpGrowthPct > 4) return 'บรรยากาศทางเศรษฐกิจสัปดาห์นี้ดูคึกคักเป็นพิเศษจากการขยายตัวของภาคส่งออก';
  if (state.politicalFrictionIndex > 70) return 'ข่าวลือเรื่องความรอยร้าวในพรรคร่วมรัฐบาลยังคงเป็นที่จับตาของคอการเมือง';

  const randomHeadlines = [
    'สัปดาห์แห่งการลงพื้นที่: ส.ส. หลายเขตเร่งรับฟังปัญหาปากท้องประชาชน',
    'วงการเมืองจับตาการขยับตัวของกลุ่มขั้วอำนาจใหม่ในสภาฯ',
    'สถานการณ์การเมืองในสัปดาห์นี้ยังคงทรงตัว ท่ามกลางการเฝ้าระวังทางเศรษฐกิจ',
    'ภาคเอกชนเรียกร้องรัฐบาลเร่งออกมาตรการกระตุ้นการบริโภคในประเทศ',
  ];
  return randomHeadlines[state.dayTick % randomHeadlines.length];
}

/**
 * LAYER 03: Weekly Turn Simulation Tick (7 Daily Ticks)
 * Updates Age, PM 8-Year Cumulative Days, Personal/Party/State Finances, Economy, Bills, Agencies, Elections, and Story Triggers.
 * Monthly events trigger every 4 weeks.
 */
export function advanceWeeklyTurn(prevState: GameState): GameState {
  const state: GameState = structuredClone(prevState);
  ensureAchievementFields(state);

  state.turn += 1;
  state.dayTick += 7;
  state.weekInMonth = (state.weekInMonth || 0) + 1;

  // 1. Weekly Chaos Calculation
  calculateWeeklyChaos(state);

  // 2. Weekly Headline
  const weeklyHeadline = generateWeeklyHeadline(state);
  state.currentMonthHeadlines = [...(state.currentMonthHeadlines || []), weeklyHeadline];

  // 3. Weekly Economic & Performance Simulation (Rescaled from monthly /4)
  const eduHealthShare = state.ministries
    .filter((m) => m.id === 'MIN_EDU' || m.id === 'MIN_MOPH' || m.id === 'MIN_MSDHS')
    .reduce((s, m) => s + m.budgetSharePct, 0);
  const infraEconShare = state.ministries
    .filter((m) => m.category === 'INFRASTRUCTURE' || m.category === 'ECONOMIC')
    .reduce((s, m) => s + m.budgetSharePct, 0);

  const stabilityFactor = (state.governmentStability - 50) * 0.008;
  const infraBoost = (infraEconShare - 38) * 0.015;
  const externalCycle = Math.sin(state.turn * 0.1) * 0.08; // Slower cycle for weekly

  // Weekly GDP/Inflation drift (1/4 of monthly impact)
  state.economy.gdpGrowthPct = Number(
    clamp(state.economy.gdpGrowthPct * 0.98 + (2.6 + stabilityFactor + infraBoost + externalCycle) * 0.02, -2.5, 6.8).toFixed(2)
  );
  state.economy.inflationPct = Number(
    clamp(state.economy.inflationPct * 0.97 + (2.0 + state.economy.gdpGrowthPct * 0.15) * 0.03, 0.2, 7.5).toFixed(2)
  );
  state.economy.unemploymentPct = Number(
    clamp(1.8 - state.economy.gdpGrowthPct * 0.14, 0.5, 5.5).toFixed(2)
  );
  state.economy.consumerConfidence = clamp(
    Math.round(
      state.economy.consumerConfidence * 0.96 +
        (48 + state.economy.gdpGrowthPct * 3.2 - state.economy.inflationPct * 1.8 + (eduHealthShare - 30) * 0.4) * 0.04
    ),
    15,
    95
  );
  state.economy.householdIncomeIndex = Number(
    (state.economy.householdIncomeIndex + (state.economy.gdpGrowthPct - state.economy.inflationPct) * 0.03).toFixed(1)
  );

  // Weekly voter demographics & regional approval drift
  state.demographics.forEach((d) => {
    const econDelta = ((state.economy.gdpGrowthPct - 2.4) * 0.8 - (state.economy.inflationPct - 2.2) * 0.7) * 0.25;
    d.govSatisfaction = clamp(d.govSatisfaction + econDelta, 10, 92);
    d.playerSupport = clamp(
      d.playerSupport * 0.96 + state.player.personalApproval * 0.04,
      5,
      95
    );
  });

  const avgGovApproval = Math.round(
    state.regions.reduce((s, r) => s + r.govApproval, 0) / state.regions.length
  );

  // 4. Monthly Rollover Logic (Triggered at end of week 4)
  if (state.weekInMonth > 4) {
    state.weekInMonth = 1;
    state.monthIndex = (state.monthIndex + 1) % 12;

    if (state.monthIndex === 0) {
      state.yearBE += 1;
      state.player.ageYears += 1;
      // Replenish annual state central reserve at fiscal rollover
      state.stateFinances.centralReserveMillion = Math.round(state.stateFinances.annualBudgetTotalMillion * 0.06);
    }

    // Reset Headlines for next month (they should be displayed via modal before this if called from UI)
    // Actually, UI will read state.currentMonthHeadlines and we reset it after the summary is acknowledged or here.
    // Let's keep them until the next month starts.
    state.currentMonthHeadlines = [];

    // Track clean public-office tenure
    if (
      isHoldingPublicOffice(state.player.role) &&
      !state.player.legalDisqualified &&
      state.player.activeInvestigations === 0
    ) {
      state.careerStats.monthsInPublicOffice += 1;
    }

    // PM Cumulative Days (Monthly settlement)
    if (state.player.role === PlayerRole.PRIME_MINISTER) {
      state.player.cumulativePMDays += 30;
      const maxDays = state.constitution.pmMaxCumulativeYears * 365;
      if (state.player.cumulativePMDays >= maxDays) {
        state.player.role = state.player.isMP ? PlayerRole.MP_GOVERNMENT : PlayerRole.PARTY_LEADER;
        allocateCabinetMinistries(state);
        state.auditLog.unshift(
          createAuditEntry(
            state,
            PoliticalLayer.LAW,
            'ศาลรัฐธรรมนูญ',
            `${state.player.name} พ้นจากตำแหน่งนายกรัฐมนตรีเนื่องจากดำรงตำแหน่งรวมครบกำหนด ${state.constitution.pmMaxCumulativeYears} ปี`,
            'รัฐธรรมนูญ มาตรา 158 วรรคสี่',
            'เข้าสู่กระบวนการเลือกนายกรัฐมนตรีคนใหม่ในสภาผู้แทนราษฎร'
          )
        );
      }
    }

    // Financial Settlement
    const roleSalary =
      state.player.role === PlayerRole.PRIME_MINISTER
        ? 125590
        : state.player.role === PlayerRole.MINISTER
        ? 115740
        : state.player.isMP
        ? 113560
        : state.player.role === PlayerRole.LOCAL_ADMIN
        ? 75530
        : state.player.finances.monthlyIncome;

    const netPersonal = roleSalary - state.player.finances.monthlyExpenses;
    state.player.finances.cash = Math.max(0, state.player.finances.cash + netPersonal);

    state.parties.forEach((p) => {
      const monthlyDonation = p.isMajor ? 1.8 : 0.25;
      p.partyFundsMillion = Number((p.partyFundsMillion + monthlyDonation).toFixed(2));
    });

    // Election Countdown
    state.monthsUntilElection -= 1;
    if (state.monthsUntilElection <= 0) {
      runGeneralElection(state);
    } else if (state.monthsUntilElection === 1) {
      state.newsFeed.unshift({
        id: `NWS_ELEC_SOON_${state.dayTick}`,
        eventId: `PRE_ELEC_${state.turn}`,
        tick: state.dayTick,
        dateLabel: formatThaiDate(state.monthIndex, state.yearBE),
        category: 'การเมือง',
        headline: 'โค้งสุดท้ายศึกเลือกตั้งทั่วไปในเดือนหน้า! 57 พรรคการเมืองระดมปราศรัยทั่ว 6 ภูมิภาค',
        summary: 'ผู้ที่ต้องการลงสมัคร ส.ส. ต้องตรวจสอบคุณสมบัติและขึ้นทะเบียนผู้สมัครให้เรียบร้อยก่อนปิดรับสมัคร',
        factStatus: FactCheckStatus.VERIFIED_FACT,
        sourceName: 'สำนักงาน กกต.',
      });
    }

    // NPC Media
    if (state.monthIndex % 2 === 0) {
      const oppParty = state.parties.find((p) => !p.inCoalition && p.isMajor);
      if (oppParty) {
        state.newsFeed.unshift({
          id: `NWS_NPC_${state.dayTick}`,
          eventId: `NPC_MEDIA_${state.turn}`,
          tick: state.dayTick,
          dateLabel: formatThaiDate(state.monthIndex, state.yearBE),
          category: 'การเมือง',
          headline: `${oppParty.leader.name} แถลงชำแหละตัวเลขเศรษฐกิจ ชี้ค่าครองชีพประชาชนยังตึงตัว`,
          summary: `หัวหน้า${oppParty.name} เสนอทางเลือกนโยบายของพรรค พร้อมจับตาการเบิกจ่ายงบประมาณของ 18 กระทรวง`,
          factStatus: FactCheckStatus.CLAIM,
          sourceName: 'รายงานสดจากอาคารรัฐสภา',
        });
      }
    }

    // Economic History update
    const shortMonth = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ][state.monthIndex];

    state.economicHistory = [
      ...state.economicHistory.slice(-17),
      {
        turn: state.turn,
        label: `${shortMonth} ${String(state.yearBE).slice(-2)}`,
        gdpGrowthPct: state.economy.gdpGrowthPct,
        inflationPct: state.economy.inflationPct,
        unemploymentPct: state.economy.unemploymentPct,
        govApproval: avgGovApproval,
        governmentStability: state.governmentStability,
      },
    ];

    // Scandal Risk Drift
    if (state.player.integrityScore >= 75 && state.player.activeInvestigations === 0) {
      state.player.scandalRisk = clamp((state.player.scandalRisk || 0) - 3, 0, 100);
    } else if (state.player.integrityScore < 48) {
      state.player.scandalRisk = clamp((state.player.scandalRisk || 0) + 3, 0, 100);
    }

    // Draw Fresh Hand Monthly
    state.handCardIds = drawHandForPlayer(state);
  }

  // 5. Weekly Parliament & Agency Ticks
  advanceParliamentaryBills(state);
  runIndependentAgenciesTick(state);

  // 6. Coalition Friction Dynamics (Weekly adjustment)
  if (state.coalitionSeatCount < Math.floor(state.constitution.totalSeats / 2) + 1) {
    state.governmentStability = clamp(state.governmentStability - 1.25, 10, 95);
    state.politicalFrictionIndex = clamp(state.politicalFrictionIndex + 1, 10, 95);
  } else if (avgGovApproval < 42) {
    state.politicalFrictionIndex = clamp(state.politicalFrictionIndex + 0.75, 10, 95);
    state.governmentStability = clamp(state.governmentStability - 0.5, 10, 95);
  }

  // Automatic collapse check
  if (state.governmentStability <= 14 && state.parliamentStatus === 'ACTIVE') {
    state.parliamentStatus = 'DISSOLVED_CARETAKER';
    state.isDissolutionElection = true;
    state.monthsUntilElection = 2;
    state.newsFeed.unshift({
      id: `NWS_AUTO_DISSOLVE_${state.dayTick}`,
      eventId: `GOV_COLLAPSE_${state.turn}`,
      tick: state.dayTick,
      dateLabel: formatThaiDate(state.monthIndex, state.yearBE),
      category: 'การเมือง',
      headline: 'รัฐบาลผสมถึงทางตัน! พรรคร่วมถอนตัวจนเกิดวิกฤตเสถียรภาพ ประกาศยุบสภาเลือกตั้งใหม่',
      summary: 'ความขัดแย้งสะสมทำให้นายกรัฐมนตรีตัดสินใจยุบสภาผู้แทนราษฎรเพื่อจัดเลือกตั้งใหม่ภายใน 60 วัน',
      factStatus: FactCheckStatus.VERIFIED_FACT,
      sourceName: 'สำนักข่าวรัฐสภา',
    });
  }

  // 7. Check Narrative Events (Every Week)
  checkAndTriggerPublicInvestigation(state);

  if (!state.activeNarrativeEvent) {
    const evaluatedCandidates = NARRATIVE_EVENTS.map((ev) =>
      evaluateAndBindNarrativeEvent(state, ev)
    ).filter((item): item is NonNullable<typeof item> => item !== null);

    evaluatedCandidates.sort((a, b) => b.priorityScore - a.priorityScore);

    const topContinuation = evaluatedCandidates.find((c) => c.isContinuation);
    if (topContinuation) {
      state.activeNarrativeEvent = topContinuation.boundEvent;
    } else if (evaluatedCandidates.length > 0) {
      // Weekly events trigger chance (lower than monthly but still checkable)
      const recentAnyChainTurn = Math.max(0, ...Object.values(state.chainLastResolvedTurn || {}));
      // New arcs trigger roughly every 2-3 weeks if conditions met
      if (state.turn - recentAnyChainTurn >= 2) {
        state.activeNarrativeEvent = evaluatedCandidates[0].boundEvent;
      }
    }
  }

  // 8. Weekly Replenish Action Points
  state.actionPoints = state.maxActionPoints;
  state.playedThisTurnIds = [];

  // Keep logs tidy
  state.newsFeed = state.newsFeed.slice(0, 35);
  state.auditLog = state.auditLog.slice(0, 60);

  assertAndRepairDataIntegrity(state);
  return state;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

