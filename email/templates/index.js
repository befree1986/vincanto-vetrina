import { bookingConfirmationTemplate } from './bookingConfirmation.js';
import { bookingFinalConfirmationTemplate } from './bookingFinalConfirmation.js';

const templates = {
  booking_confirmation: bookingConfirmationTemplate,
  booking_final_confirmation: bookingFinalConfirmationTemplate
};

export function renderEmailTemplate(name, data) {
  const fn = templates[name];
  if (!fn) throw new Error(`Email template not found: ${name}`);
  return fn(data);
}
