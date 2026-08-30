import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { APP_VERSION, APP_NAME } from '../config/version';
import { Logo } from './Logo';
import { BackButton } from './BackButton';
import { Starfield } from './Starfield';
import {
  Menu,
  X,
  Smartphone,
  SunMoon,
  MessageCircle,
  Settings,
  ExternalLink,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface LayoutProps {
  children: React.ReactNode;
  containerClassName?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  containerClassName = 'w-full md:w-[90%] max-w-6xl',
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installPromptMsg, setInstallPromptMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { toggleTheme, setTheme, isNight } = useTheme();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(Boolean(isStandaloneMode));
    };

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    checkStandalone();
  }, []);

  const handleInstallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isIOS) {
      setInstallPromptMsg('Tap Share (⎋) in Safari & select "Add to Home Screen"');
    } else {
      setInstallPromptMsg('Tap your browser menu (⋮) & select "Install App" or "Add to Home screen"');
    }
    setTimeout(() => {
      setInstallPromptMsg(null);
    }, 4000);
  };

  return (
    <div className="h-screen h-[100dvh] w-screen overflow-hidden flex flex-col bg-ink-950 text-ivory-100 cabin-atmosphere select-none relative">
      {/* Dynamic Starfield / Atmospheric Motes */}
      <Starfield />

      {/* Centered Luxury App Container (90% width on Desktop) */}
      <div
        className={`w-full ${containerClassName} mx-auto h-full flex flex-col justify-between px-4 sm:px-6 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] relative z-10 overflow-hidden transition-all duration-300`}
      >
        {/* Top Header Bar */}
        <header className="flex items-center justify-between h-14 shrink-0 z-30 pt-1">
          {/* LEFT: Back button on inner pages (crewcash, skymenu, inkflight) without logo/text */}
          <div className="flex items-center gap-3">
            {!isHome && <BackButton to="/" />}
            {isHome && <Logo to="/" size="sm" />}
          </div>

          {/* RIGHT: Circular Ghost Hamburger Menu */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-ink-900/80 backdrop-blur-md border flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-ink-950 ${
                menuOpen
                  ? 'border-gold-400 text-gold-300 ring-2 ring-gold-400/20'
                  : 'border-gold-dim text-mist-300 hover:text-gold-300 hover:border-gold-400'
              }`}
            >
              {menuOpen ? (
                <X className="w-4.5 h-4.5 text-gold-300" strokeWidth={2} />
              ) : (
                <Menu className="w-4.5 h-4.5 text-mist-300 hover:text-gold-300" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </header>

        {/* Floating Glass Dropdown Menu */}
        {menuOpen && (
          <>
            {/* Scrim Overlay */}
            <div
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
            />

            {/* Glass Panel Anchored Top-Right */}
            <div className="absolute top-16 right-4 sm:right-6 w-84 max-w-[calc(100vw-2rem)] cabin-glass p-2 z-50 animate-menu-in flex flex-col gap-0.5 text-left border border-gold-dim">
              {installPromptMsg && (
                <div className="mx-2 my-1.5 p-2 rounded-lg bg-gold-400/15 border border-gold-400/30 text-xs text-gold-300 font-ui tracking-wide text-center animate-fade-in">
                  {installPromptMsg}
                </div>
              )}

              {/* Row 1: Install CrewKit (Hidden if standalone installed) */}
              {!isStandalone && (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-ink-800/60 text-left transition-colors group min-h-[44px]"
                >
                  <div className="w-9 h-9 rounded-full bg-ink-800/80 border border-gold-dim flex items-center justify-center text-gold-300 group-hover:border-gold-400/50 shrink-0">
                    <Smartphone className="w-4.5 h-4.5 text-gold-300" strokeWidth={1.75} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-ui text-xs uppercase tracking-eyebrow text-ivory-100 group-hover:text-gold-300 font-semibold leading-tight">
                      Install CrewKit
                    </span>
                    <span className="text-[11px] text-mist-300 mt-0.5">
                      {isIOS ? 'Tap Share → Add to Home Screen' : 'Full-screen, offline-ready access'}
                    </span>
                  </div>
                </button>
              )}

              {/* Row 2: Mood Switching (Night Cabin vs Day Cabin) */}
              <div
                onClick={() => toggleTheme()}
                className="flex items-center justify-between w-full px-3 py-3 rounded-xl hover:bg-ink-800/60 text-left transition-colors group cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-ink-800/80 border border-gold-dim flex items-center justify-center text-gold-300 group-hover:border-gold-400/50 shrink-0">
                    <SunMoon className="w-4.5 h-4.5 text-gold-300" strokeWidth={1.75} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-ui text-xs uppercase tracking-eyebrow text-ivory-100 group-hover:text-gold-300 font-semibold leading-tight">
                      Cabin Mood
                    </span>
                    <span className="text-[11px] text-mist-300 mt-0.5">
                      {isNight ? 'Night Cabin (Midnight)' : 'Day Cabin (Pearl Cream)'}
                    </span>
                  </div>
                </div>

                {/* Segmented Switch */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center p-0.5 bg-ink-800 border border-gold-dim rounded-full relative shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-ui uppercase tracking-wider font-semibold transition-all ${
                      isNight
                        ? 'bg-gold-400 text-onyx-900 shadow-sm'
                        : 'text-mist-300 hover:text-ivory-100'
                    }`}
                    aria-label="Set Night Cabin"
                  >
                    <Moon className="w-3 h-3" />
                    <span>Night</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-ui uppercase tracking-wider font-semibold transition-all ${
                      !isNight
                        ? 'bg-gold-400 text-onyx-900 shadow-sm'
                        : 'text-mist-300 hover:text-ivory-100'
                    }`}
                    aria-label="Set Day Cabin"
                  >
                    <Sun className="w-3 h-3" />
                    <span>Day</span>
                  </button>
                </div>
              </div>

              {/* Row 3: Feedback & Suggestions */}
              <a
                href="https://t.me"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between w-full px-3 py-3 rounded-xl hover:bg-ink-800/60 text-left transition-colors group min-h-[44px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-ink-800/80 border border-gold-dim flex items-center justify-center text-gold-300 group-hover:border-gold-400/50 shrink-0">
                    <MessageCircle className="w-4.5 h-4.5 text-gold-300" strokeWidth={1.75} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-ui text-xs uppercase tracking-eyebrow text-ivory-100 group-hover:text-gold-300 font-semibold leading-tight">
                      Feedback &amp; Crew Chat
                    </span>
                    <span className="text-[11px] text-mist-300 mt-0.5">
                      Chat with developer on Telegram
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-mist-400 group-hover:text-gold-300 mr-1" />
              </a>

              {/* Row 4: Settings */}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/settings');
                }}
                className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-ink-800/60 text-left transition-colors group min-h-[44px] ${
                  location.pathname === '/settings' ? 'bg-gold-400/10 text-gold-300' : ''
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-ink-800/80 border border-gold-dim flex items-center justify-center text-gold-300 group-hover:border-gold-400/50 shrink-0">
                  <Settings className="w-4.5 h-4.5 text-gold-300" strokeWidth={1.75} />
                </div>
                <div className="flex flex-col">
                  <span className="font-ui text-xs uppercase tracking-eyebrow text-ivory-100 group-hover:text-gold-300 font-semibold leading-tight">
                    Settings &amp; Rates
                  </span>
                  <span className="text-[11px] text-mist-300 mt-0.5">
                    Allowances, modifiers, diagnostics
                  </span>
                </div>
              </button>

              {/* Divider & Footer */}
              <div className="mt-1 pt-2 border-t border-gold-dim px-3 py-1 text-center">
                <span className="text-[11px] text-mist-400 font-ui tracking-wide">
                  {APP_NAME} <span className="font-mono text-gold-300">v{APP_VERSION}</span> &bull; SQ Cabin Crew
                </span>
              </div>
            </div>
          </>
        )}

        {/* Main Content Area (Single Viewport, Zero Scroll) */}
        <main className="flex-1 flex flex-col justify-between min-h-0 py-1 overflow-hidden relative z-10">
          {children}
        </main>

        {/* Thin Single Whisper Line Footer */}
        <footer className="shrink-0 text-center py-2 select-none">
          <p className="text-[0.68rem] text-mist-400 font-ui uppercase tracking-eyebrow">
            Unofficial crew companion &bull; CrewKit is an independent tool &bull; Not affiliated with SQ
          </p>
        </footer>
      </div>
    </div>
  );
};
