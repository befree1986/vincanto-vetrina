import { bookingConfirmationTemplate } from './bookingConfirmation.js';

const templates = {
  booking_confirmation: bookingConfirmationTemplate
};

export function renderEmailTemplate(name, data) {
  const fn = templates[name];
  if (!fn) throw new Error(`Email template not found: ${name}`);
  return fn(data);
}
