// frontend/src/components/NetworkStatusBanner.jsx
import React, { useState, useEffect } from 'react';
import { cacheMasterData } from '../services/syncService';

export default function NetworkStatusBanner({ onSyncTriggered }) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        const handleOnline = async () => {
            setIsOnline(true);
            setSyncing(true);
            console.log('Connection restored. Refreshing local cache and syncing offline sales...');
            
            try {
                // Refresh local product/customer cache from server
                await cacheMasterData();
                
                // Trigger background sync for pending offline sales
                if (onSyncTriggered) {
                    await onSyncTriggered();
                }
            } catch (err) {
                console.error('Error during post-reconnection sync:', err);
            } finally {
                setSyncing(false);
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [onSyncTriggered]);

    if (isOnline && !syncing) return null; // Hide completely when everything is fine online

    return (
        <div style={{
            background: isOnline ? '#339af0' : '#f03e3e',
            color: '#fff',
            padding: '10px 20px',
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'center',
            alignItem: 'center',
            gap: '10px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 1000
        }}>
            <span>
                {isOnline 
                    ? `🔄 Connection restored. Syncing offline data...` 
                    : `⚠️ OFFLINE MODE ACTIVE: Internet connection lost. Transactions are saving locally.`
                }
            </span>
        </div>
    );
}