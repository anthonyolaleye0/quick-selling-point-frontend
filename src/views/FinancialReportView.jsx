import React, { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';

export default function FinancialReportView() {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
    const todayStr = currentDate.toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(todayStr);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [downloadingVat, setDownloadingVat] = useState(false);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const data = await reportService.getBusinessAnalysisReport(startDate, endDate);
            setReport(data);
        } catch (err) {
            alert('Failed to load financial analysis report from server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, []);

    const formatNaira = (amount) => {
        return `₦${Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handleDownloadSchedules = async () => {
        setDownloadingVat(true);
        try {
            const vatData = await reportService.getVatSchedule(startDate, endDate);

            if (vatData?.vatable_entries && vatData.vatable_entries.length > 0) {
                const vatableHeaders = [
                    'Receipt No', 
                    'Date', 
                    'Customer Name', 
                    'Vatable Sales Amount (₦)', 
                    'Output VAT Charged (7.5%) (₦)', 
                    'Vatable Cost Price (₦)', 
                    'Input VAT on Cost (7.5%) (₦)', 
                    'Gross Amount (₦)'
                ];
                const vatableRows = vatData.vatable_entries.map(item => [
                    `"${item.receipt_no || ''}"`,
                    `"${item.transaction_date || ''}"`,
                    `"${item.customer_name || ''}"`,
                    Number(item.vatable_amount || 0).toFixed(2),
                    Number(item.vat_amount || 0).toFixed(2),
                    Number(item.vatable_cost || 0).toFixed(2),
                    Number(item.input_vat_amount || 0).toFixed(2),
                    Number(item.gross_amount || 0).toFixed(2)
                ]);

                const vatableCsv = [
                    `"VAT-ABLE SALES & INPUT COST SCHEDULE (${startDate} to ${endDate})"`,
                    vatableHeaders.join(','),
                    ...vatableRows.map(r => r.join(',')),
                    `"TOTALS","","",${vatData.total_taxable_sales.toFixed(2)},${vatData.total_output_vat.toFixed(2)},${vatData.total_vatable_cost.toFixed(2)},${vatData.total_input_vat.toFixed(2)},${vatData.total_gross.toFixed(2)}`
                ].join('\n');

                triggerCsvDownload(vatableCsv, `VATable_and_Cost_Schedule_${startDate}_to_${endDate}.csv`);
            } else {
                alert('No VAT-able sales found for the selected period.');
            }

            if (vatData?.non_vatable_entries && vatData.non_vatable_entries.length > 0) {
                const nonVatableHeaders = ['Receipt No', 'Date', 'Customer Name', 'Exempt / Non-VATable Amount (₦)', 'Gross Amount (₦)'];
                const nonVatableRows = vatData.non_vatable_entries.map(item => [
                    `"${item.receipt_no || ''}"`,
                    `"${item.transaction_date || ''}"`,
                    `"${item.customer_name || ''}"`,
                    Number(item.non_vatable_amount || 0).toFixed(2),
                    Number(item.gross_amount || 0).toFixed(2)
                ]);

                const nonVatableCsv = [
                    `"NON-VATABLE / EXEMPT SALES SCHEDULE (${startDate} to ${endDate})"`,
                    nonVatableHeaders.join(','),
                    ...nonVatableRows.map(r => r.join(','))
                ].join('\n');

                setTimeout(() => {
                    triggerCsvDownload(nonVatableCsv, `Non_VATable_Schedule_${startDate}_to_${endDate}.csv`);
                }, 500);
            }
        } catch (err) {
            alert('Failed to generate tax schedules.');
        } finally {
            setDownloadingVat(false);
        }
    };

    const triggerCsvDownload = (content, filename) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                    <h2 style={{ margin: '0 0 5px 0' }}>Business Analysis & Financial Report</h2>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Evaluate profitability, Output VAT, and Input VAT based on Cost Price of VATable goods sold.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button 
                        onClick={handleDownloadSchedules}
                        disabled={downloadingVat}
                        style={{ padding: '10px 18px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        {downloadingVat ? 'Exporting Schedules...' : 'Download VAT & Cost Schedules (CSV) 📊'}
                    </button>
                    <button 
                        onClick={() => window.print()}
                        style={{ padding: '10px 20px', background: '#343a40', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Print / Export PDF 🖨️
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '25px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Start Date:</label>
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>End Date:</label>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>
                <button 
                    onClick={fetchReportData}
                    style={{ padding: '9px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', height: 'fit-content', alignSelf: 'flex-end' }}
                >
                    Generate Report
                </button>
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Analyzing financial records...</p>
            ) : report ? (
                <div>
                    {/* Profit & Loss Section */}
                    <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '8px', marginBottom: '15px' }}>1. Profit or Loss Statement</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                        <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '6px', border: '1px solid #90caf9' }}>
                            <span style={{ fontSize: '12px', color: '#1565c0', fontWeight: 'bold' }}>REVENUE</span>
                            <h3 style={{ margin: '8px 0 0 0', color: '#0d47a1' }}>{formatNaira(report.revenue)}</h3>
                        </div>
                        <div style={{ background: '#ffebee', padding: '15px', borderRadius: '6px', border: '1px solid #ffcdd2' }}>
                            <span style={{ fontSize: '12px', color: '#c62828', fontWeight: 'bold' }}>COST OF SALES (COGS)</span>
                            <h3 style={{ margin: '8px 0 0 0', color: '#b71c1c' }}>{formatNaira(report.cost_of_sales)}</h3>
                        </div>
                        <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '6px', border: '1px solid #a5d6a7' }}>
                            <span style={{ fontSize: '12px', color: '#2e7d32', fontWeight: 'bold' }}>GROSS PROFIT</span>
                            <h3 style={{ margin: '8px 0 0 0', color: '#1b5e20' }}>{formatNaira(report.gross_profit)}</h3>
                        </div>
                        <div style={{ background: '#fff3e0', padding: '15px', borderRadius: '6px', border: '1px solid #ffe0b2' }}>
                            <span style={{ fontSize: '12px', color: '#ef6c00', fontWeight: 'bold' }}>TOTAL OPEX</span>
                            <h3 style={{ margin: '8px 0 0 0', color: '#e65100' }}>{formatNaira(report.total_opex)}</h3>
                        </div>
                        <div style={{ background: (report.net_profit || 0) >= 0 ? '#e8f5e9' : '#ffebee', padding: '15px', borderRadius: '6px', border: `1px solid ${(report.net_profit || 0) >= 0 ? '#81c784' : '#e57373'}` }}>
                            <span style={{ fontSize: '12px', color: (report.net_profit || 0) >= 0 ? '#2e7d32' : '#c62828', fontWeight: 'bold' }}>NET PROFIT / (LOSS)</span>
                            <h3 style={{ margin: '8px 0 0 0', color: (report.net_profit || 0) >= 0 ? '#1b5e20' : '#b71c1c' }}>{formatNaira(report.net_profit)}</h3>
                        </div>
                    </div>

                    {/* VAT Metrics Section */}
                    <div style={{ background: '#fdfffe', border: '1px solid #bce8f1', padding: '20px', borderRadius: '6px', marginBottom: '30px' }}>
                        <h3 style={{ margin: '0 0 8px 0', color: '#31708f' }}>2. Statutory VAT Metrics (Selected Period)</h3>
                        <p style={{ fontSize: '13px', color: '#555', marginTop: 0 }}>Overview of Output VAT on sales and Input VAT calculated on the cost/purchase price of VATable goods sold.</p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px', marginTop: '15px' }}>
                            <div style={{ background: '#d9edf7', padding: '15px', borderRadius: '4px' }}>
                                <span style={{ fontWeight: 'bold', color: '#31708f', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Total Output VAT (Sales):</span>
                                <span style={{ fontWeight: 'bold', color: '#2a6496', fontSize: '20px' }}>{formatNaira(report.total_output_vat)}</span>
                            </div>
                            <div style={{ background: '#d9edf7', padding: '15px', borderRadius: '4px' }}>
                                <span style={{ fontWeight: 'bold', color: '#31708f', fontSize: '13px', display: 'block', marginBottom: '2px' }}>Total VATable Cost Price:</span>
                                <span style={{ fontWeight: 'bold', color: '#2a6496', fontSize: '16px', display: 'block', marginBottom: '5px' }}>{formatNaira(report.total_vatable_cost)}</span>
                                <span style={{ fontWeight: 'bold', color: '#31708f', fontSize: '13px', display: 'block', marginBottom: '2px' }}>Input VAT on Goods Sold (7.5% of Cost):</span>
                                <span style={{ fontWeight: 'bold', color: '#2a6496', fontSize: '20px' }}>{formatNaira(report.input_vat_on_goods_sold)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Top 5 Selling Products */}
                    <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '8px', marginBottom: '15px' }}>3. Top 5 Selling Products & Services</h3>
                    <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', background: 'white', marginBottom: '30px' }}>
                        <thead>
                            <tr style={{ background: '#e9ecef', textAlign: 'left' }}>
                                <th>Rank</th>
                                <th>Product / Service Name</th>
                                <th>Units Sold</th>
                                <th>Revenue Generated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(!report.top_products || report.top_products.length === 0) ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', color: '#777' }}>No sales records found for this period.</td>
                                </tr>
                            ) : (
                                report.top_products.map((prod, index) => (
                                    <tr key={index}>
                                        <td style={{ fontWeight: 'bold', width: '60px' }}>#{index + 1}</td>
                                        <td>{prod.name}</td>
                                        <td>{prod.units_sold}</td>
                                        <td style={{ fontWeight: 'bold', color: '#007bff' }}>{formatNaira(prod.revenue)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Supporting OpEx Breakdown */}
                    <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '8px', marginBottom: '15px' }}>4. Supporting Operating Expenses Breakdown</h3>
                    <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(!report.expense_breakdown || report.expense_breakdown.length === 0) ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', color: '#777' }}>No expenses logged for this period.</td>
                                </tr>
                            ) : (
                                report.expense_breakdown.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.expense_date?.split('T')[0]}</td>
                                        <td>{item.category}</td>
                                        <td>{item.description || '-'}</td>
                                        <td style={{ color: '#d9534f', fontWeight: 'bold' }}>{formatNaira(item.amount)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
}