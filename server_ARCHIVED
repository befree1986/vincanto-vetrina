// Minimal Express backend per ricevere prenotazioni e upload file
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Abilita CORS per sviluppo locale
app.use(cors());

// Multer per upload file (salva in ./uploads)
const upload = multer({
  dest: path.join(__dirname, 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 }, // max 10MB
});

// Endpoint ricezione prenotazione
app.post('/api/booking', upload.single('receipt'), (req, res) => {
  // Dati form
  const data = req.body;
  // File uploadato (se presente)
  const file = req.file;

  // Salva dati su file locale (per test)
  const booking = {
    ...data,
    receiptFile: file ? file.filename : null,
    originalFileName: file ? file.originalname : null,
    uploadedAt: new Date().toISOString(),
  };
  const bookingsPath = path.join(__dirname, 'bookings.json');
  let bookings = [];
  if (fs.existsSync(bookingsPath)) {
    bookings = JSON.parse(fs.readFileSync(bookingsPath));
  }
  bookings.push(booking);
  fs.writeFileSync(bookingsPath, JSON.stringify(bookings, null, 2));

  res.json({ success: true, message: 'Prenotazione ricevuta!', booking });
});

// Serve file uploadati (solo per test)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(PORT, () => {
  console.log(`Backend booking listening on http://localhost:${PORT}`);
});
