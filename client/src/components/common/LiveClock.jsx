import { useLiveClock } from '../../hooks/useLiveClock';
import { Clock } from 'lucide-react';

export default function LiveClock() {
  const { timeString, dateString } = useLiveClock();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-950/90 text-white shadow-lg">
        <Clock className="w-4 h-4 text-gold-400" />
        <span className="font-mono text-lg font-semibold tracking-wider text-gold-300">
          {timeString}
        </span>
      </div>
      <span className="hidden md:block text-sm text-surface-500 font-medium">
        {dateString}
      </span>
    </div>
  );
}
