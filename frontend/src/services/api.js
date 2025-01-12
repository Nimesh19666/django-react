import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Function to get CSRF token
const getCSRFToken = async () => {
  try {
    const response = await api.get('/auth/csrf/');
    return response.data.csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    return null;
  }
};

// Add request interceptor to include CSRF token
api.interceptors.request.use(async (config) => {
  if (config.method !== 'get') {
    const csrfToken = await getCSRFToken();
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
  }
  return config;
});

// Add response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/'),
  getUser: () => api.get('/auth/user/'),
};

export const inventoryApi = {
  // Suppliers
  getSuppliers: () => api.get('/suppliers/'),
  createSupplier: (data) => api.post('/suppliers/', data),
  updateSupplier: (id, data) => api.put(`/suppliers/${id}/`, data),
  deleteSupplier: (id) => api.delete(`/suppliers/${id}/`),

  // Inventory Items
  getItems: (params) => api.get('/items/', { params }),
  createItem: (data) => api.post('/items/', data),
  updateItem: (id, data) => api.put(`/items/${id}/`, data),
  deleteItem: (id) => api.delete(`/items/${id}/`),
  getDashboardStats: () => api.get('/items/dashboard_stats/'),
  exportCsv: () => api.get('/items/export_csv/', { responseType: 'blob' }),

  // Transactions
  getTransactions: (params) => api.get('/transactions/', { params }),
  createTransaction: (data) => api.post('/transactions/', data),
};

export default api;
