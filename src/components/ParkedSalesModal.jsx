// frontend/src/components/ParkedSalesModal.jsx
import React from 'react';

export default function ParkedSalesModal({ isOpen, parkedSales, onRetrieve, onClose, formatNaira }) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: '#fff', width: '90%', maxWidth: '600px',
                borderRadius: '8px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                maxHeight: '80vh', display: 'flex', flexDirection: 'column'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #dee2e6', paddingBottom: '10px', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, color: '#333' }}>Parked / Suspended Sales</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
                </div>

                <div style={{ overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
                    {parkedSales.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#777', padding: '30px' }}>No parked sales currently active.</p>
                    ) : (
                        parkedSales.map(sale => (
                            <div key={sale.id} style={{
                                border: '1px solid #e9ecef', borderRadius: '6px', padding: '12px',
                                marginBottom: '12px', background: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', color: '#212529', fontSize: '14px' }}>{sale.reference_note}</div>
                                    <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                                        Items: {sale.items.length} | Total: <strong style={{ color: '#2b8a3e' }}>{formatNaira(sale.grand_total)}</strong>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#adb5bd', marginTop: '2px' }}>Parked at: {sale.created_at}</div>
                                </div>
                                <button 
                                    onClick={() => onRetrieve(sale)}
                                    style={{ background: '#7950f2', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                                >
                                    Retrieve Cart
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ borderTop: '1px solid #dee2e6', paddingTop: '12px', textAlign: 'right', marginTop: '10px' }}>
                    <button onClick={onClose} style={{ padding: '8px 16px', background: '#ced4da', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Close</button>
                </div>
            </div>
        </div>
    );
}