// frontend/src/services/expenseService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const expenseService = {
    getExpenses: async () => {
        const response = await axios.get(`${API_BASE_URL}/expenses`);
        return response.data;
    },

    addExpense: async (expenseData) => {
        const response = await axios.post(`${API_BASE_URL}/expenses`, expenseData);
        return response.data;
    },

    updateExpense: async (id, expenseData) => {
        const response = await axios.put(`${API_BASE_URL}/expenses/${id}`, expenseData);
        return response.data;
    },

    deleteExpense: async (id) => {
        const response = await axios.delete(`${API_BASE_URL}/expenses/${id}`);
        return response.data;
    }
};