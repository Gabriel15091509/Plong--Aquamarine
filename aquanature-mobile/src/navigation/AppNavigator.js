// src/navigation/AppNavigator.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AppNavigator = () => {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? <MainTabs /> : <AuthStack />;
};

export default AppNavigator;