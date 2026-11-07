import React, { useMemo, useState } from 'react';
import { Check, Search, Users2, Vote } from 'lucide-react';
import { GameState } from '../types/game';
import { getPartyLogoFilename, PARTY_LOGO_PROJECT_DIR } from '../utils/partyLogos';
import { PartyLogo } from './PartyLogo';

interface ElectionAndPartiesViewProps {
  state: GameState;
  onSelectPartyForAction: (partyId: string) => void;
  onDonatePersonalToParty: (partyId: string) => void;
}

type PartyFilter = 'ALL' | 'MAJOR' | 'MINOR' | 'COALITION' | 'OPPOSITION';

export const ElectionAndPartiesView: React.FC<ElectionAndPartiesViewProps> = ({
  state,
  onSelectPartyForAction,
  onDonatePersonalToParty,
}) => {
  const [filter, setFilter] = useState<PartyFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredParties = useMemo(() => {
    return state.parties
      .filter((p) => {
        if (filter === 'MAJOR' && !p.isMajor) return false;
        if (filter === 'MINOR' && p.isMajor) return false;
        if (filter === 'COALITION' && !p.inCoalition) return false;
        if (filter === 'OPPOSITION' && p.inCoalition) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const svgName = getPartyLogoFilename(p).toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            p.shortName.toLowerCase().includes(q) ||
            p.ideology.label.toLowerCase().includes(q) ||
            p.leader.name.toLowerCase().includes(q) ||
            svgName.includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.totalSeats - a.totalSeats || b.nationalPopularity - a.nationalPopularity);
  }, [state.parties, filter, searchQuery]);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Latest Election Summary Banner / Audit Breakdown */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">
              ระบบเลือกตั้งทั่วไปและบัญชีตรวจสอบที่นั่ง ส.ส. ({state.constitution.constituencySeats} เขต + {state.constitution.partyListSeats} บัญชีรายชื่อ)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              กำหนดการเลือกตั้งทั่วไปครั้งถัดไปในอีก {state.monthsUntilElection} เดือน · {state.isDissolutionElection ? 'โหมดเลือกตั้งหลังยุบสภา (สังกัดพรรคขั้นต่ำ 30 วัน)' : `โหมดครบวาระปกติ (สังกัดพรรคขั้นต่ำ ${state.constitution.normalPartyMembershipDays} วัน)`}
            </p>
          </div>
          <Vote className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
        </div>

        {state.lastElectionResult ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-mono tabular-nums">
              <span>การเลือกตั้งครั้งที่ {state.lastElectionResult.electionNumber} ({state.lastElectionResult.dateLabel})</span>
              <span aria-hidden="true">·</span>
              <span>ผู้มาใช้สิทธิ {state.lastElectionResult.turnoutPct}%</span>
              <span aria-hidden="true">·</span>
              <span>บัตรดีรวม {state.lastElectionResult.totalValidPartyListVotes.toLocaleString()} คะแนน</span>
              <span aria-hidden="true">·</span>
              <span>ค่าเฉลี่ยต่อ ส.ส. บัญชีรายชื่อ 1 คน: {state.lastElectionResult.quotaPerPartyListSeat.toLocaleString()} คะแนน</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs font-mono tabular-nums">
              {state.lastElectionResult.partyBreakdowns.slice(0, 5).map((row) => {
                const partyRef = state.parties.find((p) => p.id === row.partyId);
                return (
                  <div key={row.partyId} className="p-3 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      {partyRef && <PartyLogo party={partyRef} size="sm" />}
                      <div className="font-sans font-bold text-slate-900 truncate">{row.partyName}</div>
                    </div>
                    <div className="text-slate-600 mt-1">
                      รวม <strong>{row.totalSeats}</strong> (เขต {row.constituencySeats} + ปาร์ตี้ลิสต์ {row.partyListSeats})
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {row.partyListVotes.toLocaleString()} คะแนน
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-600 leading-relaxed">
            สภาชุดปัจจุบันกำลังปฏิบัติหน้าที่ · โฟลเดอร์โลโก้พรรคเชื่อมโยงที่ <strong className="font-mono break-all">{PARTY_LOGO_PROJECT_DIR}</strong> (ไฟล์ <span className="font-mono">pty_01.svg</span> ถึง <span className="font-mono">pty_57.svg</span>) โดยจะแสดงสีสำรองอัตโนมัติจนกว่าจะอัปโหลดไฟล์ .svg ของพรรคนั้น
          </p>
        )}
      </section>

      {/* Full 57-Party Directory */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display flex items-center gap-2">
              <span>ทะเบียนพรรคการเมืองและไฟล์โลโก้ทั้ง 57 พรรค</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              แสดงผล {filteredParties.length} จาก {state.parties.length} พรรค · พรรคเป้าหมายที่คุณเลือกไว้: {state.parties.find((p) => p.id === state.selectedPartyIdForAction)?.name}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 w-full xl:w-auto">
            {/* Functional Segmented Filter Control (Horizontally scrollable on narrow mobile) */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs overflow-x-auto no-scrollbar max-w-full">
              {(
                [
                  { id: 'ALL', label: 'ทั้งหมด (57)' },
                  { id: 'MAJOR', label: 'พรรคหลัก (10)' },
                  { id: 'MINOR', label: 'พรรคเล็ก (47)' },
                  { id: 'COALITION', label: 'ร่วมรัฐบาล' },
                  { id: 'OPPOSITION', label: 'ฝ่ายค้าน' },
                ] as { id: PartyFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`min-h-[36px] sm:min-h-[32px] px-3 sm:px-2.5 py-1.5 sm:py-1 font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    filter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Live Search */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อพรรค / pty_01.svg..."
                className="w-full min-h-[40px] sm:min-h-[36px] pl-8 pr-3 py-2 sm:py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {filteredParties.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">
            ไม่พบพรรคการเมืองที่ตรงกับคำค้นหา
          </div>
        ) : (
          <>
            {/* Mobile Touch List (< md) */}
            <div className="md:hidden divide-y divide-slate-200 max-h-[540px] overflow-y-auto pr-0.5 text-xs">
              {filteredParties.map((party) => {
                const isPlayerMember = state.player.partyId === party.id;
                const isSelectedTarget = state.selectedPartyIdForAction === party.id;
                const svgFilename = getPartyLogoFilename(party);

                return (
                  <div key={party.id} className="py-3.5 first:pt-0 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <PartyLogo party={party} size="md" />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-sm truncate">
                            {party.name}
                            {isPlayerMember && ' · สังกัดของคุณ'}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {party.leader.name} · {party.ideology.label}
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono tabular-nums shrink-0">
                        <div className="font-bold text-slate-900 text-sm">{party.totalSeats} ที่นั่ง</div>
                        <div className="text-[11px] text-slate-500">
                          ({party.constituencySeats}+{party.partyListSeats})
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-600 font-mono tabular-nums">
                      <span className="font-sans">
                        {party.totalSeats === 0 ? (
                          <span className="text-slate-500">นอกสภา</span>
                        ) : party.inCoalition ? (
                          <span className="text-emerald-700 font-semibold">ร่วมรัฐบาล</span>
                        ) : (
                          <span className="text-slate-700 font-medium">ฝ่ายค้าน</span>
                        )}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>นิยม {party.nationalPopularity}%</span>
                      <span aria-hidden="true">·</span>
                      <span>เอกภาพ {party.internalUnity}%</span>
                      <span aria-hidden="true">·</span>
                      <span>งบ {party.partyFundsMillion} ล.฿</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-400">{svgFilename}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      {!state.player.partyId && (
                        <button
                          type="button"
                          onClick={() => onSelectPartyForAction(party.id)}
                          className={`flex-1 min-h-[40px] px-3 py-2 rounded-lg border text-xs font-medium transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
                            isSelectedTarget
                              ? 'border-blue-700 bg-blue-50 text-blue-700 font-semibold'
                              : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isSelectedTarget && <Check className="w-3.5 h-3.5 shrink-0" />}
                          <span>{isSelectedTarget ? 'เลือกไว้แล้ว' : 'เลือกพรรคนี้'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDonatePersonalToParty(party.id)}
                        disabled={state.player.finances.cash < 10000}
                        title="บริจาคเงินส่วนตัว 10,000 บาท เข้ากองทุนพรรคอย่างถูกกฎหมายตาม พ.ร.ป. พรรคการเมือง"
                        className="flex-1 min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <Users2 className="w-3.5 h-3.5 shrink-0" />
                        <span>บริจาค 10k ฿</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tablet & Desktop Table (md+) */}
            <div className="hidden md:block overflow-x-auto max-h-[460px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-white border-b border-slate-200 text-slate-500 z-10">
                  <tr>
                    <th className="py-2.5 pr-3 font-semibold">โลโก้และชื่อพรรคการเมือง</th>
                    <th className="py-2.5 px-3 font-semibold">หัวหน้าพรรค · อุดมการณ์</th>
                    <th className="py-2.5 px-3 font-semibold">สถานะสภา</th>
                    <th className="py-2.5 px-3 font-semibold text-right">ส.ส. (เขต+บัญชี)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">ความนิยม / เอกภาพ</th>
                    <th className="py-2.5 pl-3 font-semibold text-right">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParties.map((party) => {
                    const isPlayerMember = state.player.partyId === party.id;
                    const isSelectedTarget = state.selectedPartyIdForAction === party.id;
                    const svgFilename = getPartyLogoFilename(party);

                    return (
                      <tr key={party.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-3">
                            <PartyLogo party={party} size="md" />
                            <div>
                              <div className="font-bold text-slate-900">
                                {party.name}
                                {isPlayerMember && ' · สังกัดของคุณ'}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                <span className="font-mono text-slate-600">{svgFilename}</span>
                                <span aria-hidden="true"> · </span>
                                <span>{party.isMajor ? 'พรรคขนาดใหญ่' : 'พรรคขนาดเล็ก'} · งบพรรค {party.partyFundsMillion} ล้าน ฿</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 max-w-xs">
                          <div className="font-medium text-slate-800">{party.leader.name}</div>
                          <div className="text-slate-500 truncate">{party.ideology.label}</div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {party.totalSeats === 0 ? (
                            <span className="text-slate-500">นอกสภา</span>
                          ) : party.inCoalition ? (
                            <span className="text-emerald-700 font-semibold">ร่วมรัฐบาล</span>
                          ) : (
                            <span className="text-slate-700 font-medium">ฝ่ายค้าน</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                          <strong className="text-slate-900">{party.totalSeats}</strong>{' '}
                          <span className="text-slate-500">({party.constituencySeats}+{party.partyListSeats})</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap text-slate-700">
                          {party.nationalPopularity}% · เอกภาพ {party.internalUnity}%
                        </td>
                        <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            {!state.player.partyId && (
                              <button
                                type="button"
                                onClick={() => onSelectPartyForAction(party.id)}
                                className={`min-h-[34px] px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors inline-flex items-center gap-1 ${
                                  isSelectedTarget
                                    ? 'border-blue-700 bg-blue-50 text-blue-700 font-semibold'
                                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {isSelectedTarget && <Check className="w-3 h-3" />}
                                <span>{isSelectedTarget ? 'เลือกไว้แล้ว' : 'เลือกพรรคนี้'}</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onDonatePersonalToParty(party.id)}
                              disabled={state.player.finances.cash < 10000}
                              title="บริจาคเงินส่วนตัว 10,000 บาท เข้ากองทุนพรรคอย่างถูกกฎหมายตาม พ.ร.ป. พรรคการเมือง"
                              className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 text-xs font-medium inline-flex items-center gap-1"
                            >
                              <Users2 className="w-3 h-3" />
                              <span>บริจาค 10k ฿</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
};
