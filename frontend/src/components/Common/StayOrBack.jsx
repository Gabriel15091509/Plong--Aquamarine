import React, { useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

// Accès refusé à un lien : on ne renvoie pas vers le dashboard, on reste
// sur la page d'où vient l'utilisateur (retour arrière = la page ne change
// pas). Sans historique interne (URL tapée / page rechargée, location.key
// === "default"), il n'y a aucune page "d'où rester" : repli sur `fallback`.
const StayOrBack = ({ fallback = "/dashboard", state }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasHistory = location.key !== "default";

  useEffect(() => {
    if (hasHistory) navigate(-1);
  }, [hasHistory, navigate]);

  if (hasHistory) return null;
  return <Navigate to={fallback} replace state={state} />;
};

export default StayOrBack;
