// frontend/src/services/posService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const posService = {
    getProducts: async () => {
        if (!navigator.onLine) {
            const cached = localStorage.getItem('cached_products') || localStorage.getItem('pos_products');
            return cached ? JSON.parse(cached) : [];
        }
        try {
            const response = await axios.get(`${API_BASE_URL}/pos/products`);
            return response.data;
        } catch (error) {
            const cached = localStorage.getItem('cached_products') || localStorage.getItem('pos_products');
            if (cached) return JSON.parse(cached);
            throw error;
        }
    },

    getCustomers: async () => {
        if (!navigator.onLine) {
            const cached = localStorage.getItem('cached_customers') || localStorage.getItem('pos_customers');
            return cached ? JSON.parse(cached) : [];
        }
        try {
            const response = await axios.get(`${API_BASE_URL}/crm`);
            return response.data;
        } catch (error) {
            const cached = localStorage.getItem('cached_customers') || localStorage.getItem('pos_customers');
            if (cached) return JSON.parse(cached);
            throw error;
        }
    },

    checkout: async (checkoutData) => {
        if (!navigator.onLine) {
            return posService.saveSaleOffline(checkoutData);
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/pos/checkout`, checkoutData);
            return response.data;
        } catch (error) {
            if (!navigator.onLine || error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
                console.warn('Network unavailable during checkout. Saving to offline queue...');
                return posService.saveSaleOffline(checkoutData);
            }
            throw error;
        }
    },

    completeCheckout: async (checkoutData) => {
        return await posService.checkout(checkoutData);
    },

    saveSaleOffline: (checkoutData) => {
        const rawSplits = checkoutData.split_details || checkoutData.splitDetails || [];
        const formattedSplits = rawSplits.map(s => ({
            method: s.method || s.payment_method,
            amount: Number(s.amount || 0)
        }));

        let splitNarration = checkoutData.payment_method;
        if ((checkoutData.payment_method || '').toLowerCase() === 'split' && formattedSplits.length > 0) {
            splitNarration = formattedSplits
                .map(s => `${s.method}: ₦${s.amount.toLocaleString()}`)
                .join(' | ');
        }

        const offlineSale = {
            ...checkoutData,
            id: 'OFFLINE_' + Date.now(),
            localId: 'OFFLINE_' + Date.now(),
            receiptNo: checkoutData.receipt_no || `REC-OFFLINE-${Date.now()}`,
            date: new Date().toISOString(),
            paymentMethod: checkoutData.payment_method,
            splitDetails: formattedSplits,
            splitNarration: splitNarration,
            subtotal: checkoutData.subtotal,
            vatAmount: checkoutData.vat_amount || 0,
            discount: checkoutData.discount || 0,
            grandTotal: checkoutData.grand_total,
            items: (checkoutData.items || []).map(i => ({
                name: i.name,
                sku: i.sku || '',
                quantity: i.quantity,
                retail_price: i.retail_price || i.price || 0,
                total_price: i.quantity * (i.retail_price || i.price || 0)
            })),
            timestamp: new Date().toLocaleString(),
            dateFormatted: new Date().toISOString().split('T')[0],
            queuedAt: new Date().toISOString(),
            isSynced: false
        };

        const existingQueue = JSON.parse(localStorage.getItem('pos_offline_sales_queue') || '[]');
        existingQueue.push(offlineSale);
        localStorage.setItem('pos_offline_sales_queue', JSON.stringify(existingQueue));

        const localSales = JSON.parse(localStorage.getItem('pos_sales') || '[]');
        localSales.unshift(offlineSale);
        localStorage.setItem('pos_sales', JSON.stringify(localSales));

        return {
            success: true,
            offline: true,
            message: 'Sale saved offline successfully!',
            transactionId: offlineSale.id,
            receiptNo: offlineSale.receiptNo,
            receipt: offlineSale
        };
    },

    getTransactionReceipt: async (transactionId) => {
        if (!navigator.onLine || String(transactionId).startsWith('OFFLINE_')) {
            const localSales = JSON.parse(localStorage.getItem('pos_sales') || '[]');
            const found = localSales.find(s => String(s.id) === String(transactionId) || String(s.receiptNo) === String(transactionId));
            if (found) return found;
        }
        
        try {
            const response = await axios.get(`${API_BASE_URL}/pos/receipts/${transactionId}`);
            return response.data.receipt || response.data;
        } catch (error) {
            const localSales = JSON.parse(localStorage.getItem('pos_sales') || '[]');
            const found = localSales.find(s => String(s.id) === String(transactionId));
            if (found) return found;
            throw error;
        }
    },

    parkSale: async (parkData) => {
        const response = await axios.post(`${API_BASE_URL}/pos/park`, parkData);
        return response.data;
    },

    getParkedSales: async () => {
        const response = await axios.get(`${API_BASE_URL}/pos/parked`);
        return response.data;
    },

    deleteParkedSale: async (id) => {
        const response = await axios.delete(`${API_BASE_URL}/pos/parked/${id}`);
        return response.data;
    },

    syncOfflineSales: async (offlineSales) => {
        const response = await axios.post(`${API_BASE_URL}/pos/sync-offline-sales`, { offlineSales });
        return response.data;
    }
};

export default posService;