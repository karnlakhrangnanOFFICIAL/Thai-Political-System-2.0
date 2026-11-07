import React from 'react';
import { AlertTriangle, Eye, ShieldCheck } from 'lucide-react';
import { GameState, PlayerRole } from '../types/game';

export interface ScandalRiskStatusInfo {
  risk: number;
  level: 'SAFE' | 'ELEVATED' | 'CRITICAL';
  labelTh: string;
  shortLabelTh: string;
  textColorClass: string;
  barColorClass: string;
}

export function getScandalRiskStatus(rawRisk: number | undefined): ScandalRiskStatusInfo {
  const risk = Math.max(0, Math.min(100, Math.round(rawRisk || 0)));
  if (risk >= 75) {
    return {
      risk,
      level: 'CRITICAL',
      labelTh: 'วิกฤต · จ่อถูกเปิดไต่สวนสาธารณะ',
      shortLabelTh: 'วิกฤต',
      textColorClass: 'text-red-700',
      barColorClass: 'bg-red-600',
    };
  }
  if (risk >= 40) {
    return {
      risk,
      level: 'ELEVATED',
      labelTh: 'เฝ้าระวัง · สื่อและฝ่ายค้านจับตา',
      shortLabelTh: 'เฝ้าระวัง',
      textColorClass: 'text-amber-700',
      barColorClass: 'bg-amber-500',
    };
  }
  return {
    risk,
    level: 'SAFE',
    labelTh: 'ระดับปกติ · โปร่งใสตรวจสอบได้',
    shortLabelTh: 'ปกติ',
    textColorClass: 'text-emerald-700',
    barColorClass: 'bg-emerald-600',
  };
}

interface ScandalRiskMeterProps {
  state: GameState;
}

export const ScandalRiskMeter: React.FC<ScandalRiskMeterProps> = ({ state }) => {
  const info = getScandalRiskStatus(state.player.scandalRisk);
  const playerMin = state.ministries.find((m) => m.isPlayerMinister);
  const isExecutive =
    state.player.role === PlayerRole.PRIME_MINISTER || state.player.role === PlayerRole.MINISTER;

  const StatusIcon =
    info.level === 'CRITICAL' ? AlertTriangle : info.level === 'ELEVATED' ? Eye : ShieldCheck;

  const stakeText = playerMin
    ? `เดิมพันปัจจุบันหากแตะ 100%: เสี่ยงพ้นเก้าอี้รัฐมนตรี ${playerMin.shortName} หรือถูกหั่นงบกระทรวง 15%`
    : isExecutive
    ? 'เดิมพันปัจจุบันหากแตะ 100%: เสี่ยงถูกบังคับปรับ ครม. ฉุกเฉิน หรือถูกหั่นงบ 3 กระทรวงหลัก 15% และอายัดงบกลาง 40,000 ล้าน ฿'
    : 'เดิมพันหากแตะ 100%: เปิดเวทีไต่สวนสาธารณะ กระทบตำแหน่งบริหาร งบประมาณกระทรวงหลัก 15% และอาจถูก ป.ป.ช. สอบสวน';

  return (
    <section
      aria-label="มาตรวัดความเสี่ยงข่าวฉาวและการตรวจสอบสาธารณะ"
      className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 mb-3.5 border-b border-slate-100">
        <div>
          <div className="text-xs text-slate-500">
            มาตรวัดความเสี่ยงทางการเมือง · Scandal Risk Meter
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display mt-0.5">
            ดัชนีความเสี่ยงข่าวฉาวและการไต่สวนสาธารณะ
          </h2>
        </div>

        <div className={`flex items-center gap-1.5 font-mono tabular-nums ${info.textColorClass}`}>
          <StatusIcon className="w-4 h-4 shrink-0" />
          <span className="text-base sm:text-lg font-bold">{info.risk}%</span>
          <span className="text-xs font-sans font-semibold">({info.shortLabelTh})</span>
        </div>
      </div>

      {/* Graduated Segmented Risk Gauge */}
      <div className="space-y-1.5">
        <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
          {/* Threshold Reference Ticks at 40% and 75% */}
          <div
            aria-hidden="true"
            className="absolute top-0 bottom-0 left-[40%] w-px bg-slate-300 z-10"
          />
          <div
            aria-hidden="true"
            className="absolute top-0 bottom-0 left-[75%] w-px bg-slate-400 z-10"
          />
          <div
            className={`h-full transition-transform duration-200 origin-left ${info.barColorClass}`}
            style={{ width: `${info.risk}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500">
          <span>0% ปลอดภัย</span>
          <span>40% เฝ้าระวัง</span>
          <span>75% วิกฤต</span>
          <span className="text-red-700 font-semibold">100% ไต่สวนสาธารณะ</span>
        </div>
      </div>

      {/* Unboxed Causal Explanation & Stakes */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
        <div className="space-y-0.5">
          <div className="font-medium text-slate-800">{info.labelTh}</div>
          <div className="text-[11px] text-slate-500 leading-relaxed">{stakeText}</div>
        </div>
        <a
          href="#card-tray"
          className="min-h-[34px] py-1 text-blue-700 font-semibold hover:underline whitespace-nowrap shrink-0 self-start sm:self-center"
        >
          จัดการการ์ดนโยบาย ↓
        </a>
      </div>
    </section>
  );
};
