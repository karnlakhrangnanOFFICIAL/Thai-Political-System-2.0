import { ECT_REGION_ORDER, isValidECTRegionId, normalizeLegacyRegionId } from '../data/ectRegions';
import { createInitialRegions } from '../data/initialData';
import {
  AuditLogEntry,
  BillStatus,
  ConstitutionRuleset,
  FactCheckStatus,
  FinancialLedgerType,
  GameState,
  LegislativeBill,
  PlayerCharacter,
  PlayerRole,
  PolicyCard,
  PoliticalLayer,
  RegionId,
} from '../types/game';
import { formatThaiDate, ROLE_LABELS_TH } from '../utils/storage';
import { ensureAchievementFields } from './achievementEngine';

export interface LegalValidationResult {
  valid: boolean;
  reason: string;
  legalCitation: string;
}

export function getPartyMembershipDays(player: PlayerCharacter, currentDayTick: number): number {
  if (!player.partyId || player.partyJoinDayTick === null) return 0;
  return Math.max(0, currentDayTick - player.partyJoinDayTick);
}

/**
 * LAYER 01: Distinct Role-Specific Constitutional Eligibility Check
 * Never uses a single generic rule across different offices.
 */
export function checkRoleEligibility(
  player: PlayerCharacter,
  constitution: ConstitutionRuleset,
  targetRole: 'VOTER' | 'LOCAL_CANDIDATE' | 'MP_CANDIDATE' | 'MINISTER' | 'PRIME_MINISTER',
  currentDayTick: number,
  isDissolutionElection: boolean,
  partyTotalSeats = 0
): LegalValidationResult {
  if (player.legalDisqualified) {
    return {
      valid: false,
      reason: `ถูกตัดสิทธิทางการเมืองชั่วคราว (${player.disqualificationReason || 'อยู่ระหว่างคำวินิจฉัย'})`,
      legalCitation: 'รัฐธรรมนูญ มาตรา 98 (ลักษณะต้องห้ามมิให้ใช้สิทธิสมัครรับเลือกตั้ง)',
    };
  }

  if (!player.thaiNational) {
    return {
      valid: false,
      reason: 'ต้องมีสัญชาติไทย',
      legalCitation: 'รัฐธรรมนูญ มาตรา 95 และ 97',
    };
  }

  switch (targetRole) {
    case 'VOTER': {
      if (player.ageYears < constitution.voterMinAge) {
        return {
          valid: false,
          reason: `อายุยังไม่ครบ ${constitution.voterMinAge} ปีบริบูรณ์`,
          legalCitation: 'รัฐธรรมนูญ มาตรา 95(2)',
        };
      }
      return { valid: true, reason: 'มีสิทธิเลือกตั้งครบถ้วน', legalCitation: 'รัฐธรรมนูญ มาตรา 95' };
    }

    case 'LOCAL_CANDIDATE': {
      const minLocalAge = Math.max(25, constitution.mpMinAge);
      if (player.ageYears < minLocalAge) {
        return {
          valid: false,
          reason: `ผู้สมัครผู้บริหารท้องถิ่นต้องมีอายุไม่ต่ำกว่า ${minLocalAge} ปีบริบูรณ์`,
          legalCitation: 'พ.ร.บ. การเลือกตั้งสมาชิกสภาท้องถิ่นหรือผู้บริหารท้องถิ่น',
        };
      }
      return {
        valid: true,
        reason: 'คุณสมบัติครบถ้วนในการลงสมัครผู้บริหารท้องถิ่น',
        legalCitation: 'พ.ร.บ. การเลือกตั้งท้องถิ่น',
      };
    }

    case 'MP_CANDIDATE': {
      if (constitution.requireBirthThaiNationality && !player.birthThaiNational) {
        return {
          valid: false,
          reason: 'ต้องมีสัญชาติไทยโดยการเกิด',
          legalCitation: 'รัฐธรรมนูญ มาตรา 97(1)',
        };
      }
      if (player.ageYears < constitution.mpMinAge) {
        return {
          valid: false,
          reason: `ผู้สมัคร ส.ส. ต้องมีอายุไม่ต่ำกว่า ${constitution.mpMinAge} ปีนับถึงวันเลือกตั้ง`,
          legalCitation: 'รัฐธรรมนูญ มาตรา 97(2)',
        };
      }
      const reqDays = isDissolutionElection
        ? constitution.dissolutionPartyMembershipDays
        : constitution.normalPartyMembershipDays;
      const memberDays = getPartyMembershipDays(player, currentDayTick);
      if (!player.partyId || memberDays < reqDays) {
        return {
          valid: false,
          reason: `ต้องเป็นสมาชิกพรรคการเมืองติดต่อกันไม่น้อยกว่า ${reqDays} วัน (ปัจจุบัน ${memberDays} วัน)`,
          legalCitation: 'รัฐธรรมนูญ มาตรา 97(3)',
        };
      }
      return {
        valid: true,
        reason: `คุณสมบัติผู้สมัคร ส.ส. ครบถ้วน (สังกัดพรรค ${memberDays} วัน)`,
        legalCitation: 'รัฐธรรมนูญ มาตรา 97',
      };
    }

    case 'MINISTER': {
      if (player.ageYears < constitution.ministerMinAge) {
        return {
          valid: false,
          reason: `รัฐมนตรีต้องมีอายุไม่ต่ำกว่า ${constitution.ministerMinAge} ปีบริบูรณ์`,
          legalCitation: 'รัฐธรรมนูญ มาตรา 160(2)',
        };
      }
      if (player.integrityScore < 40) {
        return {
          valid: false,
          reason: 'ขาดความซื่อสัตย์สุจริตเป็นที่ประจักษ์ตามเกณฑ์จริยธรรม (Integrity < 40)',
          legalCitation: 'รัฐธรรมนูญ มาตรา 160(4) และ (5)',
        };
      }
      return {
        valid: true,
        reason: 'คุณสมบัติรัฐมนตรีครบถ้วนตามมาตรา 160',
        legalCitation: 'รัฐธรรมนูญ มาตรา 160',
      };
    }

    case 'PRIME_MINISTER': {
      const minCheck = checkRoleEligibility(
        player,
        constitution,
        'MINISTER',
        currentDayTick,
        isDissolutionElection,
        partyTotalSeats
      );
      if (!minCheck.valid) return minCheck;

      if (player.ageYears < constitution.pmMinAge) {
        return {
          valid: false,
          reason: `นายกรัฐมนตรีต้องมีอายุไม่ต่ำกว่า ${constitution.pmMinAge} ปี`,
          legalCitation: 'รัฐธรรมนูญ มาตรา 159 และ 160',
        };
      }

      const maxDays = constitution.pmMaxCumulativeYears * 365;
      if (player.cumulativePMDays >= maxDays) {
        return {
          valid: false,
          reason: `ดำรงตำแหน่งนายกรัฐมนตรีรวมครบเพดาน ${constitution.pmMaxCumulativeYears} ปี (${maxDays} วัน) แล้ว`,
          legalCitation: 'รัฐธรรมนูญ มาตรา 158 วรรคสี่',
        };
      }

      const minPartySeats = Math.ceil(
        (constitution.pmNominationPartySeatThresholdPct / 100) * constitution.totalSeats
      );
      if (partyTotalSeats < minPartySeats) {
        return {
          valid: false,
          reason: `พรรคที่เสนอชื่อต้องมี ส.ส. ไม่น้อยกว่าร้อยละ ${constitution.pmNominationPartySeatThresholdPct} (${minPartySeats} ที่นั่ง · ปัจจุบัน ${partyTotalSeats} ที่นั่ง)`,
          legalCitation: 'รัฐธรรมนูญ มาตรา 159 วรรคหนึ่ง',
        };
      }

      return {
        valid: true,
        reason: 'คุณสมบัติแคนดิเดตนายกรัฐมนตรีครบถ้วน',
        legalCitation: 'รัฐธรรมนูญ มาตรา 158 และ 159',
      };
    }
  }
}

