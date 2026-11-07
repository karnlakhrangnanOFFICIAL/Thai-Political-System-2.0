import {
  FactCheckStatus,
  FinancialLedgerType,
  NarrativeEvent,
  PlayerRole,
} from '../types/game';

export interface PoliticalStoryChainSpec {
  chainId: string;
  title: string;
  subtitle: string;
  totalEpisodes: number;
  triggerOverview: string;
  episodeEventIds: string[];
}

const PARLIAMENT_AND_PARTY_ROLES: PlayerRole[] = [
  PlayerRole.PARTY_MEMBER,
  PlayerRole.MP_CANDIDATE,
  PlayerRole.MP_OPPOSITION,
  PlayerRole.MP_GOVERNMENT,
  PlayerRole.OPPOSITION_LEADER,
  PlayerRole.PARTY_LEADER,
  PlayerRole.MINISTER,
  PlayerRole.PRIME_MINISTER,
];

const PARLIAMENT_FLOOR_ROLES: PlayerRole[] = [
  PlayerRole.MP_OPPOSITION,
  PlayerRole.MP_GOVERNMENT,
  PlayerRole.OPPOSITION_LEADER,
  PlayerRole.PARTY_LEADER,
  PlayerRole.MINISTER,
  PlayerRole.PRIME_MINISTER,
];

export const POLITICAL_STORY_CHAINS: PoliticalStoryChainSpec[] = [
  {
    chainId: 'CHAIN_BUDGET_WHIP',
    title: 'ศึกกรรมาธิการงบประมาณและวิกฤตสภาล่ม',
    subtitle: 'การแปรญัตติงบพัฒนาภูมิภาค · เกมนับองค์ประชุมคืนก่อนโหวตวาระ 3 · การจัดระเบียบมุ้ง ส.ส.',
    totalEpisodes: 3,
    triggerOverview:
      'สภาเปิดสมัยประชุม · เทิร์น >= 2 · เศรษฐกิจพื้นที่ภูมิภาคอ่อนแรงต่ำกว่า 68/100 หรือ GDP <= 3.3%',
    episodeEventIds: [
      'EVT_CHAIN_BUDGET_EP1',
      'EVT_CHAIN_BUDGET_EP2',
      'EVT_CHAIN_BUDGET_EP3',
    ],
  },
  {
    chainId: 'CHAIN_COALITION_PORTFOLIO',
    title: 'รอยร้าวพรรคร่วมและศึกชิงกระทรวงเศรษฐกิจ',
    subtitle: 'แรงกดดันค่าครองชีพภูมิภาค · วาระ ครม. ค้างท่อ · จุดชี้ขาดปฏิญญาปรับคณะรัฐมนตรี',
    totalEpisodes: 3,
    triggerOverview:
      'เทิร์น >= 2 · ความเชื่อมั่นผู้บริโภค <= 58 หรือดัชนีความขัดแย้งพรรคร่วม >= 38% ผูกกับภาคที่นิยมรัฐบาลต่ำสุด',
    episodeEventIds: [
      'EVT_CHAIN_COALITION_EP1',
      'EVT_CHAIN_COALITION_EP2',
      'EVT_CHAIN_COALITION_EP3',
    ],
  },
  {
    chainId: 'CHAIN_CENSURE_DOSSIER',
    title: 'เอกสารลับเมกะโปรเจกต์และเกมซักฟอกข้ามขั้ว',
    subtitle: 'เบาะแสโครงการโครงสร้างพื้นฐานภูมิภาค · ดีลลับก่อนขึ้นอภิปราย · มติสะเทือนสภาผู้แทนฯ',
    totalEpisodes: 3,
    triggerOverview:
      'สภาเปิดสมัยประชุม · เทิร์น >= 3 · คะแนนโครงสร้างพื้นฐานภูมิภาค <= 78/100',
    episodeEventIds: [
      'EVT_CHAIN_DOSSIER_EP1',
      'EVT_CHAIN_DOSSIER_EP2',
      'EVT_CHAIN_DOSSIER_EP3',
    ],
  },
  {
    chainId: 'CHAIN_REGIONAL_FACTION',
    title: 'คลื่นใต้น้ำซุ้มการเมืองภูมิภาคก่อนศึกเลือกตั้ง',
    subtitle: 'สัญญาณต่อรองย้ายขั้วบ้านใหญ่ · ศึกไพรมารีโหวตเดือด · ยุทธศาสตร์ปักธงฐานเสียงบ้านเกิด',
    totalEpisodes: 3,
    triggerOverview:
      'เทิร์น >= 2 · ผูกกับภูมิภาคบ้านเกิดโดยตรงเมื่อเข้าใกล้เลือกตั้ง (<= 14 เดือน) หรือนิยมรัฐบาลในภาค <= 60%',
    episodeEventIds: [
      'EVT_CHAIN_FACTION_EP1',
      'EVT_CHAIN_FACTION_EP2',
      'EVT_CHAIN_FACTION_EP3',
    ],
  },
];

