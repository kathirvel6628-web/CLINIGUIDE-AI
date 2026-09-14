import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
];

/**
 * One-time registration: patient details + one or more guardian WhatsApp
 * numbers, collected up front so escalation and SOS have somewhere to go.
 */
export default function Registration({ onRegistered }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('en');
  const [guardians, setGuardians] = useState([{ name: '', whatsapp_number: '', relation: '' }]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateGuardian = (index, field, value) => {
    setGuardians((prev) => prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)));
  };

  const addGuardian = () => setGuardians((prev) => [...prev, { name: '', whatsapp_number: '', relation: '' }]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!fullName || !phone) return setError('Please enter your name and phone number.');
    const validGuardians = guardians.filter((g) => g.whatsapp_number.trim());
    if (validGuardians.length === 0) return setError('Add at least one family/guardian WhatsApp number.');

    setSubmitting(true);
    try {
      const result = await api.register({
        full_name: fullName,
        phone_number: phone,
        preferred_language: language,
        preferred_channel: 'both',
        guardians: validGuardians,
      });
      onRegistered(result.patient_id);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="display text-2xl text-brand mb-1">Welcome to CliniGuide</h1>
      <p className="text-ink/70 mb-6">Let's set up your account. This only takes a minute.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Your details</h2>
          <label className="block">
            <span className="text-sm text-ink/70">Full name</span>
            <input
              className="tap-target mt-1 w-full rounded-card border border-ink/20 px-3 py-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Lakshmi Raman"
            />
          </label>
          <label className="block">
            <span className="text-sm text-ink/70">Your phone number (for WhatsApp/SMS reminders)</span>
            <input
              className="tap-target mt-1 w-full rounded-card border border-ink/20 px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91XXXXXXXXXX"
            />
          </label>
          <label className="block">
            <span className="text-sm text-ink/70">Preferred language</span>
            <select
              className="tap-target mt-1 w-full rounded-card border border-ink/20 px-3 py-2 bg-white"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </label>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Family / guardian contacts</h2>
          <p className="text-sm text-ink/70">
            They'll be notified if a dose is missed, and instantly if you press the SOS button.
          </p>
          {guardians.map((g, i) => (
            <div key={i} className="rounded-card border border-brand/20 p-3 space-y-2">
              <input
                className="tap-target w-full rounded-card border border-ink/20 px-3 py-2"
                placeholder="Name (e.g. Son - Arjun)"
                value={g.name}
                onChange={(e) => updateGuardian(i, 'name', e.target.value)}
              />
              <input
                className="tap-target w-full rounded-card border border-ink/20 px-3 py-2"
                placeholder="WhatsApp number, e.g. +91XXXXXXXXXX"
                value={g.whatsapp_number}
                onChange={(e) => updateGuardian(i, 'whatsapp_number', e.target.value)}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addGuardian}
            className="tap-target text-brand font-medium underline underline-offset-2"
          >
            + Add another family member
          </button>
        </section>

        {error && <p className="text-danger text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="tap-target w-full rounded-card bg-brand py-3 font-semibold text-white disabled:opacity-60"
        >
          {submitting ? 'Setting up…' : 'Create my account'}
        </button>
      </form>
    </div>
  );
}
