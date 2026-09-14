const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { extractPrescription } = require('../services/geminiService');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * Scan a prescription photo. This only extracts + validates - nothing is
 * saved as an active schedule until the patient/guardian confirms it via
 * POST /confirm. This is the human-in-the-loop safety step.
 */
router.post('/scan', upload.single('photo'), async (req, res) => {
  const { patient_id } = req.body;
  if (!patient_id || !req.file) {
    return res.status(400).json({ error: 'patient_id and photo are required' });
  }

  try {
    const base64 = req.file.buffer.toString('base64');
    const extraction = await extractPrescription(base64, req.file.mimetype);

    const prescriptionId = uuidv4();
    db.prepare(
      `INSERT INTO prescriptions (id, patient_id, status, raw_ai_extraction) VALUES (?, ?, 'pending_confirmation', ?)`
    ).run(prescriptionId, patient_id, JSON.stringify(extraction));

    res.json({ prescription_id: prescriptionId, ...extraction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not read the prescription. Please retake the photo or enter details manually.' });
  }
});

/**
 * Confirm (and optionally edit) the extracted medicines before they become
 * an active reminder schedule. Nothing sends reminders until this step.
 */
router.post('/:id/confirm', (req, res) => {
  const prescriptionId = req.params.id;
  const { patient_id, medicines } = req.body;

  const prescription = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(prescriptionId);
  if (!prescription) return res.status(404).json({ error: 'Prescription not found' });

  const insertMed = db.prepare(
    `INSERT INTO medicines
      (id, prescription_id, patient_id, drug_name, dosage, frequency_code, times_per_day, meal_relation, schedule_times, duration_days, needs_manual_review)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const createdIds = [];
  medicines.forEach((m) => {
    const id = uuidv4();
    insertMed.run(
      id,
      prescriptionId,
      patient_id,
      m.drug_name,
      m.dosage || null,
      m.frequency_code || null,
      m.times_per_day ?? null,
      m.meal_relation || 'none',
      JSON.stringify(m.schedule_times || []),
      m.duration_days ?? null,
      m.needs_manual_review ? 1 : 0
    );
    createdIds.push(id);
  });

  db.prepare(`UPDATE prescriptions SET status = 'confirmed' WHERE id = ?`).run(prescriptionId);

  res.json({ medicine_ids: createdIds });
});

/** List all active medicines for a patient - used by the dashboard and "manage prescriptions" screen. */
router.get('/patient/:patientId/medicines', (req, res) => {
  const medicines = db
    .prepare('SELECT * FROM medicines WHERE patient_id = ? AND is_active = 1 ORDER BY created_at DESC')
    .all(req.params.patientId);
  res.json(medicines.map((m) => ({ ...m, schedule_times: JSON.parse(m.schedule_times || '[]') })));
});

/**
 * Edit an existing medicine, or add a brand new one directly (without
 * re-scanning a photo) - covers "add a new tablet name" and "update prescription".
 */
router.put('/medicines/:id', (req, res) => {
  const { drug_name, dosage, schedule_times, meal_relation, duration_days, is_active } = req.body;
  const existing = db.prepare('SELECT * FROM medicines WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Medicine not found' });

  db.prepare(
    `UPDATE medicines SET
      drug_name = COALESCE(?, drug_name),
      dosage = COALESCE(?, dosage),
      schedule_times = COALESCE(?, schedule_times),
      meal_relation = COALESCE(?, meal_relation),
      duration_days = COALESCE(?, duration_days),
      is_active = COALESCE(?, is_active),
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(
    drug_name ?? null,
    dosage ?? null,
    schedule_times ? JSON.stringify(schedule_times) : null,
    meal_relation ?? null,
    duration_days ?? null,
    typeof is_active === 'boolean' ? (is_active ? 1 : 0) : null,
    req.params.id
  );

  res.json({ ok: true });
});

/** Add a brand new medicine directly, e.g. a fresh tablet the patient was told about verbally. */
router.post('/patient/:patientId/medicines', (req, res) => {
  const { drug_name, dosage, schedule_times, meal_relation, duration_days } = req.body;
  if (!drug_name) return res.status(400).json({ error: 'drug_name is required' });

  const id = uuidv4();
  db.prepare(
    `INSERT INTO medicines (id, prescription_id, patient_id, drug_name, dosage, meal_relation, schedule_times, duration_days, needs_manual_review)
     VALUES (?, 'manual-entry', ?, ?, ?, ?, ?, ?, 0)`
  ).run(id, req.params.patientId, drug_name, dosage || null, meal_relation || 'none', JSON.stringify(schedule_times || []), duration_days ?? null);

  res.status(201).json({ id });
});

router.delete('/medicines/:id', (req, res) => {
  db.prepare(`UPDATE medicines SET is_active = 0 WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
