import React from "react";
import { useLocation } from "react-router-dom";
import StayOrBack from "../../components/Common/StayOrBack";
import { useAuth } from "../../context/AuthContext";
import AdherentsPage from "../Adherent/AdherentsPage";
import MoniteursPage from "../Moniteur/MoniteursPage";
import PresidentsPage from "../President/PresidentsPage";
import TresoriersPage from "../Tresorier/TresoriersPage";

const getTabFromPath = (pathname) => {
  if (pathname.startsWith("/moniteurs")) return "moniteurs";
  if (pathname.startsWith("/presidents")) return "presidents";
  if (pathname.startsWith("/tresoriers")) return "tresoriers";
  return "adherents";
};

// Composant-coquille pour les 12 routes /adherents(/create|/edit/:id),
// /moniteurs(...), /presidents(...), /tresoriers(...) — voir App.jsx, elles
// rendent maintenant TOUTES ce même composant. C'est ce qui permet à
// react-router de ne jamais le démonter en changeant d'onglet (TabBar,
// voir constants/roleTabs.js) : deux <Route> qui rendent le même type de
// composant à la même position ne sont pas remontées par React, seules
// les props changent. Contrairement à Sorties/Plongées (une seule liste,
// juste filtrée différemment via ?query), Adhérents/Moniteurs/Présidents/
// Trésoriers sont 4 modèles de données distincts — la seule façon
// d'obtenir le même zéro-rechargement est de les garder tous les 4
// montés en permanence et de ne basculer que leur affichage (CSS
// `hidden`), plutôt que de démonter/remonter la page active à chaque
// clic d'onglet.
//
// Les anciens ProtectedRoute par-route (réservées président pour
// Moniteurs/Présidents/Trésoriers) sont remplacés par cette vérification
// interne : mettre le garde-fou sur la route elle-même aurait re-introduit
// des éléments de types différents selon la route (ProtectedRoute vs
// MembresPage nu), donc à nouveau un démontage à chaque bascule.
const MembresPage = () => {
  const location = useLocation();
  const { hasRole } = useAuth();
  const { pathname } = location;
  const activeTab = getTabFromPath(pathname);
  const isPresident = hasRole(["president"]);

  // Moniteurs/Présidents/Trésoriers sont réservés président en entier ;
  // sur Adhérents (ouvert à moniteur/trésorier), seuls créer/modifier/
  // communication le restent (AdherentFormModal/AdherentForm/
  // AdherentCommunicationModal n'ont eux-mêmes aucune garde de rôle —
  // c'était jusqu'ici la route /adherents/create|/edit/:id|/communication,
  // en ProtectedRoute à part, qui portait cette restriction ; supprimée
  // avec la fusion en un seul composant, à réappliquer ici).
  const needsPresident =
    activeTab !== "adherents" ||
    pathname.startsWith("/adherents/create") ||
    pathname.startsWith("/adherents/edit/") ||
    pathname.startsWith("/adherents/communication");
  if (needsPresident && !isPresident) {
    return <StayOrBack />;
  }

  return (
    <>
      <div className={activeTab === "adherents" ? "" : "hidden"}>
        <AdherentsPage />
      </div>
      {/* Moniteurs/Présidents/Trésoriers : montés seulement pour un
          président (seul rôle à voir ces onglets, voir
          constants/roleTabs.js) — inutile qu'un moniteur/trésorier
          consultant Adhérents télécharge ces 3 listes en arrière-plan. */}
      {isPresident && (
        <>
          <div className={activeTab === "moniteurs" ? "" : "hidden"}>
            <MoniteursPage />
          </div>
          <div className={activeTab === "presidents" ? "" : "hidden"}>
            <PresidentsPage />
          </div>
          <div className={activeTab === "tresoriers" ? "" : "hidden"}>
            <TresoriersPage />
          </div>
        </>
      )}
    </>
  );
};

export default MembresPage;