export const MULTI_PART_POLITICAL_EVENTS: NarrativeEvent[] = [
  // ============================================================================
  // CHAIN 1: ศึกกรรมาธิการงบประมาณและวิกฤตสภาล่ม (3 EPISODES)
  // ============================================================================
  {
    id: 'EVT_CHAIN_BUDGET_EP1',
    chainId: 'CHAIN_BUDGET_WHIP',
    chainTitle: 'ศึกกรรมาธิการงบประมาณและวิกฤตสภาล่ม',
    episodeNumber: 1,
    totalEpisodes: 3,
    category: 'POLITICAL',
    title: 'ศึกห้องกรรมาธิการงบฯ: แปรญัตติชิงงบฟื้นฟู {{targetRegionName}}',
    severity: 72,
    description:
      'ห้องประชุมคณะกรรมาธิการวิสามัญพิจารณางบประมาณตึงเครียดถึงขีดสุด เมื่อตัวเลข GDP อยู่ที่ {{gdpGrowth}}% และดัชนีเศรษฐกิจของ{{targetRegionName}}ชะลอตัว กลุ่มกรรมาธิการจากพรรคร่วมฝั่งภูมิภาคยื่นคำขาดขอเกลี่ยงบลงทุนส่วนกลางลงไปทำโครงการแหล่งน้ำและถนนท้องถิ่นใน{{targetRegionName}} หากไม่ยอมปรับแก้ ขู่จะสงวนคำแปรญัตติถล่มกลางสภา',
    contextQuote:
      '“ตัวเลขในเอกสารงบประมาณทุกบรรทัด คือเดิมพันคะแนนเสียงของ ส.ส. เขตในสนามเลือกตั้งรอบหน้า”',
    requiresParliamentActive: true,
    requiredRoles: PARLIAMENT_AND_PARTY_ROLES,
    minTurn: 2,
    targetRegionScope: 'LOWEST_ECONOMY_REGION',
    maxRegionalEconomy: 68,
    maxGdpGrowthPct: 3.4,
    excludedFlag: 'FLAG_CHAIN_BUDGET_STARTED',
    choices: [
      {
        id: 'CH_BUDGET_EP1_PRAGMATIC',
        label: 'เจรจาสูตรประนีประนอม จัดสรรงบฟื้นฟู {{targetRegionName}} ตามเกณฑ์รายได้ต่อหัวจริง',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'ทุกขั้วในห้องกรรมาธิการยอมถอยคนละก้าว งบประมาณเดินหน้าต่อได้พร้อมแรงหนุนในพื้นที่เป้าหมาย',
        setFlag: 'FLAG_BUDGET_EP1_PRAGMATIC',
        newsHeadline:
          'กรรมาธิการงบฯ บรรลุข้อตกลงเกลี่ยงบพัฒนา {{targetRegionName}} ลดแรงปะทะพรรคร่วม',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          reputationDelta: 4,
          personalApprovalDelta: 5,
          frictionDelta: -5,
          govStabilityDelta: 4,
          targetRegionEconomyDelta: 4,
          targetRegionApprovalDelta: 4,
          partyTrustDelta: 6,
        },
      },
      {
        id: 'CH_BUDGET_EP1_REFORM',
        label: 'ยืนหยัดตัดงบโครงการซ้ำซ้อนและเปิดเผยบันทึกการแปรญัตติต่อสาธารณะ',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'ประชาชนและสื่อชื่นชมความโปร่งใสอย่างท่วมท้น แต่สร้างความไม่พอใจให้ซุ้ม ส.ส. สายโควตาพื้นที่อย่างหนัก',
        setFlag: 'FLAG_BUDGET_EP1_REFORM',
        newsHeadline:
          'ฮือฮาสภา! เปิดบันทึกห้องกรรมาธิการงบฯ หั่นโครงการซ้ำซ้อน ท่ามกลางแรงต้านกลุ่มมุ้งการเมือง',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          integrityDelta: 8,
          reputationDelta: 7,
          personalApprovalDelta: 7,
          scandalRiskDelta: -8,
          frictionDelta: 7,
          coalitionSatisfactionDelta: -6,
        },
      },
      {
        id: 'CH_BUDGET_EP1_PORK',
        label: 'เดินดีลลับในอนุกรรมาธิการ ดึงงบเฉพาะกิจลง {{targetRegionName}} และฐานเสียงพรรค',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'ได้ใจหัวคะแนนและพรรคร่วมสายพื้นที่อย่างรวดเร็ว แต่ถูกฝ่ายตรวจสอบเล็งเป้าเรื่องผลประโยชน์ทับซ้อน',
        setFlag: 'FLAG_BUDGET_EP1_PORK',
        newsHeadline:
          'ฝ่ายค้านตั้งข้อสังเกตงบเฉพาะกิจกระจุกตัวใน {{targetRegionName}} จ่อขุดใบแปรญัตติ',
        newsFactStatus: FactCheckStatus.CLAIM,
        effects: {
          partyTrustDelta: 10,
          partyPopularityDelta: 1.5,
          targetRegionApprovalDelta: 6,
          targetRegionPartyStrengthDelta: 0.12,
          integrityDelta: -8,
          scandalRiskDelta: 18,
        },
      },
    ],
  },
  {
    id: 'EVT_CHAIN_BUDGET_EP2',
    chainId: 'CHAIN_BUDGET_WHIP',
    chainTitle: 'ศึกกรรมาธิการงบประมาณและวิกฤตสภาล่ม',
    episodeNumber: 2,
    totalEpisodes: 3,
    minTurnsAfterPreviousEpisode: 1,
    category: 'POLITICAL',
    title: 'คืนหมาหอนก่อนโหวตวาระ 3: เกมขู่นับองค์ประชุมสภาล่ม',
    severity: 80,
    description:
      'ผลพวงจากการจัดสรรงบพัฒนา{{targetRegionName}}ในชั้นกรรมาธิการลุกลามถึงคืนก่อนลงมติวาระชี้ขาด! กลุ่ม ส.ส. ต่างมุ้งราว 30 ชีวิตนัดรวมตัวนอกสภา ขู่จะไม่กดบัตรแสดงตนเป็นองค์ประชุมในวันพรุ่งนี้ หากวิปไม่สามารถเคลียร์ข้อเรียกร้องได้ทันก่อนเสียงกริ่งเรียกประชุมดังขึ้น',
    contextQuote:
      '“การไม่กดบัตรแสดงตนเพียงไม่กี่สิบคน มีอานุภาพสั่นคลอนรัฐบาลได้พอๆ กับการอภิปรายไม่ไว้วางใจ”',
    requiresParliamentActive: true,
    requiredFlagsAny: [
      'FLAG_BUDGET_EP1_PRAGMATIC',
      'FLAG_BUDGET_EP1_REFORM',
      'FLAG_BUDGET_EP1_PORK',
    ],
    excludedFlag: 'FLAG_CHAIN_BUDGET_EP2_DONE',
    targetRegionScope: 'LOWEST_ECONOMY_REGION',
    choices: [
      {
        id: 'CH_BUDGET_EP2_WHIP_LOCK',
        label: 'ระดมวิปประสานหัวหน้าพรรคร่วมทุกขั้ว ตรึง ส.ส. เฝ้าห้องประชุมรายบุคคล',
        ledgerType: FinancialLedgerType.PERSONAL,
        cost: 12000,
        outcomeSummary:
          'รักษาองค์ประชุมผ่านเส้นตายไปได้แบบหืดจับ เสริมบารมีผู้ประสานงานสิบทิศในสภา',
        setFlag: 'FLAG_BUDGET_EP2_WHIP_LOCK',
        newsHeadline:
          'วิปทำงานหนักตลอดคืน! ตรึงเสียง ส.ส. รักษาองค์ประชุมพิจารณางบประมาณผ่านฉลุย',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          reputationDelta: 5,
          govStabilityDelta: 6,
          frictionDelta: -6,
          partyUnityDelta: 6,
        },
      },
      {
        id: 'CH_BUDGET_EP2_PUBLIC_PRESSURE',
        label: 'แถลงเปิดชื่อกลุ่มที่ขู่ทำสภาล่ม ให้ประชาชนใน {{targetRegionName}} ช่วยจับตา',
        requiredFlag: 'FLAG_BUDGET_EP1_REFORM',
        requiredFlagHint: 'ต้องเลือกแนวทางเปิดเผยบันทึกกรรมาธิการต่อสาธารณะในตอนที่ 1',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'กระแสสังคมกดดันจนกลุ่มขู่โดดประชุมไม่กล้าขวางงบประมาณ คะแนนนิยมส่วนตัวพุ่งทะยาน!',
        setFlag: 'FLAG_BUDGET_EP2_PUBLIC_PRESSURE',
        newsHeadline:
          'กระแสสังคมกดดันหนัก! ส.ส. แห่เข้าห้องประชุมครบหลังถูกเปิดโปงแผนทำสภาล่ม',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          personalApprovalDelta: 10,
          reputationDelta: 8,
          integrityDelta: 5,
          govStabilityDelta: 5,
          targetRegionApprovalDelta: 5,
        },
      },
      {
        id: 'CH_BUDGET_EP2_CHAIR_SWAP',
        label: 'เปิดดีลแลกเก้าอี้ประธานคณะกรรมาธิการสามัญ 2 คณะเพื่อดึงเสียงเข้าห้องประชุม',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'องค์ประชุมกลับมาเกินกึ่งหนึ่งอย่างท่วมท้น แต่เพิ่มแรงต่อรองการเมืองแบบต่างตอบแทน',
        setFlag: 'FLAG_BUDGET_EP2_CHAIR_SWAP',
        newsHeadline:
          'สะพัดดีลเก้าอี้ประธานกรรมาธิการแลกเสียงแสดงตน พาร่างกฎหมายฝ่าวิกฤตองค์ประชุม',
        newsFactStatus: FactCheckStatus.CLAIM,
        effects: {
          govStabilityDelta: 8,
          frictionDelta: -8,
          coalitionSatisfactionDelta: 8,
          integrityDelta: -5,
          scandalRiskDelta: 12,
        },
      },
    ],
  },
  {
    id: 'EVT_CHAIN_BUDGET_EP3',
    chainId: 'CHAIN_BUDGET_WHIP',
    chainTitle: 'ศึกกรรมาธิการงบประมาณและวิกฤตสภาล่ม',
    episodeNumber: 3,
    totalEpisodes: 3,
    minTurnsAfterPreviousEpisode: 1,
    category: 'POLITICAL',
    title: 'บทสรุปศึกงบประมาณ: กลไกเบิกจ่ายจริงสู่ {{targetRegionName}} และสมดุลอำนาจสภา',
    severity: 76,
    description:
      'เมื่องบประมาณผ่านด่านสภาผู้แทนราษฎรมาได้ ถึงเวลาตัดสินใจวางกลไกกำกับการเบิกจ่ายเม็ดเงินฟื้นฟูเศรษฐกิจ{{targetRegionName}} ซึ่งจะเป็นบทพิสูจน์สุดท้ายของมหากาพย์งบประมาณรอบนี้ว่าจะแปรเปลี่ยนเป็นตัวเลข GDP และศรัทธาประชาชน หรือกลายเป็นชนวนความขัดแย้งรอบใหม่',
    contextQuote:
      '“ชัยชนะในวันโหวตเป็นเพียงครึ่งทาง อีกครึ่งหนึ่งวัดกันที่เม็ดเงินไปถึงมือประชาชนจริงหรือไม่”',
    requiredFlagsAny: [
      'FLAG_BUDGET_EP2_WHIP_LOCK',
      'FLAG_BUDGET_EP2_PUBLIC_PRESSURE',
      'FLAG_BUDGET_EP2_CHAIR_SWAP',
    ],
    excludedFlag: 'FLAG_BUDGET_EP3_DONE',
    targetRegionScope: 'LOWEST_ECONOMY_REGION',
    choices: [
      {
        id: 'CH_BUDGET_EP3_DASHBOARD',
        label: 'ตั้งคณะทำงานร่วมสภา-ท้องถิ่น ติดตามการเบิกจ่ายงบ {{targetRegionName}} รายเดือน',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'เม็ดเงินลงสู่เศรษฐกิจฐานรากอย่างมีประสิทธิภาพ ดัน GDP และคะแนนเศรษฐกิจภูมิภาคฟื้นตัวชัดเจน',
        setFlag: 'FLAG_BUDGET_EP3_DONE',
        newsHeadline:
          'เร่งเครื่องเบิกจ่ายงบภูมิภาค! เศรษฐกิจ {{targetRegionName}} ขานรับเม็ดเงินลงทุนภาครัฐ',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          gdpGrowthDelta: 0.25,
          consumerConfidenceDelta: 4,
          targetRegionEconomyDelta: 7,
          targetRegionApprovalDelta: 5,
          reputationDelta: 6,
          setRegionalCrisis: null,
        },
      },
      {
        id: 'CH_BUDGET_EP3_DISCIPLINE_RULE',
        label: 'ผลักดันข้อบังคับสภาใหม่ เปิดเผยสถิติการแสดงตนและลงมติของ ส.ส. รายเขตต่อสาธารณะ',
        requiredFlag: 'FLAG_BUDGET_EP2_PUBLIC_PRESSURE',
        requiredFlagHint: 'ต้องผ่านการใช้กระแสประชาชนกดดันแก้ปัญหาสภาล่มในตอนที่ 2',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'ยกระดับมาตรฐานวินัยรัฐสภาครั้งสำคัญ สร้างเกียรติประวัติผู้ปฏิรูปกลไกนิติบัญญัติ!',
        setFlag: 'FLAG_BUDGET_EP3_DONE',
        newsHeadline:
          'สภายกระดับความโปร่งใส! เปิดสถิติลงมติ ส.ส. รายบุคคล ปิดฉากเกมสภาล่มซ้ำซาก',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          personalApprovalDelta: 11,
          integrityDelta: 8,
          scandalRiskDelta: -12,
          govStabilityDelta: 7,
          targetRegionEconomyDelta: 4,
        },
      },
      {
        id: 'CH_BUDGET_EP3_PARTY_NETWORK',
        label: 'ส่งแกนนำพรรคลงพื้นที่ตัดริบบิ้นโครงการใน {{targetRegionName}} ปูพรมขยายฐานเสียง',
        ledgerType: FinancialLedgerType.PERSONAL,
        cost: 15000,
        outcomeSummary:
          'ขยายฐานความนิยมของพรรคในพื้นที่ได้แข็งแกร่ง แม้ฝ่ายตรงข้ามจะวิจารณ์ว่าใช้โครงการรัฐหาเสียงแฝง',
        setFlag: 'FLAG_BUDGET_EP3_DONE',
        newsHeadline:
          'แกนนำการเมืองเดินสายเปิดโครงการพัฒนา {{targetRegionName}} คึกคัก ฝ่ายค้านจับตาหาเสียงแฝง',
        newsFactStatus: FactCheckStatus.CLAIM,
        effects: {
          partyPopularityDelta: 2.4,
          targetRegionPartyStrengthDelta: 0.16,
          targetRegionEconomyDelta: 5,
          personalApprovalDelta: 6,
          scandalRiskDelta: 10,
        },
      },
    ],
  },

  // ============================================================================
  // CHAIN 2: รอยร้าวพรรคร่วมและศึกชิงกระทรวงเศรษฐกิจ (3 EPISODES)
  // ============================================================================
  {
    id: 'EVT_CHAIN_COALITION_EP1',
    chainId: 'CHAIN_COALITION_PORTFOLIO',
    chainTitle: 'รอยร้าวพรรคร่วมและศึกชิงกระทรวงเศรษฐกิจ',
    episodeNumber: 1,
    totalEpisodes: 3,
    category: 'POLITICAL',
    title: 'สัญญาณปากท้อง {{targetRegionName}} ตึงตัว: พรรคร่วมเปิดเกมทวงโควตากระทรวงเศรษฐกิจ',
    severity: 76,
    description:
      'เมื่อความเชื่อมั่นผู้บริโภคอยู่ที่ {{consumerConfidence}}/100 และคะแนนนิยมรัฐบาลใน{{targetRegionName}}อ่อนแรงลง แกนนำพรรคร่วมรัฐบาลอันดับรองจึงแถลงข่าวกึ่งท้าทาย เรียกร้องให้รื้อโควตากระทรวงสายเศรษฐกิจและการค้าใหม่ โดยอ้างว่าทีมเศรษฐกิจชุดเดิมแก้ปัญหาปากท้องภูมิภาคช้าเกินไป',
    contextQuote:
      '“เมื่อตัวเลขเศรษฐกิจเริ่มสะดุด เก้าอี้รัฐมนตรีกระทรวงเกรดเอจะกลายเป็นเป้าหมายแรกบนโต๊ะต่อรองเสมอ”',
    minTurn: 2,
    targetRegionScope: 'LOWEST_APPROVAL_REGION',
    maxConsumerConfidence: 58,
    minFriction: 34,
    excludedFlag: 'FLAG_CHAIN_COALITION_STARTED',
    choices: [
      {
        id: 'CH_COAL_EP1_JOINT_KPI',
        label: 'เสนอตั้ง “ครม.เศรษฐกิจบูรณาการ” ดึงทุกพรรคร่วมรับผิดชอบตัวชี้วัดค่าครองชีพร่วมกัน',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'เปลี่ยนแรงกดดันให้เป็นพันธสัญญาร่วม ลดข้ออ้างโยนความผิดระหว่างพรรคร่วมรัฐบาล',
        setFlag: 'FLAG_COALITION_EP1_JOINT_KPI',
        newsHeadline:
          'เคาะตั้งวง ครม.เศรษฐกิจบูรณาการ ดึงทุกพรรคร่วมลุยแก้ค่าครองชีพ {{targetRegionName}}',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          reputationDelta: 6,
          govStabilityDelta: 5,
          frictionDelta: -6,
          consumerConfidenceDelta: 3,
        },
      },
      {
        id: 'CH_COAL_EP1_HARDLINE',
        label: 'แถลงโต้กลับอย่างแข็งกร้าว ยืนยันกติกาโควตาตามจำนวน ส.ส. ห้ามพรรคร่วมล้ำเส้น',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'ได้ใจกองเชียร์พรรคตัวเองในเรื่องความเด็ดขาด แต่ดัชนีความขัดแย้งพรรคร่วมพุ่งสูงขึ้น',
        setFlag: 'FLAG_COALITION_EP1_HARDLINE',
        newsHeadline:
          'ศึกน้ำลายพรรคร่วมระอุ! แกนนำโต้เดือดปมทวงคืนโควตากระทรวงเศรษฐกิจ',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          personalApprovalDelta: 5,
          partyUnityDelta: 8,
          partyTrustDelta: 7,
          frictionDelta: 9,
          coalitionSatisfactionDelta: -8,
          setRegionalCrisis: 'แรงกดดันค่าครองชีพและรอยร้าวพรรคร่วม',
        },
      },
      {
        id: 'CH_COAL_EP1_DINNER_DEAL',
        label: 'จัดดินเนอร์ลับแกนนำพรรคร่วม ยอมแบ่งงบกระตุ้นเศรษฐกิจภูมิภาคแลกการยุติศึกสื่อ',
        ledgerType: FinancialLedgerType.PERSONAL,
        cost: 18000,
        outcomeSummary:
          'เสียงวิจารณ์หน้าสื่อเงียบลงชั่วคราว พรรคร่วมพอใจมากขึ้น แต่สังคมตั้งคำถามถึงดีลลับหลังม่าน',
        setFlag: 'FLAG_COALITION_EP1_DINNER_DEAL',
        newsHeadline:
          'ชื่นมื่นหลังดินเนอร์พรรคร่วม! สยบข่าวลือรื้อโควตากระทรวงเศรษฐกิจชั่วคราว',
        newsFactStatus: FactCheckStatus.CLAIM,
        effects: {
          frictionDelta: -8,
          coalitionSatisfactionDelta: 9,
          targetRegionApprovalDelta: 3,
          scandalRiskDelta: 10,
        },
      },
    ],
  },
  {
    id: 'EVT_CHAIN_COALITION_EP2',
    chainId: 'CHAIN_COALITION_PORTFOLIO',
    chainTitle: 'รอยร้าวพรรคร่วมและศึกชิงกระทรวงเศรษฐกิจ',
    episodeNumber: 2,
    totalEpisodes: 3,
    minTurnsAfterPreviousEpisode: 1,
    category: 'POLITICAL',
    title: 'เกมดึงจังหวะในห้องประชุม ครม.: วาระฟื้นฟู {{targetRegionName}} ถูกขอเลื่อนพิจารณา',
    severity: 82,
    description:
      'สงครามเย็นระหว่างพรรคร่วมปะทุขึ้นกลางห้องประชุมคณะรัฐมนตรี! รัฐมนตรีต่างพรรคยื่นความเห็นแย้งทางเทคนิคเพื่อขอชะลอแพ็กเกจกระตุ้นเศรษฐกิจ{{targetRegionName}}ออกไปก่อน นักวิเคราะห์การเมืองชี้ชัดว่าเป็นเกมบีบอำนาจต่อรองต่อเนื่องจากศึกชิงกระทรวงเศรษฐกิจในเดือนก่อน',
    contextQuote:
      '“ในโต๊ะประชุม ครม. คำว่า ‘ขอรับไปศึกษาเพิ่มเติม’ บางครั้งแปลว่า ‘ข้อต่อรองของเรายังไม่ได้รับคำตอบ’”',
    requiredFlagsAny: [
      'FLAG_COALITION_EP1_JOINT_KPI',
      'FLAG_COALITION_EP1_HARDLINE',
      'FLAG_COALITION_EP1_DINNER_DEAL',
    ],
    excludedFlag: 'FLAG_CHAIN_COALITION_EP2_DONE',
    targetRegionScope: 'LOWEST_APPROVAL_REGION',
    choices: [
      {
        id: 'CH_COAL_EP2_DATA_CONFRONT',
        label: 'กางตัวเลขเงินเฟ้อ {{inflation}}% และความเดือดร้อน {{targetRegionName}} บีบให้โหวตตัดสินใน ครม.',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'ไม่มีใครกล้าขวางมาตรการช่วยเหลือประชาชนต่อหน้าข้อมูลจริง วาระผ่านความเห็นชอบแม้ยังมีรอยร้าวเล็กน้อย',
        setFlag: 'FLAG_COALITION_EP2_DATA_CONFRONT',
        newsHeadline:
          'ถกเข้มกลาง ครม.! เคาะผ่านมาตรการพยุงเศรษฐกิจ {{targetRegionName}} หลังกางตัวเลขปากท้อง',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          personalApprovalDelta: 7,
          reputationDelta: 5,
          targetRegionEconomyDelta: 5,
          targetRegionApprovalDelta: 4,
          frictionDelta: 3,
        },
      },
      {
        id: 'CH_COAL_EP2_KPI_ENFORCE',
        label: 'บังคับใช้ข้อตกลง ครม.เศรษฐกิจบูรณาการ ผูกงบกระทรวงพรรคร่วมเข้ากับผลลัพธ์พื้นที่',
        requiredFlag: 'FLAG_COALITION_EP1_JOINT_KPI',
        requiredFlagHint: 'ต้องวางรากฐานตั้ง ครม.เศรษฐกิจบูรณาการไว้ในตอนที่ 1',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'กลไก KPI ที่วางไว้ล่วงหน้าทำงานได้ผลเยี่ยม! ทุกกระทรวงเร่งเบิกจ่ายประสานกันอย่างเป็นระบบ',
        setFlag: 'FLAG_COALITION_EP2_KPI_ENFORCE',
        newsHeadline:
          'โมเดล ครม.เศรษฐกิจแผลงฤทธิ์! ปลดล็อกงบค้างท่ออัดฉีด {{targetRegionName}} เต็มสูบ',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          gdpGrowthDelta: 0.2,
          consumerConfidenceDelta: 5,
          govStabilityDelta: 8,
          frictionDelta: -8,
          targetRegionApprovalDelta: 6,
        },
      },
      {
        id: 'CH_COAL_EP2_CROSS_AISLE_BLUFF',
        label: 'ส่งสัญญาณเปิดดีลพรรคฝ่ายค้านบางส่วน ขู่ปรับ ครม. ริบโควตาพรรคร่วมที่ดึงเกม',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'พรรคร่วมที่ดึงจังหวะยอมถอยทันทีเพราะกลัวหลุดวงโคจรอำนาจ แต่สร้างแรงกระเพื่อมทางการเมืองสูง',
        setFlag: 'FLAG_COALITION_EP2_CROSS_AISLE_BLUFF',
        newsHeadline:
          'ข่าวลือสะพัดปรับ ครม. ข้ามขั้ว! บีบพรรคร่วมเลิกขวางแพ็กเกจเศรษฐกิจ',
        newsFactStatus: FactCheckStatus.CLAIM,
        effects: {
          govStabilityDelta: 4,
          frictionDelta: 6,
          partyTrustDelta: 6,
          scandalRiskDelta: 12,
        },
      },
    ],
  },
  {
    id: 'EVT_CHAIN_COALITION_EP3',
    chainId: 'CHAIN_COALITION_PORTFOLIO',
    chainTitle: 'รอยร้าวพรรคร่วมและศึกชิงกระทรวงเศรษฐกิจ',
    episodeNumber: 3,
    totalEpisodes: 3,
    minTurnsAfterPreviousEpisode: 1,
    category: 'POLITICAL',
    title: 'จุดชี้ขาดคณะรัฐมนตรี: ปฏิญญาพรรคร่วมฉบับใหม่และทิศทางเศรษฐกิจ {{targetRegionName}}',
    severity: 85,
    description:
      'วิกฤตต่อรองเก้าอี้เศรษฐกิจเดินทางมาถึงฉากสุดท้าย เมื่อเสถียรภาพรัฐบาลอยู่ที่ {{govStability}}% และความขัดแย้งพรรคร่วมอยู่ที่ {{friction}}% ทุกสายตาในทำเนียบรัฐบาลและตลาดทุนกำลังรอฟังแถลงการณ์ใหญ่ว่าจะจบลงด้วยการลงนามสัตยาบันพรรคร่วมฉบับใหม่ หรือการปรับเปลี่ยนตัวบุคคลครั้งสำคัญ',
    contextQuote:
      '“ศิลปะการตั้งรัฐบาลว่ายากแล้ว ศิลปะการประคองรัฐบาลผสมให้รอดตลอดรอดฝั่งนั้นยากยิ่งกว่า”',
    requiredFlagsAny: [
      'FLAG_COALITION_EP2_DATA_CONFRONT',
      'FLAG_COALITION_EP2_KPI_ENFORCE',
      'FLAG_COALITION_EP2_CROSS_AISLE_BLUFF',
    ],
    excludedFlag: 'FLAG_COALITION_EP3_DONE',
    targetRegionScope: 'LOWEST_APPROVAL_REGION',
    choices: [
      {
        id: 'CH_COAL_EP3_NEW_COMPACT',
        label: 'แถลงปฏิญญาพรรคร่วมฉบับใหม่ แบ่งภารกิจฟื้นฟู {{targetRegionName}} ชัดเจนและยุติศึกโควตา',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'ฟื้นความเชื่อมั่นนักลงทุนและประชาชน เสถียรภาพรัฐบาลกลับมาแข็งแกร่งและลดความขัดแย้งพรรคร่วมลงมาก',
        setFlag: 'FLAG_COALITION_EP3_DONE',
        newsHeadline:
          'หัวหน้าพรรคร่วมจับมือแถลงปฏิญญาเศรษฐกิจ เดินหน้าฟื้นฟู {{targetRegionName}} ยุติศึกปรับ ครม.',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          govStabilityDelta: 10,
          frictionDelta: -14,
          coalitionSatisfactionDelta: 10,
          consumerConfidenceDelta: 5,
          targetRegionApprovalDelta: 5,
          setRegionalCrisis: null,
        },
      },
      {
        id: 'CH_COAL_EP3_TECHNOCRAT_TEAM',
        label: 'ดึงผู้เชี่ยวชาญมืออาชีพเสริมทีมที่ปรึกษาเศรษฐกิจกลาง คุมเข้มวินัยการคลังและลดเงินเฟ้อ',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'ตลาดการเงินและชนชั้นกลางตอบรับเชิงบวก เงินเฟ้อชะลอตัวและ GDP ขยายตัวมั่นคง',
        setFlag: 'FLAG_COALITION_EP3_DONE',
        newsHeadline:
          'ตั้งทีมที่ปรึกษาเศรษฐกิจมืออาชีพเสริมแกร่ง ครม. ตลาดทุนขานรับความชัดเจน',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          gdpGrowthDelta: 0.3,
          inflationDelta: -0.25,
          consumerConfidenceDelta: 6,
          reputationDelta: 7,
          integrityDelta: 4,
          targetRegionEconomyDelta: 6,
          setRegionalCrisis: null,
        },
      },
      {
        id: 'CH_COAL_EP3_REALIGN_POWER',
        label: 'ใช้ไพ่เหนือกว่าบีบสลับเก้าอี้รัฐมนตรีช่วยเศรษฐกิจ รวบอำนาจสั่งการเบ็ดเสร็จ',
        requiredFlag: 'FLAG_COALITION_EP2_CROSS_AISLE_BLUFF',
        requiredFlagHint: 'ต้องเปิดเกมขู่ดึงเสียงข้ามขั้วไว้ในตอนที่ 2',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'กุมสภาพการบริหารนโยบายเศรษฐกิจได้เด็ดขาด ดันคะแนนนิยมพรรคพุ่งสูงแลกกับความเสี่ยงทางการเมือง',
        setFlag: 'FLAG_COALITION_EP3_DONE',
        newsHeadline:
          'ผ่าตัดเล็ก ครม.! สลับเก้าอี้ทีมเศรษฐกิจกระชับอำนาจสั่งการ ลุยอัดฉีดงบภูมิภาค',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          partyPopularityDelta: 3.0,
          personalApprovalDelta: 8,
          govStabilityDelta: 6,
          targetRegionApprovalDelta: 6,
          targetRegionPartyStrengthDelta: 0.14,
          scandalRiskDelta: 14,
          setRegionalCrisis: null,
        },
      },
    ],
  },

  // ============================================================================
  // CHAIN 3: เอกสารลับเมกะโปรเจกต์และเกมซักฟอกข้ามขั้ว (3 EPISODES)
  // ============================================================================
  {
    id: 'EVT_CHAIN_DOSSIER_EP1',
    chainId: 'CHAIN_CENSURE_DOSSIER',
    chainTitle: 'เอกสารลับเมกะโปรเจกต์และเกมซักฟอกข้ามขั้ว',
    episodeNumber: 1,
    totalEpisodes: 3,
    category: 'LEGAL',
    title: 'ซองเอกสารลับประมูลโครงสร้างพื้นฐาน {{targetRegionName}} หลุดถึงโต๊ะทำงาน',
    severity: 78,
    description:
      'ข้าราชการประจำที่ไม่เห็นด้วยกับการล็อกสเปกแอบส่งแฟ้มเอกสาร TOR และใบเสนอราคาโครงการก่อสร้างโครงข่ายคมนาคมใน{{targetRegionName}}มาให้คุณ ในแฟ้มชี้ให้เห็นส่วนต่างงบประมาณที่ผิดปกติอย่างมีนัยสำคัญ ท่ามกลางเสียงบ่นของประชาชนใน{{targetRegionName}}เรื่องถนนและระบบขนส่งที่ล่าช้า',
    contextQuote:
      '“ข้อมูลลับในมือของนักการเมือง อาจเป็นได้ทั้งดาบผดุงความยุติธรรม หรือชิปราคาแพงบนโต๊ะเจรจา”',
    requiresParliamentActive: true,
    requiredRoles: PARLIAMENT_AND_PARTY_ROLES,
    minTurn: 3,
    targetRegionScope: 'LOWEST_APPROVAL_REGION',
    maxRegionalInfrastructure: 78,
    excludedFlag: 'FLAG_CHAIN_DOSSIER_STARTED',
    choices: [
      {
        id: 'CH_DOSSIER_EP1_VERIFY',
        label: 'ตั้งทีมนักกฎหมายและวิศวกรสอบทานใบเสร็จทุกหน้า เตรียมยื่นกระทู้และซักฟอกในสภา',
        ledgerType: FinancialLedgerType.PERSONAL,
        cost: 10000,
        outcomeSummary:
          'ได้ชุดหลักฐานนิติวิทยาศาสตร์การคลังที่แน่นหนาและรัดกุม พร้อมใช้งานในจังหวะสำคัญ',
        setFlag: 'FLAG_DOSSIER_EP1_VERIFY',
        newsHeadline:
          'จับตาสภาเดือด! แว่วทีมงานการเมืองซุ่มตรวจเอกสารลับโครงการใหญ่ใน {{targetRegionName}}',
        newsFactStatus: FactCheckStatus.UNVERIFIED_INFO,
        effects: {
          integrityDelta: 7,
          reputationDelta: 5,
          scandalRiskDelta: -6,
        },
      },
      {
        id: 'CH_DOSSIER_EP1_LEVERAGE',
        label: 'เก็บแฟ้มไว้ในเซฟส่วนตัว ส่งสัญญาณทางอ้อมใช้ต่อรองโควตานโยบายกับแกนนำต่างขั้ว',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'แกนนำฝั่งตรงข้ามเริ่มเกรงใจและยอมอ่อนข้อในกรรมาธิการ แต่มีความเสี่ยงหากเรื่องหลุดสู่สื่อ',
        setFlag: 'FLAG_DOSSIER_EP1_LEVERAGE',
        newsHeadline:
          'ลือหึ่งดีลเงียบในรัฐสภา! ใช้ข้อมูลโครงการภูมิภาคต่อรองเสียงสนับสนุนกฎหมาย',
        newsFactStatus: FactCheckStatus.CLAIM,
        effects: {
          partyTrustDelta: 8,
          frictionDelta: -5,
          integrityDelta: -6,
          scandalRiskDelta: 15,
        },
      },
      {
        id: 'CH_DOSSIER_EP1_MEDIA_LEAK',
        label: 'ส่งเอกสารไฮไลต์ให้สำนักข่าวเชิงสืบสวนเปิดแผลรายวันเพื่อปลุกกระแสสังคมทันที',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'ประเด็นกลายเป็นทอล์กออฟเดอะทาวน์ข้ามคืน ดึงคะแนนนิยมพุ่งเร็วแต่ผู้เกี่ยวข้องรีบตั้งหลักทำลายหลักฐานบางส่วน',
        setFlag: 'FLAG_DOSSIER_EP1_MEDIA_LEAK',
        newsHeadline:
          'สื่อดังเปิดเอกสารหลุด! ตั้งคำถามส่วนต่างงบโครงสร้างพื้นฐาน {{targetRegionName}}',
        newsFactStatus: FactCheckStatus.CLAIM,
        effects: {
          personalApprovalDelta: 8,
          reputationDelta: 4,
          frictionDelta: 7,
          govStabilityDelta: -4,
        },
      },
    ],
  },
  {
    id: 'EVT_CHAIN_DOSSIER_EP2',
    chainId: 'CHAIN_CENSURE_DOSSIER',
    chainTitle: 'เอกสารลับเมกะโปรเจกต์และเกมซักฟอกข้ามขั้ว',
    episodeNumber: 2,
    totalEpisodes: 3,
    minTurnsAfterPreviousEpisode: 1,
    category: 'POLITICAL',
    title: 'คืนก่อนเปิดศึกสภา: ตัวแทนกลุ่มทุนและแกนนำการเมืองส่งคนขอเจรจาเคลียร์ใจ',
    severity: 84,
    description:
      'เมื่อข่าวการตรวจสอบโครงการใน{{targetRegionName}}เริ่มงวดเข้ามา ตัวกลางระดับบิ๊กเนมจึงนัดขอพบคุณเป็นการลับ เสนอทั้งการสนับสนุนทรัพยากรทางการเมืองและเสียงโหวตช่วยร่างกฎหมายของพรรคคุณ แลกกับการตัดชื่อบุคคลสำคัญออกจากสไลด์อภิปรายในสัปดาห์หน้า',
    contextQuote:
      '“บททดสอบความซื่อตรงไม่ได้เกิดขึ้นตอนกล่าวคำปฏิญาณ แต่เกิดขึ้นในห้องที่ไม่มีกล้องวงจรปิด”',
    requiresParliamentActive: true,
    requiredFlagsAny: [
      'FLAG_DOSSIER_EP1_VERIFY',
      'FLAG_DOSSIER_EP1_LEVERAGE',
      'FLAG_DOSSIER_EP1_MEDIA_LEAK',
    ],
    excludedFlag: 'FLAG_CHAIN_DOSSIER_EP2_DONE',
    targetRegionScope: 'LOWEST_APPROVAL_REGION',
    choices: [
      {
        id: 'CH_DOSSIER_EP2_PROTECT_WITNESS',
        label: 'ปฏิเสธทุกข้อเสนอและประสานกลไกคุ้มครองพยานข้าราชการน้ำดีใน {{targetRegionName}}',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'พยานมั่นใจส่งมอบเอกสารต้นฉบับเพิ่มเติม เสริมความแข็งแกร่งทางกฎหมายและจริยธรรมเต็มเปี่ยม',
        setFlag: 'FLAG_DOSSIER_EP2_PROTECT_WITNESS',
        newsHeadline:
          'ข้าราชการน้ำดี {{targetRegionName}} ตบเท้าส่งหลักฐานเพิ่ม มั่นใจศึกซักฟอกรอบนี้เอาจริง',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          integrityDelta: 9,
          reputationDelta: 6,
          personalApprovalDelta: 6,
          scandalRiskDelta: -8,
        },
      },
      {
        id: 'CH_DOSSIER_EP2_SURGICAL_STRIKE',
        label: 'เปิดหลักฐานมัดตัวเฉพาะผู้บงการต่อวิปทุกฝ่าย บีบให้พรรคร่วมลอยแพคนผิดก่อนวันโหวต',
        requiredFlag: 'FLAG_DOSSIER_EP1_VERIFY',
        requiredFlagHint: 'ต้องผ่านการตั้งทีมสอบทานใบเสร็จอย่างรัดกุมในตอนที่ 1',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'ชั้นเชิงระดับปรมาจารย์! พรรคร่วมไม่กล้าอุ้มคนผิดและพร้อมโหวตหนุนการรื้อสัญญาใหม่',
        setFlag: 'FLAG_DOSSIER_EP2_SURGICAL_STRIKE',
        newsHeadline:
          'สะเทือนทั้งสภา! หลักฐานมัดแน่นบีบแกนนำการเมืองสั่งลอยแพผู้เกี่ยวข้องปมงบ {{targetRegionName}}',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          personalApprovalDelta: 10,
          reputationDelta: 9,
          integrityDelta: 6,
          partyPopularityDelta: 2.0,
        },
      },
      {
        id: 'CH_DOSSIER_EP2_VOTE_BARTER',
        label: 'ตกลงแลกเปลี่ยนเชิงยุทธศาสตร์ ลดดีกรีการพาดพิงแลกเสียงหนุนร่างกฎหมายและทุนลงพื้นที่',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'ได้ทั้งทรัพยากรและเสียงโหวตข้ามขั้ว แต่เสี่ยงถูกตั้งคำถามหากมวลชนจับสังเกตว่าอภิปรายไม่สุดซอย',
        setFlag: 'FLAG_DOSSIER_EP2_VOTE_BARTER',
        newsHeadline:
          'จับตาท่าทีอภิปรายประเด็น {{targetRegionName}} นักวิเคราะห์ชี้มีสัญญาณประนีประนอมข้ามขั้ว',
        newsFactStatus: FactCheckStatus.CLAIM,
        effects: {
          personalCashDelta: 90000,
          partyTrustDelta: 7,
          frictionDelta: -6,
          integrityDelta: -12,
          scandalRiskDelta: 24,
        },
      },
    ],
  },
  {
    id: 'EVT_CHAIN_DOSSIER_EP3',
    chainId: 'CHAIN_CENSURE_DOSSIER',
    chainTitle: 'เอกสารลับเมกะโปรเจกต์และเกมซักฟอกข้ามขั้ว',
    episodeNumber: 3,
    totalEpisodes: 3,
    minTurnsAfterPreviousEpisode: 1,
    category: 'POLITICAL',
    title: 'วันชี้ชะตากลางสภาผู้แทนราษฎร: มติสะเทือนโครงการ {{targetRegionName}}',
    severity: 88,
    description:
      'ห้องประชุมพระสุริยันแน่นขนัดไปด้วยสมาชิกสภาผู้แทนราษฎรและกองทัพผู้สื่อข่าว ถึงเวลาปิดฉากมหากาพย์เอกสารลับเมกะโปรเจกต์{{targetRegionName}} ซึ่งคำอภิปรายและท่าทีลงมติของคุณในวันนี้จะกำหนดโฉมหน้าความโปร่งใสของงบประมาณและคะแนนโครงสร้างพื้นฐานของภูมิภาคไปอีกยาวนาน',
    contextQuote:
      '“บันทึกการประชุมสภาจะถูกเก็บไว้ในหอจดหมายเหตุตลอดกาล เช่นเดียวกับชื่อของผู้ที่เลือกยืนข้างประชาชน”',
    requiresParliamentActive: true,
    requiredRoles: PARLIAMENT_FLOOR_ROLES.length > 0 ? PARLIAMENT_AND_PARTY_ROLES : undefined,
    requiredFlagsAny: [
      'FLAG_DOSSIER_EP2_PROTECT_WITNESS',
      'FLAG_DOSSIER_EP2_SURGICAL_STRIKE',
      'FLAG_DOSSIER_EP2_VOTE_BARTER',
    ],
    excludedFlag: 'FLAG_DOSSIER_EP3_DONE',
    targetRegionScope: 'LOWEST_APPROVAL_REGION',
    choices: [
      {
        id: 'CH_DOSSIER_EP3_FULL_AUDIT',
        label: 'อภิปรายเปิดหลักฐานครบชุดและยื่นเรื่องต่อ สตง.-ป.ป.ช. ให้ตรวจสอบราคากลางใหม่ทั้งหมด',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'ได้รับเสียงปรบมือกึกก้องและศรัทธาจากประชาชนทั่วประเทศ ยกระดับธรรมาภิบาลและคะแนนนิยมพรรค',
        setFlag: 'FLAG_DOSSIER_EP3_DONE',
        newsHeadline:
          'อภิปรายสะกดสภา! ส่งหลักฐานชุดใหญ่ให้ สตง. รื้อสัญญาประมูลโครงสร้างพื้นฐาน {{targetRegionName}}',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          personalApprovalDelta: 10,
          reputationDelta: 8,
          integrityDelta: 8,
          scandalRiskDelta: -10,
          partyPopularityDelta: 2.2,
          targetRegionInfrastructureDelta: 5,
          targetRegionApprovalDelta: 4,
        },
      },
      {
        id: 'CH_DOSSIER_EP3_REALLOCATE_INFRA',
        label: 'ใช้เสียงมติสภาบีบระงับสัญญาฉาวและโอนงบไปสร้างโครงข่ายคมนาคม {{targetRegionName}} แบบประมูลเปิด',
        requiredFlag: 'FLAG_DOSSIER_EP2_SURGICAL_STRIKE',
        requiredFlagHint: 'ต้องใช้หลักฐานบีบให้พรรคร่วมลอยแพคนผิดไว้ในตอนที่ 2',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'ชัยชนะสมบูรณ์แบบ! รักษางบแผ่นดินและพลิกโฉมโครงสร้างพื้นฐานของ {{targetRegionName}} ได้จริง',
        setFlag: 'FLAG_DOSSIER_EP3_DONE',
        newsHeadline:
          'มติสภาเอกฉันท์! รื้อประมูลใหม่โปร่งใส เร่งสร้างโครงข่ายคมนาคม {{targetRegionName}}',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          gdpGrowthDelta: 0.25,
          personalApprovalDelta: 12,
          integrityDelta: 9,
          targetRegionInfrastructureDelta: 9,
          targetRegionEconomyDelta: 6,
          targetRegionApprovalDelta: 7,
          partyPopularityDelta: 2.8,
        },
      },
      {
        id: 'CH_DOSSIER_EP3_PRAGMATIC_CLOSE',
        label: 'สรุปข้อเสนอแนะเชิงนโยบายแบบประนีประนอม รักษาไมตรีทุกพรรคเพื่อเปิดทางร่วมรัฐบาล',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'ลดความตึงเครียดในสภาและได้พันธมิตรทางการเมืองเพิ่ม แม้กระแสมวลชนสายฮาร์ดคอร์จะเสียดายเล็กน้อย',
        setFlag: 'FLAG_DOSSIER_EP3_DONE',
        newsHeadline:
          'ปิดฉากอภิปรายปมงบ {{targetRegionName}} ด้วยข้อเสนอแนะเชิงระบบ ทุกขั้วถอยลดอุณหภูมิสภา',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          govStabilityDelta: 6,
          frictionDelta: -8,
          coalitionSatisfactionDelta: 6,
          reputationDelta: 2,
          targetRegionInfrastructureDelta: 3,
        },
      },
    ],
  },

  // ============================================================================
  // CHAIN 4: คลื่นใต้น้ำซุ้มการเมืองภูมิภาคก่อนศึกเลือกตั้ง (3 EPISODES)
  // ============================================================================
  {
    id: 'EVT_CHAIN_FACTION_EP1',
    chainId: 'CHAIN_REGIONAL_FACTION',
    chainTitle: 'คลื่นใต้น้ำซุ้มการเมืองภูมิภาคก่อนศึกเลือกตั้ง',
    episodeNumber: 1,
    totalEpisodes: 3,
    category: 'POLITICAL',
    title: 'คลื่นใต้น้ำใน {{targetRegionName}}: ซุ้มบ้านใหญ่ส่งสัญญาณต่อรองก่อนศึกเลือกตั้ง',
    severity: 70,
    description:
      'เหลือเวลาอีก {{monthsUntilElection}} เดือนก่อนการเลือกตั้งทั่วไป คลื่นใต้น้ำในพื้นที่ฐานเสียงบ้านเกิดของคุณ ({{targetRegionName}}) เริ่มก่อตัวขึ้น แกนนำเครือข่ายนักการเมืองท้องถิ่นหลายจังหวัดส่งสัญญาณว่าอาจย้ายค่ายไปซบพรรคคู่แข่ง หากไม่ได้รับสิทธิ์จัดตัวผู้สมัครและงบรณรงค์พิเศษในภาคนี้',
    contextQuote:
      '“การเมืองระดับชาติตัดสินกันที่กระแส แต่เก้าอี้ ส.ส. เขตจำนวนไม่น้อยตัดสินกันที่เครือข่ายพื้นที่”',
    minTurn: 2,
    targetRegionScope: 'HOME_REGION',
    maxMonthsUntilElection: 14,
    maxRegionalApproval: 62,
    excludedFlag: 'FLAG_CHAIN_FACTION_STARTED',
    choices: [
      {
        id: 'CH_FACTION_EP1_OPEN_PRIMARY',
        label: 'เปิดเวทีไพรมารีโหวตโปร่งใสใน {{targetRegionName}} ให้สมาชิกและประชาชนร่วมคัดตัวจริง',
        ledgerType: FinancialLedgerType.PERSONAL,
        cost: 10000,
        outcomeSummary:
          'สร้างความตื่นตัวทางการเมืองใน {{targetRegionName}} ได้รับความเชื่อมั่นจากคนทำงานจริงและผู้มีสิทธิเลือกตั้ง',
        setFlag: 'FLAG_FACTION_EP1_OPEN_PRIMARY',
        newsHeadline:
          'คึกคักเวทีไพรมารีโหวต {{targetRegionName}} เปิดทางประชาชนคัดตัวผู้สมัครสู้ศึกเลือกตั้ง',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          reputationDelta: 6,
          personalApprovalDelta: 6,
          integrityDelta: 5,
          targetRegionApprovalDelta: 3,
        },
      },
      {
        id: 'CH_FACTION_EP1_NEW_BLOOD',
        label: 'ประกาศท้าชนระบบมุ้งเดิม เปิดตัวผู้สมัครคนรุ่นใหม่สายวิชาการและภาคประชาสังคมยกทีม',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'จุดกระแสไวรัลในเขตเมืองและคนรุ่นใหม่ของ {{targetRegionName}} แต่ซุ้มบ้านใหญ่ประกาศแยกทางไปตั้งป้อมสู้!',
        setFlag: 'FLAG_FACTION_EP1_NEW_BLOOD',
        newsHeadline:
          'ผ่าตัดใหญ่ฐานเสียง {{targetRegionName}}! ชูผู้สมัครสายอุดมการณ์ท้าชนซุ้มบ้านใหญ่',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          personalApprovalDelta: 8,
          integrityDelta: 6,
          partyUnityDelta: -6,
          targetRegionPartyStrengthDelta: 0.08,
        },
      },
      {
        id: 'CH_FACTION_EP1_BIG_HOUSE_PACT',
        label: 'เปิดโต๊ะเจรจาจับมือซุ้มบ้านใหญ่ แบ่งเขตยุทธศาสตร์ใน {{targetRegionName}} เพื่อรักษาเก้าอี้ชัวร์',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'รักษาฐานเสียงจัดตั้งไว้ได้เหนียวแน่น เพิ่มพลังเครือข่ายในภูมิภาคทันทีแลกกับภาพลักษณ์การเมืองแบบเก่า',
        setFlag: 'FLAG_FACTION_EP1_BIG_HOUSE_PACT',
        newsHeadline:
          'ปิดดีลซุ้มการเมือง {{targetRegionName}}! ผนึกบ้านใหญ่ตรึงฐานเสียง ส.ส. เขตเหนียวแน่น',
        newsFactStatus: FactCheckStatus.CLAIM,
        effects: {
          partyUnityDelta: 8,
          partyTrustDelta: 8,
          targetRegionPartyStrengthDelta: 0.14,
          integrityDelta: -4,
          scandalRiskDelta: 10,
        },
      },
    ],
  },
  {
    id: 'EVT_CHAIN_FACTION_EP2',
    chainId: 'CHAIN_REGIONAL_FACTION',
    chainTitle: 'คลื่นใต้น้ำซุ้มการเมืองภูมิภาคก่อนศึกเลือกตั้ง',
    episodeNumber: 2,
    totalEpisodes: 3,
    minTurnsAfterPreviousEpisode: 1,
    category: 'POLITICAL',
    title: 'ศึกชิงพื้นที่ {{targetRegionName}} ระอุ: ปะทะระหว่างกระแสนโยบายกับเครือข่ายหัวคะแนน',
    severity: 76,
    description:
      'หลังการตัดสินใจวางโครงสร้างผู้สมัครใน{{targetRegionName}} คู่แข่งทางการเมืองเริ่มเปิดเกมรุกหนักลงพื้นที่ทับซ้อนทันที ทั้งการดึงตัวแกนนำท้องถิ่นและโจมตีจุดอ่อนเรื่องเศรษฐกิจพื้นที่ซึ่งปัจจุบันอยู่ที่ระดับต้องการแรงขับเคลื่อนใหม่',
    contextQuote:
      '“ในสนามเลือกตั้งภูมิภาค ใครปล่อยให้พื้นที่ว่างแม้แต่เดือนเดียว คู่แข่งพร้อมจะปักป้ายแทนที่ทันที”',
    requiredFlagsAny: [
      'FLAG_FACTION_EP1_OPEN_PRIMARY',
      'FLAG_FACTION_EP1_NEW_BLOOD',
      'FLAG_FACTION_EP1_BIG_HOUSE_PACT',
    ],
    excludedFlag: 'FLAG_CHAIN_FACTION_EP2_DONE',
    targetRegionScope: 'HOME_REGION',
    choices: [
      {
        id: 'CH_FACTION_EP2_ECON_BLUEPRINT',
        label: 'เปิดพิมพ์เขียวเศรษฐกิจเฉพาะจังหวัดใน {{targetRegionName}} ตอบโจทย์ราคาสินค้าเกษตรและ SMEs',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'นโยบายจับต้องได้จริงจนหอการค้าจังหวัดและกลุ่มเกษตรกรใน {{targetRegionName}} หันมาให้การสนับสนุน',
        setFlag: 'FLAG_FACTION_EP2_ECON_BLUEPRINT',
        newsHeadline:
          'ชูพิมพ์เขียวเศรษฐกิจรายจังหวัด เจาะฐานเสียงผู้ประกอบการและเกษตรกร {{targetRegionName}}',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          personalApprovalDelta: 7,
          reputationDelta: 6,
          targetRegionEconomyDelta: 5,
          targetRegionPartyStrengthDelta: 0.12,
        },
      },
      {
        id: 'CH_FACTION_EP2_VOLUNTEER_WAVE',
        label: 'ปลุกทัพอาสาสมัครเคาะประตูบ้านทุกตำบลใน {{targetRegionName}} สู้ศึกกระสุนด้วยกระแสมวลชน',
        requiredFlag: 'FLAG_FACTION_EP1_NEW_BLOOD',
        requiredFlagHint: 'ต้องเลือกเปิดตัวทีมผู้สมัครคนรุ่นใหม่สายอุดมการณ์ในตอนที่ 1',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'พลังอาสาสมัครจุดติดไฟลามทุ่ง! คะแนนนิยมส่วนตัวและฐานเสียงพรรคในภูมิภาคพุ่งแรงโดยปลอดข่าวฉาว',
        setFlag: 'FLAG_FACTION_EP2_VOLUNTEER_WAVE',
        newsHeadline:
          'ปรากฏการณ์อาสาสมัครฟีเวอร์ใน {{targetRegionName}}! เดินเท้าเคาะประตูบ้านท้าชนบ้านใหญ่',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          personalApprovalDelta: 10,
          integrityDelta: 6,
          scandalRiskDelta: -8,
          partyPopularityDelta: 2.0,
          targetRegionPartyStrengthDelta: 0.16,
        },
      },
      {
        id: 'CH_FACTION_EP2_FUND_MOBILIZE',
        label: 'อัดฉีดงบจัดเวทีพบปะผู้นำชุมชนและเครือข่ายสหกรณ์ทั่ว {{targetRegionName}}',
        ledgerType: FinancialLedgerType.PERSONAL,
        cost: 22000,
        outcomeSummary:
          'กระชับแนวร่วมผู้นำท้องถิ่นได้แน่นปึ้ก เอกภาพภายในพรรคและพลังฐานเสียงภูมิภาคแข็งแกร่งขึ้นทันตา',
        setFlag: 'FLAG_FACTION_EP2_FUND_MOBILIZE',
        newsHeadline:
          'เดินสายปูพรมพบผู้นำชุมชนทั่ว {{targetRegionName}} ตรึงแนวรบก่อนเข้าคูหา',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          partyUnityDelta: 7,
          partyTrustDelta: 8,
          targetRegionPartyStrengthDelta: 0.15,
          personalApprovalDelta: 5,
        },
      },
    ],
  },
  {
    id: 'EVT_CHAIN_FACTION_EP3',
    chainId: 'CHAIN_REGIONAL_FACTION',
    chainTitle: 'คลื่นใต้น้ำซุ้มการเมืองภูมิภาคก่อนศึกเลือกตั้ง',
    episodeNumber: 3,
    totalEpisodes: 3,
    minTurnsAfterPreviousEpisode: 1,
    category: 'POLITICAL',
    title: 'ศึกปักธงยุทธศาสตร์ {{targetRegionName}}: ผนึกกำลังใหญ่ก่อนศึกชี้ชะตาเลือกตั้ง',
    severity: 80,
    description:
      'สายเนื้อเรื่องฐานเสียงภูมิภาคเดินทางมาถึงบทสรุป! ทุกจังหวัดใน{{targetRegionName}}จับตามองเวทีประกาศยุทธศาสตร์ใหญ่ของคุณในเดือนนี้ การตัดสินใจครั้งสุดท้ายจะกำหนดความแข็งแกร่งของฐานเสียงรายภาค ซึ่งส่งผลโดยตรงต่อการคำนวณที่นั่ง ส.ส. แบบแบ่งเขตในสนามเลือกตั้งทั่วไป',
    contextQuote:
      '“ภูมิภาคบ้านเกิดคือปราการด่านแรก หากรักษาบ้านเกิดไว้ได้อย่างสง่างาม ประตูสู่ทำเนียบรัฐบาลก็อยู่ไม่ไกล”',
    requiredFlagsAny: [
      'FLAG_FACTION_EP2_ECON_BLUEPRINT',
      'FLAG_FACTION_EP2_VOLUNTEER_WAVE',
      'FLAG_FACTION_EP2_FUND_MOBILIZE',
    ],
    excludedFlag: 'FLAG_FACTION_EP3_DONE',
    targetRegionScope: 'HOME_REGION',
    choices: [
      {
        id: 'CH_FACTION_EP3_REGIONAL_PACT',
        label: 'ประกาศสัญญาประชาคมพัฒนา {{targetRegionName}} ยกระดับรายได้และโครงข่ายคมนาคมครบวงจร',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'หลอมรวมทุกกลุ่มใน {{targetRegionName}} เป็นหนึ่งเดียว ดันทั้งเศรษฐกิจพื้นที่และฐานเสียงพรรคเติบโตยั่งยืน',
        setFlag: 'FLAG_FACTION_EP3_DONE',
        newsHeadline:
          'เวทีใหญ่ {{targetRegionName}} แตกขนัด! ประกาศสัญญาประชาคมยกระดับเศรษฐกิจภูมิภาค',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          personalApprovalDelta: 9,
          partyUnityDelta: 8,
          partyPopularityDelta: 2.2,
          targetRegionEconomyDelta: 6,
          targetRegionApprovalDelta: 6,
          targetRegionPartyStrengthDelta: 0.18,
        },
      },
      {
        id: 'CH_FACTION_EP3_CLEAN_WATCHDOG',
        label: 'ตั้งเครือข่ายประชาชนเฝ้าระวังการทุจริตเลือกตั้งทั่ว {{targetRegionName}} ชูการเมืองสีขาวเต็มตัว',
        requiredFlag: 'FLAG_FACTION_EP2_VOLUNTEER_WAVE',
        requiredFlagHint: 'ต้องผ่านการปลุกทัพอาสาสมัครเคาะประตูบ้านในตอนที่ 2',
        ledgerType: FinancialLedgerType.NONE,
        cost: 0,
        outcomeSummary:
          'สร้างแลนด์สไลด์ทางศรัทธาใน {{targetRegionName}}! สกัดวิชามารคู่แข่งและดันความแข็งแกร่งรายภาคพุ่งสูงสุด',
        setFlag: 'FLAG_FACTION_EP3_DONE',
        newsHeadline:
          'เครือข่ายพลเมืองอาสาพรึ่บเต็ม {{targetRegionName}}! ประกาศปกป้องทุกคะแนนเสียงอย่างโปร่งใส',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          personalApprovalDelta: 12,
          reputationDelta: 9,
          integrityDelta: 8,
          scandalRiskDelta: -12,
          partyPopularityDelta: 3.0,
          targetRegionPartyStrengthDelta: 0.24,
        },
      },
      {
        id: 'CH_FACTION_EP3_ALLIANCE_SWEEP',
        label: 'ปิดดีลพันธมิตรท้องถิ่นทุกจังหวัดใน {{targetRegionName}} ตั้งเป้ากวาดเก้าอี้ ส.ส. เขตยกภาค',
        ledgerType: FinancialLedgerType.PERSONAL,
        cost: 20000,
        outcomeSummary:
          'เครื่องจักรเลือกตั้งระดับภูมิภาคพร้อมเต็มพิกัด เพิ่มตัวคูณฐานเสียงรายภาคอย่างทรงพลัง!',
        setFlag: 'FLAG_FACTION_EP3_DONE',
        newsHeadline:
          'ผนึกกำลังท้องถิ่นครบทุกจังหวัดใน {{targetRegionName}} ประกาศกร้าวพร้อมกวาดที่นั่ง ส.ส. เขต',
        newsFactStatus: FactCheckStatus.VERIFIED_FACT,
        effects: {
          partyUnityDelta: 10,
          partyTrustDelta: 10,
          partyPopularityDelta: 2.5,
          targetRegionPartyStrengthDelta: 0.22,
          scandalRiskDelta: 8,
        },
      },
    ],
  },
];
