import React, { useState } from 'react';
import { Check, Download, Handshake, Lock, Save, Scale, Sparkles, Upload, X } from 'lucide-react';
import { calculateCoalitionCompatibility } from '../engines/politicalEngine';
import {
  ConstitutionRuleset,
  FinancialLedgerType,
  GameState,
  NarrativeChoice,
  SaveSlotMetadata,
} from '../types/game';
import { PartyLogo } from './PartyLogo';

const CATEGORY_LABELS_TH: Record<string, string> = {
  POLITICAL: 'การเมืองและรัฐสภา',
  ECONOMIC: 'เศรษฐกิจและปากท้อง',
  LEGAL: 'กฎหมายและตรวจสอบอำนาจรัฐ',
  DISASTER: 'ภัยพิบัติและภูมิภาค',
  LIFE: 'ชีวิตและสังคม',
};

function buildChoiceImpactItems(ch: NarrativeChoice): { text: string; tone: 'pos' | 'neg' | 'warn' }[] {
  const items: { text: string; tone: 'pos' | 'neg' | 'warn' }[] = [];
  const ef = ch.effects;

  if (ef.govStabilityDelta) {
    items.push({
      text: `${ef.govStabilityDelta > 0 ? `+${ef.govStabilityDelta}` : ef.govStabilityDelta}% เสถียรภาพรัฐ`,
      tone: ef.govStabilityDelta > 0 ? 'pos' : 'neg',
    });
  }
  if (ef.frictionDelta) {
    items.push({
      text: `${ef.frictionDelta > 0 ? `+${ef.frictionDelta}` : ef.frictionDelta}% ขัดแย้งพรรคร่วม`,
      tone: ef.frictionDelta < 0 ? 'pos' : 'warn',
    });
  }
  if (ef.gdpGrowthDelta) {
    items.push({
      text: `${ef.gdpGrowthDelta > 0 ? `+${ef.gdpGrowthDelta}` : ef.gdpGrowthDelta}% GDP`,
      tone: ef.gdpGrowthDelta > 0 ? 'pos' : 'neg',
    });
  }
  if (ef.targetRegionApprovalDelta) {
    items.push({
      text: `${ef.targetRegionApprovalDelta > 0 ? `+${ef.targetRegionApprovalDelta}` : ef.targetRegionApprovalDelta}% นิยมภาค`,
      tone: ef.targetRegionApprovalDelta > 0 ? 'pos' : 'neg',
    });
  }
  if (ef.targetRegionEconomyDelta) {
    items.push({
      text: `${ef.targetRegionEconomyDelta > 0 ? `+${ef.targetRegionEconomyDelta}` : ef.targetRegionEconomyDelta} เศรษฐกิจภาค`,
      tone: ef.targetRegionEconomyDelta > 0 ? 'pos' : 'neg',
    });
  }
  if (ef.targetRegionPartyStrengthDelta) {
    items.push({
      text: `+${ef.targetRegionPartyStrengthDelta.toFixed(2)}x ฐานเสียงภาค`,
      tone: 'pos',
    });
  }
  if (ef.scandalRiskDelta) {
    items.push({
      text: `${ef.scandalRiskDelta > 0 ? `+${ef.scandalRiskDelta}` : ef.scandalRiskDelta}% เสี่ยงข่าวฉาว`,
      tone: ef.scandalRiskDelta > 0 ? 'neg' : 'pos',
    });
  }
  if (ch.cost > 0) {
    items.push({
      text: `ใช้เงินส่วนตัว ${ch.cost.toLocaleString()} ฿`,
      tone: 'warn',
    });
  }
  return items;
}

/* ==================== 1. BRANCHING NARRATIVE EVENT MODAL ==================== */
interface NarrativeModalProps {
  state: GameState;
  onSelectChoice: (choice: NarrativeChoice) => void;
}

