const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { sendOnAllChannels } = require('./twilioService');
require('dotenv').config();

const TIER_2_MINUTES = Number(process.env.REMINDER_TIER_2_MINUTES || 1);
const TIER_3_MINUTES = Number(process.env.REMINDER_TIER_3_MINUTES || 3);

function todayString() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function minutesSince(isoTimestamp) {
  return (Date.now() - new Date(isoTimestamp).getTime()) / 60000;
}

/**
 * Tier 1: fires exactly at the scheduled dose time.
 * Creates the dose_log row for today and sends the first reminder.
 */
function runTier1() {
  const currentTime = nowHHMM();
  const date = todayString();

  const medicines = db
    .prepare('SELECT * FROM medicines WHERE is_active = 1')
    .all();

  for (const med of medicines) {
    const times = JSON.parse(med.schedule_times || '[]');
    if (!times.includes(currentTime)) continue;

    const existing = db
      .prepare('SELECT * FROM dose_logs WHERE medicine_id = ? AND scheduled_date = ? AND scheduled_time = ?')
      .get(med.id, date, currentTime);
    if (existing) continue; // already handled this minute

    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(med.patient_id);
    if (!patient) continue;

    const doseLogId = uuidv4();
    db.prepare(
      `INSERT INTO dose_logs (id, medicine_id, patient_id, scheduled_time, scheduled_date, status, tier_1_sent_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`
    ).run(doseLogId, med.id, patient.id, currentTime, date, new Date().toISOString());

    const message = `Hi ${patient.full_name}, it's time to take ${med.drug_name} (${med.dosage}). Reply DONE or tap Confirm in the app once taken.`;
    sendOnAllChannels(patient.phone_number, message).catch(() => {});
  }
}

/**
 * Tier 2 + Tier 3 escalation: scans pending dose logs and escalates any
 * that have gone unconfirmed past the configured thresholds.
 */
function runEscalationSweep() {
  const pending = db.prepare("SELECT * FROM dose_logs WHERE status = 'pending'").all();

  for (const log of pending) {
    const med = db.prepare('SELECT * FROM medicines WHERE id = ?').get(log.medicine_id);
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(log.patient_id);
    if (!med || !patient) continue;

    const sinceTier1 = minutesSince(log.tier_1_sent_at);

    // Tier 3: escalate to guardians and mark as needing a reason
    if (sinceTier1 >= TIER_3_MINUTES && !log.tier_3_sent_at) {
      const guardians = db.prepare('SELECT * FROM guardians WHERE patient_id = ?').all(patient.id);
      const message = `Reminder alert: ${patient.full_name} has not confirmed taking ${med.drug_name} (scheduled ${log.scheduled_time}). Please check in with them.`;
      guardians.forEach((g) => sendOnAllChannels(g.whatsapp_number, message).catch(() => {}));

      // Also ask the patient directly why it was missed, per the spec
      const askReason = `We noticed you haven't taken ${med.drug_name} yet. Reply with a reason (e.g. "already took it", "feeling unwell", "forgot") so we can let your family know.`;
      sendOnAllChannels(patient.phone_number, askReason).catch(() => {});

      db.prepare(
        `UPDATE dose_logs SET tier_3_sent_at = ?, status = 'escalated_guardian' WHERE id = ?`
      ).run(new Date().toISOString(), log.id);
      continue;
    }

    // Tier 2: urgent reminder directly to the patient
    if (sinceTier1 >= TIER_2_MINUTES && !log.tier_2_sent_at) {
      const message = `URGENT: You still haven't confirmed ${med.drug_name}. Please take it now and confirm in the app.`;
      sendOnAllChannels(patient.phone_number, message).catch(() => {});
      db.prepare(`UPDATE dose_logs SET tier_2_sent_at = ? WHERE id = ?`).run(new Date().toISOString(), log.id);
    }
  }
}

/** Marks a dose as missed after a long window with no confirmation (safety net, not a hard rule). */
function markStaleDosesMissed() {
  const cutoffMinutes = TIER_3_MINUTES + 120;
  const pending = db.prepare("SELECT * FROM dose_logs WHERE status IN ('pending','escalated_guardian')").all();
  for (const log of pending) {
    if (minutesSince(log.tier_1_sent_at) >= cutoffMinutes) {
      db.prepare(`UPDATE dose_logs SET status = 'missed' WHERE id = ?`).run(log.id);
    }
  }
}

function startScheduler() {
  // Runs every minute - checks for doses due right now, and escalates stale ones.
  cron.schedule('* * * * *', () => {
    try {
      runTier1();
      runEscalationSweep();
      markStaleDosesMissed();
    } catch (err) {
      console.error('[scheduler] error:', err.message);
    }
  });
  console.log('Scheduler started - checking doses every minute.');
}

module.exports = { startScheduler };
