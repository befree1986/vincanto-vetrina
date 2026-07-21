import React, { useState, useEffect, useMemo } from 'react';
import AdminApiService from './adminApiService';
import './AuditLogViewer.css';

const AuditLogViewer: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    const [totalLogs, setTotalLogs] = useState(0);
    const apiService = useMemo(() => new AdminApiService(), []);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const offset = (currentPage - 1) * itemsPerPage;
                const result = await apiService.getAuditLogs(itemsPerPage, offset);
                setLogs(result.logs || []);
                setTotalLogs(result.total || 0);
            } catch (err) {
                setError('Impossibile caricare i log di audit.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [currentPage, itemsPerPage, apiService]);

    const totalPages = Math.ceil(totalLogs / itemsPerPage);

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const renderDetails = (details: any) => {
        if (!details) return 'N/D';
        return <pre><code>{JSON.stringify(details, null, 2)}</code></pre>;
    };

    return (
        <div className="audit-log-viewer">
            <h2>Log Attività Admin</h2>
            {loading && <p>Caricamento log...</p>}
            {error && <div className="admin-error">{error}</div>}
            {!loading && !error && (
                <>
                    <div className="table-responsive">
                        <table className="bookings-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Admin</th>
                                    <th>Azione</th>
                                    <th>Entità</th>
                                    <th>ID Entità</th>
                                    <th>Dettagli</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td>{new Date(log.created_at).toLocaleString('it-IT')}</td>
                                        <td>{log.admin_email}</td>
                                        <td><span className={`log-action-badge action-${log.action}`}>{log.action}</span></td>
                                        <td>{log.entity_type}</td>
                                        <td>{log.entity_id}</td>
                                        <td>{renderDetails(log.details)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="pagination-controls">
                            <span>Pagina {currentPage} di {totalPages}</span>
                            <div>
                                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>Precedente</button>
                                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Successivo</button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AuditLogViewer;