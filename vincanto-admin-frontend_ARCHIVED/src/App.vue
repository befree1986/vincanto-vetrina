<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

// Definiamo un tipo per la singola prenotazione
interface Booking {
  _id: string;
  guest_name: string;
  guest_surname: string;
  check_in_date: string;
  check_out_date: string;
  booking_status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  total_amount: number;
  createdAt: string;
}

// Stati reattivi per gestire i dati, il caricamento e gli errori
const bookings = ref<Booking[]>([]);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);

// onMounted viene eseguito una sola volta quando il componente viene montato
onMounted(async () => {
  try {
    // Recuperiamo le variabili d'ambiente (Vite le espone così)
    const apiKey = import.meta.env.VITE_API_KEY;
    const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/admin/bookings`;

    if (!apiKey) {
      throw new Error("Chiave API non trovata. Assicurati di aver creato il file .env.local");
    }

    // Eseguiamo la chiamata API con axios, passando la chiave negli headers
    const response = await axios.get(apiUrl, {
      headers: {
        'x-api-key': apiKey,
      },
    });

    // Aggiorniamo lo stato con i dati ricevuti
    bookings.value = response.data.data;
  } catch (err: any) {
    // Se c'è un errore, lo salviamo nello stato
    error.value = err.response?.data?.message || err.message;
  } finally {
    // In ogni caso, smettiamo di caricare
    loading.value = false;
  }
});
</script>

<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold text-gray-800">Pannello Admin - Vincanto</h1>
    <h2 class="text-xl text-gray-600 mt-2 mb-6">Elenco Prenotazioni</h2>

    <div v-if="loading" class="text-center p-8">
      <p>Caricamento prenotazioni...</p>
    </div>

    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong class="font-bold">Errore:</strong>
      <span class="block sm:inline">{{ error }}</span>
    </div>

    <div v-else class="overflow-x-auto shadow-md rounded-lg">
      <table class="w-full text-sm text-left text-gray-500">
        <thead class="text-xs text-gray-700 uppercase bg-gray-200">
          <tr>
            <th scope="col" class="px-6 py-3">Cliente</th>
            <th scope="col" class="px-6 py-3">Check-in</th>
            <th scope="col" class="px-6 py-3">Check-out</th>
            <th scope="col" class="px-6 py-3">Stato</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="booking in bookings" :key="booking._id" class="bg-white border-b hover:bg-gray-50">
            <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
              {{ booking.guest_name }} {{ booking.guest_surname }}
            </td>
            <td class="px-6 py-4">
              {{ new Date(booking.check_in_date).toLocaleDateString('it-IT') }}
            </td>
            <td class="px-6 py-4">
              {{ new Date(booking.check_out_date).toLocaleDateString('it-IT') }}
            </td>
            <td class="px-6 py-4">
              <span 
                :class="{
                  'bg-yellow-200 text-yellow-800': booking.booking_status === 'PENDING',
                  'bg-green-200 text-green-800': booking.booking_status === 'CONFIRMED',
                  'bg-red-200 text-red-800': booking.booking_status === 'CANCELLED'
                }"
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
              >
                {{ booking.booking_status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style>
/* Puoi lasciare questo blocco vuoto se usi solo Tailwind, 
   o aggiungere stili globali specifici qui.
   Il file src/index.css si occuperà di importare Tailwind. */
</style>
