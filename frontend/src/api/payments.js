import client from './client';
export const getTransactions = (params) => client.get('/payments/transactions/', { params });
export const getInvoices = () => client.get('/payments/invoices/');
export const createPaymentIntent = (data) => client.post('/payments/create-intent/', data);
export const requestRefund = (data) => client.post('/payments/refunds/request/', data);
export const getRefunds = () => client.get('/payments/refunds/');
