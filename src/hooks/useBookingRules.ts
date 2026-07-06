import { useState, useEffect, useCallback } from 'react';

export interface SeasonalRule {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  minStay?: number;
  priceGroup1to2?: number;
  priceGroup3to4?: number;
  priceGroup5to6?: number;
  priceGroup7to8?: number;
}
export interface BookingRules {
  minStay: number;
  minStayAugust: number;
  maxStay: number;
  maxGuests: number;
  seasonalRules: SeasonalRule[];
}

export const useBookingRules = () => {
  const [rules, setRules] = useState<BookingRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.DEV && import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL : '/api';
      const response = await fetch(`${apiUrl}/unified?action=pricing-config`);
      if (!response.ok) {
        throw new Error('Failed to fetch booking rules');
      }
      const data = await response.json();
      if (data.success && data.pricing) {
        setRules({
          minStay: data.pricing.minStay || 3,
          minStayAugust: data.pricing.minStayAugust || 6,
          maxStay: data.pricing.maxStay || 14,
          maxGuests: data.pricing.maxGuests || 8,
          seasonalRules: data.pricing.seasonalRules || [],
        });
      } else {
        throw new Error(data.error || 'Invalid data structure for booking rules');
      }
    } catch (err: any) {
      setError(err.message);
      // Fallback a regole di default in caso di errore API
      setRules({
        minStay: 3,
        minStayAugust: 6,
        maxStay: 14,
        maxGuests: 8,
        seasonalRules: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const getMinStayForDate = useCallback((date: Date | undefined): number => {
    if (!date || !rules) return rules?.minStay ?? 3;

    // Per coerenza con il backend, usiamo UTC per i confronti
    const dateUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

    // 1. Controlla le regole stagionali personalizzate
    const activeRule = rules.seasonalRules.find(rule => {
      const ruleStart = new Date(rule.startDate);
      const ruleEnd = new Date(rule.endDate);
      const ruleStartUTC = new Date(Date.UTC(ruleStart.getFullYear(), ruleStart.getMonth(), ruleStart.getDate()));
      const ruleEndUTC = new Date(Date.UTC(ruleEnd.getFullYear(), ruleEnd.getMonth(), ruleEnd.getDate()));
      return dateUTC >= ruleStartUTC && dateUTC <= ruleEndUTC;
    });

    if (activeRule && activeRule.minStay) {
      return activeRule.minStay;
    }

    // 2. Se nessuna regola stagionale, controlla la regola di Agosto
    // getUTCMonth() è 0-indexed, quindi Agosto è 7.
    return date.getUTCMonth() === 7 ? rules.minStayAugust : rules.minStay;
  }, [rules]);

  return { rules, loading, error, getMinStayForDate };
};