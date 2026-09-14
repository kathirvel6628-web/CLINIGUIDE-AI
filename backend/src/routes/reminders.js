const express = require('express');
const db = require('../db/database');

const router = express.Router();

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

/** Today's dose schedule for a patient, used to render the dashboard timeline. */
router.get('/patient/:patientId/today', (req, res) => {
  const rows = db
    .prepare(
      `SELECT dl.*, m.drug_name, m.dosage, m.meal_relation
       FROM dose_logs dl
       JOIN medicines m ON m.id = dl.medicine_id
       WHERE dl.patient_id = ? AND dl.scheduled_date = ?
       ORDER BY dl.scheduled_time ASC`
    )
    .all(req.params.patientId, todayString());
  res.json(rows);
});

/** Patient (or guardian) taps "Confirm" once the medicine is taken - this stops the escalation. */
router.post('/:doseLogId/confirm', (req, res) => {
  const log = db.prepare('SELECT * FROM dose_logs WHERE id = ?').get(req.params.doseLogId);
  if (!log) return res.status(404).json({ error: 'Dose log not found' });

  db.prepare(`UPDATE dose_logs SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP WHERE id = ?`).run(
    req.params.doseLogId
  );
  res.json({ ok: true });
});

/** Captures the reason given at tier 3 ("already took it", "forgot", "feeling unwell", etc). */
router.post('/:doseLogId/reason', (req, res) => {
  const { reason } = req.body;
  db.prepare(`UPDATE dose_logs SET missed_reason = ? WHERE id = ?`).run(reason || null, req.params.doseLogId);
  res.json({ ok: true });
});

module.exports = router;
