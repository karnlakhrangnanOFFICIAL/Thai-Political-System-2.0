import React, { useMemo, useState } from 'react';
import { CheckCircle2, FileText, Gavel, Landmark, ShieldAlert, XCircle } from 'lucide-react';
import { BillStatus, GameState } from '../types/game';
import { PartyLogo } from './PartyLogo';

interface ParliamentAndLawViewProps {
  state: GameState;
  onOpenCoalitionModal: () => void;
}

const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  [BillStatus.DRAFT]: 'ร่างเบื้องต้น',
  [BillStatus.SUBMITTED]: 'ยื่นบรรจุระเบียบวาระ',
  [BillStatus.FIRST_READING]: 'วาระที่ 1 (รับหลักการ)',
  [BillStatus.COMMITTEE_REVIEW]: 'ชั้นกรรมาธิการวิสามัญ',
  [BillStatus.SECOND_READING]: 'วาระที่ 2 (เรียงลำดับมาตรา)',
  [BillStatus.THIRD_READING]: 'วาระที่ 3 (ลงมติเห็นชอบ)',
  [BillStatus.SENATE_PROCESS]: 'ชั้นวุฒิสภากลั่นกรอง',
  [BillStatus.FINAL_APPROVAL]: 'รอประกาศราชกิจจานุเบกษา',
  [BillStatus.PROMULGATED]: 'ประกาศบังคับใช้เป็นกฎหมายแล้ว',
  [BillStatus.REJECTED]: 'ตกไป / ไม่ผ่านความเห็นชอบ',
  [BillStatus.WITHDRAWN]: 'ถอนร่าง',
  [BillStatus.RETURNED]: 'ส่งคืนทบทวน',
};

