import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  LineChart,
  Newspaper,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { GameState } from '../types/game';

interface WeeklySummaryModalProps {
  state: GameState;
  isOpen: boolean;
  onClose: () => void;
}

export const WeeklySummaryModal: React.FC<WeeklySummaryModalProps> = ({
  state,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const avgChaos =
    state.regions.reduce((s, r) => s + r.chaosScore, 0) / state.regions.length;
  const avgChaosLastWeek =
    state.regions.reduce((s, r) => {
      const last = r.chaosTrend[r.chaosTrend.length - 2] ?? r.chaosScore;
      return s + last;
    }, 0) / state.regions.length;

  const chaosDelta = avgChaos - avgChaosLastWeek;
  const headlines = state.currentMonthHeadlines || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <LineChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display">สรุปสถานการณ์การเมืองรายเดือน</h2>
              <p className="text-xs text-slate-400">Monthly Intelligence Report · ข้อมูลวิเคราะห์ความมั่นคง</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold font-mono tabular-nums leading-none">
              {state.monthIndex + 1}/{state.yearBE}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Report ID: {state.turn}</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Chaos Overview */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                ดัชนีความวุ่นวายรายภูมิภาค (National Chaos Index)
              </h3>
              <div className={`flex items-center gap-1 text-xs font-bold ${chaosDelta > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {chaosDelta > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {Math.abs(chaosDelta).toFixed(1)}% จากเดือนก่อน
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {state.regions.map((r) => (
                <div key={r.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{r.name}</div>
                  <div className="flex items-end justify-between">
                    <div className="text-lg font-bold font-mono tabular-nums text-slate-900">{r.chaosScore.toFixed(0)}</div>
                    {/* Sparkline simulation */}
                    <div className="flex items-end gap-0.5 h-6">
                      {(r.chaosTrend || []).slice(-4).map((val, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-blue-600/30 rounded-t-sm"
                          style={{ height: `${Math.max(20, (val / 100) * 100)}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Weekly Headlines */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-blue-600" />
              สรุปพาดหัวข่าวสำคัญ 4 สัปดาห์
            </h3>
            <div className="space-y-2">
              {headlines.map((h, i) => (
                <div key={i} className="flex gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 group">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      W{i + 1}
                    </div>
                    {i < headlines.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 my-1" />}
                  </div>
                  <div className="pt-1 flex-1">
                    <p className="text-sm text-slate-800 leading-relaxed">{h}</p>
                  </div>
                  <div className="shrink-0 pt-1">
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                  </div>
                </div>
              ))}
              {headlines.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm italic">
                  ไม่มีข้อมูลเหตุการณ์สำคัญในเดือนนี้
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2"
          >
            รับทราบรายงานสถานการณ์
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
