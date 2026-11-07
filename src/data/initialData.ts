import {
  ConstitutionRuleset,
  Ministry,
  PoliticalParty,
  RegionData,
  RegionId,
  ScenarioId,
  VoterDemographic,
} from '../types/game';
import { PARTY_SVG_FILENAMES } from '../utils/partyLogos';

export function getDefaultConstitution(scenario: ScenarioId): ConstitutionRuleset {
  if (scenario === ScenarioId.NEW_CONSTITUTION) {
    return {
      name: 'รัฐธรรมนูญฉบับปฏิรูปประชาชน (จำลอง)',
      version: '3.0-Reform',
      isSandbox: false,
      totalSeats: 500,
      constituencySeats: 350,
      partyListSeats: 150,
      maxCabinetMinisters: 35,
      pmMaxCumulativeYears: 8,
      pmNominationPartySeatThresholdPct: 3,
      voterMinAge: 18,
      mpMinAge: 23,
      ministerMinAge: 30,
      pmMinAge: 30,
      normalPartyMembershipDays: 60,
      dissolutionPartyMembershipDays: 30,
      requireBirthThaiNationality: true,
      amendmentSupermajorityPct: 55,
      senateApprovalRequiredForAmendment: false,
      termLengthMonths: 48,
    };
  }

  return {
    name: 'รัฐธรรมนูญแห่งราชอาณาจักรไทย พ.ศ. 2560 (แก้ไขเพิ่มเติม พ.ศ. 2564)',
    version: '2.0-2564',
    isSandbox: scenario === ScenarioId.SANDBOX,
    totalSeats: 500,
    constituencySeats: 400,
    partyListSeats: 100,
    maxCabinetMinisters: 35,
    pmMaxCumulativeYears: 8,
    pmNominationPartySeatThresholdPct: 5,
    voterMinAge: 18,
    mpMinAge: 25,
    ministerMinAge: 35,
    pmMinAge: 35,
    normalPartyMembershipDays: 90,
    dissolutionPartyMembershipDays: 30,
    requireBirthThaiNationality: true,
    amendmentSupermajorityPct: 60,
    senateApprovalRequiredForAmendment: true,
    termLengthMonths: 48,
  };
}

export function createInitialRegions(constituencyTarget = 400): RegionData[] {
  const baseRegions: RegionData[] = [
    {
      id: 'NORTH',
      name: 'ภาคเหนือ',
      provincesCount: 9,
      sampleProvinces: ['เชียงใหม่', 'เชียงราย', 'ลำปาง', 'แพร่', 'น่าน', 'พะเยา'],
      populationMillion: 6.3,
      constituencySeats: 37,
      localEconomyScore: 59,
      infrastructureScore: 58,
      environmentScore: 54,
      govApproval: 55,
      dominantPartyId: 'PTY_02',
      activeCrisis: null,
      chaosScore: 12,
      chaosTrend: [12],
    },
    {
      id: 'NORTHEAST',
      name: 'ภาคตะวันออกเฉียงเหนือ',
      provincesCount: 20,
      sampleProvinces: ['นครราชสีมา', 'ขอนแก่น', 'อุบลราชธานี', 'อุดรธานี', 'บุรีรัมย์', 'ศรีสะเกษ'],
      populationMillion: 21.8,
      constituencySeats: 133,
      localEconomyScore: 54,
      infrastructureScore: 55,
      environmentScore: 62,
      govApproval: 56,
      dominantPartyId: 'PTY_02',
      activeCrisis: null,
      chaosScore: 15,
      chaosTrend: [15],
    },
    {
      id: 'CENTRAL',
      name: 'ภาคกลาง',
      provincesCount: 22,
      sampleProvinces: ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'นครสวรรค์', 'พิษณุโลก'],
      populationMillion: 20.4,
      constituencySeats: 123,
      localEconomyScore: 72,
      infrastructureScore: 73,
      environmentScore: 52,
      govApproval: 50,
      dominantPartyId: 'PTY_01',
      activeCrisis: null,
      chaosScore: 18,
      chaosTrend: [18],
    },
    {
      id: 'EAST',
      name: 'ภาคตะวันออก',
      provincesCount: 7,
      sampleProvinces: ['ชลบุรี', 'ระยอง', 'ฉะเชิงเทรา', 'จันทบุรี', 'ปราจีนบุรี', 'สระแก้ว'],
      populationMillion: 4.9,
      constituencySeats: 29,
      localEconomyScore: 74,
      infrastructureScore: 71,
      environmentScore: 55,
      govApproval: 51,
      dominantPartyId: 'PTY_01',
      activeCrisis: null,
      chaosScore: 14,
      chaosTrend: [14],
    },
    {
      id: 'WEST',
      name: 'ภาคตะวันตก',
      provincesCount: 5,
      sampleProvinces: ['กาญจนบุรี', 'ราชบุรี', 'เพชรบุรี', 'ประจวบคีรีขันธ์', 'ตาก'],
      populationMillion: 3.6,
      constituencySeats: 19,
      localEconomyScore: 62,
      infrastructureScore: 61,
      environmentScore: 66,
      govApproval: 53,
      dominantPartyId: 'PTY_03',
      activeCrisis: null,
      chaosScore: 10,
      chaosTrend: [10],
    },
    {
      id: 'SOUTH',
      name: 'ภาคใต้',
      provincesCount: 14,
      sampleProvinces: ['นครศรีธรรมราช', 'สงขลา', 'สุราษฎร์ธานี', 'ปัตตานี', 'นราธิวาส', 'ภูเก็ต'],
      populationMillion: 9.2,
      constituencySeats: 59,
      localEconomyScore: 61,
      infrastructureScore: 59,
      environmentScore: 69,
      govApproval: 51,
      dominantPartyId: 'PTY_04',
      activeCrisis: null,
      chaosScore: 22,
      chaosTrend: [22],
    },
  ];

  // Scale seats cleanly if custom ruleset changes constituencySeats (e.g., 350 Reform or Sandbox)
  if (constituencyTarget !== 400) {
    let assigned = 0;
    baseRegions.forEach((r, idx) => {
      if (idx === baseRegions.length - 1) {
        r.constituencySeats = Math.max(1, constituencyTarget - assigned);
      } else {
        const scaled = Math.max(1, Math.round((r.constituencySeats / 400) * constituencyTarget));
        r.constituencySeats = scaled;
        assigned += scaled;
      }
    });
  }

  return baseRegions;
}

