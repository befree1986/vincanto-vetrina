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
} => {
  const [state, setState] = useState<AdminRoleState>({
    role: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchAdminRole = async () => {
      try {
        // Verifica se esiste un token
        const token = localStorage.getItem('vincanto_admin_token');
        if (!token) {
          setState({
            role: 'guest',
            isLoading: false,
            error: null
          });
          return;
        }

        // Prova prima da localStorage
        const storedRole = localStorage.getItem('vincanto_admin_role');
        if (storedRole && ['superadmin', 'admin'].includes(storedRole)) {
          setState({
            role: storedRole as AdminRole,
            isLoading: false,
            error: null
          });
          return;
        }

        // Se non in localStorage, prova da API
        try {
          const response = await fetch('/api/admin/role', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('vincanto_admin_token') || ''}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const role = data.role as AdminRole;
            
            // Salva il ruolo in localStorage per accesso futuro
            localStorage.setItem('vincanto_admin_role', role);
            
            setState({
              role,
              isLoading: false,
              error: null
            });
          } else {
            // Se l'API non risponde, considera come guest
            setState({
              role: 'guest',
              isLoading: false,
              error: 'Impossibile verificare il ruolo'
            });
          }
        } catch (apiError) {
          console.warn('API role check failed, defaulting to guest', apiError);
          setState({
            role: 'guest',
            isLoading: false,
            error: null
          });
        }
      } catch (err) {
        setState({
          role: 'guest',
          isLoading: false,
          error: err instanceof Error ? err.message : 'Errore sconosciuto'
        });
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
