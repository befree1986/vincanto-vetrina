import { useState, useEffect, useCallback } from 'react';

export interface BookingRules {
  minStay: number;
  minStayAugust: number;
  maxStay: number;
  maxGuests: number;
}

export const useBookingRules = () => {
  const [rules, setRules] = useState<BookingRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://vincanto-vetrina.vercel.app/api';
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
    // getUTCMonth() è 0-indexed, quindi Agosto è 7
    return date.getUTCMonth() === 7 ? rules.minStayAugust : rules.minStay;
  }, [rules]);

  return { rules, loading, error, getMinStayForDate };
};