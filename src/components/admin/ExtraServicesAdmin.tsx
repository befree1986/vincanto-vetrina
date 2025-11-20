import React, { useState, useEffect } from 'react';
import AdminApiService from '../../services/adminApiService';
import { ExtraService } from '../../hooks/useExtraServices';

interface ExtraServicesAdminProps {
  onClose?: () => void;
}

const ExtraServicesAdmin: React.FC<ExtraServicesAdminProps> = ({ onClose }) => {
  const [services, setServices] = useState<ExtraService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState<ExtraService | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    unit: 'soggiorno' as ExtraService['unit'],
    category: 'custom' as ExtraService['category'],
    active: true,
    included: false,
    sort_order: 0
  });

  const adminApi = new AdminApiService();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const result = await adminApi.getExtraServices();
      setServices(result || []);
    } catch (error) {
      console.error('❌ Errore caricamento servizi:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingService) {
        // Aggiornamento servizio esistente
        await adminApi.updateExtraService(editingService.id, formData);
        console.log('✅ Servizio aggiornato');
      } else {
        // Creazione nuovo servizio
        await adminApi.createExtraService(formData);
        console.log('✅ Nuovo servizio creato');
      }
      
      // Reset form e ricarica servizi
      resetForm();
      loadServices();
    } catch (error) {
      console.error('❌ Errore salvataggio servizio:', error);
    }
  };

  const handleEdit = (service: ExtraService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price,
      unit: service.unit,
      category: service.category,
      active: service.active ?? true,
      included: service.included ?? false,
      sort_order: 0
    });
    setShowAddForm(true);
  };

  const handleDelete = async (serviceId: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo servizio?')) return;
    
    try {
      await adminApi.deleteExtraService(serviceId);
      console.log('✅ Servizio eliminato');
      loadServices();
    } catch (error) {
      console.error('❌ Errore eliminazione servizio:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      unit: 'soggiorno',
      category: 'custom',
      active: true,
      included: false,
      sort_order: 0
    });
    setEditingService(null);
    setShowAddForm(false);
  };

  const categoryOptions = [
    { value: 'bambini', label: 'Bambini' },
    { value: 'animali', label: 'Animali' },
    { value: 'comfort', label: 'Comfort' },
    { value: 'comodita', label: 'Comodità' },
    { value: 'parcheggio', label: 'Parcheggio' },
    { value: 'custom', label: 'Personalizzato' }
  ];

  const unitOptions = [
    { value: 'soggiorno', label: 'Per soggiorno' },
    { value: 'per_stay', label: 'Per soggiorno (alias)' },
    { value: 'notte', label: 'Per notte' },
    { value: 'per_night', label: 'Per notte (alias)' },
    { value: 'persona', label: 'Per persona' },
    { value: 'per_person', label: 'Per persona (alias)' },
    { value: 'per_person_per_day', label: 'Per persona/giorno' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Caricamento servizi extra...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestione Servizi Extra</h1>
              <p className="text-gray-600 mt-1">Aggiungi e gestisci i servizi extra per i tuoi ospiti</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                ➕ Nuovo Servizio
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Chiudi
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Form Aggiunta/Modifica */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingService ? 'Modifica Servizio' : 'Nuovo Servizio Extra'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Servizio *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="es. Colazione continentale"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prezzo (€) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label htmlFor="unit-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Unità di misura *
                  </label>
                  <select
                    id="unit-select"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {unitOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    id="category-select"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {categoryOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrizione
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrizione dettagliata del servizio..."
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                  Servizio attivo (visibile agli ospiti)
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="included"
                  checked={formData.included}
                  onChange={(e) => setFormData({ ...formData, included: e.target.checked })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="included" className="ml-2 text-sm text-gray-700">
                  <span className="font-medium text-green-600">✅ Servizio incluso</span> (prezzo mostrato come incluso)
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingService ? '✅ Aggiorna' : '✅ Salva'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista Servizi */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Servizi Extra Configurati ({services.length})</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Servizio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prezzo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{service.name}</div>
                        {service.description && (
                          <div className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                            {service.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {categoryOptions.find(cat => cat.value === service.category)?.label || service.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      €{service.price.toFixed(2)} / {service.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        service.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {service.active ? 'Attivo' : 'Inattivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(service)}
                          className="text-blue-600 hover:text-blue-900 text-sm px-3 py-1 rounded border border-blue-300 hover:border-blue-500 transition-colors"
                        >
                          ✏️ Modifica
                        </button>
                        <button
                          onClick={() => handleDelete(service.id)}
                          className="text-red-600 hover:text-red-900 text-sm px-3 py-1 rounded border border-red-300 hover:border-red-500 transition-colors"
                        >
                          🗑️ Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {services.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">🛎️</div>
              <p className="text-gray-600">Nessun servizio extra configurato</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 text-blue-600 hover:text-blue-700"
              >
                Aggiungi il primo servizio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExtraServicesAdmin;