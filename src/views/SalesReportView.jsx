// frontend/src/views/SalesReportView.jsx
import React, { useEffect, useState } from 'react';
import { reportService } from '../services/reportService';
import ReceiptModal from '../components/ReceiptModal';

export default function SalesReportView() {
    const [sales, setSales] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Filter State: 'all', 'daily', 'weekly', 'monthly', 'annual'
    const [filterTimeframe, setFilterTimeframe] = useState('all');

    useEffect(() => {
        loadSales();
    }, []);

    useEffect(() => {
        applyFilter(sales, filterTimeframe);
    }, [sales, filterTimeframe]);

    const loadSales = async () => {
        try {
            const data = await reportService.getAllSales();
            setSales(data);
        } catch (error) {
            console.error('Failed to load sales records', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to get a corrected Date object adjusted for Nigerian Time (WAT, UTC+1)
    const getNigerianDate = (dateString) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return new Date();
        // If database stores UTC, add 1 hour (3600000 ms) to align with WAT local time
        return new Date(date.getTime() + (60 * 60 * 1000));
    };

    const applyFilter = (data, timeframe) => {
        if (!data || data.length === 0) {
            setFilteredSales([]);
            return;
        }

        if (timeframe === 'all') {
            setFilteredSales(data);
            return;
        }

        const now = new Date();
        
        // Helper to format a date object into YYYY-MM-DD using Nigerian time
        const getLocalDateString = (dateObj) => {
            return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        };

        const todayLocalString = getLocalDateString(now);
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        const filtered = data.filter(sale => {
            const saleDate = getNigerianDate(sale.created_at);
            
            if (timeframe === 'daily') {
                return getLocalDateString(saleDate) === todayLocalString;
            } else if (timeframe === 'weekly') {
                const diffTime = now - saleDate;
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                return diffDays >= 0 && diffDays <= 7;
            } else if (timeframe === 'monthly') {
                return (
                    saleDate.getMonth() === currentMonth &&
                    saleDate.getFullYear() === currentYear
                );
            } else if (timeframe === 'annual') {
                return saleDate.getFullYear() === currentYear;
            }
            return true;
        });

        setFilteredSales(filtered);
    };

    const handleViewReceipt = async (id) => {
        try {
            const receipt = await reportService.getTransactionReceipt(id);
            
            // Normalize receipt data to ensure splitDetails is properly populated for ReceiptModal
            const normalizedReceipt = {
                ...receipt,
                receiptNo: receipt.receipt_no || receipt.receiptNo || `REC-${receipt.id}`,
                customerName: receipt.customer_name || receipt.customerName || 'Walk-in Customer',
                grandTotal: receipt.grand_total || receipt.grandTotal || 0,
                paymentMethod: receipt.payment_method || receipt.paymentMethod || 'Cash',
                // Map backend snake_case split_details to camelCase splitDetails expected by ReceiptModal
                splitDetails: receipt.split_details || receipt.splitDetails || []
            };

            setSelectedReceipt(normalizedReceipt);
        } catch (error) {
            console.error('Failed to fetch receipt details:', error);
            alert('Could not fetch receipt details.');
        }
    };

    // Helper formatter for Naira currency
    const formatNaira = (amount) => {
        const val = Number(amount) || 0;
        return `₦${val.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Helper formatter for Nigerian local date & time
    const formatLocalDateTime = (dateString) => {
        if (!dateString) return '';
        const date = getNigerianDate(dateString);
        
        return date.toLocaleString('en-NG', {
            dateStyle: 'medium',
            timeStyle: 'medium'
        });
    };

    // Export current filtered view as a CSV spreadsheet
    const handleExportCSV = () => {
        if (!filteredSales || filteredSales.length === 0) {
            alert('No sales data available to export for this timeframe.');
            return;
        }

        const headers = ['Receipt No', 'Date & Time', 'Customer', 'Payment Method', 'Total Amount (NGN)'];
        
        const rows = filteredSales.map(sale => {
            const receiptNo = `"${sale.receipt_no || `REC-${sale.id}`}"`;
            const dateTime = `"${formatLocalDateTime(sale.created_at)}"`;
            const customer = `"${(sale.customer_name || 'Walk-in Customer').replace(/"/g, '""')}"`;
            const payment = `"${sale.payment_method || 'Cash'}"`;
            const total = Number(sale.grand_total) || 0;
            return [receiptNo, dateTime, customer, payment, total].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', `sales_report_${filterTimeframe}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calculate Summary Metrics for the currently filtered view
    const totalRevenue = filteredSales.reduce((acc, curr) => acc + (Number(curr.grand_total) || 0), 0);
    const totalTransactions = filteredSales.length;

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
            
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                    <h2 style={{ margin: '0 0 5px 0', color: '#333' }}>Sales Records & Reports</h2>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Analyze transaction histories and reprint customer POS receipts.</p>
                </div>
                <button
                    onClick={handleExportCSV}
                    style={{
                        padding: '10px 18px',
                        background: '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    Export CSV Report
                </button>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div style={{ background: '#fff', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #007bff' }}>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>Filtered Revenue</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', marginTop: '5px' }}>{formatNaira(totalRevenue)}</div>
                </div>
                <div style={{ background: '#fff', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #28a745' }}>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Transactions</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', marginTop: '5px' }}>{totalTransactions} Sales</div>
                </div>
            </div>

            {/* Filter Tabs Toolbar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: '#fff', padding: '12px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#555', marginRight: '5px' }}>Timeframe:</span>
                {[
                    { key: 'all', label: 'All Records' },
                    { key: 'daily', label: 'Today' },
                    { key: 'weekly', label: 'This Week' },
                    { key: 'monthly', label: 'This Month' },
                    { key: 'annual', label: 'This Year' }
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setFilterTimeframe(tab.key)}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '4px',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            background: filterTimeframe === tab.key ? '#007bff' : '#f1f1f1',
                            color: filterTimeframe === tab.key ? '#fff' : '#555',
                            transition: 'background 0.2s'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Data Table Card Container */}
            <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#666' }}>Loading sales records...</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6', color: '#333' }}>
                                    <th style={{ padding: '12px 15px' }}>Receipt No</th>
                                    <th style={{ padding: '12px 15px' }}>Date & Time</th>
                                    <th style={{ padding: '12px 15px' }}>Customer</th>
                                    <th style={{ padding: '12px 15px' }}>Payment</th>
                                    <th style={{ padding: '12px 15px' }}>Total Amount</th>
                                    <th style={{ padding: '12px 15px', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSales.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#777' }}>
                                            No sales records found for the selected timeframe.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSales.map((sale) => (
                                        <tr key={sale.id} style={{ borderBottom: '1px solid #eee', transition: 'background 0.1s' }}>
                                            <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#007bff' }}>
                                                {sale.receipt_no || `REC-${sale.id}`}
                                            </td>
                                            <td style={{ padding: '12px 15px', color: '#555' }}>
                                                {formatLocalDateTime(sale.created_at)}
                                            </td>
                                            <td style={{ padding: '12px 15px', color: '#333' }}>
                                                {sale.customer_name || 'Walk-in Customer'}
                                            </td>
                                            <td style={{ padding: '12px 15px' }}>
                                                <span style={{ 
                                                    padding: '3px 8px', 
                                                    borderRadius: '12px', 
                                                    fontSize: '11px', 
                                                    fontWeight: 'bold',
                                                    background: sale.payment_method === 'Cash' ? '#e2f0d9' : '#e8f4fd',
                                                    color: sale.payment_method === 'Cash' ? '#385723' : '#1d6fa5'
                                                }}>
                                                    {sale.payment_method}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#28a745' }}>
                                                {formatNaira(sale.grand_total)}
                                            </td>
                                            <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                                <button 
                                                    onClick={() => handleViewReceipt(sale.id)}
                                                    style={{ 
                                                        padding: '6px 12px', 
                                                        background: '#007bff', 
                                                        color: '#fff', 
                                                        border: 'none', 
                                                        borderRadius: '4px', 
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    View / Reprint
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Receipt Modal Integration */}
            {selectedReceipt && (
                <ReceiptModal 
                    receiptData={selectedReceipt} 
                    formatNaira={formatNaira} 
                    onClose={() => setSelectedReceipt(null)} 
                />
            )}
        </div>
    );
}