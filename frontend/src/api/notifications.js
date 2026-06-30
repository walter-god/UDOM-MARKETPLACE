import client from './client';
export const getNotifications = () => client.get('/notifications/');
export const getUnreadCount = () => client.get('/notifications/unread/');
export const markRead = (id) => client.post(`/notifications/${id}/read/`);
export const markAllRead = () => client.post('/notifications/mark-all-read/');
export const getAnnouncements = () => client.get('/notifications/announcements/');
export const createAnnouncement = (data) => client.post('/notifications/announcements/', data);
