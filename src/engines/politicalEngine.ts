import {
  ElectionResultRecord,
  FactCheckStatus,
  GameState,
  PlayerRole,
  PoliticalLayer,
  PoliticalParty,
} from '../types/game';
import { formatThaiDate } from '../utils/storage';
import { ensureAchievementFields } from './achievementEngine';
import { assertAndRepairDataIntegrity, checkRoleEligibility, createAuditEntry } from './legalEngine';

/**
 * LAYER 02: Political Negotiation & Coalition Compatibility Scoring
 */
export function calculateCoalitionCompatibility(
  leadParty: PoliticalParty,
  partnerParty: PoliticalParty
): {
  ideologicalDistance: number;
  policyCompatibility: number;
  willingnessScore: number;
} {
  const ecoDiff = Math.abs(leadParty.ideology.economicAxis - partnerParty.ideology.economicAxis);
  const govDiff = Math.abs(leadParty.ideology.governanceAxis - partnerParty.ideology.governanceAxis);
  const ideologicalDistance = Math.min(100, Math.round((ecoDiff * 0.4 + govDiff * 0.6) / 1.8));
  const policyCompatibility = Math.max(0, 100 - ideologicalDistance);

  const willingnessScore = Math.round(
    policyCompatibility * 0.45 +
      partnerParty.trustWithPlayer * 0.25 +
      partnerParty.leader.negotiation * 0.15 +
      partnerParty.leader.ambition * 0.15
  );

  return {
    ideologicalDistance,
    policyCompatibility,
    willingnessScore,
  };
}

/**
 * Allocates the 18 Ministries proportionally among coalition parties (capped strictly <= maxCabinetMinisters)
 * and computes Cabinet Satisfaction & Political Friction Index.
 */
export function allocateCabinetMinistries(state: GameState, customCoalitionIds?: string[]): void {
  const coalitionParties = customCoalitionIds
    ? state.parties.filter((p) => customCoalitionIds.includes(p.id) && p.totalSeats > 0)
    : state.parties.filter((p) => p.inCoalition && p.totalSeats > 0);

  state.parties.forEach((p) => {
    p.inCoalition = coalitionParties.some((cp) => cp.id === p.id);
    p.allocatedMinistries = [];
  });

  const totalCoalitionSeats = coalitionParties.reduce((sum, p) => sum + p.totalSeats, 0);
  if (totalCoalitionSeats === 0 || coalitionParties.length === 0) return;

  const sortedCoalition = [...coalitionParties].sort((a, b) => b.totalSeats - a.totalSeats);
  const leadParty = sortedCoalition[0];

  // Determine Prime Minister legally
  let pmName = leadParty.pmCandidates[0] || leadParty.leader.name;
  let pmPartyId = leadParty.id;

  if (state.player.partyId === leadParty.id && state.player.isPartyLeader) {
    const pmElig = checkRoleEligibility(
      state.player,
      state.constitution,
      'PRIME_MINISTER',
      state.dayTick,
      state.isDissolutionElection,
      leadParty.totalSeats
    );
    if (pmElig.valid) {
      pmName = state.player.name;
      pmPartyId = leadParty.id;
      state.player.role = PlayerRole.PRIME_MINISTER;
      state.player.assignedMinistryId = null;
    }
  }

  state.primeMinisterName = pmName;
  state.primeMinisterPartyId = pmPartyId;

  // Distribute 18 Ministries proportionally using D'Hondt quotients
  const ministryCounts: Record<string, number> = {};
  sortedCoalition.forEach((p) => {
    ministryCounts[p.id] = 0;
  });

  for (const ministry of state.ministries) {
    let bestParty = sortedCoalition[0];
    let bestQuotient = -1;
    for (const p of sortedCoalition) {
      const q = p.totalSeats / (ministryCounts[p.id] + 1);
      if (q > bestQuotient) {
        bestQuotient = q;
        bestParty = p;
      }
    }
    ministryCounts[bestParty.id] += 1;
    bestParty.allocatedMinistries.push(ministry.id);
    ministry.ministerPartyId = bestParty.id;
    ministry.isPlayerMinister = false;

    if (
      state.player.partyId === bestParty.id &&
      state.player.role !== PlayerRole.PRIME_MINISTER &&
      (state.player.isPartyLeader || (state.player.isMP && state.player.politicalExperience >= 35)) &&
      !state.player.assignedMinistryId
    ) {
      const minCheck = checkRoleEligibility(
        state.player,
        state.constitution,
        'MINISTER',
        state.dayTick,
        state.isDissolutionElection,
        bestParty.totalSeats
      );
      if (minCheck.valid) {
        ministry.ministerName = state.player.name;
        ministry.isPlayerMinister = true;
        state.player.role = PlayerRole.MINISTER;
        state.player.assignedMinistryId = ministry.id;
      } else {
        ministry.ministerName = bestParty.leader.name;
      }
    } else {
      ministry.ministerName =
        ministryCounts[bestParty.id] === 1
          ? bestParty.leader.name
          : `ผู้แทน${bestParty.shortName} (${ministry.shortName})`;
    }
  }

  // Update player parliamentary role if not Minister/PM
  updatePlayerParliamentaryRole(state);

  // Calculate Cabinet Satisfaction & Political Friction Index based on ideological spread & seat quota fairness
  let totalIdeologyGap = 0;
  let pairCount = 0;
  for (let i = 0; i < sortedCoalition.length; i++) {
    const p = sortedCoalition[i];
    const expectedShare = p.totalSeats / totalCoalitionSeats;
    const actualShare = p.allocatedMinistries.length / state.ministries.length;
    p.cabinetSatisfaction = clamp(Math.round(75 + (actualShare - expectedShare) * 180), 25, 98);

    for (let j = i + 1; j < sortedCoalition.length; j++) {
      const compat = calculateCoalitionCompatibility(p, sortedCoalition[j]);
      totalIdeologyGap += compat.ideologicalDistance;
      pairCount++;
    }
  }

  const avgDistance = pairCount > 0 ? totalIdeologyGap / pairCount : 15;
  const majorityMargin = totalCoalitionSeats - Math.floor(state.constitution.totalSeats / 2);

  state.politicalFrictionIndex = clamp(Math.round(avgDistance * 0.65 + sortedCoalition.length * 3), 10, 92);
  state.governmentStability = clamp(
    Math.round(58 + Math.min(28, majorityMargin * 0.4) - state.politicalFrictionIndex * 0.35),
    15,
    95
  );

  assertAndRepairDataIntegrity(state);
}

