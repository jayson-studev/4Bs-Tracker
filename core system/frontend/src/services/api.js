import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include JWT token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  login: (credentials) => api.post('/officials/login', credentials),
  register: (data) => api.post('/officials/register', data),
  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    return Promise.resolve();
  },
};

// Invite APIs
export const inviteAPI = {
  generateInitialTokens: () => api.post('/invites/generate-initial-tokens'),
  verifyToken: (token) => api.post('/invites/verify', { token }),
  generateSuccessionTokens: (data) => api.post('/invites/generate-succession-tokens', data),
  generateReplacementToken: (data) => api.post('/invites/generate-replacement-token', data),
};

// Allocations APIs
export const allocationsAPI = {
  getGeneralFund: () => api.get('/allocations/general-fund'),
  getTypes: () => api.get('/allocations/types'),
  getAll: () => api.get('/allocations'),
  create: (data) => api.post('/allocations', data),
  approve: (id) => api.patch(`/allocations/${id}/approve`),
  reject: (id, reason) => api.patch(`/allocations/${id}/reject`, { rejectionReason: reason }),
};

// Proposals APIs
export const proposalsAPI = {
  getGeneralFund: () => api.get('/allocations/general-fund'),
  getFundSources: () => api.get('/proposals/fund-sources'),
  getAll: () => api.get('/proposals'),
  create: (data) => api.post('/proposals', data),
  approve: (id) => api.patch(`/proposals/${id}/approve`),
  reject: (id, reason) => api.patch(`/proposals/${id}/reject`, { rejectionReason: reason }),
};

// Expenditures APIs
export const expendituresAPI = {
  getGeneralFund: () => api.get('/allocations/general-fund'),
  getFundSources: () => api.get('/expenditures/fund-sources'),
  getAll: () => api.get('/expenditures'),
  create: (data) => api.post('/expenditures', data),
  approve: (id) => api.patch(`/expenditures/${id}/approve`),
  reject: (id, reason) => api.patch(`/expenditures/${id}/reject`, { rejectionReason: reason }),
};

// Income APIs
export const incomeAPI = {
  getGeneralFund: () => api.get('/allocations/general-fund'),
  getTypes: () => api.get('/income/types'),
  getAll: () => api.get('/income'),
  record: (data) => api.post('/income/record', data),
};

// Officials APIs
export const officialsAPI = {
  getAll: () => api.get('/officials'),
};

export default api;
