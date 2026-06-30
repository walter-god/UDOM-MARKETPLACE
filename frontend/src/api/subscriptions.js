import client from './client';
export const getPlans = () => client.get('/subscriptions/plans/');
export const subscribe = (data) => client.post('/subscriptions/subscribe/', data);
export const getMySubscription = () => client.get('/subscriptions/my/');
export const cancelSubscription = () => client.post('/subscriptions/cancel/');
export const getSubscriptionHistory = () => client.get('/subscriptions/history/');
export const getAllSubscriptions = (params) => client.get('/subscriptions/all/', { params });
