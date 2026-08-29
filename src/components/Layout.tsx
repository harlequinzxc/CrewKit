import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { APP_VERSION, APP_NAME } from '../config/version';
import {
  Menu,
  X,
  Smartphone,
  SunMoon,
  MessageCircle,
  Settings,
  Send,
  ExternalLink
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [installPromptMsg, setInstallPromptMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const handleInstallClick = () => {
    setInstallPromptMsg('To install: Tap Share in Safari/Chrome & select "Add to Home Screen"');
    setTimeout(() => {
      setInstallPromptMsg(null);
    }, 3500);
  };

  return (
    <div className="h-screen h-[100dvh] w-screen overflow-hidden flex flex-col bg-bg-base bg-vignette text-text-primary transition-colors duration-250 select-none">
      {/* Centered App Container (Max 480px on desktop) */}
      <div className="w-full max-w-[480px] mx-auto h-full flex flex-col justify-between px-6 py-2 relative overflow-hidden">
        
        {/* Simplified Editorial Top Bar */}
        <header className="flex items-center justify-between h-14 shrink-0 z-30 pt-1">
          {/* LEFT: Logo mark + Wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus:outline-none"
            aria-label="CrewKit Home"
          >
            {/* Origami Paper Plane Emblem */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
              <Send className="w-5 h-5 text-accent rotate-[-20deg] drop-shadow-[0_2px_8px_rgba(201,168,76,0.3)]" strokeWidth={1.8} />
            </div>
            <div className="flex items-baseline">
              <span className="font-serif text-xl tracking-tight text-text-primary">
                Crew<span className="text-accent italic font-normal ml-0.5">Kit</span>
              </span>
            </div>
          </Link>

          {/* RIGHT: Single Circular Ghost Hamburger Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className={`w-10 h-10 rounded-full bg-bg-elevated border flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm ${
              menuOpen
                ? 'border-accent/60 text-accent ring-2 ring-accent/20'
                : 'border-border-subtle text-text-secondary hover:text-accent hover:border-border-medium'
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
            {/* Backdrop */}
            <div
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
            />
            {/* Glass Panel */}
            <div className="absolute top-16 right-6 w-80 max-w-[calc(100vw-3rem)] rounded-card glass-panel p-2 z-50 shadow-elevated-glass animate-fade-in flex flex-col gap-1 text-left">
              
              {installPromptMsg && (
                <div className="mx-2 my-1.5 p-2 rounded-lg bg-accent/15 border border-accent/30 text-[11px] text-accent font-medium text-center">
                  {installPromptMsg}
                </div>
              )}

              {/* Row 1: Install CrewKit */}
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-bg-surface text-left transition-colors group"
              >
                <div className="w-9 h-9 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center text-accent group-hover:border-accent/40 shrink-0">
                  <Smartphone className="w-4.5 h-4.5 text-accent" strokeWidth={1.75} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-text-primary group-hover:text-accent leading-tight">
                    Install CrewKit
                  </span>
                  <span className="text-[11px] text-text-secondary mt-0.5">
                    Full-screen, offline-ready access
                  </span>
                </div>
              </button>

              {/* Row 2: Appearance (Toggle Theme) */}
              <button
                onClick={() => {
                  toggleTheme();
                }}
                className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-bg-surface text-left transition-colors group"
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
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-surface border border-border-subtle text-text-secondary font-medium uppercase tracking-wider">
                  {theme === 'dark' ? 'Dark' : 'Light'}
                </span>
              </button>

              {/* Row 3: Feedback & Suggestions */}
              <a
                href="https://t.me"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-bg-surface text-left transition-colors group"
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
                className={`flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-bg-surface text-left transition-colors group ${
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
              <div className="mt-1 pt-2 border-t border-border-subtle px-3 py-1.5 text-center">
                <span className="text-[11px] text-text-tertiary">
                  {APP_NAME} <span className="text-text-secondary">v{APP_VERSION}</span> &bull; For Crew
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
          <p className="text-[0.68rem] text-text-tertiary tracking-wide">
            Unofficial crew companion &bull; CrewKit is an independent tool &bull; Not affiliated with SQ
          </p>
        </footer>

      </div>
    </div>
  );
};