export function createInitialMinistries(totalBudgetMillion = 3000000): Ministry[] {
  const specs: Omit<Ministry, 'ministerPartyId' | 'ministerName' | 'isPlayerMinister' | 'allocatedMillion' | 'performanceScore'>[] = [
    { id: 'MIN_EDU', name: 'กระทรวงศึกษาธิการ', shortName: 'ศึกษาธิการ', mission: 'พัฒนาหลักสูตร โรงเรียน และคุณภาพครูทั่วประเทศ', category: 'SOCIAL', budgetSharePct: 14.0 },
    { id: 'MIN_MOPH', name: 'กระทรวงสาธารณสุข', shortName: 'สาธารณสุข', mission: 'ระบบหลักประกันสุขภาพ โรงพยาบาล และการควบคุมโรค', category: 'SOCIAL', budgetSharePct: 13.0 },
    { id: 'MIN_MOT', name: 'กระทรวงคมนาคม', shortName: 'คมนาคม', mission: 'โครงข่ายทางหลวง รถไฟ ขนส่งมวลชน และโลจิสติกส์', category: 'INFRASTRUCTURE', budgetSharePct: 11.5 },
    { id: 'MIN_MOI', name: 'กระทรวงมหาดไทย', shortName: 'มหาดไทย', mission: 'การปกครองส่วนภูมิภาค ท้องถิ่น และการบรรเทาสาธารณภัย', category: 'GOVERNANCE', budgetSharePct: 10.5 },
    { id: 'MIN_MOD', name: 'กระทรวงกลาโหม', shortName: 'กลาโหม', mission: 'ความมั่นคงของรัฐและการป้องกันชายแดน', category: 'SECURITY', budgetSharePct: 8.5 },
    { id: 'MIN_MOF', name: 'กระทรวงการคลัง', shortName: 'การคลัง', mission: 'นโยบายภาษี วินัยการคลัง และบริหารหนี้สาธารณะ', category: 'ECONOMIC', budgetSharePct: 8.0 },
    { id: 'MIN_MOAC', name: 'กระทรวงเกษตรและสหกรณ์', shortName: 'เกษตรฯ', mission: 'ชลประทาน ราคาสินค้าเกษตร และที่ดินทำกิน', category: 'ECONOMIC', budgetSharePct: 7.5 },
    { id: 'MIN_MHESI', name: 'กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม', shortName: 'อว.', mission: 'มหาวิทยาลัย งานวิจัย และเศรษฐกิจฐานนวัตกรรม', category: 'SOCIAL', budgetSharePct: 4.5 },
    { id: 'MIN_MSDHS', name: 'กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์', shortName: 'พม.', mission: 'สวัสดิการผู้สูงอายุ เด็ก ผู้พิการ และที่อยู่อาศัย', category: 'SOCIAL', budgetSharePct: 4.0 },
    { id: 'MIN_MOC', name: 'กระทรวงพาณิชย์', shortName: 'พาณิชย์', mission: 'ดูแลค่าครองชีพ การค้าภายใน และเจรจาส่งออก', category: 'ECONOMIC', budgetSharePct: 2.8 },
    { id: 'MIN_MOL', name: 'กระทรวงแรงงาน', shortName: 'แรงงาน', mission: 'ค่าจ้างขั้นต่ำ ประกันสังคม และทักษะฝีมือแรงงาน', category: 'SOCIAL', budgetSharePct: 2.7 },
    { id: 'MIN_MNRE', name: 'กระทรวงทรัพยากรธรรมชาติและสิ่งแวดล้อม', shortName: 'ทส.', mission: 'ป่าไม้ น้ำ อากาศสะอาด และการจัดการฝุ่นมลพิษ', category: 'INFRASTRUCTURE', budgetSharePct: 2.5 },
    { id: 'MIN_MDES', name: 'กระทรวงดิจิทัลเพื่อเศรษฐกิจและสังคม', shortName: 'ดีอี', mission: 'โครงสร้างพื้นฐานดิจิทัล รัฐบาลอิเล็กทรอนิกส์ และภัยไซเบอร์', category: 'INFRASTRUCTURE', budgetSharePct: 2.2 },
    { id: 'MIN_EN', name: 'กระทรวงพลังงาน', shortName: 'พลังงาน', mission: 'ความมั่นคงทางพลังงาน โครงสร้างค่าไฟ-ราคาน้ำมัน และพลังงานสะอาด', category: 'ECONOMIC', budgetSharePct: 2.0 },
    { id: 'MIN_MIND', name: 'กระทรวงอุตสาหกรรม', shortName: 'อุตสาหกรรม', mission: 'นิคมอุตสาหกรรม มาตรฐานโรงงาน และ SMEs', category: 'ECONOMIC', budgetSharePct: 1.8 },
    { id: 'MIN_MOTS', name: 'กระทรวงการท่องเที่ยวและกีฬา', shortName: 'ท่องเที่ยวฯ', mission: 'ส่งเสริมรายได้การท่องเที่ยวและมาตรฐานความปลอดภัย', category: 'ECONOMIC', budgetSharePct: 1.7 },
    { id: 'MIN_MFA', name: 'กระทรวงการต่างประเทศ', shortName: 'ต่างประเทศ', mission: 'การทูตเศรษฐกิจ ความร่วมมืออาเซียน และภูมิรัฐศาสตร์', category: 'SECURITY', budgetSharePct: 1.5 },
    { id: 'MIN_MCUL', name: 'กระทรวงวัฒนธรรม', shortName: 'วัฒนธรรม', mission: 'อนุรักษ์มรดกศิลปวัฒนธรรมและเศรษฐกิจสร้างสรรค์', category: 'SOCIAL', budgetSharePct: 1.3 },
  ];
  // Sum of shares = 100.0%
  return specs.map((s) => ({
    ...s,
    ministerPartyId: null,
    ministerName: 'รอการแต่งตั้ง',
    isPlayerMinister: false,
    allocatedMillion: Math.round((s.budgetSharePct / 100) * totalBudgetMillion),
    performanceScore: 58,
  }));
}

