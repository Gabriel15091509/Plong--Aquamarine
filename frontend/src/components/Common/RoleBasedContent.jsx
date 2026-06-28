import React from "react";
import { useAuth } from "../../context/AuthContext";

const RoleBasedContent = ({
  children,
  roles = [],
  permissions = [],
  fallback = null,
}) => {
  const { hasRole, hasPermission } = useAuth();

  const hasAccess = () => {
    if (roles.length > 0) {
      const roleMatch = roles.some((role) => hasRole([role]));
      if (!roleMatch) return false;
    }

    if (permissions.length > 0) {
      const permissionMatch = permissions.some((perm) => hasPermission(perm));
      if (!permissionMatch) return false;
    }

    return true;
  };

  if (!hasAccess()) {
    return fallback;
  }

  return children;
};

export default RoleBasedContent;
