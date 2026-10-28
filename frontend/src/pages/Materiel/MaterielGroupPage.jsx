import React from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import MaterielsPage from "./MaterielsPage";
import AttributionsPage from "../Attribution/AttributionsPage";
import ReparationsPage from "../Reparation/ReparationsPage";

const getTabFromPath = (pathname) => {
  if (pathname.startsWith("/attributions")) return "attributions";
  if (pathname.startsWith("/reparations")) return "reparations";
  return "materiels";
};

// Composant-coquille pour les 12 routes /materiels(/create|/edit/:id),
// /attributions(...), /reparations(...) — voir App.jsx, elles rendent
// maintenant TOUTES ce même composant, exactement comme MembresPage.jsx
// pour Adhérents/Moniteurs/Présidents/Trésoriers (même raisonnement :
// deux <Route> qui rendent le même type de composant à la même position
// ne sont pas remontées par React en changeant d'onglet — seules les
// props/l'URL changent). Matériel/Attributions/Réparations sont 3
// modèles de données distincts, donc même chose : gardés tous les 3
// montés en permanence, seul l'affichage bascule (CSS `hidden`).
//
// Garde de rôle interne, même principe que MembresPage.needsPresident :
// Matériel/Réparations restent réservés président sans exception
// (canSeeMateriel, voir Sidebar.jsx), mais Attributions ouvre sa LISTE
// (lecture, scopée par rôle côté backend — voir AttributionService.getAll)
// à moniteur/adhérent ; créer/modifier une attribution (le formulaire,
// AttributionFormModal derrière /attributions/create|edit/:id) reste
// présidentiel comme les deux autres onglets. Mettre ce garde-fou sur la
// route elle-même aurait réintroduit des éléments de types différents
// selon la route (ProtectedRoute vs MaterielGroupPage nu), donc un
// démontage à chaque bascule d'onglet — comme pour MembresPage.
const MaterielGroupPage = () => {
  const location = useLocation();
  const { hasRole } = useAuth();
  const { pathname } = location;
  const activeTab = getTabFromPath(pathname);
  const isPresident = hasRole(["president"]);

  const needsPresident =
    activeTab !== "attributions" ||
    pathname.startsWith("/attributions/create") ||
    pathname.startsWith("/attributions/edit/");
  if (needsPresident && !isPresident) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      {/* Matériel/Réparations : montés seulement pour un président (seul
          rôle à voir ces onglets, voir constants/materielTabs.js) —
          inutile qu'un moniteur/adhérent consultant Attributions
          télécharge ces 2 listes en arrière-plan. */}
      {isPresident && (
        <>
          <div className={activeTab === "materiels" ? "" : "hidden"}>
            <MaterielsPage />
          </div>
          <div className={activeTab === "reparations" ? "" : "hidden"}>
            <ReparationsPage />
          </div>
        </>
      )}
      <div className={activeTab === "attributions" ? "" : "hidden"}>
        <AttributionsPage />
      </div>
    </>
  );
};

export default MaterielGroupPage;
