const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Standard medical shorthand is fixed and well documented - we NEVER let the
// LLM invent what "TID" or "BD" means. This lookup table is the source of
// truth; Gemini's job is only to read what shorthand is written on the page.
const SHORTHAND_MAP = {
  OD: { timesPerDay: 1, label: 'Once a day' },
  BD: { timesPerDay: 2, label: 'Twice a day' },
  BID: { timesPerDay: 2, label: 'Twice a day' },
  TID: { timesPerDay: 3, label: 'Three times a day' },
  TDS: { timesPerDay: 3, label: 'Three times a day' },
  QID: { timesPerDay: 4, label: 'Four times a day' },
  QDS: { timesPerDay: 4, label: 'Four times a day' },
  HS: { timesPerDay: 1, label: 'At bedtime' },
  SOS: { timesPerDay: 0, label: 'As needed' },
  STAT: { timesPerDay: 0, label: 'Immediately, once' },
};

const MEAL_RELATION_MAP = {
  AC: 'before_food',
  PC: 'after_food',
  'C': 'with_food',
};

const EXTRACTION_PROMPT = `You are a prescription reading assistant. You will be shown a photo of a
handwritten or printed medical prescription. Extract ONLY what is written - never guess a drug name,
dosage, or frequency that is not clearly legible.

Return ONLY valid JSON (no markdown fences, no prose) matching exactly this shape:

{
  "medicines": [
    {
      "drug_name": "string as written",
      "dosage": "string as written, e.g. '1 tablet' or '5ml'",
      "frequency_code": "the shorthand exactly as written, e.g. 'TID', 'BD', 'OD'",
      "meal_relation_code": "AC | PC | C | null",
      "duration_days": number or null,
      "confidence": "high | medium | low",
      "notes": "anything ambiguous or hard to read, or null"
    }
  ],
  "overall_confidence": "high | medium | low",
  "illegible_sections": "description of any part of the image that could not be read, or null"
}

If handwriting is unclear for any field, set confidence to "low" for that medicine rather than guessing.`;

/**
 * Sends a prescription photo to Gemini and returns a normalized, validated
 * extraction. Frequency codes are cross-checked against SHORTHAND_MAP rather
 * than trusting the model's own interpretation of what the shorthand means.
 */
async function extractPrescription(imageBase64, mimeType = 'image/jpeg') {
  const result = await model.generateContent([
    { text: EXTRACTION_PROMPT },
    { inlineData: { data: imageBase64, mimeType } },
  ]);

  const rawText = result.response.text().trim();
  const cleaned = rawText.replace(/^```json\s*|```$/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    // If Gemini didn't return clean JSON, fail safe rather than fabricate a schedule
    return {
      medicines: [],
      overall_confidence: 'low',
      illegible_sections: 'Could not parse AI response - please retake the photo or enter manually.',
      parse_error: true,
    };
  }

  parsed.medicines = (parsed.medicines || []).map((med) => normalizeMedicine(med));
  return parsed;
}

function normalizeMedicine(med) {
  const codeKey = (med.frequency_code || '').toUpperCase().trim();
  const shorthand = SHORTHAND_MAP[codeKey];
  const mealKey = (med.meal_relation_code || '').toUpperCase().trim();

  const needsManualReview =
    !shorthand ||
    !med.drug_name ||
    med.confidence === 'low' ||
    med.confidence === 'medium';

  return {
    ...med,
    times_per_day: shorthand ? shorthand.timesPerDay : null,
    frequency_label: shorthand ? shorthand.label : 'Unrecognized shorthand - please confirm manually',
    meal_relation: MEAL_RELATION_MAP[mealKey] || 'none',
    needs_manual_review: needsManualReview,
  };
}

module.exports = { extractPrescription, SHORTHAND_MAP };
