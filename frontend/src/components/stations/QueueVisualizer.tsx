import React from 'react';
import { getQueueStatus } from '../../utils/formatters';

interface QueueVisualizerProps {
  vehiclesWaiting: number;
  estimatedWaitMinutes: number;
  activeDispensers?: number | null;
}

const CAR_EMOJI = '🚗';
const DISPENSER_EMOJI = '⛽';
const MAX_SHOWN = 8; // cap displayed cars to avoid overflow

const queueBadgeStyles: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-700',
  moderate: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

const queueLabels: Record<string, string> = {
  low: 'Low Queue',
  moderate: 'Moderate Queue',
  high: 'High Queue',
};

const QueueVisualizer: React.FC<QueueVisualizerProps> = ({
  vehiclesWaiting,
  estimatedWaitMinutes,
  activeDispensers,
}) => {
  const status = getQueueStatus(vehiclesWaiting);
  const shown = Math.min(vehiclesWaiting, MAX_SHOWN);
  const hasMore = vehiclesWaiting > MAX_SHOWN;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Queue status badge */}
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${queueBadgeStyles[status]}`}>
        {queueLabels[status]}
      </span>

      {/* Visual queue row */}
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {vehiclesWaiting === 0 ? (
          <span className="text-sm text-slate-400 italic">No vehicles waiting</span>
        ) : (
          <>
            {Array.from({ length: shown }).map((_, i) => (
              <React.Fragment key={i}>
                <span
                  className="text-xl leading-none"
                  title={`Vehicle ${i + 1}`}
                  style={{
                    filter:
                      status === 'high'
                        ? 'sepia(1) saturate(3) hue-rotate(300deg)'
                        : status === 'moderate'
                        ? 'sepia(1) saturate(2) hue-rotate(5deg)'
                        : 'none',
                  }}
                >
                  {CAR_EMOJI}
                </span>
                {i < shown - 1 && (
                  <span className="text-slate-300 text-xs font-bold">›</span>
                )}
              </React.Fragment>
            ))}
            {hasMore && (
              <span className="text-xs font-semibold text-slate-400 ml-1">
                +{vehiclesWaiting - MAX_SHOWN} more
              </span>
            )}
            <span className="text-slate-300 text-xs font-bold ml-1">›</span>
            <span className="text-2xl leading-none" title="Dispenser">
              {DISPENSER_EMOJI}
            </span>
          </>
        )}
      </div>

      {/* Stats row */}
      <div className="flex gap-4 text-center">
        <div>
          <p className="text-lg font-bold text-slate-800">{vehiclesWaiting}</p>
          <p className="text-xs text-slate-500">vehicles waiting</p>
        </div>
        <div className="w-px bg-slate-200" />
        <div>
          <p className="text-lg font-bold text-slate-800">{estimatedWaitMinutes}</p>
          <p className="text-xs text-slate-500">min est. wait</p>
        </div>
        {activeDispensers != null && (
          <>
            <div className="w-px bg-slate-200" />
            <div>
              <p className="text-lg font-bold text-slate-800">{activeDispensers}</p>
              <p className="text-xs text-slate-500">dispensers</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QueueVisualizer;
