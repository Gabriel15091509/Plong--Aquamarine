import React from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdhesionsPage from "../Adhesion/AdhesionsPage";
import CertificatsPage from "../CertificatMedical/CertificatsPage";

const getTabFromPath = (pathname) => {
  if (pathname.startsWith("/certificats")) return "certificats";
  return "adhesions";
};

// Composant-coquille pour les 8 routes /adhesions(/create|/edit/:id|/:id),
// /certificats(...) — voir App.jsx, elles rendent maintenant TOUTES ce
// même composant, même principe que MembresPage.jsx (Adhérents/Moniteurs/
// Présidents/Trésoriers) et MaterielGroupPage.jsx (Matériel/Attributions/
// Réparations) : Adhésions et Certificats représentent tous deux le
// dossier administratif du club (licence FFESM/assurance d'un côté,
// certificat médical de l'autre) — un seul point d'entrée Sidebar plutôt
// que deux, avec Layout gardé monté en permanence pendant la bascule
// d'onglet (voir constants/dossierTabs.js, affiché depuis
// AdhesionList.jsx/CertificatList.jsx).
//
// Les deux pages sont ouvertes en lecture à tous les rôles connectés
// (aucune garde n'était posée sur /adhesions ni /certificats eux-mêmes) ;
// seuls create/edit restent restreints, avec des rôles différents pour
// chaque entité — les anciens ProtectedRoute par-route qui portaient ça
// sont remplacés par cette vérification interne, même raisonnement que
// MembresPage.needsPresident : mettre le garde-fou sur la route
// elle-même aurait réintroduit des éléments de types différents selon la
// route, donc un démontage de Layout à chaque bascule d'onglet.
const DossierGroupPage = () => {
  const location = useLocation();
  const { hasRole } = useAuth();
  const { pathname } = location;
  const activeTab = getTabFromPath(pathname);

  // Adhésion : créer/modifier réservé président/trésorier, +adherent en
  // création seule (auto-soumission de sa propre licence/assurance — voir
  // AdhesionForm, jamais l'adhésion Club elle-même).
  const deniedOnAdhesions =
    (pathname.startsWith("/adhesions/create") &&
      !hasRole(["president", "tresorier", "adherent"])) ||
    (pathname.startsWith("/adhesions/edit/") &&
      !hasRole(["president", "tresorier"]));
  // Certificat : créer/modifier réservé président, +adherent en création
  // seule (son propre certificat médical).
  const deniedOnCertificats =
    (pathname.startsWith("/certificats/create") &&
      !hasRole(["president", "adherent"])) ||
    (pathname.startsWith("/certificats/edit/") && !hasRole(["president"]));

  if (
    (activeTab === "adhesions" && deniedOnAdhesions) ||
    (activeTab === "certificats" && deniedOnCertificats)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <div className={activeTab === "adhesions" ? "" : "hidden"}>
        <AdhesionsPage />
      </div>
      <div className={activeTab === "certificats" ? "" : "hidden"}>
        <CertificatsPage />
      </div>
    </>
  );
};

export default DossierGroupPage;
