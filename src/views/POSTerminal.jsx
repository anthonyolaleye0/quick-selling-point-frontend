// frontend/src/views/POSTerminal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { posService } from '../services/posService';
import { saveSaleOffline, registerSyncListener } from '../services/syncService';
import ReceiptModal from "../components/ReceiptModal";

export default function POSTerminal() {
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    
    // Split Payment States
    const [splitDetails, setSplitDetails] = useState([
        { method: 'Cash', amount: '' },
        { method: 'Transfer', amount: '' }
    ]);
    
    // Persistent Online/Offline Connectivity State
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Flash Synchronization Success Message State (Triggered upon background sync)
    const [syncMessage, setSyncMessage] = useState(null);

    // Searchable Customer Dropdown States
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
    const customerDropdownRef = useRef(null);

    // Parked / Suspended Sales States
    const [parkedSales, setParkedSales] = useState([]);
    const [isParkedModalOpen, setIsParkedModalOpen] = useState(false);

    // Receipt review modal state
    const [receiptPreviewData, setReceiptPreviewData] = useState(null);
    
    // Loyalty redemption states
    const [pointsToRedeem, setPointsToRedeem] = useState('');
    const [redeemedDiscount, setRedeemedDiscount] = useState(0);
    const POINT_CONVERSION_RATE = 10; // 1 Point = ₦10

    // Monitor network status changes dynamically and listen for background sync events
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Register a listener for when background sync successfully pushes offline sales
        const unsubscribeSync = registerSyncListener((syncedCount) => {
            if (syncedCount > 0) {
                setSyncMessage(`⚡ Successfully synchronized ${syncedCount} offline sale(s) with the server!`);
                setTimeout(() => {
                    setSyncMessage(null);
                }, 5000);
                // Refresh inventory data to reflect updated stock levels post-sync
                fetchData();
            }
        });

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (unsubscribeSync) unsubscribeSync();
        };
    }, []);

    const formatNaira = (amount) => {
        return `₦${Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const fetchData = async () => {
        try {
            const [prodData, custData] = await Promise.all([
                posService.getProducts(),
                posService.getCustomers()
            ]);
            const prods = Array.isArray(prodData) ? prodData : prodData.products || [];
            const custs = Array.isArray(custData) ? custData : custData.customers || [];
            
            setProducts(prods);
            setCustomers(custs);

            localStorage.setItem('pos_cached_products', JSON.stringify(prods));
            localStorage.setItem('pos_cached_customers', JSON.stringify(custs));
        } catch (err) {
            console.warn('Network request failed. Loading POS data from local offline cache...', err);
            
            const cachedProducts = localStorage.getItem('pos_cached_products');
            const cachedCustomers = localStorage.getItem('pos_cached_customers');
            
            setProducts(cachedProducts ? JSON.parse(cachedProducts) : []);
            setCustomers(cachedCustomers ? JSON.parse(cachedCustomers) : []);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const savedParked = localStorage.getItem('pos_parked_sales');
        if (savedParked) {
            try {
                setParkedSales(JSON.parse(savedParked));
            } catch (e) {
                console.error('Failed to parse parked sales', e);
            }
        }
    }, []);

    const saveParkedSalesToStorage = (updatedList) => {
        setParkedSales(updatedList);
        localStorage.setItem('pos_parked_sales', JSON.stringify(updatedList));
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setIsCustomerDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setPointsToRedeem('');
        setRedeemedDiscount(0);
        if (!selectedCustomerId) {
            setCustomerSearchQuery('');
        } else {
            const matchedCust = customers.find(c => String(c.id) === String(selectedCustomerId));
            if (matchedCust) {
                setCustomerSearchQuery(`${matchedCust.name} ${matchedCust.phone ? `(${matchedCust.phone})` : ''} - ID: ${matchedCust.id}`);
            }
        }
    }, [selectedCustomerId, customers]);

    const filteredProducts = products.filter(p => 
        (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredCustomers = customers.filter(c => 
        (c.name && c.name.toLowerCase().includes(customerSearchQuery.toLowerCase())) ||
        (c.phone && c.phone.includes(customerSearchQuery)) ||
        (String(c.id).includes(customerSearchQuery))
    );

    const addToCart = (product) => {
        setCart(prevCart => {
            const existing = prevCart.find(item => item.id === product.id);
            if (existing) {
                if (existing.quantity + 1 > product.stock_count) {
                    alert('Stock limit reached for this item!');
                    return prevCart;
                }
                return prevCart.map(item => item.id === product.id ? {...item, quantity: item.quantity + 1} : item);
            }
            return [...prevCart, {...product, quantity: 1}];
        });
    };

    const updateQuantity = (id, delta) => {
        setCart(prevCart => {
            return prevCart.map(item => {
                if (item.id === id) {
                    const newQty = item.quantity + delta;
                    if (newQty <= 0) return null;
                    if (newQty > item.stock_count) {
                        alert('Cannot exceed available stock count');
                        return item;
                    }
                    return {...item, quantity: newQty};
                }
                return item;
            }).filter(Boolean);
        });
    };

    const removeFromCart = (id) => {
        setCart(prevCart => prevCart.filter(item => item.id !== id));
    };

    const selectedCustomer = customers.find(c => String(c.id) === String(selectedCustomerId));
    const customerPoints = selectedCustomer?.loyalty_points ?? 0;
    const customerPointsValue = customerPoints * POINT_CONVERSION_RATE;

    const handleApplyPointsRedemption = () => {
        const pts = Number(pointsToRedeem);
        if (!selectedCustomerId) {
            alert('Please select a customer to redeem loyalty points.');
            return;
        }
        if (isNaN(pts) || pts <= 0) {
            alert('Please enter a valid number of points.');
            return;
        }
        if (pts > customerPoints) {
            alert(`Customer only has ${customerPoints} pts available.`);
            return;
        }
        const discountValue = pts * POINT_CONVERSION_RATE;
        setRedeemedDiscount(discountValue);
        alert(`Successfully applied ${pts} pts (₦${discountValue.toLocaleString()} discount)!`);
    };

    const subtotal = cart.reduce((acc, item) => acc + (Number(item.retail_price || 0) * item.quantity), 0);
    const vatAmount = cart.reduce((acc, item) => item.is_vatable ? acc + (Number(item.retail_price || 0) * item.quantity * 0.075) : acc, 0);
    const grandTotal = Math.max(0, subtotal + vatAmount - redeemedDiscount);

    const totalSplitAllocated = splitDetails.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const splitRemainingBalance = grandTotal - totalSplitAllocated;

    const handleAddSplitLeg = () => {
        setSplitDetails([...splitDetails, { method: 'Card', amount: '' }]);
    };

    const handleRemoveSplitLeg = (index) => {
        if (splitDetails.length <= 1) {
            alert('A split payment configuration requires at least one row.');
            return;
        }
        const updated = splitDetails.filter((_, i) => i !== index);
        setSplitDetails(updated);
    };

    const handleSplitLegChange = (index, field, value) => {
        const updated = [...splitDetails];
        updated[index][field] = value;
        setSplitDetails(updated);
    };

    const handleParkSale = () => {
        if (cart.length === 0) {
            alert('Cannot park an empty cart!');
            return;
        }

        const parkReference = 'HOLD-' + Math.floor(1000 + Math.random() * 9000);
        const customerObj = customers.find(c => String(c.id) === String(selectedCustomerId));

        const parkedItem = {
            id: Date.now(),
            reference: parkReference,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            cart: [...cart],
            selectedCustomerId: selectedCustomerId || '',
            customerName: customerObj ? customerObj.name : 'Walk-In Customer',
            redeemedDiscount,
            pointsToRedeem
        };

        const updatedParked = [parkedItem, ...parkedSales];
        saveParkedSalesToStorage(updatedParked);

        setCart([]);
        setSelectedCustomerId('');
        setCustomerSearchQuery('');
        setPointsToRedeem('');
        setRedeemedDiscount(0);
        
        alert(`Sale successfully parked as [${parkReference}]`);
    };

    const handleResumeSale = (parkedItem) => {
        if (cart.length > 0) {
            const confirmReplace = window.confirm('Your current active cart has items. Do you want to replace them before resuming this sale?');
            if (!confirmReplace) return;
        }

        setCart(parkedItem.cart);
        setSelectedCustomerId(parkedItem.selectedCustomerId || '');
        setRedeemedDiscount(parkedItem.redeemedDiscount || 0);
        setPointsToRedeem(parkedItem.pointsToRedeem || '');

        const updatedParked = parkedSales.filter(p => p.id !== parkedItem.id);
        saveParkedSalesToStorage(updatedParked);
        setIsParkedModalOpen(false);
    };

    const handleDeleteParkedSale = (id, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to discard this parked sale?')) {
            const updatedParked = parkedSales.filter(p => p.id !== id);
            saveParkedSalesToStorage(updatedParked);
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return alert('Cart is empty!');
        
        if (paymentMethod === 'Split') {
            if (Math.abs(totalSplitAllocated - grandTotal) > 0.01) {
                alert(`Split payment total (${formatNaira(totalSplitAllocated)}) does not match Grand Total (${formatNaira(grandTotal)}). Remaining balance must be zero.`);
                return;
            }
        }

        const generatedReceiptNo = 'REC-' + Math.floor(100000 + Math.random() * 900000);

        const currentReceiptData = {
            receiptNo: generatedReceiptNo,
            date: new Date().toLocaleString(),
            cashierId: 1,
            customerName: selectedCustomer ? selectedCustomer.name : 'Walk-In Customer',
            items: [...cart],
            subtotal,
            vatAmount,
            discount: redeemedDiscount,
            grandTotal,
            paymentMethod,
            splitDetails: paymentMethod === 'Split' ? splitDetails : []
        };

        const salePayload = {
            receipt_no: generatedReceiptNo,
            cashier_id: 1,
            customer_id: selectedCustomerId ? Number(selectedCustomerId) : null,
            items: cart,
            subtotal,
            vat_amount: vatAmount,
            discount: redeemedDiscount,
            points_redeemed: Number(pointsToRedeem) || 0,
            grand_total: grandTotal,
            payment_method: paymentMethod,
            split_details: paymentMethod === 'Split' ? splitDetails : []
        };

        try {
            if (!isOnline) {
                await saveSaleOffline(salePayload);
                
                const updatedProducts = products.map(p => {
                    const cartItem = cart.find(ci => ci.id === p.id);
                    if (cartItem) {
                        return { ...p, stock_count: Math.max(0, p.stock_count - cartItem.quantity) };
                    }
                    return p;
                });
                setProducts(updatedProducts);
                localStorage.setItem('pos_cached_products', JSON.stringify(updatedProducts));

                alert('⚠️ You are offline. Sale saved locally and stock updated!');
            } else {
                try {
                    await posService.completeCheckout(salePayload);
                } catch (netErr) {
                    if (!navigator.onLine || netErr.message === 'Network Error') {
                        console.warn('Server unreachable during checkout, falling back to offline storage...', netErr);
                        await saveSaleOffline(salePayload);
                        
                        const updatedProducts = products.map(p => {
                            const cartItem = cart.find(ci => ci.id === p.id);
                            if (cartItem) {
                                return { ...p, stock_count: Math.max(0, p.stock_count - cartItem.quantity) };
                            }
                            return p;
                        });
                        setProducts(updatedProducts);
                        localStorage.setItem('pos_cached_products', JSON.stringify(updatedProducts));

                        alert('⚠️ Network interruption detected. Sale safely saved offline!');
                    } else {
                        throw netErr;
                    }
                }
            }

            setReceiptPreviewData(currentReceiptData);

            setCart([]);
            setSelectedCustomerId('');
            setCustomerSearchQuery('');
            setPointsToRedeem('');
            setRedeemedDiscount(0);
            setSplitDetails([
                { method: 'Cash', amount: '' },
                { method: 'Transfer', amount: '' }
            ]);
            if (isOnline) fetchData();
        } catch (err) {
            console.error('Checkout failed:', err);
            alert(err.response?.data?.error || err.message || 'Checkout process failed.');
        }
    };

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: '20px', 
            padding: '20px', 
            minHeight: '85vh', 
            backgroundColor: '#f4f6f9', 
            fontFamily: 'Inter, system-ui, sans-serif', 
            position: 'relative',
            boxSizing: 'border-box'
        }}>
            {/* Left Section: Product Search & Item List */}
            <div style={{ flex: '1 1 550px', display: 'flex', flexDirection: 'column', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ marginBottom: '15px' }}>
                    {/* Flash Sync Message Banner (Triggered upon successful background sync of offline sales) */}
                    {syncMessage && (
                        <div style={{
                            marginBottom: '10px',
                            padding: '10px 14px',
                            borderRadius: '6px',
                            backgroundColor: '#d8f5a2',
                            border: '1px solid #b5e853',
                            color: '#2b8a3e',
                            fontSize: '13px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 2px 6px rgba(43, 138, 62, 0.15)'
                        }}>
                            <span>{syncMessage}</span>
                        </div>
                    )}

                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '12px', 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        backgroundColor: isOnline ? '#ebfbee' : '#fff3bf', 
                        border: `1px solid ${isOnline ? '#b2f2bb' : '#ffe066'}`,
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: isOnline ? '#2b8a3e' : '#f08c00'
                    }}>
                        <span>{isOnline ? '🟢 System Online: Connected to Server' : '⚠️ Offline Mode: Sales are saving locally'}</span>
                        <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#495057' }}>
                            {isOnline ? 'Sync Active' : 'Queuing Enabled'}
                        </span>
                    </div>

                    <h2 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#333' }}>Product Inventory</h2>
                    <input 
                        type="text" 
                        placeholder="Scan barcode or type SKU / product name..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ padding: '10px 14px', fontSize: '14px', width: '100%', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #ced4da', outline: 'none' }}
                    />
                </div>

                <div style={{ overflowY: 'auto', flex: 1, border: '1px solid #e9ecef', borderRadius: '6px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                        <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1, borderBottom: '1px solid #dee2e6' }}>
                            <tr>
                                <th style={{ padding: '12px 15px', color: '#495057', fontWeight: 600 }}>Item Details</th>
                                <th style={{ padding: '12px 15px', color: '#495057', fontWeight: 600 }}>SKU</th>
                                <th style={{ padding: '12px 15px', color: '#495057', fontWeight: 600 }}>Stock</th>
                                <th style={{ padding: '12px 15px', color: '#495057', fontWeight: 600 }}>Price</th>
                                <th style={{ padding: '12px 15px', textAlign: 'center', color: '#495057', fontWeight: 600 }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#777' }}>
                                        No products available or matching search criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map(product => (
                                    <tr 
                                        key={product.id} 
                                        onClick={() => addToCart(product)}
                                        style={{ borderBottom: '1px solid #f1f3f5', cursor: 'pointer', transition: 'background 0.15s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                                    >
                                        <td style={{ padding: '12px 15px' }}>
                                            <div style={{ fontWeight: '600', color: '#212529' }}>{product.name}</div>
                                            {product.is_vatable && <span style={{ fontSize: '11px', background: '#e7f5ff', color: '#1c7ed6', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>VATable</span>}
                                        </td>
                                        <td style={{ padding: '12px 15px', color: '#6c757d', fontSize: '13px' }}>{product.sku || 'N/A'}</td>
                                        <td style={{ padding: '12px 15px' }}>
                                            <span style={{ color: product.stock_count > 5 ? '#2b8a3e' : '#e03131', fontWeight: 500 }}>
                                                {product.stock_count} left
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#212529' }}>{formatNaira(product.retail_price)}</td>
                                        <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                                                style={{ background: '#228be6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
                                            >
                                                Add
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Right Section: Active Cart & Totals */}
            <div style={{ flex: '1 1 350px', background: '#ffffff', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', border: '1px solid #eef2f7', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>Active Cart</h3>
                    <button 
                        onClick={() => setIsParkedModalOpen(true)}
                        style={{ background: parkedSales.length > 0 ? '#e67700' : '#e9ecef', color: parkedSales.length > 0 ? '#fff' : '#adb5bd', border: 'none', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Parked Sales ({parkedSales.length})
                    </button>
                </div>

                <div style={{ marginBottom: '15px', position: 'relative' }} ref={customerDropdownRef}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#495057' }}>Customer Assignment:</label>
                    <input 
                        type="text"
                        placeholder="Type to search name, phone, or ID..."
                        value={customerSearchQuery}
                        onFocus={() => setIsCustomerDropdownOpen(true)}
                        onChange={(e) => {
                            setCustomerSearchQuery(e.target.value);
                            setIsCustomerDropdownOpen(true);
                            if (!e.target.value) {
                                setSelectedCustomerId('');
                            }
                        }}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontSize: '13px', outline: 'none' }}
                    />

                    {isCustomerDropdownOpen && (
                        <div style={{
                            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                            maxHeight: '180px', overflowY: 'auto', background: '#fff',
                            border: '1px solid #ced4da', borderRadius: '6px', zIndex: 100,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}>
                            <div 
                                onClick={() => {
                                    setSelectedCustomerId('');
                                    setCustomerSearchQuery('');
                                    setIsCustomerDropdownOpen(false);
                                }}
                                style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #eee', background: '#f8f9fa', fontSize: '12px', color: '#6c757d' }}
                            >
                                Walk-In Customer (No Loyalty Earned)
                            </div>
                            {filteredCustomers.length === 0 ? (
                                <div style={{ padding: '10px 12px', fontSize: '12px', color: '#777' }}>No customers found</div>
                            ) : (
                                filteredCustomers.map(c => (
                                    <div 
                                        key={c.id}
                                        onClick={() => {
                                            setSelectedCustomerId(c.id);
                                            setCustomerSearchQuery(`${c.name} ${c.phone ? `(${c.phone})` : ''} - ID: ${c.id}`);
                                            setIsCustomerDropdownOpen(false);
                                        }}
                                        style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f3f5', fontSize: '12px' }}
                                        onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                                        onMouseLeave={(e) => e.target.style.background = '#fff'}
                                    >
                                        {c.name} {c.phone ? `(${c.phone})` : ''} - ID: {c.id}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {selectedCustomer && (
                        <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '6px', fontSize: '12px', marginTop: '8px', border: '1px solid #e9ecef' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ color: '#495057' }}>Available Points:</span>
                                <strong style={{ color: '#228be6' }}>{customerPoints} pts</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#495057' }}>Monetary Value:</span>
                                <strong style={{ color: '#2b8a3e' }}>₦{customerPointsValue.toLocaleString()}</strong>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <input 
                                    type="number" 
                                    placeholder="Pts to redeem" 
                                    value={pointsToRedeem}
                                    onChange={(e) => setPointsToRedeem(e.target.value)}
                                    style={{ flex: 1, padding: '6px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #ced4da' }}
                                />
                                <button 
                                    onClick={handleApplyPointsRedemption}
                                    style={{ background: '#15aabf', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}
                                >
                                    Redeem
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px', maxHeight: '180px', paddingRight: '4px' }}>
                    {cart.length === 0 && <p style={{ color: '#adb5bd', textAlign: 'center', marginTop: '30px', fontSize: '14px' }}>Cart is currently empty.</p>}
                    {cart.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #f1f3f5', paddingBottom: '8px' }}>
                            <div>
                                <div style={{ fontWeight: '600', fontSize: '13px', color: '#212529' }}>{item.name}</div>
                                <small style={{ color: '#6c757d' }}>{formatNaira(item.retail_price)} x {item.quantity}</small>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <button onClick={() => updateQuantity(item.id, -1)} style={{ padding: '2px 8px', background: '#f1f3f5', border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                                <span style={{ margin: '0 6px', fontSize: '13px', fontWeight: 600 }}>{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} style={{ padding: '2px 8px', background: '#f1f3f5', border: '1px solid #ced4da', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                                <button 
                                    onClick={() => removeFromCart(item.id)} 
                                    title="Remove item"
                                    style={{ marginLeft: '4px', padding: '2px 6px', background: '#fff0f3', color: '#e03131', border: '1px solid #ffc9c9', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ borderTop: '2px solid #e9ecef', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#495057' }}>
                        <span>Subtotal:</span>
                        <span>{formatNaira(subtotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#495057' }}>
                        <span>VAT (7.5%):</span>
                        <span>{formatNaira(vatAmount)}</span>
                    </div>
                    {redeemedDiscount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#2b8a3e', fontWeight: 'bold' }}>
                            <span>Points Discount:</span>
                            <span>-{formatNaira(redeemedDiscount)}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '16px', fontWeight: 'bold', color: '#212529' }}>
                        <span>Grand Total:</span>
                        <span>{formatNaira(grandTotal)}</span>
                    </div>

                    <select 
                        value={paymentMethod} 
                        onChange={(e) => setPaymentMethod(e.target.value)} 
                        style={{ width: '100%', padding: '9px 12px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '13px', backgroundColor: '#fff', fontWeight: '600' }}
                    >
                        <option value="Cash">Cash</option>
                        <option value="Transfer">Transfer</option>
                        <option value="Card">Card</option>
                        <option value="Split">Split Payment (Multi-Tender)</option>
                    </select>

                    {paymentMethod === 'Split' && (
                        <div style={{ background: '#f8f9fa', border: '1px solid #ced4da', borderRadius: '6px', padding: '10px', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#495057' }}>Split Payment Breakdown</span>
                                <button 
                                    onClick={handleAddSplitLeg}
                                    style={{ background: '#228be6', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    + Add Leg
                                </button>
                            </div>

                            {splitDetails.map((splitLeg, index) => (
                                <div key={index} style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                                    <select 
                                        value={splitLeg.method}
                                        onChange={(e) => handleSplitLegChange(index, 'method', e.target.value)}
                                        style={{ flex: 1, padding: '6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #ced4da', background: '#fff' }}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Transfer">Transfer</option>
                                        <option value="Card">Card</option>
                                    </select>
                                    <input 
                                        type="number"
                                        placeholder="Amount"
                                        value={splitLeg.amount}
                                        onChange={(e) => handleSplitLegChange(index, 'amount', e.target.value)}
                                        style={{ flex: 1.2, padding: '6px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #ced4da', background: '#fff' }}
                                    />
                                    <button 
                                        onClick={() => handleRemoveSplitLeg(index)}
                                        style={{ background: '#fff0f3', color: '#e03131', border: '1px solid #ffc9c9', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                                        title="Remove split leg"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}

                            <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #dee2e6', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span style={{ color: '#495057' }}>Remaining Balance:</span>
                                <strong style={{ color: Math.abs(splitRemainingBalance) < 0.01 ? '#2b8a3e' : '#e03131' }}>
                                    {formatNaira(splitRemainingBalance)}
                                </strong>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={handleParkSale} 
                            style={{ flex: 1, padding: '12px', background: '#f59f00', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
                            title="Suspend current cart"
                        >
                            Park Sale
                        </button>
                        <button 
                            onClick={handleCheckout} 
                            style={{ flex: 2, padding: '12px', background: '#2b8a3e', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
                        >
                            Complete Checkout
                        </button>
                    </div>
                </div>
            </div>

            {isParkedModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '450px', maxWidth: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>Suspended / Parked Sales</h3>
                            <button onClick={() => setIsParkedModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#adb5bd' }}>✕</button>
                        </div>
                        
                        <div style={{ overflowY: 'auto', flex: 1, border: '1px solid #e9ecef', borderRadius: '6px', padding: '8px' }}>
                            {parkedSales.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#adb5bd', margin: '30px 0', fontSize: '13px' }}>No parked sales found.</p>
                            ) : (
                                parkedSales.map(p => (
                                    <div 
                                        key={p.id} 
                                        onClick={() => handleResumeSale(p)}
                                        style={{ padding: '12px', borderBottom: '1px solid #f1f3f5', cursor: 'pointer', background: '#fafafa', borderRadius: '6px', marginBottom: '8px', transition: 'background 0.1s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f3f5'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#fafafa'}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', color: '#212529', marginBottom: '4px' }}>
                                            <span>{p.reference} ({p.customerName})</span>
                                            <span style={{ color: '#e67700', fontSize: '12px' }}>{p.time}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6c757d' }}>
                                            <span>{p.cart.length} item(s)</span>
                                            <button 
                                                onClick={(e) => handleDeleteParkedSale(p.id, e)}
                                                style={{ background: '#fff5f5', color: '#e03131', border: '1px solid #ffc9c9', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                                            >
                                                Discard
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button 
                            onClick={() => setIsParkedModalOpen(false)} 
                            style={{ marginTop: '16px', width: '100%', padding: '10px', background: '#ced4da', color: '#495057', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {receiptPreviewData && (
                <ReceiptModal 
                    receiptData={receiptPreviewData} 
                    formatNaira={formatNaira}
                    onClose={() => setReceiptPreviewData(null)} 
                />
            )}
        </div>
    );
}