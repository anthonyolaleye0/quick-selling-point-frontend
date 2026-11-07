// frontend/src/services/userService.js
import axios from 'axios';

const API_URL = '/api/users';

export const userService = {
    getUsers: async () => {
        const response = await axios.get(API_URL);
        return response.data;
    },
    createUser: async (userData) => {
        const response = await axios.post(API_URL, userData);
        return response.data;
    },
    updateUser: async (userId, updateData) => {
        const response = await axios.put(`${API_URL}/${userId}`, updateData);
        return response.data;
    },
    deleteUser: async (userId) => {
        const response = await axios.delete(`${API_URL}/${userId}`);
        return response.data;
    },
    changePassword: async (userId, passwordData) => {
        const response = await axios.put(`${API_URL}/${userId}/password`, passwordData);
        return response.data;
    }
};