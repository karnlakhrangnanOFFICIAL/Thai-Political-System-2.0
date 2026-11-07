import React, { useState } from 'react';
import { CheckCircle2, Lock, MapPin, ShieldAlert, TrendingUp, Users } from 'lucide-react';
import { ECT_REGIONS_SPEC } from '../data/ectRegions';
import { checkRoleEligibility, getPartyMembershipDays } from '../engines/legalEngine';
import { ActiveBoardTab, GameState, PlayerRole, RegionId } from '../types/game';
import { ROLE_LABELS_TH } from '../utils/storage';
import { CareerAchievementsStrip } from './CareerAchievements';
import { PartyLogo } from './PartyLogo';
import { ScandalRiskMeter } from './ScandalRiskMeter';
import {
  SelectedConstituencyInfo,
  ThailandElectoralMap,
} from './ThailandElectoralMap';

interface StrategicBoardViewProps {
  state: GameState;
  onSelectRegion: (regionId: RegionId) => void;
  onJumpToTab: (tab: ActiveBoardTab) => void;
  onOpenAchievementsModal: () => void;
}

export const StrategicBoardView: React.FC<StrategicBoardViewProps> = ({
  state,
  onSelectRegion,
  onJumpToTab,
  onOpenAchievementsModal,
}) => {
  const [selectedConstituency, setSelectedConstituency] =
    useState<SelectedConstituencyInfo | null>(null);

  const selectedRegion =
    state.regions.find((r) => r.id === state.selectedRegionId) || state.regions[0];
  const dominantParty = state.parties.find((p) => p.id === selectedRegion.dominantPartyId);
  const playerParty = state.parties.find((p) => p.id === state.player.partyId);
  const memberDays = getPartyMembershipDays(state.player, state.dayTick);

  const mpEligibility = checkRoleEligibility(
    state.player,
    state.constitution,
    'MP_CANDIDATE',
    state.dayTick,
    state.isDissolutionElection,
    playerParty?.totalSeats || 0
  );
  const ministerEligibility = checkRoleEligibility(
    state.player,
    state.constitution,
    'MINISTER',
    state.dayTick,
    state.isDissolutionElection,
    playerParty?.totalSeats || 0
  );
  const pmEligibility = checkRoleEligibility(
    state.player,
    state.constitution,
    'PRIME_MINISTER',
    state.dayTick,
    state.isDissolutionElection,
    playerParty?.totalSeats || 0
  );

  const careerSteps: { title: string; subtitle: string; reached: boolean; current: boolean }[] = [
    {
      title: 'ประชาชน / อาชีพพลเรือน',
      subtitle: 'สร้างฐานการเงินและชื่อเสียงชุมชน',
      reached: true,
      current: state.player.role === PlayerRole.CITIZEN,
    },
    {
      title: 'สมาชิกพรรค / ท้องถิ่น',
      subtitle: `สังกัดพรรค ${memberDays}/${state.isDissolutionElection ? state.constitution.dissolutionPartyMembershipDays : state.constitution.normalPartyMembershipDays} วัน`,
      reached: Boolean(state.player.partyId) || state.player.role === PlayerRole.LOCAL_ADMIN,
      current:
        state.player.role === PlayerRole.PARTY_MEMBER ||
        state.player.role === PlayerRole.LOCAL_ADMIN ||
        state.player.role === PlayerRole.MP_CANDIDATE,
    },
    {
      title: 'สมาชิกสภาผู้แทนราษฎร (ส.ส.)',
      subtitle: 'เสนอร่าง พ.ร.บ. และตรวจสอบฝ่ายบริหาร',
      reached: state.player.isMP,
      current:
        state.player.role === PlayerRole.MP_OPPOSITION ||
        state.player.role === PlayerRole.MP_GOVERNMENT ||
        state.player.role === PlayerRole.OPPOSITION_LEADER,
    },
    {
      title: 'หัวหน้าพรรค / รัฐมนตรี',
      subtitle: 'เจรจาตั้งรัฐบาลและบริหารงบ 18 กระทรวง',
      reached:
        state.player.isPartyLeader ||
        state.player.role === PlayerRole.MINISTER ||
        state.player.role === PlayerRole.PRIME_MINISTER,
      current:
        state.player.role === PlayerRole.PARTY_LEADER || state.player.role === PlayerRole.MINISTER,
    },
    {
      title: 'นายกรัฐมนตรี',
      subtitle: `วาระสะสม ${(state.player.cumulativePMDays / 365).toFixed(1)}/${state.constitution.pmMaxCumulativeYears} ปี`,
      reached: state.player.role === PlayerRole.PRIME_MINISTER,
      current: state.player.role === PlayerRole.PRIME_MINISTER,
    },
  ];

  const activeProvinceForRegion =
    selectedConstituency && selectedConstituency.regionId === selectedRegion.id
      ? selectedConstituency
      : null;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top 3-Layer Summary Strip: 1 col mobile, 2 cols tablet, 4 cols desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Layer 01 · สถานะรัฐธรรมนูญและสภา</div>
          <div className="mt-1 text-base sm:text-lg font-bold text-slate-900 font-display">
            {state.parliamentStatus === 'ACTIVE' ? 'สมัยประชุมปกติ' : 'ยุบสภา · รัฐบาลรักษาการ'}
          </div>
          <div className="mt-1 text-xs text-slate-600 font-mono tabular-nums">
            องค์ประชุมล่าสุด {state.lastQuorumPresent}/{state.constitution.totalSeats} · เลือกตั้งใน {state.monthsUntilElection} เดือน
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Layer 02 · ดุลอำนาจและเสถียรภาพรัฐบาล</div>
          <div className="mt-1 text-base sm:text-lg font-bold text-slate-900 font-display font-mono tabular-nums">
            รัฐบาล {state.coalitionSeatCount} / {state.constitution.totalSeats} เสียง
          </div>
          <div className="mt-1 text-xs text-slate-600 font-mono tabular-nums">
            เสถียรภาพ {state.governmentStability}% · ความขัดแย้งพรรคร่วม {state.politicalFrictionIndex}%
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">Layer 03 · เศรษฐกิจมหภาคและความเชื่อมั่น</div>
          <div className="mt-1 text-base sm:text-lg font-bold text-slate-900 font-display font-mono tabular-nums">
            GDP {state.economy.gdpGrowthPct >= 0 ? `+${state.economy.gdpGrowthPct}` : state.economy.gdpGrowthPct}% · เงินเฟ้อ {state.economy.inflationPct}%
          </div>
          <div className="mt-1 text-xs text-slate-600 font-mono tabular-nums">
            ความเชื่อมั่นผู้บริโภค {state.economy.consumerConfidence}/100 · ว่างงาน {state.economy.unemploymentPct}%
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs text-slate-500">สถานะตัวละคร 4 มิติและความเสี่ยง</div>
          <div className="mt-1 text-base sm:text-lg font-bold text-blue-700 font-display">
            คะแนนนิยมตัวคุณ {state.player.personalApproval}/100
          </div>
          <div className="mt-1 text-xs text-slate-600 font-mono tabular-nums">
            ชื่อเสียง {state.player.socialReputation} · จริยธรรม {state.player.integrityScore} · เสี่ยงข่าวฉาว {state.player.scandalRisk || 0}%
          </div>
        </div>
      </div>

      {/* Main Board Split: Expanded 6-Col Interactive Electoral Map + 6-Col Career & Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        {/* Left 6 Cols: Expanded Interactive Thailand Electoral District Map */}
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">
                แผนผังยุทธศาสตร์และรายงานเขตเลือกตั้ง กกต. (77 จังหวัด · {state.constitution.constituencySeats} เขต)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                แบ่ง 6 ภูมิภาคมาตรฐาน กกต. · ระบายสีพรรคนำระดับภาค · สลับดูแผนที่รายเขตและตารางรายชื่อจังหวัดได้ทันที
              </p>
            </div>
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
          </div>

          <ThailandElectoralMap
            state={state}
            onSelectRegion={onSelectRegion}
            selectedConstituency={selectedConstituency}
            onSelectConstituency={setSelectedConstituency}
          />

          {/* Selected Province, District & Region Detail Footer */}
          <div className="pt-3 border-t border-slate-200 space-y-2.5">
            {activeProvinceForRegion && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/90 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="text-sm font-bold text-slate-900">
                    จังหวัด{activeProvinceForRegion.provinceName}
                    {activeProvinceForRegion.districtNumber
                      ? ` · เขตเลือกตั้งที่ ${activeProvinceForRegion.districtNumber}`
                      : ''}
                  </div>
                  <span className="text-xs font-mono tabular-nums font-semibold text-blue-700">
                    รวม {activeProvinceForRegion.totalDistrictsInProvince} เขตในจังหวัดนี้
                  </span>
                </div>

                {/* Quick Constituency District Switcher for Selected Province */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  <span className="text-[11px] text-slate-500 whitespace-nowrap shrink-0">
                    สลับดูเขต:
                  </span>
                  {activeProvinceForRegion.districts.map((dNum) => {
                    const isCurrent = activeProvinceForRegion.districtNumber === dNum;
                    return (
                      <button
                        key={dNum}
                        type="button"
                        onClick={() =>
                          setSelectedConstituency({
                            ...activeProvinceForRegion,
                            districtNumber: dNum,
                          })
                        }
                        className={`min-h-[28px] min-w-[30px] px-2 rounded text-[11px] font-mono tabular-nums font-semibold shrink-0 transition-colors ${
                          isCurrent
                            ? 'bg-blue-700 text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {dNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="font-bold text-slate-900 text-sm">
                {ECT_REGIONS_SPEC[selectedRegion.id]?.ectOrder
                  ? `${ECT_REGIONS_SPEC[selectedRegion.id].ectOrder}. `
                  : ''}
                {selectedRegion.name}
                {selectedRegion.id === state.player.homeRegion && ' · พื้นที่ฐานเสียงบ้านเกิดของคุณ'}
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-600">
                {selectedRegion.provincesCount} จังหวัด · {selectedRegion.constituencySeats} เขตเลือกตั้ง
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-0.5 font-mono tabular-nums text-xs">
              <div className="p-2 bg-slate-50 rounded border border-slate-200/80">
                <div className="text-slate-500 font-sans text-[11px] truncate">นิยมรัฐบาล</div>
                <div className="font-bold text-slate-900 mt-0.5">{selectedRegion.govApproval}%</div>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200/80">
                <div className="text-slate-500 font-sans text-[11px] truncate">เศรษฐกิจพื้นที่</div>
                <div className="font-bold text-slate-900 mt-0.5">{selectedRegion.localEconomyScore}/100</div>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200/80">
                <div className="text-slate-500 font-sans text-[11px] truncate">โครงสร้างพื้นฐาน</div>
                <div className="font-bold text-slate-900 mt-0.5">{selectedRegion.infrastructureScore}/100</div>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200/80">
                <div className="text-slate-500 font-sans text-[11px] truncate">ความวุ่นวาย</div>
                <div className={`font-bold mt-0.5 ${selectedRegion.chaosScore > 50 ? 'text-red-600' : 'text-slate-900'}`}>
                  {selectedRegion.chaosScore.toFixed(0)}/100
                </div>
              </div>
            </div>

            {selectedRegion.activeCrisis && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                <span>
                  <strong>ประเด็นร้อนประจำภาค:</strong> {selectedRegion.activeCrisis}
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 pt-1">
              <span className="inline-flex items-center gap-1.5">
                <span>พรรคครองฐานเสียงนำประจำภาค:</span>
                {dominantParty ? (
                  <>
                    <PartyLogo party={dominantParty} size="xs" />
                    <strong className="text-slate-900">{dominantParty.name}</strong>
                  </>
                ) : (
                  <strong className="text-slate-900">-</strong>
                )}
              </span>
              <button
                type="button"
                onClick={() => onJumpToTab(ActiveBoardTab.ELECTION_PARTIES)}
                className="min-h-[36px] py-1 text-blue-700 font-semibold hover:underline whitespace-nowrap shrink-0"
              >
                ดูข้อมูลทั้ง 57 พรรค →
              </button>
            </div>
          </div>
        </section>

        {/* Right 6 Cols: Scandal Risk Meter, Career Ladder, Achievements, and Voter Demographics */}
        <div className="lg:col-span-6 flex flex-col gap-5 sm:gap-6">
          {/* Dedicated Scandal Risk Meter */}
          <ScandalRiskMeter state={state} />

          {/* Career Progression & Constitutional Qualification Check */}
          <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">
                  เส้นทางไต่เต้าทางการเมืองและการตรวจสอบคุณสมบัติตามกฎหมาย
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ตำแหน่งปัจจุบัน: {ROLE_LABELS_TH[state.player.role]} · อายุ {state.player.ageYears} ปี · ประสบการณ์ {state.player.politicalExperience}/100
                </p>
              </div>
              <TrendingUp className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
            </div>

            {/* 5-Stage Progression Track: responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 mb-5">
              {careerSteps.map((step, i) => (
                <div
                  key={step.title}
                  className={`p-3 sm:p-2.5 rounded-lg border text-xs ${
                    step.current
                      ? 'border-blue-700 bg-blue-50/70 text-slate-900'
                      : step.reached
                      ? 'border-emerald-300 bg-emerald-50/40 text-slate-800'
                      : 'border-slate-200 bg-slate-50/60 text-slate-500'
                  }`}
                >
                  <div className="font-mono tabular-nums text-[11px] text-slate-400">ขั้นที่ 0{i + 1}</div>
                  <div className="font-bold mt-0.5 leading-snug">{step.title}</div>
                  <div className="text-[11px] mt-1 opacity-85">{step.subtitle}</div>
                </div>
              ))}
            </div>

            {/* Real-Time Role Qualification Matrix (Layer 01) */}
            <div className="divide-y divide-slate-100 border-t border-slate-100 pt-2 text-xs">
              {[
                { label: 'คุณสมบัติผู้สมัคร ส.ส. (ม.97)', check: mpEligibility },
                { label: 'คุณสมบัติรัฐมนตรี (ม.160)', check: ministerEligibility },
                { label: 'คุณสมบัติแคนดิเดตนายกรัฐมนตรี (ม.158-159)', check: pmEligibility },
              ].map((row) => (
                <div key={row.label} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                  <span className="font-semibold text-slate-700">{row.label}</span>
                  <span
                    className={`flex items-start sm:items-center gap-1.5 ${
                      row.check.valid ? 'text-emerald-700 font-medium' : 'text-amber-700'
                    }`}
                  >
                    {row.check.valid ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 sm:mt-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 sm:mt-0" />
                    )}
                    <span>{row.check.reason}</span>
                  </span>
                </div>
              ))}
            </div>

            {state.player.legalDisqualified && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  คุณอยู่ระหว่างถูกพักสิทธิทางการเมือง ({state.player.disqualificationReason}) แต่ยังสามารถเล่นการ์ดพัฒนาอาชีพและทุนทางสังคมเพื่อเตรียมกลับมาลงสนามได้
                </span>
              </div>
            )}
          </section>

          {/* Career Achievements Visual Badges & Milestone Progress */}
          <CareerAchievementsStrip state={state} onOpenModal={onOpenAchievementsModal} />

          {/* 6 Socio-Economic Voter Demographics */}
          <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex-1">
            <div className="flex items-start justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">
                  ความพึงพอใจของประชาชน 6 กลุ่มเศรษฐกิจและสังคม
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ดัชนีคุณภาพชีวิตรวม {state.economy.qualityOfLifeIndex}/100 · สัมประสิทธิ์ความเหลื่อมล้ำ Gini {state.economy.inequalityGini}
                </p>
              </div>
              <Users className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
            </div>

            <div className="space-y-3.5">
              {state.demographics.map((demo) => (
                <div key={demo.id} className="space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{demo.name}</span>
                      <span className="text-slate-400 mx-1.5" aria-hidden="true">·</span>
                      <span className="text-slate-500">สัดส่วน {demo.populationSharePct}% · กังวล: {demo.topConcern}</span>
                    </div>
                    <div className="font-mono tabular-nums text-slate-700 shrink-0">
                      พอใจรัฐบาล <strong>{demo.govSatisfaction}%</strong> · หนุนคุณ <strong className="text-blue-700">{demo.playerSupport}%</strong>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-600 transition-transform duration-200 origin-left"
                      style={{ width: `${demo.govSatisfaction}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
