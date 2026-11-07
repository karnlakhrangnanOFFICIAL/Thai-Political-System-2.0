import React, { useMemo, useState } from 'react';
import { Award, CheckCircle2, Lock, X } from 'lucide-react';
import {
  ACHIEVEMENT_DEFINITIONS,
  AchievementDefinition,
  calculateAchievementPoints,
  EmblemMotif,
  ensureAchievementFields,
  loadGlobalUnlockedAchievements,
} from '../engines/achievementEngine';
import { AchievementCategory, AchievementTier, GameState } from '../types/game';
import { ROLE_LABELS_TH } from '../utils/storage';

/* ==================== 1. HANDCRAFTED VECTOR MEDALLION EMBLEMS ==================== */
interface AchievementEmblemProps {
  motif: EmblemMotif;
  tier: AchievementTier;
  unlocked: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const TIER_PALETTES: Record<
  AchievementTier,
  { outer: string; innerFill: string; accent: string; fg: string }
> = {
  BRONZE: {
    outer: '#9A5B25',
    innerFill: '#FFFBEB',
    accent: '#D97706',
    fg: '#78350F',
  },
  SILVER: {
    outer: '#475569',
    innerFill: '#F8FAFC',
    accent: '#64748B',
    fg: '#1E293B',
  },
  GOLD: {
    outer: '#B45309',
    innerFill: '#FEFCE8',
    accent: '#F59E0B',
    fg: '#92400E',
  },
  PLATINUM: {
    outer: '#1D4ED8',
    innerFill: '#EFF6FF',
    accent: '#3B82F6',
    fg: '#1E3A8A',
  },
};

export const AchievementEmblemSVG: React.FC<AchievementEmblemProps> = ({
  motif,
  tier,
  unlocked,
  size = 'md',
}) => {
  const dim = size === 'sm' ? 40 : size === 'lg' ? 56 : 48;
  const pal = unlocked
    ? TIER_PALETTES[tier]
    : {
        outer: '#CBD5E1',
        innerFill: '#F8FAFC',
        accent: '#E2E8F0',
        fg: '#94A3B8',
      };

  const renderInnerMotif = () => {
    switch (motif) {
      case 'BALLOT_CROWN':
        return (
          <g stroke={pal.fg} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <rect x="18" y="27" width="20" height="13" rx="1.5" fill={unlocked ? pal.accent : 'none'} fillOpacity={unlocked ? 0.18 : 0} />
            <line x1="22" y1="27" x2="34" y2="27" />
            <path d="M24 27V19h8v8" />
            <polyline points="25.5 23 27.5 25 31 21" />
            <path d="M21 16l3.5 2.5L28 14l3.5 4.5L35 16" />
          </g>
        );
      case 'TREASURY_HEX':
        return (
          <g stroke={pal.fg} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polygon
              points="28,15 39,21.5 39,34.5 28,41 17,34.5 17,21.5"
              fill={unlocked ? pal.accent : 'none'}
              fillOpacity={unlocked ? 0.18 : 0}
            />
            <line x1="28" y1="20" x2="28" y2="36" />
            <path d="M31.5 23.5c0-1.5-1.5-2.5-3.5-2.5s-3.5 1-3.5 2.5 1.5 2 3.5 2.5 3.5 1 3.5 2.5-1.5 2.5-3.5 2.5-3.5-1-3.5-2.5" />
          </g>
        );
      case 'CLEAN_SCALE':
        return (
          <g stroke={pal.fg} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="28" y1="16" x2="28" y2="39" />
            <line x1="22" y1="39" x2="34" y2="39" />
            <line x1="18" y1="22" x2="38" y2="22" />
            <path d="M18 22l-3 7h6l-3-7z" fill={unlocked ? pal.accent : 'none'} fillOpacity={unlocked ? 0.22 : 0} />
            <path d="M38 22l-3 7h6l-3-7z" fill={unlocked ? pal.accent : 'none'} fillOpacity={unlocked ? 0.22 : 0} />
            <circle cx="28" cy="16" r="2" fill={pal.fg} />
          </g>
        );
      case 'CIVIC_LOTUS':
        return (
          <g stroke={pal.fg} strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M28 17c3.5 4.5 4.5 9.5 0 15-4.5-5.5-3.5-10.5 0-15z"
              fill={unlocked ? pal.accent : 'none'}
              fillOpacity={unlocked ? 0.22 : 0}
            />
            <path d="M28 32c4-1 8-4.5 9-9.5-4.5.5-7.5 3.5-9 9.5z" />
            <path d="M28 32c-4-1-8-4.5-9-9.5 4.5.5 7.5 3.5 9 9.5z" />
            <path d="M20 36c4.5 2 11.5 2 16 0" />
          </g>
        );
      case 'PARTY_SHIELD':
        return (
          <g stroke={pal.fg} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M28 16l11 4.5v7.5c0 6.5-4.6 10.8-11 13-6.4-2.2-11-6.5-11-13v-7.5L28 16z"
              fill={unlocked ? pal.accent : 'none'}
              fillOpacity={unlocked ? 0.18 : 0}
            />
            <polyline points="23.5 28 26.8 31.2 33 24.8" />
          </g>
        );
      case 'LOCAL_SEAL':
        return (
          <g stroke={pal.fg} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 37h20" />
            <rect x="21" y="25" width="14" height="12" fill={unlocked ? pal.accent : 'none'} fillOpacity={unlocked ? 0.18 : 0} />
            <polygon points="28,17 18,25 38,25" />
            <line x1="28" y1="29" x2="28" y2="37" />
          </g>
        );
      case 'PARLIAMENT_DOME':
        return (
          <g stroke={pal.fg} strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="16" y1="38" x2="40" y2="38" />
            <path
              d="M20 38v-8h16v8"
              fill={unlocked ? pal.accent : 'none'}
              fillOpacity={unlocked ? 0.18 : 0}
            />
            <path d="M22 30c0-4.5 2.7-8 6-9.5 3.3 1.5 6 5 6 9.5" />
            <line x1="28" y1="15" x2="28" y2="20.5" />
            <line x1="24" y1="30" x2="24" y2="38" />
            <line x1="32" y1="30" x2="32" y2="38" />
          </g>
        );
      case 'LEADER_STAR':
        return (
          <g stroke={pal.fg} strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polygon
              points="28,16 31.4,23.2 39.2,24.2 33.5,29.6 34.9,37.4 28,33.6 21.1,37.4 22.5,29.6 16.8,24.2 24.6,23.2"
              fill={unlocked ? pal.accent : 'none'}
              fillOpacity={unlocked ? 0.25 : 0}
            />
          </g>
        );
      case 'GAVEL_SCROLL':
        return (
          <g stroke={pal.fg} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <rect
              x="21"
              y="18"
              width="10"
              height="6"
              rx="1"
              transform="rotate(-35 26 21)"
              fill={unlocked ? pal.accent : 'none'}
              fillOpacity={unlocked ? 0.22 : 0}
            />
            <line x1="27" y1="23" x2="37" y2="33" />
            <line x1="18" y1="38" x2="31" y2="38" />
          </g>
        );
      case 'COALITION_KNOT':
        return (
          <g stroke={pal.fg} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="24" cy="26" r="6" fill={unlocked ? pal.accent : 'none'} fillOpacity={unlocked ? 0.16 : 0} />
            <circle cx="32" cy="26" r="6" fill={unlocked ? pal.accent : 'none'} fillOpacity={unlocked ? 0.16 : 0} />
            <circle cx="28" cy="32" r="6" />
          </g>
        );
      case 'PM_CREST':
        return (
          <g stroke={pal.fg} strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polygon
              points="28,15 34,21 40,21 36,28 38,36 28,33 18,36 20,28 16,21 22,21"
              fill={unlocked ? pal.accent : 'none'}
              fillOpacity={unlocked ? 0.24 : 0}
            />
            <circle cx="28" cy="26.5" r="3.5" fill={unlocked ? pal.fg : 'none'} />
          </g>
        );
      case 'STATESMAN_LAUREL':
        return (
          <g stroke={pal.fg} strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M25 38c-5.5-2.5-8-7.5-7.5-14.5" />
            <path d="M31 38c5.5-2.5 8-7.5 7.5-14.5" />
            <polygon
              points="28,17 30.5,22.5 36.5,23.2 32,27.2 33.2,33 28,30 22.8,33 24,27.2 19.5,23.2 25.5,22.5"
              fill={unlocked ? pal.accent : 'none'}
              fillOpacity={unlocked ? 0.25 : 0}
            />
            <line x1="24" y1="39" x2="32" y2="39" />
          </g>
        );
    }
  };

  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 56 56"
      aria-hidden="true"
      className="shrink-0 select-none"
    >
      {/* Outer Ceremonial Octagon / Medallion Ring */}
      <polygon
        points="28,3 45.7,10.3 53,28 45.7,45.7 28,53 10.3,45.7 3,28 10.3,10.3"
        fill={pal.innerFill}
        stroke={pal.outer}
        strokeWidth={unlocked ? '2.4' : '1.6'}
        strokeDasharray={unlocked ? undefined : '3 2.5'}
      />
      <circle
        cx="28"
        cy="28"
        r="20"
        fill="none"
        stroke={pal.accent}
        strokeWidth="1"
        opacity={unlocked ? 0.65 : 0.45}
      />
      {renderInnerMotif()}
    </svg>
  );
};

