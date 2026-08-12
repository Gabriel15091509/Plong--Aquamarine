import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from './Logo';

// Pages dont l'API sous-jacente n'existe QUE sur l'Ingress local du club
// (voir k8s/overlays/production/17-ingress-public.yaml) — le contrôleur
// nginx-public qui sert l'URL Tailscale (*.ts.net) ne connaît pas
// /api/paiements, /api/materiels, etc. Sans ce garde, un président/
// trésorier connecté depuis l'extérieur atteindrait ces pages (le rôle
// est valide) mais chaque appel API échouerait silencieusement — le
// contrôleur public renvoie le HTML du frontend au lieu du JSON attendu.
// Miroir volontaire de la liste d'exclusion de l'Ingress, pas une
// coïncidence : si une route change d'un côté, l'autre doit suivre.
const LOCAL_NETWORK_ONLY_PREFIXES = [
  '/paiements',
  '/echeanciers',
  '/materiels',
  '/reparations',
  '/attributions',
  '/specialites-formation',
  '/moniteurs',
  '/presidents',
  '/tresoriers',
  '/users',
];

const ProtectedRoute = ({
  children,
  requiredPermission = null,
  requiredRoles = [],
  fallbackPath = '/dashboard'
}) => {
  const { user, loading, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    // Écran de vérification de session : à ce stade on ne sait pas
    // encore quelle page va s'afficher (liste, formulaire, fiche...),
    // donc pas de squelette qui imiterait la mauvaise forme — juste le
    // logo en pulsation, neutre pour n'importe quelle destination.
    return (
      <div
        className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900"
        role="status"
        aria-label="Vérification de la session en cours"
      >
        <Logo size="xl" className="!w-28 !h-28 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isPublicAccess =
    typeof window !== 'undefined' && window.location.hostname.endsWith('.ts.net');
  const isLocalNetworkOnlyPage = LOCAL_NETWORK_ONLY_PREFIXES.some((prefix) =>
    location.pathname.startsWith(prefix)
  );
  if (isPublicAccess && isLocalNetworkOnlyPage) {
    return (
      <Navigate
        to={fallbackPath}
        replace
        state={{
          notice:
            "Cette section n'est accessible que depuis le réseau du club.",
        }}
      />
    );
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