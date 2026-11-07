import {
  AchievementCategory,
  AchievementTier,
  BillStatus,
  CareerStatsTracker,
  GameState,
  PlayerRole,
  PoliticalLayer,
  UnlockedAchievementRecord,
} from '../types/game';
import { formatThaiDate } from '../utils/storage';

const GLOBAL_ACHIEVEMENTS_KEY = 'kkp_politic2_global_achievements_v1';

export type EmblemMotif =
  | 'BALLOT_CROWN'
  | 'TREASURY_HEX'
  | 'CLEAN_SCALE'
  | 'CIVIC_LOTUS'
  | 'PARTY_SHIELD'
  | 'LOCAL_SEAL'
  | 'PARLIAMENT_DOME'
  | 'LEADER_STAR'
  | 'GAVEL_SCROLL'
  | 'COALITION_KNOT'
  | 'PM_CREST'
  | 'STATESMAN_LAUREL';

export interface AchievementProgressSnapshot {
  percent: number;
  progressLabel: string;
  isMet: boolean;
}

export interface AchievementDefinition {
  id: string;
  titleTh: string;
  titleEn: string;
  category: AchievementCategory;
  categoryLabelTh: string;
  tier: AchievementTier;
  tierLabelTh: string;
  points: number;
  motif: EmblemMotif;
  description: string;
  requirementSummary: string;
  evaluateProgress: (state: GameState) => AchievementProgressSnapshot;
}

export interface GlobalAchievementEntry {
  id: string;
  firstUnlockedISO: string;
  unlockedByPlayer: string;
  unlockedDateLabel: string;
}

export const DEFAULT_CAREER_STATS: CareerStatsTracker = {
  budgetAdjustmentsCount: 0,
  electionsWonCount: 0,
  localElectionsWonCount: 0,
  billsProposedCount: 0,
  coalitionsFormedCount: 0,
  everInvestigated: false,
  monthsInPublicOffice: 0,
};

export function ensureAchievementFields(state: GameState): void {
  if (!Array.isArray(state.unlockedAchievements)) {
    state.unlockedAchievements = [];
  }
  if (!state.careerStats || typeof state.careerStats !== 'object') {
    state.careerStats = {
      ...DEFAULT_CAREER_STATS,
      everInvestigated:
        (state.player?.activeInvestigations || 0) > 0 ||
        Boolean(state.player?.legalDisqualified) ||
        (Array.isArray(state.agencyCases) && state.agencyCases.length > 0),
    };
  } else {
    state.careerStats.budgetAdjustmentsCount = state.careerStats.budgetAdjustmentsCount ?? 0;
    state.careerStats.electionsWonCount = state.careerStats.electionsWonCount ?? 0;
    state.careerStats.localElectionsWonCount = state.careerStats.localElectionsWonCount ?? 0;
    state.careerStats.billsProposedCount = state.careerStats.billsProposedCount ?? 0;
    state.careerStats.coalitionsFormedCount = state.careerStats.coalitionsFormedCount ?? 0;
    state.careerStats.everInvestigated = Boolean(state.careerStats.everInvestigated);
    state.careerStats.monthsInPublicOffice = state.careerStats.monthsInPublicOffice ?? 0;
  }
}

