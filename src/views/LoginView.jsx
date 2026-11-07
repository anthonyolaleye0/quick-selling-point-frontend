import React, { useState } from 'react';
import { authService } from '../services/authService';

export default function LoginView({ onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authService.login({ email, password });
            if (onLoginSuccess) {
                onLoginSuccess();
            } else {
                window.location.reload();
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f6f9', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ background: '#fff', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', boxSizing: 'border-box' }}>
                <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                    <h2 style={{ margin: 0, color: '#343a40', fontSize: '22px' }}>QuickSellingPoint</h2>
                    <p style={{ color: '#6c757d', fontSize: '13px', marginTop: '5px' }}>Sign in with your staff account</p>
                </div>

                {error && (
                    <div style={{ background: '#fff5f5', color: '#e03131', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '20px', border: '1px solid #ffc9c9' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#495057', marginBottom: '5px' }}>Email Address</label>
                        <input 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="staff@quicksellingpoint.com"
                            required
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontSize: '14px' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#495057', marginBottom: '5px' }}>Password</label>
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', fontSize: '14px' }}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        style={{ background: '#007bff', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', transition: 'background 0.2s' }}
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}