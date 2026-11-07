import { RegionId } from '../types/game';

export interface ECTProvinceSpec {
  code: string;
  name: string;
  regionId: RegionId;
  seats400: number;
}

export interface ECTRegionSpec {
  id: RegionId;
  ectOrder: number;
  name: string;
  shortLabel: string;
  provincesCount: number;
  constituencySeats400: number;
  provinces: ECTProvinceSpec[];
}

export const ECT_REGION_ORDER: RegionId[] = [
  'NORTH',
  'NORTHEAST',
  'CENTRAL',
  'EAST',
  'WEST',
  'SOUTH',
];

export const ECT_REGION_LIST: ECTRegionSpec[] = [
  {
    id: 'NORTH',
    ectOrder: 1,
    name: 'ภาคเหนือ',
    shortLabel: 'เหนือ',
    provincesCount: 9,
    constituencySeats400: 37,
    provinces: [
      { code: '57', name: 'เชียงราย', regionId: 'NORTH', seats400: 7 },
      { code: '50', name: 'เชียงใหม่', regionId: 'NORTH', seats400: 10 },
      { code: '55', name: 'น่าน', regionId: 'NORTH', seats400: 3 },
      { code: '56', name: 'พะเยา', regionId: 'NORTH', seats400: 3 },
      { code: '54', name: 'แพร่', regionId: 'NORTH', seats400: 3 },
      { code: '58', name: 'แม่ฮ่องสอน', regionId: 'NORTH', seats400: 2 },
      { code: '52', name: 'ลำปาง', regionId: 'NORTH', seats400: 4 },
      { code: '51', name: 'ลำพูน', regionId: 'NORTH', seats400: 2 },
      { code: '53', name: 'อุตรดิตถ์', regionId: 'NORTH', seats400: 3 },
    ],
  },
  {
    id: 'NORTHEAST',
    ectOrder: 2,
    name: 'ภาคตะวันออกเฉียงเหนือ',
    shortLabel: 'อีสาน',
    provincesCount: 20,
    constituencySeats400: 133,
    provinces: [
      { code: '46', name: 'กาฬสินธุ์', regionId: 'NORTHEAST', seats400: 6 },
      { code: '40', name: 'ขอนแก่น', regionId: 'NORTHEAST', seats400: 11 },
      { code: '36', name: 'ชัยภูมิ', regionId: 'NORTHEAST', seats400: 7 },
      { code: '48', name: 'นครพนม', regionId: 'NORTHEAST', seats400: 4 },
      { code: '30', name: 'นครราชสีมา', regionId: 'NORTHEAST', seats400: 16 },
      { code: '38', name: 'บึงกาฬ', regionId: 'NORTHEAST', seats400: 3 },
      { code: '31', name: 'บุรีรัมย์', regionId: 'NORTHEAST', seats400: 10 },
      { code: '44', name: 'มหาสารคาม', regionId: 'NORTHEAST', seats400: 6 },
      { code: '49', name: 'มุกดาหาร', regionId: 'NORTHEAST', seats400: 2 },
      { code: '35', name: 'ยโสธร', regionId: 'NORTHEAST', seats400: 3 },
      { code: '45', name: 'ร้อยเอ็ด', regionId: 'NORTHEAST', seats400: 8 },
      { code: '42', name: 'เลย', regionId: 'NORTHEAST', seats400: 4 },
      { code: '33', name: 'ศรีสะเกษ', regionId: 'NORTHEAST', seats400: 9 },
      { code: '47', name: 'สกลนคร', regionId: 'NORTHEAST', seats400: 7 },
      { code: '32', name: 'สุรินทร์', regionId: 'NORTHEAST', seats400: 8 },
      { code: '43', name: 'หนองคาย', regionId: 'NORTHEAST', seats400: 3 },
      { code: '39', name: 'หนองบัวลำภู', regionId: 'NORTHEAST', seats400: 3 },
      { code: '37', name: 'อำนาจเจริญ', regionId: 'NORTHEAST', seats400: 2 },
      { code: '41', name: 'อุดรธานี', regionId: 'NORTHEAST', seats400: 10 },
      { code: '34', name: 'อุบลราชธานี', regionId: 'NORTHEAST', seats400: 11 },
    ],
  },
  {
    id: 'CENTRAL',
    ectOrder: 3,
    name: 'ภาคกลาง',
    shortLabel: 'กลาง',
    provincesCount: 22,
    constituencySeats400: 123,
    provinces: [
      { code: '10', name: 'กรุงเทพมหานคร', regionId: 'CENTRAL', seats400: 33 },
      { code: '62', name: 'กำแพงเพชร', regionId: 'CENTRAL', seats400: 4 },
      { code: '18', name: 'ชัยนาท', regionId: 'CENTRAL', seats400: 2 },
      { code: '26', name: 'นครนายก', regionId: 'CENTRAL', seats400: 2 },
      { code: '73', name: 'นครปฐม', regionId: 'CENTRAL', seats400: 6 },
      { code: '60', name: 'นครสวรรค์', regionId: 'CENTRAL', seats400: 6 },
      { code: '12', name: 'นนทบุรี', regionId: 'CENTRAL', seats400: 8 },
      { code: '13', name: 'ปทุมธานี', regionId: 'CENTRAL', seats400: 8 },
      { code: '14', name: 'พระนครศรีอยุธยา', regionId: 'CENTRAL', seats400: 5 },
      { code: '66', name: 'พิจิตร', regionId: 'CENTRAL', seats400: 3 },
      { code: '65', name: 'พิษณุโลก', regionId: 'CENTRAL', seats400: 5 },
      { code: '67', name: 'เพชรบูรณ์', regionId: 'CENTRAL', seats400: 6 },
      { code: '16', name: 'ลพบุรี', regionId: 'CENTRAL', seats400: 4 },
      { code: '11', name: 'สมุทรปราการ', regionId: 'CENTRAL', seats400: 8 },
      { code: '75', name: 'สมุทรสงคราม', regionId: 'CENTRAL', seats400: 1 },
      { code: '74', name: 'สมุทรสาคร', regionId: 'CENTRAL', seats400: 4 },
      { code: '19', name: 'สระบุรี', regionId: 'CENTRAL', seats400: 4 },
      { code: '17', name: 'สิงห์บุรี', regionId: 'CENTRAL', seats400: 1 },
      { code: '64', name: 'สุโขทัย', regionId: 'CENTRAL', seats400: 4 },
      { code: '72', name: 'สุพรรณบุรี', regionId: 'CENTRAL', seats400: 5 },
      { code: '15', name: 'อ่างทอง', regionId: 'CENTRAL', seats400: 2 },
      { code: '61', name: 'อุทัยธานี', regionId: 'CENTRAL', seats400: 2 },
    ],
  },
  {
    id: 'EAST',
    ectOrder: 4,
    name: 'ภาคตะวันออก',
    shortLabel: 'ตะวันออก',
    provincesCount: 7,
    constituencySeats400: 29,
    provinces: [
      { code: '22', name: 'จันทบุรี', regionId: 'EAST', seats400: 3 },
      { code: '24', name: 'ฉะเชิงเทรา', regionId: 'EAST', seats400: 4 },
      { code: '20', name: 'ชลบุรี', regionId: 'EAST', seats400: 10 },
      { code: '23', name: 'ตราด', regionId: 'EAST', seats400: 1 },
      { code: '25', name: 'ปราจีนบุรี', regionId: 'EAST', seats400: 3 },
      { code: '21', name: 'ระยอง', regionId: 'EAST', seats400: 5 },
      { code: '27', name: 'สระแก้ว', regionId: 'EAST', seats400: 3 },
    ],
  },
  {
    id: 'WEST',
    ectOrder: 5,
    name: 'ภาคตะวันตก',
    shortLabel: 'ตะวันตก',
    provincesCount: 5,
    constituencySeats400: 19,
    provinces: [
      { code: '71', name: 'กาญจนบุรี', regionId: 'WEST', seats400: 5 },
      { code: '63', name: 'ตาก', regionId: 'WEST', seats400: 3 },
      { code: '77', name: 'ประจวบคีรีขันธ์', regionId: 'WEST', seats400: 3 },
      { code: '76', name: 'เพชรบุรี', regionId: 'WEST', seats400: 3 },
      { code: '70', name: 'ราชบุรี', regionId: 'WEST', seats400: 5 },
    ],
  },
  {
    id: 'SOUTH',
    ectOrder: 6,
    name: 'ภาคใต้',
    shortLabel: 'ใต้',
    provincesCount: 14,
    constituencySeats400: 59,
    provinces: [
      { code: '81', name: 'กระบี่', regionId: 'SOUTH', seats400: 3 },
      { code: '86', name: 'ชุมพร', regionId: 'SOUTH', seats400: 3 },
      { code: '92', name: 'ตรัง', regionId: 'SOUTH', seats400: 4 },
      { code: '80', name: 'นครศรีธรรมราช', regionId: 'SOUTH', seats400: 9 },
      { code: '96', name: 'นราธิวาส', regionId: 'SOUTH', seats400: 5 },
      { code: '94', name: 'ปัตตานี', regionId: 'SOUTH', seats400: 5 },
      { code: '82', name: 'พังงา', regionId: 'SOUTH', seats400: 2 },
      { code: '93', name: 'พัทลุง', regionId: 'SOUTH', seats400: 3 },
      { code: '83', name: 'ภูเก็ต', regionId: 'SOUTH', seats400: 3 },
      { code: '95', name: 'ยะลา', regionId: 'SOUTH', seats400: 3 },
      { code: '85', name: 'ระนอง', regionId: 'SOUTH', seats400: 1 },
      { code: '90', name: 'สงขลา', regionId: 'SOUTH', seats400: 9 },
      { code: '91', name: 'สตูล', regionId: 'SOUTH', seats400: 2 },
      { code: '84', name: 'สุราษฎร์ธานี', regionId: 'SOUTH', seats400: 7 },
    ],
  },
];

export const ECT_REGIONS_SPEC: Record<RegionId, ECTRegionSpec> = ECT_REGION_LIST.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<RegionId, ECTRegionSpec>
);

export const ECT_PROVINCE_BY_CODE: Record<string, ECTProvinceSpec> = {};
export const ECT_PROVINCE_BY_NAME: Record<string, ECTProvinceSpec> = {};

for (const region of ECT_REGION_LIST) {
  for (const prov of region.provinces) {
    ECT_PROVINCE_BY_CODE[prov.code] = prov;
    ECT_PROVINCE_BY_NAME[prov.name] = prov;
  }
}

export function isValidECTRegionId(val: unknown): val is RegionId {
  return typeof val === 'string' && (ECT_REGION_ORDER as string[]).includes(val);
}

export function normalizeLegacyRegionId(raw: string | undefined | null): RegionId {
  if (!raw) return 'CENTRAL';
  if (isValidECTRegionId(raw)) return raw;
  if (raw === 'BKK') return 'CENTRAL';
  if (raw === 'SOUTH_UPPER' || raw === 'SOUTH_BORDER') return 'SOUTH';
  return 'CENTRAL';
}
