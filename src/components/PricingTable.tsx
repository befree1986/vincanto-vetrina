import React from 'react';
import { useTranslation } from 'react-i18next';
import { getSafeTranslation } from '../i18n';
import { PriceHistory } from '../hooks/usePricing';
import './PricingTable.css';

interface PricingTableProps {
  priceHistory: PriceHistory[];
  loading: boolean;
  selectedDate?: string;
}

const PricingTable: React.FC<PricingTableProps> = ({ 
  priceHistory, 
  loading, 
  selectedDate 
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="tariffe-table-container">
        <div className="pricing-table-loading">
          <div>📊 Caricamento prezzi...</div>
        </div>
      </div>
    );
  }

  if (!priceHistory || priceHistory.length === 0) {
    return (
      <div className="tariffe-table-container">
        <div className="pricing-table-empty">
          <div>📊 Nessun dato disponibile</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tariffe-table-container">
      <h4 className="pricing-table-title">
        {getSafeTranslation(t, 'propriety.pricing.tableTitle', '📊 Tariffe Stagionali')}
      </h4>
      
      <table className="tariffe-table">
        <thead>
          <tr>
            <th>{getSafeTranslation(t, 'propriety.pricing.period', 'Periodo')}</th>
            <th>{getSafeTranslation(t, 'propriety.pricing.pricePerPerson', 'Prezzo/persona')}</th>
          </tr>
        </thead>
        <tbody>
          {priceHistory.map((entry, index) => (
            <tr 
              key={entry.id || index}
              className={selectedDate === entry.date ? 'selected-row' : ''}
            >
              <td>
                <strong>{entry.season}</strong>
                <br />
                <small className="pricing-table-season-info">
                  {new Date(entry.date).toLocaleDateString('it-IT', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </small>
              </td>
              <td>
                <span className={`pricing-table-price ${selectedDate === entry.date ? 'selected' : ''}`}>
                  €{entry.price}
                </span>
                <small className="pricing-table-unit">
                  /notte
                </small>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="tariffe-note">
        <p>
          <strong>📌 Nota:</strong> {getSafeTranslation(t, 'propriety.pricing.note', 
          'I prezzi sono per persona a notte e possono variare in base alla disponibilità e alla durata del soggiorno.')}
        </p>
        <p>
          <small>
            ✨ Sconti automatici: 10% per 7+ notti, 15% per 30+ giorni
          </small>
        </p>
      </div>
    </div>
  );
};

export default PricingTable;