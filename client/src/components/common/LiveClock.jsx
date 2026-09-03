import { useLiveClock } from '../../hooks/useLiveClock';
import { Clock } from 'lucide-react';

export default function LiveClock({ compact = false }) {
  const { timeString, dateString } = useLiveClock();

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 text-amber-400 border border-amber-500/20 shadow-sm text-xs font-mono font-semibold">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        {timeString}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Live Time Badge */}
      <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white border border-amber-500/30 shadow-md">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 font-mono">
            IST
          </span>
        </div>
        <div className="h-3.5 w-px bg-slate-700" />
        <span className="font-mono text-sm font-bold tracking-wider text-amber-300">
          {timeString}
        </span>
      </div>

      {/* Date */}
      <span className="hidden xl:inline-block text-xs font-medium text-slate-500">
        {dateString}
      </span>
    </div>
  );
}
