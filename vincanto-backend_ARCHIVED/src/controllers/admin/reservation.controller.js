const pool = require("../../config/db.js");

const getAllReservations = async (req, res) => {
  try {
    const queryText = 'SELECT * FROM bookings ORDER BY check_in_date DESC';
    const { rows } = await pool.query(queryText);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Errore nel recuperare le prenotazioni:", error);
    res
      .status(500)
      .json({ message: "Errore del server durante il recupero delle prenotazioni." });
  }
};

const getReservationById = async (req, res) => {
  const { id } = req.params;
  try {
    const reservationId = parseInt(id, 10);
    if (isNaN(reservationId)) {
      return res.status(400).json({ message: "ID della prenotazione non valido." });
    }
    const queryText = 'SELECT * FROM bookings WHERE id = $1';
    const { rows } = await pool.query(queryText, [reservationId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Prenotazione non trovata." });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(`Errore nel recuperare la prenotazione ${id}:`, error);
    res.status(500).json({ message: "Errore del server." });
  }
};

/**
 * Controllore per aggiornare lo stato di una prenotazione
 * @route   PUT /api/admin/reservations/:id/status
 */
const updateReservationStatus = async (req, res) => {
  const { id } = req.params;
  const { booking_status } = req.body; // Prendiamo il nuovo stato dal corpo della richiesta

  // Validazione di base
  if (!booking_status) {
    return res.status(400).json({ message: "Lo stato della prenotazione (booking_status) è obbligatorio." });
  }

  try {
    const queryText = `
      UPDATE bookings
      SET booking_status = $1
      WHERE id = $2
      RETURNING *;
    `;
    const { rows } = await pool.query(queryText, [booking_status, id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Prenotazione non trovata con l'ID specificato." });
    }

    res.status(200).json(rows[0]); // Restituisce la prenotazione aggiornata
  } catch (error) {
    console.error(`Errore durante l'aggiornamento della prenotazione ${id}:`, error);
    res.status(500).json({ message: "Errore del server durante l'aggiornamento." });
  }
};

/**
 * Controllore per cancellare una prenotazione
 * @route   DELETE /api/admin/reservations/:id
 */
const deleteReservation = async (req, res) => {
  const { id } = req.params;

  try {
    const queryText = 'DELETE FROM bookings WHERE id = $1 RETURNING id';
    const { rowCount } = await pool.query(queryText, [id]);

    if (rowCount === 0) {
      return res.status(404).json({ message: "Prenotazione non trovata, impossibile cancellare." });
    }

    // Invia una risposta di successo senza contenuto
    res.status(204).send();
  } catch (error) {
    console.error(`Errore durante la cancellazione della prenotazione ${id}:`, error);
    res.status(500).json({ message: "Errore del server durante la cancellazione." });
  }
};

module.exports = {
  getAllReservations,
  getReservationById,
  updateReservationStatus,
  deleteReservation, // Esportiamo la nuova funzione
};