export function updatePlayerParliamentaryRole(state: GameState): void {
  const playerParty = state.parties.find((p) => p.id === state.player.partyId);

  if (state.player.legalDisqualified) {
    state.player.role = PlayerRole.CITIZEN;
    return;
  }

  if (state.primeMinisterName === state.player.name) {
    state.player.role = PlayerRole.PRIME_MINISTER;
    return;
  }

  if (state.ministries.some((m) => m.isPlayerMinister)) {
    state.player.role = PlayerRole.MINISTER;
    return;
  }

  if (playerParty && state.player.isPartyLeader) {
    // Check if leader of largest opposition party with MPs
    const largestOpp = [...state.parties]
      .filter((p) => !p.inCoalition && p.totalSeats > 0)
      .sort((a, b) => b.totalSeats - a.totalSeats)[0];

    if (!playerParty.inCoalition && state.player.isMP && largestOpp?.id === playerParty.id) {
      state.player.role = PlayerRole.OPPOSITION_LEADER;
    } else {
      state.player.role = PlayerRole.PARTY_LEADER;
    }
    return;
  }

  if (state.player.isMP && playerParty) {
    state.player.role = playerParty.inCoalition ? PlayerRole.MP_GOVERNMENT : PlayerRole.MP_OPPOSITION;
    return;
  }

  if (state.player.role === PlayerRole.MP_CANDIDATE) {
    return;
  }

  if (state.player.partyId && state.player.role === PlayerRole.CITIZEN) {
    state.player.role = PlayerRole.PARTY_MEMBER;
  }
}

/**
 * LAYER 02: Full 4-Stage General Election Engine
 * Separately calculates 400 Constituency Seats across 6 Regions and 100 Party-List Seats
 * via Hare Quota + Largest Remainder across all 57 Political Parties, then certifies via ECT.
 */
