import { useLiveClock } from '../../hooks/useLiveClock';

export default function LiveClock() {
  const { timeString } = useLiveClock();

  return (
    <div className="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container text-on-surface">
      <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
      <span className="font-tabular-numeric text-tabular-numeric uppercase">
        IST LIVE {timeString}
      </span>
    </div>
  );
}
