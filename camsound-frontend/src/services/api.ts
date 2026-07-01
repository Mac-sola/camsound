import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 30000, // 30 second timeout
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle auth errors and network issues
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 - token invalid or expired
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Handle network errors gracefully
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.message = 'Request timeout - server not responding. Please try again.';
      } else if (!window.navigator.onLine) {
        error.message = 'No internet connection';
      } else {
        error.message = 'Network error - unable to reach server';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

// --- Auth ---
export const authService = {
  login: (credentials: any) => api.post('/api/auth/login', credentials),
  signup: (userData: any) => api.post('/api/auth/signup', userData),
  logout: () => api.post('/api/auth/logout'),
  getProfile: () => api.get('/api/auth/me'),
  updateProfile: (data: any) => api.put('/api/auth/me', data),
};

// --- Songs ---
export const songsService = {
  getSongs: (params?: any) => api.get('/api/songs', { params }),
  getSong: (id: string) => api.get(`/api/songs/${id}`),
  createSong: (data: FormData) => api.post('/api/upload/song', data),
  updateSong: (id: string, data: any) => api.put(`/api/songs/${id}`, data),
  deleteSong: (id: string) => api.delete(`/api/songs/${id}`),
  trackPlay: (id: string) => api.post(`/api/songs/${id}/play`),
};

// --- Favorites ---
export const favoritesService = {
  getFavorites: () => api.get('/api/favorites'),
  likeSong: (songId: string) => api.post(`/api/favorites/${songId}`),
  unlikeSong: (songId: string) => api.delete(`/api/favorites/${songId}`),
};

// --- Follows ---
export const followsService = {
  getFollowing: () => api.get('/api/follows'),
  followArtist: (artistId: string) => api.post(`/api/follows/${artistId}`),
  unfollowArtist: (artistId: string) => api.delete(`/api/follows/${artistId}`),
};

// --- History ---
export const historyService = {
  getHistory: (params?: any) => api.get('/api/history', { params }),
  clearHistory: () => api.delete('/api/history'),
};

// --- Playlists ---
export const playlistsService = {
  getPlaylists: () => api.get('/api/playlists'),
  getPlaylist: (id: string) => api.get(`/api/playlists/${id}`),
  createPlaylist: (data: any) => api.post('/api/playlists', data),
  updatePlaylist: (id: string, data: any) => api.put(`/api/playlists/${id}`, data),
  deletePlaylist: (id: string) => api.delete(`/api/playlists/${id}`),
  addSong: (id: string, songId: string) => api.post(`/api/playlists/${id}/songs`, { songId }),
  removeSong: (id: string, songId: string) => api.delete(`/api/playlists/${id}/songs/${songId}`),
};

// --- Artists ---
export const artistsService = {
  getArtists: (params?: any) => api.get('/api/artists', { params }),
  getArtistMe: () => api.get('/api/artists/me'),
  getArtist: (id: string) => api.get(`/api/artists/${id}`),
  updateArtist: (id: string, data: any) => api.put(`/api/artists/${id}`, data),
};

// --- Notifications ---
export const notificationsService = {
  getNotifications: () => api.get('/api/notifications'),
  markAllRead: () => api.put('/api/notifications/read-all'),
  markRead: (id: string) => api.put(`/api/notifications/${id}/read`),
  deleteNotification: (id: string) => api.delete(`/api/notifications/${id}`),
};

// --- Stats ---
export const statsService = {
  getGlobalStats: () => api.get('/api/stats/global'),
  getArtistStats: () => api.get('/api/stats/artist'),
};

// --- Admin ---
export const adminService = {
  getUsers: (params?: any) => api.get('/api/admin/users', { params }),
  updateUserStatus: (id: string, status: string) => api.put(`/api/admin/users/${id}/status`, { status }),
  updateUserRole: (id: string, type: string) => api.put(`/api/admin/users/${id}/role`, { type }),
  deleteUser: (id: string) => api.delete(`/api/admin/users/${id}`),
  getSongs: (params?: any) => api.get('/api/admin/songs', { params }),
  moderateSong: (id: string, data: any) => api.put(`/api/admin/songs/${id}/moderate`, data),
  getReports: () => api.get('/api/admin/reports'),
  updateReport: (id: string, status: string) => api.put(`/api/admin/reports/${id}`, { status }),
  getSettings: () => api.get('/api/admin/settings'),
  updateSettings: (data: any) => api.put('/api/admin/settings', data),
};

// --- Subscriptions ---
export const subscriptionsService = {
  getPlans: () => api.get('/api/subscriptions/plans'),
  getSubscriptions: () => api.get('/api/subscriptions'),
  getSubscription: (id: string) => api.get(`/api/subscriptions/${id}`),
  createSubscription: (data: any) => api.post('/api/subscriptions', data),
};

// --- Payments ---
export const paymentsService = {
  getPayments: () => api.get('/api/payments'),
  createPayment: (data: any) => api.post('/api/payments', data),
};

// --- Withdrawals ---
export const withdrawalsService = {
  getWithdrawals: () => api.get('/api/withdrawals'),
  requestWithdrawal: (data: any) => api.post('/api/withdrawals', data),
  updateWithdrawal: (id: string, data: any) => api.put(`/api/withdrawals/${id}`, data),
};
