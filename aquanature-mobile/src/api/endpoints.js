// src/api/endpoints.js
import apiClient from './client';

export const auth = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  changePassword: (oldPassword, newPassword) =>
    apiClient.post('/auth/change-password', { oldPassword, newPassword }),
};

export const sorties = {
  getAll: () => apiClient.get('/sorties'),
  getById: (id) => apiClient.get(`/sorties/${id}`),
  getDetails: (id) => apiClient.get(`/sorties/${id}/details`),
  getUpcoming: () => apiClient.get('/sorties/upcoming'),
  getWithInscriptions: () => apiClient.get('/sorties/with-inscriptions'),
};

export const inscriptions = {
  getAll: () => apiClient.get('/inscriptions'),
  getMine: () => apiClient.get('/inscriptions'),
  create: (data) => apiClient.post('/inscriptions', data),
  getByAdherent: () => apiClient.get('/inscriptions'),
  getByAdherentAndSortie: (numAdherent, sortieId) =>
    apiClient.get(`/inscriptions/adherent/${numAdherent}/sortie/${sortieId}`),
  getBySortie: (sortieId) => apiClient.get(`/inscriptions/sortie/${sortieId}`),
  cancel: (id) => apiClient.patch(`/inscriptions/${id}/cancel`),
  confirm: (id) => apiClient.patch(`/inscriptions/${id}/confirm`),
};

export const plongees = {
  getAll: () => apiClient.get('/plongees'),
  getByAdherent: (adherentId) => apiClient.get(`/plongees/adherent/${adherentId}`),
  create: (data) => apiClient.post('/plongees', data),
  getById: (id) => apiClient.get(`/plongees/${id}`),
  validate: (id) => apiClient.patch(`/plongees/${id}/validate`),
};

export const adherents = {
  getAll: () => apiClient.get('/adherents'),
  getById: (id) => apiClient.get(`/adherents/${id}`),
  getByEmail: (email) => apiClient.get(`/adherents/email/${encodeURIComponent(email)}`),
  update: (id, data) => apiClient.put(`/adherents/${id}`, data),
};
