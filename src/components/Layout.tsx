import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { APP_VERSION, APP_NAME } from '../config/version';
import { Logo } from './Logo';
import { BackButton } from './BackButton';
import {
  Menu,
  X,
  Smartphone,
  SunMoon,
  MessageCircle,
  Settings,
  ExternalLink,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface LayoutProps {
  children: React.ReactNode;
  containerClassName?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, containerClassName = 'w-full md:w-[90%] max-w-6xl' }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installPromptMsg, setInstallPromptMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, setTheme } = useTheme();
  const isHome = location.pathname === '/';

  useEffect(() => {
    // Check if running as installed PWA (standalone)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(Boolean(isStandaloneMode));
    };

    // Check iOS user agent
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
    <div className="h-screen h-[100dvh] w-screen overflow-hidden flex flex-col bg-bg-base app-atmosphere text-text-primary transition-colors duration-250 select-none">
      {/* Centered App Container */}
      <div className={`w-full ${containerClassName} mx-auto h-full flex flex-col justify-between px-4 sm:px-6 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] relative overflow-hidden transition-all duration-300`}>
        
        {/* Top Bar */}
        <header className="flex items-center justify-between h-14 shrink-0 z-30 pt-1">
          {/* LEFT: Back button on inner pages + Nav lockup */}
          <div className="flex items-center gap-3">
            {!isHome && <BackButton to="/" />}
            <Logo to="/" size="sm" />
          </div>

          {/* RIGHT: Single Circular Ghost Hamburger Button (40px) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-bg-elevated border flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-base ${
              menuOpen
                ? 'border-accent/60 text-accent ring-2 ring-accent/20'
                : 'border-border-subtle text-text-secondary hover:text-accent hover:border-border-hover'
            }`}
          >
            {menuOpen ? (
              <X className="w-4.5 h-4.5 text-accent" strokeWidth={2} />
            ) : (
              <Menu className="w-4.5 h-4.5 text-text-secondary hover:text-accent" strokeWidth={1.75} />
            )}
          </button>
        </header>

        {/* Floating Glass Dropdown Menu */}
        {menuOpen && (
          <>
            {/* Scrim Overlay */}
            <div
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
            />

            {/* Glass Panel Anchored Top-Right */}
            <div className="absolute top-16 right-6 w-80 max-w-[calc(100vw-3rem)] rounded-card glass-panel p-2 z-50 shadow-elevated-glass animate-menu-in flex flex-col gap-0.5 text-left">
              
              {installPromptMsg && (
                <div className="mx-2 my-1.5 p-2 rounded-lg bg-accent/15 border border-accent/30 text-[11px] text-accent font-medium text-center animate-fade-in">
                  {installPromptMsg}
                </div>
              )}

              {/* Row 1: Install CrewKit (Hidden if standalone installed) */}
              {!isStandalone && (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-3 w-full px-3 py-3.5 rounded-xl hover:bg-bg-surface text-left transition-colors group min-h-[44px]"
                >
                  <div className="w-9 h-9 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center text-accent group-hover:border-accent/40 shrink-0">
                    <Smartphone className="w-4.5 h-4.5 text-accent" strokeWidth={1.75} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-text-primary group-hover:text-accent leading-tight">
                      Install CrewKit
                    </span>
                    <span className="text-[11px] text-text-secondary mt-0.5">
                      {isIOS ? 'Tap Share → Add to Home Screen' : 'Full-screen, offline-ready access'}
                    </span>
                  </div>
                </button>
              )}

              {/* Row 2: Appearance (Whole Row Toggles Theme + Mini Segmented Switch) */}
              <div
                onClick={() => toggleTheme()}
                className="flex items-center justify-between w-full px-3 py-3.5 rounded-xl hover:bg-bg-surface text-left transition-colors group cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center text-accent group-hover:border-accent/40 shrink-0">
                    <SunMoon className="w-4.5 h-4.5 text-accent" strokeWidth={1.75} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-text-primary group-hover:text-accent leading-tight">
                      Appearance
                    </span>
                    <span className="text-[11px] text-text-secondary mt-0.5">
                      Switch light / dark
                    </span>
                  </div>
                </div>

                {/* Real Mini Segmented Toggle */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center p-0.5 bg-bg-elevated border border-border-subtle rounded-full relative shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
                      theme === 'dark'
                        ? 'bg-accent text-[#0B1E3E] font-semibold shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                    aria-label="Set dark theme"
                  >
                    <Moon className="w-3 h-3" />
                    <span>Dark</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
                      theme === 'light'
                        ? 'bg-accent text-[#0B1E3E] font-semibold shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                    aria-label="Set light theme"
                  >
                    <Sun className="w-3 h-3" />
                    <span>Light</span>
                  </button>
                </div>
              </div>

              {/* Row 3: Feedback & Suggestions */}
              <a
                href="https://t.me"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between w-full px-3 py-3.5 rounded-xl hover:bg-bg-surface text-left transition-colors group min-h-[44px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center text-accent group-hover:border-accent/40 shrink-0">
                    <MessageCircle className="w-4.5 h-4.5 text-accent" strokeWidth={1.75} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-text-primary group-hover:text-accent leading-tight">
                      Feedback &amp; Suggestions
                    </span>
                    <span className="text-[11px] text-text-secondary mt-0.5">
                      Chat with developer on Telegram
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-text-tertiary group-hover:text-accent mr-1" />
              </a>

              {/* Row 4: Settings */}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/settings');
                }}
                className={`flex items-center gap-3 w-full px-3 py-3.5 rounded-xl hover:bg-bg-surface text-left transition-colors group min-h-[44px] ${
                  location.pathname === '/settings' ? 'bg-accent/10 text-accent' : ''
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center text-accent group-hover:border-accent/40 shrink-0">
                  <Settings className="w-4.5 h-4.5 text-accent" strokeWidth={1.75} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-text-primary group-hover:text-accent leading-tight">
                    Settings
                  </span>
                  <span className="text-[11px] text-text-secondary mt-0.5">
                    Rates, data, preferences
                  </span>
                </div>
              </button>

              {/* Divider & Footer */}
              <div className="mt-1 pt-2.5 border-t border-[rgba(201,168,76,0.10)] px-3 py-1.5 text-center">
                <span className="text-xs text-text-tertiary">
                  {APP_NAME} <span className="font-mono text-text-secondary">v{APP_VERSION}</span> &bull; For Crew
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
        <footer className="shrink-0 text-center py-3 select-none">
          <p className="text-[0.7rem] text-text-tertiary tracking-wide">
            Unofficial crew companion &bull; CrewKit is an independent tool &bull; Not affiliated with SQ
          </p>
        </footer>

      </div>
    </div>
  );
};