export function runGeneralElection(state: GameState): ElectionResultRecord {
  const dateLabel = formatThaiDate(state.monthIndex, state.yearBE);
  const cTotal = state.constitution.constituencySeats;
  const plTotal = state.constitution.partyListSeats;

  const turnoutPct = Number((71.5 + (state.economy.consumerConfidence - 50) * 0.12).toFixed(1));
  const invalidBallotsPct = 2.6;
  const totalEligibleVoters = 52400000;
  const totalValidPartyListVotes = Math.round(
    totalEligibleVoters * (turnoutPct / 100) * (1 - invalidBallotsPct / 100)
  );

  // Reset seats
  state.parties.forEach((p) => {
    p.constituencySeats = 0;
    p.partyListSeats = 0;
    p.totalSeats = 0;
  });

  // 1. Boost player's party slightly based on player's personal approval & campaign work
  const playerParty = state.parties.find((p) => p.id === state.player.partyId);
  if (playerParty && state.player.personalApproval > 30) {
    playerParty.nationalPopularity = Number(
      Math.min(48, playerParty.nationalPopularity + (state.player.personalApproval - 30) * 0.08).toFixed(2)
    );
  }

  // 2. Calculate National Party-List Votes & 100 Party-List Seats (Hare Quota + Largest Remainder)
  const rawWeights = state.parties.map((p) => {
    const govPenaltyOrBonus = p.inCoalition ? (state.economy.consumerConfidence - 52) * 0.06 : 0.25;
    const w = Math.max(0.03, p.nationalPopularity + govPenaltyOrBonus);
    return { party: p, weight: w };
  });
  const sumWeights = rawWeights.reduce((acc, item) => acc + item.weight, 0);

  const partyVoteMap: Record<string, number> = {};
  rawWeights.forEach(({ party, weight }) => {
    partyVoteMap[party.id] = Math.round((weight / sumWeights) * totalValidPartyListVotes);
  });

  const quotaPerSeat = Math.max(1, Math.floor(totalValidPartyListVotes / plTotal));
  let assignedPL = 0;
  const remainders: { party: PoliticalParty; rem: number }[] = [];

  for (const p of state.parties) {
    const votes = partyVoteMap[p.id] || 0;
    const wholeSeats = Math.floor(votes / quotaPerSeat);
    p.partyListSeats = wholeSeats;
    assignedPL += wholeSeats;
    remainders.push({ party: p, rem: votes % quotaPerSeat });
  }

  remainders.sort((a, b) => b.rem - a.rem);
  let remIdx = 0;
  while (assignedPL < plTotal && remIdx < remainders.length) {
    remainders[remIdx].party.partyListSeats += 1;
    assignedPL += 1;
    remIdx += 1;
  }

  // 3. Calculate 400 Constituency Seats Region-by-Region across the 6 Thai Regions
  for (const region of state.regions) {
    const rSeats = region.constituencySeats;
    const regionalScores = state.parties.map((p) => {
      const regMult = p.regionalStrength[region.id] || 0.5;
      const homeBonus =
        state.player.partyId === p.id && state.player.homeRegion === region.id
          ? 1 + state.player.personalApproval / 180
          : 1;
      // Constituency elections favor major ground-network parties exponentially
      const networkPower = p.isMajor ? Math.pow(p.nationalPopularity * regMult * homeBonus, 1.32) : p.nationalPopularity * regMult * 0.35;
      return { party: p, score: Math.max(0.001, networkPower) };
    });

    const totalRegScore = regionalScores.reduce((s, x) => s + x.score, 0);
    let rAssigned = 0;
    const regRem: { party: PoliticalParty; rem: number }[] = [];

    for (const item of regionalScores) {
      const exact = (item.score / totalRegScore) * rSeats;
      const whole = Math.floor(exact);
      item.party.constituencySeats += whole;
      rAssigned += whole;
      regRem.push({ party: item.party, rem: exact - whole });
    }

    regRem.sort((a, b) => b.rem - a.rem);
    let idx = 0;
    while (rAssigned < rSeats && idx < regRem.length) {
      regRem[idx].party.constituencySeats += 1;
      rAssigned += 1;
      idx += 1;
    }

    // Update dominant party in this region
    const topInRegion = [...regionalScores].sort((a, b) => b.score - a.score)[0];
    if (topInRegion) {
      region.dominantPartyId = topInRegion.party.id;
    }
  }

  // Sum totals
  state.parties.forEach((p) => {
    p.totalSeats = p.constituencySeats + p.partyListSeats;
  });

  // 4. Evaluate Player's Own Election Outcome if Candidate or Sitting MP/Leader
  if (
    playerParty &&
    !state.player.legalDisqualified &&
    (state.player.role === PlayerRole.MP_CANDIDATE || state.player.isMP || state.player.isPartyLeader)
  ) {
    const elig = checkRoleEligibility(
      state.player,
      state.constitution,
      'MP_CANDIDATE',
      state.dayTick,
      state.isDissolutionElection
    );

    const winThreshold = playerParty.totalSeats >= 8 ? 28 : 48;
    const playerScore =
      state.player.personalApproval * 0.55 +
      state.player.socialReputation * 0.25 +
      playerParty.nationalPopularity * 0.8;

    if (elig.valid && playerParty.totalSeats > 0 && playerScore >= winThreshold) {
      ensureAchievementFields(state);
      state.careerStats.electionsWonCount += 1;
      state.player.isMP = true;
      state.player.mpType = state.player.isPartyLeader ? 'PARTY_LIST' : 'CONSTITUENCY';
      state.player.politicalExperience = clamp(state.player.politicalExperience + 10, 0, 100);
      state.auditLog.unshift(
        createAuditEntry(
          state,
          PoliticalLayer.POWER,
          'คณะกรรมการการเลือกตั้ง (กกต.)',
          `รับรองผลการเลือกตั้งให้ ${state.player.name} เป็นสมาชิกสภาผู้แทนราษฎร (${playerParty.shortName})`,
          'รัฐธรรมนูญ มาตรา 85 และ พ.ร.ป. ว่าด้วยการเลือกตั้ง ส.ส.',
          `ชนะเลือกตั้งเข้าสู่สภาชุดใหม่ที่มีสมาชิกครบ ${state.constitution.totalSeats} คน`
        )
      );
    } else {
      // Lost election -> Return cleanly to Party Member / Citizen life without Game Over!
      state.player.isMP = false;
      state.player.mpType = 'NONE';
      state.player.assignedMinistryId = null;
      state.player.role = state.player.isPartyLeader
        ? PlayerRole.PARTY_LEADER
        : state.player.partyId
        ? PlayerRole.PARTY_MEMBER
        : PlayerRole.CITIZEN;

      state.auditLog.unshift(
        createAuditEntry(
          state,
          PoliticalLayer.POWER,
          'คณะกรรมการการเลือกตั้ง (กกต.)',
          `${state.player.name} ไม่ได้รับเลือกตั้งในรอบนี้`,
          'พ.ร.ป. ว่าด้วยการเลือกตั้ง ส.ส.',
          'กลับสู่บทบาทสมาชิกพรรค/ประชาชน เพื่อสะสมฐานเสียงใหม่ในรอบหน้า'
        )
      );
    }
  }

  // 5. Form New Coalition (Target >= 251 / 500 majority)
  formDefaultCoalitionAfterElection(state);

  state.parliamentStatus = 'ACTIVE';
  state.isDissolutionElection = false;
  state.monthsUntilElection = state.constitution.termLengthMonths;

  const electionNumber = (state.lastElectionResult?.electionNumber || 0) + 1;
  const record: ElectionResultRecord = {
    electionNumber,
    tick: state.dayTick,
    dateLabel,
    turnoutPct,
    invalidBallotsPct,
    certifiedByECT: true,
    quotaPerPartyListSeat: quotaPerSeat,
    totalValidPartyListVotes,
    partyBreakdowns: [...state.parties]
      .sort((a, b) => b.totalSeats - a.totalSeats)
      .map((p) => ({
        partyId: p.id,
        partyName: p.name,
        partyListVotes: partyVoteMap[p.id] || 0,
        constituencySeats: p.constituencySeats,
        partyListSeats: p.partyListSeats,
        totalSeats: p.totalSeats,
      })),
  };

  state.lastElectionResult = record;

  const winner = record.partyBreakdowns[0];
  state.newsFeed.unshift({
    id: `NWS_ELECTION_${electionNumber}_${state.dayTick}`,
    eventId: `ELECTION_${electionNumber}`,
    tick: state.dayTick,
    dateLabel,
    category: 'การเมือง',
    headline: `กกต. รับรองผลเลือกตั้งทั่วไป: ${winner.partyName} คว้าอันดับหนึ่ง ${winner.totalSeats} ที่นั่ง`,
    summary: `ผู้มาใช้สิทธิร้อยละ ${turnoutPct} จัดสรร ส.ส. เขต ${cTotal} คน และบัญชีรายชื่อ ${plTotal} คน โได้รัฐบาลผสม ${state.coalitionSeatCount} เสียง นายกรัฐมนตรีคือ ${state.primeMinisterName}`,
    factStatus: FactCheckStatus.VERIFIED_FACT,
    sourceName: 'สำนักงานคณะกรรมการการเลือกตั้ง',
  });

  return record;
}

