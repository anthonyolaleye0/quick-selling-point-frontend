// frontend/src/services/reportService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/reports';

export const reportService = {
    getAllSales: async () => {
        const response = await axios.get(`${API_URL}/sales`);
        return response.data;
    },

    getTransactionReceipt: async (identifier) => {
        const response = await axios.get(`${API_URL}/receipt/${identifier}`);
        return response.data;
    },

    getBusinessAnalysisReport: async (startDate, endDate) => {
        try {
            const response = await axios.get(`${API_URL}/analysis`, {
                params: { startDate, endDate }
            });
            return response.data;
        } catch (err) {
            console.error('Error fetching business analysis report:', err);
            throw err;
        }
    },

    getVatSchedule: async (startDate, endDate) => {
        try {
            const response = await axios.get(`${API_URL}/vat-schedule`, {
                params: { startDate, endDate }
            });
            return response.data;
        } catch (err) {
            console.error('Error fetching VAT schedule:', err);
            throw err;
        }
    }
};