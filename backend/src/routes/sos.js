const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { sendOnAllChannels } = require('../services/twilioService');

const router = express.Router();

/**
 * One-Tap SOS: bypasses all reminder logic and immediately broadcasts an
 * emergency message to every registered guardian, on every channel.
 */
router.post('/patient/:patientId/trigger', async (req, res) => {
  const { custom_message } = req.body;
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.patientId);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const guardians = db.prepare('SELECT * FROM guardians WHERE patient_id = ?').all(patient.id);
  const message =
    custom_message ||
    `EMERGENCY: ${patient.full_name} has triggered an SOS alert and may need immediate help. Please contact them or call emergency services now.`;

  const notified = [];
  for (const g of guardians) {
    await sendOnAllChannels(g.whatsapp_number, message).catch(() => {});
    notified.push(g.id);
  }

  db.prepare(`INSERT INTO sos_events (id, patient_id, message, notified_guardians) VALUES (?, ?, ?, ?)`).run(
    uuidv4(),
    patient.id,
    message,
    JSON.stringify(notified)
  );

  res.json({ ok: true, notified_guardians: notified.length });
});

module.exports = router;
