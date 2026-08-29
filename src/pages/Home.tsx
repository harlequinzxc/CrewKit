import React from 'react';
import { Layout } from '../components/Layout';
import { NavCard } from '../components/NavCard';
import { Calculator, UtensilsCrossed, Printer } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <Layout>
      <div className="flex flex-col justify-between h-full py-2 animate-fade-in">
        
        {/* Controlled Upper Spacer */}
        <div className="flex-1 max-h-12 sm:max-h-16" />

        {/* Hero Block (Upper-Middle Viewport) */}
        <div className="flex flex-col items-center text-center px-2">
          {/* Eyebrow */}
          <span className="font-serif italic text-accent text-base sm:text-[1.05rem] tracking-wide mb-3">
            Cabin crew toolkit
          </span>

          {/* Headline */}
          <h1 className="font-serif text-[clamp(1.9rem,7vw,2.9rem)] font-normal text-text-primary tracking-tight leading-[1.1] max-w-md">
            Your cabin crew <span className="italic text-accent font-normal">companion.</span>
          </h1>

          {/* Subcopy */}
          <p className="font-sans text-[0.88rem] sm:text-[0.92rem] text-text-secondary mt-4 max-w-[380px] leading-relaxed">
            Refined tools for allowances, dining, and print prep.
          </p>
        </div>

        {/* Controlled Middle Spacer */}
        <div className="flex-1 max-h-10 sm:max-h-14" />

        {/* 3-Card Nav Grid (Stacked on mobile, 3-column on desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full my-auto">
          <NavCard
            to="/crewcash"
            title="CrewCash"
            description="Allowances &amp; meals"
            icon={Calculator}
          />
          <NavCard
            to="/skymenu"
            title="SkyMenu"
            description="Inflight menus"
            icon={UtensilsCrossed}
          />
          <NavCard
            to="/inkflight"
            title="InkFlight"
            description="Print homework"
            icon={Printer}
          />
        </div>

        {/* Controlled Lower Spacer */}
        <div className="flex-1 max-h-12 sm:max-h-16" />

      </div>
    </Layout>
  );
};
