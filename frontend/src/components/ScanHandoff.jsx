import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

/**
 * ScanHandoff
 *
 * Allows clinic staff or a peer volunteer to scan the QR code displayed on
 * the volunteer's device, completing the Warm Handoff.
 *
 * Calls verifyHandoff(token) on the ICP canister. On success, displays a
 * teal checkmark and the "Handoff Verified. Impact Recorded." confirmation.
 *
 * Privacy: only the opaque token string is ever transmitted — no PHI.
 */
export function ScanHandoff({ onVerified }) {
  const [phase, setPhase]     = useState('idle');  // idle | scanning | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [verifiedZip, setVerifiedZip] = useState(null);
  const scannerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
      } catch (_) {
        // scanner may already be stopped
      }
      scannerRef.current = null;
    }
  }, []);

  const startScanner = useCallback(() => {
    setPhase('scanning');
    setErrorMsg('');

    // Defer mount so the DOM element is rendered before scanner attaches
    setTimeout(() => {
      if (!mountedRef.current) return;

      const scanner = new Html5QrcodeScanner(
        'handoff-qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          rememberLastUsedCamera: true,
        },
        /* verbose= */ false,
      );

      scanner.render(
        async (decodedText) => {
          // QR scan success — verify with canister
          await stopScanner();
          if (!mountedRef.current) return;

          try {
            // TODO: replace mock with live canister call once dfx is deployed:
            // const result = await liveNowBackend.verifyHandoff(decodedText);
            //
            // Mock verification: accept any token matching the nonce-timestamp pattern
            // and simulate extracting a ZIP from a demo token.
            const isMockToken = /^\d+-\d+$/.test(decodedText);
            if (!isMockToken) {
              setErrorMsg('Invalid QR code. Please scan a valid Handoff code.');
              setPhase('error');
              return;
            }

            // Mock success — in production the canister returns #Ok(zipCode)
            const mockZip = '44101';
            setVerifiedZip(mockZip);
            setPhase('success');
            if (onVerified) onVerified(mockZip);
          } catch (err) {
            setErrorMsg('Verification failed. Please try again.');
            setPhase('error');
          }
        },
        (scanError) => {
          // Non-fatal scan attempt errors — do not surface to user
          void scanError;
        },
      );

      scannerRef.current = scanner;
    }, 100);
  }, [stopScanner, onVerified]);

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const reset = useCallback(() => {
    setPhase('idle');
    setErrorMsg('');
    setVerifiedZip(null);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
      <div>
        <h3 className="text-navy font-bold text-lg">Scan Handoff Code</h3>
        <p className="text-gray-500 text-sm mt-1">
          Scan the QR code shown on the volunteer's device to record a verified
          Warm Handoff.
        </p>
      </div>

      {/* Idle state */}
      {phase === 'idle' && (
        <button
          onClick={startScanner}
          className="w-full min-h-[44px] bg-navy text-white font-semibold rounded-lg py-3 text-sm hover:bg-navy-lt transition-colors"
          aria-label="Start camera to scan handoff QR code"
        >
          Start Camera &amp; Scan
        </button>
      )}

      {/* Scanner */}
      {phase === 'scanning' && (
        <div className="space-y-3">
          <div
            id="handoff-qr-reader"
            className="w-full rounded-xl overflow-hidden border border-gray-200"
            aria-label="QR code scanner viewport"
          />
          <button
            onClick={async () => { await stopScanner(); reset(); }}
            className="w-full min-h-[44px] border border-gray-300 text-gray-600 font-medium rounded-lg py-2 text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Success state */}
      {phase === 'success' && (
        <div
          className="flex flex-col items-center gap-4 py-6"
          role="status"
          aria-live="assertive"
        >
          {/* Teal checkmark */}
          <div className="w-20 h-20 rounded-full bg-cplus-teal flex items-center justify-center shadow-lg animate-bounce-once">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-10 h-10"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <div className="text-center space-y-1">
            <p className="text-xl font-extrabold text-navy tracking-tight">
              Handoff Verified.
            </p>
            <p className="text-lg font-semibold text-cplus-teal">
              Impact Recorded.
            </p>
            {verifiedZip && (
              <p className="text-sm text-gray-500 mt-2">
                ZIP <span className="font-semibold text-navy">{verifiedZip}</span> — recorded on-chain
              </p>
            )}
          </div>

          <button
            onClick={reset}
            className="min-h-[44px] px-6 py-2 bg-cplus-teal text-white font-semibold rounded-lg text-sm hover:bg-cplus-teal-dk transition-colors"
          >
            Record Another Handoff
          </button>
        </div>
      )}

      {/* Error state */}
      {phase === 'error' && (
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#DC2626"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="w-8 h-8"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <p className="text-red-600 text-sm font-medium" role="alert">{errorMsg}</p>
          <button
            onClick={reset}
            className="min-h-[44px] px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
