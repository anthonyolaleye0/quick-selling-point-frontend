// frontend/src/components/ReceiptModal.jsx
import React from 'react';

export default function ReceiptModal({ receiptData, formatNaira, onClose }) {
    if (!receiptData) return null;

    // Fallback formatNaira helper in case prop is missing from parent
    const formatCurrency = typeof formatNaira === 'function' ? formatNaira : (amount) => {
        return `₦${Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Normalize properties to support both live checkout and history database records
    const receiptNo = receiptData.receiptNo || receiptData.receipt_no;
    const cashierId = receiptData.cashierId || receiptData.cashier_id;
    const customerName = receiptData.customerName || receiptData.customer_name || 'Walk-in Customer';
    const paymentMethod = receiptData.paymentMethod || receiptData.payment_method || 'Cash';
    const vatAmount = receiptData.vatAmount !== undefined ? receiptData.vatAmount : receiptData.vat_amount;
    const grandTotal = receiptData.grandTotal !== undefined ? receiptData.grandTotal : receiptData.grand_total;
    const items = Array.isArray(receiptData.items) ? receiptData.items : [];
    
    // Extract split details array safely from various possible property names (supports both live and historical rows)
    const splitDetails = receiptData.splitDetails || receiptData.split_details || [];
    const isSplitPayment = (paymentMethod || '').toLowerCase() === 'split' || splitDetails.length > 0;

    // Helper component/string builder for payment method breakdown
    const renderSplitDetailsHtml = (isForPrint = false) => {
        if (!isSplitPayment || splitDetails.length === 0) {
            return `<div style="display: flex; justify-content: space-between;"><span>Payment Method:</span><span>${paymentMethod}</span></div>`;
        }

        return `
            <div style="margin: 6px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0;">
                <div style="font-weight: bold; font-size: ${isForPrint ? '11px' : '12px'}; margin-bottom: 2px;">SPLIT PAYMENT BREAKDOWN:</div>
                ${splitDetails.map(split => `
                    <div style="display: flex; justify-content: space-between; font-size: ${isForPrint ? '11px' : '12px'}; padding-left: 6px;">
                        <span>${split.method || split.payment_method}:</span>
                        <span>${formatCurrency(split.amount)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    };

    const triggerThermalPrint = (data) => {
        const printWindow = window.open('', '_blank', 'width=350,height=600');
        if (!printWindow) {
            alert('Popup blocked! Please allow popups for this site to print receipts.');
            return;
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - ${receiptNo}</title>
                <style>
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 12px;
                        width: 280px;
                        margin: 0 auto;
                        padding: 10px;
                        color: #000;
                        background: #fff;
                    }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .flex { display: flex; justify-content: space-between; }
                    .line { border-bottom: 1px dashed #000; margin: 8px 0; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    th, td { text-align: left; padding: 2px 0; vertical-align: top; }
                    th { border-bottom: 1px solid #000; }
                    .right { text-align: right; }
                    @media print {
                        body {
                            width: 100%;
                            margin: 0;
                            padding: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="center">
                    <div class="bold" style="font-size: 16px;">STORE NAME</div>
                    <div>123 Business Street, City</div>
                    <div>Tel: 08000000000</div>
                </div>
                <div class="line"></div>
                <div>Receipt No: ${receiptNo}</div>
                <div>Date: ${data.date || data.created_at}</div>
                <div>Cashier: ID ${cashierId}</div>
                <div>Customer: ${customerName}</div>
                <div class="line"></div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th class="center">Qty</th>
                            <th class="right">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td>${item.name || item.product_name}</td>
                                <td class="center">${item.quantity}</td>
                                <td class="right">${formatCurrency((item.retail_price || item.unit_price) * item.quantity)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="line"></div>
                <div class="flex"><span>Subtotal:</span><span>${formatCurrency(data.subtotal)}</span></div>
                <div class="flex"><span>VAT (7.5%):</span><span>${formatCurrency(vatAmount)}</span></div>
                ${data.discount > 0 ? `<div class="flex"><span>Points Discount:</span><span>-${formatCurrency(data.discount)}</span></div>` : ''}
                <div class="line"></div>
                <div class="flex bold" style="font-size: 14px;"><span>GRAND TOTAL:</span><span>${formatCurrency(grandTotal)}</span></div>
                
                <!-- DYNAMIC PAYMENT BREAKDOWN FOR PRINTING -->
                ${renderSplitDetailsHtml(true)}

                <div class="line"></div>
                
                <div class="center" style="margin-top: 10px;">
                    <div>Thank you for your patronage!</div>
                    <div>Please come again</div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        window.close();
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{
                background: '#fff', padding: '20px', borderRadius: '8px', width: '325px',
                maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                fontFamily: "'Courier New', Courier, monospace", fontSize: '12px'
            }}>
                <h3 style={{ textAlign: 'center', margin: '0 0 10px 0', fontFamily: 'Arial', color: '#333' }}>Receipt Review</h3>
                
                <div style={{ border: '1px dashed #777', padding: '12px', background: '#fff', marginBottom: '15px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '15px' }}>STORE NAME</div>
                        <div>123 Business Street, City</div>
                        <div>Tel: 08000000000</div>
                    </div>
                    <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
                    <div>Receipt No: {receiptNo}</div>
                    <div>Date: {receiptData.date || receiptData.created_at}</div>
                    <div>Cashier: ID {cashierId}</div>
                    <div>Customer: {customerName}</div>
                    <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
                    
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', borderBottom: '1px solid #000' }}>Item</th>
                                <th style={{ textAlign: 'center', borderBottom: '1px solid #000' }}>Qty</th>
                                <th style={{ textAlign: 'right', borderBottom: '1px solid #000' }}>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx}>
                                    <td style={{ textAlign: 'left', padding: '2px 0', verticalAlign: 'top' }}>{item.name || item.product_name}</td>
                                    <td style={{ textAlign: 'center', padding: '2px 0', verticalAlign: 'top' }}>{item.quantity}</td>
                                    <td style={{ textAlign: 'right', padding: '2px 0', verticalAlign: 'top' }}>{formatCurrency((item.retail_price || item.unit_price) * item.quantity)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span><span>{formatCurrency(receiptData.subtotal)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>VAT (7.5%):</span><span>{formatCurrency(vatAmount)}</span></div>
                    {receiptData.discount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Points Discount:</span><span>-{formatCurrency(receiptData.discount)}</span></div>
                    )}
                    <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px' }}><span>GRAND TOTAL:</span><span>{formatCurrency(grandTotal)}</span></div>
                    
                    {/* DYNAMIC PAYMENT BREAKDOWN FOR MODAL VIEW */}
                    <div dangerouslySetInnerHTML={{ __html: renderSplitDetailsHtml(false) }} />

                    <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
                    
                    <div style={{ textAlign: 'center', marginTop: '10px' }}>
                        <div>Thank you for your patronage!</div>
                        <div>Please come again</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={() => triggerThermalPrint(receiptData)}
                        style={{ flex: 1, padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Arial' }}
                    >
                        Print Receipt
                    </button>
                    <button 
                        onClick={onClose}
                        style={{ flex: 1, padding: '10px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Arial' }}
                    >
                        Close / New Sale
                    </button>
                </div>
            </div>
        </div>
    );
}