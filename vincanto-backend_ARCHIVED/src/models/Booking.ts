import { Schema, model, Types, InferSchemaType, HydratedDocument } from 'mongoose';

// Definizione dello schema di prenotazione
const bookingSchema = new Schema({
  guest_name: { type: String, required: true },
  guest_surname: { type: String, required: true },
  guest_email: { type: String, required: true },
  guest_phone: { type: String, required: true },
  check_in_date: { type: Date, required: true },
  check_out_date: { type: Date, required: true },
  num_adults: { type: Number, required: true },
  num_children: { type: Number, required: true, default: 0 },
  children_ages: { type: [Number], default: [] },
  parking_option: { type: String, enum: ['none', 'street', 'private'], default: 'none' },
  base_price: { type: Number, required: true },
  parking_cost: { type: Number, default: 0 },
  cleaning_fee: { type: Number, required: true },
  tourist_tax: { type: Number, required: true },
  total_amount: { type: Number, required: true },
  deposit_amount: { type: Number, required: true },
  payment_amount: { type: Number, required: true },
  payment_method: { type: String, required: true },
  booking_status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
    default: 'PENDING',
  },
  payment_choice: {
    type: String,
    enum: ['acconto', 'totale'],
    required: true,
  },
}, {
  timestamps: true,
});

// Tipo plain inferito dallo schema
export type BookingType = InferSchemaType<typeof bookingSchema> & { _id: Types.ObjectId };

// Tipo documento Mongoose con metodi
export type BookingDocument = HydratedDocument<BookingType>;

// Modello Mongoose
export const Booking = model<BookingType>('Booking', bookingSchema);