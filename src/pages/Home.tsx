import React from 'react';
import { Layout } from '../components/ui/Layout';
import { NavCard } from '../components/NavCard';
import { Heading, Text } from '../components/ui';
import { Calculator, UtensilsCrossed, Printer } from 'lucide-react';
import { motion } from 'framer-motion';

export const Home: React.FC = () => {
  return (
    <Layout>
      <div className="flex flex-col justify-between h-full py-2 animate-cabin-in">
        {/* Controlled Upper Spacer */}
        <div className="flex-1 max-h-12 sm:max-h-16" />

        {/* Hero Editorial Block */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center px-2 max-w-xl mx-auto space-y-3"
        >
          {/* Eyebrow Label */}
          <Text
            variant="overline"
            className="text-gold-300 text-xs sm:text-[0.75rem] tracking-eyebrow-wide font-medium"
          >
            Singapore Airlines &bull; Cabin Crew Toolkit
          </Text>

          {/* Editorial Display Headline */}
          <Heading
            variant="hero"
            as="h1"
            className="text-[clamp(2.4rem,7vw,3.6rem)] font-light text-ivory-100 tracking-tight leading-[1.02]"
          >
            Your cabin crew <Heading.Highlight>companion.</Heading.Highlight>
          </Heading>

          {/* Hairline gold accent rule */}
          <div className="gold-hairline max-w-xs mx-auto my-3" />

          {/* Subcopy */}
          <Text variant="secondary" className="text-[0.88rem] sm:text-[0.95rem] max-w-md leading-relaxed">
            Refined instruments for flight allowances, inflight dining, and thermal homework prep.
          </Text>
        </motion.div>

        {/* Controlled Middle Spacer */}
        <div className="flex-1 max-h-10 sm:max-h-14" />

        {/* 3-Card Nav Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl mx-auto my-auto"
        >
          <NavCard
            to="/crewcash"
            title="CrewCash"
            description="Allowances &amp; sectors"
            icon={Calculator}
          />
          <NavCard
            to="/skymenu"
            title="SkyMenu"
            description="Inflight digital menus"
            icon={UtensilsCrossed}
          />
          <NavCard
            to="/inkflight"
            title="InkFlight"
            description="Thermal homework slip"
            icon={Printer}
          />
        </motion.div>

        {/* Controlled Lower Spacer */}
        <div className="flex-1 max-h-12 sm:max-h-16" />
      </div>
    </Layout>
  );
};