export const ParliamentAndLawView: React.FC<ParliamentAndLawViewProps> = ({
  state,
  onOpenCoalitionModal,
}) => {
  const [hoveredPartyId, setHoveredPartyId] = useState<string | null>(null);
  const [pinnedPartyId, setPinnedPartyId] = useState<string | null>(null);

  const activePartyId = hoveredPartyId ?? pinnedPartyId;

  // Build 500-seat (or dynamic totalSeats) hemicycle coordinates sorted Coalition -> Opposition
  const seatDots = useMemo(() => {
    const total = state.constitution.totalSeats;
    const orderedParties = [
      ...state.parties.filter((p) => p.inCoalition && p.totalSeats > 0).sort((a, b) => b.totalSeats - a.totalSeats),
      ...state.parties.filter((p) => !p.inCoalition && p.totalSeats > 0).sort((a, b) => b.totalSeats - a.totalSeats),
    ];

    const seatAssignments: { partyId: string; color: string; inCoalition: boolean }[] = [];
    for (const p of orderedParties) {
      for (let i = 0; i < p.totalSeats; i++) {
        seatAssignments.push({ partyId: p.id, color: p.color, inCoalition: p.inCoalition });
      }
    }

    // Generate concentric semicircle coordinates
    const rows = 9;
    const rowCapacities: number[] = [];
    let rawSum = 0;
    for (let r = 0; r < rows; r++) {
      const cap = 36 + r * 7;
      rowCapacities.push(cap);
      rawSum += cap;
    }

    // Normalize capacities to exact `total`
    const exactCaps = rowCapacities.map((c) => Math.round((c / rawSum) * total));
    const diff = total - exactCaps.reduce((a, b) => a + b, 0);
    exactCaps[rows - 1] += diff;

    const coords: { x: number; y: number; angle: number }[] = [];
    for (let r = 0; r < rows; r++) {
      const count = exactCaps[r];
      const radius = 82 + r * 17.5;
      for (let k = 0; k < count; k++) {
        const angle = Math.PI - (k / Math.max(1, count - 1)) * Math.PI;
        const x = 260 + radius * Math.cos(angle);
        const y = 248 - radius * Math.sin(angle);
        coords.push({ x, y, angle });
      }
    }

    // Sort left-to-right wedge angle so Coalition sits cleanly on left/center and Opposition on right
    coords.sort((a, b) => b.angle - a.angle);

    return coords.slice(0, seatAssignments.length).map((pt, idx) => ({
      ...pt,
      ...seatAssignments[idx],
    }));
  }, [state.parties, state.constitution.totalSeats]);

  const activeParty = state.parties.find((p) => p.id === activePartyId);
  const majorityMark = Math.floor(state.constitution.totalSeats / 2) + 1;
  const canNegotiateCoalition =
    state.player.isPartyLeader ||
    state.player.role === 'PRIME_MINISTER' ||
    state.player.role === 'OPPOSITION_LEADER';

  const togglePinParty = (partyId: string) => {
    setPinnedPartyId((prev) => (prev === partyId ? null : partyId));
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Split: 500-Seat Hemicycle + Parliamentary Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">
                ผังที่นั่งสภาผู้แทนราษฎร ({state.constitution.totalSeats} คน: เขต {state.constitution.constituencySeats} · บัญชีรายชื่อ {state.constitution.partyListSeats})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                เกณฑ์เสียงข้างมาก {majorityMark} เสียง · องค์ประชุมล่าสุด {state.lastQuorumPresent} คน
              </p>
            </div>
            {canNegotiateCoalition && (
              <button
                type="button"
                onClick={onOpenCoalitionModal}
                className="w-full sm:w-auto min-h-[42px] sm:min-h-[38px] px-3.5 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800 whitespace-nowrap shrink-0"
              >
                เจรจาจัดตั้งรัฐบาลใหม่
              </button>
            )}
          </div>

          <div className="my-3 bg-slate-50 border border-slate-100 rounded-lg p-2.5 sm:p-3 flex flex-col items-center">
            <svg
              viewBox="0 0 520 265"
              className="w-full max-w-[500px] h-auto select-none"
              role="img"
              aria-label="แผนผังครึ่งวงกลมสภาผู้แทนราษฎร 500 ที่นั่ง"
            >
              {/* Majority 50%+1 Center Line */}
              <line
                x1="260"
                y1="15"
                x2="260"
                y2="175"
                stroke="#94A3B8"
                strokeDasharray="3 3"
                strokeWidth="1.2"
              />
              <text x="260" y="12" textAnchor="middle" className="text-[9px] fill-slate-500 font-mono">
                กึ่งหนึ่ง ({majorityMark})
              </text>

              {seatDots.map((dot, index) => {
                const dimmed = activePartyId && activePartyId !== dot.partyId;
                return (
                  <circle
                    key={index}
                    cx={dot.x}
                    cy={dot.y}
                    r={3.5}
                    fill={dot.color}
                    fillOpacity={dimmed ? 0.2 : 0.92}
                    onMouseEnter={() => setHoveredPartyId(dot.partyId)}
                    onMouseLeave={() => setHoveredPartyId(null)}
                    onClick={() => togglePinParty(dot.partyId)}
                    className="cursor-pointer transition-opacity"
                  />
                );
              })}

              {/* Center Speaker Podium Readout */}
              <text x="260" y="218" textAnchor="middle" className="text-sm font-bold fill-slate-900">
                {activeParty
                  ? `${activeParty.shortName}: ${activeParty.totalSeats} ที่นั่ง`
                  : `ฝ่ายรัฐบาล ${state.coalitionSeatCount} · ฝ่ายค้าน ${state.oppositionSeatCount}`}
              </text>
              <text x="260" y="236" textAnchor="middle" className="text-[11px] fill-slate-500">
                {activeParty
                  ? `${activeParty.inCoalition ? 'พรรคร่วมรัฐบาล' : 'พรรคฝ่ายค้าน'} (เขต ${activeParty.constituencySeats} · บัญชีรายชื่อ ${activeParty.partyListSeats})`
                  : `นายกรัฐมนตรี: ${state.primeMinisterName}`}
              </text>
            </svg>
          </div>

          {/* Parliamentary Party Legend (Supports both Touch Tap & Desktop Hover) */}
          <div className="pt-2.5 border-t border-slate-100 flex flex-wrap gap-2 text-xs text-slate-600">
            {state.parties
              .filter((p) => p.totalSeats > 0)
              .sort((a, b) => b.totalSeats - a.totalSeats)
              .slice(0, 10)
              .map((p) => {
                const isPinned = pinnedPartyId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePinParty(p.id)}
                    onMouseEnter={() => setHoveredPartyId(p.id)}
                    onMouseLeave={() => setHoveredPartyId(null)}
                    className={`min-h-[36px] px-2.5 py-1 rounded-lg border flex items-center gap-1.5 font-mono tabular-nums transition-colors ${
                      isPinned
                        ? 'border-blue-700 bg-blue-50 text-blue-800 font-semibold'
                        : 'border-slate-200/80 bg-white hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <PartyLogo party={p} size="xs" />
                    <span className="font-sans">{p.shortName}</span>
                    <strong>{p.totalSeats}</strong>
                  </button>
                );
              })}
          </div>
        </section>

        {/* Right 5 Cols: Independent Constitutional Organs & Legal Oversight */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">
                  องค์กรอิสระและศาลตามรัฐธรรมนูญ
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  กลไกถ่วงดุลอำนาจที่ทำงานตามข้อเท็จจริงและเขตอำนาจทางกฎหมาย
                </p>
              </div>
              <Landmark className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {[
                {
                  name: 'คณะกรรมการการเลือกตั้ง (กกต.)',
                  role: `จัดการเลือกตั้งและรับรองผล (${state.monthsUntilElection} เดือนถึงรอบถัดไป)`,
                },
                {
                  name: 'ศาลรัฐธรรมนูญ',
                  role: `วินิจฉัยความชอบด้วยรัฐธรรมนูญและนับเพดานนายกฯ ${state.constitution.pmMaxCumulativeYears} ปี`,
                },
                {
                  name: 'ป.ป.ช. และ สตง.',
                  role: `ไต่สวนบัญชีทรัพย์สินและวินัยการคลัง (จริยธรรมคุณ: ${state.player.integrityScore}/100)`,
                },
              ].map((org) => (
                <div key={org.name} className="py-2.5">
                  <div className="font-semibold text-slate-900">{org.name}</div>
                  <div className="text-slate-500 mt-0.5">{org.role}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-2">สำนวนคดีและการไต่สวนล่าสุด</h3>
              {state.agencyCases.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">
                  ไม่มีสำนวนไต่สวนค้างพิจารณาต่อผู้เล่นในขณะนี้ (รักษาคะแนนคุณธรรมจริยธรรมให้สูงกว่า 50 เสมอ)
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {state.agencyCases.map((c) => (
                    <div key={c.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 font-semibold text-slate-800">
                        <span>{c.agency} · {c.subject}</span>
                        <span className="flex items-center gap-1 shrink-0">
                          {c.status === 'CLEARED' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">ยกคำร้อง</span>
                            </>
                          ) : c.status === 'SANCTIONED' ? (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-red-600" />
                              <span className="text-red-700">ชี้มูลความผิด</span>
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                              <span className="text-amber-700">กำลังไต่สวน</span>
                            </>
                          )}
                        </span>
                      </div>
                      <div className="text-slate-500 mt-0.5">{c.legalBasis}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-start sm:items-center gap-2">
            <Gavel className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5 sm:mt-0" />
            <span>เมื่อดำรงตำแหน่ง ส.ส. คุณสามารถใช้การ์ดด้านล่างเพื่อเสนอร่าง พ.ร.บ. หรือญัตติแก้รัฐธรรมนูญเข้าสภาได้</span>
          </div>
        </section>
      </div>

      {/* Bottom Section: Legislative Bill Pipeline */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">
              สารบบร่างพระราชบัญญัติและญัตติรัฐธรรมนูญในสภา
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ร่างกฎหมายจะเดินหน้าทีละขั้นตอนในแต่ละเทิร์นเมื่อสภามีองค์ประชุมครบกึ่งหนึ่ง
            </p>
          </div>
          <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
        </div>

        {/* Mobile Stacked List (< md) */}
        <div className="md:hidden divide-y divide-slate-200 text-xs">
          {state.bills.map((bill) => (
            <div key={bill.id} className="py-3.5 first:pt-0 space-y-1.5">
              <div className="font-bold text-slate-900 text-sm leading-snug">{bill.title}</div>
              <p className="text-slate-600">{bill.description}</p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-500 pt-0.5">
                <span>ผู้เสนอ: <strong className="text-slate-700">{bill.proposerName}</strong></span>
                <span aria-hidden="true">·</span>
                <span
                  className={
                    bill.status === BillStatus.PROMULGATED
                      ? 'text-emerald-700 font-semibold'
                      : bill.status === BillStatus.REJECTED
                      ? 'text-red-700 font-semibold'
                      : 'text-blue-700 font-medium'
                  }
                >
                  {BILL_STATUS_LABELS[bill.status]}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                <span className="font-mono tabular-nums text-slate-700">
                  ผลโหวต:{' '}
                  {bill.yesVotes > 0 || bill.noVotes > 0
                    ? `${bill.yesVotes} เห็นชอบ / ${bill.noVotes} ไม่เห็นชอบ (งด ${bill.abstainVotes})`
                    : 'รอลงมติ'}
                </span>
                <span className="text-slate-500">ผลกระทบ: {bill.effectsSummary}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tablet & Desktop Table (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2.5 pr-4 font-semibold">ชื่อร่างกฎหมาย / ญัตติ</th>
                <th className="py-2.5 px-4 font-semibold">ผู้เสนอ</th>
                <th className="py-2.5 px-4 font-semibold">สถานะตามกระบวนการนิติบัญญัติ</th>
                <th className="py-2.5 px-4 font-semibold text-right">ผลโหวตล่าสุด (เห็นชอบ/ไม่เห็นชอบ)</th>
                <th className="py-2.5 pl-4 font-semibold">ผลกระทบเมื่อบังคับใช้</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {state.bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-50/80">
                  <td className="py-3 pr-4 font-semibold text-slate-900 max-w-xs">
                    <div>{bill.title}</div>
                    <div className="font-normal text-slate-500 mt-0.5">{bill.description}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{bill.proposerName}</td>
                  <td className="py-3 px-4 whitespace-nowrap font-medium">
                    <span
                      className={
                        bill.status === BillStatus.PROMULGATED
                          ? 'text-emerald-700 font-semibold'
                          : bill.status === BillStatus.REJECTED
                          ? 'text-red-700 font-semibold'
                          : 'text-blue-700'
                      }
                    >
                      {BILL_STATUS_LABELS[bill.status]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap text-slate-700">
                    {bill.yesVotes > 0 || bill.noVotes > 0
                      ? `${bill.yesVotes} / ${bill.noVotes} (งด ${bill.abstainVotes})`
                      : 'รอลงมติ'}
                  </td>
                  <td className="py-3 pl-4 text-slate-600 max-w-xs">{bill.effectsSummary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
