import api from './axios';

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const employeeApi = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
};

export const attendanceApi = {
  checkIn: (data) => api.post('/attendance/check-in', data),
  checkOut: (data) => api.post('/attendance/check-out', data),
  getToday: () => api.get('/attendance/today'),
  getMyHistory: (params) => api.get('/attendance/my-history', { params }),
  getTeamAttendance: (params) => api.get('/attendance/team', { params }),
  getAllAttendance: (params) => api.get('/attendance/all', { params }),
};

export const leaveApi = {
  apply: (data) => api.post('/leaves', data),
  getMyLeaves: () => api.get('/leaves/my-leaves'),
  getForReview: (params) => api.get('/leaves', { params }),
  review: (id, data) => api.patch(`/leaves/${id}/review`, data),
  cancel: (id) => api.patch(`/leaves/${id}/cancel`),
};

export const announcementApi = {
  getAll: (params) => api.get('/announcements', { params }),
  getById: (id) => api.get(`/announcements/${id}`),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
};

export const trainingApi = {
  getAll: (params) => api.get('/trainings', { params }),
  getById: (id) => api.get(`/trainings/${id}`),
  create: (data) => api.post('/trainings', data),
  update: (id, data) => api.put(`/trainings/${id}`, data),
  enroll: (id, data) => api.post(`/trainings/${id}/enroll`, data),
  delete: (id) => api.delete(`/trainings/${id}`),
};

export const notificationApi = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard'),
};
