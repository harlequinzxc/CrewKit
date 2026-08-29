import React from 'react';
import { Layout } from '../components/Layout';
import { NavCard } from '../components/NavCard';
import { Calculator, Utensils, Printer, Settings } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <Layout>
      <div className="flex flex-col justify-between h-full py-2 animate-fade-in">
        
        {/* Generous empty top spacer */}
        <div className="flex-1 max-h-8" />

        {/* Editorial Hero Identity */}
        <div className="flex flex-col items-center text-center px-2">
          {/* Eyebrow */}
          <span className="font-serif italic text-accent text-sm sm:text-base tracking-wide">
            Singapore Airlines
          </span>

          {/* Headline */}
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-text-primary mt-1 tracking-tight">
            Your cabin crew <span className="italic text-accent-soft">companion.</span>
          </h1>

          <p className="text-xs sm:text-sm text-text-secondary mt-2 tracking-wide font-light max-w-xs">
            Refined tools for allowances, inflight dining, and thermal print preparation.
          </p>
        </div>

        {/* Generous middle spacer */}
        <div className="flex-1 max-h-6" />

        {/* 2x2 Feature Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-3.5 my-auto">
          <NavCard
            to="/crewcash"
            title="CrewCash"
            description="Allowance &amp; layover meal calculator"
            icon={Calculator}
          />
          <NavCard
            to="/skymenu"
            title="SkyMenu"
            description="Inflight menu &amp; wine list viewer"
            icon={Utensils}
          />
          <NavCard
            to="/inkflight"
            title="InkFlight"
            description="Thermal receipt homework formatter"
            icon={Printer}
          />
          <NavCard
            to="/settings"
            title="Settings"
            description="Rates, theme &amp; backup preferences"
            icon={Settings}
          />
        </div>

        {/* Generous bottom spacer */}
        <div className="flex-1 max-h-8" />

      </div>
    </Layout>
  );
};
