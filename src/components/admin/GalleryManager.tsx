/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { galleryData, GallerySection, GalleryImage } from '../../data/galleryData';
import { useTranslation } from 'react-i18next';
import './GalleryManager.css';

interface GalleryManagerProps {
  onSave?: (updatedData: GallerySection[]) => Promise<void>;
}

const GalleryManager: React.FC<GalleryManagerProps> = ({ onSave }) => {
  const { t } = useTranslation();
  const [sections, setSections] = useState<GallerySection[]>(galleryData);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [editingImage, setEditingImage] = useState<{ sectionIdx: number; imgIdx: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSectionTitleChange = (sectionIdx: number, newTitle: string) => {
    const updated = [...sections];
    updated[sectionIdx].titleKey = newTitle;
    setSections(updated);
  };

  const handleImageSrcChange = (sectionIdx: number, imgIdx: number, newSrc: string) => {
    const updated = [...sections];
    updated[sectionIdx].images[imgIdx].src = newSrc;
    setSections(updated);
  };

  const handleImageAltChange = (sectionIdx: number, imgIdx: number, newAlt: string) => {
    const updated = [...sections];
    updated[sectionIdx].images[imgIdx].altKey = newAlt;
    setSections(updated);
  };

  const handleMainImageSrcChange = (sectionIdx: number, newSrc: string) => {
    const updated = [...sections];
    if (updated[sectionIdx].mainImage) {
      updated[sectionIdx].mainImage.src = newSrc;
    }
    setSections(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
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
      altKey: 'new.image.alt',
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
            onClick={() => setEditingSection(editingSection === sectionIdx ? null : sectionIdx)}
          >
            <div className="gallery-section-header">
              <h4>Sezione {sectionIdx + 1}</h4>
              <span className="gallery-image-count">
                📸 {section.images.length} immagini
              </span>
            </div>

            {editingSection === sectionIdx && (
              <div className="gallery-section-edit">
                {/* Immagine Principale */}
                {section.mainImage && (
                  <div className="gallery-image-edit">
                    <h5>Immagine Principale</h5>
                    <img
                      src={section.mainImage.src}
                      alt="Main"
                      className="gallery-preview-img"
                    />
                    <input
                      type="text"
                      placeholder="URL immagine principale"
                      value={section.mainImage.src}
                      onChange={(e) => handleMainImageSrcChange(sectionIdx, e.target.value)}
                      className="admin-input gallery-input"
                    />
                  </div>
                )}

                {/* Immagini della Sezione */}
                <div className="gallery-images-list">
                  <h5>Immagini della Sezione</h5>
                  {section.images.map((img, imgIdx) => (
                    <div
                      key={imgIdx}
                      className="gallery-image-item"
                      onMouseEnter={() => setEditingImage({ sectionIdx, imgIdx })}
                      onMouseLeave={() => setEditingImage(null)}
                    >
                      <img
                        src={img.src}
                        alt={img.altKey}
                        className="gallery-item-preview"
                      />
                      <div className="gallery-image-inputs">
                        <input
                          type="text"
                          placeholder="URL immagine"
                          value={img.src}
                          onChange={(e) => handleImageSrcChange(sectionIdx, imgIdx, e.target.value)}
                          className="admin-input gallery-input-small"
                        />
                        <input
                          type="text"
                          placeholder="Chiave Alt (i18n)"
                          value={img.altKey}
                          onChange={(e) => handleImageAltChange(sectionIdx, imgIdx, e.target.value)}
                          className="admin-input gallery-input-small"
                        />
                        <button
                          className="admin-btn-danger admin-btn-small"
                          onClick={() => handleRemoveImage(sectionIdx, imgIdx)}
                        >
                          🗑️ Rimuovi
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    className="admin-btn-secondary admin-btn-small"
                    onClick={() => handleAddImage(sectionIdx)}
                  >
                    ➕ Aggiungi Immagine
                  </button>
                </div>
              </div>
            )}

            {editingSection !== sectionIdx && (
              <div className="gallery-section-preview">
                {section.mainImage && (
                  <img
                    src={section.mainImage.src}
                    alt="Preview"
                    className="gallery-preview-main"
                  />
                )}
                <p className="gallery-preview-text">Clicca per modificare</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryManager;
