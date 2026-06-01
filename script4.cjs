const fs = require('fs');
const filePath = 'src/pages/AdminPanelPro.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = '{/* Fine sezioni amministrative */}';
const galleryTab = `
        {/* Sezione Gestione Immagini */}
        {activeTab === 'gallery' && (
          <div className="admin-section admin-animate-fade-in">
            <h2>🖼️ Gestione Immagini Sito</h2>
            <div className="admin-notice">
              <p>Inserisci gli URL delle immagini per aggiornare le gallerie del sito pubblico.</p>
            </div>
            
            <div className="admin-pricing-section">
              <h3>📸 Galleria Principale (Home Page)</h3>
              <div className="admin-pricing-grid">
                {[1, 2, 3, 4].map(num => (
                  <div key={num} className="admin-stat-card">
                    <h4>Immagine {num}</h4>
                    <div className="pricing-controls" style={{marginTop: '15px'}}>
                      <input 
                        type="url" 
                        className="admin-input" 
                        placeholder="https://esempio.com/immagine.jpg"
                        value={systemSettings.find(s => s.key === \`gallery_image_\${num}\`)?.value || ''}
                        onChange={(e) => {
                          const updated = systemSettings.map(s => 
                            s.key === \`gallery_image_\${num}\` ? { ...s, value: e.target.value } : s
                          );
                          // Se non esiste, aggiungilo temporaneamente
                          if (!updated.find(s => s.key === \`gallery_image_\${num}\`)) {
                            updated.push({ key: \`gallery_image_\${num}\`, value: e.target.value, category: 'gallery' });
                          }
                          setSystemSettings(updated);
                        }}
                      />
                      {systemSettings.find(s => s.key === \`gallery_image_\${num}\`)?.value && (
                        <div style={{marginTop: '10px', width: '100%', height: '120px', borderRadius: '10px', overflow: 'hidden', backgroundImage: \`url(\${systemSettings.find(s => s.key === \\\`gallery_image_\${num}\\\`)?.value})\`, backgroundSize: 'cover', backgroundPosition: 'center'}}></div>
                      )}
                      <button 
                        className="admin-btn-primary admin-btn-small" 
                        style={{marginTop: '15px', width: '100%'}}
                        onClick={async () => {
                          try {
                            const val = systemSettings.find(s => s.key === \`gallery_image_\${num}\`)?.value;
                            if(val) {
                              await updateSystemSettingValue(\`gallery_image_\${num}\`, val);
                              alert('✅ Immagine salvata!');
                            }
                          } catch(e) {
                            alert('❌ Errore');
                          }
                        }}
                      >
                        💾 Salva URL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Fine sezioni amministrative */}`;

content = content.replace(targetStr, galleryTab);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Gallery tab inserted!');