export function createInitialDemographics(): VoterDemographic[] {
  return [
    {
      id: 'DEMO_FARMER',
      name: 'เกษตรกรและชาวชนบท',
      populationSharePct: 26,
      avgMonthlyIncomeTHB: 11800,
      topConcern: 'ราคาพืชผล แหล่งน้ำชลประทาน และหนี้ครัวเรือน',
      govSatisfaction: 54,
      playerSupport: 15,
    },
    {
      id: 'DEMO_LABOR',
      name: 'แรงงานและพนักงานบริการ',
      populationSharePct: 28,
      avgMonthlyIncomeTHB: 15400,
      topConcern: 'ค่าครองชีพ ค่าแรงขั้นต่ำ และหลักประกันสังคม',
      govSatisfaction: 51,
      playerSupport: 15,
    },
    {
      id: 'DEMO_URBAN_MIDDLE',
      name: 'ชนชั้นกลางและคนทำงานเมือง',
      populationSharePct: 20,
      avgMonthlyIncomeTHB: 32500,
      topConcern: 'ขนส่งสาธารณะ ภาษี ความโปร่งใส และคุณภาพอากาศ',
      govSatisfaction: 48,
      playerSupport: 18,
    },
    {
      id: 'DEMO_SME_BIZ',
      name: 'ผู้ประกอบการ SMEs และนักธุรกิจ',
      populationSharePct: 10,
      avgMonthlyIncomeTHB: 68000,
      topConcern: 'เสถียรภาพเศรษฐกิจ ต้นทุนพลังงาน และสินเชื่อดอกเบี้ยต่ำ',
      govSatisfaction: 55,
      playerSupport: 14,
    },
    {
      id: 'DEMO_CIVIL_SENIOR',
      name: 'ข้าราชการและผู้สูงอายุ',
      populationSharePct: 9,
      avgMonthlyIncomeTHB: 24000,
      topConcern: 'สวัสดิการรักษาพยาบาล บำนาญ และความสงบเรียบร้อย',
      govSatisfaction: 59,
      playerSupport: 12,
    },
    {
      id: 'DEMO_YOUTH',
      name: 'คนรุ่นใหม่และนักศึกษา',
      populationSharePct: 7,
      avgMonthlyIncomeTHB: 13500,
      topConcern: 'โอกาสงานยุคดิจิทัล การปฏิรูปการศึกษา และสิทธิเสรีภาพ',
      govSatisfaction: 44,
      playerSupport: 20,
    },
  ];
}

