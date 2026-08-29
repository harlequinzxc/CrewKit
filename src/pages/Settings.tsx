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
  Plane
} from 'lucide-react';

type SettingsTab = 'appearance' | 'rates' | 'data' | 'about';

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
    setFeedback(`${action} triggered (Placeholder)`);
    setTimeout(() => {
      setFeedback(null);
    }, 2500);
  };

  return (
    <Layout>
      <div className="flex flex-col justify-between h-full py-1 animate-fade-in">
        
        {/* Generous empty top spacer */}
        <div className="flex-1 max-h-8 sm:max-h-12" />

        {/* Editorial Hero & Settings Content */}
        <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center my-auto">
          
          <span className="font-serif italic text-accent text-base sm:text-lg tracking-wide mb-1">
            Customise,
          </span>

          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary tracking-tight leading-snug">
            Toolkit Preferences
          </h2>

          {/* Segmented Tab Row */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-full bg-bg-elevated border border-border-subtle w-full mt-5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-full text-xs font-medium transition-all ${
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

          {/* Tab Content Panels (Directly on background) */}
          <div className="w-full mt-4 text-left">
            
            {/* TAB 1: Appearance */}
            {activeTab === 'appearance' && (
              <div className="space-y-3 animate-fade-in">
                <ThemeToggle showLabel={true} />
                <p className="text-[11px] text-text-secondary text-center italic">
                  Theme preference is instantly applied and cached for offline flights.
                </p>
              </div>
            )}

            {/* TAB 2: Rates & Modifiers */}
            {activeTab === 'rates' && (
              <div className="space-y-2.5 animate-fade-in">
                <div className="p-2.5 rounded-well bg-bg-elevated border border-border-subtle">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-text-secondary block mb-1">
                    Meal Rates by Country
                  </span>
                  <input
                    type="text"
                    disabled
                    value="SIA Tier 1 / Tier 2 Per Diems"
                    className="w-full bg-transparent text-xs text-text-tertiary cursor-not-allowed focus:outline-none"
                  />
                </div>

                <div className="p-2.5 rounded-well bg-bg-elevated border border-border-subtle">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-text-secondary block mb-1">
                    Rank Seniority Modifier
                  </span>
                  <input
                    type="text"
                    disabled
                    value="1.00x Flight Steward / Stewardess"
                    className="w-full bg-transparent text-xs text-text-tertiary cursor-not-allowed focus:outline-none"
                  />
                </div>

                <div className="p-2.5 rounded-well bg-bg-elevated border border-border-subtle">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-text-secondary block mb-1">
                    Other Modifiers
                  </span>
                  <input
                    type="text"
                    disabled
                    value="+15% ULR / Ultra-Long Haul Premium"
                    className="w-full bg-transparent text-xs text-text-tertiary cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: Data */}
            {activeTab === 'data' && (
              <div className="space-y-2.5 animate-fade-in">
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
                      <span className="text-[10px] text-text-secondary">Download JSON backup</span>
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
                      <span className="text-[10px] text-text-secondary">Restore from JSON file</span>
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
              <div className="p-3.5 rounded-well bg-bg-elevated border border-border-subtle text-xs text-text-secondary space-y-2 animate-fade-in">
                <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-accent rotate-[-15deg]" />
                    <span className="font-serif font-medium text-text-primary">{APP_NAME}</span>
                  </div>
                  <span className="font-mono text-accent text-[11px]">v{APP_VERSION}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  A progressive, single-viewport toolkit crafted for Singapore Airlines cabin crew.
                </p>
                <div className="pt-1 text-[10px] text-text-tertiary flex justify-between">
                  <span>Architecture: PWA + Client SPA</span>
                  <span>Zero-Scroll Lock</span>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Generous empty bottom spacer */}
        <div className="flex-1 max-h-8 sm:max-h-12" />

      </div>
    </Layout>
  );
};
