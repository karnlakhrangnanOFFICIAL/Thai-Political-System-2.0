import React from 'react';
import { AlertTriangle, CheckCircle2, Layers, Lock, Play, RefreshCw, ShieldCheck } from 'lucide-react';
import { POLICY_CARDS } from '../data/cardsAndStories';
import { validateCardPlay } from '../engines/legalEngine';
import { FinancialLedgerType, GameState, PoliticalLayer } from '../types/game';
import { getScandalRiskStatus } from './ScandalRiskMeter';

interface PolicyCardTrayProps {
  state: GameState;
  onPlayCard: (cardId: string) => void;
  onRedrawHand: () => void;
}

const LAYER_LABELS: Record<PoliticalLayer, string> = {
  [PoliticalLayer.LIFE]: 'ชีวิตและอาชีพ',
  [PoliticalLayer.LAW]: 'Layer 01 · กฎหมาย',
  [PoliticalLayer.POWER]: 'Layer 02 · อำนาจสภา',
  [PoliticalLayer.GOVERNANCE]: 'Layer 03 · บริหารรัฐ',
};

function formatCardCost(ledger: FinancialLedgerType, amount: number): string {
  if (ledger === FinancialLedgerType.NONE || amount <= 0) return 'ไม่ใช้เงิน';
  if (ledger === FinancialLedgerType.PERSONAL) return `เงินส่วนตัว ${amount.toLocaleString()} ฿`;
  if (ledger === FinancialLedgerType.PARTY) return `งบพรรค ${amount.toLocaleString()} ล้าน ฿`;
  return `งบกลางรัฐ ${amount.toLocaleString()} ล้าน ฿`;
}

