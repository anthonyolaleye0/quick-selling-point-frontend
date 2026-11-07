// frontend/src/views/RestockHistoryView.jsx
import React, { useState, useEffect } from 'react';
import { inventoryService } from '../services/inventoryService';

export default function RestockHistoryView() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const formatNaira = (amount) => {
        return `₦${Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await inventoryService.getRestockHistory();
            setHistory(Array.isArray(res) ? res : res.history || []);
        } catch (err) {
            console.error('Error fetching restock history:', err);
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h2>Stock Purchases & Restock History</h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
                Audit trail of all inventory restock batches, quantities added, and purchase cost prices.
            </p>

            <button onClick={fetchHistory} style={{ padding: '8px 15px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>
                Refresh Log
            </button>

            <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                <thead>
                    <tr style={{ background: '#ddd' }}>
                        <th>Date / Time</th>
                        <th>Product Name</th>
                        <th>SKU</th>
                        <th>Qty Added</th>
                        <th>Cost Price (Unit)</th>
                        <th>Total Batch Cost</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="6" style={{ textAlign: 'center', color: '#777' }}>Loading purchase history...</td>
                        </tr>
                    ) : history.length === 0 ? (
                        <tr>
                            <td colSpan="6" style={{ textAlign: 'center', color: '#777' }}>No stock purchase history recorded yet.</td>
                        </tr>
                    ) : (
                        history.map((item, index) => {
                            const qty = Number(item.quantity_added || item.add_quantity || 0);
                            const cost = Number(item.cost_price || 0);
                            return (
                                <tr key={item.id || index}>
                                    <td>{item.created_at || item.date || 'N/A'}</td>
                                    <td>{item.product_name || item.name || 'N/A'}</td>
                                    <td>{item.sku || 'N/A'}</td>
                                    <td>{qty}</td>
                                    <td>{formatNaira(cost)}</td>
                                    <td>{formatNaira(qty * cost)}</td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}