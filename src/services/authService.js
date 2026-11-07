import axios from 'axios';

const API_URL = '/api/auth';

export const authService = {
    login: async (credentials) => {
        const response = await axios.post(`${API_URL}/login`, credentials);
        if (response.data.token) {
            localStorage.setItem('qsp_token', response.data.token);
            localStorage.setItem('qsp_user', JSON.stringify(response.data.user));
        }
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('qsp_token');
        localStorage.removeItem('qsp_user');
        window.location.reload();
    },
    getCurrentUser: () => {
        const userStr = localStorage.getItem('qsp_user');
        return userStr ? JSON.parse(userStr) : null;
    }
};