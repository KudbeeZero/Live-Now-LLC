import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useEmergencyMode } from './hooks/useEmergencyMode.js';
import { EmergencyBanner }  from './components/EmergencyBanner.jsx';
import { PitchGate }        from './components/PitchGate.jsx';
import Home     from './pages/Home.jsx';
import Mission  from './pages/Mission.jsx';
import Founders from './pages/Founders.jsx';
import Pitch    from './pages/Pitch.jsx';

const NAV = [
  { to: '/',         label: 'Find Care' },
  { to: '/mission',  label: 'Mission' },
  { to: '/founders', label: 'Founders' },
  { to: '/pitch',    label: 'The Pitch' },
];

export default function App() {
  const emergency = useEmergencyMode();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">

        {/* EMERGENCY BANNER — rendered first, always above all content */}
        {emergency && <EmergencyBanner />}

        {/* Site Header */}
        <header className="bg-navy text-white px-6 py-4 shadow-md">
          <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                Live Now Recovery
              </h1>
              <p className="text-blue-200 text-sm mt-0.5">
                Ohio Region 13 — Anonymous MAT Provider Availability
              </p>
            </div>
            <nav aria-label="Main navigation" className="flex gap-1 flex-wrap">
              {NAV.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `px-4 py-2.5 rounded-lg text-sm font-semibold min-h-touch flex items-center transition-colors ${
                      isActive
                        ? 'bg-cplus-teal text-white'
                        : 'text-blue-200 hover:bg-navy-lt hover:text-white'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
          <Routes>
            <Route path="/"         element={<Home />} />
            <Route path="/mission"  element={<Mission />} />
            <Route path="/founders" element={<Founders />} />
            <Route path="/pitch"    element={<PitchGate><Pitch /></PitchGate>} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-navy-lt text-blue-200 text-xs text-center py-4 mt-8">
          <p>
            <strong className="text-white">Live Now Recovery</strong> — no patient data
            is ever stored. All interactions are anonymous.
          </p>
          <p className="mt-1">
            Ohio Region 13 · Privacy-by-Design · Verified Warm Handoffs
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
