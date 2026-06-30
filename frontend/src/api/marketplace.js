import client from './client';

export const PROJECT_TYPES = [
  { value: 'fyp',      label: 'Final Year Project', short: 'FYP',      color: 'bg-blue-100 text-blue-700' },
  { value: 'research', label: 'Research Project',   short: 'Research', color: 'bg-purple-100 text-purple-700' },
  { value: 'personal', label: 'Personal Project',   short: 'Personal', color: 'bg-green-100 text-green-700' },
  { value: 'others',   label: 'Others',             short: 'Others',   color: 'bg-gray-100 text-gray-600' },
];

export const getProjects = (params) => client.get('/marketplace/projects/', { params });
export const getAdminProjects = (params) => client.get('/marketplace/admin/projects/', { params });
export const getProject = (slug) => client.get(`/marketplace/projects/${slug}/`);
export const createProject = (data) => client.post('/marketplace/projects/create/', data);
export const updateProject = (id, data) => client.patch(`/marketplace/projects/${id}/update/`, data);
export const getMyProjects = () => client.get('/marketplace/projects/my/');
export const getPendingProjects = () => client.get('/marketplace/projects/pending/');
export const reviewProject = (id, data) => client.post(`/marketplace/projects/${id}/review/`, data);
export const toggleBookmark = (id) => client.post(`/marketplace/projects/${id}/bookmark/`);
export const downloadProject = (id) => client.post(`/marketplace/projects/${id}/download/`);
export const getBookmarks = () => client.get('/marketplace/bookmarks/');
export const getCategories = () => client.get('/marketplace/categories/');
export const getFeaturedProjects = () => client.get('/marketplace/projects/featured/');
export const getMarketplaceStats = () => client.get('/marketplace/projects/stats/');
export const getSourceTree = (id) => client.get(`/marketplace/projects/${id}/source/`);
export const getSourceFile = (id, path) => client.get(`/marketplace/projects/${id}/source/file/`, { params: { path } });
export const subscribeToProject = (id, data) => client.post(`/marketplace/projects/${id}/subscribe/`, data);
export const getMyProjectSubscriptions = () => client.get('/marketplace/my-subscriptions/');
export const checkProjectTitle = (title, excludeId) => client.get('/marketplace/projects/check-title/', { params: { title, ...(excludeId && { exclude: excludeId }) } });
export const getSupervisedProjects = (params) => client.get('/marketplace/lecturer/supervised/', { params });
export const getSimilarTitles = (q) => client.get('/marketplace/lecturer/similar-titles/', { params: { q } });
export const assignSupervisor = (id) => client.post(`/marketplace/projects/${id}/assign-supervisor/`);
