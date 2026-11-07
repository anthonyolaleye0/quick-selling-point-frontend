// frontend/src/views/ShiftManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ShiftManagement() {
    const [activeShift, setActiveShift] = useState(null);
    const [shiftHistory, setShiftHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [openingFloat, setOpeningFloat] = useState('');
    const [actualCountedCash, setActualCountedCash] = useState('');
    const [shiftNotes, setShiftNotes] = useState('');
    const [zReportResult, setZReportResult] = useState(null);

    // Cash Drop States
    const [dropAmount, setDropAmount] = useState('');
    const [dropReason, setDropReason] = useState('');

    // Audit Trail Modal / Inspection State
    const [selectedShiftAudit, setSelectedShiftAudit] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);

    // Filter & Search States
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const cashierId = 1; // Default session cashier ID
    const formatNaira = (amount) => `₦${Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

    const fetchShiftData = async () => {
        try {
            setLoading(true);
            const [activeRes, historyRes] = await Promise.all([
                axios.get(`/api/shifts/active/${cashierId}`),
                axios.get('/api/shifts')
            ]);
            setActiveShift(activeRes.data);
            setShiftHistory(historyRes.data);
        } catch (err) {
            console.error('Failed to fetch shift data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShiftData();
    }, []);

    const handleOpenShift = async (e) => {
        e.preventDefault();
        if (!openingFloat || Number(openingFloat) < 0) {
            alert('Please enter a valid opening float amount.');
            return;
        }

        try {
            await axios.post('/api/shifts/open', {
                cashier_id: cashierId,
                cashier_name: 'Babatola',
                opening_float: Number(openingFloat)
            });
            alert('Shift opened successfully! Cash drawer is active.');
            setOpeningFloat('');
            fetchShiftData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to open shift.');
        }
    };

    const handleCashDrop = async (e) => {
        e.preventDefault();
        if (!dropAmount || Number(dropAmount) <= 0) {
            alert('Please enter a valid cash drop amount.');
            return;
        }

        try {
            await axios.post('/api/shifts/cash-drop', {
                shift_id: activeShift.shift_id,
                user_id: cashierId,
                amount: Number(dropAmount),
                reason: dropReason || 'Drawer cash drop / payout'
            });
            alert('Cash drop logged successfully to audit trail.');
            setDropAmount('');
            setDropReason('');
            fetchShiftData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to log cash drop.');
        }
    };

    const handleCloseShiftZReport = async (e) => {
        e.preventDefault();
        if (actualCountedCash === '') {
            alert('Please enter the actual physical cash counted in the drawer.');
            return;
        }

        const confirmClose = window.confirm('Are you sure you want to close this shift? This will lock daily sales and generate the final Z-Report.');
        if (!confirmClose) return;

        try {
            const res = await axios.post('/api/shifts/close', {
                shift_id: activeShift.shift_id,
                actual_counted_cash: Number(actualCountedCash),
                notes: shiftNotes
            });
            setZReportResult(res.data.summary);
            alert('Z-Report generated successfully.');
            setActualCountedCash('');
            setShiftNotes('');
            fetchShiftData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to close shift.');
        }
    };

    const viewAuditTrail = async (shiftId) => {
        try {
            const res = await axios.get(`/api/shifts/${shiftId}/audit-trail`);
            setSelectedShiftAudit(shiftId);
            setAuditLogs(res.data);
        } catch (err) {
            alert('Failed to load shift audit logs.');
        }
    };

    // Filter Logic
    const filteredHistory = shiftHistory.filter(shift => {
        const matchesStatus = statusFilter === 'ALL' || shift.status === statusFilter;
        const matchesSearch = searchTerm === '' || 
            shift.cashier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(shift.id).includes(searchTerm);
        return matchesStatus && matchesSearch;
    });

    // CSV Export Logic
    const exportToCSV = () => {
        if (filteredHistory.length === 0) {
            alert('No shift records available to export.');
            return;
        }

        const headers = ['ID', 'Cashier', 'Status', 'Opened At', 'Closed At', 'Opening Float (₦)', 'Cash Sales (₦)', 'Transfer Sales (₦)', 'Card Sales (₦)', 'Cash Drops (₦)', 'Expected Cash (₦)', 'Counted Cash (₦)', 'Variance (₦)'];
        const rows = filteredHistory.map(shift => [
            `#${shift.id}`,
            `"${shift.cashier_name || ''}"`,
            shift.status,
            `"${new Date(shift.opened_at).toLocaleString()}"`,
            `"${shift.closed_at ? new Date(shift.closed_at).toLocaleString() : '-'}"`,
            shift.opening_float,
            shift.total_cash_sales,
            shift.total_transfer_sales || 0,
            shift.total_card_sales || 0,
            shift.total_cash_drops || 0,
            shift.expected_cash,
            shift.actual_counted_cash !== null ? shift.actual_counted_cash : '',
            shift.cash_difference !== undefined && shift.cash_difference !== null ? shift.cash_difference : ''
        ]);

        const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `shift_audit_report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading shift management...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
            <h2 style={{ color: '#212529', marginBottom: '8px' }}>Shift & Drawer Management</h2>
            <p style={{ color: '#6c757d', marginBottom: '24px', fontSize: '14px' }}>
                Manage drawer floats, record cash drops, run interim X-Reports, and lock down final Z-Reports with full audit tracking.
            </p>

            {!activeShift?.active ? (
                <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #dee2e6', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#333' }}>Open Cash Drawer</h3>
                    <form onSubmit={handleOpenShift}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Opening Float Amount (₦):</label>
                            <input 
                                type="number" 
                                placeholder="e.g. 10000" 
                                value={openingFloat}
                                onChange={(e) => setOpeningFloat(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box' }}
                            />
                        </div>
                        <button type="submit" style={{ background: '#2b8a3e', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
                            Start Shift & Open Drawer
                        </button>
                    </form>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ background: '#e7f5ff', border: '1px solid #74c0fc', padding: '20px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', color: '#1864ab' }}>Interim X-Report (Live Shift Activity)</h3>
                            <span style={{ fontSize: '12px', background: '#339af0', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>SHIFT ACTIVE</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px', color: '#212529' }}>
                            <div><strong>Opened At:</strong> {new Date(activeShift.opened_at).toLocaleString()}</div>
                            <div><strong>Opening Float:</strong> {formatNaira(activeShift.opening_float)}</div>
                            <div><strong>Cash Sales:</strong> {formatNaira(activeShift.cash_sales)}</div>
                            <div><strong>Transfer Sales:</strong> {formatNaira(activeShift.transfer_sales)}</div>
                            <div><strong>Card Sales:</strong> {formatNaira(activeShift.card_sales)}</div>
                            <div><strong>Split Payments Total:</strong> {formatNaira(activeShift.split_sales)}</div>
                            <div style={{ gridColumn: 'span 2', borderTop: '1px solid #bae0fd', paddingTop: '8px', marginTop: '4px' }}>
                                <strong>Expected Drawer Cash (Float + Cash Sales - Drops):</strong> <span style={{ color: '#2b8a3e', fontWeight: 'bold' }}>{formatNaira(activeShift.expected_cash_drawer)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Cash Drop / Drawer Payout Widget */}
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#333' }}>Record Cash Drop / Payout</h3>
                        <form onSubmit={handleCashDrop} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '10px', alignItems: 'end' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Amount (₦):</label>
                                <input 
                                    type="number" 
                                    placeholder="Amount" 
                                    value={dropAmount}
                                    onChange={(e) => setDropAmount(e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Reason / Note:</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Paid delivery dispatch rider" 
                                    value={dropReason}
                                    onChange={(e) => setDropReason(e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da', boxSizing: 'border-box' }}
                                />
                            </div>
                            <button type="submit" style={{ background: '#f59f00', color: '#fff', border: 'none', padding: '9px 12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                                Log Cash Drop
                            </button>
                        </form>
                    </div>

                    <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #dee2e6', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#333' }}>Close Shift & Generate Z-Report</h3>
                        <form onSubmit={handleCloseShiftZReport}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Actual Physical Cash Counted (₦):</label>
                                <input 
                                    type="number" 
                                    step="any"
                                    placeholder="Enter total physical cash counted..." 
                                    value={actualCountedCash}
                                    onChange={(e) => setActualCountedCash(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Reconciliation Notes:</label>
                                <textarea 
                                    rows="2"
                                    placeholder="Optional comments..."
                                    value={shiftNotes}
                                    onChange={(e) => setShiftNotes(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box' }}
                                ></textarea>
                            </div>
                            <button type="submit" style={{ background: '#c92a2a', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
                                Lock Shift & Print Z-Report
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {zReportResult && (
                <div style={{ marginBottom: '30px', background: '#f8f9fa', border: '1px solid #ced4da', padding: '20px', borderRadius: '8px' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#2b8a3e' }}>Z-Report Summary Locked</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                        <div><strong>Expected Cash:</strong> {formatNaira(zReportResult.expected_cash)}</div>
                        <div><strong>Actual Counted:</strong> {formatNaira(zReportResult.actual_counted)}</div>
                        <div><strong>Difference (Overs/Shorts):</strong> 
                            <span style={{ color: zReportResult.difference < 0 ? '#c92a2a' : '#2b8a3e', fontWeight: 'bold', marginLeft: '6px' }}>
                                {formatNaira(zReportResult.difference)}
                            </span>
                        </div>
                        <div><strong>Total Sales Volume:</strong> {formatNaira(zReportResult.total_sales)}</div>
                    </div>
                </div>
            )}

            {/* Shift Audit Logs Modal / Drawer */}
            {selectedShiftAudit && (
                <div style={{ background: '#f1f3f5', border: '1px solid #adb5bd', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ margin: 0, fontSize: '15px', color: '#333' }}>Audit Trail for Shift #{selectedShiftAudit}</h3>
                        <button onClick={() => setSelectedShiftAudit(null)} style={{ background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>[Close X]</button>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#495057' }}>
                        {auditLogs.map(log => (
                            <li key={log.id} style={{ marginBottom: '6px' }}>
                                <strong>{new Date(log.created_at).toLocaleTimeString()}:</strong> [{log.action_type}] {log.details} 
                                {log.amount ? ` (₦${log.amount})` : ''} — <em>{log.user_name}</em>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Historical Shift & Z-Report Logs Table */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #dee2e6', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>Shift History & Z-Report Logs</h3>
                    
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input 
                            type="text" 
                            placeholder="Search cashier or ID..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '13px' }}
                        />
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '13px', background: '#fff' }}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="OPEN">Open Only</option>
                            <option value="CLOSED">Closed Only</option>
                        </select>
                        <button 
                            onClick={exportToCSV}
                            style={{ background: '#1864ab', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                        >
                            Export CSV
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6', color: '#495057' }}>
                                <th style={{ padding: '10px' }}>ID</th>
                                <th style={{ padding: '10px' }}>Cashier</th>
                                <th style={{ padding: '10px' }}>Status</th>
                                <th style={{ padding: '10px' }}>Opened</th>
                                <th style={{ padding: '10px' }}>Closed</th>
                                <th style={{ padding: '10px' }}>Float</th>
                                <th style={{ padding: '10px' }}>Cash Sales</th>
                                <th style={{ padding: '10px' }}>Expected</th>
                                <th style={{ padding: '10px' }}>Counted</th>
                                <th style={{ padding: '10px' }}>Variance</th>
                                <th style={{ padding: '10px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.length === 0 ? (
                                <tr>
                                    <td colSpan="11" style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>No shift records found matching your filters.</td>
                                </tr>
                            ) : (
                                filteredHistory.map(shift => (
                                    <tr key={shift.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '10px' }}>#{shift.id}</td>
                                        <td style={{ padding: '10px' }}>{shift.cashier_name}</td>
                                        <td style={{ padding: '10px' }}>
                                            <span style={{ 
                                                padding: '2px 6px', 
                                                borderRadius: '4px', 
                                                fontSize: '11px', 
                                                fontWeight: 'bold',
                                                background: shift.status === 'OPEN' ? '#d3f9d8' : '#f1f3f5',
                                                color: shift.status === 'OPEN' ? '#2b8a3e' : '#495057'
                                            }}>
                                                {shift.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px' }}>{new Date(shift.opened_at).toLocaleString()}</td>
                                        <td style={{ padding: '10px' }}>{shift.closed_at ? new Date(shift.closed_at).toLocaleString() : '-'}</td>
                                        <td style={{ padding: '10px' }}>{formatNaira(shift.opening_float)}</td>
                                        <td style={{ padding: '10px' }}>{formatNaira(shift.total_cash_sales)}</td>
                                        <td style={{ padding: '10px' }}>{formatNaira(shift.expected_cash)}</td>
                                        <td style={{ padding: '10px' }}>{shift.actual_counted_cash !== null ? formatNaira(shift.actual_counted_cash) : '-'}</td>
                                        <td style={{ padding: '10px', fontWeight: 'bold', color: shift.cash_difference < 0 ? '#c92a2a' : shift.cash_difference > 0 ? '#2b8a3e' : '#495057' }}>
                                            {shift.actual_counted_cash !== null ? formatNaira(shift.cash_difference) : '-'}
                                        </td>
                                        <td style={{ padding: '10px' }}>
                                            <button 
                                                onClick={() => viewAuditTrail(shift.id)}
                                                style={{ background: '#e7f5ff', color: '#1864ab', border: '1px solid #74c0fc', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                                            >
                                                Audit Log
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}