export function formDefaultCoalitionAfterElection(state: GameState): void {
  const majorityTarget = Math.floor(state.constitution.totalSeats / 2) + 1; // 251
  const parliamentaryParties = [...state.parties]
    .filter((p) => p.totalSeats > 0)
    .sort((a, b) => b.totalSeats - a.totalSeats);

  if (parliamentaryParties.length === 0) return;

  // Try forming coalition led by #1 party; if #1 has high ideological distance with medium parties (<251), #2 forms pragmatic coalition!
  const firstParty = parliamentaryParties[0];
  const firstCoalition: PoliticalParty[] = [firstParty];
  let firstSeats = firstParty.totalSeats;

  const candidatesForFirst = parliamentaryParties
    .slice(1)
    .map((p) => ({ party: p, compat: calculateCoalitionCompatibility(firstParty, p) }))
    .sort((a, b) => b.compat.willingnessScore - a.compat.willingnessScore);

  for (const item of candidatesForFirst) {
    if (firstSeats >= majorityTarget + 25) break;
    if (item.compat.willingnessScore >= 52) {
      firstCoalition.push(item.party);
      firstSeats += item.party.totalSeats;
    }
  }

  if (firstSeats >= majorityTarget || parliamentaryParties.length < 2) {
    allocateCabinetMinistries(
      state,
      firstCoalition.map((p) => p.id)
    );
  } else {
    // Second party attempts pragmatic broad coalition
    const secondParty = parliamentaryParties[1];
    const secondCoalition: PoliticalParty[] = [secondParty];
    let secondSeats = secondParty.totalSeats;

    const candidatesForSecond = parliamentaryParties
      .filter((p) => p.id !== secondParty.id)
      .map((p) => ({ party: p, compat: calculateCoalitionCompatibility(secondParty, p) }))
      .sort((a, b) => b.compat.willingnessScore - a.compat.willingnessScore);

    for (const item of candidatesForSecond) {
      if (secondSeats >= majorityTarget + 35) break;
      if (item.compat.willingnessScore >= 44) {
        secondCoalition.push(item.party);
        secondSeats += item.party.totalSeats;
      }
    }

    const chosen = secondSeats >= firstSeats ? secondCoalition : firstCoalition;
    allocateCabinetMinistries(
      state,
      chosen.map((p) => p.id)
    );
  }
}

