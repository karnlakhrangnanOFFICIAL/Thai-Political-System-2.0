import React, { useState } from 'react';
import {
  CheckCircle2,
  FileClock,
  GitBranch,
  HelpCircle,
  MessageSquareQuote,
  Newspaper,
} from 'lucide-react';
import { POLITICAL_STORY_CHAINS } from '../data/politicalEventChains';
import { FactCheckStatus, GameState, PoliticalLayer } from '../types/game';

interface NewsAndAuditViewProps {
  state: GameState;
}

const FACT_LABELS: Record<FactCheckStatus, { text: string; colorClass: string }> = {
  [FactCheckStatus.VERIFIED_FACT]: {
    text: 'ข้อเท็จจริงที่ยืนยันแล้ว (Verified Fact)',
    colorClass: 'text-emerald-700',
  },
  [FactCheckStatus.CLAIM]: {
    text: 'คำกล่าวอ้างทางการเมือง (Political Claim)',
    colorClass: 'text-amber-700',
  },
  [FactCheckStatus.UNVERIFIED_INFO]: {
    text: 'ข้อมูลรอการพิสูจน์ (Unverified Info)',
    colorClass: 'text-slate-600',
  },
};

export const NewsAndAuditView: React.FC<NewsAndAuditViewProps> = ({ state }) => {
  const [leftMode, setLeftMode] = useState<'NEWS' | 'STORY_ARCS'>('NEWS');
  const [layerFilter, setLayerFilter] = useState<'ALL' | PoliticalLayer>('ALL');

  const filteredLogs = state.auditLog.filter(
    (entry) => layerFilter === 'ALL' || entry.layer === layerFilter
  );

  const storyHistory = state.storyArcHistory || [];
  const activeOrCompletedChainsCount = POLITICAL_STORY_CHAINS.filter((chain) =>
    chain.episodeEventIds.some((eid) => state.resolvedEventIds.includes(eid))
  ).length;

  const lowestApprovalRegion = [...state.regions].sort((a, b) => a.govApproval - b.govApproval)[0];
  const lowestEconomyRegion = [...state.regions].sort(
    (a, b) => a.localEconomyScore - b.localEconomyScore
  )[0];
  const homeRegion =
    state.regions.find((r) => r.id === state.player.homeRegion) || state.regions[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
      {/* Left 6 Cols: Fact-Checked News & Multi-Part Political Story Arc Tracker */}
      <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display text-balance">
              {leftMode === 'NEWS'
                ? 'กระดานข่าวสารและสื่อมวลชน'
                : 'สมุดสายเนื้อเรื่องการเมืองและรัฐสภาต่อเนื่อง'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {leftMode === 'NEWS'
                ? 'แยกสถานะข้อเท็จจริงออกจากคำกล่าวอ้างทางการเมือง และผูกกับรหัสเหตุการณ์ทุกชิ้น'
                : 'ติดตามความคืบหน้าเหตุการณ์หลายตอนที่ผูกกับดัชนี 6 ภูมิภาคและตัวเลขเศรษฐกิจจริง'}
            </p>
          </div>
          {leftMode === 'NEWS' ? (
            <Newspaper className="hidden sm:block w-4 h-4 text-slate-400 shrink-0 mt-1" />
          ) : (
            <GitBranch className="hidden sm:block w-4 h-4 text-slate-400 shrink-0 mt-1" />
          )}
        </div>

        {/* Interactive Segmented Switcher: News Feed vs Story Arcs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs mb-4 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setLeftMode('NEWS')}
            className={`flex-1 min-h-[36px] sm:min-h-[32px] px-3 py-1.5 sm:py-1 font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              leftMode === 'NEWS'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            กระดานข่าวสาร ({state.newsFeed.length})
          </button>
          <button
            type="button"
            onClick={() => setLeftMode('STORY_ARCS')}
            className={`flex-1 min-h-[36px] sm:min-h-[32px] px-3 py-1.5 sm:py-1 font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              leftMode === 'STORY_ARCS'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            สายเนื้อเรื่องการเมือง ({activeOrCompletedChainsCount}/{POLITICAL_STORY_CHAINS.length})
          </button>
        </div>

        {leftMode === 'NEWS' ? (
          <div className="divide-y divide-slate-100 max-h-[440px] sm:max-h-[480px] overflow-y-auto pr-1">
            {state.newsFeed.map((item) => {
              const factInfo = FACT_LABELS[item.factStatus];
              return (
                <article key={item.id} className="py-3.5 first:pt-0">
                  {/* Clean Zero-Pill Metadata Line */}
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.dateLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.sourceName}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-[11px] text-slate-400">Ref: {item.eventId}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                    {item.headline}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.summary}</p>

                  <div
                    className={`mt-1.5 text-xs font-medium flex items-start sm:items-center gap-1.5 ${factInfo.colorClass}`}
                  >
                    {item.factStatus === FactCheckStatus.VERIFIED_FACT ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 sm:mt-0" />
                    ) : item.factStatus === FactCheckStatus.CLAIM ? (
                      <MessageSquareQuote className="w-3.5 h-3.5 shrink-0 mt-0.5 sm:mt-0" />
                    ) : (
                      <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 sm:mt-0" />
                    )}
                    <span>{factInfo.text}</span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4 max-h-[440px] sm:max-h-[480px] overflow-y-auto pr-1">
            {/* Live Signal Radar Summary (Zero-Pill, Tabular Numerals) */}
            <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-slate-800">
                สัญญาณเศรษฐกิจและภูมิภาคที่ใช้ประมวลผลเหตุการณ์เดือนนี้
              </div>
              <div className="text-slate-600 font-mono tabular-nums leading-relaxed">
                GDP {state.economy.gdpGrowthPct >= 0 ? `+${state.economy.gdpGrowthPct}` : state.economy.gdpGrowthPct}%
                {' · '}เชื่อมั่นผู้บริโภค {state.economy.consumerConfidence}/100
                {' · '}ขัดแย้งพรรคร่วม {state.politicalFrictionIndex}%
                {' · '}เลือกตั้งใน {state.monthsUntilElection} เดือน
              </div>
              <div className="text-slate-600 font-mono tabular-nums leading-relaxed">
                เศรษฐกิจต่ำสุด: {lowestEconomyRegion?.name} ({lowestEconomyRegion?.localEconomyScore}/100)
                {' · '}นิยมรัฐต่ำสุด: {lowestApprovalRegion?.name} ({lowestApprovalRegion?.govApproval}%)
                {' · '}บ้านเกิด: {homeRegion?.name}
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {POLITICAL_STORY_CHAINS.map((chain) => {
                const resolvedCount = chain.episodeEventIds.filter((eid) =>
                  state.resolvedEventIds.includes(eid)
                ).length;
                const chainLogs = [...storyHistory]
                  .filter((h) => h.chainId === chain.chainId)
                  .sort((a, b) => a.episodeNumber - b.episodeNumber);
                const isCompleted = resolvedCount >= chain.totalEpisodes;
                const isInProgress = resolvedCount > 0 && !isCompleted;

                return (
                  <div key={chain.chainId} className="py-3.5 first:pt-0 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                      <span className="font-bold text-sm text-slate-900">{chain.title}</span>
                      <span
                        className={`font-mono tabular-nums font-semibold ${
                          isCompleted
                            ? 'text-emerald-700'
                            : isInProgress
                            ? 'text-blue-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {isCompleted
                          ? `บริบูรณ์ครบ ${chain.totalEpisodes}/${chain.totalEpisodes} ตอน`
                          : isInProgress
                          ? `กำลังดำเนินเรื่อง · ผ่านแล้ว ${resolvedCount}/${chain.totalEpisodes} ตอน`
                          : `ยังไม่เริ่ม · 0/${chain.totalEpisodes} ตอน`}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">{chain.subtitle}</div>

                    {/* 3-Step Episode Bar */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {Array.from({ length: chain.totalEpisodes }, (_, idx) => {
                        const ep = idx + 1;
                        const done = ep <= resolvedCount;
                        const nextUp = ep === resolvedCount + 1 && isInProgress;
                        return (
                          <div
                            key={ep}
                            className={`h-1.5 rounded-full ${
                              done
                                ? 'bg-emerald-600'
                                : nextUp
                                ? 'bg-blue-600'
                                : 'bg-slate-200'
                            }`}
                          />
                        );
                      })}
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                      เงื่อนไขจุดชนวน: {chain.triggerOverview}
                    </div>

                    {chainLogs.length > 0 && (
                      <div className="pt-1.5 space-y-1.5">
                        {chainLogs.map((log) => (
                          <div
                            key={log.eventId}
                            className="text-xs text-slate-700 bg-slate-50 border border-slate-200/80 rounded p-2"
                          >
                            <div className="font-mono tabular-nums text-[11px] text-slate-500">
                              ตอนที่ {log.episodeNumber}/{log.totalEpisodes} · {log.dateLabel} (เทิร์น {log.turn})
                            </div>
                            <div className="font-semibold text-slate-900 mt-0.5">
                              {log.choiceLabel}
                            </div>
                            <div className="text-slate-600 mt-0.5">{log.outcomeSummary}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Right 6 Cols: Immutable Legal & Action Audit Log */}
      <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display text-balance">
              บันทึกประวัติการกระทำและฐานอำนาจกฎหมาย (Audit Log)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              บันทึกถาวรตรวจสอบย้อนหลังได้ทุกการตัดสินใจและผลทางกฎหมาย
            </p>
          </div>
          <FileClock className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
        </div>

        {/* Interactive Segmented Filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs mb-4 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'ALL', label: 'ทั้งหมด' },
              { id: PoliticalLayer.LIFE, label: 'ชีวิตส่วนตัว' },
              { id: PoliticalLayer.LAW, label: 'Layer 01 กฎหมาย' },
              { id: PoliticalLayer.POWER, label: 'Layer 02 การเมือง' },
              { id: PoliticalLayer.GOVERNANCE, label: 'Layer 03 บริหารรัฐ' },
            ] as { id: 'ALL' | PoliticalLayer; label: string }[]
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setLayerFilter(f.id)}
              className={`min-h-[36px] sm:min-h-[32px] px-3 sm:px-2.5 py-1.5 sm:py-1 font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                layerFilter === f.id
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="divide-y divide-slate-100 max-h-[420px] sm:max-h-[480px] overflow-y-auto pr-1">
          {filteredLogs.map((log) => (
            <div key={log.id} className="py-3 first:pt-0 text-xs">
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-slate-500 font-mono tabular-nums">
                <span className="font-sans font-semibold text-blue-700">{log.layer}</span>
                <span aria-hidden="true">·</span>
                <span className="font-sans text-slate-700 font-medium">{log.actor}</span>
                <span aria-hidden="true">·</span>
                <span>{log.dateLabel} (วันที่ {log.tick})</span>
              </div>
              <div className="font-semibold text-slate-900 mt-1 leading-snug">{log.action}</div>
              <div className="text-slate-600 mt-0.5 leading-relaxed">{log.outcome}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">ฐานอำนาจ: {log.legalAuthority}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
