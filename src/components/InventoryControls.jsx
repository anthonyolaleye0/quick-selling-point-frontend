// frontend/src/components/InventoryControls.jsx
import React, { useState } from 'react';

export default function InventoryControls({ 
    categories, 
    products, 
    onAddProduct, 
    onRestock, 
    onAddCategory, 
    onUpdateCategory 
}) {
    // Add Product Local State
    const [form, setForm] = useState({
        name: '', category: '', cost_price: '', retail_price: '', stock_count: '', sku: '', is_vatable: false
    });

    // Restock Local State (Now includes cost_price)
    const [restockData, setRestockData] = useState({ id: '', add_quantity: '', cost_price: '' });
    const [restockSearch, setRestockSearch] = useState('');

    // Categories Local State
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');

    const handleProductSubmit = (e) => {
        e.preventDefault();
        onAddProduct(form, () => {
            setForm({ name: '', category: '', cost_price: '', retail_price: '', stock_count: '', sku: '', is_vatable: false });
        });
    };

    const handleRestockSubmit = (e) => {
        e.preventDefault();
        onRestock(restockData, () => {
            setRestockData({ id: '', add_quantity: '', cost_price: '' });
            setRestockSearch('');
        });
    };

    const handleCategorySubmit = (e) => {
        e.preventDefault();
        onAddCategory(newCategoryName, () => {
            setNewCategoryName('');
        });
    };

    return (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
            {/* Add New Item Form */}
            <form onSubmit={handleProductSubmit} style={{ background: '#f4f4f4', padding: '15px', borderRadius: '6px', flex: 1, minWidth: '280px', boxSizing: 'border-box' }}>
                <h4 style={{ marginTop: 0 }}>Add New Item</h4>
                <input type="text" placeholder="Product Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={{display:'block', width:'100%', marginBottom:'8px', padding:'6px', boxSizing:'border-box'}} />
                
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} required style={{display:'block', width:'100%', marginBottom:'8px', padding:'8px', boxSizing:'border-box'}}>
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                </select>

                <input type="number" step="0.01" placeholder="Cost Price (₦)" value={form.cost_price} onChange={e => setForm({...form, cost_price: e.target.value})} required style={{display:'block', width:'100%', marginBottom:'8px', padding:'6px', boxSizing:'border-box'}} />
                <input type="number" step="0.01" placeholder="Retail Price (₦)" value={form.retail_price} onChange={e => setForm({...form, retail_price: e.target.value})} required style={{display:'block', width:'100%', marginBottom:'8px', padding:'6px', boxSizing:'border-box'}} />
                <input type="number" placeholder="Initial Stock Count" value={form.stock_count} onChange={e => setForm({...form, stock_count: e.target.value})} required style={{display:'block', width:'100%', marginBottom:'8px', padding:'6px', boxSizing:'border-box'}} />
                <input type="text" placeholder="Custom Barcode/SKU (Optional)" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} style={{display:'block', width:'100%', marginBottom:'8px', padding:'6px', boxSizing:'border-box'}} />
                <label style={{display:'block', marginBottom:'10px', fontSize: '14px'}}>
                    <input type="checkbox" checked={form.is_vatable} onChange={e => setForm({...form, is_vatable: e.target.checked})} /> Subject to VAT (7.5%)
                </label>
                <button type="submit" style={{background: 'green', color: 'white', padding: '8px 12px', border: 'none', borderRadius:'4px', cursor:'pointer', fontWeight: 'bold'}}>Save Product</button>
            </form>

            {/* Restock Inventory Form */}
            <form onSubmit={handleRestockSubmit} style={{ background: '#f4f4f4', padding: '15px', borderRadius: '6px', flex: 1, minWidth: '280px', boxSizing: 'border-box' }}>
                <h4 style={{ marginTop: 0 }}>Restock Inventory</h4>
                <label style={{display:'block', fontSize:'12px', marginBottom:'4px', color:'#555'}}>Type product name/SKU or select:</label>
                <input 
                    type="text" 
                    list="restock-product-list" 
                    placeholder="Type or select product..." 
                    value={restockSearch}
                    onChange={e => {
                        const val = e.target.value;
                        setRestockSearch(val);
                        const matched = products.find(p => 
                            p.name.toLowerCase() === val.toLowerCase() || 
                            (p.sku && p.sku.toLowerCase() === val.toLowerCase()) ||
                            `${p.name} (SKU: ${p.sku || 'N/A'} - Stock: ${p.stock_count})` === val
                        );
                        setRestockData(prev => ({...prev, id: matched ? matched.id : ''}));
                    }}
                    required 
                    style={{display:'block', width:'100%', marginBottom:'8px', padding:'8px', boxSizing:'border-box'}}
                />
                <datalist id="restock-product-list">
                    {products.map(p => (
                        <option key={p.id} value={`${p.name} (SKU: ${p.sku || 'N/A'} - Stock: ${p.stock_count})`} />
                    ))}
                </datalist>

                <input type="number" placeholder="Quantity to Add" value={restockData.add_quantity} onChange={e => setRestockData(prev => ({...prev, add_quantity: e.target.value}))} required style={{display:'block', width:'100%', marginBottom:'8px', padding:'6px', boxSizing:'border-box'}} />
                
                {/* Cost Price input for the new batch */}
                <input type="number" step="0.01" placeholder="New Cost Price (₦)" value={restockData.cost_price} onChange={e => setRestockData(prev => ({...prev, cost_price: e.target.value}))} required style={{display:'block', width:'100%', marginBottom:'12px', padding:'6px', boxSizing:'border-box'}} />

                <button type="submit" style={{background: '#ffc107', color: 'black', padding: '8px 12px', border: 'none', borderRadius:'4px', fontWeight:'bold', cursor:'pointer'}}>Update Stock Level</button>
            </form>

            {/* Manage Categories Section */}
            <div style={{ background: '#f4f4f4', padding: '15px', borderRadius: '6px', flex: 1, minWidth: '280px', boxSizing: 'border-box' }}>
                <h4 style={{ marginTop: 0 }}>Manage Categories</h4>
                <form onSubmit={handleCategorySubmit} style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                    <input type="text" placeholder="New Category Name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} style={{ flex: 1, padding: '6px' }} />
                    <button type="submit" style={{ background: '#007bff', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor:'pointer', fontWeight: 'bold' }}>Add</button>
                </form>

                <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'white', padding: '8px', border: '1px solid #ddd' }}>
                    {categories.length === 0 && <small style={{ color: '#777' }}>No categories created yet.</small>}
                    {categories.map(cat => (
                        <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                            {editingCategoryId === cat.id ? (
                                <>
                                    <input type="text" value={editingCategoryName} onChange={e => setEditingCategoryName(e.target.value)} style={{ padding: '2px', width: '100px' }} />
                                    <button onClick={() => {
                                        onUpdateCategory(cat.id, editingCategoryName, () => {
                                            setEditingCategoryId(null);
                                            setEditingCategoryName('');
                                        });
                                    }} style={{ background: 'green', color: 'white', border: 'none', fontSize: '11px', padding: '3px 6px', cursor:'pointer' }}>Save</button>
                                </>
                            ) : (
                                <>
                                    <span>{cat.name}</span>
                                    <button onClick={() => { setEditingCategoryId(cat.id); setEditingCategoryName(cat.name); }} style={{ background: '#6c757d', color: 'white', border: 'none', fontSize: '11px', padding: '3px 6px', cursor: 'pointer' }}>Edit</button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}