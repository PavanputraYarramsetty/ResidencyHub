import { useLiveClock } from '../../hooks/useLiveClock';
import { Calendar } from 'lucide-react';

export default function LiveClock({ compact = false }) {
  const { timeString, dateString } = useLiveClock();

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>{timeString}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Live Time Badge */}
      <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900 text-white border border-amber-500/30 shadow-md">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
            IST LIVE
          </span>
        </div>

        <div className="h-4 w-px bg-slate-700" />

        <span className="font-mono text-sm font-extrabold tracking-widest text-amber-300">
          {timeString}
        </span>
      </div>

      {/* Date Badge */}
      <div className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
        <Calendar className="w-3.5 h-3.5 text-slate-400" />
        <span>{dateString}</span>
      </div>
    </div>
  );
}
