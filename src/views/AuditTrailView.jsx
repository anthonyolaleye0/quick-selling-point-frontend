import React, { useState, useEffect } from 'react';
import { auditService } from '../services/auditService';

export default function AuditTrailView() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const data = await auditService.getAuditLogs();
            setLogs(data.logs || []);
        } catch (err) {
            console.error('Failed to load audit trail:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => 
        log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.user_name && log.user_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div style={{ padding: '20px', background: '#f4f6f9', minHeight: '85vh', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#333' }}>System Audit Trail</h2>
                <button 
                    onClick={fetchLogs}
                    style={{ background: '#228be6', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Refresh Logs
                </button>
            </div>

            <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <input 
                    type="text"
                    placeholder="Search logs by action, description, or user..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box' }}
                />

                {loading ? (
                    <p style={{ textAlign: 'center', color: '#777', padding: '20px' }}>Loading audit records...</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                    <th style={{ padding: '10px' }}>Timestamp</th>
                                    <th style={{ padding: '10px' }}>User</th>
                                    <th style={{ padding: '10px' }}>Action Type</th>
                                    <th style={{ padding: '10px' }}>Description</th>
                                    <th style={{ padding: '10px' }}>IP Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>No audit activity records found.</td>
                                    </tr>
                                ) : (
                                    filteredLogs.map(log => (
                                        <tr key={log.id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                                            <td style={{ padding: '10px', color: '#6c757d', whiteSpace: 'nowrap' }}>
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '10px', fontWeight: 600 }}>{log.user_name || 'System / Guest'}</td>
                                            <td style={{ padding: '10px' }}>
                                                <span style={{ 
                                                    background: '#e7f5ff', color: '#1c7ed6', padding: '2px 6px', 
                                                    borderRadius: '4px', fontWeight: 600, fontSize: '11px' 
                                                }}>
                                                    {log.action_type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px', color: '#212529' }}>{log.description}</td>
                                            <td style={{ padding: '10px', color: '#adb5bd', fontSize: '12px' }}>{log.ip_address || 'N/A'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}