export function validateCardPlay(state: GameState, card: PolicyCard): LegalValidationResult {
  if (state.actionPoints < card.apCost) {
    return {
      valid: false,
      reason: `แต้มดำเนินการไม่พอ (ต้องการ ${card.apCost} AP · คงเหลือ ${state.actionPoints} AP)`,
      legalCitation: card.legalBasis,
    };
  }

  if (!card.requiredRoles.includes(state.player.role)) {
    const allowedLabels = card.requiredRoles.slice(0, 2).map((r) => ROLE_LABELS_TH[r]).join(' / ');
    return {
      valid: false,
      reason: `จำกัดเฉพาะตำแหน่ง: ${allowedLabels}`,
      legalCitation: card.legalBasis,
    };
  }

  if (card.requiresParliamentOpen && state.parliamentStatus !== 'ACTIVE') {
    return {
      valid: false,
      reason: 'สภาผู้แทนราษฎรอยู่ระหว่างยุบสภาหรือรอเปิดสมัยประชุม',
      legalCitation: 'รัฐธรรมนูญ หมวดรัฐสภา (สมัยประชุมและองค์ประชุม)',
    };
  }

  if (card.effects.specialAction === 'REGISTER_MP_CANDIDATE') {
    return checkRoleEligibility(
      state.player,
      state.constitution,
      'MP_CANDIDATE',
      state.dayTick,
      state.isDissolutionElection
    );
  }

  if (card.effects.specialAction === 'RUN_LOCAL_ELECTION') {
    return checkRoleEligibility(
      state.player,
      state.constitution,
      'LOCAL_CANDIDATE',
      state.dayTick,
      state.isDissolutionElection
    );
  }

  if (card.minPartyDays) {
    const days = getPartyMembershipDays(state.player, state.dayTick);
    if (days < card.minPartyDays) {
      return {
        valid: false,
        reason: `ต้องเป็นสมาชิกพรรคอย่างน้อย ${card.minPartyDays} วัน (ปัจจุบัน ${days} วัน)`,
        legalCitation: card.legalBasis,
      };
    }
  }

  // Strict 3-Tier Separate Financial Validation
  if (card.ledgerType === FinancialLedgerType.PERSONAL && state.player.finances.cash < card.moneyCost) {
    return {
      valid: false,
      reason: `เงินส่วนตัวไม่เพียงพอ (ต้องการ ${card.moneyCost.toLocaleString()} ฿)`,
      legalCitation: 'หลักการแยกทรัพย์สินส่วนบุคคลออกจากเงินพรรคและเงินแผ่นดิน',
    };
  }

  if (card.ledgerType === FinancialLedgerType.PARTY) {
    const party = state.parties.find((p) => p.id === state.player.partyId);
    if (!party || party.partyFundsMillion < card.moneyCost) {
      return {
        valid: false,
        reason: `งบประมาณพรรคไม่เพียงพอ (ต้องการ ${card.moneyCost} ล้านบาท)`,
        legalCitation: 'พ.ร.ป. ว่าด้วยพรรคการเมือง หมวดการเงินพรรค',
      };
    }
  }

  if (card.ledgerType === FinancialLedgerType.STATE) {
    if (state.parliamentStatus === 'DISSOLVED_CARETAKER') {
      return {
        valid: false,
        reason: 'รัฐบาลรักษาการห้ามอนุมัติโครงการก่อภาระผูกพันงบประมาณใหม่',
        legalCitation: 'รัฐธรรมนูญ มาตรา 169 (ข้อจำกัดอำนาจคณะรัฐมนตรีรักษาการ)',
      };
    }
    if (state.stateFinances.centralReserveMillion < card.moneyCost) {
      return {
        valid: false,
        reason: `งบกลางสำรองแผ่นดินไม่พอ (ต้องการ ${card.moneyCost.toLocaleString()} ล้าน ฿ · เหลือ ${state.stateFinances.centralReserveMillion.toLocaleString()} ล้าน ฿)`,
        legalCitation: 'พ.ร.บ. วิธีการงบประมาณ พ.ศ. 2561',
      };
    }
  }

  return {
    valid: true,
    reason: 'มีอำนาจและคุณสมบัติตามกฎหมายครบถ้วน',
    legalCitation: card.legalBasis,
  };
}

