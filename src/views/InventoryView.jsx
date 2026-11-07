// frontend/src/views/InventoryView.jsx
import React, { useState, useEffect } from 'react';
import { inventoryService } from '../services/inventoryService';
import InventoryControls from '../components/InventoryControls';

export default function InventoryView() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    const formatNaira = (amount) => {
        return `₦${Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const fetchData = async () => {
        try {
            const [prodRes, catRes] = await Promise.all([
                inventoryService.getProducts(),
                inventoryService.getCategories()
            ]);
            setProducts(Array.isArray(prodRes) ? prodRes : prodRes.products || []);
            setCategories(Array.isArray(catRes) ? catRes : catRes.categories || []);
        } catch (err) {
            console.error('Error fetching inventory data:', err);
            setProducts([]);
            setCategories([]);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddProduct = async (form, onSuccess) => {
        if (!form.category) return alert('Please select a category.');
        try {
            await inventoryService.addProduct(form);
            alert('Product added successfully!');
            onSuccess();
            fetchData();
        } catch (err) {
            console.error('Error adding product:', err);
            alert('Error adding product.');
        }
    };

    const handleRestock = async (restockData, onSuccess) => {
        if (!restockData.id) {
            alert('Please select or type a valid product from the list.');
            return;
        }
        if (restockData.cost_price === undefined || restockData.cost_price === '' || Number(restockData.cost_price) < 0) {
            alert('Please enter a valid cost price for this restock batch.');
            return;
        }
        try {
            await inventoryService.restockItem(restockData);
            alert('Stock and cost history updated successfully!');
            onSuccess();
            fetchData();
        } catch (err) {
            console.error('Error restocking:', err);
            alert('Error updating stock level and purchase history.');
        }
    };

    // Handler to modify the current retail price of a product
    const handleUpdateRetailPrice = async (product) => {
        const newPrice = prompt(`Enter new retail price for "${product.name}" (Current: ${formatNaira(product.retail_price)}):`, product.retail_price);
        if (newPrice !== null && newPrice.trim() !== '') {
            const parsedPrice = Number(newPrice);
            if (isNaN(parsedPrice) || parsedPrice < 0) {
                alert('Please enter a valid retail price.');
                return;
            }
            try {
                await inventoryService.updateRetailPrice(product.id, parsedPrice);
                alert('Retail price updated successfully!');
                fetchData();
            } catch (err) {
                console.error('Error updating retail price:', err);
                alert('Failed to update retail price.');
            }
        }
    };

    const handleAddCategory = async (categoryName, onSuccess) => {
        if (!categoryName.trim()) return;
        try {
            await inventoryService.addCategory({ name: categoryName });
            onSuccess();
            fetchData();
            alert('Category added successfully!');
        } catch (err) {
            alert('Error adding category (Name might already exist).');
        }
    };

    const handleUpdateCategory = async (id, updatedName, onSuccess) => {
        if (!updatedName.trim()) return;
        try {
            await inventoryService.updateCategory(id, { name: updatedName });
            onSuccess();
            fetchData();
            alert('Category updated successfully!');
        } catch (err) {
            alert('Error updating category.');
        }
    };

    const exportToCSV = () => {
        const headers = "ID,SKU,Name,Category,Cost Price,Retail Price,Stock Count,VATable\n";
        const rows = products.map(p => `${p.id},${p.sku},"${p.name}",${p.category},${p.cost_price},${p.retail_price},${p.stock_count},${p.is_vatable}`).join("\n");
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', 'inventory_export.csv');
        a.click();
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h2>Inventory Management</h2>
            
            <button onClick={exportToCSV} style={{ padding: '8px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>
                Export Inventory CSV
            </button>

            {/* Modularized Forms / Controls Component */}
            <InventoryControls 
                categories={categories}
                products={products}
                onAddProduct={handleAddProduct}
                onRestock={handleRestock}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
            />

            {/* Live Inventory Stock Table */}
            <h3>Live Inventory Stock Overview</h3>
            <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                <thead>
                    <tr style={{ background: '#ddd' }}>
                        <th>SKU</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Retail Price</th>
                        <th>Stock Count</th>
                        <th>VATable</th>
                        <th>Status Alert</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.length === 0 ? (
                        <tr>
                            <td colSpan="8" style={{ textAlign: 'center', color: '#777' }}>No inventory items found.</td>
                        </tr>
                    ) : (
                        products.map(p => (
                            <tr key={p.id}>
                                <td>{p.sku || 'N/A'}</td>
                                <td>{p.name}</td>
                                <td>{p.category}</td>
                                <td>{formatNaira(p.retail_price)}</td>
                                <td>{p.stock_count}</td>
                                <td>{p.is_vatable ? 'Yes' : 'No'}</td>
                                <td>
                                    {p.stock_count <= 5 ? (
                                        <span style={{ color: 'red', fontWeight: 'bold' }}>⚠️ Low Stock ({p.stock_count})</span>
                                    ) : (
                                        <span style={{ color: 'green', fontWeight: 'bold' }}>Optimal</span>
                                    )}
                                </td>
                                <td>
                                    <button 
                                        onClick={() => handleUpdateRetailPrice(p)}
                                        style={{ padding: '5px 10px', background: '#ffc107', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold', color: '#333' }}
                                    >
                                        Edit Price
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}