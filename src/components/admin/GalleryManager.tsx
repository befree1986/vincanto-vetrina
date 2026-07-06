/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { galleryData, GallerySection, GalleryImage } from '../../data/galleryData';
import { useTranslation } from 'react-i18next';
import './GalleryManager.css';
import AdminApiService from '../../services/adminApiService';

interface GalleryManagerProps {
  onSave?: (updatedData: GallerySection[]) => Promise<void>;
  adminApiService?: AdminApiService;
}

const GalleryManager: React.FC<GalleryManagerProps> = ({ onSave, adminApiService }) => {
  const { t } = useTranslation();
  const [sections, setSections] = useState<GallerySection[]>([]);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [editingImage, setEditingImage] = useState<{ sectionIdx: number; imgIdx: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const apiService = adminApiService || new AdminApiService();

  useEffect(() => {
    loadGalleryData();
  }, []);

  const loadGalleryData = async () => {
    try {
      const dbSettings = await apiService.getSystemSettings();
      const gallerySetting = dbSettings.find(s => s.key === 'gallery_data');
      if (gallerySetting && gallerySetting.value) {
        try {
          const parsed = JSON.parse(gallerySetting.value);
          setSections(parsed);
          return;
        } catch (e) {
          console.error("Errore parsing gallery_data dal db", e);
        }
      }
      setSections(galleryData); // Fallback to local data
    } catch (e) {
      console.error(e);
      setSections(galleryData);
    }
  };

  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Formato non valido'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1200;
          
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          resolve(canvas.toDataURL('image/webp', 0.8));
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleMainImageUpload = async (sectionIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file);
      const updated = [...sections];
      if (updated[sectionIdx].mainImage) {
        updated[sectionIdx].mainImage.src = dataUrl;
      }
      setSections(updated);
    } catch (error) {
      alert("Errore durante l'elaborazione dell'immagine");
    }
  };

  const handleImageUpload = async (sectionIdx: number, imgIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file);
      const updated = [...sections];
      updated[sectionIdx].images[imgIdx].src = dataUrl;
      setSections(updated);
    } catch (error) {
      alert("Errore durante l'elaborazione dell'immagine");
    }
  };

  const handleImageAltChange = (sectionIdx: number, imgIdx: number, newAlt: string) => {
    const updated = [...sections];
    updated[sectionIdx].images[imgIdx].altKey = newAlt;
    setSections(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiService.updateSystemSetting('gallery_data', sections);
      if (onSave) {
        await onSave(sections);
      }
      setMessage({ type: 'success', text: '✅ Immagini salvate con successo!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Errore salvataggio immagini:', error);
      setMessage({ type: 'error', text: '❌ Errore durante il salvataggio' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddImage = (sectionIdx: number) => {
    const updated = [...sections];
    updated[sectionIdx].images.push({
      src: '/placeholder.webp',
      altKey: 'Nuova Immagine',
    });
    setSections(updated);
  };

  const handleRemoveImage = (sectionIdx: number, imgIdx: number) => {
    const updated = [...sections];
    updated[sectionIdx].images.splice(imgIdx, 1);
    setSections(updated);
  };

  return (
    <div className="gallery-manager-container">
      {message && (
        <div className={`gallery-manager-message gallery-manager-message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="gallery-manager-header">
        <h3>Gestione Galleria Immagini</h3>
        <button
          className="admin-btn-primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? '⏳ Salvataggio...' : '💾 Salva Modifiche'}
        </button>
      </div>

      <div className="gallery-sections-grid">
        {sections.map((section, sectionIdx) => (
          <div
            key={sectionIdx}
            className="gallery-section-card"
          >
            <div className="gallery-section-header" onClick={() => setEditingSection(editingSection === sectionIdx ? null : sectionIdx)} style={{cursor: 'pointer'}}>
              <h4>Sezione: {t(section.titleKey)}</h4>
              <span className="gallery-image-count">
                📸 {section.images.length} immagini
              </span>
            </div>

            {editingSection === sectionIdx && (
              <div className="gallery-section-edit" style={{ padding: '15px' }}>
                {/* Immagine Principale */}
                {section.mainImage && (
                  <div className="gallery-image-edit" style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '20px' }}>
                    <h5>Immagine Principale</h5>
                    <img
                      src={section.mainImage.src}
                      alt="Main"
                      style={{ maxHeight: '150px', display: 'block', marginBottom: '10px' }}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleMainImageUpload(sectionIdx, e)}
                    />
                  </div>
                )}

                {/* Immagini della Sezione */}
                <div className="gallery-images-list">
                  <h5>Immagini della Sezione</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginTop: '10px' }}>
                  {section.images.map((img, imgIdx) => (
                    <div
                      key={imgIdx}
                      style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '8px' }}
                    >
                      <img
                        src={img.src}
                        alt={img.altKey}
                        style={{ width: '100%', height: '120px', objectFit: 'cover', marginBottom: '10px' }}
                      />
                      <div className="gallery-image-inputs" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(sectionIdx, imgIdx, e)}
                          style={{ fontSize: '0.8rem' }}
                        />
                        <input
                          type="text"
                          placeholder="Titolo / Descrizione alt"
                          value={img.altKey}
                          onChange={(e) => handleImageAltChange(sectionIdx, imgIdx, e.target.value)}
                          className="admin-input"
                        />
                        <button
                          className="admin-btn-danger admin-btn-small"
                          onClick={() => handleRemoveImage(sectionIdx, imgIdx)}
                          style={{ marginTop: '5px' }}
                        >
                          🗑️ Rimuovi
                        </button>
                      </div>
                    </div>
                  ))}
                  </div>

                  <button
                    className="admin-btn-secondary admin-btn-small"
                    onClick={() => handleAddImage(sectionIdx)}
                    style={{ marginTop: '15px' }}
                  >
                    ➕ Aggiungi Immagine
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryManager;
