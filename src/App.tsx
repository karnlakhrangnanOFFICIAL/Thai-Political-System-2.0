/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Info } from 'lucide-react';
import {
  AchievementUnlockBanner,
  CareerAchievementsModal,
} from './components/CareerAchievements';
import { ElectionAndPartiesView } from './components/ElectionAndPartiesView';
import {
  CoalitionNegotiationModal,
  ConstitutionModal,
  NarrativeModal,
  SaveManagerModal,
} from './components/GameModals';
import { GovernmentAndEconomyView } from './components/GovernmentAndEconomyView';
import { NewsAndAuditView } from './components/NewsAndAuditView';
import { ParliamentAndLawView } from './components/ParliamentAndLawView';
import { PolicyCardTray } from './components/PolicyCardTray';
import { StrategicBoardView } from './components/StrategicBoardView';
import { TitleAndSetupScreen } from './components/TitleAndSetupScreen';
import { TopNavAndToolbar } from './components/TopNavAndToolbar';
import { WeeklySummaryModal } from './components/WeeklySummaryModal';
import {
  AchievementDefinition,
  ensureAchievementFields,
  evaluateAndUnlockAchievements,
  syncGlobalUnlockedAchievements,
} from './engines/achievementEngine';
import {
  advanceWeeklyTurn,
  CharacterInitOptions,
  createInitialGameState,
  drawHandForPlayer,
  playPolicyCard,
  resolveNarrativeChoice,
} from './engines/governanceEngine';
import { createAuditEntry } from './engines/legalEngine';
import { allocateCabinetMinistries } from './engines/politicalEngine';
import {
  ActiveBoardTab,
  FactCheckStatus,
  GameScreenState,
  GameState,
  NarrativeChoice,
  PoliticalLayer,
  RegionId,
  SaveSlotMetadata,
} from './types/game';
import { soundFX } from './utils/audio';
import {
  deleteSaveSlot,
  formatThaiDate,
  listSaveSlots,
  loadGameFromSlot,
  saveGameToSlot,
} from './utils/storage';

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [saveSlots, setSaveSlots] = useState<SaveSlotMetadata[]>(() => listSaveSlots());
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const [isCoalitionModalOpen, setIsCoalitionModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isConstitutionModalOpen, setIsConstitutionModalOpen] = useState(false);
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
  const [isWeeklySummaryOpen, setIsWeeklySummaryOpen] = useState(false);
  const [recentUnlocks, setRecentUnlocks] = useState<AchievementDefinition[]>([]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (recentUnlocks.length === 0) return;
    const timer = setTimeout(() => setRecentUnlocks([]), 8500);
    return () => clearTimeout(timer);
  }, [recentUnlocks]);

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
  };

  const applyAchievementsCheck = (state: GameState) => {
    const newlyUnlocked = evaluateAndUnlockAchievements(state);
    if (newlyUnlocked.length > 0) {
      soundFX.playAchievementUnlock(state.soundEnabled);
      setRecentUnlocks(newlyUnlocked);
    }
  };

  const handleStartNewGame = (opts: CharacterInitOptions) => {
    const initial = createInitialGameState(opts);
    evaluateAndUnlockAchievements(initial);
    setRecentUnlocks([]);
    setGameState(initial);
    const updatedSlots = saveGameToSlot('autosave', 'เซฟอัตโนมัติ (ล่าสุด)', initial);
    setSaveSlots(updatedSlots);
    soundFX.playTurnAdvance(initial.soundEnabled);
    showToast(`ยินดีต้อนรับคุณ ${initial.player.name} เข้าสู่กระดานชีวิตและการเมืองไทย 2.0`);
  };

  const handleSelectTab = (tab: ActiveBoardTab) => {
    setGameState((prev) => (prev ? { ...prev, activeTab: tab } : prev));
  };

  const handleSelectRegion = (regionId: RegionId) => {
    setGameState((prev) => (prev ? { ...prev, selectedRegionId: regionId } : prev));
  };

  const handlePlayCard = (cardId: string) => {
    if (!gameState) return;
    const result = playPolicyCard(gameState, cardId);
    if (!result.success) {
      soundFX.playDenied(gameState.soundEnabled);
      showToast(result.message, true);
      return;
    }
    applyAchievementsCheck(result.nextState);
    if (result.nextState.activeNarrativeEvent?.id.startsWith('EVT_PUBLIC_INVESTIGATION_')) {
      soundFX.playScandalAlert(result.nextState.soundEnabled);
    } else {
      soundFX.playCardPlay(result.nextState.soundEnabled);
    }
    setGameState(result.nextState);
    if (result.openCoalitionModal) {
      setIsCoalitionModalOpen(true);
    }
    const updatedSlots = saveGameToSlot('autosave', 'เซฟอัตโนมัติ (ล่าสุด)', result.nextState);
    setSaveSlots(updatedSlots);
    showToast(
      result.message,
      Boolean(result.nextState.activeNarrativeEvent?.id.startsWith('EVT_PUBLIC_INVESTIGATION_'))
    );
  };

  const handleRedrawHand = () => {
    if (!gameState || gameState.actionPoints < 1) return;
    const next: GameState = structuredClone(gameState);
    next.actionPoints -= 1;
    next.handCardIds = drawHandForPlayer(next);
    soundFX.playCardPlay(next.soundEnabled);
    setGameState(next);
    showToast('จั่วชุดการ์ดนโยบายใหม่เรียบร้อยแล้ว (-1 AP)');
  };

  const handleAdvanceTurn = () => {
    if (!gameState) return;
    const next = advanceWeeklyTurn(gameState);
    applyAchievementsCheck(next);
    if (next.activeNarrativeEvent?.id.startsWith('EVT_PUBLIC_INVESTIGATION_')) {
      soundFX.playScandalAlert(next.soundEnabled);
    } else {
      soundFX.playTurnAdvance(next.soundEnabled);
    }

    // Trigger monthly summary if rollover occurred (week reset to 1)
    if (next.weekInMonth === 1 && gameState.weekInMonth === 4) {
      setIsWeeklySummaryOpen(true);
    }

    setGameState(next);
    const updatedSlots = saveGameToSlot('autosave', 'เซฟอัตโนมัติ (ล่าสุด)', next);
    setSaveSlots(updatedSlots);
    
    const weekLabel = `สัปดาห์ที่ ${next.weekInMonth}`;
    showToast(`เข้าสู่${weekLabel} เดือน${formatThaiDate(next.monthIndex, next.yearBE)} (เทิร์นที่ ${next.turn}) · เซฟอัตโนมัติสำเร็จ`);
  };

  const handleNarrativeChoice = (choice: NarrativeChoice) => {
    if (!gameState) return;
    const res = resolveNarrativeChoice(gameState, choice);
    applyAchievementsCheck(res.nextState);
    soundFX.playGavel(res.nextState.soundEnabled);
    setGameState(res.nextState);
    const updatedSlots = saveGameToSlot('autosave', 'เซฟอัตโนมัติ (ล่าสุด)', res.nextState);
    setSaveSlots(updatedSlots);
    showToast(res.message);
  };

  const handleConfirmCoalition = (partyIds: string[]) => {
    if (!gameState) return;
    const next: GameState = structuredClone(gameState);
    ensureAchievementFields(next);
    next.careerStats.coalitionsFormedCount += 1;
    allocateCabinetMinistries(next, partyIds);
    next.auditLog.unshift(
      createAuditEntry(
        next,
        PoliticalLayer.POWER,
        next.player.name,
        `เจรจาจัดตั้งรัฐบาลผสมชุดใหม่สำเร็จ (${next.coalitionSeatCount}/${next.constitution.totalSeats} เสียง)`,
        'รัฐธรรมนูญ มาตรา 158 และ 159',
        `นายกรัฐมนตรีคือ ${next.primeMinisterName} พร้อมจัดสรรโควตา 18 กระทรวง`
      )
    );
    next.newsFeed.unshift({
      id: `NWS_COALITION_DEAL_${next.dayTick}`,
      eventId: `COALITION_DEAL_${next.turn}`,
      tick: next.dayTick,
      dateLabel: formatThaiDate(next.monthIndex, next.yearBE),
      category: 'การเมือง',
      headline: `แถลงจัดตั้งรัฐบาลใหม่รวม ${next.coalitionSeatCount} เสียง ชู ${next.primeMinisterName} นำฝ่ายบริหาร`,
      summary: `แบ่งความรับผิดชอบครบ 18 กระทรวง ดัชนีเสถียรภาพรัฐบาลอยู่ที่ ${next.governmentStability}%`,
      factStatus: FactCheckStatus.VERIFIED_FACT,
      sourceName: 'ทำเนียบรัฐบาลและรัฐสภา',
    });

    applyAchievementsCheck(next);
    soundFX.playGavel(next.soundEnabled);
    setIsCoalitionModalOpen(false);
    setGameState(next);
    const updatedSlots = saveGameToSlot('autosave', 'เซฟอัตโนมัติ (ล่าสุด)', next);
    setSaveSlots(updatedSlots);
    showToast(`จัดตั้งรัฐบาลชุดใหม่สำเร็จ (${next.coalitionSeatCount} เสียง)`);
  };

  const handleAdjustMinistryBudget = (ministryId: string, deltaPct: number) => {
    if (!gameState) return;
    const next: GameState = structuredClone(gameState);
    ensureAchievementFields(next);
    const target = next.ministries.find((m) => m.id === ministryId);
    // Counter-balance against Ministry of Finance (or largest other ministry) to strictly maintain 100.0% statutory budget cap
    const balancer = next.ministries.find(
      (m) => m.id !== ministryId && m.budgetSharePct - deltaPct >= 1.0
    );

    if (!target || !balancer || target.budgetSharePct + deltaPct < 0.8) {
      showToast('ไม่สามารถปรับเกินเพดานวงเงินงบประมาณรวมตามกฎหมายได้', true);
      return;
    }

    target.budgetSharePct = Number((target.budgetSharePct + deltaPct).toFixed(1));
    balancer.budgetSharePct = Number((balancer.budgetSharePct - deltaPct).toFixed(1));
    next.careerStats.budgetAdjustmentsCount += 1;

    next.ministries.forEach((m) => {
      m.allocatedMillion = Math.round(
        (m.budgetSharePct / 100) * next.stateFinances.annualBudgetTotalMillion
      );
    });

    if (target.category === 'SOCIAL' && deltaPct > 0) {
      next.economy.qualityOfLifeIndex = Math.min(98, next.economy.qualityOfLifeIndex + 1);
    } else if ((target.category === 'INFRASTRUCTURE' || target.category === 'ECONOMIC') && deltaPct > 0) {
      next.economy.gdpGrowthPct = Number((next.economy.gdpGrowthPct + 0.05).toFixed(2));
    }

    next.auditLog.unshift(
      createAuditEntry(
        next,
        PoliticalLayer.GOVERNANCE,
        next.player.name,
        `ปรับเกลี่ยงบประมาณ ${target.shortName} (${deltaPct > 0 ? `+${deltaPct}%` : `${deltaPct}%`})`,
        'พ.ร.บ. วิธีการงบประมาณ พ.ศ. 2561 (ไม่เกินวงเงินงบประมาณประจำปี)',
        `วงเงิน ${target.shortName} ปรับเป็น ${target.allocatedMillion.toLocaleString()} ล้านบาท`
      )
    );

    applyAchievementsCheck(next);
    setGameState(next);
    showToast(`ปรับสัดส่วนงบ ${target.shortName} เป็น ${target.budgetSharePct.toFixed(1)}% สำเร็จ`);
  };

  const handleSelectPartyForAction = (partyId: string) => {
    if (!gameState) return;
    const party = gameState.parties.find((p) => p.id === partyId);
    setGameState({ ...gameState, selectedPartyIdForAction: partyId });
    if (party) {
      showToast(`เลือก "${party.name}" เป็นพรรคเป้าหมายแล้ว (ใช้การ์ดสมัครสมาชิกพรรคด้านล่างเพื่อเข้าสังกัด)`);
    }
  };

  const handleDonatePersonalToParty = (partyId: string) => {
    if (!gameState || gameState.player.finances.cash < 10000) return;
    const next: GameState = structuredClone(gameState);
    const party = next.parties.find((p) => p.id === partyId);
    if (!party) return;

    next.player.finances.cash -= 10000;
    party.partyFundsMillion = Number((party.partyFundsMillion + 0.01).toFixed(2));
    party.trustWithPlayer = Math.min(100, party.trustWithPlayer + 6);
    next.player.networkStrength = Math.min(100, next.player.networkStrength + 2);

    next.auditLog.unshift(
      createAuditEntry(
        next,
        PoliticalLayer.POWER,
        next.player.name,
        `บริจาคเงินส่วนตัว 10,000 บาท ให้แก่ ${party.name}`,
        'พ.ร.ป. ว่าด้วยพรรคการเมือง มาตรา 66 (การบริจาคเงินให้พรรคการเมืองอย่างเปิดเผย)',
        `เพิ่มความไว้วางใจจากแกนนำพรรคเป็น ${party.trustWithPlayer}/100`
      )
    );

    applyAchievementsCheck(next);
    soundFX.playCardPlay(next.soundEnabled);
    setGameState(next);
    showToast(`บริจาคเงินส่วนตัว 10,000 ฿ สนับสนุน "${party.name}" ตามระเบียบ กกต. เรียบร้อย`);
  };

  const handleSaveToSlot = (slotId: string, slotName: string) => {
    if (!gameState) return;
    const updated = saveGameToSlot(slotId, slotName, gameState);
    setSaveSlots(updated);
    showToast(`บันทึกเกมลงสล็อต "${slotName}" เรียบร้อยแล้ว`);
  };

  const handleLoadSlot = (slotId: string) => {
    const loaded = loadGameFromSlot(slotId);
    if (!loaded) {
      showToast('ไม่พบข้อมูลสล็อตเซฟที่ต้องการโหลด', true);
      return;
    }
    ensureAchievementFields(loaded);
    evaluateAndUnlockAchievements(loaded);
    syncGlobalUnlockedAchievements(loaded.player.name, loaded.unlockedAchievements);
    loaded.screen = GameScreenState.PLAYING;
    setRecentUnlocks([]);
    setGameState(loaded);
    setIsSaveModalOpen(false);
    showToast(`โหลดข้อมูลของ ${loaded.player.name} (เทิร์น ${loaded.turn}) สำเร็จ`);
  };

  const handleDeleteSlot = (slotId: string) => {
    const updated = deleteSaveSlot(slotId);
    setSaveSlots(updated);
    showToast('ลบสล็อตบันทึกเกมแล้ว');
  };

  const handleExportJSON = () => {
    if (!gameState) return;
    const blob = new Blob([JSON.stringify(gameState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kkp-politic2-turn${gameState.turn}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('ส่งออกไฟล์เซฟ JSON สำเร็จ');
  };

  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as GameState;
        if (parsed && parsed.player && Array.isArray(parsed.parties)) {
          ensureAchievementFields(parsed);
          evaluateAndUnlockAchievements(parsed);
          syncGlobalUnlockedAchievements(parsed.player.name, parsed.unlockedAchievements);
          parsed.screen = GameScreenState.PLAYING;
          setRecentUnlocks([]);
          setGameState(parsed);
          const updated = saveGameToSlot('imported_slot', `นำเข้า: ${parsed.player.name}`, parsed);
          setSaveSlots(updated);
          setIsSaveModalOpen(false);
          showToast('นำเข้าไฟล์เซฟ JSON สำเร็จ');
        } else {
          showToast('โครงสร้างไฟล์ JSON ไม่ถูกต้อง', true);
        }
      } catch {
        showToast('ไม่สามารถอ่านไฟล์ JSON ได้', true);
      }
    };
    reader.readAsText(file);
  };

  if (!gameState || gameState.screen === GameScreenState.TITLE_MENU) {
    return (
      <>
        <TitleAndSetupScreen
          saveSlots={saveSlots}
          onStartNewGame={handleStartNewGame}
          onLoadSlot={handleLoadSlot}
          onDeleteSlot={handleDeleteSlot}
          onOpenAchievementsModal={() => setIsAchievementsModalOpen(true)}
        />
        <CareerAchievementsModal
          isOpen={isAchievementsModalOpen}
          state={null}
          onClose={() => setIsAchievementsModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div id="top" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-16 md:pb-0">
      <TopNavAndToolbar
        state={gameState}
        onSelectTab={handleSelectTab}
        onAdvanceTurn={handleAdvanceTurn}
        onOpenSaveModal={() => setIsSaveModalOpen(true)}
        onOpenConstitutionModal={() => setIsConstitutionModalOpen(true)}
        onOpenAchievementsModal={() => setIsAchievementsModalOpen(true)}
        onToggleSound={() =>
          setGameState((prev) => (prev ? { ...prev, soundEnabled: !prev.soundEnabled } : prev))
        }
        onReturnToTitle={() =>
          setGameState((prev) => (prev ? { ...prev, screen: GameScreenState.TITLE_MENU } : prev))
        }
      />

      {/* Celebratory Achievement Unlock Banner */}
      <AchievementUnlockBanner
        achievements={recentUnlocks}
        onDismiss={() => setRecentUnlocks([])}
        onInspectAll={() => setIsAchievementsModalOpen(true)}
      />

      {/* Action Feedback Banner */}
      {toastMessage && (
        <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 pt-3 sm:pt-4">
          <div
            className={`px-3.5 sm:px-4 py-2.5 rounded-lg border text-xs font-medium flex items-start sm:items-center gap-2 ${
              toastMessage.isError
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            {toastMessage.isError ? (
              <Info className="w-4 h-4 shrink-0 text-amber-700 mt-0.5 sm:mt-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-700 mt-0.5 sm:mt-0" />
            )}
            <span className="leading-relaxed">{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Board Canvas + Card Tray */}
      <main className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6 flex-1">
        {gameState.activeTab === ActiveBoardTab.STRATEGIC_MAP && (
          <StrategicBoardView
            state={gameState}
            onSelectRegion={handleSelectRegion}
            onJumpToTab={handleSelectTab}
            onOpenAchievementsModal={() => setIsAchievementsModalOpen(true)}
          />
        )}

        {gameState.activeTab === ActiveBoardTab.PARLIAMENT_LAW && (
          <ParliamentAndLawView
            state={gameState}
            onOpenCoalitionModal={() => setIsCoalitionModalOpen(true)}
          />
        )}

        {gameState.activeTab === ActiveBoardTab.CABINET_ECONOMY && (
          <GovernmentAndEconomyView
            state={gameState}
            onAdjustMinistryBudget={handleAdjustMinistryBudget}
          />
        )}

        {gameState.activeTab === ActiveBoardTab.ELECTION_PARTIES && (
          <ElectionAndPartiesView
            state={gameState}
            onSelectPartyForAction={handleSelectPartyForAction}
            onDonatePersonalToParty={handleDonatePersonalToParty}
          />
        )}

        {gameState.activeTab === ActiveBoardTab.NEWS_AUDIT && (
          <NewsAndAuditView state={gameState} />
        )}

        {/* Persistent Turn-Based Policy & Action Card Hand */}
        <PolicyCardTray
          state={gameState}
          onPlayCard={handlePlayCard}
          onRedrawHand={handleRedrawHand}
        />
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <span>KKP Life Simulator – Thai Political System 2.0 · ระบบจำลองการเมืองไทย 3 ชั้น</span>
          <span>กฎหมายกำหนดขอบเขตอำนาจ · การเมืองกำหนดการต่อรอง · การบริหารกำหนดผลลัพธ์ประเทศ</span>
        </div>
      </footer>

      {/* Modals */}
      <NarrativeModal state={gameState} onSelectChoice={handleNarrativeChoice} />
      <CoalitionNegotiationModal
        state={gameState}
        isOpen={isCoalitionModalOpen}
        onClose={() => setIsCoalitionModalOpen(false)}
        onConfirmCoalition={handleConfirmCoalition}
      />
      <SaveManagerModal
        isOpen={isSaveModalOpen}
        slots={saveSlots}
        onClose={() => setIsSaveModalOpen(false)}
        onSaveToSlot={handleSaveToSlot}
        onLoadSlot={handleLoadSlot}
        onDeleteSlot={handleDeleteSlot}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
      />
      <ConstitutionModal
        isOpen={isConstitutionModalOpen}
        constitution={gameState.constitution}
        onClose={() => setIsConstitutionModalOpen(false)}
      />
      <CareerAchievementsModal
        isOpen={isAchievementsModalOpen}
        state={gameState}
        onClose={() => setIsAchievementsModalOpen(false)}
      />
      <WeeklySummaryModal
        isOpen={isWeeklySummaryOpen}
        state={gameState}
        onClose={() => setIsWeeklySummaryOpen(false)}
      />
    </div>
  );
}
