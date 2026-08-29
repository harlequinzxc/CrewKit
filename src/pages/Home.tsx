import React from 'react';
import { Layout } from '../components/Layout';
import { NavCard } from '../components/NavCard';
import { Calculator, Utensils, Printer, Settings, Plane } from 'lucide-react';
import { APP_TAGLINE } from '../config/version';

export const Home: React.FC = () => {
  return (
    <Layout>
      <div className="flex flex-col justify-between h-full py-1 animate-fade-in">
        
        {/* Centered Hero / Identity */}
        <div className="flex flex-col items-center text-center my-auto py-2">
          {/* Logo Mark */}
          <div className="relative mb-3 group">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-bg-surface border border-border-medium flex items-center justify-center shadow-gold-glow/20 transition-all duration-300 group-hover:scale-105 group-hover:border-accent">
              <Plane className="w-7 h-7 sm:w-8 sm:h-8 text-accent rotate-[-15deg]" strokeWidth={1.75} />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-accent/10 blur-md -z-10 opacity-70" />
          </div>

          {/* Eyebrow */}
          <span className="font-serif italic text-accent text-sm sm:text-base tracking-wide">
            Singapore Airlines Companion
          </span>

          {/* App Title */}
          <h1 className="font-sans font-bold text-3xl sm:text-4xl tracking-tight text-text-primary mt-1">
            Crew<span className="text-accent font-serif font-normal italic">Kit</span>
          </h1>

          {/* Subtitle / Tagline */}
          <p className="font-serif italic text-text-secondary text-sm sm:text-base mt-1 max-w-xs sm:max-w-sm">
            {APP_TAGLINE} &mdash; <span className="text-accent-soft">effortless, fast &amp; offline</span>
          </p>
        </div>

        {/* 2x2 Feature Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 my-auto">
          <NavCard
            to="/crewcash"
            title="CrewCash"
            description="Inflight allowance + meal rate calculator"
            icon={Calculator}
            badge="Calculator"
          />
          <NavCard
            to="/skymenu"
            title="SkyMenu"
            description="Singapore Airlines inflight menu viewer"
            icon={Utensils}
            badge="Menu"
          />
          <NavCard
            to="/inkflight"
            title="InkFlight"
            description="Inflight menu homework formatter"
            icon={Printer}
            badge="Formatter"
          />
          <NavCard
            to="/settings"
            title="Settings"
            description="Rates, theme toggles & preferences"
            icon={Settings}
            badge="Prefs"
          />
        </div>

        {/* Quick Help / Info Pill */}
        <div className="mt-auto pt-2 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-elevated/80 border border-border-subtle text-[11px] text-text-secondary">
            <span className="w-2 h-2 rounded-full bg-accent/70 animate-pulse" />
            <span>Chunk 1 Scaffold &bull; Select any tool to preview</span>
          </div>
        </div>

      </div>
    </Layout>
  );
};
