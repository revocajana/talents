import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
          refresh: refreshToken,
        });
        const newAccessToken = response.data.access;
        localStorage.setItem('access_token', newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// ==================== GEOGRAPHIC HIERARCHY ====================

export const getCountries = () => api.get('/countries/');
export const getZones = (params = {}) => api.get('/zones/', { params });
export const getRegions = (params = {}) => api.get('/regions/', { params });
export const getDistricts = (params = {}) => api.get('/districts/', { params });
export const getWards = (params = {}) => api.get('/wards/', { params });
export const getSchools = (params = {}) => api.get('/schools/', { params });

// ==================== USER MANAGEMENT ====================

export const getCurrentUser = () => api.get('/users/current/');
export const getUserStats = () => api.get('/users/stats/');
export const getUsers = (params = {}) => api.get('/users/', { params });

// ==================== TALENT SYSTEM ====================

export const getTalents = (params = {}) => api.get('/talents/', { params });
export const getTalentById = (id) => api.get(`/talents/${id}/`);
export const createTalent = (data) => api.post('/talents/', data);
export const updateTalent = (id, data) => api.put(`/talents/${id}/`, data);
export const deleteTalent = (id) => api.delete(`/talents/${id}/`);

export const getStudentTalents = (params = {}) => api.get('/student-talents/', { params });
export const getStudentTalentById = (id) => api.get(`/student-talents/${id}/`);
export const createStudentTalent = (data) => api.post('/student-talents/', data);
export const updateStudentTalent = (id, data) => api.put(`/student-talents/${id}/`, data);
export const deleteStudentTalent = (id) => api.delete(`/student-talents/${id}/`);

// ==================== STUDENTS ====================

export const getStudents = (params = {}) => api.get('/students/', { params });
export const getStudentById = (id) => api.get(`/students/${id}/`);
export const createStudent = (data) => api.post('/students/', data);
export const updateStudent = (id, data) => api.put(`/students/${id}/`, data);
export const deleteStudent = (id) => api.delete(`/students/${id}/`);

// ==================== PARENTS ====================

export const getParents = (params = {}) => api.get('/parents/', { params });
export const getParentById = (id) => api.get(`/parents/${id}/`);
export const createParent = (data) => api.post('/parents/', data);
export const updateParent = (id, data) => api.put(`/parents/${id}/`, data);
export const deleteParent = (id) => api.delete(`/parents/${id}/`);

// ==================== COMPETITIONS ====================

export const getCompetitions = (params = {}) => api.get('/competitions/', { params });
export const getCompetitionById = (id) => api.get(`/competitions/${id}/`);
export const createCompetition = (data) => api.post('/competitions/', data);
export const updateCompetition = (id, data) => api.put(`/competitions/${id}/`, data);
export const deleteCompetition = (id) => api.delete(`/competitions/${id}/`);

// ==================== COMPETITION PARTICIPATION ====================

export const getParticipations = (params = {}) => api.get('/participations/', { params });
export const getParticipationById = (id) => api.get(`/participations/${id}/`);
export const createParticipation = (data) => api.post('/participations/', data);
export const updateParticipation = (id, data) => api.put(`/participations/${id}/`, data);
export const deleteParticipation = (id) => api.delete(`/participations/${id}/`);

// ==================== RESULTS ====================

export const getResults = (params = {}) => api.get('/results/', { params });
export const getResultById = (id) => api.get(`/results/${id}/`);
export const createResult = (data) => api.post('/results/', data);

export const getResultDetails = (params = {}) => api.get('/result-details/', { params });
export const getResultDetailById = (id) => api.get(`/result-details/${id}/`);
export const createResultDetail = (data) => api.post('/result-details/', data);

// ==================== ANNOUNCEMENTS ====================

export const getAnnouncements = (params = {}) => api.get('/announcements/', { params });
export const getAnnouncementById = (id) => api.get(`/announcements/${id}/`);
export const createAnnouncement = (data) => api.post('/announcements/', data);
export const updateAnnouncement = (id, data) => api.put(`/announcements/${id}/`, data);
export const deleteAnnouncement = (id) => api.delete(`/announcements/${id}/`);

export default api;
