import React, { useState, useEffect } from 'react';
import './UserEditModal.css';

export interface AdminUser {
    id?: number;
    name: string;
    email: string;
    role: 'admin' | 'editor' | 'viewer';
    is_active: boolean;
    password?: string;
    last_login?: string;
}

interface UserEditModalProps {
    user: AdminUser | null;
    onClose: () => void;
    onSave: (user: AdminUser) => void;
    isSaving: boolean;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ user, onClose, onSave, isSaving }) => {
    const [formData, setFormData] = useState<AdminUser>({
        name: '',
        email: '',
        role: 'admin',
        is_active: true,
        password: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({ ...user, password: '' }); // Non pre-popolare la password
        } else {
            setFormData({ name: '', email: '', role: 'admin', is_active: true, password: '' });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content user-edit-modal">
                <button onClick={onClose} className="modal-close-btn">&times;</button>
                <h2>{user ? 'Modifica Utente' : 'Crea Nuovo Utente'}</h2>
                <form onSubmit={handleSubmit} className="admin-form">
                    <div className="form-grid">
                        <div>
                            <label>Nome Completo</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                        </div>
                        <div>
                            <label>Password</label>
                            <input type="password" name="password" value={formData.password || ''} onChange={handleChange} placeholder={user ? 'Lascia vuoto per non cambiare' : 'Min. 8 caratteri'} required={!user} />
                        </div>
                        <div>
                            <label>Ruolo</label>
                            <select name="role" value={formData.role} onChange={handleChange}>
                                <option value="admin">Admin</option>
                                <option value="editor">Editor (Contenuti)</option>
                                <option value="viewer">Viewer (Sola lettura)</option>
                            </select>
                        </div>
                    </div>
                    <div className="config-item checkbox-item">
                        <label>
                            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} />
                            Utente Attivo
                        </label>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-secondary" disabled={isSaving}>Annulla</button>
                        <button type="submit" className="btn-primary" disabled={isSaving}>
                            {isSaving ? 'Salvataggio...' : 'Salva Utente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserEditModal;