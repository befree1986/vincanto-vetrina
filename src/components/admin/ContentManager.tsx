import React, { useState, useEffect, useMemo } from 'react';
import './ContentManager.css';
import AdminApiService from '../../services/adminApiService';
import translationIT from '../../locales/it/translation_it.json';
import translationEN from '../../locales/en/translation_en.json';
import translationDE from '../../locales/de/translation_de.json';
import translationFR from '../../locales/fr/translation_fr.json';

type Language = 'it' | 'en' | 'de' | 'fr';
type LanguageRecord = Record<Language, string>;

interface ContentItem {
  key: string;
  value: LanguageRecord;
  section: string;
}

interface ContentManagerProps {
  onSave?: (items: ContentItem[]) => void | Promise<void>;
  adminApiService?: AdminApiService;
}

interface SystemSetting {
  key: string;
  value: string;
}

const SUPPORTED_LANGUAGES: Language[] = ['it', 'en', 'de', 'fr'];

const ContentManager: React.FC<ContentManagerProps> = ({ onSave, adminApiService }) => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [filteredContents, setFilteredContents] = useState<ContentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize internal API service if not provided
  const apiService = adminApiService || new AdminApiService();

  const localTranslations = {
    it: translationIT,
    en: translationEN,
    de: translationDE,
    fr: translationFR,
  };

  const flattenTranslations = (source: object, prefix = ''): Record<string, string> => {
    if (!source || typeof source !== 'object') return {};

    return Object.entries(source).reduce((acc, [key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(acc, flattenTranslations(value, fullKey));
      } else {
        acc[fullKey] = String(value ?? '');
      }
      return acc;
    }, {} as Record<string, string>);
  };

  const getSectionFromKey = (key: string) => {
    const firstSegment = key.split('.')[0] || 'general';
    const sectionAliases: Record<string, string> = {
      hero: 'home',
      availability: 'home',
      section: 'property',
      propriety: 'property',
      seo: 'seo',
      footer: 'footer',
      navbar: 'navigation',
      booking: 'booking',
      contact: 'contact',
      about: 'about',
      home: 'home',
    };

    return sectionAliases[firstSegment] || firstSegment;
  };

  useEffect(() => {
    const loadContentData = async () => {
      try {
        const dbSettings = await apiService.getSystemSettings();
        const flattenedByLang = Object.fromEntries(
          SUPPORTED_LANGUAGES.map((lang) => [
            lang,
            flattenTranslations(localTranslations[lang]),
          ])
        ) as Record<Language, Record<string, string>>;

        const allKeys = Array.from(
          new Set(Object.values(flattenedByLang).flatMap(Object.keys))
        ).filter(key =>
          // Escludi solo le chiavi del calendario che non sono testi visibili
          !key.startsWith('calendar.weekdays') && !key.startsWith('calendar.tooltip')
        ).sort((a, b) => a.localeCompare(b));

        const contentItems: ContentItem[] = allKeys.map((key) => {
          const dbSetting = dbSettings.find((s: SystemSetting) => s.key === key);

          const valueFromLocal: LanguageRecord = {
            it: flattenedByLang.it[key] || '',
            en: flattenedByLang.en[key] || '',
            de: flattenedByLang.de[key] || '',
            fr: flattenedByLang.fr[key] || '',
          };

          let valueFromDb: Partial<LanguageRecord> = {};
          if (dbSetting) {
            try {
              const parsed = JSON.parse(dbSetting.value);
              if (typeof parsed === 'object' && parsed !== null) {
                valueFromDb = parsed;
              }
            } catch (e) {
              // Value is not a JSON object, assume it's for the default language 'it'
            }
          }

          return { key, section: getSectionFromKey(key), value: { ...valueFromLocal, ...valueFromDb } };
        });

        setContents(contentItems);
      } catch (error) {
        console.error('Errore caricamento testi dal DB:', error);
        setMessage({ type: 'error', text: '❌ Errore nel caricamento dei contenuti.' });
      }
    };

    loadContentData();
  }, [apiService]);

  useEffect(() => {
    let filtered = contents;
    if (selectedSection !== 'all') {
      filtered = filtered.filter((c) => c.section === selectedSection);
    }
    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
          JSON.stringify(c.value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredContents(filtered);
  }, [searchTerm, selectedSection, contents]);

  const sections = useMemo(() =>
    Array.from(new Set(contents.map((c) => c.section))).sort()
    , [contents]);

  const handleContentChange = (key: string, lang: Language, newValue: string) => {
    setContents((prev) =>
      prev.map((c) => (c.key === key ? { ...c, value: { ...c.value, [lang]: newValue } } : c))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatePromises = contents.map(item => apiService.updateSystemSetting(item.key, item.value));
      await Promise.all(updatePromises);

      await onSave?.(contents);

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

  const handleAutoTranslateItem = async (item: ContentItem) => {
    if (!item.value.it) {
      setMessage({ type: 'error', text: 'Inserisci il testo in italiano prima di tradurre.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setIsTranslating(true);
    try {
      const targetLangs = SUPPORTED_LANGUAGES.filter(l => l !== 'it');
      const translations = await apiService.autoTranslate(item.value.it, targetLangs);

      setContents(prev => prev.map(c => {
        if (c.key === item.key) {
          return {
            ...c,
            value: {
              ...c.value,
              en: translations.en || c.value.en,
              de: translations.de || c.value.de,
              fr: translations.fr || c.value.fr
            }
          };
        }
        return c;
      }));

      setMessage({ type: 'success', text: `✅ Traduzione di ${item.key} completata!` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Errore traduzione:", error);
      setMessage({ type: 'error', text: '❌ Errore durante la traduzione' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsTranslating(false);
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
        <h3>Gestione Contenuti Sito (Testi)</h3>
        <div className="content-manager-actions">
          <button className="admin-btn-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? '⏳ Salvataggio...' : '💾 Salva Modifiche'}
          </button>
        </div>
      </div>

      <div className="content-manager-controls">
        <div className="content-search">
          <input
            type="text"
            placeholder="🔍 Cerca contenuto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-input"
          />
        </div>
        <div className="content-filters">
          <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="admin-input">
            <option value="all">📂 Tutte le Sezioni</option>
            {sections.map((section) => (
              <option key={section} value={section}>📄 {section}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="content-items-grid" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {filteredContents.length > 0 ? (
          sections
            .filter(section => selectedSection === 'all' || section === selectedSection)
            .map(section => {
              const sectionItems = filteredContents.filter(item => item.section === section);
              if (sectionItems.length === 0) return null;

              return (
                <div key={section} className="content-section-group" style={{ width: '100%' }}>
                  <h4 style={{ borderBottom: '2px solid #ccc', paddingBottom: '10px', marginBottom: '20px', textTransform: 'capitalize', fontSize: '1.2rem', color: '#333' }}>
                    📄 Sezione: {section}
                  </h4>
                  <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))' }}>
                    {sectionItems.map((item) => (
                      <div key={item.key} className="content-item-card" style={{ display: 'block', padding: '15px', border: '1px solid #eaeaea', borderRadius: '8px', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <div className="content-item-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                          <div>
                            <span className="content-item-key" style={{ fontWeight: 'bold', color: '#1a1a1a' }}>{item.key}</span>
                          </div>
                          <button
                            className="admin-btn-secondary admin-btn-small"
                            onClick={() => handleAutoTranslateItem(item)}
                            disabled={isTranslating}
                            style={{ padding: '5px 10px', fontSize: '0.85rem' }}
                          >
                            {isTranslating ? '⏳ ...' : '🌍 Traduci'}
                          </button>
                        </div>

                        <div className="content-translations" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {SUPPORTED_LANGUAGES.map((lang) => (
                            <div key={lang} style={{ display: 'flex', alignItems: 'flex-start' }}>
                              <span style={{ width: '35px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.85rem', color: '#666', marginTop: '8px' }}>{lang}:</span>
                              <textarea
                                value={item.value[lang] || ''}
                                onChange={(e) => handleContentChange(item.key, lang as Language, e.target.value)}
                                className="content-item-textarea"
                                placeholder={`Inserisci testo in ${lang}...`}
                                rows={item.value[lang] && item.value[lang].length > 80 ? 3 : 1}
                                style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical', minHeight: '38px', fontSize: '0.9rem' }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
        ) : (
          <div className="content-no-results">
            <p>📭 Nessun contenuto trovato</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentManager;
