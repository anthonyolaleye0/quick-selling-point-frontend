// frontend/src/utils/permissions.js

const ROLE_PERMISSIONS = {
    Admin: [
        'pos', 'calculator', 'shifts', 'inventory', 'restock-history', 
        'expenses', 'crm', 'sales', 'financial-report', 'users', 'audit', 'change-password'
    ],
    Manager: [
        'pos', 'calculator', 'shifts', 'inventory', 'restock-history', 
        'expenses', 'crm', 'sales', 'financial-report', 'change-password'
    ],
    Cashier: [
        'pos', 'calculator', 'shifts', 'crm', 'change-password'
    ]
};

export const canAccessView = (role, viewId) => {
    const allowedViews = ROLE_PERMISSIONS[role] || [];
    return allowedViews.includes(viewId);
};

export const getFilteredMenuItems = (role, allMenuItems) => {
    const allowedViews = ROLE_PERMISSIONS[role] || [];
    return allMenuItems.filter(item => allowedViews.includes(item.id));
};