import React, { useState, useEffect, useMemo } from 'react';
import AdminApiService from '../../services/adminApiService';
import UserEditModal, { AdminUser } from './UserEditModal';
import './TeamManagement.css';

const TeamManagement: React.FC = () => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const apiService = useMemo(() => new AdminApiService(), []);

    const loadUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const userList = await apiService.getAdminUsers();
            setUsers(userList);
        } catch (err) {
            setError('Impossibile caricare la lista degli utenti.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleOpenModal = (user: AdminUser | null = null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleSaveUser = async (user: AdminUser) => {
        setIsSaving(true);
        setError('');
        try {
            if (user.id) {
                await apiService.updateAdminUser(user.id, user);
            } else {
                await apiService.createAdminUser(user);
            }
            handleCloseModal();
            loadUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Errore durante il salvataggio dell\'utente.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (window.confirm('Sei sicuro di voler eliminare questo utente? L\'azione è irreversibile.')) {
            try {
                await apiService.deleteAdminUser(userId);
                loadUsers();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Errore durante l\'eliminazione dell\'utente.');
            }
        }
    };

    return (
        <div className="admin-section">
            <h2>👥 Gestione Team</h2>
            <p>Crea, modifica e gestisci gli utenti amministratori che possono accedere al pannello.</p>
            <div className="team-actions">
                <button className="admin-btn-primary" onClick={() => handleOpenModal()}>+ Aggiungi Utente</button>
            </div>

            {loading && <p>Caricamento utenti...</p>}
            {error && <div className="admin-error">{error}</div>}

            {!loading && (
                <div className="table-responsive">
                    <table className="bookings-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Ruolo</th>
                                <th>Stato</th>
                                <th>Ultimo Accesso</th>
                                <th>Azioni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td><span className="role-badge">{user.role}</span></td>
                                    <td><span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>{user.is_active ? 'Attivo' : 'Bloccato'}</span></td>
                                    <td>{user.last_login ? new Date(user.last_login).toLocaleString('it-IT') : 'Mai'}</td>
                                    <td>
                                        <button className="admin-btn-sm admin-btn-secondary" onClick={() => handleOpenModal(user)}>Modifica</button>
                                        <button className="admin-btn-sm admin-btn-danger" onClick={() => handleDeleteUser(user.id!)}>Elimina</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && <UserEditModal user={editingUser} onClose={handleCloseModal} onSave={handleSaveUser} isSaving={isSaving} />}
        </div>
    );
};

export default TeamManagement;