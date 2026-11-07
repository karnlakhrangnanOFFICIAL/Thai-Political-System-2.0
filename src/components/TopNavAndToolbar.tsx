import React from 'react';
import {
  ArrowRight,
  Award,
  Briefcase,
  FolderOpen,
  Landmark,
  Layers,
  Map,
  Newspaper,
  RotateCcw,
  Scale,
  Volume2,
  VolumeX,
  Vote,
} from 'lucide-react';
import { ACHIEVEMENT_DEFINITIONS } from '../engines/achievementEngine';
import { getPartyMembershipDays } from '../engines/legalEngine';
import { ActiveBoardTab, GameState } from '../types/game';
import { formatThaiDate, ROLE_LABELS_TH } from '../utils/storage';
import { PartyLogo } from './PartyLogo';
import { getScandalRiskStatus } from './ScandalRiskMeter';

interface TopNavAndToolbarProps {
  state: GameState;
  onSelectTab: (tab: ActiveBoardTab) => void;
  onAdvanceTurn: () => void;
  onOpenSaveModal: () => void;
  onOpenConstitutionModal: () => void;
  onOpenAchievementsModal: () => void;
  onToggleSound: () => void;
  onReturnToTitle: () => void;
}

const NAV_ITEMS: {
  tab: ActiveBoardTab;
  label: string;
  mobileLabel: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    tab: ActiveBoardTab.STRATEGIC_MAP,
    label: 'กระดานยุทธศาสตร์',
    mobileLabel: 'ยุทธศาสตร์',
    Icon: Map,
  },
  {
    tab: ActiveBoardTab.PARLIAMENT_LAW,
    label: 'รัฐสภาและกฎหมาย',
    mobileLabel: 'รัฐสภา',
    Icon: Landmark,
  },
  {
    tab: ActiveBoardTab.CABINET_ECONOMY,
    label: 'รัฐบาลและงบประมาณ',
    mobileLabel: 'รัฐบาล/งบ',
    Icon: Briefcase,
  },
  {
    tab: ActiveBoardTab.ELECTION_PARTIES,
    label: 'เลือกตั้งและพรรค',
    mobileLabel: 'พรรค/เลือกตั้ง',
    Icon: Vote,
  },
  {
    tab: ActiveBoardTab.NEWS_AUDIT,
    label: 'ข่าวและประวัติ',
    mobileLabel: 'ข่าว/ประวัติ',
    Icon: Newspaper,
  },
];

