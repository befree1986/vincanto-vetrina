import { useEffect, useState } from 'react';

export type AdminRole = 'superadmin' | 'admin' | 'guest';

interface AdminRoleState {
  role: AdminRole | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook per gestire il ruolo dell'amministratore
 * Recupera il ruolo dall'API/localStorage e fornisce funzioni di verifica
 */
export const useAdminRole = (): AdminRoleState & {
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
  hasAccess: (requiredRole: AdminRole) => boolean;
  error: string | null;
} => {
  const [state, setState] = useState<AdminRoleState>({
    role: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchAdminRole = async () => {
      try {
        const token = localStorage.getItem('vincanto_admin_token');
        if (!token) {
          setState({ role: 'guest', isLoading: false, error: null });
          return;
        }

        const storedRole = localStorage.getItem('vincanto_admin_role');
        if (storedRole && ['superadmin', 'admin'].includes(storedRole)) {
          setState({ role: storedRole as AdminRole, isLoading: false, error: null });
          return;
        }

        const response = await fetch('/api/unified?action=admin/role', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          localStorage.removeItem('vincanto_admin_role');
          localStorage.removeItem('vincanto_admin_email');
          setState({ role: 'guest', isLoading: false, error: 'Impossibile verificare il ruolo' });
          return;
        }

        const data = await response.json();
        const role = data.role as AdminRole;

        if (data.success && ['superadmin', 'admin'].includes(role)) {
          localStorage.setItem('vincanto_admin_role', role);
          setState({ role, isLoading: false, error: null });
          return;
        }

        localStorage.removeItem('vincanto_admin_role');
        localStorage.removeItem('vincanto_admin_email');
        setState({ role: 'guest', isLoading: false, error: 'Impossibile verificare il ruolo' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Errore imprevisto durante la verifica del ruolo';
        console.warn('API role check failed, defaulting to guest', err);
        setState({ role: 'guest', isLoading: false, error: message });
      }
    };

    fetchAdminRole();
  }, []);

  return {
    ...state,
    isSuperAdmin: () => state.role === 'superadmin',
    isAdmin: () => state.role === 'admin' || state.role === 'superadmin',
    hasAccess: (requiredRole: AdminRole) => {
      if (requiredRole === 'superadmin') return state.role === 'superadmin';
      if (requiredRole === 'admin') return state.role === 'admin' || state.role === 'superadmin';
      return true; // guest access
    }
  };
};

// Guard components implementati direttamente nei componenti per evitare problemi con JSX
