import React from "react";
import { useLocation } from "react-router-dom";
import StayOrBack from "../../components/Common/StayOrBack";
import { useAuth } from "../../context/AuthContext";
import SortiesPage from "./SortiesPage";
import SortieCartePage from "./SortieCartePage";
import IncidentsPage from "../Incident/IncidentsPage";

const getTabFromPath = (pathname) => {
  if (pathname.startsWith("/sorties/carte")) return "carte";
  if (pathname.startsWith("/incidents")) return "incidents";
  return "sorties";
};

// Composant-coquille pour les routes /sorties(/create|/edit/:id|/:id),
// /sorties/carte et /incidents(/create|/edit/:id|/:id) — voir App.jsx,
// elles rendent maintenant TOUTES ce même composant. Même principe que
// MembresPage.jsx/MaterielGroupPage.jsx/FormationGroupPage.jsx : deux
// <Route> qui rendent le même type de composant à la même position ne
// sont pas remontées par React en changeant d'onglet (TabBar, voir
// useSortieTabs.js) — seule la div CSS `hidden` bascule, la page active
// ne se démonte/remonte jamais (pas de nouveau chargement de données à
// chaque clic). Contrairement à Adhérents/Moniteurs/Présidents/
// Trésoriers (4 modèles disjoints), Sorties/Carte partagent déjà les
// mêmes données (useSorties) — seul Incidents est un modèle à part,
// même raisonnement que Moniteurs/Présidents/Trésoriers dans
// MembresPage : monté seulement pour les rôles qui voient cet onglet.
const SortieGroupPage = () => {
  const location = useLocation();
  const { hasRole } = useAuth();
  const { pathname } = location;
  const activeTab = getTabFromPath(pathname);
  const isStaff = hasRole(["president", "moniteur"]);

  // Incidents (tout l'onglet) et création/modification d'une sortie sont
  // réservés président/moniteur — c'étaient jusqu'ici des ProtectedRoute
  // à part (voir App.jsx) ; supprimées avec la fusion en un seul
  // composant (un ProtectedRoute par route aurait réintroduit des
  // éléments de types différents selon la route, donc un démontage à
  // chaque bascule), à réappliquer ici. /sorties, /sorties/carte et
  // /sorties/:id restent ouverts à l'adhérent (déjà garanti par la
  // ProtectedRoute posée sur la route de mise en page du groupe, voir
  // App.jsx).
  const needsStaff =
    activeTab === "incidents" ||
    pathname.startsWith("/sorties/create") ||
    pathname.startsWith("/sorties/edit/");
  if (needsStaff && !isStaff) {
    return <StayOrBack />;
  }

  return (
    <>
      <div className={activeTab === "sorties" ? "" : "hidden"}>
        <SortiesPage />
      </div>
      <div className={activeTab === "carte" ? "" : "hidden"}>
        <SortieCartePage />
      </div>
      {/* Incidents : monté seulement pour président/moniteur (seuls rôles
          à voir cet onglet, voir useSortieTabs.js) — inutile qu'un
          adhérent consultant Sorties télécharge cette liste en arrière-
          plan. */}
      {isStaff && (
        <div className={activeTab === "incidents" ? "" : "hidden"}>
          <IncidentsPage />
        </div>
      )}
    </>
  );
};

export default SortieGroupPage;