const MINOR_PARTY_THEMES: { name: string; short: string; label: string; eco: number; gov: number; focusRegion: RegionId }[] = [
  { name: 'พรรคเกษตรกรก้าวไกล', short: 'กษก.', label: 'สหกรณ์เกษตรกร', eco: -55, gov: 15, focusRegion: 'NORTHEAST' },
  { name: 'พรรคแรงงานสยาม', short: 'รงส.', label: 'สวัสดิการแรงงาน', eco: -70, gov: 40, focusRegion: 'CENTRAL' },
  { name: 'พรรครักษ์ป่าและสิ่งแวดล้อม', short: 'รปส.', label: 'นิเวศวิทยาและสีเขียว', eco: -30, gov: 55, focusRegion: 'NORTH' },
  { name: 'พรรคครูไทยเพื่อการศึกษา', short: 'คทศ.', label: 'ปฏิรูปวิชาชีพครู', eco: -20, gov: 10, focusRegion: 'NORTHEAST' },
  { name: 'พรรคพลังท้องถิ่นสยาม', short: 'พทส.', label: 'กระจายอำนาจจังหวัด', eco: 10, gov: 45, focusRegion: 'CENTRAL' },
  { name: 'พรรคประมงและทะเลไทย', short: 'ปทท.', label: 'เศรษฐกิจทางทะเล', eco: 5, gov: 5, focusRegion: 'SOUTH' },
  { name: 'พรรคนวัตกรรมดิจิทัล', short: 'นวด.', label: 'เศรษฐกิจเทคโนโลยี', eco: 65, gov: 60, focusRegion: 'CENTRAL' },
  { name: 'พรรคผู้สูงวัยสุขภาพดี', short: 'ผสว.', label: 'สังคมสูงวัย', eco: -45, gov: -10, focusRegion: 'CENTRAL' },
  { name: 'พรรควิสาหกิจชุมชนไทย', short: 'วชท.', label: 'เศรษฐกิจฐานราก OTOP', eco: -25, gov: 20, focusRegion: 'NORTH' },
  { name: 'พรรคสันติภาพอันดามัน', short: 'สปอ.', label: 'ท่องเที่ยวและชุมชนใต้', eco: 20, gov: 25, focusRegion: 'SOUTH' },
  { name: 'พรรคพัฒนาลุ่มน้ำโขง', short: 'พลข.', label: 'การค้าชายแดนอีสาน', eco: 15, gov: 20, focusRegion: 'NORTHEAST' },
  { name: 'พรรคสหพันธ์ขนส่งไทย', short: 'สขท.', label: 'โลจิสติกส์และคมนาคม', eco: 30, gov: -5, focusRegion: 'EAST' },
  { name: 'พรรคธรรมาภิบาลประชาชน', short: 'ธภป.', label: 'ต้านคอร์รัปชัน', eco: 20, gov: 50, focusRegion: 'CENTRAL' },
  { name: 'พรรคชาวนาไทยยุคใหม่', short: 'ชนม.', label: 'พักหนี้และราคาข้าว', eco: -60, gov: 0, focusRegion: 'CENTRAL' },
  { name: 'พรรคพลเมืองล้านนา', short: 'พมล.', label: 'อัตลักษณ์และอากาศเหนือ', eco: -15, gov: 50, focusRegion: 'NORTH' },
  { name: 'พรรคเศรษฐกิจเสรีนิยม', short: 'ศสน.', label: 'ลดภาษีและเปิดเสรี', eco: 80, gov: 35, focusRegion: 'CENTRAL' },
  { name: 'พรรคพิทักษ์สวัสดิการสังคม', short: 'พสส.', label: 'รัฐสวัสดิการถ้วนหน้า', eco: -80, gov: 45, focusRegion: 'CENTRAL' },
  { name: 'พรรครวมพลังอาสา', short: 'รพอ.', label: 'สาธารณสุขชุมชน อสม.', eco: -35, gov: -15, focusRegion: 'NORTHEAST' },
  { name: 'พรรคสยามภักดีพัฒนา', short: 'สภพ.', label: 'อนุรักษ์นิยมสายกลาง', eco: 15, gov: -65, focusRegion: 'WEST' },
  { name: 'พรรคทางเลือกใหม่เยาวชน', short: 'ทมย.', label: 'สิทธิและสตาร์ทอัพ', eco: 10, gov: 75, focusRegion: 'CENTRAL' },
  { name: 'พรรคเกษตรอินทรีย์ไทย', short: 'กอท.', label: 'อาหารปลอดภัย', eco: -30, gov: 30, focusRegion: 'NORTH' },
  { name: 'พรรคพลังสตรีและครอบครัว', short: 'พสค.', label: 'ความเสมอภาคและเด็ก', eco: -40, gov: 50, focusRegion: 'CENTRAL' },
  { name: 'พรรคการค้าเสรีอาเซียน', short: 'กสอ.', label: 'ส่งออกและเขตเศรษฐกิจ', eco: 60, gov: 10, focusRegion: 'EAST' },
  { name: 'พรรคพัฒนาชายฝั่งตะวันออก', short: 'พชอ.', label: 'อุตสาหกรรม EEC', eco: 50, gov: -10, focusRegion: 'EAST' },
  { name: 'พรรคบ้านเกิดเมืองนอน', short: 'บกม.', label: 'ฟื้นฟูชนบท', eco: -20, gov: -10, focusRegion: 'NORTHEAST' },
  { name: 'พรรคยุติธรรมทางสังคม', short: 'ยธส.', label: 'ปฏิรูปกระบวนการยุติธรรม', eco: -15, gov: 65, focusRegion: 'CENTRAL' },
  { name: 'พรรคพลังงานสะอาดไทย', short: 'พสท.', label: 'โซลาร์เสรีและลดค่าไฟ', eco: 25, gov: 55, focusRegion: 'EAST' },
  { name: 'พรรคสหกรณ์ออมทรัพย์ไทย', short: 'สอท.', label: 'แก้หนี้นอกระบบ', eco: -35, gov: 15, focusRegion: 'NORTHEAST' },
  { name: 'พรรคศิลปินและสร้างสรรค์', short: 'ศสส.', label: 'เศรษฐกิจสร้างสรรค์', eco: 20, gov: 45, focusRegion: 'CENTRAL' },
  { name: 'พรรคชาวสวนยางและปาล์ม', short: 'ชยป.', label: 'เสถียรภาพราคาพืชใต้', eco: -25, gov: -15, focusRegion: 'SOUTH' },
  { name: 'พรรคประชาคมลุ่มเจ้าพระยา', short: 'ปจพ.', label: 'บริหารจัดการน้ำ', eco: -10, gov: 10, focusRegion: 'CENTRAL' },
  { name: 'พรรคพัฒนาเมืองรอง', short: 'พมร.', label: 'ท่องเที่ยวเมืองรอง', eco: 25, gov: 30, focusRegion: 'WEST' },
  { name: 'พรรคความมั่นคงทางอาหาร', short: 'คมอ.', label: 'เทคโนโลยีเกษตร', eco: 15, gov: 20, focusRegion: 'WEST' },
  { name: 'พรรคผู้ประกอบการรายย่อย', short: 'ผปร.', label: 'ปกป้องร้านค้าท้องถิ่น', eco: -10, gov: 25, focusRegion: 'CENTRAL' },
  { name: 'พรรคสามัคคีชายแดนใต้', short: 'สชต.', label: 'พหุวัฒนธรรมและการศึกษา', eco: -20, gov: 35, focusRegion: 'SOUTH' },
  { name: 'พรรคแรงงานนอกระบบ', short: 'รนร.', label: 'คุ้มครองไรเดอร์และอาชีพอิสระ', eco: -55, gov: 50, focusRegion: 'CENTRAL' },
  { name: 'พรรคสวัสดิการผู้พิการไทย', short: 'สพท.', label: 'อารยสถาปัตย์และสิทธิ', eco: -50, gov: 40, focusRegion: 'CENTRAL' },
  { name: 'พรรครักษ์แม่น้ำและขุนเขา', short: 'รมข.', label: 'สิทธิชุมชนจัดการป่า', eco: -35, gov: 55, focusRegion: 'WEST' },
  { name: 'พรรคเศรษฐกิจพอเพียงสยาม', short: 'ศพส.', label: 'พึ่งพาตนเองระดับตำบล', eco: -20, gov: -35, focusRegion: 'NORTHEAST' },
  { name: 'พรรคปฏิรูปภาษีเป็นธรรม', short: 'ปภธ.', label: 'วินัยการคลังและลดเหลื่อมล้ำ', eco: -40, gov: 60, focusRegion: 'CENTRAL' },
  { name: 'พรรคคมนาคมระบบรางไทย', short: 'ครท.', label: 'รถไฟทางคู่ทั่วไทย', eco: 10, gov: 20, focusRegion: 'NORTHEAST' },
  { name: 'พรรคส่งเสริมกีฬาชุมชน', short: 'สกช.', label: 'สุขภาพและเยาวชน', eco: 0, gov: 10, focusRegion: 'EAST' },
  { name: 'พรรคพลเมืองตื่นรู้', short: 'พตร.', label: 'ข้อมูลรัฐเปิดเผย Open Data', eco: 30, gov: 70, focusRegion: 'CENTRAL' },
  { name: 'พรรคสหภาพเกษตรที่ราบสูง', short: 'สกร.', label: 'มันสำปะหลังและอ้อยอีสาน', eco: -30, gov: 5, focusRegion: 'NORTHEAST' },
  { name: 'พรรคพัฒนาฝีมือช่างไทย', short: 'พชท.', label: 'อาชีวศึกษาสร้างชาติ', eco: 15, gov: 15, focusRegion: 'EAST' },
  { name: 'พรรคสันติราษฎร์บูรณาการ', short: 'สรบ.', label: 'ประสานผลประโยชน์ระดับชาติ', eco: 5, gov: -25, focusRegion: 'WEST' },
  { name: 'พรรคอนาคตภูมิภาคไทย', short: 'อภท.', label: 'ผู้ว่าฯ เลือกตั้งและงบท้องถิ่น', eco: 5, gov: 70, focusRegion: 'NORTH' },
];

