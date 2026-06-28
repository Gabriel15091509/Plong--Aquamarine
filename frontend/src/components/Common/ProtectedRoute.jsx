import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ 
  children, 
  requiredPermission = null,
  requiredRoles = [],
  fallbackPath = '/dashboard'
}) => {
  const { user, loading, hasPermission, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier les rôles
  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Vérifier les permissions
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default ProtectedRoute;