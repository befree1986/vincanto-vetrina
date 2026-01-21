import React, { useState, useEffect } from 'react';
import EmailTemplateEditor from './EmailTemplateEditor';

// API reali per caricare/salvare il template email
async function fetchEmailTemplate() {
  const res = await fetch('/api/email-template');
  if (!res.ok) throw new Error('Errore caricamento template');
  const data = await res.json();
  return data.html || '';
}
async function saveEmailTemplate(html: string) {
  const res = await fetch('/api/email-template', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html })
  });
  if (!res.ok) throw new Error('Errore salvataggio template');
}



const DEFAULT_TEMPLATES = [
  { label: 'Predefinito Vincanto', value: 'booking_confirmation' },
  { label: 'Conferma Finale (pagamento)', value: 'booking_final_confirmation' },
  { label: 'Personalizzato (visual editor)', value: 'custom' }
];

async function fetchSelectedTemplate() {
  const res = await fetch('/api/email-template?selected=1');
  if (!res.ok) return 'custom';
  const data = await res.json();
  return data.selected || 'custom';
}
async function saveSelectedTemplate(selected: string) {
  await fetch('/api/email-template', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selected })
  });
}

async function fetchDefaultTemplate(name: string) {
  const res = await fetch(`/api/email-template?default=${name}`);
  if (!res.ok) throw new Error('Errore caricamento template');
  const data = await res.json();
  return data.html || '';
}

const EmailTemplateSection: React.FC = () => {
  const [templateHtml, setTemplateHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState('custom');

  useEffect(() => {
    fetchSelectedTemplate().then(sel => {
      setSelected(sel);
      setLoading(true);
      if (sel === 'custom') {
        fetchEmailTemplate().then(html => {
          setTemplateHtml(html);
          setLoading(false);
        });
      } else {
        fetchDefaultTemplate(sel).then(html => {
          setTemplateHtml(html);
          setLoading(false);
        });
      }
    });
  }, []);

  const handleSelect = async (val: string) => {
    setLoading(true);
    setSelected(val);
    await saveSelectedTemplate(val);
    if (val === 'custom') {
      fetchEmailTemplate().then(html => {
        setTemplateHtml(html);
        setLoading(false);
      });
    } else {
      fetchDefaultTemplate(val).then(html => {
        setTemplateHtml(html);
        setLoading(false);
      });
    }
  };

  const handleSave = async (html: string) => {
    if (selected === 'custom') {
      await saveEmailTemplate(html);
      setTemplateHtml(html);
      alert('Template email salvato!');
    } else {
      alert('Puoi salvare solo il template personalizzato!');
    }
  };

  if (loading) return <div>Caricamento template email...</div>;

  return (
    <div style={{marginTop:32}}>
      <h2>Personalizza Template Email Prenotazione</h2>
      <div style={{marginBottom:16}}>
        <label>Scegli template attivo:&nbsp;
          <select value={selected} onChange={e => handleSelect(e.target.value)}>
            {DEFAULT_TEMPLATES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>
      <EmailTemplateEditor initialHtml={templateHtml} onSave={handleSave} />
    </div>
  );
};

export default EmailTemplateSection;