export const NarrativeModal: React.FC<NarrativeModalProps> = ({ state, onSelectChoice }) => {
  const ev = state.activeNarrativeEvent;
  if (!ev) return null;

  const isPublicInvestigation = ev.id.startsWith('EVT_PUBLIC_INVESTIGATION_');
  const isStoryChain = Boolean(ev.chainId && ev.totalEpisodes);
  const previousArcStep =
    ev.chainId && (ev.episodeNumber || 1) >= 2
      ? (state.storyArcHistory || []).find(
          (h) => h.chainId === ev.chainId && h.episodeNumber === (ev.episodeNumber || 2) - 1
        )
      : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="narrative-modal-title"
        className={`bg-white border-t sm:border rounded-t-2xl sm:rounded-xl max-w-2xl w-full max-h-[92dvh] sm:max-h-[88vh] flex flex-col p-4 sm:p-6 shadow-xl pb-safe ${
          isPublicInvestigation ? 'border-red-300' : 'border-slate-200'
        }`}
      >
        {/* Mobile Bottom-Sheet Grab Handle */}
        <div className="sm:hidden w-10 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 shrink-0" />

        <div className="overflow-y-auto flex-1 pr-0.5">
          {/* Clean Zero-Pill Kicker Line */}
          <div
            className={`text-xs font-mono tabular-nums flex flex-wrap items-center gap-x-1.5 gap-y-0.5 ${
              isPublicInvestigation ? 'text-red-700 font-semibold' : 'text-slate-500'
            }`}
          >
            {isPublicInvestigation ? (
              <span>
                การไต่สวนสาธารณะฉุกเฉิน · ความเสี่ยงข่าวฉาวแตะ 100% · เดิมพันตำแหน่งรัฐมนตรีและงบกระทรวง
              </span>
            ) : isStoryChain ? (
              <>
                <span className="font-sans font-semibold text-blue-700">
                  สายเนื้อเรื่อง: {ev.chainTitle}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-slate-800">
                  ตอนที่ {ev.episodeNumber}/{ev.totalEpisodes}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-sans">
                  {CATEGORY_LABELS_TH[ev.category] || ev.category}
                </span>
                <span aria-hidden="true">·</span>
                <span>ความเข้มข้น {ev.severity}/100</span>
              </>
            ) : (
              <span>
                เหตุการณ์สำคัญ · {CATEGORY_LABELS_TH[ev.category] || ev.category} · ระดับความรุนแรง {ev.severity}/100
              </span>
            )}
          </div>

          {/* 3-Episode Visual Progression Strip for Multi-Part Story Chains */}
          {isStoryChain && ev.totalEpisodes && ev.episodeNumber && (
            <div className="mt-2.5 grid grid-cols-3 gap-1.5" aria-label={`ความคืบหน้าสายเนื้อเรื่อง ตอนที่ ${ev.episodeNumber} จาก ${ev.totalEpisodes}`}>
              {Array.from({ length: ev.totalEpisodes }, (_, idx) => {
                const ep = idx + 1;
                const isDone = ep < ev.episodeNumber!;
                const isCurrent = ep === ev.episodeNumber!;
                return (
                  <div key={ep} className="space-y-1">
                    <div
                      className={`h-1.5 rounded-full ${
                        isCurrent
                          ? 'bg-blue-700'
                          : isDone
                          ? 'bg-emerald-600'
                          : 'bg-slate-200'
                      }`}
                    />
                    <div className="text-[11px] font-mono tabular-nums text-slate-500">
                      ตอนที่ {ep}/{ev.totalEpisodes}
                      {isCurrent ? ' (ปัจจุบัน)' : isDone ? ' (ผ่านแล้ว)' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <h2
            id="narrative-modal-title"
            className="text-lg sm:text-xl font-bold text-slate-900 font-display mt-2 leading-snug text-balance"
          >
            {ev.title}
          </h2>

          {/* Causal Trigger Explanation from Real Regional & Economic State */}
          {ev.liveTriggerSummary && !isPublicInvestigation && (
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">ปัจจัยกระตุ้นจากสถานการณ์จริง: </span>
              <span className="font-mono tabular-nums">{ev.liveTriggerSummary}</span>
              {previousArcStep && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-200/80 text-slate-600 font-sans">
                  <span className="font-semibold text-slate-800">หมากที่คุณเดินไว้ในตอนก่อน: </span>
                  <span>{previousArcStep.choiceLabel}</span>
                </div>
              )}
            </div>
          )}

          <p className="text-sm text-slate-700 mt-3 leading-relaxed">{ev.description}</p>

          <blockquote className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs italic text-slate-600">
            {ev.contextQuote}
          </blockquote>

          <div className="mt-5 space-y-2.5">
            <div className="text-xs font-semibold text-slate-700">
              {isPublicInvestigation
                ? 'เลือกแนวทางรับมือการไต่สวนสาธารณะ (ส่งผลทันทีต่อเก้าอี้รัฐมนตรีและงบประมาณกระทรวง):'
                : isStoryChain
                ? 'เลือกหมากทางการเมืองของคุณ (บันทึกผลสู่ตอนถัดไปและอัปเดตดัชนีภูมิภาคทันที):'
                : 'เลือกแนวทางตัดสินใจของคุณ (ส่งผลต่อเส้นเนื้อเรื่องในอนาคต):'}
            </div>
            {ev.choices.map((ch) => {
              const flagUnlocked = !ch.requiredFlag || state.storyFlags.includes(ch.requiredFlag);
              const canAfford =
                ch.ledgerType !== FinancialLedgerType.PERSONAL ||
                state.player.finances.cash >= ch.cost;
              const isSelectable = flagUnlocked && canAfford;
              const impactItems = buildChoiceImpactItems(ch);

              return (
                <button
                  key={ch.id}
                  type="button"
                  disabled={!isSelectable}
                  onClick={() => onSelectChoice(ch)}
                  className={`w-full min-h-[44px] text-left p-3.5 rounded-lg border transition-colors ${
                    !flagUnlocked
                      ? 'border-slate-200 bg-slate-50/70 opacity-60 cursor-not-allowed'
                      : !canAfford
                      ? 'border-slate-200 opacity-50 cursor-not-allowed'
                      : ch.requiredFlag
                      ? 'border-blue-300 bg-blue-50/25 hover:border-blue-700 hover:bg-blue-50/50 active:scale-[0.99]'
                      : 'border-slate-300 hover:border-blue-700 hover:bg-blue-50/40 active:scale-[0.99]'
                  }`}
                >
                  {ch.requiredFlag && (
                    <div
                      className={`text-[11px] font-medium mb-1 flex items-center gap-1.5 ${
                        flagUnlocked ? 'text-blue-700' : 'text-slate-500'
                      }`}
                    >
                      {flagUnlocked ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 shrink-0" />
                          <span>ตัวเลือกยุทธศาสตร์พิเศษ · ปลดล็อกจากการตัดสินใจในตอนก่อนหน้า</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            ล็อกตัวเลือก · {ch.requiredFlagHint || 'ต้องเลือกแนวทางที่สอดคล้องในตอนก่อนหน้า'}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="text-sm font-bold text-slate-900 leading-snug">{ch.label}</div>

                  {impactItems.length > 0 && (
                    <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono tabular-nums text-xs">
                      {impactItems.map((imp, idx) => (
                        <React.Fragment key={imp.text}>
                          {idx > 0 && (
                            <span className="text-slate-300" aria-hidden="true">
                              ·
                            </span>
                          )}
                          <span
                            className={
                              imp.tone === 'pos'
                                ? 'text-emerald-700 font-semibold'
                                : imp.tone === 'neg'
                                ? 'text-red-700 font-semibold'
                                : 'text-amber-700 font-semibold'
                            }
                          >
                            {imp.text}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-slate-600 mt-1 leading-relaxed">{ch.outcomeSummary}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ==================== 2. COALITION FORMATION & BARGAINING MODAL ==================== */
interface CoalitionNegotiationModalProps {
  state: GameState;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCoalition: (partyIds: string[]) => void;
}

export const CoalitionNegotiationModal: React.FC<CoalitionNegotiationModalProps> = ({
  state,
  isOpen,
  onClose,
  onConfirmCoalition,
}) => {
  const parliamentaryParties = state.parties
    .filter((p) => p.totalSeats > 0)
    .sort((a, b) => b.totalSeats - a.totalSeats);

  const leadParty =
    state.parties.find((p) => p.id === state.player.partyId && p.totalSeats > 0) ||
    parliamentaryParties[0];

  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    state.parties.filter((p) => p.inCoalition && p.totalSeats > 0).map((p) => p.id)
  );

  if (!isOpen || !leadParty) return null;

  const totalSelectedSeats = parliamentaryParties
    .filter((p) => selectedIds.includes(p.id))
    .reduce((s, p) => s + p.totalSeats, 0);
  const majorityTarget = Math.floor(state.constitution.totalSeats / 2) + 1;

  const toggleParty = (partyId: string) => {
    if (partyId === leadParty.id) return;
    setSelectedIds((prev) =>
      prev.includes(partyId) ? prev.filter((id) => id !== partyId) : [...prev, partyId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coalition-modal-title"
        className="bg-white border-t sm:border border-slate-200 rounded-t-2xl sm:rounded-xl max-w-3xl w-full p-4 sm:p-6 shadow-xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col pb-safe"
      >
        <div className="sm:hidden w-10 h-1.5 bg-slate-300 rounded-full mx-auto mb-2.5 shrink-0" />

        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 shrink-0">
          <div className="flex items-start gap-2.5 min-w-0">
            <Handshake className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h2 id="coalition-modal-title" className="text-base sm:text-lg font-bold text-slate-900 font-display leading-snug">
                โต๊ะเจรจาจัดตั้งรัฐบาลและแบ่งโควตา 18 กระทรวง
              </h2>
              <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
                <span>พรรคแกนนำเจรจา:</span>
                <PartyLogo party={leadParty} size="xs" />
                <span className="font-medium text-slate-700">{leadParty.name}</span>
                <span aria-hidden="true">·</span>
                <span>เป้าหมายเสียงข้างมาก {majorityTarget}/{state.constitution.totalSeats} เสียง</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="min-h-[40px] min-w-[40px] p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg inline-flex items-center justify-center shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-3 p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 text-xs sm:text-sm font-mono tabular-nums shrink-0">
          <span>
            รวมเสียงพรรคร่วมที่เลือก:{' '}
            <strong className={totalSelectedSeats >= majorityTarget ? 'text-emerald-700' : 'text-amber-700'}>
              {totalSelectedSeats} / {state.constitution.totalSeats} เสียง
            </strong>
          </span>
          <span className="text-xs font-sans text-slate-600">
            {totalSelectedSeats >= majorityTarget
              ? 'ผ่านเกณฑ์เสียงข้างมากในสภาผู้แทนราษฎร'
              : `ยังขาดอีก ${majorityTarget - totalSelectedSeats} เสียงเพื่อตั้งรัฐบาลเสียงข้างมาก`}
          </span>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-slate-100 pr-1">
          {parliamentaryParties.map((party) => {
            const compat = calculateCoalitionCompatibility(leadParty, party);
            const checked = selectedIds.includes(party.id);
            const refuses = party.id !== leadParty.id && compat.willingnessScore < 36;

            return (
              <div key={party.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 text-xs">
                <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                  <PartyLogo party={party} size="sm" className="mt-0.5 sm:mt-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900">
                      {party.name} ({party.totalSeats} ที่นั่ง)
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      หัวหน้าพรรค: {party.leader.name} · ความสอดคล้องนโยบาย {compat.policyCompatibility}% · ความพร้อมร่วมงาน {compat.willingnessScore}/100
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {refuses ? (
                    <span className="text-red-700 font-medium inline-block py-1">
                      อุดมการณ์ต่างกันเกินไป (ปฏิเสธร่วม)
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleParty(party.id)}
                      className={`w-full sm:w-auto min-h-[38px] px-3.5 py-1.5 rounded-lg border font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        checked
                          ? 'border-blue-700 bg-blue-700 text-white'
                          : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {checked && <Check className="w-3.5 h-3.5 shrink-0" />}
                      <span>{checked ? 'อยู่ในพรรคร่วม' : 'เชิญเข้าร่วม'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3.5 mt-3 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[42px] px-4 py-2 text-xs font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={() => {
              if (!selectedIds.includes(leadParty.id)) {
                onConfirmCoalition([leadParty.id, ...selectedIds]);
              } else {
                onConfirmCoalition(selectedIds);
              }
            }}
            className="w-full sm:w-auto min-h-[42px] px-4 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg"
          >
            ลงสัตยาบันจัดตั้งรัฐบาลและแบ่งโควตา ครม. ({totalSelectedSeats} เสียง)
          </button>
        </div>
      </div>
    </div>
  );
};

/* ==================== 3. MULTI-SLOT SAVE MANAGER MODAL ==================== */
interface SaveManagerModalProps {
  isOpen: boolean;
  slots: SaveSlotMetadata[];
  onClose: () => void;
  onSaveToSlot: (slotId: string, slotName: string) => void;
  onLoadSlot: (slotId: string) => void;
  onDeleteSlot: (slotId: string) => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
}

export const SaveManagerModal: React.FC<SaveManagerModalProps> = ({
  isOpen,
  slots,
  onClose,
  onSaveToSlot,
  onLoadSlot,
  onDeleteSlot,
  onExportJSON,
  onImportJSON,
}) => {
  const [newSlotName, setNewSlotName] = useState('บันทึกเส้นทางการเมือง 1');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-modal-title"
        className="bg-white border-t sm:border border-slate-200 rounded-t-2xl sm:rounded-xl max-w-2xl w-full max-h-[92dvh] sm:max-h-[88vh] flex flex-col p-4 sm:p-6 shadow-xl pb-safe"
      >
        <div className="sm:hidden w-10 h-1.5 bg-slate-300 rounded-full mx-auto mb-2.5 shrink-0" />

        <div className="flex items-start justify-between gap-3 pb-3 mb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-start gap-2.5">
            <Save className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <h2 id="save-modal-title" className="text-base sm:text-lg font-bold text-slate-900 font-display">
                จัดการสล็อตบันทึกเกม
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ระบบเซฟอัตโนมัติในสล็อต Auto-Save ทุกสิ้นเดือน และสร้างสล็อตแยกได้ไม่จำกัด
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="min-h-[40px] min-w-[40px] p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg inline-flex items-center justify-center shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create New Manual Save Slot */}
        <div className="space-y-2.5 mb-4 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={newSlotName}
              onChange={(e) => setNewSlotName(e.target.value)}
              className="flex-1 min-h-[42px] px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="ตั้งชื่อสล็อตเซฟใหม่..."
            />
            <button
              type="button"
              onClick={() => onSaveToSlot(`slot_${Date.now()}`, newSlotName.trim() || 'เซฟด้วยตนเอง')}
              className="min-h-[42px] px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg whitespace-nowrap"
            >
              บันทึกสล็อตใหม่
            </button>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <button
              type="button"
              onClick={onExportJSON}
              className="min-h-[40px] px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium rounded-lg inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>ส่งออก JSON</span>
            </button>
            <label className="min-h-[40px] px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span>นำเข้า JSON</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImportJSON(file);
                }}
              />
            </label>
          </div>
        </div>

        <div className="divide-y divide-slate-200 overflow-y-auto flex-1 pr-0.5">
          {slots.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">ยังไม่มีสล็อตบันทึก</div>
          ) : (
            slots.map((s) => (
              <div key={s.slotId} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-900">{s.slotName}</div>
                  <div className="text-slate-500 font-mono tabular-nums mt-0.5">
                    {s.playerName} · {s.roleLabel} · {s.dateLabel} (เทิร์น {s.turn})
                    {typeof s.achievementsCount === 'number' ? ` · ตราเกียรติยศ ${s.achievementsCount}/12` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSaveToSlot(s.slotId, s.slotName)}
                    className="flex-1 sm:flex-none min-h-[38px] px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                  >
                    เซฟทับ
                  </button>
                  <button
                    type="button"
                    onClick={() => onLoadSlot(s.slotId)}
                    className="flex-1 sm:flex-none min-h-[38px] px-3.5 py-1.5 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 whitespace-nowrap"
                  >
                    โหลด
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSlot(s.slotId)}
                    className="flex-1 sm:flex-none min-h-[38px] px-3 py-1.5 border border-slate-300 rounded-lg text-red-700 hover:bg-red-50 whitespace-nowrap"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/* ==================== 4. CONSTITUTION RULESET INSPECTOR MODAL ==================== */
interface ConstitutionModalProps {
  isOpen: boolean;
  constitution: ConstitutionRuleset;
  onClose: () => void;
}

export const ConstitutionModal: React.FC<ConstitutionModalProps> = ({
  isOpen,
  constitution,
  onClose,
}) => {
  if (!isOpen) return null;

  const rows = [
    { label: 'ชื่อชุดกติการัฐธรรมนูญ', val: `${constitution.name} (รุ่น ${constitution.version})` },
    { label: 'โหมดกติกา', val: constitution.isSandbox ? 'Sandbox (สมมติโดยผู้เล่น)' : 'อ้างอิงโครงสร้างกฎหมายจริง' },
    { label: 'จำนวนสมาชิกสภาผู้แทนราษฎรรวม', val: `${constitution.totalSeats} คน (เขต ${constitution.constituencySeats} + บัญชีรายชื่อ ${constitution.partyListSeats})` },
    { label: 'เพดานจำนวนรัฐมนตรีสูงสุด (ไม่รวมนายกฯ)', val: `${constitution.maxCabinetMinisters} คน` },
    { label: 'เพดานการดำรงตำแหน่งนายกรัฐมนตรีสะสม', val: `ไม่เกิน ${constitution.pmMaxCumulativeYears} ปี (${constitution.pmMaxCumulativeYears * 365} วัน)` },
    { label: 'เกณฑ์ ส.ส. ขั้นต่ำของพรรคที่มีสิทธิเสนอชื่อนายกฯ', val: `ร้อยละ ${constitution.pmNominationPartySeatThresholdPct} (${Math.ceil((constitution.pmNominationPartySeatThresholdPct / 100) * constitution.totalSeats)} ที่นั่ง)` },
    { label: 'อายุขั้นต่ำ: ผู้มีสิทธิเลือกตั้ง / ส.ส. / รัฐมนตรี', val: `${constitution.voterMinAge} ปี / ${constitution.mpMinAge} ปี / ${constitution.ministerMinAge} ปี` },
    { label: 'ระยะเวลาสังกัดพรรคขั้นต่ำ (ปกติ / ยุบสภา)', val: `${constitution.normalPartyMembershipDays} วัน / ${constitution.dissolutionPartyMembershipDays} วัน` },
    { label: 'เกณฑ์เสียงแก้ไขเพิ่มเติมรัฐธรรมนูญ', val: `ร้อยละ ${constitution.amendmentSupermajorityPct} (${constitution.senateApprovalRequiredForAmendment ? 'ต้องใช้เสียงเห็นชอบร่วมจากวุฒิสภา' : 'ไม่ต้องใช้เสียงพิเศษจากวุฒิสภา'})` },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="constitution-modal-title"
        className="bg-white border-t sm:border border-slate-200 rounded-t-2xl sm:rounded-xl max-w-xl w-full max-h-[92dvh] sm:max-h-[88vh] flex flex-col p-4 sm:p-6 shadow-xl pb-safe"
      >
        <div className="sm:hidden w-10 h-1.5 bg-slate-300 rounded-full mx-auto mb-2.5 shrink-0" />

        <div className="flex items-start justify-between gap-3 pb-3 mb-3 border-b border-slate-200 shrink-0">
          <div className="flex items-start gap-2.5">
            <Scale className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <h2 id="constitution-modal-title" className="text-base sm:text-lg font-bold text-slate-900 font-display leading-snug">
              ฐานข้อมูลกติการัฐธรรมนูญที่บังคับใช้ปัจจุบัน (Layer 01)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="min-h-[40px] min-w-[40px] p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg inline-flex items-center justify-center shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 text-xs overflow-y-auto flex-1 pr-0.5">
          {rows.map((r) => (
            <div key={r.label} className="py-2.5 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
              <span className="text-slate-600">{r.label}</span>
              <strong className="text-slate-900 sm:text-right font-mono tabular-nums">{r.val}</strong>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[42px] px-5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