export function isHoldingPublicOffice(role: PlayerRole): boolean {
  return (
    role === PlayerRole.LOCAL_ADMIN ||
    role === PlayerRole.MP_OPPOSITION ||
    role === PlayerRole.MP_GOVERNMENT ||
    role === PlayerRole.OPPOSITION_LEADER ||
    role === PlayerRole.MINISTER ||
    role === PlayerRole.PRIME_MINISTER
  );
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'ACH_FIRST_ELECTION_WIN',
    titleTh: 'ชัยชนะสนามเลือกตั้งครั้งแรก',
    titleEn: 'First Election Win',
    category: 'ELECTION',
    categoryLabelTh: 'การเลือกตั้งและฐานเสียง',
    tier: 'SILVER',
    tierLabelTh: 'เหรียญเงิน',
    points: 20,
    motif: 'BALLOT_CROWN',
    description:
      'คว้าชัยชนะในสนามเลือกตั้งเป็นครั้งแรก ไม่ว่าจะเป็นการเลือกตั้งผู้บริหารท้องถิ่นหรือการเลือกตั้งสมาชิกสภาผู้แทนราษฎรระดับชาติ',
    requirementSummary: 'ชนะเลือกตั้งท้องถิ่น หรือ ได้รับเลือกตั้งเป็น ส.ส. อย่างน้อย 1 สมัย',
    evaluateProgress: (state) => {
      ensureAchievementFields(state);
      const totalWins =
        state.careerStats.electionsWonCount +
        state.careerStats.localElectionsWonCount +
        (state.player.isMP || state.player.role === PlayerRole.LOCAL_ADMIN ? 1 : 0);
      const isMet = totalWins >= 1;
      if (isMet) {
        return {
          percent: 100,
          progressLabel: 'ชนะการเลือกตั้งสำเร็จแล้ว',
          isMet: true,
        };
      }
      const readiness = Math.min(
        95,
        Math.round(
          (state.player.personalApproval / 45) * 50 +
            (state.player.partyId ? 30 : 0) +
            (state.player.role === PlayerRole.MP_CANDIDATE ? 15 : 0)
        )
      );
      return {
        percent: readiness,
        progressLabel: `ชนะเลือกตั้ง 0/1 ครั้ง · คะแนนนิยมส่วนตัว ${state.player.personalApproval}/100`,
        isMet: false,
      };
    },
  },
  {
    id: 'ACH_BUDGET_MASTER',
    titleTh: 'ปรมาจารย์งบประมาณแผ่นดิน',
    titleEn: 'Budget Master',
    category: 'GOVERNANCE',
    categoryLabelTh: 'การบริหารและงบประมาณ',
    tier: 'GOLD',
    tierLabelTh: 'เหรียญทอง',
    points: 35,
    motif: 'TREASURY_HEX',
    description:
      'บริหารปรับเกลี่ยงบประมาณ 18 กระทรวงอย่างเชี่ยวชาญภายใต้เพดานกฎหมาย จนผลักดันเศรษฐกิจเติบโตและยกระดับคุณภาพชีวิตประชาชนพร้อมกัน',
    requirementSummary: 'ปรับงบกระทรวง ≥ 3 ครั้ง · GDP ≥ +3.2% · ดัชนีคุณภาพชีวิต ≥ 65',
    evaluateProgress: (state) => {
      ensureAchievementFields(state);
      const adj = state.careerStats.budgetAdjustmentsCount;
      const gdp = state.economy.gdpGrowthPct;
      const qol = state.economy.qualityOfLifeIndex;

      const adjPart = Math.min(1, adj / 3);
      const gdpPart = Math.min(1, Math.max(0, gdp) / 3.2);
      const qolPart = Math.min(1, qol / 65);

      const isMet = adj >= 3 && gdp >= 3.2 && qol >= 65;
      const percent = isMet ? 100 : Math.min(99, Math.round(((adjPart + gdpPart + qolPart) / 3) * 100));

      return {
        percent,
        progressLabel: `ปรับงบ ${Math.min(adj, 3)}/3 ครั้ง · GDP ${gdp >= 0 ? `+${gdp}` : gdp}%/3.2% · คุณภาพชีวิต ${qol}/65`,
        isMet,
      };
    },
  },
  {
    id: 'ACH_SCANDAL_FREE',
    titleTh: 'นักการเมืองมือสะอาดไร้มลทิน',
    titleEn: 'Scandal-Free Politician',
    category: 'INTEGRITY',
    categoryLabelTh: 'จริยธรรมและความโปร่งใส',
    tier: 'GOLD',
    tierLabelTh: 'เหรียญทอง',
    points: 35,
    motif: 'CLEAN_SCALE',
    description:
      'ปฏิบัติหน้าที่ในตำแหน่งทางการเมืองครบ 12 เดือนขึ้นไป โดยไม่เคยถูกองค์กรอิสระเปิดคดีสอบสวนทุจริตเลยแม้แต่คดีเดียว และรักษาคะแนนจริยธรรมระดับสูง',
    requirementSummary: 'ดำรงตำแหน่งการเมือง ≥ 12 เดือน · ไม่เคยถูกตั้งกรรมการสอบสวน · จริยธรรม ≥ 85',
    evaluateProgress: (state) => {
      ensureAchievementFields(state);
      const tarnished =
        state.careerStats.everInvestigated ||
        state.player.activeInvestigations > 0 ||
        state.player.legalDisqualified ||
        state.agencyCases.some((c) => c.targetName === state.player.name);

      if (tarnished) {
        return {
          percent: 0,
          progressLabel: 'เคยมีประวัติถูกเปิดสำนวนตรวจสอบแล้วในรอบการเล่นนี้',
          isMet: false,
        };
      }

      const months = state.careerStats.monthsInPublicOffice;
      const integrity = state.player.integrityScore;
      const isMet = months >= 12 && integrity >= 85;
      const percent = isMet
        ? 100
        : Math.min(99, Math.round((Math.min(1, months / 12) * 0.65 + Math.min(1, integrity / 85) * 0.35) * 100));

      return {
        percent,
        progressLabel: `ปฏิบัติหน้าที่ไร้มลทิน ${Math.min(months, 12)}/12 เดือน · จริยธรรม ${integrity}/85`,
        isMet,
      };
    },
  },
  {
    id: 'ACH_GRASSROOTS_VOICE',
    titleTh: 'ขวัญใจมวลชนรากหญ้า',
    titleEn: 'Grassroots Champion',
    category: 'CAREER',
    categoryLabelTh: 'เส้นทางชีวิตและสังคม',
    tier: 'BRONZE',
    tierLabelTh: 'เหรียญทองแดง',
    points: 10,
    motif: 'CIVIC_LOTUS',
    description:
      'สั่งสมทุนทางสังคมจากการลงพื้นที่แก้ไขปัญหาชุมชนจนเป็นที่ยอมรับอย่างกว้างขวางก่อนก้าวสู่เวทีอำนาจระดับชาติ',
    requirementSummary: 'ชื่อเสียงทางสังคม ≥ 70 และ เครือข่ายมวลชน ≥ 60',
    evaluateProgress: (state) => {
      const rep = state.player.socialReputation;
      const net = state.player.networkStrength;
      const isMet = rep >= 70 && net >= 60;
      const percent = isMet
        ? 100
        : Math.min(99, Math.round(((Math.min(1, rep / 70) + Math.min(1, net / 60)) / 2) * 100));
      return {
        percent,
        progressLabel: `ชื่อเสียงสังคม ${rep}/70 · เครือข่าย ${net}/60`,
        isMet,
      };
    },
  },
  {
    id: 'ACH_PARTY_VANGUARD',
    titleTh: 'เสาหลักพรรคการเมือง',
    titleEn: 'Party Vanguard',
    category: 'ELECTION',
    categoryLabelTh: 'การเลือกตั้งและฐานเสียง',
    tier: 'BRONZE',
    tierLabelTh: 'เหรียญทองแดง',
    points: 15,
    motif: 'PARTY_SHIELD',
    description:
      'สังกัดพรรคการเมืองครบกำหนดระยะเวลาตามรัฐธรรมนูญ พร้อมได้รับความไว้วางใจสูงจากคณะกรรมการบริหารพรรค',
    requirementSummary: 'สังกัดพรรคครบเกณฑ์วันตามรัฐธรรมนูญ และ ความไว้วางใจพรรค ≥ 70',
    evaluateProgress: (state) => {
      const reqDays = state.isDissolutionElection
        ? state.constitution.dissolutionPartyMembershipDays
        : state.constitution.normalPartyMembershipDays;
      const days =
        state.player.partyId && state.player.partyJoinDayTick !== null
          ? Math.max(0, state.dayTick - state.player.partyJoinDayTick)
          : 0;
      const party = state.parties.find((p) => p.id === state.player.partyId);
      const trust = party ? party.trustWithPlayer : 0;

      const isMet = Boolean(party) && days >= reqDays && trust >= 70;
      const percent = isMet
        ? 100
        : !party
        ? 0
        : Math.min(99, Math.round(((Math.min(1, days / Math.max(1, reqDays)) + Math.min(1, trust / 70)) / 2) * 100));

      return {
        percent,
        progressLabel: party
          ? `สังกัดพรรค ${Math.min(days, reqDays)}/${reqDays} วัน · ความไว้วางใจพรรค ${trust}/70`
          : 'ยังไม่ได้เข้าสังกัดพรรคการเมือง',
        isMet,
      };
    },
  },
  {
    id: 'ACH_LOCAL_PIONEER',
    titleTh: 'นักบริหารท้องถิ่นมืออาชีพ',
    titleEn: 'Local Pioneer',
    category: 'CAREER',
    categoryLabelTh: 'เส้นทางชีวิตและสังคม',
    tier: 'SILVER',
    tierLabelTh: 'เหรียญเงิน',
    points: 20,
    motif: 'LOCAL_SEAL',
    description:
      'พิสูจน์ฝีมือการบริหารงานสาธารณะระดับเทศบาลและภูมิภาคบ้านเกิด ซึ่งเป็นรากฐานสำคัญของประชาธิปไตยกระจายอำนาจ',
    requirementSummary: 'ชนะการเลือกตั้งดำรงตำแหน่งผู้บริหารท้องถิ่น (นายกเทศมนตรี)',
    evaluateProgress: (state) => {
      ensureAchievementFields(state);
      const isMet =
        state.player.role === PlayerRole.LOCAL_ADMIN || state.careerStats.localElectionsWonCount >= 1;
      const score = Math.round(
        state.player.socialReputation * 0.5 +
          state.player.personalApproval * 0.6 +
          state.player.networkStrength * 0.3
      );
      return {
        percent: isMet ? 100 : Math.min(95, Math.round((score / 46) * 100)),
        progressLabel: isMet ? 'ดำรงตำแหน่งผู้บริหารท้องถิ่นสำเร็จ' : `ดัชนีความพร้อมลงสนามท้องถิ่น ${score}/46`,
        isMet,
      };
    },
  },
  {
    id: 'ACH_PARLIAMENT_DEBUT',
    titleTh: 'ผู้แทนปวงชนชาวไทย',
    titleEn: 'Voice of the House',
    category: 'ELECTION',
    categoryLabelTh: 'การเลือกตั้งและฐานเสียง',
    tier: 'SILVER',
    tierLabelTh: 'เหรียญเงิน',
    points: 25,
    motif: 'PARLIAMENT_DOME',
    description:
      'ได้รับการรับรองผลจาก กกต. ก้าวเข้าสู่อาคารรัฐสภาในฐานะสมาชิกสภาผู้แทนราษฎรเพื่อทำหน้าที่ฝ่ายนิติบัญญัติ',
    requirementSummary: 'ได้รับเลือกตั้งเป็นสมาชิกสภาผู้แทนราษฎร (ส.ส. เขต หรือ บัญชีรายชื่อ)',
    evaluateProgress: (state) => {
      ensureAchievementFields(state);
      const isMet = state.player.isMP || state.careerStats.electionsWonCount >= 1;
      return {
        percent: isMet ? 100 : state.player.role === PlayerRole.MP_CANDIDATE ? 65 : state.player.partyId ? 30 : 0,
        progressLabel: isMet
          ? 'ได้รับการรับรองเป็นสมาชิกสภาผู้แทนราษฎรแล้ว'
          : state.player.role === PlayerRole.MP_CANDIDATE
          ? `ขึ้นทะเบียนผู้สมัคร ส.ส. แล้ว (รอเลือกตั้งใน ${state.monthsUntilElection} เดือน)`
          : 'สมัครเข้าพรรคและขึ้นทะเบียนผู้สมัคร ส.ส. ก่อนวันเลือกตั้ง',
        isMet,
      };
    },
  },
  {
    id: 'ACH_PARTY_LEADER',
    titleTh: 'ผู้นำพรรคและแคนดิเดตนายกฯ',
    titleEn: 'Party Leader',
    category: 'CAREER',
    categoryLabelTh: 'เส้นทางชีวิตและสังคม',
    tier: 'GOLD',
    tierLabelTh: 'เหรียญทอง',
    points: 30,
    motif: 'LEADER_STAR',
    description:
      'ได้รับมติที่ประชุมใหญ่วิสามัญให้ขึ้นกุมบังเหียนหัวหน้าพรรคการเมือง พร้อมได้รับการเสนอชื่อในบัญชีแคนดิเดตนายกรัฐมนตรี',
    requirementSummary: 'ดำรงตำแหน่งหัวหน้าพรรคการเมือง (ผ่านการชิงตำแหน่งหรือก่อตั้งพรรคใหม่)',
    evaluateProgress: (state) => {
      const isMet = state.player.isPartyLeader;
      const power = Math.round(
        state.player.networkStrength * 0.45 +
          state.player.politicalExperience * 0.4 +
          state.player.personalApproval * 0.35
      );
      return {
        percent: isMet ? 100 : Math.min(95, Math.round((power / 48) * 100)),
        progressLabel: isMet ? 'ดำรงตำแหน่งหัวหน้าพรรคการเมืองแล้ว' : `บารมีในที่ประชุมพรรค ${power}/48`,
        isMet,
      };
    },
  },
  {
    id: 'ACH_MASTER_LAWMAKER',
    titleTh: 'สถาปนิกนิติบัญญัติ',
    titleEn: 'Master Lawmaker',
    category: 'GOVERNANCE',
    categoryLabelTh: 'การบริหารและงบประมาณ',
    tier: 'GOLD',
    tierLabelTh: 'เหรียญทอง',
    points: 30,
    motif: 'GAVEL_SCROLL',
    description:
      'ผลักดันร่างพระราชบัญญัติที่คุณเป็นผู้ริเริ่มเสนอ จนผ่านความเห็นชอบทั้ง 3 วาระและประกาศบังคับใช้ในราชกิจจานุเบกษาสำเร็จ',
    requirementSummary: 'มีร่างกฎหมายที่คุณเสนอประกาศบังคับใช้สำเร็จ (PROMULGATED) อย่างน้อย 1 ฉบับ',
    evaluateProgress: (state) => {
      const playerBills = state.bills.filter((b) => b.proposerName === state.player.name);
      const passedCount = playerBills.filter((b) => b.status === BillStatus.PROMULGATED).length;
      const activeCount = playerBills.filter(
        (b) => b.status !== BillStatus.PROMULGATED && b.status !== BillStatus.REJECTED
      ).length;

      const isMet = passedCount >= 1;
      return {
        percent: isMet ? 100 : activeCount > 0 ? 60 : 0,
        progressLabel: isMet
          ? `ประกาศใช้กฎหมายสำเร็จ ${passedCount} ฉบับ`
          : activeCount > 0
          ? `กำลังพิจารณาอยู่ในระเบียบวาระสภา ${activeCount} ฉบับ`
          : 'เสนอร่าง พ.ร.บ. เข้าสู่สภาเมื่อดำรงตำแหน่ง ส.ส. หรือรัฐมนตรี',
        isMet,
      };
    },
  },
  {
    id: 'ACH_COALITION_ARCHITECT',
    titleTh: 'ผู้จัดตั้งรัฐบาลเสียงข้างมาก',
    titleEn: 'Coalition Architect',
    category: 'GOVERNANCE',
    categoryLabelTh: 'การบริหารและงบประมาณ',
    tier: 'GOLD',
    tierLabelTh: 'เหรียญทอง',
    points: 35,
    motif: 'COALITION_KNOT',
    description:
      'เจรจาประสานขั้วการเมืองและแบ่งโควตาคณะรัฐมนตรีอย่างสมดุล จนสร้างรัฐบาลผสมเสียงข้างมากที่มีเสถียรภาพสูง',
    requirementSummary: 'ร่วมจัดตั้งรัฐบาลผสม ≥ 1 ครั้ง · เสียงเกินกึ่งหนึ่ง · เสถียรภาพรัฐบาล ≥ 72%',
    evaluateProgress: (state) => {
      ensureAchievementFields(state);
      const majority = Math.floor(state.constitution.totalSeats / 2) + 1;
      const formed = state.careerStats.coalitionsFormedCount;
      const seats = state.coalitionSeatCount;
      const stab = state.governmentStability;

      const isMet = formed >= 1 && seats >= majority && stab >= 72;
      const pFormed = Math.min(1, formed / 1);
      const pSeats = Math.min(1, seats / majority);
      const pStab = Math.min(1, stab / 72);
      const percent = isMet ? 100 : Math.min(99, Math.round((pFormed * 0.5 + pSeats * 0.25 + pStab * 0.25) * 100));

      return {
        percent,
        progressLabel: `ตั้งรัฐบาล ${Math.min(formed, 1)}/1 ครั้ง · เสียง ${seats}/${majority} · เสถียรภาพ ${stab}/72%`,
        isMet,
      };
    },
  },
  {
    id: 'ACH_PRIME_MINISTER',
    titleTh: 'ประมุขฝ่ายบริหาร',
    titleEn: 'Prime Minister',
    category: 'CAREER',
    categoryLabelTh: 'เส้นทางชีวิตและสังคม',
    tier: 'PLATINUM',
    tierLabelTh: 'เหรียญแพลทินัม',
    points: 50,
    motif: 'PM_CREST',
    description:
      'ก้าวสู่จุดสูงสุดของสายอาชีพการเมืองในระบบรัฐสภา ด้วยการดำรงตำแหน่งนายกรัฐมนตรีแห่งราชอาณาจักรไทยตามรัฐธรรมนูญ',
    requirementSummary: 'ได้รับความเห็นชอบให้ดำรงตำแหน่งนายกรัฐมนตรี',
    evaluateProgress: (state) => {
      const isMet =
        state.player.role === PlayerRole.PRIME_MINISTER ||
        state.primeMinisterName === state.player.name ||
        state.player.cumulativePMDays > 0;
      const progress = isMet
        ? 100
        : state.player.role === PlayerRole.MINISTER || state.player.isPartyLeader
        ? 75
        : state.player.isMP
        ? 45
        : state.player.partyId
        ? 20
        : 5;
      return {
        percent: progress,
        progressLabel: isMet
          ? 'ก้าวขึ้นดำรงตำแหน่งนายกรัฐมนตรีสำเร็จ'
          : `ตำแหน่งปัจจุบัน: ${state.player.isPartyLeader ? 'หัวหน้าพรรค (พร้อมชิงนายกฯ)' : 'สะสมฐานที่นั่งและขึ้นเป็นหัวหน้าพรรคแกนนำ'}`,
        isMet,
      };
    },
  },
  {
    id: 'ACH_STATESMAN_LEGACY',
    titleTh: 'รัฐบุรุษผู้สร้างมรดกการเมือง',
    titleEn: 'Statesman Legacy',
    category: 'INTEGRITY',
    categoryLabelTh: 'จริยธรรมและความโปร่งใส',
    tier: 'PLATINUM',
    tierLabelTh: 'เหรียญแพลทินัม',
    points: 60,
    motif: 'STATESMAN_LAUREL',
    description:
      'สร้างหมุดหมายทางประวัติศาสตร์ด้วยการผลักดันการแก้ไขรัฐธรรมนูญสำเร็จ หรือบริหารประเทศในฐานะนายกรัฐมนตรีครบ 2 ปีด้วยความนิยมสูงโดยไร้มลทิน',
    requirementSummary: 'แก้รัฐธรรมนูญสำเร็จ หรือ เป็นนายกฯ สะสม ≥ 720 วัน พร้อมคะแนนนิยม ≥ 75 โดยไม่ถูกตัดสิทธิ',
    evaluateProgress: (state) => {
      const passedConst = state.bills.some(
        (b) =>
          b.proposerName === state.player.name &&
          b.category === 'CONSTITUTIONAL' &&
          b.status === BillStatus.PROMULGATED
      );
      const pmLegacy =
        state.player.cumulativePMDays >= 720 &&
        state.player.personalApproval >= 75 &&
        !state.player.legalDisqualified;

      const isMet = passedConst || pmLegacy;
      const pmPct = Math.round(
        (Math.min(1, state.player.cumulativePMDays / 720) * 0.6 +
          Math.min(1, state.player.personalApproval / 75) * 0.4) *
          100
      );
      return {
        percent: isMet ? 100 : Math.min(99, pmPct),
        progressLabel: isMet
          ? 'จารึกชื่อในประวัติศาสตร์การเมืองไทยเรียบร้อยแล้ว'
          : `วาระนายกฯ สะสม ${state.player.cumulativePMDays}/720 วัน · คะแนนนิยม ${state.player.personalApproval}/75`,
        isMet,
      };
    },
  },
];

