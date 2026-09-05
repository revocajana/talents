import axios from 'axios';

const API_HOST = import.meta.env.VITE_API_URL
  || `${window.location.protocol}//${window.location.hostname}:8000`;
const API_BASE_URL = `${API_HOST}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
});

const getAllRecords = async (path, params = {}) => {
  const records = [];
  let page = 1;
  let total = null;

  do {
    const response = await api.get(path, { params: { ...params, page } });
    const pageRecords = response.data.results || [];
    records.push(...pageRecords);
    total = response.data.count ?? records.length;
    page += 1;
    if (!pageRecords.length) break;
  } while (records.length < total);

  return { data: { count: records.length, results: records } };
};

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
  (response) => {
    const data = response?.data;

    if (Array.isArray(data)) {
      return {
        ...response,
        data: {
          count: data.length,
          results: data,
        },
      };
    }

    if (data && Array.isArray(data.results) && typeof data.count !== 'number') {
      return {
        ...response,
        data: {
          ...data,
          count: data.results.length,
        },
      };
    }

    return response;
  },
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
export const createCountry = (data) => api.post('/countries/', data);
export const updateCountry = (id, data) => api.put(`/countries/${id}/`, data);
export const deleteCountry = (id) => api.delete(`/countries/${id}/`);
export const getZones = (params = {}) => api.get('/zones/', { params });
export const createZone = (data) => api.post('/zones/', data);
export const updateZone = (id, data) => api.put(`/zones/${id}/`, data);
export const deleteZone = (id) => api.delete(`/zones/${id}/`);
export const getRegions = (params = {}) => api.get('/regions/', { params });
export const createRegion = (data) => api.post('/regions/', data);
export const updateRegion = (id, data) => api.put(`/regions/${id}/`, data);
export const deleteRegion = (id) => api.delete(`/regions/${id}/`);
export const getDistricts = (params = {}) => api.get('/districts/', { params });
export const createDistrict = (data) => api.post('/districts/', data);
export const updateDistrict = (id, data) => api.put(`/districts/${id}/`, data);
export const deleteDistrict = (id) => api.delete(`/districts/${id}/`);
export const getWards = (params = {}) => api.get('/wards/', { params });
export const createWard = (data) => api.post('/wards/', data);
export const updateWard = (id, data) => api.put(`/wards/${id}/`, data);
export const deleteWard = (id) => api.delete(`/wards/${id}/`);
export const getSchools = (params = {}) => api.get('/schools/', { params });
export const getSchoolById = (id) => api.get(`/schools/${id}/`);
export const getSchoolOwnershipTypes = (params = {}) => api.get('/school-ownership-types/', { params }); // New endpoint for school ownership types
export const getAllCountries = (params = {}) => getAllRecords('/countries/', params);
export const getAllZones = (params = {}) => getAllRecords('/zones/', params);
export const getAllRegions = (params = {}) => getAllRecords('/regions/', params);
export const getAllDistricts = (params = {}) => getAllRecords('/districts/', params);
export const getAllWards = (params = {}) => getAllRecords('/wards/', params);
export const getAllSchools = (params = {}) => getAllRecords('/schools/', params);
export const getRegistrationLocations = () => api.get('/registration-locations/');
export const createSchool = (data) => api.post('/schools/', data);
export const updateSchool = (id, data) => api.put(`/schools/${id}/`, data);
export const deleteSchool = (id) => api.delete(`/schools/${id}/`);

// ==================== USER MANAGEMENT ====================

export const getCurrentUser = () => api.get('/users/current/');
export const getUserStats = () => api.get('/users/stats/');
export const getUsers = (params = {}) => api.get('/users/', { params });
export const createUser = (data) => api.post('/users/', data);
export const updateUser = (id, data) => api.put(`/users/${id}/`, data);
export const deleteUser = (id) => api.delete(`/users/${id}/`);

// ==================== TALENT SYSTEM ====================

export const getTalents = (params = {}) => api.get('/talents/', { params });
export const getAllTalents = (params = {}) => getAllRecords('/talents/', params);
export const getTalentCategories = (params = {}) => api.get('/talent-categories/', { params });
export const getTalentById = (id) => api.get(`/talents/${id}/`);
export const createTalent = (data) => api.post('/talents/', data);
export const updateTalent = (id, data) => api.put(`/talents/${id}/`, data);
export const deleteTalent = (id) => api.delete(`/talents/${id}/`);

export const getCountryClubs = (params = {}) => api.get('/country-clubs/', { params });


export const getStudentTalents = (params = {}) => api.get('/student-talents/', { params });
export const getStudentTalentById = (id) => api.get(`/student-talents/${id}/`);
export const createStudentTalent = (data) => api.post('/student-talents/', data);
export const updateStudentTalent = (id, data) => api.put(`/student-talents/${id}/`, data);
export const deleteStudentTalent = (id) => api.delete(`/student-talents/${id}/`);

// ==================== CLUBS AND EVALUATIONS ====================

export const getClubs = (params = {}) => api.get('/clubs/', { params });
export const createClub = (data) => api.post('/clubs/', data);
export const updateClub = (id, data) => api.put(`/clubs/${id}/`, data);
export const deleteClub = (id) => api.delete(`/clubs/${id}/`);
export const getClubTeachers = (params = {}) => api.get('/club-teachers/', { params });
export const createClubTeacher = (data) => api.post('/club-teachers/', data);
export const deleteClubTeacher = (id) => api.delete(`/club-teachers/${id}/`);
export const getClubMemberships = (params = {}) => api.get('/club-memberships/', { params });
export const createClubMembership = (data) => api.post('/club-memberships/', data);
export const updateClubMembership = (id, data) => api.patch(`/club-memberships/${id}/`, data);
export const deleteClubMembership = (id) => api.delete(`/club-memberships/${id}/`);
export const getEvaluations = (params = {}) => api.get('/evaluations/', { params });
export const getEvaluationCriteria = (params = {}) => api.get('/evaluation-criteria/', { params });
export const createEvaluation = (data) => api.post('/evaluations/', data);
export const createEvaluationScore = (data) => api.post('/evaluation-scores/', data);
export const createTalentSubmission = (data) => api.post('/talent-submissions/', data);
export const getMessages = (params = {}) => api.get('/messages/', { params });
export const sendMessage = (data) => api.post('/messages/', data);

// ==================== STUDENTS ====================

export const getStudents = (params = {}) => api.get('/students/', { params });
export const getEducationLevels = (params = {}) => api.get('/education-levels/', { params });
export const getAllStudents = (params = {}) => getAllRecords('/students/', params);
export const getStudentById = (id) => api.get(`/students/${id}/`);
export const createStudent = (data) => api.post('/students/', data);
export const registerStudent = (data) => api.post('/students/register/', data);
export const updateStudent = (id, data) => api.patch(`/students/${id}/`, data);
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
export const getEligibleForPromotion = (params = {}) => api.get('/competitions/eligible_for_promotion/', { params });
export const uploadBulkResults = (formData) => api.post('/competitions/bulk-upload/', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

// ==================== COMPETITION PARTICIPATION ====================

export const getParticipations = (params = {}) => api.get('/participations/', { params });
export const createParticipation = (data) => api.post('/participations/', data);
export const getParticipationById = (id) => api.get(`/participations/${id}/`);
export const updateParticipation = (id, data) => api.put(`/participations/${id}/`, data);
export const deleteParticipation = (id) => api.delete(`/participations/${id}/`);

// ==================== RESULTS ====================

export const getResults = (params = {}) => api.get('/results/', { params });
export const getResultById = (id) => api.get(`/results/${id}/`);
export const createResult = (data) => api.post('/results/', data);
export const promoteStudents = (data) => api.post('/result-promotions/promote/', data);
export const getResultPromotions = (params = {}) => api.get('/result-promotions/', { params });

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
