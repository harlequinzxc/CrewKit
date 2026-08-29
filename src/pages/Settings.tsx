import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { ThemeToggle } from '../components/ThemeToggle';
import { APP_VERSION, APP_NAME } from '../config/version';
import {
  DollarSign,
  Palette,
  Database,
  Info,
  Download,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Plane
} from 'lucide-react';

type SettingsTab = 'rates' | 'appearance' | 'data' | 'about';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [feedback, setFeedback] = useState<string | null>(null);

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'appearance', label: 'Theme', icon: Palette },
    { id: 'rates', label: 'Rates', icon: DollarSign },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'about', label: 'About', icon: Info },
  ];

  const handleDataAction = (action: string) => {
    setFeedback(`${action} triggered (Placeholder scaffold)`);
    setTimeout(() => {
      setFeedback(null);
    }, 2500);
  };

  return (
    <Layout
      title="Settings"
      subtitle="Preferences &amp; Rates"
      showBack={true}
      backTo="/"
    >
      <div className="flex flex-col justify-between h-full py-1 animate-fade-in">
        
        {/* Settings Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-full bg-bg-elevated border border-border-subtle shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-accent text-[#070B14] font-semibold shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels (Single Viewport container) */}
        <div className="flex-1 flex flex-col justify-center min-h-0 my-auto">
          
          {/* TAB 1: Appearance (Functional Theme Switcher) */}
          {activeTab === 'appearance' && (
            <div className="flex flex-col gap-3 max-w-sm sm:max-w-md mx-auto w-full animate-fade-in">
              <div className="text-center">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
                  Interface Preferences
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-medium text-text-primary mt-0.5">
                  App Appearance
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Choose between quiet luxury dark mode and warm paper light mode.
                </p>
              </div>

              {/* Functional Theme Toggle Switch */}
              <ThemeToggle showLabel={true} />

              <div className="p-3.5 rounded-card bg-bg-surface border border-border-subtle flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-accent" />
                  <span className="text-xs font-medium text-text-primary">Persistent Preference</span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Your theme setting is instantly applied across all pages and saved to your device for offline flights.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Rates & Modifiers (Placeholder list with greyed-out inputs) */}
          {activeTab === 'rates' && (
            <div className="flex flex-col gap-2.5 max-w-sm sm:max-w-md mx-auto w-full animate-fade-in">
              <div className="text-center">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
                  Allowance Multipliers
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-medium text-text-primary mt-0.5">
                  Rates &amp; Modifiers
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Configure custom location per diems and seniority modifiers.
                </p>
              </div>

              <div className="p-3.5 rounded-card bg-bg-surface border border-border-subtle flex flex-col gap-2.5 shadow-sm">
                
                {/* Rate item 1 */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-medium text-text-primary">Meal Rates by Country</span>
                    <span className="text-[10px] text-text-tertiary">Singapore Standard</span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value="SIA Tier 1 / Tier 2 Location Tables"
                    className="w-full px-3 py-1.5 rounded-well bg-bg-elevated/50 border border-border-subtle text-text-tertiary text-xs cursor-not-allowed"
                  />
                </div>

                {/* Rate item 2 */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-medium text-text-primary">Rank Modifier</span>
                    <span className="text-[10px] text-text-tertiary">Flight Steward / Stewardess</span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value="1.00x Base Seniority"
                    className="w-full px-3 py-1.5 rounded-well bg-bg-elevated/50 border border-border-subtle text-text-tertiary text-xs cursor-not-allowed"
                  />
                </div>

                {/* Rate item 3 */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-medium text-text-primary">Other Modifiers</span>
                    <span className="text-[10px] text-text-tertiary">Special Sector Allowances</span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value="+15% ULR / Long-Haul Premium"
                    className="w-full px-3 py-1.5 rounded-well bg-bg-elevated/50 border border-border-subtle text-text-tertiary text-xs cursor-not-allowed"
                  />
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: Data Import / Export */}
          {activeTab === 'data' && (
            <div className="flex flex-col gap-3 max-w-sm sm:max-w-md mx-auto w-full animate-fade-in">
              <div className="text-center">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
                  Backup &amp; Migration
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-medium text-text-primary mt-0.5">
                  Data Management
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Export or restore your custom rate tables and saved settings.
                </p>
              </div>

              {feedback && (
                <div className="flex items-center justify-center gap-1.5 py-1 px-3 rounded-full bg-success/15 border border-success/30 text-success text-[11px] font-medium animate-fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{feedback}</span>
                </div>
              )}

              <div className="p-4 rounded-card bg-bg-surface border border-border-subtle flex flex-col gap-3 shadow-sm">
                <button
                  onClick={() => handleDataAction('Export Settings JSON')}
                  className="flex items-center justify-between p-3 rounded-well bg-bg-elevated border border-border-subtle hover:border-accent group active:scale-98 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-accent" />
                    <div className="text-left">
                      <span className="text-xs font-medium text-text-primary block">
                        Export Settings (JSON)
                      </span>
                      <span className="text-[10px] text-text-secondary">
                        Save backup file to your device
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-bg-surface text-accent border border-border-subtle">
                    JSON
                  </span>
                </button>

                <button
                  onClick={() => handleDataAction('Import Settings JSON')}
                  className="flex items-center justify-between p-3 rounded-well bg-bg-elevated border border-border-subtle hover:border-accent group active:scale-98 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Upload className="w-4 h-4 text-accent" />
                    <div className="text-left">
                      <span className="text-xs font-medium text-text-primary block">
                        Import Settings (JSON)
                      </span>
                      <span className="text-[10px] text-text-secondary">
                        Load configuration from backup
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-bg-surface text-text-secondary border border-border-subtle">
                    Upload
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: About */}
          {activeTab === 'about' && (
            <div className="flex flex-col gap-2.5 max-w-sm sm:max-w-md mx-auto w-full animate-fade-in">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-bg-surface border border-border-medium text-accent mb-1 shadow-sm">
                  <Plane className="w-5 h-5 rotate-[-15deg]" />
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-medium text-text-primary leading-tight">
                  {APP_NAME}
                </h2>
                <span className="text-[11px] font-mono text-accent">
                  Version {APP_VERSION} (Scaffold Chunk 1)
                </span>
              </div>

              <div className="p-3.5 rounded-card bg-bg-surface border border-border-subtle flex flex-col gap-2 shadow-sm text-xs text-text-secondary leading-relaxed">
                <p>
                  <strong className="text-text-primary font-medium">{APP_NAME}</strong> is an editorial-grade Progressive Web App designed specifically for Singapore Airlines cabin crew.
                </p>
                <div className="pt-2 border-t border-border-subtle flex flex-col gap-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Architecture:</span>
                    <span className="text-text-primary">React + TS + Vite + Tailwind</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Installation:</span>
                    <span className="text-text-primary">PWA Offline-Ready</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Viewport Mode:</span>
                    <span className="text-text-primary">Single-Viewport, Zero Scroll</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Settings Footer Note */}
        <div className="shrink-0 text-center pt-2">
          <span className="text-[10px] text-text-tertiary">
            Preferences are saved locally &bull; Client-side only
          </span>
        </div>

      </div>
    </Layout>
  );
};
