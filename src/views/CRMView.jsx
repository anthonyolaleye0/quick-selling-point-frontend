// frontend/src/views/CRMView.jsx
import React, { useState, useEffect } from 'react';
import { crmService } from '../services/crmService';
import CustomerForm from '../components/CustomerForm';

export default function CRMView() {
    const [customers, setCustomers] = useState([]);
    const [form, setForm] = useState({ name: '', phone: '', email: '' });
    
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', phone: '', email: '' });

    // Conversion rate: 1 Point = ₦10 (matches backend redemption logic)
    const POINT_CONVERSION_RATE = 10;

    const fetchCustomers = async () => {
        try {
            const data = await crmService.getCustomers();
            setCustomers(Array.isArray(data) ? data : data.customers || []);
        } catch (err) {
            console.error('Error fetching customers:', err);
            setCustomers([]);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (editingId) {
            try {
                await crmService.updateCustomer(editingId, editForm);
                alert('Customer updated successfully!');
                setEditingId(null);
                setEditForm({ name: '', phone: '', email: '' });
                fetchCustomers();
            } catch (err) {
                console.error('Error updating customer:', err);
                alert('Failed to update customer.');
            }
        } else {
            try {
                await crmService.addCustomer(form);
                alert('Customer registered successfully!');
                setForm({ name: '', phone: '', email: '' });
                fetchCustomers();
            } catch (err) {
                console.error('Error registering customer:', err);
                alert('Failed to register customer.');
            }
        }
    };

    const handleStartEdit = (customer) => {
        setEditingId(customer.id);
        setEditForm({ name: customer.name, phone: customer.phone || '', email: customer.email || '' });
    };

    const handleDeleteCustomer = async (id) => {
        if (!window.confirm('Are you sure you want to delete this customer profile?')) return;
        try {
            await crmService.deleteCustomer(id);
            alert('Customer deleted successfully!');
            fetchCustomers();
        } catch (err) {
            console.error('Error deleting customer:', err);
            alert('Failed to delete customer.');
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h2>Customer Relationship Management (CRM)</h2>

            {/* Modularized Form Component */}
            <CustomerForm 
                editingId={editingId}
                form={form}
                editForm={editForm}
                onFormChange={setForm}
                onEditFormChange={setEditForm}
                onSubmit={handleFormSubmit}
                onCancelEdit={() => setEditingId(null)}
            />

            <h3>Registered Customers & Loyalty Points</h3>
            <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                <thead>
                    <tr style={{ background: '#ddd' }}>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Loyalty Points & Value</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.length === 0 ? (
                        <tr>
                            <td colSpan="6" style={{ textAlign: 'center', color: '#777' }}>No customer profiles registered yet.</td>
                        </tr>
                    ) : (
                        customers.map(c => {
                            const points = c.loyalty_points ?? 0;
                            const monetaryValue = points * POINT_CONVERSION_RATE;
                            return (
                                <tr key={c.id}>
                                    <td>{c.id}</td>
                                    <td>{c.name}</td>
                                    <td>{c.phone || 'N/A'}</td>
                                    <td>{c.email || 'N/A'}</td>
                                    <td>
                                        <strong style={{ color: '#007bff' }}>{points} pts</strong>
                                        <div style={{ fontSize: '12px', color: '#28a745', fontWeight: 'bold' }}>
                                            Value: ₦{monetaryValue.toLocaleString()}
                                        </div>
                                    </td>
                                    <td>
                                        <button 
                                            onClick={() => handleStartEdit(c)} 
                                            style={{ background: '#17a2b8', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '6px', fontSize: '12px' }}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteCustomer(c.id)} 
                                            style={{ background: '#dc3545', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}