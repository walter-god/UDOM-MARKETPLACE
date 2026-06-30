import client from './client';
export const getReviews = (params) => client.get('/reviews/', { params });
export const createReview = (data) => client.post('/reviews/', data);
export const updateReview = (id, data) => client.patch(`/reviews/${id}/`, data);
export const deleteReview = (id) => client.delete(`/reviews/${id}/`);
export const markHelpful = (id) => client.post(`/reviews/${id}/helpful/`);
export const respondToReview = (id, response) => client.post(`/reviews/${id}/respond/`, { response });
