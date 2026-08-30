import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { LogoMark } from '../components/Logo';
import { APP_VERSION, APP_NAME } from '../config/version';
import { useTheme } from '../hooks/useTheme';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Palette,
  Database,
  Info,
  Download,
  Upload,
  CheckCircle2,
  Moon,
  Sun,
  Sparkles,
} from 'lucide-react';

type SettingsTab = 'theme' | 'rates' | 'data' | 'about';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('theme');
  const [feedback, setFeedback] = useState<string | null>(null);
  const { setTheme, toggleTheme, isNight } = useTheme();

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'rates', label: 'Rates', icon: DollarSign },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'about', label: 'About', icon: Info },
  ];

  const handleDataAction = (action: string) => {
    setFeedback(`${action} triggered`);
    setTimeout(() => {
      setFeedback(null);
    }, 2500);
  };

  return (
    <Layout>
      <div className="flex flex-col justify-between h-full py-2 animate-cabin-in">
        {/* Controlled Upper Spacer */}
        <div className="flex-1 max-h-8 sm:max-h-12" />

        {/* Editorial Hero Block */}
        <div className="w-full max-w-md mx-auto flex flex-col items-center text-center">
          {/* Eyebrow (Jost uppercase) */}
          <span className="font-ui text-xs uppercase tracking-eyebrow-wide text-gold-300 font-semibold mb-1">
            Customise,
          </span>

          {/* Headline (Cormorant Garamond) */}
          <h2 className="font-display text-3xl sm:text-4xl font-light text-ivory-100 tracking-tight leading-snug">
            Toolkit Preferences
          </h2>

          {/* Single Segmented Pill Tab Bar with Framer Motion Sliding Indicator */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-full bg-ink-850 border border-gold-dim w-full mt-5 select-none relative">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-full text-xs font-ui uppercase tracking-wider font-semibold transition-all z-10 ${
                    isActive ? 'text-onyx-900' : 'text-mist-300 hover:text-ivory-100'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="settings-tab-pill"
                      className="absolute inset-0 bg-gold-400 rounded-full shadow-sm"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Single Elevated Card Container for Tab Content */}
          <div className="w-full mt-4 text-left">
            {/* TAB 1: Theme Mood */}
            {activeTab === 'theme' && (
              <div className="animate-cabin-in flex flex-col space-y-4">
                <div
                  onClick={toggleTheme}
                  className="p-5 rounded-card cabin-glass flex items-center justify-between cursor-pointer hover:border-gold-400/50 transition-all"
                >
                  <div className="flex flex-col pr-3">
                    <span className="font-display text-xl font-light text-ivory-100">
                      {isNight ? 'Night Cabin Mood' : 'Day Cabin Mood'}
                    </span>
                    <span className="font-ui text-xs text-mist-300 mt-1">
                      {isNight
                        ? 'Quiet luxury midnight navy & champagne gold'
                        : 'Luminous cream paper & antique brass gold'}
                    </span>
                  </div>

                  {/* Segmented Dark/Light Pill Switch */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center p-1 bg-ink-850 border border-gold-dim rounded-full shrink-0"
                  >
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-ui uppercase tracking-wider font-semibold transition-all ${
                        isNight
                          ? 'bg-gold-400 text-onyx-900 shadow-sm'
                          : 'text-mist-300 hover:text-ivory-100'
                      }`}
                      aria-label="Set Night Cabin"
                    >
                      <Moon className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>Night</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-ui uppercase tracking-wider font-semibold transition-all ${
                        !isNight
                          ? 'bg-gold-400 text-onyx-900 shadow-sm'
                          : 'text-mist-300 hover:text-ivory-100'
                      }`}
                      aria-label="Set Day Cabin"
                    >
                      <Sun className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>Day</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-card bg-ink-850/60 border border-gold-dim text-left flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                  <p className="text-xs font-ui text-mist-300 leading-relaxed">
                    Theme switch glides smoothly with a 0.5s transition and synchronizes across all browser sessions without flash of unstyled content (zero-FOUC).
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: Rates & Modifiers */}
            {activeTab === 'rates' && (
              <div className="p-5 rounded-card cabin-glass space-y-3.5 animate-cabin-in">
                <div>
                  <span className="text-[0.72rem] font-ui uppercase tracking-eyebrow text-mist-300 block mb-1">
                    Meal Rates by Country
                  </span>
                  <input
                    type="text"
                    disabled
                    value="SIA Tier 1 / Tier 2 Per Diems"
                    className="w-full bg-ink-850 px-3 py-2 rounded-well border border-gold-dim text-xs font-ui text-mist-400 cursor-not-allowed focus:outline-none"
                  />
                </div>

                <div>
                  <span className="text-[0.72rem] font-ui uppercase tracking-eyebrow text-mist-300 block mb-1">
                    Rank Seniority Rates
                  </span>
                  <input
                    type="text"
                    disabled
                    value="FS/EY: $12.80 · LS: $16.50 · CS: $22.00 · IFS: $28.50"
                    className="w-full bg-ink-850 px-3 py-2 rounded-well border border-gold-dim text-xs font-ui text-mist-400 cursor-not-allowed focus:outline-none"
                  />
                </div>

                <div>
                  <span className="text-[0.72rem] font-ui uppercase tracking-eyebrow text-mist-300 block mb-1">
                    Sector Multipliers
                  </span>
                  <input
                    type="text"
                    disabled
                    value="+15% ULR / Ultra-Long Haul Premium"
                    className="w-full bg-ink-850 px-3 py-2 rounded-well border border-gold-dim text-xs font-ui text-mist-400 cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: Data */}
            {activeTab === 'data' && (
              <div className="p-5 rounded-card cabin-glass space-y-3 animate-cabin-in">
                {feedback && (
                  <div className="flex items-center justify-center gap-1.5 py-1 px-3 rounded-full bg-gold-400/15 border border-gold-400/40 text-gold-300 text-xs font-ui uppercase tracking-wider font-semibold animate-fade-in mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{feedback}</span>
                  </div>
                )}

                <button
                  onClick={() => handleDataAction('Export Settings JSON')}
                  className="w-full p-3 rounded-well bg-ink-850 border border-gold-dim hover:border-gold-400 flex items-center justify-between text-left transition-all active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-gold-400" />
                    <div>
                      <span className="text-xs font-ui uppercase tracking-wider font-semibold text-ivory-100 block leading-none">
                        Export Settings
                      </span>
                      <span className="text-[10px] text-mist-300 mt-1 block">Download JSON backup</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-ink-900 text-gold-300 font-mono border border-gold-dim">
                    JSON
                  </span>
                </button>

                <button
                  onClick={() => handleDataAction('Import Settings JSON')}
                  className="w-full p-3 rounded-well bg-ink-850 border border-gold-dim hover:border-gold-400 flex items-center justify-between text-left transition-all active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <Upload className="w-4 h-4 text-gold-400" />
                    <div>
                      <span className="text-xs font-ui uppercase tracking-wider font-semibold text-ivory-100 block leading-none">
                        Import Settings
                      </span>
                      <span className="text-[10px] text-mist-300 mt-1 block">Restore from JSON file</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-ink-900 text-mist-300 font-mono border border-gold-dim">
                    Upload
                  </span>
                </button>
              </div>
            )}

            {/* TAB 4: About */}
            {activeTab === 'about' && (
              <div className="p-5 rounded-card cabin-glass text-xs text-mist-300 space-y-3 animate-cabin-in">
                <div className="flex items-center justify-between border-b border-gold-dim pb-3">
                  <div className="flex items-center gap-2.5">
                    <LogoMark size={24} />
                    <span className="font-display text-lg font-light text-ivory-100">{APP_NAME}</span>
                  </div>
                  <span className="font-mono text-gold-300 text-xs font-semibold">v{APP_VERSION}</span>
                </div>
                <p className="text-xs font-sans leading-relaxed text-mist-300">
                  An editorial luxury companion web app crafted exclusively for Singapore Airlines cabin crew.
                </p>
                <div className="pt-2 text-[10px] font-ui uppercase tracking-wider text-mist-400 flex justify-between border-t border-gold-dim">
                  <span>PWA &bull; Offline Ready</span>
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
