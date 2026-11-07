// frontend/src/services/inventoryService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const inventoryService = {
    getProducts: async () => {
        const response = await axios.get(`${API_BASE_URL}/inventory`);
        return response.data;
    },

    getCategories: async () => {
        const response = await axios.get(`${API_BASE_URL}/inventory/categories`);
        return response.data;
    },

    addProduct: async (productData) => {
        const response = await axios.post(`${API_BASE_URL}/inventory/add`, productData);
        return response.data;
    },

    restockProduct: async (restockData) => {
        const response = await axios.post(`${API_BASE_URL}/inventory/restock`, restockData);
        return response.data;
    },

    restockItem: async (restockData) => {
        const response = await axios.post(`${API_BASE_URL}/inventory/restock`, restockData);
        return response.data;
    },

    // Endpoint method for fetching restock / purchase history
    getRestockHistory: async () => {
        const response = await axios.get(`${API_BASE_URL}/inventory/restock-history`);
        return response.data;
    },

    // Endpoint method for updating retail selling price due to cost fluctuations
    updateRetailPrice: async (id, retailPrice) => {
        const response = await axios.put(`${API_BASE_URL}/inventory/${id}/retail-price`, { retail_price: retailPrice });
        return response.data;
    },

    addCategory: async (categoryData) => {
        const response = await axios.post(`${API_BASE_URL}/inventory/categories`, categoryData);
        return response.data;
    },

    updateCategory: async (id, categoryData) => {
        const response = await axios.put(`${API_BASE_URL}/inventory/categories/${id}`, categoryData);
        return response.data;
    }
};