export function createInitial57Parties(constituencyTotal = 400, partyListTotal = 100): PoliticalParty[] {
  const majorParties: PoliticalParty[] = [
    {
      id: 'PTY_01',
      name: 'พรรคก้าวหน้าประชา',
      shortName: 'ก้าวหน้าประชา',
      isMajor: true,
      color: '#EA580C',
      leader: { name: 'ธนากร วรโชติ', age: 43, ambition: 82, loyalty: 85, negotiation: 64, leadership: 86, integrity: 88, riskTolerance: 78, policyKnowledge: 87 },
      pmCandidates: ['ธนากร วรโชติ', 'ศิริกัญญา วัฒนกุล'],
      ideology: {
        economicAxis: -35,
        governanceAxis: 85,
        label: 'ก้าวหน้า · ปฏิรูปโครงสร้างและสวัสดิการ',
        keyPolicies: ['ทลายทุนผูกขาด', 'รัฐสวัสดิการก้าวหน้า', 'กระจายอำนาจสู่ท้องถิ่น', 'แก้ไขรัฐธรรมนูญ'],
      },
      nationalPopularity: 28,
      regionalStrength: { NORTH: 1.35, NORTHEAST: 1.05, CENTRAL: 1.65, EAST: 1.65, WEST: 0.85, SOUTH: 0.62 },
      constituencySeats: 112,
      partyListSeats: 36,
      totalSeats: 148,
      partyFundsMillion: 185,
      internalUnity: 86,
      publicReputation: 81,
      inCoalition: false,
      trustWithPlayer: 50,
      cabinetSatisfaction: 50,
      allocatedMinistries: [],
      legalStatus: 'ACTIVE',
    },
    {
      id: 'PTY_02',
      name: 'พรรคไทยรุ่งเรือง',
      shortName: 'ไทยรุ่งเรือง',
      isMajor: true,
      color: '#DC2626',
      leader: { name: 'แพรวา ชินวัตรกุล', age: 41, ambition: 88, loyalty: 82, negotiation: 84, leadership: 82, integrity: 68, riskTolerance: 74, policyKnowledge: 80 },
      pmCandidates: ['แพรวา ชินวัตรกุล', 'เศรษฐพงศ์ เจริญกิจ', 'ชัยเกษม นิติธรรม'],
      ideology: {
        economicAxis: 15,
        governanceAxis: 20,
        label: 'ประชานิยมเศรษฐกิจ · กระตุ้นกำลังซื้อและเมกะโปรเจกต์',
        keyPolicies: ['กระตุ้นเศรษฐกิจฐานราก', 'ยกระดับ 30 บาทรักษาทุกที่', 'รถไฟความเร็วสูงและโลจิสติกส์', 'พักหนี้เกษตรกร'],
      },
      nationalPopularity: 25,
      regionalStrength: { NORTH: 1.75, NORTHEAST: 1.85, CENTRAL: 1.15, EAST: 0.95, WEST: 0.9, SOUTH: 0.45 },
      constituencySeats: 114,
      partyListSeats: 28,
      totalSeats: 142,
      partyFundsMillion: 340,
      internalUnity: 78,
      publicReputation: 72,
      inCoalition: true,
      trustWithPlayer: 50,
      cabinetSatisfaction: 78,
      allocatedMinistries: [],
      legalStatus: 'ACTIVE',
    },
    {
      id: 'PTY_03',
      name: 'พรรคภูมิแผ่นดิน',
      shortName: 'ภูมิแผ่นดิน',
      isMajor: true,
      color: '#1D4ED8',
      leader: { name: 'อนุชิต ชาญวีรกุล', age: 57, ambition: 86, loyalty: 76, negotiation: 92, leadership: 80, integrity: 64, riskTolerance: 65, policyKnowledge: 74 },
      pmCandidates: ['อนุชิต ชาญวีรกุล'],
      ideology: {
        economicAxis: 25,
        governanceAxis: -25,
        label: 'ปฏิบัติการภูมิภาค · เครือข่ายจังหวัดและปากท้อง',
        keyPolicies: ['พัฒนาโครงข่ายถนนภูมิภาค', 'ท่องเที่ยวสุขภาพ', 'กองทุนหมู่บ้านเข้มแข็ง'],
      },
      nationalPopularity: 11,
      regionalStrength: { NORTH: 0.85, NORTHEAST: 1.35, CENTRAL: 1.25, EAST: 1.4, WEST: 2.35, SOUTH: 1.1 },
      constituencySeats: 66,
      partyListSeats: 5,
      totalSeats: 71,
      partyFundsMillion: 310,
      internalUnity: 88,
      publicReputation: 64,
      inCoalition: true,
      trustWithPlayer: 50,
      cabinetSatisfaction: 75,
      allocatedMinistries: [],
      legalStatus: 'ACTIVE',
    },
    {
      id: 'PTY_04',
      name: 'พรรครวมใจชาติ',
      shortName: 'รวมใจชาติ',
      isMajor: true,
      color: '#1E3A8A',
      leader: { name: 'พีระพันธุ์ พิทักษ์รัฐ', age: 63, ambition: 72, loyalty: 80, negotiation: 70, leadership: 76, integrity: 74, riskTolerance: 50, policyKnowledge: 75 },
      pmCandidates: ['พีระพันธุ์ พิทักษ์รัฐ'],
      ideology: {
        economicAxis: 20,
        governanceAxis: -75,
        label: 'อนุรักษ์นิยมความมั่นคง · พิทักษ์สถาบันและระเบียบสังคม',
        keyPolicies: ['รื้อโครงสร้างราคาพลังงาน', 'ความมั่นคงชายแดน', 'บัตรสวัสดิการแห่งรัฐ'],
      },
      nationalPopularity: 8,
      regionalStrength: { NORTH: 0.6, NORTHEAST: 0.45, CENTRAL: 0.98, EAST: 1.15, WEST: 1.55, SOUTH: 2.45 },
      constituencySeats: 24,
      partyListSeats: 12,
      totalSeats: 36,
      partyFundsMillion: 220,
      internalUnity: 72,
      publicReputation: 61,
      inCoalition: true,
      trustWithPlayer: 48,
      cabinetSatisfaction: 70,
      allocatedMinistries: [],
      legalStatus: 'ACTIVE',
    },
    {
      id: 'PTY_05',
      name: 'พรรคพลังประชารัฐกิจ',
      shortName: 'พลังประชารัฐกิจ',
      isMajor: true,
      color: '#047857',
      leader: { name: 'ประวิชญ์ วงษ์สุวรรณภูมิ', age: 69, ambition: 78, loyalty: 74, negotiation: 85, leadership: 72, integrity: 58, riskTolerance: 60, policyKnowledge: 68 },
      pmCandidates: ['ประวิชญ์ วงษ์สุวรรณภูมิ'],
      ideology: {
        economicAxis: -10,
        governanceAxis: -55,
        label: 'ประชารัฐภูมิภาค · บริหารน้ำและที่ดินทำกิน',
        keyPolicies: ['เปลี่ยนเอกสารสิทธิที่ดินทำกิน', 'บริหารจัดการน้ำทั่วประเทศ', 'เบี้ยยังชีพผู้สูงอายุขั้นบันได'],
      },
      nationalPopularity: 6,
      regionalStrength: { NORTH: 1.25, NORTHEAST: 0.8, CENTRAL: 1.15, EAST: 1.2, WEST: 1.45, SOUTH: 0.9 },
      constituencySeats: 37,
      partyListSeats: 3,
      totalSeats: 40,
      partyFundsMillion: 260,
      internalUnity: 62,
      publicReputation: 56,
      inCoalition: true,
      trustWithPlayer: 48,
      cabinetSatisfaction: 68,
      allocatedMinistries: [],
      legalStatus: 'ACTIVE',
    },
    {
      id: 'PTY_06',
      name: 'พรรคประชาธิปไตยสยาม',
      shortName: 'ประชาธิปไตยสยาม',
      isMajor: true,
      color: '#0284C7',
      leader: { name: 'อภิสิทธิ์ เวชชาชีวะกุล', age: 56, ambition: 68, loyalty: 82, negotiation: 76, leadership: 79, integrity: 82, riskTolerance: 48, policyKnowledge: 85 },
      pmCandidates: ['อภิสิทธิ์ เวชชาชีวะกุล'],
      ideology: {
        economicAxis: 45,
        governanceAxis: -15,
        label: 'เสรีนิยมประชาธิปไตยสายกลาง · วินัยการคลังและประกันรายได้',
        keyPolicies: ['ประกันรายได้เกษตรกร', 'เรียนฟรีถึง ปวส.', 'กระจายอำนาจแบบค่อยเป็นค่อยไป'],
      },
      nationalPopularity: 5.5,
      regionalStrength: { NORTH: 0.5, NORTHEAST: 0.35, CENTRAL: 0.72, EAST: 1.05, WEST: 1.4, SOUTH: 2.85 },
      constituencySeats: 22,
      partyListSeats: 4,
      totalSeats: 26,
      partyFundsMillion: 175,
      internalUnity: 66,
      publicReputation: 69,
      inCoalition: false,
      trustWithPlayer: 52,
      cabinetSatisfaction: 50,
      allocatedMinistries: [],
      legalStatus: 'ACTIVE',
    },
    {
      id: 'PTY_07',
      name: 'พรรคชาติไทยก้าวหน้า',
      shortName: 'ชาติไทยก้าวหน้า',
      isMajor: true,
      color: '#DB2777',
      leader: { name: 'วราวุธ ศิลปอาชาไชย', age: 51, ambition: 65, loyalty: 85, negotiation: 88, leadership: 75, integrity: 75, riskTolerance: 52, policyKnowledge: 78 },
      pmCandidates: ['วราวุธ ศิลปอาชาไชย'],
      ideology: {
        economicAxis: 15,
        governanceAxis: 5,
        label: 'สายกลางประสานงาน · เกษตรยั่งยืนและสิ่งแวดล้อม',
        keyPolicies: ['คาร์บอนเครดิตเพื่อเกษตรกร', 'พัฒนาแหล่งน้ำภาคกลาง', 'ท่องเที่ยวเชิงนิเวศ'],
      },
      nationalPopularity: 3.0,
      regionalStrength: { NORTH: 0.45, NORTHEAST: 0.4, CENTRAL: 1.55, EAST: 0.65, WEST: 1.35, SOUTH: 0.35 },
      constituencySeats: 9,
      partyListSeats: 1,
      totalSeats: 10,
      partyFundsMillion: 145,
      internalUnity: 90,
      publicReputation: 71,
      inCoalition: true,
      trustWithPlayer: 55,
      cabinetSatisfaction: 76,
      allocatedMinistries: [],
      legalStatus: 'ACTIVE',
    },
    {
      id: 'PTY_08',
      name: 'พรรคประชาชาติสันติ',
      shortName: 'ประชาชาติสันติ',
      isMajor: true,
      color: '#B45309',
      leader: { name: 'วันมูหะมัด นอร์มะทา', age: 72, ambition: 58, loyalty: 88, negotiation: 84, leadership: 82, integrity: 84, riskTolerance: 45, policyKnowledge: 82 },
      pmCandidates: ['วันมูหะมัด นอร์มะทา'],
      ideology: {
        economicAxis: -15,
        governanceAxis: 30,
        label: 'พหุวัฒนธรรม · สันติภาพชายแดนใต้และหลักนิติธรรม',
        keyPolicies: ['สภาสันติภาพชายแดนใต้', 'กองทุนฮาลาลโลก', 'กระจายอำนาจท้องถิ่นพิเศษ'],
      },
      nationalPopularity: 2.2,
      regionalStrength: { NORTH: 0.2, NORTHEAST: 0.2, CENTRAL: 0.25, EAST: 0.25, WEST: 0.25, SOUTH: 1.95 },
      constituencySeats: 7,
      partyListSeats: 2,
      totalSeats: 9,
      partyFundsMillion: 90,
      internalUnity: 89,
      publicReputation: 76,
      inCoalition: true,
      trustWithPlayer: 54,
      cabinetSatisfaction: 75,
      allocatedMinistries: [],
      legalStatus: 'ACTIVE',
    },
    {
      id: 'PTY_09',
      name: 'พรรคไทยสร้างสรรค์',
      shortName: 'ไทยสร้างสรรค์',
      isMajor: true,
      color: '#7C3AED',
      leader: { name: 'สุดารัตน์ เกยุราพันธุ์กิจ', age: 61, ambition: 76, loyalty: 80, negotiation: 78, leadership: 80, integrity: 79, riskTolerance: 62, policyKnowledge: 81 },
      pmCandidates: ['สุดารัตน์ เกยุราพันธุ์กิจ'],
      ideology: {
        economicAxis: -20,
        governanceAxis: 45,
        label: 'เสรีนิยมสวัสดิการ · บำนาญประชาชนและปลดล็อกใบอนุญาต SMEs',
        keyPolicies: ['บำนาญประชาชน 3,000 บาท', 'พักใช้ใบอนุญาตอุปสรรค SMEs', 'กองทุนตั้งตัวคนตัวเล็ก'],
      },
      nationalPopularity: 2.0,
      regionalStrength: { NORTH: 0.65, NORTHEAST: 0.95, CENTRAL: 0.72, EAST: 0.55, WEST: 0.45, SOUTH: 0.3 },
      constituencySeats: 5,
      partyListSeats: 1,
      totalSeats: 6,
      partyFundsMillion: 110,
      internalUnity: 77,
      publicReputation: 73,
      inCoalition: false,
      trustWithPlayer: 55,
      cabinetSatisfaction: 50,
      allocatedMinistries: [],
      legalStatus: 'ACTIVE',
    },
    {
      id: 'PTY_10',
      name: 'พรรคชาติพัฒนาเศรษฐกิจ',
      shortName: 'ชาติพัฒนาเศรษฐกิจ',
      isMajor: true,
      color: '#D97706',
      leader: { name: 'กรณ์ จาติกวณิชกุล', age: 58, ambition: 70, loyalty: 78, negotiation: 82, leadership: 78, integrity: 83, riskTolerance: 55, policyKnowledge: 90 },
      pmCandidates: ['กรณ์ จาติกวณิชกุล'],
      ideology: {
        economicAxis: 70,
        governanceAxis: 25,
        label: 'เสรีนิยมตลาดสมัยใหม่ · ปฏิรูปโครงสร้างหนี้และเครดิตสกอริ่ง',
        keyPolicies: ['ยกเลิกระบบแบล็กลิสต์บูโรแบบเดิม', 'ดึงดูดลงทุนเทคโนโลยีสะอาด', 'ลดภาษีชนชั้นกลาง'],
      },
      nationalPopularity: 1.5,
      regionalStrength: { NORTH: 0.45, NORTHEAST: 0.75, CENTRAL: 0.85, EAST: 0.75, WEST: 0.5, SOUTH: 0.4 },
      constituencySeats: 2,
      partyListSeats: 1,
      totalSeats: 3,
      partyFundsMillion: 120,
      internalUnity: 84,
      publicReputation: 75,
      inCoalition: false,
      trustWithPlayer: 55,
      cabinetSatisfaction: 50,
      allocatedMinistries: [],
      legalStatus: 'ACTIVE',
    },
  ];
  // Major seats sum so far:
  // Constituency: 112 + 114 + 66 + 24 + 37 + 22 + 9 + 7 + 5 + 2 = 398 (leaves 2 constituency seats for top minor parties)
  // Party-list: 36 + 28 + 5 + 12 + 3 + 4 + 1 + 2 + 1 + 1 = 93 (leaves 7 party-list seats for minor parliamentary parties)

  const minorColors = ['#0D9488', '#4F46E5', '#65A30D', '#0891B2', '#9333EA', '#CA8A04', '#475569'];
  const minorParties: PoliticalParty[] = MINOR_PARTY_THEMES.map((theme, index) => {
    const num = index + 11;
    const id = `PTY_${num < 10 ? `0${num}` : num}`;
    const cSeats = index < 2 ? 1 : 0; // 2 minor parties hold 1 constituency seat each -> 398 + 2 = 400!
    const plSeats = index < 7 ? 1 : 0; // 7 minor parties hold 1 party-list seat each -> 93 + 7 = 100!
    const inCoalition = index < 3; // 3 minor parties join coalition initially

    const regionalStrength: Record<RegionId, number> = {
      NORTH: 0.5,
      NORTHEAST: 0.5,
      CENTRAL: 0.5,
      EAST: 0.5,
      WEST: 0.5,
      SOUTH: 0.5,
    };
    regionalStrength[theme.focusRegion] = 1.45;

    return {
      id,
      name: theme.name,
      shortName: theme.short,
      isMajor: false,
      color: minorColors[index % minorColors.length],
      leader: {
        name: `หัวหน้า${theme.short} ลำดับที่ ${index + 1}`,
        age: 42 + (index % 22),
        ambition: 50 + (index % 35),
        loyalty: 65 + (index % 25),
        negotiation: 60 + (index % 30),
        leadership: 58 + (index % 25),
        integrity: 62 + (index % 30),
        riskTolerance: 45 + (index % 35),
        policyKnowledge: 64 + (index % 28),
      },
      pmCandidates: [],
      ideology: {
        economicAxis: theme.eco,
        governanceAxis: theme.gov,
        label: `พรรคเฉพาะด้าน · ${theme.label}`,
        keyPolicies: [`ผลักดันวาระ${theme.label}`, 'ปกป้องสิทธิสมาชิกฐานเสียงเฉพาะกลุ่ม'],
      },
      nationalPopularity: Number((0.25 + (index < 9 ? 0.35 : 0.08)).toFixed(2)),
      regionalStrength,
      constituencySeats: cSeats,
      partyListSeats: plSeats,
      totalSeats: cSeats + plSeats,
      partyFundsMillion: 18 + (index % 20),
      internalUnity: 75 + (index % 18),
      publicReputation: 58 + (index % 20),
      inCoalition,
      trustWithPlayer: 50,
      cabinetSatisfaction: 65,
      allocatedMinistries: [],
      legalStatus: 'ACTIVE',
    };
  });

  const allParties = [...majorParties, ...minorParties].map((p) => ({
    ...p,
    logoFile: PARTY_SVG_FILENAMES[p.id] || `${p.id.toLowerCase()}.svg`,
  }));

  // If custom ruleset changed constituencyTotal or partyListTotal, proportionally rebalance cleanly
  if (constituencyTotal !== 400 || partyListTotal !== 100) {
    let cAssigned = 0;
    allParties.forEach((p, i) => {
      if (i === allParties.length - 1) {
        p.constituencySeats = Math.max(0, constituencyTotal - cAssigned);
      } else {
        const s = Math.round((p.constituencySeats / 400) * constituencyTotal);
        p.constituencySeats = s;
        cAssigned += s;
      }
    });
    let plAssigned = 0;
    allParties.forEach((p, i) => {
      if (i === allParties.length - 1) {
        p.partyListSeats = Math.max(0, partyListTotal - plAssigned);
      } else {
        const s = Math.round((p.partyListSeats / 100) * partyListTotal);
        p.partyListSeats = s;
        plAssigned += s;
      }
      p.totalSeats = p.constituencySeats + p.partyListSeats;
    });
  }

  return allParties;
}
