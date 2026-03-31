import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const TOKEN_TTL_SECONDS = 300; // 5 minutes — must match TOKEN_EXPIRY_NS in main.mo

// NE Ohio ZIP codes accepted for handoffs (validates input before canister call)
const NE_OHIO_ZIP_REGEX = /^(440|441|442|443|444|445|446|447|448)\d{2}$/;

/**
 * VolunteerHandoff
 *
 * Allows a volunteer to generate a one-time QR code for a Warm Handoff.
 * The QR code encodes the opaque token returned by the ICP canister's
 * generateHandoffToken() function.
 *
 * Privacy: ZIP code is the only geographic data collected. No patient data.
 */
export function VolunteerHandoff() {
  const [zipCode, setZipCode]       = useState('');
  const [token, setToken]           = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const zipValid = NE_OHIO_ZIP_REGEX.test(zipCode);

  // Countdown timer — clears token when it hits zero
  useEffect(() => {
    if (secondsLeft <= 0) {
      if (token) setToken(null);
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft, token]);

  const handleGenerate = useCallback(async () => {
    if (!zipValid) return;
    setError(null);
    setLoading(true);
    try {
      // TODO: replace mock with live canister call once dfx is deployed:
      // const t = await liveNowBackend.generateHandoffToken(zipCode);
      //
      // Mock token simulates the canister's nonce-timestamp format.
      // In production this is generated server-side in the ICP canister.
      const mockNonce = Math.floor(Math.random() * 900000) + 100000;
      const t = `${mockNonce}-${Date.now()}`;
      setToken(t);
      setSecondsLeft(TOKEN_TTL_SECONDS);
    } catch (err) {
      setError('Failed to generate token. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [zipCode, zipValid]);

  const minutes = Math.floor(secondsLeft / 60);
  const secs    = secondsLeft % 60;
  const expired = token === null && secondsLeft === 0 && !loading && error === null;

  const urgentColor =
    secondsLeft > 60  ? 'text-cplus-teal' :
    secondsLeft > 0   ? 'text-yellow-600'  :
                        'text-gray-400';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
      <div>
        <h3 className="text-navy font-bold text-lg">Generate Handoff Code</h3>
        <p className="text-gray-500 text-sm mt-1">
          Enter the 5-digit ZIP code where the handoff is happening, then show
          the QR code to clinic staff or a peer.
        </p>
      </div>

      {/* ZIP input */}
      <div className="flex gap-3 items-start">
        <div className="flex-1">
          <label htmlFor="handoff-zip" className="block text-sm font-medium text-gray-700 mb-1">
            ZIP Code
          </label>
          <input
            id="handoff-zip"
            type="text"
            inputMode="numeric"
            maxLength={5}
            placeholder="e.g. 44101"
            value={zipCode}
            onChange={(e) => {
              setToken(null);
              setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5));
            }}
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cplus-teal ${
              zipCode.length === 5 && !zipValid
                ? 'border-red-400 focus:ring-red-400'
                : 'border-gray-300'
            }`}
            aria-describedby="zip-hint"
          />
          <p id="zip-hint" className="text-xs text-gray-400 mt-1">
            Northeast Ohio ZIPs only (440xx–448xx)
          </p>
          {zipCode.length === 5 && !zipValid && (
            <p className="text-xs text-red-500 mt-1" role="alert">
              ZIP code is outside the Northeast Ohio service area.
            </p>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={!zipValid || loading}
          className="mt-6 min-h-[44px] min-w-[44px] px-5 py-2 bg-cplus-teal text-white font-semibold rounded-lg text-sm hover:bg-cplus-teal-dk disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Generate handoff QR code"
        >
          {loading ? 'Generating…' : 'Generate'}
        </button>
      </div>

      {error && (
        <p className="text-red-600 text-sm" role="alert">{error}</p>
      )}

      {/* QR Code display */}
      {token && (
        <div className="flex flex-col items-center gap-4 pt-2">
          <div className="p-4 bg-white border-2 border-cplus-teal rounded-xl shadow-md">
            <QRCodeSVG
              value={token}
              size={256}
              level="H"
              includeMargin={false}
              aria-label="Handoff QR code — scan with clinic staff device"
            />
          </div>

          {/* Countdown */}
          <div className={`text-center font-mono text-2xl font-bold tabular-nums ${urgentColor}`}>
            {minutes}:{secs.toString().padStart(2, '0')}
          </div>
          <p className="text-xs text-gray-500 text-center">
            Code expires in {minutes}m {secs}s — one-time use only
          </p>
          <p className="text-xs text-gray-400 text-center">
            ZIP: <span className="font-semibold text-navy">{zipCode}</span>
          </p>
        </div>
      )}

      {/* Expiry notice */}
      {!token && !loading && zipCode && !error && (
        <div className="text-center text-sm text-gray-400 pt-2">
          {expired ? 'Code expired. Generate a new one.' : 'Enter a ZIP code to get started.'}
        </div>
      )}
    </div>
  );
}
