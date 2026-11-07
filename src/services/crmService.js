// frontend/src/services/crmService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const crmService = {
    getCustomers: async () => {
        const response = await axios.get(`${API_BASE_URL}/crm`);
        return response.data;
    },

    addCustomer: async (customerData) => {
        const response = await axios.post(`${API_BASE_URL}/crm/add`, customerData);
        return response.data;
    },

    updateCustomer: async (id, customerData) => {
        const response = await axios.put(`${API_BASE_URL}/crm/${id}`, customerData);
        return response.data;
    },

    deleteCustomer: async (id) => {
        const response = await axios.delete(`${API_BASE_URL}/crm/${id}`);
        return response.data;
    }
};