import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { LogoMark } from '../components/Logo';
import { APP_VERSION, APP_NAME } from '../config/version';
import { useTheme } from '../hooks/useTheme';
import {
  DollarSign,
  Palette,
  Database,
  Info,
  Download,
  Upload,
  CheckCircle2,
  Moon,
  Sun
} from 'lucide-react';

type SettingsTab = 'theme' | 'rates' | 'data' | 'about';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('theme');
  const [feedback, setFeedback] = useState<string | null>(null);
  const { theme, setTheme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'rates', label: 'Rates', icon: DollarSign },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'about', label: 'About', icon: Info },
  ];

  const handleDataAction = (action: string) => {
    setFeedback(`${action} triggered (Placeholder)`);
    setTimeout(() => {
      setFeedback(null);
    }, 2500);
  };

  return (
    <Layout>
      <div className="flex flex-col justify-between h-full py-2 animate-fade-in">
        
        {/* Controlled Upper Spacer */}
        <div className="flex-1 max-h-8 sm:max-h-12" />

        {/* Editorial Hero Block */}
        <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center">
          
          {/* Eyebrow */}
          <span className="font-serif italic text-accent text-base sm:text-[1.05rem] tracking-wide mb-1">
            Customise,
          </span>

          {/* Headline */}
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight leading-snug">
            Toolkit Preferences
          </h2>

          {/* Single Segmented Pill Tab Bar (Directly under headline) */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-full bg-bg-elevated border border-border-subtle w-full mt-5 select-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-accent text-[#0B1E3E] font-semibold shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Single Elevated Card Container for Tab Content */}
          <div className="w-full mt-4 text-left">
            
            {/* TAB 1: Theme (Default Active) */}
            {activeTab === 'theme' && (
              <div className="animate-fade-in flex flex-col">
                <div
                  onClick={toggleTheme}
                  className="p-5 rounded-card bg-bg-surface border border-border-subtle flex items-center justify-between cursor-pointer hover:border-border-hover transition-all"
                >
                  <div className="flex flex-col pr-3">
                    <span className="font-sans font-semibold text-sm sm:text-base text-text-primary">
                      Dark Mode
                    </span>
                    <span className="text-xs text-text-secondary mt-0.5">
                      Quiet luxury deep navy palette
                    </span>
                  </div>

                  {/* Segmented Dark/Light Pill Switch */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center p-1 bg-bg-elevated border border-border-subtle rounded-full shrink-0"
                  >
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        isDark
                          ? 'bg-accent text-[#0B1E3E] font-semibold shadow-sm'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                      aria-label="Set dark mode"
                    >
                      <Moon className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>Dark</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        !isDark
                          ? 'bg-accent text-[#0B1E3E] font-semibold shadow-sm'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                      aria-label="Set light mode"
                    >
                      <Sun className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>Light</span>
                    </button>
                  </div>
                </div>

                {/* Helper Text below Card */}
                <p className="text-[0.8rem] text-text-tertiary italic text-center mt-4">
                  Applied instantly &bull; Cached offline
                </p>
              </div>
            )}

            {/* TAB 2: Rates & Modifiers */}
            {activeTab === 'rates' && (
              <div className="p-5 rounded-card bg-bg-surface border border-border-subtle space-y-3.5 animate-fade-in">
                <div>
                  <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-text-secondary block mb-1">
                    Meal Rates by Country
                  </span>
                  <input
                    type="text"
                    disabled
                    value="SIA Tier 1 / Tier 2 Per Diems"
                    className="w-full bg-bg-elevated px-3 py-2 rounded-well border border-border-subtle text-xs text-text-tertiary cursor-not-allowed focus:outline-none"
                  />
                </div>

                <div>
                  <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-text-secondary block mb-1">
                    Rank Seniority Modifier
                  </span>
                  <input
                    type="text"
                    disabled
                    value="1.00x Flight Steward / Stewardess"
                    className="w-full bg-bg-elevated px-3 py-2 rounded-well border border-border-subtle text-xs text-text-tertiary cursor-not-allowed focus:outline-none"
                  />
                </div>

                <div>
                  <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-text-secondary block mb-1">
                    Other Modifiers
                  </span>
                  <input
                    type="text"
                    disabled
                    value="+15% ULR / Ultra-Long Haul Premium"
                    className="w-full bg-bg-elevated px-3 py-2 rounded-well border border-border-subtle text-xs text-text-tertiary cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: Data */}
            {activeTab === 'data' && (
              <div className="p-5 rounded-card bg-bg-surface border border-border-subtle space-y-3 animate-fade-in">
                {feedback && (
                  <div className="flex items-center justify-center gap-1.5 py-1 px-3 rounded-full bg-success/15 border border-success/30 text-success text-[11px] font-medium animate-fade-in mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{feedback}</span>
                  </div>
                )}

                <button
                  onClick={() => handleDataAction('Export Settings JSON')}
                  className="w-full p-3 rounded-well bg-bg-elevated border border-border-subtle hover:border-accent flex items-center justify-between text-left transition-all active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-accent" />
                    <div>
                      <span className="text-xs font-medium text-text-primary block leading-none">Export Settings</span>
                      <span className="text-[10px] text-text-secondary mt-0.5 block">Download JSON backup</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-bg-surface text-accent border border-border-subtle">
                    JSON
                  </span>
                </button>

                <button
                  onClick={() => handleDataAction('Import Settings JSON')}
                  className="w-full p-3 rounded-well bg-bg-elevated border border-border-subtle hover:border-accent flex items-center justify-between text-left transition-all active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <Upload className="w-4 h-4 text-accent" />
                    <div>
                      <span className="text-xs font-medium text-text-primary block leading-none">Import Settings</span>
                      <span className="text-[10px] text-text-secondary mt-0.5 block">Restore from JSON file</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-bg-surface text-text-secondary border border-border-subtle">
                    Upload
                  </span>
                </button>
              </div>
            )}

            {/* TAB 4: About */}
            {activeTab === 'about' && (
              <div className="p-5 rounded-card bg-bg-surface border border-border-subtle text-xs text-text-secondary space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <LogoMark size={24} />
                    <span className="font-sans font-semibold text-sm text-text-primary">{APP_NAME}</span>
                  </div>
                  <span className="font-mono text-accent text-[11px] font-medium">v{APP_VERSION}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  An editorial-grade, single-viewport toolkit crafted exclusively for Singapore Airlines cabin crew.
                </p>
                <div className="pt-1.5 text-[10px] text-text-tertiary flex justify-between border-t border-border-subtle/40">
                  <span>PWA &bull; Client-side Offline</span>
                  <span>Zero-Scroll Lock</span>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Controlled Lower Spacer */}
        <div className="flex-1 max-h-8 sm:max-h-12" />

      </div>
    </Layout>
  );
};
