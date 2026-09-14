import React from 'react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Today', icon: '⏱' },
  { to: '/prescriptions', label: 'Medicines', icon: '💊' },
  { to: '/upload', label: 'Scan', icon: '📷' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-brand/10 bg-paper">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `tap-target flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-sm ${
              isActive ? 'text-brand font-semibold' : 'text-ink/60'
            }`
          }
        >
          <span className="text-lg" aria-hidden>{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
