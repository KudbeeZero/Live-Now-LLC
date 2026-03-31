import React from 'react';

/**
 * EmergencyBanner
 *
 * Persistent full-width Deep Red header shown whenever useEmergencyMode() is true.
 * Meets WCAG 2.1 AA contrast requirements and 44px minimum touch target height.
 * MUST remain visible above all other content — see CLAUDE.md § Emergency Mode Rules.
 */
export function EmergencyBanner() {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="
        w-full bg-emergency text-white
        flex items-center justify-center
        px-4 py-3
        min-h-[44px]
        text-center font-bold text-lg tracking-wide
        shadow-lg z-50
      "
    >
      <span className="mr-2 text-xl" aria-hidden="true">🚨</span>
      NEED HELP NOW?&nbsp;
      <a
        href="tel:8332346343"
        className="underline underline-offset-2 hover:text-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-300 rounded"
        aria-label="Call Ohio MAR NOW at 833-234-6343"
      >
        Call Ohio MAR NOW: 833-234-6343
      </a>
      <span className="ml-2 text-xl" aria-hidden="true">🚨</span>
    </div>
  );
}