export const PolicyCardTray: React.FC<PolicyCardTrayProps> = ({
  state,
  onPlayCard,
  onRedrawHand,
}) => {
  const handCards = state.handCardIds
    .map((id) => POLICY_CARDS.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const currentRisk = state.player.scandalRisk || 0;
  const riskStatus = getScandalRiskStatus(currentRisk);

  return (
    <section
      id="card-tray"
      aria-label="แผงการ์ดการกระทำและนโยบายประจำเทิร์น"
      className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 scroll-mt-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-start sm:items-center gap-2.5">
          <Layers className="w-4 h-4 text-blue-700 shrink-0 mt-1 sm:mt-0" />
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 font-display">
              มือการ์ดนโยบายและการกระทำประจำเดือน (เหลือแต้มดำเนินการ {state.actionPoints}/{state.maxActionPoints} AP)
            </h2>
            <p className="text-xs text-slate-500">
              การ์ดเชิงรุกให้ผลตอบแทนสูงแต่เพิ่มดัชนีความเสี่ยงข่าวฉาว (ปัจจุบัน:{' '}
              <strong className={`font-mono tabular-nums ${riskStatus.textColorClass}`}>
                {riskStatus.risk}% · {riskStatus.shortLabelTh}
              </strong>
              )
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRedrawHand}
          disabled={state.actionPoints < 1}
          className="w-full sm:w-auto min-h-[42px] sm:min-h-[38px] px-3.5 py-2 sm:py-1.5 text-xs font-semibold border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
          <span>จั่วชุดการ์ดใหม่ (ใช้ 1 AP)</span>
        </button>
      </div>

      {handCards.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500">
          คุณใช้การ์ดในมือของเดือนนี้ครบแล้ว กดปุ่ม <strong>“จบเทิร์นเดือนนี้”</strong> ด้านบนขวาเพื่อเข้าสู่เดือนถัดไปและจั่วการ์ดชุดใหม่
        </div>
      ) : (
        <>
          <p className="sm:hidden text-[11px] text-slate-500 mb-2.5">
            ปัดซ้าย-ขวาเพื่อเลือกการ์ดในมือ ({handCards.length} ใบ)
          </p>

          {/* Horizontal Snap Carousel on Mobile (< sm), 2-col on sm, 3-col on lg, 5-col hand on xl */}
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-2 sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0 items-stretch">
            {handCards.map((card) => {
              const check = validateCardPlay(state, card);
              const riskDelta = card.effects.scandalRiskDelta || 0;
              const isAggressive = Boolean(card.isAggressive) || riskDelta > 0;
              const projectedRisk = Math.min(100, Math.max(0, currentRisk + riskDelta));
              const willTriggerInquiry = riskDelta > 0 && projectedRisk >= 100;

              return (
                <div
                  key={card.id}
                  className={`min-w-[82vw] max-w-[300px] sm:min-w-0 sm:max-w-none snap-center shrink-0 sm:shrink rounded-xl border p-4 flex flex-col justify-between transition-transform duration-150 ${
                    check.valid
                      ? isAggressive
                        ? 'border-amber-300 bg-white sm:hover:-translate-y-0.5'
                        : 'border-slate-300 bg-white sm:hover:-translate-y-0.5'
                      : 'border-slate-200 bg-slate-50/80 opacity-85'
                  }`}
                >
                  <div>
                    {/* Zero-Pill Unboxed Metadata Header */}
                    <div className="text-[11px] text-slate-500 font-mono tabular-nums flex flex-wrap items-center gap-1">
                      <span
                        className={`font-sans font-semibold ${
                          isAggressive ? 'text-amber-800' : 'text-blue-700'
                        }`}
                      >
                        {isAggressive ? 'นโยบายเชิงรุก' : LAYER_LABELS[card.layer]}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{card.apCost} AP</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-sans">{formatCardCost(card.ledgerType, card.moneyCost)}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 font-display mt-1.5 leading-snug">
                      {card.title}
                    </h3>

                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="text-[11px] font-mono tabular-nums text-slate-700">
                      ผลลัพธ์: {card.effectPreview}
                    </div>

                    {/* Explicit Scandal Risk Impact Line */}
                    {riskDelta !== 0 && (
                      <div
                        className={`text-[11px] font-mono tabular-nums flex items-center gap-1.5 ${
                          willTriggerInquiry
                            ? 'text-red-700 font-bold'
                            : riskDelta > 0
                            ? 'text-amber-800 font-semibold'
                            : 'text-emerald-700 font-semibold'
                        }`}
                      >
                        {riskDelta > 0 ? (
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>
                          {riskDelta > 0
                            ? willTriggerInquiry
                              ? `+${riskDelta}% ความเสี่ยง (แตะ 100% เปิดไต่สวนทันที!)`
                              : `+${riskDelta}% ความเสี่ยงข่าวฉาว (คาดการณ์ ${projectedRisk}%)`
                            : `${riskDelta}% ลดความเสี่ยงข่าวฉาว (เหลือ ${projectedRisk}%)`}
                        </span>
                      </div>
                    )}

                    {check.valid ? (
                      <button
                        type="button"
                        onClick={() => onPlayCard(card.id)}
                        className={`w-full min-h-[44px] sm:min-h-[40px] py-2.5 sm:py-2 px-3 active:scale-[0.99] text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                          willTriggerInquiry
                            ? 'bg-red-700 hover:bg-red-800'
                            : isAggressive
                            ? 'bg-amber-700 hover:bg-amber-800'
                            : 'bg-blue-700 hover:bg-blue-800'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {willTriggerInquiry
                            ? 'วางการ์ดเชิงรุก (เสี่ยงไต่สวน 100%)'
                            : isAggressive
                            ? 'วางการ์ดนโยบายเชิงรุก'
                            : 'วางการ์ดดำเนินการ'}
                        </span>
                      </button>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-slate-100 text-[11px] text-slate-600 flex items-start gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{check.reason}</span>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 flex items-center gap-1 truncate" title={card.legalBasis}>
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span className="truncate">{card.legalBasis}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};
