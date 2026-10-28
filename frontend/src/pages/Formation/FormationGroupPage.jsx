import React from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import FormationsPage from "./FormationsPage";
import SpecialitesFormationPage from "./SpecialitesFormationPage";
import BrevetsPage from "../Brevet/BrevetsPage";

const getTabFromPath = (pathname) => {
  if (pathname.startsWith("/specialites-formation")) return "specialites";
  if (pathname.startsWith("/brevets")) return "brevets";
  return "formations";
};

// Composant-coquille pour les 12 routes /formations(/create|/edit/:id),
// /specialites-formation(/create|/edit/:id|/:id), /brevets(/:id) — même
// principe que MembresPage.jsx (Adhérents/Moniteurs/Présidents/Trésoriers) et
// MaterielGroupPage.jsx (Matériel/Attributions/Réparations) : toutes ces
// routes rendent désormais ce même composant pour que react-router ne le
// démonte jamais en changeant d'onglet (TabBar, voir
// constants/formationTabs.js) — seules les fiches détail (/formations/:id,
// /specialites-formation/:id, /brevets/:id) restent des composants à part,
// rendus DEPUIS leur liste respective (voir FormationDetails.jsx/
// SpecialiteDetails.jsx/BrevetDetails.jsx). /brevets n'a pas de
// /create|/edit/:id : l'historique des brevets s'alimente automatiquement
// (voir BrevetList.jsx), jamais de saisie manuelle — mais sa fiche détail
// reste consultable en lecture, comme toutes les autres entités.
//
// Contrairement à Matériel (les 3 réservées président sans exception),
// Formations/Brevets restent ouverts à l'adhérent (qui n'y voit alors que
// 2 onglets, voir constants/formationTabs.js) tandis que Spécialités et la
// création/modification d'une formation restent réservées président/
// moniteur — d'où cette garde interne, comme sur MembresPage pour
// Adhérents/création.
const FormationGroupPage = () => {
  const location = useLocation();
  const { hasRole } = useAuth();
  const { pathname } = location;
  const activeTab = getTabFromPath(pathname);
  const canManage = hasRole(["president", "moniteur"]);

  const needsManage =
    activeTab === "specialites" ||
    pathname.startsWith("/formations/create") ||
    pathname.startsWith("/formations/edit/");
  if (needsManage && !canManage) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <div className={activeTab === "formations" ? "" : "hidden"}>
        <FormationsPage />
      </div>
      {canManage && (
        <div className={activeTab === "specialites" ? "" : "hidden"}>
          <SpecialitesFormationPage />
        </div>
      )}
      <div className={activeTab === "brevets" ? "" : "hidden"}>
        <BrevetsPage />
      </div>
    </>
  );
};

export default FormationGroupPage;