/**
 * Opposition No-Confidence Debate & Vote (การอภิปรายไม่ไว้วางใจตามมาตรา 151)
 */
export function executeNoConfidenceVote(state: GameState): {
  passedAgainstPM: boolean;
  noConfidenceVotes: number;
  confidenceVotes: number;
  summary: string;
} {
  const majorityThreshold = Math.floor(state.constitution.totalSeats / 2) + 1; // 251 votes needed to oust PM
  let noConfidenceVotes = state.oppositionSeatCount;

  // Coalition defections if friction is high or government stability is low!
  const coalitionParties = state.parties.filter((p) => p.inCoalition && p.id !== state.primeMinisterPartyId);
  for (const cp of coalitionParties) {
    if (state.politicalFrictionIndex > 68 || cp.cabinetSatisfaction < 45) {
      const defectRatio = state.politicalFrictionIndex > 78 ? 0.65 : 0.25;
      const defectors = Math.round(cp.totalSeats * defectRatio);
      noConfidenceVotes += defectors;
    }
  }

  const confidenceVotes = Math.max(0, state.constitution.totalSeats - noConfidenceVotes - 8);
  const passedAgainstPM = noConfidenceVotes >= majorityThreshold;
  const dateLabel = formatThaiDate(state.monthIndex, state.yearBE);

  if (passedAgainstPM) {
    const oldPM = state.primeMinisterName;
    // Flip coalition! Largest opposition party leads new coalition talks
    const largestOpp = [...state.parties]
      .filter((p) => !p.inCoalition && p.totalSeats > 0)
      .sort((a, b) => b.totalSeats - a.totalSeats)[0];

    if (largestOpp) {
      const partners = [...state.parties]
        .filter((p) => p.id !== largestOpp.id && p.id !== state.primeMinisterPartyId && p.totalSeats > 0)
        .sort(
          (a, b) =>
            calculateCoalitionCompatibility(largestOpp, b).willingnessScore -
            calculateCoalitionCompatibility(largestOpp, a).willingnessScore
        );

      const newCoalitionIds = [largestOpp.id];
      let seats = largestOpp.totalSeats;
      for (const pt of partners) {
        if (seats >= majorityThreshold + 20) break;
        newCoalitionIds.push(pt.id);
        seats += pt.totalSeats;
      }
      allocateCabinetMinistries(state, newCoalitionIds);
    }

    const summary = `มติไม่ไว้วางใจผ่านเกณฑ์ ${noConfidenceVotes} ต่อ ${confidenceVotes} เสียง! ${oldPM} พ้นจากตำแหน่ง และจัดตั้งรัฐบาลชุดใหม่โดยมี ${state.primeMinisterName} เป็นนายกรัฐมนตรี`;
    state.auditLog.unshift(
      createAuditEntry(
        state,
        PoliticalLayer.POWER,
        'สภาผู้แทนราษฎร',
        'ลงมติไม่ไว้วางใจนายกรัฐมนตรีสำเร็จตามรัฐธรรมนูญ มาตรา 151',
        'รัฐธรรมนูญ มาตรา 151 และ 167 (ความเป็นรัฐมนตรีสิ้นสุดลง)',
        summary
      )
    );
    state.newsFeed.unshift({
      id: `NWS_CENSURE_PASS_${state.dayTick}`,
      eventId: `CENSURE_${state.turn}`,
      tick: state.dayTick,
      dateLabel,
      category: 'รัฐสภา',
      headline: `แผ่นดินไหวสภา! มติไม่ไว้วางใจ ${noConfidenceVotes} เสียง ล้มรัฐบาล เปลี่ยนขั้วตั้ง ครม. ใหม่`,
      summary,
      factStatus: FactCheckStatus.VERIFIED_FACT,
      sourceName: 'สำนักข่าวรัฐสภา',
    });

    return { passedAgainstPM: true, noConfidenceVotes, confidenceVotes, summary };
  } else {
    state.governmentStability = clamp(state.governmentStability - 6, 10, 95);
    state.politicalFrictionIndex = clamp(state.politicalFrictionIndex + 5, 10, 95);
    const summary = `รัฐบาลรอดศึกซักฟอก (ไว้วางใจ ${confidenceVotes} เสียง · ไม่ไว้วางใจ ${noConfidenceVotes} เสียง) แต่เสถียรภาพรัฐบาลลดลงและต้องเร่งปรับผลงาน`;
    state.auditLog.unshift(
      createAuditEntry(
        state,
        PoliticalLayer.POWER,
        'สภาผู้แทนราษฎร',
        'ลงมติญัตติอภิปรายไม่ไว้วางใจ',
        'รัฐธรรมนูญ มาตรา 151',
        summary
      )
    );
    state.newsFeed.unshift({
      id: `NWS_CENSURE_SURVIVE_${state.dayTick}`,
      eventId: `CENSURE_${state.turn}`,
      tick: state.dayTick,
      dateLabel,
      category: 'รัฐสภา',
      headline: `นายกฯ ผ่านศึกอภิปรายไม่ไว้วางใจ ${confidenceVotes} ต่อ ${noConfidenceVotes} เสียง ฝ่ายค้านชี้แผลงบประมาณ`,
      summary,
      factStatus: FactCheckStatus.VERIFIED_FACT,
      sourceName: 'สำนักข่าวการเมือง',
    });
    return { passedAgainstPM: false, noConfidenceVotes, confidenceVotes, summary };
  }
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
