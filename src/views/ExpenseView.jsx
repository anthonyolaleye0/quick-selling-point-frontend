// frontend/src/views/ExpenseView.jsx
import React, { useState, useEffect } from 'react';
import { expenseService } from '../services/expenseService';

export default function ExpenseView() {
    const [expenses, setExpenses] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterPeriod, setFilterPeriod] = useState('all'); // 'all', 'today', 'this_month', 'custom'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Dynamic Categories State (persisted to localStorage for flexibility)
    const [categories, setCategories] = useState(() => {
        const saved = localStorage.getItem('op_ex_categories');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { /* fallback */ }
        }
        return [
            'Utilities (Power/Water)',
            'Rent & Lease',
            'Salaries & Wages',
            'Transport & Logistics',
            'Maintenance & Repairs',
            'Marketing & Advertising',
            'Miscellaneous'
        ];
    });

    const [newCategoryName, setNewCategoryName] = useState('');
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    
    const [form, setForm] = useState({
        category: categories[0] || 'Miscellaneous',
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0]
    });

    // Save categories to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('op_ex_categories', JSON.stringify(categories));
    }, [categories]);

    const formatNaira = (amount) => {
        return `₦${Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const fetchExpenses = async () => {
        try {
            const data = await expenseService.getExpenses();
            setExpenses(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching expenses:', err);
            setExpenses([]);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleAddCategory = (e) => {
        e.preventDefault();
        const trimmed = newCategoryName.trim();
        if (!trimmed) return;

        if (categories.includes(trimmed)) {
            alert('This category already exists.');
            return;
        }

        const updatedCategories = [...categories, trimmed];
        setCategories(updatedCategories);
        setNewCategoryName('');
        alert(`Category "${trimmed}" added successfully!`);
    };

    const handleDeleteCategory = (catToDelete) => {
        if (categories.length <= 1) {
            alert('You must have at least one category.');
            return;
        }

        if (window.confirm(`Are you sure you want to remove category "${catToDelete}"?`)) {
            const updated = categories.filter(c => c !== catToDelete);
            setCategories(updated);
            // If the currently selected form category was deleted, fallback to the first one
            if (form.category === catToDelete) {
                setForm(prev => ({ ...prev, category: updated[0] }));
            }
            if (filterCategory === catToDelete) {
                setFilterCategory('All');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.amount || Number(form.amount) <= 0) {
            alert('Please enter a valid expense amount.');
            return;
        }

        try {
            if (editingId) {
                await expenseService.updateExpense(editingId, form);
                alert('Expense updated successfully!');
            } else {
                await expenseService.addExpense(form);
                alert('Expense recorded successfully!');
            }
            handleResetForm();
            fetchExpenses();
        } catch (err) {
            console.error('Error saving expense:', err);
            alert('Failed to save expense.');
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setForm({
            category: categories.includes(item.category) ? item.category : categories[0],
            description: item.description || '',
            amount: item.amount,
            expense_date: item.expense_date
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleResetForm = () => {
        setEditingId(null);
        setForm({
            category: categories[0] || 'Miscellaneous',
            description: '',
            amount: '',
            expense_date: new Date().toISOString().split('T')[0]
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this expense record?')) {
            try {
                await expenseService.deleteExpense(id);
                fetchExpenses();
            } catch (err) {
                alert('Failed to delete expense.');
            }
        }
    };

    const exportToCSV = () => {
        const headers = "ID,Date,Category,Description,Amount\n";
        const rows = filteredExpenses.map(item => `${item.id},${item.expense_date},"${item.category}","${item.description || ''}",${item.amount}`).join("\n");
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', 'operating_expenses.csv');
        a.click();
    };

    // Filter logic
    const filteredExpenses = expenses.filter(item => {
        const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
        const matchesSearch = (item.description || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                              item.category.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesPeriod = true;
        const itemDate = item.expense_date; 
        const todayStr = new Date().toISOString().split('T')[0];
        const currentMonthStr = todayStr.substring(0, 7); 

        if (filterPeriod === 'today') {
            matchesPeriod = itemDate === todayStr;
        } else if (filterPeriod === 'this_month') {
            matchesPeriod = itemDate && itemDate.startsWith(currentMonthStr);
        } else if (filterPeriod === 'custom') {
            if (startDate && itemDate < startDate) matchesPeriod = false;
            if (endDate && itemDate > endDate) matchesPeriod = false;
        }

        return matchesCategory && matchesSearch && matchesPeriod;
    });

    const totalExpenses = filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ margin: 0 }}>Operating Expenses (OpEx) Management</h2>
                <button 
                    onClick={() => setShowCategoryModal(!showCategoryModal)}
                    style={{ padding: '8px 15px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    {showCategoryModal ? 'Close Category Manager' : 'Manage Categories ⚙️'}
                </button>
            </div>

            {/* Category Manager Section / Modal Drawer */}
            {showCategoryModal && (
                <div style={{ background: '#f1f3f5', padding: '20px', borderRadius: '6px', border: '1px solid #ced4da', marginBottom: '25px' }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>Manage Expense Categories</h3>
                    <p style={{ fontSize: '13px', color: '#666', marginTop: 0 }}>Add custom categories tailored to your business model or remove obsolete ones.</p>
                    
                    <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '10px', marginBottom: '15px', maxWidth: '450px' }}>
                        <input 
                            type="text"
                            placeholder="New category name (e.g., Guest Supplies, Inventory)..."
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            required
                        />
                        <button type="submit" style={{ padding: '8px 15px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Add Category
                        </button>
                    </form>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {categories.map((cat, idx) => (
                            <span key={idx} style={{ background: 'white', border: '1px solid #ddd', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {cat}
                                {categories.length > 1 && (
                                    <button 
                                        type="button" 
                                        onClick={() => handleDeleteCategory(cat)}
                                        style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', padding: 0 }}
                                        title="Delete category"
                                    >
                                        &times;
                                    </button>
                                )}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Summary & Actions Bar */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '6px', border: '1px solid #ddd', minWidth: '250px' }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#555' }}>Total Expenses (Filtered Period)</h4>
                    <h2 style={{ margin: 0, color: '#d9534f' }}>{formatNaira(totalExpenses)}</h2>
                </div>

                <button 
                    onClick={exportToCSV} 
                    style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', height: 'fit-content' }}
                >
                    Export Filtered CSV
                </button>
            </div>

            {/* Record / Edit Expense Form */}
            <form onSubmit={handleSubmit} style={{ background: 'white', padding: '20px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '30px', maxWidth: '600px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0 }}>{editingId ? 'Edit Expense Record' : 'Record New Expense'}</h3>
                    {editingId && (
                        <button type="button" onClick={handleResetForm} style={{ background: '#6c757d', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                            Cancel Edit
                        </button>
                    )}
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Category:</label>
                    <select 
                        value={form.category} 
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        {categories.map((cat, idx) => (
                            <option key={idx} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Description / Note:</label>
                    <input 
                        type="text" 
                        placeholder="e.g., Monthly Diesel Purchase or Room Amenities" 
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Amount (₦):</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        required
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Date:</label>
                    <input 
                        type="date" 
                        value={form.expense_date}
                        onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        required
                    />
                </div>

                <button type="submit" style={{ padding: '10px 20px', background: editingId ? '#ffc107' : '#28a745', color: editingId ? '#333' : 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {editingId ? 'Update Expense' : 'Save Expense'}
                </button>
            </form>

            {/* Filter Controls Panel */}
            <div style={{ background: '#fff', padding: '15px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '3px' }}>Time Period:</label>
                    <select 
                        value={filterPeriod} 
                        onChange={(e) => setFilterPeriod(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '160px' }}
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="this_month">This Month</option>
                        <option value="custom">Custom Date Range</option>
                    </select>
                </div>

                {filterPeriod === 'custom' && (
                    <>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '3px' }}>Start Date:</label>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{ padding: '7px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '3px' }}>End Date:</label>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{ padding: '7px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>
                    </>
                )}

                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '3px' }}>Filter by Category:</label>
                    <select 
                        value={filterCategory} 
                        onChange={(e) => setFilterCategory(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '180px' }}
                    >
                        <option value="All">All Categories</option>
                        {categories.map((cat, idx) => (
                            <option key={idx} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '3px' }}>Search Keyword:</label>
                    <input 
                        type="text" 
                        placeholder="Search description..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '180px' }}
                    />
                </div>
            </div>

            {/* Expenses History Table */}
            <h3>Expense Records</h3>
            <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                <thead>
                    <tr style={{ background: '#ddd' }}>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredExpenses.length === 0 ? (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center', color: '#777' }}>No expense records found for the selected period/filters.</td>
                        </tr>
                    ) : (
                        filteredExpenses.map(item => (
                            <tr key={item.id}>
                                <td>{item.expense_date}</td>
                                <td>{item.category}</td>
                                <td>{item.description || '-'}</td>
                                <td style={{ fontWeight: 'bold', color: '#d9534f' }}>{formatNaira(item.amount)}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            onClick={() => handleEdit(item)}
                                            style={{ padding: '5px 10px', background: '#ffc107', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold', color: '#333' }}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(item.id)}
                                            style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}