/* ==================== 2. FLOATING UNLOCK CELEBRATION BANNER ==================== */
interface AchievementUnlockBannerProps {
  achievements: AchievementDefinition[];
  onDismiss: () => void;
  onInspectAll: () => void;
}

export const AchievementUnlockBanner: React.FC<AchievementUnlockBannerProps> = ({
  achievements,
  onDismiss,
  onInspectAll,
}) => {
  if (achievements.length === 0) return null;
  const primary = achievements[0];

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 pt-3">
      <div
        role="status"
        aria-live="polite"
        className="bg-white border border-amber-300 rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-opacity duration-200"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <AchievementEmblemSVG motif={primary.motif} tier={primary.tier} unlocked size="md" />
          <div className="min-w-0">
            <div className="text-xs text-amber-800 font-medium">
              ปลดล็อกตราเกียรติยศใหม่ · {primary.tierLabelTh} · +{primary.points} แต้มเกียรติยศ
              {achievements.length > 1 ? ` (และอีก ${achievements.length - 1} รายการ)` : ''}
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900 font-display truncate">
              {primary.titleTh} ({primary.titleEn})
            </div>
            <div className="text-xs text-slate-600 mt-0.5 line-clamp-1">{primary.description}</div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              onDismiss();
              onInspectAll();
            }}
            className="min-h-[38px] px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            ดูทำเนียบเกียรติยศ
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="ปิดการแจ้งเตือนตราเกียรติยศ"
            className="min-h-[38px] min-w-[38px] p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg inline-flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ==================== 3. STRATEGIC BOARD COMPACT SHOWCASE STRIP ==================== */
