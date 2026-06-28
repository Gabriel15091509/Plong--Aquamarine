import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setPermissions(getUserPermissions(parsedUser.role));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const getUserPermissions = (role) => {
    const permissionsMap = {
      president: ['all', 'manage_users', 'manage_staff', 'view_stats', 'manage_settings'],
      moniteur: ['manage_sorties', 'validate_plongees', 'manage_formations', 'view_adherents'],
      adherent: ['view_profile', 'inscription_sorties', 'view_carnet'],
      tresorier: ['manage_paiements', 'view_stats', 'exports']
    };
    return permissionsMap[role] || [];
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(user);
        setPermissions(getUserPermissions(user.role));
        toast.success(`Bienvenue ${user.name} !`);
        return user;
      }
      
      throw new Error('Erreur de connexion');
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur de connexion';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setPermissions([]);
    toast.success('Déconnexion réussie');
  };

  const hasPermission = (permission) => {
    return permissions.includes('all') || permissions.includes(permission);
  };

  const hasRole = (roles) => {
    return roles.includes(user?.role);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      permissions,
      hasPermission,
      hasRole
    }}>
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