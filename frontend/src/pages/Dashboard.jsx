import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useVoiceReminder } from '../hooks/useVoiceReminder';

const STATUS_STYLES = {
  pending: 'border-clay/40 bg-clay/5',
  confirmed: 'border-confirm/40 bg-confirm/5',
  escalated_guardian: 'border-danger/40 bg-danger/5',
  missed: 'border-ink/20 bg-ink/5',
};

/** Today's medicine timeline - the home screen. Sequential by time, so a
    time-rail treatment is appropriate here (unlike generic numbered steps). */
export default function Dashboard({ patientId }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const { speak } = useVoiceReminder();

  const load = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const data = await api.getTodaySchedule(patientId);
      setSchedule(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // poll for new tiers/updates
    return () => clearInterval(interval);
  }, [patientId]);

  const handleConfirm = async (doseLogId) => {
    await api.confirmDose(doseLogId);
    load();
  };

  const handleAnnounce = (item) => {
    speak(`Time to take ${item.drug_name}, ${item.dosage || ''}`);
  };

  if (!patientId) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <p className="text-ink/70 mb-4">Please register first to see your schedule.</p>
        <Link to="/register" className="tap-target inline-block rounded-card bg-brand px-5 py-3 font-semibold text-white">
          Go to registration
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <h1 className="display text-2xl text-brand mb-4">Today's schedule</h1>

      {loading && <p className="text-ink/50">Loading…</p>}
      {!loading && schedule.length === 0 && (
        <p className="text-ink/60">No doses scheduled yet. Scan a prescription to get started.</p>
      )}

      <ol className="space-y-3 border-l-2 border-brand/20 pl-4">
        {schedule.map((item) => (
          <li key={item.id} className={`rounded-card border p-3 ${STATUS_STYLES[item.status] || ''}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">{item.scheduled_time}</span>
              <span className="text-xs uppercase tracking-wide text-ink/50">{item.status.replace('_', ' ')}</span>
            </div>
            <p className="mt-1">{item.drug_name} {item.dosage && `— ${item.dosage}`}</p>

            <div className="mt-2 flex gap-2">
              {item.status !== 'confirmed' && (
                <button
                  onClick={() => handleConfirm(item.id)}
                  className="tap-target rounded-card bg-confirm px-3 py-2 text-sm font-semibold text-white"
                >
                  I took it
                </button>
              )}
              <button
                onClick={() => handleAnnounce(item)}
                className="tap-target rounded-card border border-brand/40 px-3 py-2 text-sm font-medium text-brand"
              >
                🔊 Hear reminder
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
