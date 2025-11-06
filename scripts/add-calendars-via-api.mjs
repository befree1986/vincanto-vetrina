#!/usr/bin/env node

// Script per aggiungere i calendari via API admin
import fetch from 'node-fetch';

const API_BASE = 'https://vincanto-backup.vercel.app/api';

const calendarsToAdd = [
    {
        name: 'Google Calendar Vincanto',
        platform: 'google',
        ical_url: 'https://calendar.google.com/calendar/ical/vincanto%40gmail.com/private-41b16147340fc6b7d00d9ff0faf71c74/basic.ics',
        status: 'active'
    },
    {
        name: 'Booking.com Principale', 
        platform: 'booking.com',
        ical_url: 'https://ical.booking.com/v1/export?t=d6fd211b-ce0a-463c-85e0-e97979cf2366',
        status: 'active'
    },
    {
        name: 'Holidu Calendar',
        platform: 'holidu', 
        ical_url: 'https://api.host.holidu.com/pmc/rest/apartments/657119/calendar/656b82d8-c858-408c-bb02-114aaa66e38c/export.ics?s=MTMwNTM%3D&u=NjU3MTE5&h=ZjgyYjI0Yjc4OGI1MzNlOWQ3YjY4ZjU5NzM5MDA5ZWM%3D',
        status: 'active'
    }
];

async function addCalendarsViaAPI() {
    console.log('🚀 Aggiungendo calendari via API admin...\n');
    
    for (const calendar of calendarsToAdd) {
        try {
            console.log(`📅 Aggiungendo: ${calendar.name}`);
            
            // Test connessione iCal
            console.log('🔄 Testing iCal URL...');
            const testResponse = await fetch(calendar.ical_url, {
                timeout: 10000,
                headers: { 'User-Agent': 'Vincanto/1.0' }
            });
            
            if (!testResponse.ok) {
                console.log(`❌ iCal non raggiungibile: ${testResponse.status}`);
                continue;
            }
            
            console.log(`✅ iCal OK (${testResponse.status})`);
            
            // Usa API admin per aggiungere
            const addResponse = await fetch(`${API_BASE}/admin?action=add-calendar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: calendar.name,
                    platform: calendar.platform,
                    ical_url: calendar.ical_url,
                    status: calendar.status
                })
            });
            
            if (addResponse.ok) {
                const result = await addResponse.json();
                console.log(`✅ Calendario aggiunto: ${calendar.name}`);
                console.log(`   ID: ${result.calendar?.id || 'N/A'}`);
            } else {
                console.log(`❌ Errore aggiunta: ${addResponse.status}`);
                const errorText = await addResponse.text();
                console.log(`   Dettaglio: ${errorText.substring(0, 200)}...`);
            }
            
        } catch (error) {
            console.log(`❌ Errore: ${error.message}`);
        }
        
        console.log(''); // Linea vuota
    }
    
    // Verifica finale
    console.log('📊 Verifica calendari aggiunti...');
    try {
        const listResponse = await fetch(`${API_BASE}/calendar-sync`);
        if (listResponse.ok) {
            const data = await listResponse.json();
            console.log(`✅ Totale calendari: ${data.calendars?.length || 0}`);
            
            if (data.calendars) {
                data.calendars.forEach((cal, i) => {
                    console.log(`${i + 1}. ${cal.name} (${cal.platform}) - ${cal.status}`);
                });
            }
        }
    } catch (error) {
        console.log(`❌ Errore verifica: ${error.message}`);
    }
    
    console.log('\n🎉 Setup completato!');
    console.log('💡 Ora controlla il pannello admin per vedere i calendari.');
}

addCalendarsViaAPI().catch(console.error);