/**
 * Advances active bills step-by-step through the statutory Thai legislative pipeline:
 * SUBMITTED -> FIRST_READING -> COMMITTEE_REVIEW -> SECOND_READING -> THIRD_READING -> SENATE_PROCESS -> FINAL_APPROVAL -> PROMULGATED
 */
export function advanceParliamentaryBills(state: GameState): void {
  if (state.parliamentStatus !== 'ACTIVE') return;

  const dateLabel = formatThaiDate(state.monthIndex, state.yearBE);
  // Check quorum (at least 250 of 500 MPs present)
  const baseQuorum = Math.round(
    state.constitution.totalSeats * (0.58 + (state.governmentStability - state.politicalFrictionIndex * 0.4) / 280)
  );
  const quorumPresent = Math.max(210, Math.min(state.constitution.totalSeats, baseQuorum));
  state.lastQuorumPresent = quorumPresent;

  const halfTotal = Math.floor(state.constitution.totalSeats / 2) + 1;
  if (quorumPresent < halfTotal) {
    // Lack of quorum stalls readings this month!
    const hasPendingBills = state.bills.some(
      (b) => b.status !== BillStatus.PROMULGATED && b.status !== BillStatus.REJECTED && b.status !== BillStatus.WITHDRAWN
    );
    if (hasPendingBills) {
      state.newsFeed.unshift({
        id: `NWS_QUORUM_${state.dayTick}`,
        eventId: `QUORUM_COLLAPSE_${state.turn}`,
        tick: state.dayTick,
        dateLabel,
        category: 'รัฐสภา',
        headline: `สภาล่ม! องค์ประชุมมาแสดงตนเพียง ${quorumPresent} จาก ${state.constitution.totalSeats} คน`,
        summary: 'ความขัดแย้งทางการเมืองทำให้องค์ประชุมไม่ครบกึ่งหนึ่ง การพิจารณาร่างกฎหมายต้องเลื่อนออกไปในเดือนถัดไป',
        factStatus: FactCheckStatus.VERIFIED_FACT,
        sourceName: 'วิทยุและโทรทัศน์รัฐสภา',
      });
      state.governmentStability = Math.max(0, state.governmentStability - 4);
    }
    return;
  }

  for (const bill of state.bills) {
    if (
      bill.status === BillStatus.PROMULGATED ||
      bill.status === BillStatus.REJECTED ||
      bill.status === BillStatus.WITHDRAWN
    ) {
      continue;
    }

    const proposerParty = state.parties.find((p) => p.id === bill.proposerPartyId);
    const isGovBill = proposerParty?.inCoalition ?? false;

    if (bill.status === BillStatus.DRAFT) {
      bill.status = BillStatus.SUBMITTED;
      continue;
    }

    if (bill.status === BillStatus.SUBMITTED) {
      bill.status = BillStatus.FIRST_READING;
      continue;
    }

    if (bill.status === BillStatus.FIRST_READING) {
      // First reading vote in principle
      const requiredPct =
        bill.category === 'CONSTITUTIONAL' ? state.constitution.amendmentSupermajorityPct / 100 : 0.502;
      const requiredVotes = Math.ceil(quorumPresent * requiredPct);

      let yesVotes = 0;
      let noVotes = 0;
      let abstainVotes = 0;

      for (const p of state.parties) {
        if (p.totalSeats === 0) continue;
        const presentSeats = Math.round((p.totalSeats / state.constitution.totalSeats) * quorumPresent);
        if (p.id === bill.proposerPartyId) {
          yesVotes += presentSeats;
        } else if (bill.category === 'CONSTITUTIONAL') {
          if (p.ideology.governanceAxis > 5) {
            yesVotes += Math.round(presentSeats * 0.85);
            abstainVotes += presentSeats - Math.round(presentSeats * 0.85);
          } else {
            noVotes += Math.round(presentSeats * 0.7);
            abstainVotes += presentSeats - Math.round(presentSeats * 0.7);
          }
        } else if (isGovBill && p.inCoalition) {
          const discipline = Math.max(0.65, (p.internalUnity - state.politicalFrictionIndex * 0.25) / 100);
          const yes = Math.round(presentSeats * Math.min(0.98, discipline));
          yesVotes += yes;
          abstainVotes += presentSeats - yes;
        } else if (!isGovBill && !p.inCoalition) {
          yesVotes += Math.round(presentSeats * 0.85);
          abstainVotes += presentSeats - Math.round(presentSeats * 0.85);
        } else {
          // Cross-aisle evaluation on public merit
          const crossSupport = bill.category === 'GOVERNANCE' ? 0.35 : 0.18;
          const yes = Math.round(presentSeats * crossSupport);
          const no = Math.round(presentSeats * (0.75 - crossSupport));
          yesVotes += yes;
          noVotes += no;
          abstainVotes += Math.max(0, presentSeats - yes - no);
        }
      }

      bill.yesVotes = yesVotes;
      bill.noVotes = noVotes;
      bill.abstainVotes = abstainVotes;

      if (yesVotes >= requiredVotes) {
        bill.status = BillStatus.COMMITTEE_REVIEW;
      } else {
        bill.status = BillStatus.REJECTED;
        state.auditLog.unshift(
          createAuditEntry(
            state,
            PoliticalLayer.LAW,
            'สภาผู้แทนราษฎร',
            `ตีตกร่างกฎหมาย "${bill.title}" ในวาระที่ 1`,
            'รัฐธรรมนูญ มาตรา 136 และข้อบังคับการประชุมสภา',
            `เห็นชอบ ${yesVotes} เสียง · ไม่เห็นชอบ ${noVotes} เสียง (เกณฑ์ผ่าน ${requiredVotes} เสียง)`
          )
        );
      }
      continue;
    }

    if (bill.status === BillStatus.COMMITTEE_REVIEW) {
      bill.status = BillStatus.SECOND_READING;
      continue;
    }

    if (bill.status === BillStatus.SECOND_READING) {
      bill.status = BillStatus.THIRD_READING;
      continue;
    }

    if (bill.status === BillStatus.THIRD_READING) {
      // Third reading roll call
      const threshold =
        bill.category === 'CONSTITUTIONAL'
          ? Math.ceil(state.constitution.totalSeats * (state.constitution.amendmentSupermajorityPct / 100))
          : Math.floor(quorumPresent / 2) + 1;

      if (bill.yesVotes >= threshold) {
        bill.status = BillStatus.SENATE_PROCESS;
      } else {
        bill.status = BillStatus.REJECTED;
      }
      continue;
    }

    if (bill.status === BillStatus.SENATE_PROCESS) {
      if (bill.category === 'CONSTITUTIONAL' && state.constitution.senateApprovalRequiredForAmendment) {
        // Check if broad consensus exists
        if (bill.yesVotes < Math.ceil(state.constitution.totalSeats * 0.56)) {
          bill.status = BillStatus.REJECTED;
          state.newsFeed.unshift({
            id: `NWS_SENATE_BLOCK_${bill.id}_${state.dayTick}`,
            eventId: bill.id,
            tick: state.dayTick,
            dateLabel,
            category: 'รัฐสภา',
            headline: `ญัตติแก้ไขรัฐธรรมนูญ "${bill.title}" ไม่ผ่านเกณฑ์เสียงวุฒิสภา`,
            summary: 'เสียงสนับสนุนในที่ประชุมร่วมรัฐสภาไม่ถึงเกณฑ์พิเศษตามที่รัฐธรรมนูญกำหนด',
            factStatus: FactCheckStatus.VERIFIED_FACT,
            sourceName: 'สำนักข่าวรัฐสภา',
          });
          continue;
        }
      }
      bill.status = BillStatus.FINAL_APPROVAL;
      continue;
    }

    if (bill.status === BillStatus.FINAL_APPROVAL) {
      bill.status = BillStatus.PROMULGATED;
      // Apply real statutory & economic effects!
      if (bill.constitutionalChange) {
        state.constitution = {
          ...state.constitution,
          ...bill.constitutionalChange,
        };
      }
      if (bill.economicImpact) {
        if (bill.economicImpact.gdpGrowthDelta) {
          state.economy.gdpGrowthPct = Number(
            (state.economy.gdpGrowthPct + bill.economicImpact.gdpGrowthDelta).toFixed(2)
          );
        }
        if (bill.economicImpact.approvalDelta) {
          state.regions.forEach((r) => {
            r.govApproval = clamp(r.govApproval + (bill.economicImpact?.approvalDelta || 0), 5, 95);
          });
        }
        if (bill.economicImpact.inequalityDelta) {
          state.economy.inequalityGini = Number(
            Math.max(0.28, Math.min(0.55, state.economy.inequalityGini + bill.economicImpact.inequalityDelta)).toFixed(3)
          );
        }
      }

      state.auditLog.unshift(
        createAuditEntry(
          state,
          PoliticalLayer.LAW,
          'ราชกิจจานุเบกษา',
          `ประกาศใช้ "${bill.title}" เป็นกฎหมายมีผลบังคับใช้`,
          bill.category === 'CONSTITUTIONAL' ? 'รัฐธรรมนูญ มาตรา 256' : 'รัฐธรรมนูญ มาตรา 81 และ 145',
          bill.effectsSummary
        )
      );

      state.newsFeed.unshift({
        id: `NWS_LAW_PASS_${bill.id}_${state.dayTick}`,
        eventId: bill.id,
        tick: state.dayTick,
        dateLabel,
        category: 'รัฐสภา',
        headline: `ประกาศราชกิจจานุเบกษา บังคับใช้ "${bill.title}" อย่างเป็นทางการ`,
        summary: `${bill.effectsSummary} (เสนอโดย ${bill.proposerName})`,
        factStatus: FactCheckStatus.VERIFIED_FACT,
        sourceName: 'ราชกิจจานุเบกษา',
      });
    }
  }
}

