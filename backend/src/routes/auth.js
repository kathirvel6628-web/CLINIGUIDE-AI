const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');

const router = express.Router();

/**
 * One-time registration: patient details + guardian/family WhatsApp numbers.
 * Guardians are collected up front so the 3-tier escalation and SOS button
 * have somewhere to send alerts from day one.
 */
router.post('/register', (req, res) => {
  const { full_name, phone_number, preferred_language, preferred_channel, guardians } = req.body;

  if (!full_name || !phone_number) {
    return res.status(400).json({ error: 'full_name and phone_number are required' });
  }
  if (!Array.isArray(guardians) || guardians.length === 0) {
    return res.status(400).json({ error: 'At least one guardian/family WhatsApp number is required' });
  }

  const patientId = uuidv4();
  db.prepare(
    `INSERT INTO patients (id, full_name, phone_number, preferred_language, preferred_channel)
     VALUES (?, ?, ?, ?, ?)`
  ).run(patientId, full_name, phone_number, preferred_language || 'en', preferred_channel || 'whatsapp');

  const insertGuardian = db.prepare(
    `INSERT INTO guardians (id, patient_id, name, whatsapp_number, relation) VALUES (?, ?, ?, ?, ?)`
  );
  guardians.forEach((g) => {
    if (g.whatsapp_number) {
      insertGuardian.run(uuidv4(), patientId, g.name || 'Guardian', g.whatsapp_number, g.relation || null);
    }
  });

  res.status(201).json({ patient_id: patientId });
});

router.get('/patients/:id', (req, res) => {
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Not found' });
  const guardians = db.prepare('SELECT * FROM guardians WHERE patient_id = ?').all(req.params.id);
  res.json({ ...patient, guardians });
});

module.exports = router;
