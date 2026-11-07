// frontend/src/views/ChangePasswordView.jsx
import React, { useState } from 'react';
import { userService } from '../services/userService';
import { authService } from '../services/authService';

export default function ChangePasswordView() {
    const currentUser = authService.getCurrentUser();
    const userId = currentUser ? currentUser.id : null;

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [flash, setFlash] = useState(null);

    const showMessage = (text, type = 'success') => {
        setFlash({ text, type });
        setTimeout(() => setFlash(null), 4000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!userId) {
            showMessage('No active user session found. Please log in again.', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage('New passwords do not match.', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showMessage('New password must be at least 6 characters long.', 'error');
            return;
        }

        try {
            setLoading(true);
            await userService.changePassword(userId, { currentPassword, newPassword });
            showMessage('Password changed successfully.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            showMessage(err.response?.data?.error || 'Failed to change password.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', background: '#f4f6f9', minHeight: '85vh', fontFamily: 'Inter, sans-serif', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', width: '100%', maxWidth: '450px', marginTop: '20px' }}>
                <h2 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '20px' }}>Change Password</h2>
                <p style={{ color: '#6c757d', fontSize: '13px', marginBottom: '20px' }}>Please enter your current password and choose a secure new password for <strong>{currentUser?.name || 'Account'}</strong>.</p>

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
                        alignItems: 'center'
                    }}>
                        <span>{flash.text}</span>
                        <button onClick={() => setFlash(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '16px', fontWeight: 'bold' }}>&times;</button>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>Current Password</label>
                        <input 
                            type="password" 
                            value={currentPassword} 
                            onChange={e => setCurrentPassword(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '9px', borderRadius: '4px', border: '1px solid #ced4da', boxSizing: 'border-box', fontSize: '13px' }} 
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>New Password</label>
                        <input 
                            type="password" 
                            value={newPassword} 
                            onChange={e => setNewPassword(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '9px', borderRadius: '4px', border: '1px solid #ced4da', boxSizing: 'border-box', fontSize: '13px' }} 
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#333' }}>Confirm New Password</label>
                        <input 
                            type="password" 
                            value={confirmPassword} 
                            onChange={e => setConfirmPassword(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '9px', borderRadius: '4px', border: '1px solid #ced4da', boxSizing: 'border-box', fontSize: '13px' }} 
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{ background: '#228be6', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', fontSize: '13px' }}
                    >
                        {loading ? 'Updating Password...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}