/**
 * Simulates Independent Constitutional Organs (กกต., ป.ป.ช., ศาลรัฐธรรมนูญ, สตง.)
 * strictly according to statutory jurisdiction and evidence thresholds.
 */
export function runIndependentAgenciesTick(state: GameState): void {
  const dateLabel = formatThaiDate(state.monthIndex, state.yearBE);

  // Lift expired disqualifications
  if (
    state.player.legalDisqualified &&
    state.player.disqualificationUntilTick !== null &&
    state.dayTick >= state.player.disqualificationUntilTick
  ) {
    state.player.legalDisqualified = false;
    state.player.disqualificationReason = null;
    state.player.disqualificationUntilTick = null;
    state.auditLog.unshift(
      createAuditEntry(
        state,
        PoliticalLayer.LAW,
        'สำนักงาน กกต.',
        `คืนสิทธิทางการเมืองแก่ ${state.player.name} หลังครบกำหนดเวลาตามกฎหมาย`,
        'รัฐธรรมนูญ หมวดสิทธิและเสรีภาพ',
        'ผู้เล่นสามารถกลับมาสมัครสมาชิกพรรคและลงรับเลือกตั้งได้อีกครั้ง'
      )
    );
  }

  // Process pending agency cases
  for (const c of state.agencyCases) {
    if (c.status !== 'PENDING') continue;
    if (state.dayTick - c.openedTick >= 60) {
      if (state.player.integrityScore >= 52) {
        c.status = 'CLEARED';
        state.player.activeInvestigations = Math.max(0, state.player.activeInvestigations - 1);
        state.player.socialReputation = clamp(state.player.socialReputation + 4, 0, 100);
        state.auditLog.unshift(
          createAuditEntry(
            state,
            PoliticalLayer.LAW,
            c.agency,
            `มีมติยกคำร้องกรณี "${c.subject}" ของ ${c.targetName}`,
            c.legalBasis,
            'หลักฐานไม่ปรากฏการกระทำผิดกฎหมายและมาตรฐานจริยธรรม'
          )
        );
      } else {
        c.status = 'SANCTIONED';
        state.player.activeInvestigations = Math.max(0, state.player.activeInvestigations - 1);
        state.player.legalDisqualified = true;
        state.player.disqualificationReason = `คำวินิจฉัย ${c.agency}: ${c.subject}`;
        state.player.disqualificationUntilTick = state.dayTick + 360; // 12 months suspension in simulation
        // Demote to Citizen (Game continues! Never Game Over!)
        state.player.role = PlayerRole.CITIZEN;
        state.player.isMP = false;
        state.player.mpType = 'NONE';
        state.player.assignedMinistryId = null;
        state.player.isPartyLeader = false;

        state.auditLog.unshift(
          createAuditEntry(
            state,
            PoliticalLayer.LAW,
            c.agency,
            `วินิจฉัยตัดสิทธิทางการเมืองชั่วคราว 1 ปี แก่ ${c.targetName}`,
            c.legalBasis,
            'พ้นจากตำแหน่งทางการเมืองและกลับสู่สถานะประชาชนทั่วไป (สามารถดำเนินชีวิตต่อได้)'
          )
        );
        state.newsFeed.unshift({
          id: `NWS_SANCTION_${c.id}`,
          eventId: c.id,
          tick: state.dayTick,
          dateLabel,
          category: 'ตรวจสอบภาครัฐ',
          headline: `${c.agency} มีคำวินิจฉัยให้ ${c.targetName} พ้นจากตำแหน่งและพักสิทธิการเมือง 1 ปี`,
          summary: `สืบเนื่องจากคดี "${c.subject}" เจ้าตัวกลับไปดำเนินชีวิตภาคประชาชนเพื่อรอวันคืนสู่สนามการเมือง`,
          factStatus: FactCheckStatus.VERIFIED_FACT,
          sourceName: 'สำนักข่าวกฎหมายมหาชน',
        });
      }
    }
  }
}

