import React, { useState } from 'react';
import { Lock } from 'lucide-react';

/**
 * PitchGate — lightweight password gate for the investor pitch page.
 *
 * SECURITY NOTE: This is obscurity, NOT real security. The password below ships
 * in the client JS bundle and is readable by anyone who inspects it. Its only job
 * is to keep the confidential investor preview out of casual / accidental view
 * (the page is also unlinked from the public site). Anything requiring genuine
 * protection must be enforced server-side — never put PHI or secrets behind this.
 */

const PITCH_PASSWORD = 'recovery'; // non-secret; see note above
const UNLOCK_KEY = 'lnr_pitch_unlocked';

export function PitchGate({ children }) {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(UNLOCK_KEY) === '1'
  );
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  if (unlocked) return children;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim().toLowerCase() === PITCH_PASSWORD) {
      sessionStorage.setItem(UNLOCK_KEY, '1');
      setUnlocked(true);
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pitch-gate-title"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-navy text-white flex items-center gap-3">
          <Lock size={20} aria-hidden="true" />
          <div>
            <h1 id="pitch-gate-title" className="font-bold text-lg leading-tight">
              Live Now Recovery
            </h1>
            <p className="text-blue-200 text-xs">Confidential — investor preview</p>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <label htmlFor="pitch-password" className="block text-sm font-semibold text-gray-700">
            Enter access password
          </label>
          <input
            id="pitch-password"
            type="password"
            autoFocus
            autoComplete="off"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(false); }}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-cplus-teal min-h-touch"
            placeholder="Password"
          />

          {error && (
            <p className="text-emergency text-sm font-medium" role="alert" aria-live="assertive">
              Incorrect password. Please try again.
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-bold text-white bg-cplus-teal hover:bg-cplus-teal-dk transition-colors min-h-touch"
          >
            Enter
          </button>

          <p className="text-gray-400 text-xs text-center">
            This preview is private. If you reached it by mistake, please close the tab.
          </p>
        </form>
      </div>
    </div>
  );
}
