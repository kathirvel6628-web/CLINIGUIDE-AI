import React from 'react';
import SOSButton from './SOSButton';

export default function TopBar({ patientId }) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-paper/95 backdrop-blur px-4 py-3 border-b border-brand/10">
      <span className="display text-xl text-brand font-semibold">CliniGuide</span>
      {patientId && <SOSButton patientId={patientId} />}
    </header>
  );
}
