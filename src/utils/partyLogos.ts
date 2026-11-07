import { PoliticalParty } from '../types/game';

/**
 * โฟลเดอร์จริงในโปรเจกต์สำหรับอัปโหลดไฟล์ .svg ของทั้ง 57 พรรค:
 * /public/assets/party-logos/
 *
 * พาธสาธารณะเมื่อเว็บแอปพลิเคชันเรียกใช้งาน:
 * /assets/party-logos/
 */
export const PARTY_LOGO_PROJECT_DIR = '/public/assets/party-logos/';
export const PARTY_LOGO_PUBLIC_BASE = '/assets/party-logos';

/**
 * ทะเบียนจับคู่รหัสพรรคการเมืองทั้ง 57 พรรค กับชื่อไฟล์ .svg ประจำพรรค
 */
export const PARTY_SVG_FILENAMES: Record<string, string> = {
  PTY_01: 'pty_01.svg',
  PTY_02: 'pty_02.svg',
  PTY_03: 'pty_03.svg',
  PTY_04: 'pty_04.svg',
  PTY_05: 'pty_05.svg',
  PTY_06: 'pty_06.svg',
  PTY_07: 'pty_07.svg',
  PTY_08: 'pty_08.svg',
  PTY_09: 'pty_09.svg',
  PTY_10: 'pty_10.svg',
  PTY_11: 'pty_11.svg',
  PTY_12: 'pty_12.svg',
  PTY_13: 'pty_13.svg',
  PTY_14: 'pty_14.svg',
  PTY_15: 'pty_15.svg',
  PTY_16: 'pty_16.svg',
  PTY_17: 'pty_17.svg',
  PTY_18: 'pty_18.svg',
  PTY_19: 'pty_19.svg',
  PTY_20: 'pty_20.svg',
  PTY_21: 'pty_21.svg',
  PTY_22: 'pty_22.svg',
  PTY_23: 'pty_23.svg',
  PTY_24: 'pty_24.svg',
  PTY_25: 'pty_25.svg',
  PTY_26: 'pty_26.svg',
  PTY_27: 'pty_27.svg',
  PTY_28: 'pty_28.svg',
  PTY_29: 'pty_29.svg',
  PTY_30: 'pty_30.svg',
  PTY_31: 'pty_31.svg',
  PTY_32: 'pty_32.svg',
  PTY_33: 'pty_33.svg',
  PTY_34: 'pty_34.svg',
  PTY_35: 'pty_35.svg',
  PTY_36: 'pty_36.svg',
  PTY_37: 'pty_37.svg',
  PTY_38: 'pty_38.svg',
  PTY_39: 'pty_39.svg',
  PTY_40: 'pty_40.svg',
  PTY_41: 'pty_41.svg',
  PTY_42: 'pty_42.svg',
  PTY_43: 'pty_43.svg',
  PTY_44: 'pty_44.svg',
  PTY_45: 'pty_45.svg',
  PTY_46: 'pty_46.svg',
  PTY_47: 'pty_47.svg',
  PTY_48: 'pty_48.svg',
  PTY_49: 'pty_49.svg',
  PTY_50: 'pty_50.svg',
  PTY_51: 'pty_51.svg',
  PTY_52: 'pty_52.svg',
  PTY_53: 'pty_53.svg',
  PTY_54: 'pty_54.svg',
  PTY_55: 'pty_55.svg',
  PTY_56: 'pty_56.svg',
  PTY_57: 'pty_57.svg',
};

export function getPartyLogoFilename(
  party: Pick<PoliticalParty, 'id' | 'logoFile'>
): string {
  if (party.logoFile) return party.logoFile;
  return PARTY_SVG_FILENAMES[party.id] || `${party.id.toLowerCase()}.svg`;
}

export function getPartyLogoUrl(
  party: Pick<PoliticalParty, 'id' | 'logoFile'>
): string {
  const filename = getPartyLogoFilename(party);
  return `${PARTY_LOGO_PUBLIC_BASE}/${filename}`;
}
