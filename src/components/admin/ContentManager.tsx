/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './ContentManager.css';

interface ContentItem {
  key: string;
  value: string;
  section: string;
}

interface ContentManagerProps {
  onSave?: (items: ContentItem[]) => Promise<void>;
}

const ContentManager: React.FC<ContentManagerProps> = ({ onSave }) => {
  const { t, i18n } = useTranslation();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [filteredContents, setFilteredContents] = useState<ContentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [sections, setSections] = useState<string[]>([]);

  useEffect(() => {
    // Carica i dati dai namespace i18n disponibili
    loadContentData();
  }, []);

  useEffect(() => {
    // Filtra i contenuti in base a ricerca e sezione
    let filtered = contents;

    if (selectedSection !== 'all') {
      filtered = filtered.filter((c) => c.section === selectedSection);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.value.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredContents(filtered);
  }, [searchTerm, selectedSection, contents]);

  const loadContentData = () => {
    // Estrai i dati comuni dalle risorse i18n
    // Per ora, creiamo una lista di base dai key noti del sito
    const commonKeys = [
      { key: 'home.title', section: 'home' },
      { key: 'home.subtitle', section: 'home' },
      { key: 'about.title', section: 'about' },
      { key: 'about.description', section: 'about' },
      { key: 'booking.title', section: 'booking' },
      { key: 'booking.description', section: 'booking' },
      { key: 'contact.title', section: 'contact' },
      { key: 'contact.email', section: 'contact' },
      { key: 'propriety.title', section: 'property' },
      { key: 'propriety.description', section: 'property' },
    ];

    const contentItems: ContentItem[] = commonKeys.map((item) => ({
      key: item.key,
      value: t(item.key) || '',
      section: item.section,
    }));

    setContents(contentItems);

    // Estrai le sezioni uniche
    const uniqueSections = Array.from(new Set(contentItems.map((c) => c.section)));
    setSections(uniqueSections);
  };

  const handleContentChange = (key: string, newValue: string) => {
    setContents((prev) =>
      prev.map((c) => (c.key === key ? { ...c, value: newValue } : c))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(contents);
      }
      setMessage({ type: 'success', text: '✅ Contenuti salvati con successo!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Errore salvataggio contenuti:', error);
      setMessage({ type: 'error', text: '❌ Errore durante il salvataggio' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="content-manager-container">
      {message && (
        <div className={`content-manager-message content-manager-message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="content-manager-header">
        <h3>Gestione Contenuti Sito</h3>
        <button
          className="admin-btn-primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? '⏳ Salvataggio...' : '💾 Salva Modifiche'}
        </button>
      </div>

      <div className="content-manager-controls">
        <div className="content-search">
          <input
            type="text"
            aria-label="Cerca contenuto"
            placeholder="🔍 Cerca contenuto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-input"
          />
        </div>

        <div className="content-filters">
          <select
            value={selectedSection}
            aria-label="Filtra per sezione"
            onChange={(e) => setSelectedSection(e.target.value)}
            className="admin-input"
          >
            <option value="all">📂 Tutte le Sezioni</option>
            {sections.map((section) => (
              <option key={section} value={section}>
                📄 {section}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="content-items-grid">
        {filteredContents.length > 0 ? (
          filteredContents.map((item) => (
            <div
              key={item.key}
              className="content-item-card"
              onMouseEnter={() => setEditingKey(item.key)}
              onMouseLeave={() => setEditingKey(null)}
            >
              <div className="content-item-header">
                <span className="content-item-key">{item.key}</span>
                <span className="content-item-section">{item.section}</span>
              </div>

              <textarea
                value={item.value}
                onChange={(e) => handleContentChange(item.key, e.target.value)}
                className="content-item-textarea"
                placeholder="Inserisci il contenuto..."
                rows={item.value.length > 100 ? 4 : 2}
              />

              {editingKey === item.key && (
                <div className="content-item-hint">
                  <p>💡 Modifica il testo direttamente. Le modifiche saranno salvate cliccando il pulsante in alto.</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="content-no-results">
            <p>📭 Nessun contenuto trovato</p>
          </div>
        )}
      </div>

      <div className="content-manager-footer">
        <p className="content-info-text">
          📊 Totale: {contents.length} | 📝 Visibili: {filteredContents.length}
        </p>
      </div>
    </div>
  );
};

export default ContentManager;
