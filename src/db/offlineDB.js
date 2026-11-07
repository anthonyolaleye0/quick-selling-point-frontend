// frontend/src/db/offlineDB.js
import Dexie from 'dexie';

export const offlineDB = new Dexie('POSOfflineDatabase');

offlineDB.version(1).stores({
    // Indexed fields: id (primary key), sku, name, category_id
    products: '++id, sku, name, category_id, retail_price, stock_count',
    
    // Indexed fields: id (primary key), name, phone, email
    customers: '++id, name, phone, email, loyalty_points',
    
    // Queue for transactions completed while offline
    // sync_status tracks whether it has been pushed to SQLite backend ('pending' or 'synced')
    offlineSales: '++localId, receipt_no, sync_status, created_at'
});