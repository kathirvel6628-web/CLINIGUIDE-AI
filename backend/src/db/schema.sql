-- CliniGuide AI database schema

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  preferred_language TEXT DEFAULT 'en',
  preferred_channel TEXT DEFAULT 'whatsapp', -- 'whatsapp' | 'sms' | 'both'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- One-time registration: guardians / family members who receive escalation + SOS alerts
CREATE TABLE IF NOT EXISTS guardians (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  relation TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- A single uploaded prescription (photo scan event)
CREATE TABLE IF NOT EXISTS prescriptions (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  source_image_path TEXT,
  status TEXT DEFAULT 'pending_confirmation', -- 'pending_confirmation' | 'confirmed' | 'archived'
  raw_ai_extraction TEXT, -- JSON blob of what Gemini returned, kept for audit
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Individual medicines belonging to a prescription. Editable after confirmation
-- so patients can add a new tablet, or update an existing one, at any time.
CREATE TABLE IF NOT EXISTS medicines (
  id TEXT PRIMARY KEY,
  prescription_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  drug_name TEXT NOT NULL,
  dosage TEXT,                -- e.g. "1 tablet", "5ml"
  frequency_code TEXT,        -- raw shorthand seen on the prescription, e.g. "TID"
  times_per_day INTEGER,      -- normalized against SHORTHAND_MAP, never trusted from AI alone
  meal_relation TEXT,         -- 'before_food' | 'after_food' | 'with_food' | 'none'
  schedule_times TEXT,        -- JSON array of "HH:MM" strings, editable by patient/guardian
  duration_days INTEGER,
  needs_manual_review INTEGER DEFAULT 0, -- 1 if AI confidence was low / unmatched shorthand
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id),
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- One row per scheduled dose per day, tracks the 3-tier escalation state
CREATE TABLE IF NOT EXISTS dose_logs (
  id TEXT PRIMARY KEY,
  medicine_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,   -- "HH:MM" for that day
  scheduled_date TEXT NOT NULL,   -- "YYYY-MM-DD"
  status TEXT DEFAULT 'pending',  -- 'pending' | 'confirmed' | 'missed' | 'escalated_guardian'
  tier_1_sent_at TEXT,
  tier_2_sent_at TEXT,
  tier_3_sent_at TEXT,
  confirmed_at TEXT,
  missed_reason TEXT,             -- captured from the tier-3 "why haven't you taken it" prompt
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sos_events (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  message TEXT,
  triggered_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notified_guardians TEXT -- JSON array of guardian ids notified
);