export function createAuditEntry(
  state: GameState,
  layer: PoliticalLayer,
  actor: string,
  action: string,
  legalAuthority: string,
  outcome: string
): AuditLogEntry {
  return {
    id: `AUD_${state.dayTick}_${Math.random().toString(36).slice(2, 7)}`,
    tick: state.dayTick,
    dateLabel: formatThaiDate(state.monthIndex, state.yearBE),
    layer,
    actor,
    action,
    legalAuthority,
    outcome,
  };
}

export function migrateGameStateRegionsToECT(state: GameState): void {
  state.player.homeRegion = normalizeLegacyRegionId(state.player.homeRegion as string);
  state.selectedRegionId = normalizeLegacyRegionId(state.selectedRegionId as string);

  const hasExactECTRegions =
    Array.isArray(state.regions) &&
    state.regions.length === ECT_REGION_ORDER.length &&
    ECT_REGION_ORDER.every((rid, idx) => state.regions[idx]?.id === rid);

  if (!hasExactECTRegions) {
    const oldRegions = Array.isArray(state.regions) ? state.regions : [];
    const avgApproval =
      oldRegions.length > 0
        ? Math.round(oldRegions.reduce((s, r) => s + (r.govApproval || 52), 0) / oldRegions.length)
        : 52;

    const freshRegions = createInitialRegions(state.constitution?.constituencySeats || 400);
    freshRegions.forEach((fresh) => {
      const directMatch = oldRegions.find((old) => (old.id as string) === fresh.id);
      if (directMatch) {
        fresh.govApproval = directMatch.govApproval;
        fresh.localEconomyScore = directMatch.localEconomyScore;
        fresh.infrastructureScore = directMatch.infrastructureScore;
        fresh.environmentScore = directMatch.environmentScore;
        if (directMatch.dominantPartyId) {
          fresh.dominantPartyId = directMatch.dominantPartyId;
        }
      } else {
        fresh.govApproval = avgApproval;
      }
    });
    state.regions = freshRegions;
  }

  // Ensure every party has regionalStrength populated for all 6 ECT regions
  for (const party of state.parties) {
    const rawStrength = (party.regionalStrength || {}) as Record<string, number>;
    const normalizedStrength = {} as Record<RegionId, number>;
    normalizedStrength.NORTH = rawStrength.NORTH ?? 0.65;
    normalizedStrength.NORTHEAST = rawStrength.NORTHEAST ?? 0.65;
    normalizedStrength.CENTRAL =
      rawStrength.CENTRAL !== undefined && rawStrength.BKK !== undefined
        ? Number(((rawStrength.CENTRAL * 0.72 + rawStrength.BKK * 0.28)).toFixed(2))
        : (rawStrength.CENTRAL ?? rawStrength.BKK ?? 0.75);
    normalizedStrength.EAST = rawStrength.EAST ?? rawStrength.CENTRAL ?? 0.75;
    normalizedStrength.WEST = rawStrength.WEST ?? rawStrength.CENTRAL ?? 0.7;
    normalizedStrength.SOUTH =
      rawStrength.SOUTH ??
      (rawStrength.SOUTH_UPPER !== undefined
        ? Number(
            (
              rawStrength.SOUTH_UPPER * 0.78 +
              (rawStrength.SOUTH_BORDER ?? rawStrength.SOUTH_UPPER) * 0.22
            ).toFixed(2)
          )
        : 0.65);

    party.regionalStrength = normalizedStrength;
  }

  // Verify selectedRegionId exists cleanly
  if (!isValidECTRegionId(state.selectedRegionId)) {
    state.selectedRegionId = 'CENTRAL';
  }
}

