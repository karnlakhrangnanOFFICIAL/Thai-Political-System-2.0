import { ensureAchievementFields } from '../engines/achievementEngine';
import { assertAndRepairDataIntegrity } from '../engines/legalEngine';
import { GameState, PlayerRole, SaveSlotMetadata } from '../types/game';

const SLOT_INDEX_KEY = 'kkp_politic2_save_index_v1';
const SLOT_DATA_PREFIX = 'kkp_politic2_slot_data_v1_';

export const ROLE_LABELS_TH: Record<PlayerRole, string> = {
  [PlayerRole.CITIZEN]: 'ประชาชนทั่วไป',
  [PlayerRole.LOCAL_ADMIN]: 'ผู้บริหารท้องถิ่น (นายกเทศมนตรี)',
  [PlayerRole.PARTY_MEMBER]: 'สมาชิกพรรคการเมือง',
  [PlayerRole.MP_CANDIDATE]: 'ผู้สมัครรับเลือกตั้ง ส.ส.',
  [PlayerRole.MP_OPPOSITION]: 'ส.ส. ฝ่ายค้าน',
  [PlayerRole.MP_GOVERNMENT]: 'ส.ส. ฝ่ายรัฐบาล',
  [PlayerRole.OPPOSITION_LEADER]: 'ผู้นำฝ่ายค้านในสภาผู้แทนราษฎร',
  [PlayerRole.PARTY_LEADER]: 'หัวหน้าพรรคการเมือง',
  [PlayerRole.MINISTER]: 'รัฐมนตรีว่าการกระทรวง',
  [PlayerRole.PRIME_MINISTER]: 'นายกรัฐมนตรี',
};

export const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

export function formatThaiDate(monthIndex: number, yearBE: number): string {
  return `${THAI_MONTHS[monthIndex % 12]} พ.ศ. ${yearBE}`;
}

export function listSaveSlots(): SaveSlotMetadata[] {
  try {
    const raw = localStorage.getItem(SLOT_INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGameToSlot(slotId: string, slotName: string, state: GameState): SaveSlotMetadata[] {
  try {
    ensureAchievementFields(state);
    const meta: SaveSlotMetadata = {
      slotId,
      slotName,
      savedAtISO: new Date().toISOString(),
      playerName: state.player.name,
      roleLabel: ROLE_LABELS_TH[state.player.role] || 'ประชาชน',
      turn: state.turn,
      dateLabel: formatThaiDate(state.monthIndex, state.yearBE),
      scenario: state.scenario,
      achievementsCount: state.unlockedAchievements.length,
    };

    localStorage.setItem(`${SLOT_DATA_PREFIX}${slotId}`, JSON.stringify(state));

    const existing = listSaveSlots().filter((s) => s.slotId !== slotId);
    const updated = [meta, ...existing];
    localStorage.setItem(SLOT_INDEX_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return listSaveSlots();
  }
}

export function loadGameFromSlot(slotId: string): GameState | null {
  try {
    const raw = localStorage.getItem(`${SLOT_DATA_PREFIX}${slotId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed || !parsed.player || !Array.isArray(parsed.parties)) {
      return null;
    }
    ensureAchievementFields(parsed);
    assertAndRepairDataIntegrity(parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function deleteSaveSlot(slotId: string): SaveSlotMetadata[] {
  try {
    localStorage.removeItem(`${SLOT_DATA_PREFIX}${slotId}`);
    const updated = listSaveSlots().filter((s) => s.slotId !== slotId);
    localStorage.setItem(SLOT_INDEX_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return listSaveSlots();
  }
}