interface CareerAchievementsStripProps {
  state: GameState;
  onOpenModal: () => void;
}

export const CareerAchievementsStrip: React.FC<CareerAchievementsStripProps> = ({
  state,
  onOpenModal,
}) => {
  ensureAchievementFields(state);
  const unlockedIds = useMemo(
    () => new Set(state.unlockedAchievements.map((u) => u.id)),
    [state.unlockedAchievements]
  );

  const { earnedPoints, maxPoints } = useMemo(
    () => calculateAchievementPoints(unlockedIds),
    [unlockedIds]
  );

  // Show unlocked badges first, followed by closest-to-unlock milestones (up to 4 items for clean scannability)
  const featuredItems = useMemo(() => {
    const evaluated = ACHIEVEMENT_DEFINITIONS.map((def) => ({
      def,
      unlocked: unlockedIds.has(def.id),
      snap: def.evaluateProgress(state),
    }));

    const unlockedList = evaluated.filter((x) => x.unlocked);
    const lockedSorted = evaluated
      .filter((x) => !x.unlocked)
      .sort((a, b) => b.snap.percent - a.snap.percent);

    return [...unlockedList.slice(-2), ...lockedSorted].slice(0, 4);
  }, [state, unlockedIds]);

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 mb-3.5 border-b border-slate-100">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">
            ทำเนียบเกียรติประวัติและหมุดหมายอาชีพ (Career Achievements)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
            ปลดล็อกแล้ว {unlockedIds.size}/{ACHIEVEMENT_DEFINITIONS.length} รายการ · คะแนนเกียรติยศสะสม {earnedPoints}/{maxPoints} แต้ม
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenModal}
          className="min-h-[38px] px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          ดูตราเกียรติยศทั้งหมด →
        </button>
      </div>

      {/* Medallion Quick Bar (All 12 Emblems at a glance, clickable to open modal) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-3 border-b border-slate-100">
        {ACHIEVEMENT_DEFINITIONS.map((def) => {
          const isUnlocked = unlockedIds.has(def.id);
          return (
            <button
              key={def.id}
              type="button"
              onClick={onOpenModal}
              title={`${def.titleTh} (${def.titleEn}) — ${isUnlocked ? 'ปลดล็อกแล้ว' : def.requirementSummary}`}
              className="p-1 rounded-lg hover:bg-slate-50 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <AchievementEmblemSVG
                motif={def.motif}
                tier={def.tier}
                unlocked={isUnlocked}
                size="sm"
              />
            </button>
          );
        })}
      </div>

      {/* Featured Next Milestones & Recent Unlocks (Unboxed Divide-Y List — Zero Cards-in-Cards) */}
      <div className="divide-y divide-slate-100">
        {featuredItems.map(({ def, unlocked, snap }) => (
          <div key={def.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3">
            <AchievementEmblemSVG motif={def.motif} tier={def.tier} unlocked={unlocked} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                <span className="font-bold text-slate-900 truncate">
                  {def.titleTh} · <span className="font-normal text-slate-500">{def.titleEn}</span>
                </span>
                <span
                  className={`font-mono tabular-nums shrink-0 inline-flex items-center gap-1 ${
                    unlocked ? 'text-emerald-700 font-semibold' : 'text-slate-600'
                  }`}
                >
                  {unlocked ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>สำเร็จ (+{def.points})</span>
                    </>
                  ) : (
                    <span>{snap.percent}%</span>
                  )}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums truncate">
                {snap.progressLabel}
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                <div
                  className={`h-full transition-transform duration-200 origin-left ${
                    unlocked ? 'bg-emerald-600' : 'bg-blue-600'
                  }`}
                  style={{ width: `${snap.percent}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

/* ==================== 4. FULL CAREER ACHIEVEMENTS MODAL ==================== */
interface CareerAchievementsModalProps {
  isOpen: boolean;
  state: GameState | null;
  onClose: () => void;
}

type StatusFilter = 'ALL' | 'UNLOCKED' | 'LOCKED';
type CategoryFilter = 'ALL' | AchievementCategory;

export const CareerAchievementsModal: React.FC<CareerAchievementsModalProps> = ({
  isOpen,
  state,
  onClose,
}) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');

  const globalMap = useMemo(() => {
    if (!isOpen) return {};
    return loadGlobalUnlockedAchievements();
  }, [isOpen, state?.unlockedAchievements.length]);

  if (!isOpen) return null;

  if (state) {
    ensureAchievementFields(state);
  }

  const currentRunMap = new Map(
    (state?.unlockedAchievements || []).map((rec) => [rec.id, rec])
  );

  // Active unlocked set: if inside an active game, reflect current run; if opened from Title Screen (state === null), reflect global lifetime unlocks
  const activeUnlockedIds = state
    ? new Set(state.unlockedAchievements.map((u) => u.id))
    : new Set(Object.keys(globalMap));

  const globalUnlockedCount = Object.keys(globalMap).length;
  const { earnedPoints, maxPoints } = calculateAchievementPoints(activeUnlockedIds);
  const completionPct = Math.round(
    (activeUnlockedIds.size / ACHIEVEMENT_DEFINITIONS.length) * 100
  );

  const filteredAchievements = ACHIEVEMENT_DEFINITIONS.filter((def) => {
    const isUnlocked = activeUnlockedIds.has(def.id);
    if (statusFilter === 'UNLOCKED' && !isUnlocked) return false;
    if (statusFilter === 'LOCKED' && isUnlocked) return false;
    if (categoryFilter !== 'ALL' && def.category !== categoryFilter) return false;
    return true;
  });

  const categoryTabs: { id: CategoryFilter; label: string }[] = [
    { id: 'ALL', label: 'ทุกหมวดหมู่' },
    { id: 'ELECTION', label: 'การเลือกตั้ง' },
    { id: 'GOVERNANCE', label: 'บริหารและงบประมาณ' },
    { id: 'INTEGRITY', label: 'ความโปร่งใส' },
    { id: 'CAREER', label: 'เส้นทางอาชีพ' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievements-modal-title"
        className="bg-white border-t sm:border border-slate-200 rounded-t-2xl sm:rounded-xl max-w-4xl w-full max-h-[92dvh] sm:max-h-[90vh] flex flex-col p-4 sm:p-6 shadow-xl pb-safe"
      >
        {/* Mobile Bottom-Sheet Handle */}
        <div className="sm:hidden w-10 h-1.5 bg-slate-300 rounded-full mx-auto mb-2.5 shrink-0" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-200 shrink-0">
          <div className="flex items-start gap-2.5 min-w-0">
            <Award className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h2
                id="achievements-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 font-display leading-snug"
              >
                ทำเนียบตราเกียรติยศและหมุดหมายอาชีพการเมือง (Career Achievements)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {state
                  ? `ผู้เล่นปัจจุบัน: ${state.player.name} · ${ROLE_LABELS_TH[state.player.role]} · บันทึกความสำเร็จทั้งในรอบปัจจุบันและสถิติสะสมทุกเซฟ`
                  : 'สมุดสะสมตราเกียรติยศรวมทุกสล็อตการเล่น (Global Hall of Fame)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างทำเนียบเกียรติยศ"
            className="min-h-[40px] min-w-[40px] p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg inline-flex items-center justify-center shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Quantitative Strip */}
        <div className="py-3 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono tabular-nums shrink-0">
          <div>
            <div className="text-slate-500 font-sans">
              {state ? 'ปลดล็อกในรอบนี้' : 'ปลดล็อกสะสมทั้งหมด'}
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
              {activeUnlockedIds.size} / {ACHIEVEMENT_DEFINITIONS.length} ตรา ({completionPct}%)
            </div>
          </div>
          <div>
            <div className="text-slate-500 font-sans">คะแนนเกียรติยศ</div>
            <div className="text-sm sm:text-base font-bold text-blue-700 mt-0.5">
              {earnedPoints} / {maxPoints} แต้ม
            </div>
          </div>
          <div>
            <div className="text-slate-500 font-sans">สถิติปลดล็อกรวมทุกเซฟ</div>
            <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
              {globalUnlockedCount} / {ACHIEVEMENT_DEFINITIONS.length} ตรา
            </div>
          </div>
          <div>
            <div className="text-slate-500 font-sans">สถานะประวัติจริยธรรม</div>
            <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 font-sans">
              {state
                ? state.careerStats.everInvestigated
                  ? 'เคยถูกสอบสวน'
                  : 'คลีนไร้มลทิน'
                : 'พร้อมบันทึกสถิติ'}
            </div>
          </div>
        </div>

        {/* Interactive Filter Controls (Functional Segmented Buttons) */}
        <div className="py-3 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
            {(
              [
                { id: 'ALL', label: `ทั้งหมด (${ACHIEVEMENT_DEFINITIONS.length})` },
                { id: 'UNLOCKED', label: `ได้รับแล้ว (${activeUnlockedIds.size})` },
                {
                  id: 'LOCKED',
                  label: `กำลังสะสม (${ACHIEVEMENT_DEFINITIONS.length - activeUnlockedIds.size})`,
                },
              ] as { id: StatusFilter; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`min-h-[34px] px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5 md:pb-0">
            {categoryTabs.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`min-h-[34px] px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  categoryFilter === cat.id
                    ? 'bg-blue-700 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Badge Catalog Grid */}
        <div className="overflow-y-auto flex-1 py-2 pr-0.5">
          {filteredAchievements.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              ไม่มีตราเกียรติยศในตัวกรองที่เลือก ลองสลับดูหมวดหมู่อื่นเพื่อวางแผนเส้นทางการเมือง
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 py-2">
              {filteredAchievements.map((def) => {
                const runRecord = currentRunMap.get(def.id);
                const globalRecord = globalMap[def.id];
                const isUnlocked = state ? Boolean(runRecord) : Boolean(globalRecord);
                const snap = state
                  ? def.evaluateProgress(state)
                  : {
                      percent: isUnlocked ? 100 : 0,
                      progressLabel: isUnlocked
                        ? `ปลดล็อกครั้งแรกโดย ${globalRecord.unlockedByPlayer} (${globalRecord.unlockedDateLabel})`
                        : def.requirementSummary,
                      isMet: isUnlocked,
                    };

                return (
                  <div
                    key={def.id}
                    className={`p-4 rounded-xl border transition-colors flex items-start gap-3.5 ${
                      isUnlocked
                        ? 'border-slate-300 bg-white'
                        : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <AchievementEmblemSVG
                      motif={def.motif}
                      tier={def.tier}
                      unlocked={isUnlocked}
                      size="lg"
                    />

                    <div className="min-w-0 flex-1">
                      {/* Clean Unboxed Metadata Line (Zero-Pill Discipline) */}
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-slate-500">
                        <span>{def.categoryLabelTh}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-slate-700">{def.tierLabelTh}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">+{def.points} แต้ม</span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 font-display mt-0.5 leading-snug">
                        {def.titleTh}{' '}
                        <span className="font-normal text-xs text-slate-500">({def.titleEn})</span>
                      </h3>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {def.description}
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-slate-200/70 space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
                          <span
                            className={`inline-flex items-center gap-1 truncate ${
                              isUnlocked ? 'text-emerald-700 font-semibold font-sans' : 'text-slate-600'
                            }`}
                          >
                            {isUnlocked ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">
                                  {runRecord
                                    ? `ปลดล็อกเมื่อ ${runRecord.unlockedDateLabel} (เทิร์น ${runRecord.unlockedTurn})`
                                    : `ปลดล็อกแล้วโดย ${globalRecord?.unlockedByPlayer}`}
                                </span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 shrink-0 text-slate-400" />
                                <span className="truncate">{snap.progressLabel}</span>
                              </>
                            )}
                          </span>
                          <span className="font-semibold text-slate-700 shrink-0">
                            {isUnlocked ? '100%' : `${snap.percent}%`}
                          </span>
                        </div>

                        <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-transform duration-200 origin-left ${
                              isUnlocked ? 'bg-emerald-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${isUnlocked ? 100 : snap.percent}%` }}
                          />
                        </div>

                        {state && !runRecord && globalRecord && (
                          <div className="text-[11px] text-slate-500">
                            เคยปลดล็อกแล้วในเซฟก่อนหน้า ({globalRecord.unlockedByPlayer})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3.5 mt-2 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-500 hidden sm:inline">
            ตราเกียรติยศจะถูกประเมินและปลดล็อกอัตโนมัติทันทีที่ทำเงื่อนไขสำเร็จในเกม
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[42px] px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
