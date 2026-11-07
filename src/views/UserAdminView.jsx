import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';

export default function UserAdminView() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Cashier');
    const [isCreating, setIsCreating] = useState(false);

    const [flash, setFlash] = useState(null);

    const showMessage = (text, type = 'success') => {
        setFlash({ text, type });
        setTimeout(() => setFlash(null), 4000);
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await userService.getUsers();
            setUsers(Array.isArray(data) ? data : (data.users || []));
        } catch (err) {
            console.error('Failed to load users:', err);
            showMessage('Failed to load users list.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await userService.createUser({ name, email, password, role });
            showMessage('User created successfully!');
            setName('');
            setEmail('');
            setPassword('');
            setRole('Cashier');
            setIsCreating(false);
            fetchUsers();
        } catch (err) {
            showMessage(err.response?.data?.error || 'Failed to create user.', 'error');
        }
    };

    const handleToggleStatus = async (user) => {
        const newStatus = user.is_active ? 0 : 1;
        try {
            await userService.updateUser(user.id, { is_active: newStatus });
            showMessage(`User successfully ${newStatus ? 'activated' : 'deactivated'}.`);
            fetchUsers();
        } catch (err) {
            showMessage('Failed to update user status.', 'error');
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await userService.updateUser(userId, { role: newRole });
            showMessage(`User role updated to ${newRole} successfully.`);
            fetchUsers();
        } catch (err) {
            showMessage('Failed to update user role.', 'error');
        }
    };

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
            return;
        }
        try {
            await userService.deleteUser(user.id);
            showMessage('User deleted successfully.');
            fetchUsers();
        } catch (err) {
            showMessage(err.response?.data?.error || 'Failed to delete user.', 'error');
        }
    };

    return (
        <div style={{ padding: '20px', background: '#f4f6f9', minHeight: '85vh', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#333' }}>User Administration</h2>
                <button 
                    onClick={() => setIsCreating(!isCreating)}
                    style={{ background: '#228be6', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    {isCreating ? 'Cancel' : '+ Add New User'}
                </button>
            </div>

            {flash && (
                <div style={{ 
                    background: flash.type === 'error' ? '#fff5f5' : '#ebfbee', 
                    color: flash.type === 'error' ? '#e03131' : '#2b8a3e', 
                    border: `1px solid ${flash.type === 'error' ? '#ffc9c9' : '#b2f2bb'}`, 
                    padding: '10px 14px', 
                    borderRadius: '6px', 
                    marginBottom: '16px', 
                    fontSize: '13px', 
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                }}>
                    <span>{flash.text}</span>
                    <button 
                        onClick={() => setFlash(null)} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '16px', fontWeight: 'bold' }}
                    >
                        &times;
                    </button>
                </div>
            )}

            {isCreating && (
                <form onSubmit={handleCreateUser} style={{ background: '#fff', padding: '16px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Full Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Role</label>
                        <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da', background: '#fff' }}>
                            <option value="Cashier">Cashier</option>
                            <option value="Manager">Manager</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                    <button type="submit" style={{ background: '#2b8a3e', color: '#fff', border: 'none', padding: '9px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Save User</button>
                </form>
            )}

            <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                {loading ? (
                    <p style={{ textAlign: 'center', color: '#777', padding: '20px' }}>Loading users...</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                    <th style={{ padding: '10px' }}>Name</th>
                                    <th style={{ padding: '10px' }}>Email</th>
                                    <th style={{ padding: '10px' }}>Role</th>
                                    <th style={{ padding: '10px' }}>Status</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>No users found.</td>
                                    </tr>
                                ) : (
                                    users.map(u => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                                            <td style={{ padding: '10px', fontWeight: 600 }}>{u.name}</td>
                                            <td style={{ padding: '10px', color: '#6c757d' }}>{u.email}</td>
                                            <td style={{ padding: '10px' }}>
                                                <select 
                                                    value={u.role} 
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '12px', background: '#fff' }}
                                                >
                                                    <option value="Cashier">Cashier</option>
                                                    <option value="Manager">Manager</option>
                                                    <option value="Admin">Admin</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <span style={{ 
                                                    background: u.is_active ? '#ebfbee' : '#fff5f5', 
                                                    color: u.is_active ? '#2b8a3e' : '#e03131', 
                                                    padding: '2px 6px', borderRadius: '4px', fontWeight: 600, fontSize: '11px' 
                                                }}>
                                                    {u.is_active ? 'Active' : 'Deactivated'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                    <button 
                                                        onClick={() => handleToggleStatus(u)}
                                                        style={{ 
                                                            background: u.is_active ? '#fff0f3' : '#ebfbee', 
                                                            color: u.is_active ? '#e03131' : '#2b8a3e', 
                                                            border: `1px solid ${u.is_active ? '#ffc9c9' : '#b2f2bb'}`, 
                                                            padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' 
                                                        }}
                                                    >
                                                        {u.is_active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteUser(u)}
                                                        style={{ 
                                                            background: '#fa5252', 
                                                            color: '#fff', 
                                                            border: 'none', 
                                                            padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' 
                                                        }}
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
                )}
            </div>
        </div>
    );
}