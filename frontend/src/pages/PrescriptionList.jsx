import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

/**
 * Manage prescriptions: view everything active, edit timing/dosage on any
 * medicine, deactivate one, or add a brand new tablet without rescanning -
 * covers the "update prescription" / "add new tablet" requirement.
 */
export default function PrescriptionList({ patientId }) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState({ drug_name: '', dosage: '', schedule_times: ['09:00'] });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getMedicines(patientId);
      setMedicines(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) load();
  }, [patientId]);

  const startEdit = (med) => {
    setEditingId(med.id);
    setDraft({ ...med });
  };

  const saveEdit = async () => {
    await api.updateMedicine(editingId, {
      drug_name: draft.drug_name,
      dosage: draft.dosage,
      schedule_times: draft.schedule_times,
    });
    setEditingId(null);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Stop reminders for this medicine?')) return;
    await api.deleteMedicine(id);
    load();
  };

  const addTime = (list, setter) => setter((prev) => ({ ...prev, schedule_times: [...(list || []), '09:00'] }));

  const submitNewMed = async () => {
    if (!newMed.drug_name.trim()) return;
    await api.addMedicine(patientId, newMed);
    setNewMed({ drug_name: '', dosage: '', schedule_times: ['09:00'] });
    setShowAddForm(false);
    load();
  };

  if (!patientId) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center text-ink/60">
        <Link to="/register" className="text-brand underline">Register</Link> first to manage medicines.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <h1 className="display text-2xl text-brand mb-4">Your medicines</h1>

      {loading && <p className="text-ink/50">Loading…</p>}
      {!loading && medicines.length === 0 && <p className="text-ink/60 mb-4">No medicines yet.</p>}

      <div className="space-y-3 mb-6">
        {medicines.map((m) => (
          <div key={m.id} className="rounded-card border border-brand/20 p-3">
            {editingId === m.id ? (
              <div className="space-y-2">
                <input
                  className="tap-target w-full rounded-card border border-ink/20 px-3 py-2"
                  value={draft.drug_name}
                  onChange={(e) => setDraft({ ...draft, drug_name: e.target.value })}
                />
                <input
                  className="tap-target w-full rounded-card border border-ink/20 px-3 py-2"
                  value={draft.dosage || ''}
                  onChange={(e) => setDraft({ ...draft, dosage: e.target.value })}
                  placeholder="Dosage"
                />
                <div className="flex flex-wrap gap-2">
                  {(draft.schedule_times || []).map((t, ti) => (
                    <input
                      key={ti}
                      type="time"
                      value={t}
                      onChange={(e) => {
                        const times = [...draft.schedule_times];
                        times[ti] = e.target.value;
                        setDraft({ ...draft, schedule_times: times });
                      }}
                      className="tap-target rounded-card border border-ink/20 px-2 py-1"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => addTime(draft.schedule_times, (fn) => setDraft(fn(draft)))}
                    className="tap-target rounded-card border border-brand/40 px-3 text-brand"
                  >
                    + time
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="tap-target rounded-card bg-brand px-4 py-2 font-semibold text-white">
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="tap-target rounded-card border border-ink/20 px-4 py-2">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="font-semibold">{m.drug_name}</p>
                <p className="text-sm text-ink/70">{m.dosage}</p>
                <p className="text-sm text-ink/70">{m.schedule_times.join(', ')}</p>
                <div className="mt-2 flex gap-3">
                  <button onClick={() => startEdit(m)} className="tap-target text-brand font-medium underline underline-offset-2">
                    Edit
                  </button>
                  <button onClick={() => remove(m.id)} className="tap-target text-danger font-medium underline underline-offset-2">
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showAddForm ? (
        <div className="rounded-card border border-brand/30 p-3 space-y-2">
          <h2 className="font-semibold">Add a new medicine</h2>
          <input
            className="tap-target w-full rounded-card border border-ink/20 px-3 py-2"
            placeholder="Medicine name"
            value={newMed.drug_name}
            onChange={(e) => setNewMed({ ...newMed, drug_name: e.target.value })}
          />
          <input
            className="tap-target w-full rounded-card border border-ink/20 px-3 py-2"
            placeholder="Dosage, e.g. 1 tablet"
            value={newMed.dosage}
            onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
          />
          <div className="flex flex-wrap gap-2">
            {newMed.schedule_times.map((t, ti) => (
              <input
                key={ti}
                type="time"
                value={t}
                onChange={(e) => {
                  const times = [...newMed.schedule_times];
                  times[ti] = e.target.value;
                  setNewMed({ ...newMed, schedule_times: times });
                }}
                className="tap-target rounded-card border border-ink/20 px-2 py-1"
              />
            ))}
            <button
              type="button"
              onClick={() => addTime(newMed.schedule_times, setNewMed)}
              className="tap-target rounded-card border border-brand/40 px-3 text-brand"
            >
              + time
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={submitNewMed} className="tap-target rounded-card bg-brand px-4 py-2 font-semibold text-white">
              Add medicine
            </button>
            <button onClick={() => setShowAddForm(false)} className="tap-target rounded-card border border-ink/20 px-4 py-2">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="tap-target w-full rounded-card border-2 border-dashed border-brand/40 py-3 font-medium text-brand"
        >
          + Add a new medicine
        </button>
      )}
    </div>
  );
}
