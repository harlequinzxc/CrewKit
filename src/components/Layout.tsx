import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { APP_VERSION, APP_NAME } from '../config/version';
import { BackButton } from './BackButton';
import {
  Menu,
  X,
  Calculator,
  Utensils,
  Printer,
  Settings,
  Home as HomeIcon,
  Moon,
  Sun,
  ChevronRight,
  Plane
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  subtitle,
  showBack = false,
  backTo = '/',
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { to: '/', label: 'Home', subtitle: 'Toolkit overview', icon: HomeIcon },
    { to: '/crewcash', label: 'CrewCash', subtitle: 'Allowance & meal rate calculator', icon: Calculator },
    { to: '/skymenu', label: 'SkyMenu', subtitle: 'Inflight menu viewer', icon: Utensils },
    { to: '/inkflight', label: 'InkFlight', subtitle: 'Print-ready homework formatter', icon: Printer },
    { to: '/settings', label: 'Settings', subtitle: 'Rates, preferences & themes', icon: Settings },
  ];

  return (
    <div className="h-screen h-[100dvh] w-screen overflow-hidden flex flex-col bg-bg-base text-text-primary transition-colors duration-250 select-none">
      {/* Outer Centered Shell */}
      <div className="w-full max-w-lg mx-auto h-full flex flex-col justify-between px-3.5 sm:px-5 py-2.5 sm:py-3.5 relative overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="flex items-center justify-between h-12 sm:h-14 shrink-0 z-30">
          <div className="flex items-center gap-2.5">
            {showBack ? (
              <BackButton to={backTo} />
            ) : (
              <Link
                to="/"
                className="flex items-center gap-2 group focus:outline-none"
                aria-label="CrewKit Home"
              >
                <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border-subtle flex items-center justify-center text-accent group-hover:border-accent/40 transition-colors shadow-sm">
                  <Plane className="w-4 h-4 text-accent rotate-[-20deg]" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-sans font-bold text-lg tracking-tight text-text-primary">
                    Crew<span className="text-accent font-serif italic">Kit</span>
                  </span>
                </div>
              </Link>
            )}

            {title && (
              <div className="flex flex-col ml-1">
                <h1 className="font-serif text-lg sm:text-xl font-medium text-text-primary leading-none">
                  {title}
                </h1>
                {subtitle && (
                  <span className="text-[10px] sm:text-xs text-text-secondary mt-0.5 tracking-wide uppercase font-medium">
                    {subtitle}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Top Right Action Icons: Quick Theme & Hamburger Menu */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark/light mode"
              className="w-10 h-10 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-secondary hover:text-accent hover:border-border-medium active:scale-95 transition-all shadow-sm"
            >
              {theme === 'dark' ? (
                <Sun className="w-4.5 h-4.5" strokeWidth={1.75} />
              ) : (
                <Moon className="w-4.5 h-4.5" strokeWidth={1.75} />
              )}
            </button>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className={`w-10 h-10 rounded-full bg-bg-elevated border flex items-center justify-center text-text-secondary hover:text-accent active:scale-95 transition-all shadow-sm ${
                menuOpen ? 'border-accent text-accent' : 'border-border-subtle hover:border-border-medium'
              }`}
            >
              {menuOpen ? (
                <X className="w-5 h-5" strokeWidth={2} />
              ) : (
                <Menu className="w-5 h-5" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </header>

        {/* Floating Glass Dropdown Menu */}
        {menuOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity animate-fade-in"
            />
            {/* Menu Panel */}
            <nav
              aria-label="App Navigation"
              className="absolute top-16 right-4 left-4 sm:left-auto sm:w-80 rounded-card glass-panel bg-bg-elevated/95 backdrop-blur-xl border border-border-medium p-3 z-50 shadow-elevated-glass animate-fade-in flex flex-col gap-1"
            >
              <div className="px-3 py-2 border-b border-border-subtle mb-1 flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-widest uppercase text-text-secondary">
                  Navigation Menu
                </span>
                <span className="text-[10px] text-accent font-medium px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20">
                  SIA Tools
                </span>
              </div>

              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                const Icon = item.icon;
                return (
                  <button
                    key={item.to}
                    onClick={() => {
                      setMenuOpen(false);
                      navigate(item.to);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-left transition-all group ${
                      isActive
                        ? 'bg-accent/15 text-accent font-medium border border-accent/25'
                        : 'text-text-primary hover:bg-bg-surface hover:text-accent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isActive ? 'bg-accent/20 text-accent' : 'bg-bg-surface text-text-secondary group-hover:text-accent'
                      }`}>
                        <Icon className="w-4 h-4" strokeWidth={1.75} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-none">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-text-secondary mt-1 leading-none">
                          {item.subtitle}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isActive ? 'text-accent' : 'text-text-tertiary group-hover:text-accent'}`} />
                  </button>
                );
              })}

              <div className="mt-2 pt-2 border-t border-border-subtle px-3 py-1 flex items-center justify-between text-[11px] text-text-tertiary">
                <span>{APP_NAME} Toolkit</span>
                <span className="font-mono text-accent/80">v{APP_VERSION}</span>
              </div>
            </nav>
          </>
        )}

        {/* Main Content Area (Single Viewport, No Scroll) */}
        <main className="flex-1 flex flex-col justify-center min-h-0 py-1.5 sm:py-2 overflow-hidden relative z-10">
          {children}
        </main>

        {/* Footer / Version Bar */}
        <footer className="shrink-0 flex items-center justify-between text-[10px] sm:text-[11px] text-text-tertiary pt-1 border-t border-border-subtle/50 select-none">
          <span className="truncate max-w-[220px] sm:max-w-none">
            Singapore Airlines Crew Companion
          </span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success/80 animate-pulse" />
            <span className="font-mono font-medium text-text-secondary">v{APP_VERSION}</span>
          </div>
        </footer>

      </div>
    </div>
  );
};