export const TopNavAndToolbar: React.FC<TopNavAndToolbarProps> = ({
  state,
  onSelectTab,
  onAdvanceTurn,
  onOpenSaveModal,
  onOpenConstitutionModal,
  onOpenAchievementsModal,
  onToggleSound,
  onReturnToTitle,
}) => {
  const playerParty = state.parties.find((p) => p.id === state.player.partyId);
  const memberDays = getPartyMembershipDays(state.player, state.dayTick);
  const unlockedCount = state.unlockedAchievements?.length || 0;
  const riskStatus = getScandalRiskStatus(state.player.scandalRisk);

  return (
    <>
      <div className="bg-white border-b border-slate-200">
        {/* Strict 1-Row 3-Zone Top Bar Contract */}
        <header className="max-w-[1440px] mx-auto flex items-center justify-between gap-4 lg:gap-8 px-4 sm:px-6 py-3 sm:py-3.5">
          {/* Zone 1: Single Text Wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab(ActiveBoardTab.STRATEGIC_MAP);
            }}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
          >
            KKP Life Simulator
          </a>

          {/* Zone 2: 5 Concise Single-Line Navigation Links (Desktop lg+) */}
          <nav
            aria-label="เมนูหลักกระดานการเมือง"
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            {NAV_ITEMS.map((item) => {
              const active = state.activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => onSelectTab(item.tab)}
                  className={`py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'text-blue-700 font-semibold underline underline-offset-8 decoration-2'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action Button */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onAdvanceTurn}
              className="min-h-[42px] sm:min-h-[40px] px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 active:scale-[0.99] transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 sm:gap-2"
            >
              <span>จบสัปดาห์นี้</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </header>

        {/* Tablet Navigation Strip (md to lg only; Mobile uses Fixed Bottom Tab Bar) */}
        <nav
          aria-label="แถบสลับหน้าจอบนแท็บเล็ต"
          className="hidden md:flex lg:hidden items-center gap-2 px-4 sm:px-6 py-2 border-t border-slate-100 bg-white overflow-x-auto no-scrollbar"
        >
          {NAV_ITEMS.map((item) => {
            const active = state.activeTab === item.tab;
            const Icon = item.Icon;
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => onSelectTab(item.tab)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  active
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Workspace Context & Three-Tier Separate Finances Strip */}
        <div className="border-t border-slate-100 bg-slate-50/80">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-2.5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-2.5 xl:gap-4 text-xs text-slate-600">
            {/* Player Identity & Time */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold text-slate-900">{state.player.name}</span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-blue-700">{ROLE_LABELS_TH[state.player.role]}</span>
              <span aria-hidden="true">·</span>
              {playerParty ? (
                <span className="inline-flex items-center gap-1.5">
                  <PartyLogo party={playerParty} size="xs" />
                  <span>
                    {playerParty.shortName} (สังกัด {memberDays} วัน)
                  </span>
                </span>
              ) : (
                <span>ยังไม่สังกัดพรรค</span>
              )}
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <span className="w-full sm:w-auto font-mono tabular-nums text-slate-700">
                สัปดาห์ที่ {state.weekInMonth || 1} {formatThaiDate(state.monthIndex, state.yearBE)} (เทิร์น {state.turn} / เลือกตั้งใน {state.monthsUntilElection} เดือน)
              </span>
            </div>

            {/* 3 Separate Financial Ledgers + AP + Workspace Controls */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between xl:justify-end gap-2.5 sm:gap-4 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-200/70">
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-3 gap-y-1 font-mono tabular-nums text-slate-700">
                <span title="แต้มดำเนินการประจำเทิร์น">
                  AP: <strong className="text-blue-700">{state.actionPoints}/{state.maxActionPoints}</strong>
                </span>
                <span aria-hidden="true" className="hidden sm:inline">·</span>
                <span title="กระเป๋าเงินส่วนตัว (แยกจากเงินพรรคและเงินรัฐ)" className="truncate">
                  เงินส่วนตัว: <strong className="text-slate-900">{state.player.finances.cash.toLocaleString()} ฿</strong>
                </span>
                {playerParty && (
                  <>
                    <span aria-hidden="true" className="hidden sm:inline">·</span>
                    <span title="งบประมาณพรรคต้นสังกัด" className="truncate">
                      งบพรรค: <strong className="text-slate-900">{playerParty.partyFundsMillion.toLocaleString()} ล้าน ฿</strong>
                    </span>
                  </>
                )}
                <span aria-hidden="true" className="hidden sm:inline">·</span>
                <span title="งบกลางสำรองแผ่นดิน" className="truncate">
                  งบกลางรัฐ: <strong className="text-slate-900">{state.stateFinances.centralReserveMillion.toLocaleString()} ล้าน ฿</strong>
                </span>
                <span aria-hidden="true" className="hidden sm:inline">·</span>
                <span
                  title="ดัชนีความเสี่ยงข่าวฉาว (หากแตะ 100% จะถูกเปิดไต่สวนสาธารณะทันที)"
                  className="col-span-2 sm:col-span-1 inline-flex items-center gap-1.5"
                >
                  <span>ความเสี่ยงข่าวฉาว:</span>
                  <strong className={riskStatus.textColorClass}>
                    {riskStatus.risk}% ({riskStatus.shortLabelTh})
                  </strong>
                  <span className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden inline-flex shrink-0">
                    <span
                      className={`h-full ${riskStatus.barColorClass}`}
                      style={{ width: `${riskStatus.risk}%` }}
                    />
                  </span>
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between sm:justify-start gap-1.5 sm:gap-2 sm:border-l sm:border-slate-200 sm:pl-3 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                <a
                  href="#card-tray"
                  className="md:hidden min-h-[38px] px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>การ์ด ({state.handCardIds.length})</span>
                </a>
                <button
                  type="button"
                  onClick={onOpenAchievementsModal}
                  className="min-h-[38px] sm:min-h-[34px] px-2.5 py-1.5 sm:py-1 text-xs font-semibold text-amber-800 hover:text-amber-950 hover:bg-amber-100/70 rounded-lg sm:rounded transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <Award className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-mono tabular-nums">
                    เกียรติประวัติ ({unlockedCount}/{ACHIEVEMENT_DEFINITIONS.length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onOpenConstitutionModal}
                  className="min-h-[38px] sm:min-h-[34px] px-2.5 py-1.5 sm:py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg sm:rounded transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>รัฐธรรมนูญ</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenSaveModal}
                  className="min-h-[38px] sm:min-h-[34px] px-2.5 py-1.5 sm:py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg sm:rounded transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>เซฟเกม</span>
                </button>
                <button
                  type="button"
                  onClick={onToggleSound}
                  aria-label={state.soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
                  className="min-h-[38px] min-w-[38px] sm:min-h-[34px] sm:min-w-[34px] p-1.5 sm:p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg sm:rounded transition-colors inline-flex items-center justify-center shrink-0"
                >
                  {state.soundEnabled ? <Volume2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> : <VolumeX className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={onReturnToTitle}
                  className="min-h-[38px] sm:min-h-[34px] px-2.5 py-1.5 sm:py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg sm:rounded transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline sm:inline">หน้าแรก</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Ergonomic Bottom Tab Bar (< md, strictly under 15% viewport height cap) */}
      <nav
        aria-label="แถบนำทางด้านล่างสำหรับมือถือ"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
      >
        <div className="grid grid-cols-5 items-center h-14 px-1">
          {NAV_ITEMS.map((item) => {
            const active = state.activeTab === item.tab;
            const Icon = item.Icon;
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => {
                  onSelectTab(item.tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors px-1 ${
                  active ? 'text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${active ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                <span className="text-[10px] leading-tight tracking-tight truncate max-w-full whitespace-nowrap">
                  {item.mobileLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
