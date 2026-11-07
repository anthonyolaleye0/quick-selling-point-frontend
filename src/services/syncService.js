// frontend/src/services/syncService.js
import { posService } from './posService';

let syncListeners = [];

export const registerSyncListener = (callback) => {
    syncListeners.push(callback);
    return () => {
        syncListeners = syncListeners.filter(cb => cb !== callback);
    };
};

const notifySyncListeners = (count) => {
    syncListeners.forEach(cb => cb(count));
};

export const cacheMasterData = async () => {
    try {
        const [prodData, custData] = await Promise.all([
            posService.getProducts(),
            posService.getCustomers()
        ]);
        const prods = Array.isArray(prodData) ? prodData : prodData.products || [];
        const custs = Array.isArray(custData) ? custData : custData.customers || [];
        
        localStorage.setItem('pos_cached_products', JSON.stringify(prods));
        localStorage.setItem('pos_cached_customers', JSON.stringify(custs));
        return { products: prods, customers: custs };
    } catch (err) {
        console.warn('Failed to cache master data from network:', err);
        return null;
    }
};

export const saveSaleOffline = async (salePayload) => {
    try {
        const existingQueue = JSON.parse(localStorage.getItem('pos_offline_sales_queue') || '[]');
        existingQueue.push({
            ...salePayload,
            offline_saved_at: new Date().toISOString()
        });
        localStorage.setItem('pos_offline_sales_queue', JSON.stringify(existingQueue));
        return true;
    } catch (err) {
        console.error('Failed to save sale offline:', err);
        throw new Error('Could not save sale to local storage.');
    }
};

export const processOfflineQueue = async () => {
    const queue = JSON.parse(localStorage.getItem('pos_offline_sales_queue') || '[]');
    if (queue.length === 0) return;

    let successCount = 0;
    const remainingQueue = [];

    for (const sale of queue) {
        try {
            await posService.completeCheckout(sale);
            successCount++;
        } catch (err) {
            console.error('Failed to sync offline sale item:', err);
            remainingQueue.push(sale);
        }
    }

    localStorage.setItem('pos_offline_sales_queue', JSON.stringify(remainingQueue));

    if (successCount > 0) {
        notifySyncListeners(successCount);
    }
};

window.addEventListener('online', () => {
    processOfflineQueue();
});

// Provide both named and default exports to cover all component import styles
export const syncService = {
    registerSyncListener,
    cacheMasterData,
    saveSaleOffline,
    processOfflineQueue
};

export default syncService;