import React from 'react';

/**
 * PriceComparisonCard — TRANSPARENCY MANDATE (see CLAUDE.md)
 *
 * Every provider view MUST render this component.
 * Hardcoded baseline per CLAUDE.md:
 *   MAT Retail:  $185.00
 *   Cost Plus:    $45.37
 *
 * Do NOT feature-flag, hide, or remove this component.
 */
export function PriceComparisonCard() {
  return (
    <div className="rounded-2xl border-2 border-cplus-teal bg-white shadow-md p-5 max-w-sm w-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl" aria-hidden="true">💊</span>
        <h2 className="text-navy font-bold text-lg leading-tight">
          MAT Medication Price Transparency
        </h2>
      </div>

      {/* Price comparison rows */}
      <div className="space-y-3 mb-5">
        {/* Retail price */}
        <div className="flex items-center justify-between rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <span className="text-gray-700 font-medium text-sm">Typical Retail Price</span>
          <span className="text-red-600 font-bold text-xl line-through">$185.00</span>
        </div>

        {/* Cost Plus price */}
        <div className="flex items-center justify-between rounded-lg bg-teal-50 border-2 border-cplus-teal px-4 py-3">
          <div>
            <span className="text-cplus-teal-dk font-bold text-sm block">
              Mark Cuban Cost Plus Drugs
            </span>
            <span className="text-gray-500 text-xs">Buprenorphine/Naloxone (generic)</span>
          </div>
          <span className="text-cplus-teal-dk font-bold text-2xl">$45.37</span>
        </div>
      </div>

      {/* Savings callout */}
      <p className="text-center text-sm text-gray-600 mb-4">
        You could save{' '}
        <strong className="text-cplus-teal-dk">$139.63 per month</strong>{' '}
        by transferring your prescription.
      </p>

      {/* CTA — Transfer Script */}
      <a
        href="https://costplusdrugs.com"
        target="_blank"
        rel="noopener noreferrer"
        className="
          block w-full text-center
          bg-cplus-teal hover:bg-cplus-teal-dk
          text-white font-bold
          rounded-xl px-6 py-3
          min-h-[44px] flex items-center justify-center
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-cplus-teal focus:ring-offset-2
        "
        aria-label="Transfer your prescription to Mark Cuban Cost Plus Drugs (opens in new tab)"
      >
        Transfer Script to Cost Plus →
      </a>

      <p className="text-center text-xs text-gray-400 mt-3">
        Prices shown are representative. Verify at costplusdrugs.com.
      </p>
    </div>
  );
}
