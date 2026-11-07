// frontend/src/services/auditService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const auditService = {
    getAuditLogs: async (filters = {}) => {
        const response = await axios.get(`${API_BASE_URL}/audit-logs`, { params: filters });
        return response.data;
    },
    
    logAction: async (logData) => {
        const response = await axios.post(`${API_BASE_URL}/audit-logs`, logData);
        return response.data;
    }
};