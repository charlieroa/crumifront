import axios from 'axios';

const API_URL = 'http://localhost:3000/api'; // Ajusta a tu puerto

// Configura tu instancia de axios (si ya tienes una global con token, úsala)
const api = axios.create({
    baseURL: API_URL,
});

// Interceptor para agregar el token (asumiendo que lo guardas en localStorage)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const createInvoice = async (invoiceData: any) => {
    const response = await api.post('/invoices', invoiceData);
    return response.data;
};

export const getClients = async (tenantId: string) => {
    // Usamos la ruta que ya tienes para traer clientes
    const response = await api.get(`/users/tenant/${tenantId}/clients`);
    return response.data;
};

// Mock para buscar productos (luego lo conectas a tu endpoint real de productos)
export const searchProducts = async (query: string) => {
    // Aquí llamarías a: await api.get(`/products?search=${query}`);
    return [];
};