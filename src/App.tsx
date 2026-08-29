import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { CrewCash } from './pages/CrewCash';
import { SkyMenu } from './pages/SkyMenu';
import { InkFlight } from './pages/InkFlight';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/crewcash" element={<CrewCash />} />
      <Route path="/skymenu" element={<SkyMenu />} />
      <Route path="/inkflight" element={<InkFlight />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
