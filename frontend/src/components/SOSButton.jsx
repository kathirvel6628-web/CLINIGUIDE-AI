import React, { useRef, useState } from 'react';
import { api } from '../services/api';

const DOUBLE_TAP_WINDOW_MS = 400;

/**
 * Fixed emergency button. Requires a double-tap so it can't be triggered by
 * an accidental brush, per the spec's "double tap to do" requirement.
 */
export default function SOSButton({ patientId }) {
  const lastTapRef = useRef(0);
  const [status, setStatus] = useState('idle'); // idle | armed | sending | sent

  const handleTap = async () => {
    const now = Date.now();
    const gap = now - lastTapRef.current;
    lastTapRef.current = now;

    if (gap < DOUBLE_TAP_WINDOW_MS) {
      setStatus('sending');
      try {
        await api.triggerSOS(patientId);
        setStatus('sent');
        setTimeout(() => setStatus('idle'), 4000);
      } catch (e) {
        setStatus('idle');
        alert('Could not send SOS - check your connection and try again.');
      }
    } else {
      setStatus('armed');
      setTimeout(() => setStatus((s) => (s === 'armed' ? 'idle' : s)), DOUBLE_TAP_WINDOW_MS);
    }
  };

  return (
    <button
      onClick={handleTap}
      aria-label="Emergency SOS - double tap to alert family"
      className={`tap-target fixed top-3 right-3 z-50 rounded-full px-4 py-2 font-semibold text-white shadow-md transition-colors
        ${status === 'sent' ? 'bg-confirm' : status === 'armed' ? 'bg-danger/80' : 'bg-danger'}`}
    >
      {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Family notified' : status === 'armed' ? 'Tap again' : 'SOS'}
    </button>
  );
}
