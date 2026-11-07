import React from 'react';
import { BarChart3, Briefcase, Coins, Lock } from 'lucide-react';
import { GameState, PlayerRole } from '../types/game';
import { PartyLogo } from './PartyLogo';

interface GovernmentAndEconomyViewProps {
  state: GameState;
  onAdjustMinistryBudget: (ministryId: string, deltaPct: number) => void;
}

export const GovernmentAndEconomyView: React.FC<GovernmentAndEconomyViewProps> = ({
  state,
  onAdjustMinistryBudget,
}) => {
  const isExecutive =
    state.player.role === PlayerRole.PRIME_MINISTER || state.player.role === PlayerRole.MINISTER;
  const appointedMinistersCount = state.ministries.filter((m) => m.ministerPartyId !== null).length;

  // Build SVG Polyline points for Macroeconomic History Chart
  const history = state.economicHistory;
  const chartW = 540;
  const chartH = 170;
  const padX = 34;
  const padY = 20;

  const mapX = (idx: number) => {
    if (history.length <= 1) return padX;
    return padX + (idx / (history.length - 1)) * (chartW - padX * 2);
  };
  const mapPctY = (val: number, minV: number, maxV: number) => {
    const clamped = Math.max(minV, Math.min(maxV, val));
    return chartH - padY - ((clamped - minV) / (maxV - minV)) * (chartH - padY * 2);
  };

  const gdpPoints = history.map((pt, i) => `${mapX(i)},${mapPctY(pt.gdpGrowthPct, -2, 7)}`).join(' ');
  const infPoints = history.map((pt, i) => `${mapX(i)},${mapPctY(pt.inflationPct, -2, 7)}`).join(' ');
  const appPoints = history.map((pt, i) => `${mapX(i)},${mapPctY(pt.govApproval, 0, 100)}`).join(' ');

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Split: Macroeconomic Charts & Indicators + State Fiscal Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">
                กราฟตัวชี้วัดเศรษฐกิจมหภาคและความนิยมรัฐบาล
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                การเปลี่ยนแปลงทางนโยบายและงบประมาณส่งผลต่อเนื่องระยะยาวตามรอบเดือน
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 sm:p-3">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto">
              {/* Horizontal Grid Lines */}
              {[0.25, 0.5, 0.75].map((ratio) => (
                <line
                  key={ratio}
                  x1={padX}
                  y1={padY + ratio * (chartH - padY * 2)}
                  x2={chartW - padX}
                  y2={padY + ratio * (chartH - padY * 2)}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />
              ))}

              {history.length > 1 ? (
                <>
                  <polyline
                    fill="none"
                    stroke="#1D4ED8"
                    strokeWidth="2.4"
                    points={gdpPoints}
                  />
                  <polyline
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    points={infPoints}
                  />
                  <polyline
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2"
                    points={appPoints}
                  />
                </>
              ) : (
                <text x={chartW / 2} y={chartH / 2} textAnchor="middle" className="text-xs fill-slate-500">
                  เดินเทิร์นถัดไปเพื่อดูเส้นแนวโน้มเศรษฐกิจรายเดือน
                </text>
              )}

              {history.map((pt, i) => (
                <g key={pt.turn}>
                  <circle cx={mapX(i)} cy={mapPctY(pt.gdpGrowthPct, -2, 7)} r={3} fill="#1D4ED8" />
                  {(i === 0 || i === history.length - 1 || i % 3 === 0) && (
                    <text
                      x={mapX(i)}
                      y={chartH - 4}
                      textAnchor="middle"
                      className="text-[9px] fill-slate-500 font-mono"
                    >
                      {pt.label}
                    </text>
                  )}
                </g>
              ))}
            </svg>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-700 inline-block" />
                <span>GDP Growth ({state.economy.gdpGrowthPct}%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-amber-600 inline-block" />
                <span>เงินเฟ้อ ({state.economy.inflationPct}%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
                <span>ความนิยมรัฐบาลเฉลี่ย</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5 mt-4 font-mono tabular-nums text-xs">
            {[
              { label: 'GDP Growth', val: `${state.economy.gdpGrowthPct}%` },
              { label: 'เงินเฟ้อ', val: `${state.economy.inflationPct}%` },
              { label: 'ว่างงาน', val: `${state.economy.unemploymentPct}%` },
              { label: 'หนี้สาธารณะ/GDP', val: `${state.economy.publicDebtGDPPct}%` },
              { label: 'ดัชนีรายได้ครัวเรือน', val: `${state.economy.householdIncomeIndex}` },
            ].map((m) => (
              <div key={m.label} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg">
                <div className="font-sans text-slate-500 text-[11px]">{m.label}</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{m.val}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Right 5 Cols: Three-Tier Financial Separation & Annual State Budget Summary */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">
                  ระบบการคลังและงบประมาณแผ่นดิน 3,000,000 ล้านบาท
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  แยกขาดระหว่างเงินส่วนตัว เงินพรรค และเงินแผ่นดินตามหลักกฎหมายมหาชน
                </p>
              </div>
              <Coins className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
            </div>

            <div className="divide-y divide-slate-100 text-xs font-mono tabular-nums">
              <div className="py-2.5 flex flex-wrap items-center justify-between gap-1">
                <span className="font-sans text-slate-600">วงเงินงบประมาณรายจ่ายประจำปี</span>
                <strong className="text-slate-900">{state.stateFinances.annualBudgetTotalMillion.toLocaleString()} ล้านบาท</strong>
              </div>
              <div className="py-2.5 flex flex-wrap items-center justify-between gap-1">
                <span className="font-sans text-slate-600">ประมาณการรายได้ภาษีรัฐ</span>
                <strong className="text-emerald-700">{state.stateFinances.taxRevenueMillion.toLocaleString()} ล้านบาท</strong>
              </div>
              <div className="py-2.5 flex flex-wrap items-center justify-between gap-1">
                <span className="font-sans text-slate-600">ดุลงบประมาณ (ขาดดุล/เกินดุล)</span>
                <strong className="text-amber-700">{state.stateFinances.budgetBalanceMillion.toLocaleString()} ล้านบาท</strong>
              </div>
              <div className="py-2.5 flex flex-wrap items-center justify-between gap-1">
                <span className="font-sans text-slate-600">งบกลางสำรองจ่ายฉุกเฉินคงเหลือ</span>
                <strong className="text-blue-700">{state.stateFinances.centralReserveMillion.toLocaleString()} ล้านบาท</strong>
              </div>
              <div className="py-2.5 flex flex-wrap items-center justify-between gap-1">
                <span className="font-sans text-slate-600">จำนวนรัฐมนตรีที่แต่งตั้ง / เพดาน ม.158</span>
                <strong className="text-slate-900">{appointedMinistersCount} / {state.constitution.maxCabinetMinisters} คน</strong>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
            {isExecutive ? (
              <span>
                คุณอยู่ในฝ่ายบริหาร ({state.player.role === PlayerRole.PRIME_MINISTER ? 'นายกรัฐมนตรี' : 'รัฐมนตรี'}) สามารถปรับเกลี่ยสัดส่วนงบประมาณระหว่าง 18 กระทรวงในตารางด้านล่างได้โดยไม่เกินวงเงินรวม 100%
              </span>
            ) : (
              <>
                <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  การจัดสรรงบประมาณแผ่นดินสงวนไว้สำหรับผู้ดำรงตำแหน่งรัฐมนตรีหรือนายกรัฐมนตรี (ปัจจุบันคุณสามารถตรวจสอบตัวเลขและใช้การ์ดตามบทบาทได้)
                </span>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Bottom: 18 Ministries & Cabinet Portfolio */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4 pb-3 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">
              คณะรัฐมนตรีและการจัดสรรงบประมาณ 18 กระทรวง (นายกรัฐมนตรี: {state.primeMinisterName})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              เสถียรภาพรัฐบาล {state.governmentStability}% · ดัชนีความขัดแย้งพรรคร่วม {state.politicalFrictionIndex}%
            </p>
          </div>
          <Briefcase className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
        </div>

        {/* Mobile Stacked List (< md) */}
        <div className="md:hidden divide-y divide-slate-200 text-xs">
          {state.ministries.map((min) => {
            const party = state.parties.find((p) => p.id === min.ministerPartyId);
            return (
              <div key={min.id} className="py-3.5 first:pt-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{min.name}</div>
                    <div className="text-slate-500 mt-0.5">{min.mission}</div>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <div className="font-bold text-slate-900 text-sm">{min.budgetSharePct.toFixed(1)}%</div>
                    <div className="text-[11px] text-slate-500">{min.allocatedMillion.toLocaleString()} ล.฿</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-2 text-slate-700">
                    <span className="font-medium text-slate-800">
                      รมว.: {min.ministerName}
                      {min.isPlayerMinister && ' (คุณ)'}
                    </span>
                    {party && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <PartyLogo party={party} size="xs" />
                          <span>{party.shortName}</span>
                        </span>
                      </>
                    )}
                  </div>

                  {isExecutive && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onAdjustMinistryBudget(min.id, -0.5)}
                        className="min-h-[38px] px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-100 font-mono font-semibold text-slate-700"
                      >
                        -0.5%
                      </button>
                      <button
                        type="button"
                        onClick={() => onAdjustMinistryBudget(min.id, 0.5)}
                        className="min-h-[38px] px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-100 font-mono font-semibold text-slate-700"
                      >
                        +0.5%
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tablet & Desktop Table (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 pr-4 font-semibold">กระทรวงและภารกิจหลัก</th>
                <th className="py-2.5 px-4 font-semibold">รัฐมนตรีเจ้ากระทรวง</th>
                <th className="py-2.5 px-4 font-semibold">พรรคโควตา</th>
                <th className="py-2.5 px-4 font-semibold text-right">สัดส่วนงบ (%)</th>
                <th className="py-2.5 px-4 font-semibold text-right">วงเงินจัดสรร (ล้านบาท)</th>
                {isExecutive && <th className="py-2.5 pl-4 font-semibold text-right">ปรับเกลี่ยงบ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.ministries.map((min) => {
                const party = state.parties.find((p) => p.id === min.ministerPartyId);
                return (
                  <tr key={min.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 pr-4">
                      <div className="font-semibold text-slate-900">{min.name}</div>
                      <div className="text-slate-500">{min.mission}</div>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap font-medium text-slate-800">
                      {min.ministerName}
                      {min.isPlayerMinister && ' (คุณ)'}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap text-slate-700">
                      {party ? (
                        <span className="inline-flex items-center gap-1.5">
                          <PartyLogo party={party} size="xs" />
                          <span>{party.shortName}</span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {min.budgetSharePct.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                      {min.allocatedMillion.toLocaleString()}
                    </td>
                    {isExecutive && (
                      <td className="py-2.5 pl-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onAdjustMinistryBudget(min.id, -0.5)}
                            className="min-h-[34px] px-2.5 py-1 border border-slate-300 rounded-lg hover:bg-slate-100 font-mono"
                          >
                            -0.5%
                          </button>
                          <button
                            type="button"
                            onClick={() => onAdjustMinistryBudget(min.id, 0.5)}
                            className="min-h-[34px] px-2.5 py-1 border border-slate-300 rounded-lg hover:bg-slate-100 font-mono"
                          >
                            +0.5%
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
