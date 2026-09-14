import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

// Suggests a starting set of clock times based on how many times/day -
// always editable, never assumed correct.
function suggestTimes(timesPerDay) {
  const presets = {
    1: ['09:00'],
    2: ['09:00', '21:00'],
    3: ['08:00', '14:00', '20:00'],
    4: ['08:00', '12:00', '16:00', '20:00'],
  };
  return presets[timesPerDay] || ['09:00'];
}

export default function ConfirmPrescription({ patientId }) {
  const { state } = useLocation();
  const navigate = useNavigate();
  const extraction = state?.extraction;

  const [medicines, setMedicines] = useState(
    (extraction?.medicines || []).map((m) => ({
      ...m,
      schedule_times: suggestTimes(m.times_per_day),
    }))
  );
  const [saving, setSaving] = useState(false);

  if (!extraction) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center text-ink/60">
        Nothing to confirm yet. Please scan a prescription first.
      </div>
    );
  }

  const updateField = (index, field, value) => {
    setMedicines((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const updateTime = (medIndex, timeIndex, value) => {
    setMedicines((prev) =>
      prev.map((m, i) => {
        if (i !== medIndex) return m;
        const times = [...m.schedule_times];
        times[timeIndex] = value;
        return { ...m, schedule_times: times };
      })
    );
  };

  const removeMedicine = (index) => setMedicines((prev) => prev.filter((_, i) => i !== index));

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await api.confirmPrescription(extraction.prescription_id, patientId, medicines);
      navigate('/');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <h1 className="display text-2xl text-brand mb-2">Confirm your medicines</h1>
      <p className="text-ink/70 mb-4">
        Please check every detail below carefully before saving - this is what your reminders will be based on.
      </p>

      {extraction.illegible_sections && (
        <div className="mb-4 rounded-card border border-clay/50 bg-clay/10 p-3 text-sm">
          Part of the photo was hard to read: {extraction.illegible_sections}
        </div>
      )}

      <div className="space-y-4">
        {medicines.map((m, i) => (
          <div
            key={i}
            className={`rounded-card border p-3 ${m.needs_manual_review ? 'border-clay bg-clay/5' : 'border-brand/20'}`}
          >
            {m.needs_manual_review && (
              <p className="mb-2 text-sm font-medium text-clay">⚠ Please double-check this one - low confidence read.</p>
            )}
            <label className="block mb-2">
              <span className="text-sm text-ink/70">Medicine name</span>
              <input
                className="tap-target mt-1 w-full rounded-card border border-ink/20 px-3 py-2"
                value={m.drug_name || ''}
                onChange={(e) => updateField(i, 'drug_name', e.target.value)}
              />
            </label>
            <label className="block mb-2">
              <span className="text-sm text-ink/70">Dosage</span>
              <input
                className="tap-target mt-1 w-full rounded-card border border-ink/20 px-3 py-2"
                value={m.dosage || ''}
                onChange={(e) => updateField(i, 'dosage', e.target.value)}
              />
            </label>
            <p className="text-sm text-ink/70 mb-1">
              Frequency: {m.frequency_label || 'Please set manually'} {m.meal_relation !== 'none' && `(${m.meal_relation.replace('_', ' ')})`}
            </p>

            <div className="mb-1 text-sm text-ink/70">Reminder times</div>
            <div className="flex flex-wrap gap-2">
              {m.schedule_times.map((t, ti) => (
                <input
                  key={ti}
                  type="time"
                  value={t}
                  onChange={(e) => updateTime(i, ti, e.target.value)}
                  className="tap-target rounded-card border border-ink/20 px-2 py-1"
                />
              ))}
            </div>

            <button
              onClick={() => removeMedicine(i)}
              className="tap-target mt-3 text-sm text-danger underline underline-offset-2"
            >
              Remove this medicine
            </button>
          </div>
        ))}
      </div>

      {medicines.length === 0 && (
        <p className="text-ink/60 mb-4">No medicines left to confirm. Go back and rescan, or add one manually from the Medicines tab.</p>
      )}

      <button
        onClick={handleConfirm}
        disabled={saving || medicines.length === 0}
        className="tap-target mt-6 w-full rounded-card bg-brand py-3 font-semibold text-white disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Confirm and start reminders'}
      </button>
    </div>
  );
}