/**
 * Enforces Section 11.2 Data Integrity Invariants on every turn.
 */
export function assertAndRepairDataIntegrity(state: GameState): void {
  ensureAchievementFields(state);
  migrateGameStateRegionsToECT(state);
  if (!Array.isArray(state.storyArcHistory)) {
    state.storyArcHistory = [];
  }
  if (!state.chainLastResolvedTurn || typeof state.chainLastResolvedTurn !== 'object') {
    state.chainLastResolvedTurn = {};
  }
  if (typeof state.player.scandalRisk !== 'number' || Number.isNaN(state.player.scandalRisk)) {
    state.player.scandalRisk = 0;
  } else {
    state.player.scandalRisk = clamp(Math.round(state.player.scandalRisk), 0, 100);
  }

  if (
    state.player.activeInvestigations > 0 ||
    state.player.legalDisqualified ||
    state.agencyCases.some((c) => c.targetName === state.player.name)
  ) {
    state.careerStats.everInvestigated = true;
  }

  const cTarget = state.constitution.constituencySeats;
  const plTarget = state.constitution.partyListSeats;
  state.constitution.totalSeats = cTarget + plTarget;

  let cSum = state.parties.reduce((acc, p) => acc + p.constituencySeats, 0);
  let plSum = state.parties.reduce((acc, p) => acc + p.partyListSeats, 0);

  if (cSum !== cTarget && state.parties.length > 0) {
    const diff = cTarget - cSum;
    const largest = [...state.parties].sort((a, b) => b.constituencySeats - a.constituencySeats)[0];
    largest.constituencySeats = Math.max(0, largest.constituencySeats + diff);
  }
  if (plSum !== plTarget && state.parties.length > 0) {
    const diff = plTarget - plSum;
    const largest = [...state.parties].sort((a, b) => b.partyListSeats - a.partyListSeats)[0];
    largest.partyListSeats = Math.max(0, largest.partyListSeats + diff);
  }

  let coalitionSum = 0;
  let oppositionSum = 0;
  for (const p of state.parties) {
    p.totalSeats = p.constituencySeats + p.partyListSeats;
    if (p.inCoalition) {
      coalitionSum += p.totalSeats;
    } else {
      oppositionSum += p.totalSeats;
    }
  }

  state.coalitionSeatCount = coalitionSum;
  state.oppositionSeatCount = oppositionSum;

  // Assert Cabinet cap <= maxCabinetMinisters (35)
  const appointedCount = state.ministries.filter((m) => m.ministerPartyId !== null).length;
  if (appointedCount > state.constitution.maxCabinetMinisters) {
    state.ministries.slice(state.constitution.maxCabinetMinisters).forEach((m) => {
      m.ministerPartyId = null;
      m.ministerName = 'ว่าง';
    });
  }
}

