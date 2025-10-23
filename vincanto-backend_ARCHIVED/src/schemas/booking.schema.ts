import { z } from 'zod';

export const createBookingRequestSchema = z.object({
  body: z.object({
    formData: z.object({
      name: z.string({ required_error: "Il nome è obbligatorio" }).min(1, "Il nome non può essere vuoto"),
      surname: z.string({ required_error: "Il cognome è obbligatorio" }).min(1, "Il cognome non può essere vuoto"),
      email: z.string({ required_error: "L'email è obbligatoria" }).email("Formato email non valido"),
      phone: z.string({ required_error: "Il telefono è obbligatorio" }).min(5, "Numero di telefono non valido"),
      guests: z.coerce.number({ invalid_type_error: "Il numero di ospiti deve essere un numero" }).min(1, "Deve esserci almeno un ospite"),
      children: z.coerce.number({ invalid_type_error: "Il numero di bambini deve essere un numero" }).min(0),
      childrenAges: z.array(z.coerce.number()).optional(),
      checkin: z.string().datetime({ message: "Data di check-in non valida" }),
      checkout: z.string().datetime({ message: "Data di check-out non valida" }),
      parkingOption: z.enum(['none', 'private', 'public']),
    }).refine(data => {
        // Se ci sono bambini, l'array delle età deve essere presente e della lunghezza corretta
        if (data.children > 0) {
            return data.childrenAges && data.childrenAges.length === data.children;
        }
        return true;
    }, {
        message: "Il numero di età dei bambini non corrisponde al numero di bambini",
        path: ["childrenAges"], // Percorso dell'errore
    }),
    paymentAmount: z.enum(['acconto', 'totale']),
    paymentMethod: z.enum(['bonifico', 'paypal']),
    costs: z.object({
      numberOfNights: z.number(),
      subtotalNightlyRate: z.number(),
      cleaningFee: z.number(),
      parkingCost: z.number(),
      parkingOption: z.string(),
      touristTaxEligibleGuests: z.number(),
      touristTax: z.number(),
      grandTotalWithTax: z.number(),
      depositAmount: z.number(),
      totalPayingGuests: z.number(),
    }),
  }),
});

export type CreateBookingRequestInput = z.infer<typeof createBookingRequestSchema>['body'];