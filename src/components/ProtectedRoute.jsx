import React from 'react';
import { authService } from '../services/authService';
import LoginView from '../views/LoginView';

export default function ProtectedRoute({ children, allowedRoles }) {
    const user = authService.getCurrentUser();

    if (!user) {
        return <LoginView />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
                <h2 style={{ color: '#fa5252' }}>Access Denied</h2>
                <p style={{ color: '#495057' }}>You do not have the required permissions to view this module.</p>
            </div>
        );
    }

    return children;
}