export function createSampleBill(
  state: GameState,
  type: 'WELFARE' | 'TRANSPARENCY' | 'INFRASTRUCTURE' | 'CONSTITUTION'
): LegislativeBill {
  const proposerPartyId = state.player.partyId || 'PTY_01';
  if (type === 'WELFARE') {
    return {
      id: `BILL_WELFARE_${state.dayTick}`,
      title: 'ร่าง พ.ร.บ. บำนาญพื้นฐานประชาชนและสวัสดิการเด็กเล็ก พ.ศ. ....',
      category: 'SOCIAL',
      description: 'จัดตั้งระบบสวัสดิการถ้วนหน้าลดความเหลื่อมล้ำครัวเรือนเปราะบางทั่วประเทศ',
      proposerName: state.player.name,
      proposerPartyId,
      status: BillStatus.FIRST_READING,
      submittedTick: state.dayTick,
      yesVotes: 0,
      noVotes: 0,
      abstainVotes: 0,
      effectsSummary: '+4 คะแนนนิยมรัฐบาลทุกภูมิภาค · ลดสัมประสิทธิ์ความเหลื่อมล้ำ Gini -0.012',
      economicImpact: {
        approvalDelta: 4,
        inequalityDelta: -0.012,
        gdpGrowthDelta: 0.15,
      },
    };
  }
  if (type === 'TRANSPARENCY') {
    return {
      id: `BILL_OPEN_${state.dayTick}`,
      title: 'ร่าง พ.ร.บ. ข้อมูลข่าวสารสาธารณะและจัดซื้อจัดจ้างโปร่งใส พ.ศ. ....',
      category: 'GOVERNANCE',
      description: 'กำหนดให้หน่วยงานรัฐเปิดเผยสัญญาและราคากลางในรูปแบบ Machine-Readable ทุกโครงการ',
      proposerName: state.player.name,
      proposerPartyId,
      status: BillStatus.FIRST_READING,
      submittedTick: state.dayTick,
      yesVotes: 0,
      noVotes: 0,
      abstainVotes: 0,
      effectsSummary: '+3 คะแนนนิยม · ลดการรั่วไหลงบประมาณและเพิ่มความเชื่อมั่นนักลงทุน',
      economicImpact: {
        approvalDelta: 3,
        gdpGrowthDelta: 0.2,
      },
    };
  }
  if (type === 'INFRASTRUCTURE') {
    return {
      id: `BILL_INFRA_${state.dayTick}`,
      title: 'ร่าง พ.ร.บ. พัฒนาโครงข่ายคมนาคมระบบรางและเศรษฐกิจภูมิภาค พ.ศ. ....',
      category: 'ECONOMIC',
      description: 'ปลดล็อกการลงทุนโครงข่ายรถไฟทางคู่และศูนย์โลจิสติกส์เชื่อม 6 ภูมิภาค',
      proposerName: state.player.name,
      proposerPartyId,
      status: BillStatus.FIRST_READING,
      submittedTick: state.dayTick,
      yesVotes: 0,
      noVotes: 0,
      abstainVotes: 0,
      effectsSummary: '+0.45% การเติบโต GDP · +3 คะแนนนิยมภูมิภาค',
      economicImpact: {
        gdpGrowthDelta: 0.45,
        approvalDelta: 3,
      },
    };
  }
  return {
    id: `BILL_CONST_${state.dayTick}`,
    title: 'ร่างรัฐธรรมนูญแห่งราชอาณาจักรไทย แก้ไขเพิ่มเติม (ฉบับที่ ..) พ.ศ. ....',
    category: 'CONSTITUTIONAL',
    description: 'ยกเลิกเงื่อนไขเสียงวุฒิสภาในการแก้ไขรัฐธรรมนูญ และลดระยะเวลาสังกัดพรรคของผู้สมัคร ส.ส. เหลือ 60 วัน',
    proposerName: state.player.name,
    proposerPartyId,
    status: BillStatus.FIRST_READING,
    submittedTick: state.dayTick,
    yesVotes: 0,
    noVotes: 0,
    abstainVotes: 0,
    effectsSummary: 'ปรับกติการัฐธรรมนูญ: ยกเลิกเงื่อนไขเสียง ส.ว. และลดวันสังกัดพรรคเหลือ 60 วัน',
    constitutionalChange: {
      senateApprovalRequiredForAmendment: false,
      normalPartyMembershipDays: 60,
      version: `${state.constitution.version}-Amended`,
    },
    economicImpact: {
      approvalDelta: 5,
    },
  };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
