import client from './client';
export const getAdminDashboard = () => client.get('/analytics/admin-dashboard/');
export const getDeveloperDashboard = () => client.get('/analytics/developer-dashboard/');
export const getPlatformStats = () => client.get('/analytics/platform-stats/');
export const getProjectStats = () => client.get('/analytics/project-stats/');
