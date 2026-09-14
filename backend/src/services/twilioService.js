const twilio = require('twilio');
require('dotenv').config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;
const SMS_FROM = process.env.TWILIO_SMS_FROM;

/** Sends a WhatsApp message via the Twilio Sandbox. Number must be E.164, e.g. +919876543210 */
async function sendWhatsApp(toNumber, body) {
  return client.messages.create({
    from: WHATSAPP_FROM,
    to: `whatsapp:${toNumber}`,
    body,
  });
}

/** Sends a plain SMS - used as the always-available fallback channel per the spec. */
async function sendSMS(toNumber, body) {
  return client.messages.create({
    from: SMS_FROM,
    to: toNumber,
    body,
  });
}

/**
 * Sends on every channel the patient/guardian has available (WhatsApp + SMS),
 * matching the "all time SMS message available" requirement. Failures on one
 * channel don't block the other - a guardian alert must get through.
 */
async function sendOnAllChannels(toNumber, body) {
  const results = await Promise.allSettled([sendWhatsApp(toNumber, body), sendSMS(toNumber, body)]);
  return results;
}

module.exports = { sendWhatsApp, sendSMS, sendOnAllChannels };
