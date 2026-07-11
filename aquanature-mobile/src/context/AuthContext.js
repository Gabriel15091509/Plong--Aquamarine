// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';
import { Alert } from 'react-native';

const AuthContext = createContext();

const normalizeRole = (role) =>
  (role || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const getUserPermissions = (role) => {
    const normalizedRole = normalizeRole(role);
    const permissionsMap = {
      president: ['all', 'manage_users', 'manage_staff', 'view_stats', 'manage_settings'],
      directeur_technique: ['all', 'manage_users', 'manage_staff', 'view_stats', 'manage_settings'],
      moniteur: ['manage_sorties', 'validate_plongees', 'manage_formations', 'view_adherents'],
      adherent: ['view_profile', 'inscription_sorties', 'view_carnet'],
      tresorier: ['manage_paiements', 'view_stats', 'exports'],
    };
    return permissionsMap[normalizedRole] || [];
  };

  const hydrateUserWithAdherent = async (userData) => {
    if (!userData?.email || userData?.num_adherent) return userData;

    try {
      const response = await apiClient.get(
        `/adherents/email/${encodeURIComponent(userData.email)}`
      );
      const adherent = response.data?.data;
      if (!adherent) return userData;

      return {
        ...userData,
        num_adherent: adherent.num_adherent,
        civilite: adherent.civilite,
        nom: adherent.nom,
        prenom: adherent.prenom,
        telephone: adherent.telephone || userData.phone,
        niveau: adherent.niveau,
        date_inscription: adherent.date_inscription,
        statut_adherent: adherent.statut,
      };
    } catch (error) {
      console.log('Profil adherent non charge:', error.response?.data || error.message);
      return userData;
    }
  };

  const applyAuthenticatedUser = async (token, userData) => {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    const hydratedUser = await hydrateUserWithAdherent(userData);

    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(hydratedUser));

    setUser(hydratedUser);
    setPermissions(hydratedUser.permissions || getUserPermissions(hydratedUser.role));

    return hydratedUser;
  };

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');

      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          await applyAuthenticatedUser(token, parsedUser);
        } catch {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          delete apiClient.defaults.headers.common.Authorization;
        }
      }
    } catch (error) {
      console.error('Erreur checkAuthStatus:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });

      if (response.data?.success) {
        const { token, user: userData } = response.data.data;
        const authenticatedUser = await applyAuthenticatedUser(token, userData);

        if (authenticatedUser.must_change_password) {
          Alert.alert(
            'Changement de mot de passe',
            'Veuillez changer votre mot de passe avant de continuer'
          );
          return { user: authenticatedUser, mustChangePassword: true };
        }

        return { user: authenticatedUser, mustChangePassword: false };
      }

      throw new Error('Erreur de connexion');
    } catch (error) {
      console.log('Erreur login:', error.response?.data || error.message);
      const message = error.response?.data?.message || 'Erreur de connexion au serveur';
      Alert.alert('Erreur', message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      delete apiClient.defaults.headers.common.Authorization;
      setUser(null);
      setPermissions([]);
    } catch (error) {
      console.error('Erreur logout:', error);
    }
  };

  const updateUser = async (newData) => {
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

    if (newData.permissions) setPermissions(newData.permissions);
    if (newData.token) {
      await AsyncStorage.setItem('token', newData.token);
      apiClient.defaults.headers.common.Authorization = `Bearer ${newData.token}`;
    }
  };

  const hasPermission = (permission) =>
    permissions.includes('all') || permissions.includes(permission);

  const hasRole = (roles) =>
    roles.map(normalizeRole).includes(normalizeRole(user?.role));

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoading: loading,
        isAuthenticated: !!user,
        login,
        logout,
        permissions,
        hasPermission,
        hasRole,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
