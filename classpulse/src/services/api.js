import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────
//  API Client — Axios instance for ClassPulse Flask backend
//  Change BASE_URL to your server IP when deploying.
// ─────────────────────────────────────────

const BASE_URL = 'http://192.168.1.39:5000'; // ← Change to your Flask server IP

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('cp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ──────────────────────────────────────────
//  AUTH
// ──────────────────────────────────────────
export const authAPI = {
  signup:      (data) => api.post('/api/auth/signup', data),
  login:       (data) => api.post('/api/auth/login', data),
  parentLogin: (data) => api.post('/api/auth/parent-login', data),
  getProfile:  ()     => api.get('/api/auth/profile'),
  searchTuitions: (q) => api.get(`/api/tuitions/search?q=${q}`),
};

// ──────────────────────────────────────────
//  DASHBOARD
// ──────────────────────────────────────────
export const dashboardAPI = {
  get: () => api.get('/api/dashboard'),
};

// ──────────────────────────────────────────
//  STUDENTS
// ──────────────────────────────────────────
export const studentsAPI = {
  getAll:       (showInactive = false) => api.get(`/api/students?show_inactive=${showInactive}`),
  getOne:       (id)    => api.get(`/api/students/${id}`),
  add:          (data)  => api.post('/api/students', data),
  update:       (id, data) => api.put(`/api/students/${id}`, data),
  delete:       (id)    => api.delete(`/api/students/${id}`),
  toggleActive: (id)    => api.post(`/api/students/${id}/toggle-active`),
};

// ──────────────────────────────────────────
//  ATTENDANCE
// ──────────────────────────────────────────
export const attendanceAPI = {
  getByDate:     (date, session = 'Evening') => api.get(`/api/attendance?date=${date}&session=${session}`),
  saveBulk:      (data) => api.post('/api/attendance/bulk', data),
  getMonthlyStats: (month) => api.get(`/api/attendance/monthly-stats?month=${month}`),
};

// ──────────────────────────────────────────
//  DAILY ACTIVITIES
// ──────────────────────────────────────────
export const activitiesAPI = {
  add:      (data)              => api.post('/api/activities', data),
  getByStudent: (studentId, month) => api.get(`/api/activities/${studentId}?month=${month}`),
  delete:   (activityId)        => api.delete(`/api/activities/${activityId}`),
};

// ──────────────────────────────────────────
//  FEES
// ──────────────────────────────────────────
export const feesAPI = {
  getByMonth:    (month)          => api.get(`/api/fees?month=${month}`),
  quickPay:      (data)           => api.post('/api/fees/quick-pay', data),
  getStudentFees:(studentId)      => api.get(`/api/fees/student/${studentId}`),
  updateFee:     (feeId, data)    => api.put(`/api/fees/${feeId}`, data),
};

// ──────────────────────────────────────────
//  ANNOUNCEMENTS
// ──────────────────────────────────────────
export const announcementsAPI = {
  getAll: ()     => api.get('/api/announcements'),
  add:    (data) => api.post('/api/announcements', data),
  delete: (id)   => api.delete(`/api/announcements/${id}`),
};

// ──────────────────────────────────────────
//  PARENT REPORTS
// ──────────────────────────────────────────
export const reportsAPI = {
  getAll:  ()     => api.get('/api/reports'),
  submit:  (data) => api.post('/api/reports', data),
};

// ──────────────────────────────────────────
//  ANALYTICS
// ──────────────────────────────────────────
export const analyticsAPI = {
  get: () => api.get('/api/analytics'),
};

// ──────────────────────────────────────────
//  PARENT PORTAL
// ──────────────────────────────────────────
export const parentAPI = {
  getHome:       ()                    => api.get('/api/parent/home'),
  getActivities: (studentId, month)    => api.get(`/api/parent/activities/${studentId}?month=${month}`),
};

export default api;