export function loadGlobalUnlockedAchievements(): Record<string, GlobalAchievementEntry> {
  try {
    const raw = localStorage.getItem(GLOBAL_ACHIEVEMENTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function syncGlobalUnlockedAchievements(
  playerName: string,
  records: UnlockedAchievementRecord[]
): Record<string, GlobalAchievementEntry> {
  const current = loadGlobalUnlockedAchievements();
  let changed = false;
  for (const rec of records) {
    if (!current[rec.id]) {
      current[rec.id] = {
        id: rec.id,
        firstUnlockedISO: new Date().toISOString(),
        unlockedByPlayer: playerName,
        unlockedDateLabel: rec.unlockedDateLabel,
      };
      changed = true;
    }
  }
  if (changed) {
    try {
      localStorage.setItem(GLOBAL_ACHIEVEMENTS_KEY, JSON.stringify(current));
    } catch {
      // Ignore storage quota errors
    }
  }
  return current;
}

/**
 * Evaluates all 12 Career Achievements against current GameState,
 * appends newly unlocked badges, writes to the official Audit Log,
 * and returns newly unlocked definitions so the UI can celebrate them.
 */
export function evaluateAndUnlockAchievements(state: GameState): AchievementDefinition[] {
  ensureAchievementFields(state);
  const existingIds = new Set(state.unlockedAchievements.map((u) => u.id));
  const dateLabel = formatThaiDate(state.monthIndex, state.yearBE);
  const newlyUnlocked: AchievementDefinition[] = [];

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (existingIds.has(def.id)) continue;
    const snap = def.evaluateProgress(state);
    if (snap.isMet) {
      const record: UnlockedAchievementRecord = {
        id: def.id,
        unlockedTurn: state.turn,
        unlockedDateLabel: dateLabel,
        roleAtUnlock: state.player.role,
      };
      state.unlockedAchievements.push(record);
      existingIds.add(def.id);
      newlyUnlocked.push(def);

      state.auditLog.unshift({
        id: `AUD_ACH_${def.id}_${state.dayTick}`,
        tick: state.dayTick,
        dateLabel,
        layer: PoliticalLayer.LIFE,
        actor: state.player.name,
        action: `ปลดล็อกตราเกียรติยศ "${def.titleTh}" (${def.titleEn})`,
        legalAuthority: `บันทึกเกียรติประวัติอาชีพการเมือง · ระดับ${def.tierLabelTh} (+${def.points} แต้มเกียรติยศ)`,
        outcome: def.description,
      });
    }
  }

  if (state.unlockedAchievements.length > 0) {
    syncGlobalUnlockedAchievements(state.player.name, state.unlockedAchievements);
  }

  return newlyUnlocked;
}

export function calculateAchievementPoints(unlockedIds: Set<string>): {
  earnedPoints: number;
  maxPoints: number;
} {
  let earnedPoints = 0;
  let maxPoints = 0;
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    maxPoints += def.points;
    if (unlockedIds.has(def.id)) {
      earnedPoints += def.points;
    }
  }
  return { earnedPoints, maxPoints };
}
