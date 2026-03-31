import React from 'react';

/**
 * HandoffImpact
 *
 * Displays the running total of verified Warm Handoffs, broken down by ZIP code.
 * Data comes from the ICP canister's getTotalHandoffs() and getHandoffCountsByZip().
 *
 * Props:
 *   total        — number: total verified handoffs across all ZIPs
 *   zipCounts    — array of { zipCode: string, count: number }
 *   pulsingZips  — Set<string>: ZIPs that had a handoff verified in the last 30s
 *                  (used to show the live pulse indicator)
 */
export function HandoffImpact({ total = 0, zipCounts = [], pulsingZips = new Set() }) {
  const sorted = [...zipCounts].sort((a, b) => b.count - a.count);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-navy font-bold text-lg">Verified Impact</h3>
          <p className="text-gray-500 text-sm mt-0.5">
            Warm Handoffs recorded on-chain
          </p>
        </div>
        {/* Total counter */}
        <div className="text-right">
          <span className="text-4xl font-extrabold text-cplus-teal tabular-nums">
            {total}
          </span>
          <p className="text-xs text-gray-400 mt-0.5">lives bridged</p>
        </div>
      </div>

      {/* ZIP breakdown */}
      {sorted.length > 0 ? (
        <ul className="space-y-2" aria-label="Handoffs by ZIP code">
          {sorted.map(({ zipCode, count }) => {
            const isPulsing = pulsingZips.has(zipCode);
            return (
              <li
                key={zipCode}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-100"
              >
                <div className="flex items-center gap-2">
                  {/* Pulse dot — visible when a handoff was just recorded */}
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      isPulsing
                        ? 'bg-cplus-teal animate-ping'
                        : 'bg-gray-300'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    ZIP {zipCode}
                  </span>
                  {isPulsing && (
                    <span className="text-xs text-cplus-teal font-semibold animate-pulse">
                      LIVE
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-navy tabular-nums">
                  {count} {count === 1 ? 'handoff' : 'handoffs'}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">
          No verified handoffs yet. Complete a Warm Handoff to see impact data here.
        </p>
      )}

      <p className="text-xs text-gray-400 text-center border-t border-gray-100 pt-3">
        Data recorded anonymously on the Internet Computer Protocol.
        No patient information is ever stored.
      </p>
    </div>
  );
}
