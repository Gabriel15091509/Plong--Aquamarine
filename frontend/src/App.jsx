import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./utils/queryClient";
import { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";

// Layout
import Layout from "./components/Layout/Layout";

// Pages
import UserCreatePage from "./pages/User/UserCreatePage";
import ChangePasswordPage from "./pages/Auth/ChangePasswordPage";
import LoginPage from "./pages/Auth/LoginPage";
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/Auth/ResetPasswordPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import MembresPage from "./pages/Membres/MembresPage";
import DossierGroupPage from "./pages/Dossier/DossierGroupPage";
import PaiementsPage from "./pages/Paiement/PaiementsPage";
import SortieGroupPage from "./pages/Sortie/SortieGroupPage";
import InscriptionsPage from "./pages/Inscription/InscriptionsPage";
import PlongeesPage from "./pages/Plongee/PlongeesPage";
import MaterielGroupPage from "./pages/Materiel/MaterielGroupPage";
import FormationGroupPage from "./pages/Formation/FormationGroupPage";
import CalendrierPage from "./pages/Common/CalendrierPage";
import AboutPage from "./pages/Common/AboutPage";
import PublicAboutPage from "./pages/Common/PublicAboutPage";
import PrivacyPolicyPage from "./pages/Common/PrivacyPolicyPage";
import NotFoundPage from "./pages/Common/NotFoundPage";
import UnauthorizedPage from "./pages/Auth/UnauthorizedPage";
import ProfilePage from "./pages/Common/ProfilePage";
import ParametresPage from "./pages/Common/ParametresPage";
import NotificationsPage from "./pages/Notification/NotificationsPage";
import SortiePointage from "./pages/Sortie/SortiePointage";

// Details Pages
import AdherentDetails from "./components/Adherent/AdherentDetails";
import AdhesionDetails from "./components/Adhesion/AdhesionDetails";
import CertificatDetails from "./components/CertificatMedical/CertificatDetails";
import PaiementDetails from "./components/Paiement/PaiementDetails";
import FormationDetails from "./components/Formation/FormationDetails";
import SpecialiteDetails from "./components/Formation/SpecialiteDetails";
import BrevetDetails from "./components/Brevet/BrevetDetails";
import MaterielDetails from "./components/Materiel/MaterielDetails";
import PlongeeDetails from "./components/Plongee/PlongeeDetails";
import SortieDetails from "./components/Sortie/SortieDetails";
import InscriptionDetails from "./components/Inscription/InscriptionDetails";
import MoniteurDetails from "./components/Moniteur/MoniteurDetails";
import PresidentDetails from "./components/President/PresidentDetails";
import TresorierDetails from "./components/Tresorier/TresorierDetails";
import IncidentDetails from "./components/Incident/IncidentDetails";
import AttributionDetails from "./components/Attribution/AttributionDetails";
import ReparationDetails from "./components/Reparation/ReparationDetails";

// Modales "seules" (routes /x/create, /x/edit/:id rendues PAR-DESSUS une
// autre page que la liste propriétaire — voir AppRoutes plus bas)
import ReparationFormModal from "./components/Reparation/ReparationFormModal";
import AttributionFormModal from "./components/Attribution/AttributionFormModal";
import MaterielFormModal from "./components/Materiel/MaterielFormModal";
import IncidentFormModal from "./components/Incident/IncidentFormModal";
import SortieFormModal from "./components/Sortie/SortieFormModal";
import InscriptionFormModal from "./components/Inscription/InscriptionFormModal";
import PlongeeFormModal from "./components/Plongee/PlongeeFormModal";
import FormationFormModal from "./components/Formation/FormationFormModal";
import CertificatFormModal from "./components/CertificatMedical/CertificatFormModal";
import PaiementFormModal from "./components/Paiement/PaiementFormModal";
import AdhesionFormModal from "./components/Adhesion/AdhesionFormModal";
import SpecialiteFormationFormModal from "./components/Formation/SpecialiteFormationFormModal";
import MoniteurFormModal from "./components/Moniteur/MoniteurFormModal";
import TresorierFormModal from "./components/Tresorier/TresorierFormModal";
import PresidentFormModal from "./components/President/PresidentFormModal";
import AdherentFormModal from "./components/Adherent/AdherentFormModal";

// Components

// Context
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/Common/ProtectedRoute";
import OfflineBanner from "./components/Common/OfflineBanner";
import SyncQueueBadge from "./components/Common/SyncQueueBadge";

// Une modale de création/édition ouverte depuis une page qui n'est PAS la
// liste propriétaire (ex. "Modifier" sur une fiche détail, "Déclarer un
// incident" depuis une sortie) doit s'afficher PAR-DESSUS cette page-là,
// sans la remplacer — les routes /x/create et /x/edit/:id rendent pourtant
// toutes `<XPage/>` (la liste) par défaut. Pattern "background location" de
// React Router v6 : quand ModalLink/useModalNavigate ont posé
// state.backgroundLocation au clic, le <Routes> principal ci-dessous continue
// d'afficher CETTE location de fond (donc la page d'origine ne bouge pas —
// `<Routes location={x}>` isole son sous-arbre dans son propre contexte de
// location, `useLocation()` y voit `x`, jamais l'URL réelle), pendant qu'un
// second <Routes>, sur l'URL réelle cette fois, ne matche plus que les
// routes de modale et affiche juste la modale par-dessus. Sans
// backgroundLocation (accès direct par URL/rafraîchissement), seul le
// <Routes> principal matche : comportement historique inchangé, liste en
// fond. Voir aussi useFormModal.js (fermeture) et le commentaire sur le
// second <Routes> plus bas (pourquoi hors Layout/AnimatePresence).
function AppRoutes() {
  const location = useLocation();
  const backgroundLocation = location.state?.backgroundLocation;

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={backgroundLocation || location}>
          {/* Page de login - sans layout */}
          <Route path="/login" element={<LoginPage />} />

              {/* "Mot de passe oublié ?" (lien de LoginPage.jsx) - sans
                  layout, sans connexion requise, comme /login. */}
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Vitrine publique "Découvrir le club" - sans layout, sans
                  connexion requise (lien depuis LoginPage). /about (plus
                  bas) reste la version protégée, accessible depuis le menu
                  une fois connecté. */}
              <Route path="/decouvrir" element={<PublicAboutPage />} />

              {/* Routes protégées - avec layout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Navigate to="/dashboard" replace />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Dashboard - accessible à tous */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DashboardPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Profile - accessible à tous */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProfilePage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Notifications - accessible à tous, chacun ne voit que les
              siennes (scope appliqué côté backend, voir AlerteService.
              getScopeForUser) */}
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <NotificationsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Changement de mot de passe */}
              <Route
                path="/change-password"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ChangePasswordPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Paramètres — point d'entrée unique pour tout ce qui EST du
                  paramétrage (thème, mot de passe, créer un utilisateur,
                  confidentialité/RGPD), lié depuis le dropdown profil de
                  Header.jsx. Accessible à tous (comme /profile ci-dessus) :
                  la garde plus stricte pour "Créer un utilisateur"
                  (manage_users) vit DANS ParametresPage, pas ici. */}
              <Route
                path="/parametres"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ParametresPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ============ MEMBRES (Adhérents/Moniteurs/Présidents/Trésoriers) ============ */}
              {/* Layout monté UNE SEULE FOIS pour tout ce groupe (voir
                  TabBar + constants/roleTabs.js, ces 4 pages partagent
                  leurs onglets) : avec une route de mise en page (élément
                  posé sur le <Route> PARENT, contenu via <Outlet/> sur les
                  enfants) plutôt qu'un <Layout> réenveloppé dans chacune,
                  Sidebar/Header ne démontent plus en changeant d'onglet à
                  l'intérieur du groupe — seul le contenu (Outlet) change.
                  Rôle le plus large du groupe (Adhérents) porté ici. */}
              <Route
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur", "tresorier"]}>
                    <Layout>
                      <Outlet />
                    </Layout>
                  </ProtectedRoute>
                }
              >
                {/* Les 12 routes ci-dessous (Adhérents/Moniteurs/
                    Présidents/Trésoriers × liste/create/edit) rendent
                    TOUTES le même composant <MembresPage/> (voir ce
                    fichier) — contrairement à Sorties/Plongées (une seule
                    liste, juste filtrée différemment via ?query), ce sont
                    4 modèles de données distincts, donc pas de simple
                    filtre possible : MembresPage garde les 4 vues montées
                    en permanence et bascule leur affichage en CSS. Rendre
                    partout EXACTEMENT le même type de composant (jamais
                    enveloppé d'un ProtectedRoute supplémentaire ici, la
                    garde président est interne à MembresPage) est ce qui
                    permet à React de ne jamais le démonter en changeant
                    d'onglet — un ProtectedRoute autour d'une seule des 12
                    routes suffirait à casser cette préservation. */}
                <Route path="/adherents" element={<MembresPage />} />
                <Route path="/adherents/create" element={<MembresPage />} />
                <Route path="/adherents/edit/:id" element={<MembresPage />} />
                {/* Communication ciblée : modale par-dessus la liste, même
                    principe que /adherents/create ci-dessus (voir
                    AdherentCommunicationModal.jsx, rendu depuis
                    AdherentList.jsx). Réservée président comme avant —
                    portée par MembresPage.needsPresident maintenant que ce
                    n'est plus une route à part. */}
                <Route path="/adherents/communication" element={<MembresPage />} />
                {/* Fiche Détails en modale par-dessus la liste, même
                    principe que /moniteurs/:id (voir AdherentDetails.jsx,
                    rendu depuis AdherentList.jsx). Pas de ProtectedRoute
                    imbriqué : même rôle que la route de mise en page
                    ci-dessus, une garde suffit. Manquait ici avant :
                    AlerteDetailsModal.jsx redirige déjà un adhérent vers
                    /profile en expliquant que cette fiche est "réservée au
                    staff", mais la route elle-même n'imposait jamais cette
                    règle — un adhérent tapant l'URL directement (ou
                    suivant un lien deviné) atteignait la fiche complète
                    d'un autre adhérent. Même restriction que /adherents
                    (liste) et canViewDossier dans AdherentDetails.jsx. */}
                <Route path="/adherents/:id" element={<MembresPage />} />

                <Route path="/moniteurs" element={<MembresPage />} />
                <Route path="/moniteurs/create" element={<MembresPage />} />
                <Route path="/moniteurs/edit/:id" element={<MembresPage />} />
                {/* La fiche Détails est désormais une modale par-dessus la
                    liste (voir MoniteurDetails.jsx, DetailsModal.jsx) —
                    même composant que /moniteurs, la liste reste montée en
                    dessous ; MoniteurDetails (rendu depuis MoniteurList.jsx)
                    s'ouvre lui-même via useDetailsModal en détectant cette
                    URL. Rôle déjà couvert par la ProtectedRoute posée sur
                    la route de mise en page du groupe (voir plus haut) +
                    MembresPage.needsPresident. */}
                <Route path="/moniteurs/:id" element={<MembresPage />} />

                <Route path="/presidents" element={<MembresPage />} />
                <Route path="/presidents/create" element={<MembresPage />} />
                <Route path="/presidents/edit/:id" element={<MembresPage />} />
                {/* Fiche Détails en modale par-dessus la liste, même
                    principe que /moniteurs/:id (voir PresidentDetails.jsx,
                    rendu depuis PresidentList.jsx). */}
                <Route path="/presidents/:id" element={<MembresPage />} />

                <Route path="/tresoriers" element={<MembresPage />} />
                <Route path="/tresoriers/create" element={<MembresPage />} />
                <Route path="/tresoriers/edit/:id" element={<MembresPage />} />
                <Route path="/tresoriers/:id" element={<MembresPage />} />
              </Route>

              {/* ============ DOSSIER (Adhésions/Certificats) ============ */}
              {/* Fusion Adhésions/Certificats : les deux représentent le
                  dossier administratif du club (licence FFESM/assurance
                  d'un côté, certificat médical de l'autre) — un seul point
                  d'entrée Sidebar (voir Sidebar.jsx), un seul composant-
                  coquille (DossierGroupPage.jsx, même principe que
                  MembresPage.jsx/MaterielGroupPage.jsx) pour que Layout ne
                  démonte plus en basculant entre les deux via TabBar (voir
                  constants/dossierTabs.js). Le garde-fou de rôle par
                  sous-route (create/edit, différent pour chaque entité) vit
                  désormais dans DossierGroupPage.jsx, pas ici — même
                  raisonnement que MembresPage.needsPresident. */}
              <Route
                path="/adhesions"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DossierGroupPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/adhesions/create"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DossierGroupPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/adhesions/edit/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DossierGroupPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/adhesions/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DossierGroupPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/certificats"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DossierGroupPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/certificats/create"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DossierGroupPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/certificats/edit/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DossierGroupPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/certificats/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DossierGroupPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ============ PAIEMENTS ============ */}
              <Route
                path="/paiements"
                element={
                  <ProtectedRoute requiredRoles={["president", "tresorier", "adherent"]}>
                    <Layout>
                      <PaiementsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              {/* /create et /edit/:id rendent la même page que /paiements —
                  PaiementForm s'affiche en modale par-dessus la liste. */}
              <Route
                path="/paiements/create"
                element={
                  <ProtectedRoute requiredRoles={["president", "tresorier"]}>
                    <Layout>
                      <PaiementsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/paiements/edit/:id"
                element={
                  <ProtectedRoute requiredRoles={["president", "tresorier"]}>
                    <Layout>
                      <PaiementsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              {/* Fiche Détails en modale par-dessus la liste, même principe
                  que /moniteurs/:id (voir PaiementDetails.jsx, rendu depuis
                  PaiementList.jsx). */}
              <Route
                path="/paiements/:id"
                element={
                  <ProtectedRoute requiredRoles={["president", "tresorier", "adherent"]}>
                    <Layout>
                      <PaiementsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ============ SORTIES (Sorties/Carte des sites/Incidents) ============ */}
              {/* Route de mise en page unique pour les 3 (voir TabBar +
                  useSortieTabs.js, ces pages partagent leurs onglets), même
                  schéma que les groupes MEMBRES/MATÉRIEL/FORMATIONS
                  ci-dessus : Layout monté UNE SEULE FOIS pour tout le
                  groupe — Sidebar/Header ne démontent plus en changeant
                  d'onglet. Comme pour MEMBRES, les 9 routes ci-dessous
                  rendent TOUTES le même composant-coquille
                  (SortieGroupPage, voir ce fichier), qui garde
                  SortiesPage/SortieCartePage/IncidentsPage montés en
                  permanence et ne bascule que leur affichage (CSS
                  `hidden`) : react-router ne démonte donc jamais le
                  contenu non plus en changeant d'onglet (zéro nouveau
                  chargement de données), pas seulement le Layout. Rendre
                  partout EXACTEMENT le même type de composant (jamais
                  enveloppé d'un ProtectedRoute supplémentaire ici, la
                  garde président/moniteur pour Incidents et
                  création/modification d'une sortie est interne à
                  SortieGroupPage) est ce qui permet cette préservation —
                  un ProtectedRoute autour d'une seule des 9 routes
                  suffirait à casser ça. */}
              <Route
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur", "adherent"]}>
                    <Layout>
                      <Outlet />
                    </Layout>
                  </ProtectedRoute>
                }
              >
                <Route path="/sorties" element={<SortieGroupPage />} />
                <Route path="/sorties/carte" element={<SortieGroupPage />} />
                {/* SortieForm s'affiche désormais en modale par-dessus
                    SortiesPage (voir useFormModal) plutôt que sur sa propre
                    page. */}
                <Route path="/sorties/create" element={<SortieGroupPage />} />
                <Route path="/sorties/edit/:id" element={<SortieGroupPage />} />
                {/* Fiche Détails en modale par-dessus la liste, même
                    principe que /moniteurs/:id (voir SortieDetails.jsx,
                    rendu depuis SortiesPage.jsx). Pas de garde
                    supplémentaire ici : même rôle que la route de mise en
                    page ci-dessus (contrairement à /plongees/:id, même
                    restriction — sans ça un trésorier tapant l'URL
                    directement, ou cliquant la carte "Prochaine sortie" du
                    dashboard, accéderait au détail d'une sortie alors
                    qu'il n'a droit de regard sur les sorties nulle part
                    ailleurs dans l'appli ; la route de mise en page ne
                    l'autorise déjà pas, une garde suffit). */}
                <Route path="/sorties/:id" element={<SortieGroupPage />} />

                <Route path="/incidents" element={<SortieGroupPage />} />
                {/* /create et /edit/:id rendent la même page que /incidents
                    — IncidentForm s'affiche en modale par-dessus la liste
                    (voir useFormModal dans IncidentList.jsx), plus en page
                    dédiée. */}
                <Route path="/incidents/create" element={<SortieGroupPage />} />
                <Route path="/incidents/edit/:id" element={<SortieGroupPage />} />
                {/* Fiche Détails en modale par-dessus la liste, même
                    principe que /moniteurs/:id (voir IncidentDetails.jsx,
                    rendu depuis IncidentList.jsx). */}
                <Route path="/incidents/:id" element={<SortieGroupPage />} />
              </Route>

              {/* Pointage de présence */}
              <Route
                path="/sorties/:id_sortie/pointage"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                    <Layout>
                      <SortiePointage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ============ INSCRIPTIONS ============ */}
              <Route
                path="/inscriptions"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <InscriptionsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              {/* /create et /edit/:id rendent la même page que /inscriptions —
                  InscriptionForm s'affiche en modale par-dessus la liste (voir
                  useFormModal dans InscriptionList.jsx), plus en page dédiée. */}
              <Route
                path="/inscriptions/create"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <InscriptionsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              {/* Fiche Détails en modale par-dessus la liste, même principe
                  que /moniteurs/:id (voir InscriptionDetails.jsx, rendu
                  depuis InscriptionList.jsx). */}
              <Route
                path="/inscriptions/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <InscriptionsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inscriptions/edit/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <InscriptionsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ============ PLONGÉES ============ */}
              <Route
                path="/plongees"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur", "adherent"]}>
                    <Layout>
                      <PlongeesPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plongees/create"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                    <Layout>
                      {/* /create et /edit/:id rendent la même page que
                          /plongees — PlongeeForm s'affiche en modale
                          par-dessus la liste (voir useFormModal). */}
                      <PlongeesPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plongees/edit/:id"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                    <Layout>
                      <PlongeesPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              {/* Fiche Détails en modale par-dessus la liste, même principe
                  que /moniteurs/:id (voir PlongeeDetails.jsx, rendu depuis
                  PlongeeList.jsx). */}
              <Route
                path="/plongees/:id"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur", "adherent"]}>
                    <Layout>
                      <PlongeesPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ============ MATÉRIEL (Matériel/Attributions/Réparations) ============ */}
              {/* Route de mise en page unique pour les 3 (voir TabBar +
                  constants/materielTabs.js), même schéma que le groupe
                  MEMBRES ci-dessus : Layout monté une seule fois, et les 12
                  routes /materiels|attributions|reparations(/create|/edit/:id)
                  rendent TOUTES le même composant-coquille
                  (MaterielGroupPage) pour que react-router ne le démonte
                  jamais en changeant d'onglet — seules les fiches détail
                  (/materiels/:id etc.) restent des composants à part.
                  Matériel/Réparations restent réservés président sans
                  exception ; Attributions ouvre en plus la liste + fiche en
                  LECTURE à moniteur/adhérent (scopée par rôle côté backend,
                  voir AttributionService.getAll : un adhérent n'y voit que
                  ses propres attributions, un moniteur celles des sorties
                  qu'il encadre) — requiredRoles ici est donc le plus large
                  du groupe (comme pour Formations ci-dessous), la garde plus
                  stricte pour Matériel/Réparations et pour créer/modifier
                  une attribution vivant DANS MaterielGroupPage, comme
                  Adhérents/création dans MembresPage. */}
              <Route
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur", "adherent"]}>
                    <Layout>
                      <Outlet />
                    </Layout>
                  </ProtectedRoute>
                }
              >
                <Route path="/materiels" element={<MaterielGroupPage />} />
                <Route path="/materiels/create" element={<MaterielGroupPage />} />
                <Route path="/materiels/edit/:id" element={<MaterielGroupPage />} />
                {/* Fiche Détails en modale par-dessus la liste, même
                    principe que /moniteurs/:id (voir MaterielDetails.jsx,
                    rendu depuis MaterielList.jsx). */}
                <Route path="/materiels/:id" element={<MaterielGroupPage />} />

                <Route path="/attributions" element={<MaterielGroupPage />} />
                <Route path="/attributions/create" element={<MaterielGroupPage />} />
                <Route path="/attributions/edit/:id" element={<MaterielGroupPage />} />
                <Route path="/attributions/:id" element={<MaterielGroupPage />} />

                <Route path="/reparations" element={<MaterielGroupPage />} />
                <Route path="/reparations/create" element={<MaterielGroupPage />} />
                <Route path="/reparations/edit/:id" element={<MaterielGroupPage />} />
                <Route path="/reparations/:id" element={<MaterielGroupPage />} />
              </Route>

              {/* ============ FORMATIONS (Formations/Spécialités/Brevets) ============ */}
              {/* Route de mise en page unique pour les 3, même schéma que les
                  groupes MEMBRES et MATÉRIEL ci-dessus (voir TabBar +
                  constants/formationTabs.js) : Layout monté une seule fois,
                  et les 11 routes /formations|specialites-formation(/create|
                  /edit/:id) + /brevets(/:id) rendent TOUTES le même
                  composant-coquille (FormationGroupPage) — seules les fiches
                  détail /formations/:id et /brevets/:id restent des
                  composants à part (rendus depuis leur liste respective,
                  voir FormationDetails.jsx/BrevetDetails.jsx). /brevets n'a
                  toujours pas de /create|/edit/:id : l'historique s'alimente
                  automatiquement, mais sa fiche détail reste consultable en
                  lecture comme toutes les autres entités. Le requiredRoles
                  ici est le plus large du groupe (Formations/Brevets,
                  ouverts à l'adhérent) : la garde plus stricte pour
                  Spécialités et la création/modification d'une formation
                  (réservées président/moniteur) vit DANS FormationGroupPage,
                  comme Adhérents/création dans MembresPage. */}
              <Route
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur", "adherent"]}>
                    <Layout>
                      <Outlet />
                    </Layout>
                  </ProtectedRoute>
                }
              >
                <Route path="/formations" element={<FormationGroupPage />} />
                <Route path="/formations/create" element={<FormationGroupPage />} />
                <Route path="/formations/edit/:id" element={<FormationGroupPage />} />
                {/* Fiche Détails en modale par-dessus la liste, même
                    principe que /moniteurs/:id (voir FormationDetails.jsx,
                    rendu depuis FormationList.jsx). */}
                <Route path="/formations/:id" element={<FormationGroupPage />} />

                <Route path="/specialites-formation" element={<FormationGroupPage />} />
                <Route path="/specialites-formation/create" element={<FormationGroupPage />} />
                <Route path="/specialites-formation/edit/:id" element={<FormationGroupPage />} />
                {/* Fiche Détails en modale par-dessus la liste, même principe
                    que /formations/:id (voir SpecialiteDetails.jsx, rendu
                    depuis SpecialiteFormationList.jsx). */}
                <Route path="/specialites-formation/:id" element={<FormationGroupPage />} />

                <Route path="/brevets" element={<FormationGroupPage />} />
                {/* Fiche Détails en modale par-dessus la liste, même
                    principe que /moniteurs/:id (voir BrevetDetails.jsx,
                    rendu depuis BrevetList.jsx). */}
                <Route path="/brevets/:id" element={<FormationGroupPage />} />
              </Route>

              {/* ============ CALENDRIER ============ */}
              <Route
                path="/calendrier"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CalendrierPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ============ À PROPOS ============ */}
              <Route
                path="/about"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <AboutPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ============ CONFIDENTIALITÉ (RGPD) ============ */}
              <Route
                path="/confidentialite"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PrivacyPolicyPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ============ GESTION DES UTILISATEURS ============ */}
              {/* La liste générique "/users" (UsersPage) a été supprimée —
                  sa gestion de compte (statut, mot de passe, rôle,
                  suppression) vit désormais sur la fiche Détails de
                  chaque moniteur/président/trésorier/adhérent (voir
                  AccountManagementCard.jsx). La création de compte reste
                  une fonctionnalité à part (toujours liée depuis
                  Header.jsx), donc cette route est conservée. */}
              <Route
                path="/users/create"
                element={
                  <ProtectedRoute requiredPermission="manage_users">
                    <Layout>
                      <UserCreatePage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ============ PAGES D'ERREUR ============ */}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>

      {/* Routes "modale seule" : ne matchent que l'URL RÉELLE (pas de prop
          `location` — ambiante), et seulement si une backgroundLocation a
          été fournie par ModalLink/useModalNavigate au clic — sinon (accès
          direct par URL/rafraîchissement) le <Routes> principal ci-dessus
          reprend seul la main, liste en fond, comportement historique
          inchangé. Volontairement HORS de l'AnimatePresence ci-dessus (qui
          gère la transition entre PAGES de fond, pas les modales — la
          modale a déjà sa propre animation, voir FormModal.jsx, portée sur
          document.body via ModalOverlay.jsx) et SANS <Layout> (déjà monté
          une fois par le <Routes> principal pour la page de fond — pas
          question d'en monter un second Sidebar/Header/ChatAssistant). */}
      {backgroundLocation && (
        <Routes>
          {/* Une paire de <Route> par entité, au fil des lots de migration
              (voir le plan) — requiredRoles copiés tels quels depuis les
              routes /x/create et /x/edit/:id correspondantes ci-dessus. */}
          <Route
            path="/reparations/create"
            element={
              <ProtectedRoute requiredRoles={["president"]}>
                <ReparationFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reparations/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["president"]}>
                <ReparationFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reparations/:id"
            element={
              <ProtectedRoute requiredRoles={["president"]}>
                <ReparationDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attributions/create"
            element={
              <ProtectedRoute requiredRoles={["president"]}>
                <AttributionFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attributions/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["president"]}>
                <AttributionFormModal />
              </ProtectedRoute>
            }
          />
          {/* Lecture seule ouverte à president/moniteur/adherent, comme la
              route homonyme du groupe MATÉRIEL ci-dessus (voir son
              commentaire) — AttributionDetails.jsx masque déjà lui-même
              toute action de gestion (canManageAttribution) derrière le
              rôle président ; ne restait que CETTE route (ouverte depuis
              une AUTRE page via ModalLink, ex. SortieDetails/
              AdherentDetails/MaterielDetails) à réserver par erreur au seul
              président, empêchant moniteur/adhérent d'ouvrir la fiche alors
              qu'ils le peuvent déjà en cliquant depuis /attributions. */}
          <Route
            path="/attributions/:id"
            element={
              <ProtectedRoute requiredRoles={["president", "moniteur", "adherent"]}>
                <AttributionDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/materiels/create"
            element={
              <ProtectedRoute requiredRoles={["president"]}>
                <MaterielFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/materiels/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["president"]}>
                <MaterielFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/materiels/:id"
            element={
              <ProtectedRoute requiredRoles={["president"]}>
                <MaterielDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/incidents/create"
            element={
              <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                <IncidentFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/incidents/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                <IncidentFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/incidents/:id"
            element={
              <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                <IncidentDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sorties/create"
            element={
              <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                <SortieFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sorties/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                <SortieFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sorties/:id"
            element={
              <ProtectedRoute requiredRoles={["president", "moniteur", "adherent"]}>
                <SortieDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inscriptions/create"
            element={
              <ProtectedRoute>
                <InscriptionFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inscriptions/edit/:id"
            element={
              <ProtectedRoute>
                <InscriptionFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inscriptions/:id"
            element={
              <ProtectedRoute>
                <InscriptionDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plongees/create"
            element={
              <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                <PlongeeFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plongees/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                <PlongeeFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plongees/:id"
            element={
              <ProtectedRoute requiredRoles={["president", "moniteur", "adherent"]}>
                <PlongeeDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/formations/create"
            element={
              <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                <FormationFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/formations/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                <FormationFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/formations/:id"
            element={
              <ProtectedRoute requiredRoles={["president", "moniteur", "adherent"]}>
                <FormationDetails />
              </ProtectedRoute>
            }
          />
          {/* Ouvert depuis une AUTRE page (ModalLink), ex. "Historique des
              brevets" dans AdherentDetails.jsx — même rôles que /brevets
              lui-même (voir brevetRoutes.js), aucun /create|/edit/:id ici,
              l'historique s'alimentant automatiquement. */}
          <Route
            path="/brevets/:id"
            element={
              <ProtectedRoute requiredRoles={["president", "moniteur", "adherent"]}>
                <BrevetDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/certificats/create"
            element={
              <ProtectedRoute requiredRoles={["president", "adherent"]}>
                <CertificatFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/certificats/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["president"]}>
                <CertificatFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/certificats/:id"
            element={
              <ProtectedRoute>
                <CertificatDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/paiements/create"
            element={
              <ProtectedRoute requiredRoles={["president", "tresorier"]}>
                <PaiementFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/paiements/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["president", "tresorier"]}>
                <PaiementFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/paiements/:id"
            element={
              <ProtectedRoute requiredRoles={["president", "tresorier", "adherent"]}>
                <PaiementDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adhesions/create"
            element={
              <ProtectedRoute requiredRoles={["president", "tresorier", "adherent"]}>
                <AdhesionFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adhesions/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["president", "tresorier"]}>
                <AdhesionFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adhesions/:id"
            element={
              <ProtectedRoute>
                <AdhesionDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/specialites-formation/create"
            element={
              <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                <SpecialiteFormationFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/specialites-formation/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                <SpecialiteFormationFormModal />
              </ProtectedRoute>
            }
          />
          {/* Ouvert depuis une AUTRE page (ModalLink) — posée par
              précaution/cohérence avec le trio create/edit ci-dessus (voir
              SpecialiteDetails.jsx), même si aucune page externe n'y renvoie
              encore aujourd'hui. */}
          <Route
            path="/specialites-formation/:id"
            element={
              <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                <SpecialiteDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/moniteurs/create"
            element={
              <ProtectedRoute requiredRoles={["president"]}>
                <MoniteurFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/moniteurs/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["president"]}>
                <MoniteurFormModal />
              </ProtectedRoute>
            }
          />
          {/* Fiches Détails ouvertes depuis une AUTRE page (ModalLink) —
              posées par précaution/cohérence avec chaque trio create/edit
              ci-dessus (voir MoniteurDetails.jsx/PresidentDetails.jsx/
              TresorierDetails.jsx). */}
          <Route
            path="/moniteurs/:id"
            element={
              <ProtectedRoute requiredRoles={["president"]}>
                <MoniteurDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tresoriers/create"
            element={
              <ProtectedRoute requiredRoles={["president"]}>
                <TresorierFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tresoriers/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["president"]}>
                <TresorierFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tresoriers/:id"
            element={
              <ProtectedRoute requiredRoles={["president"]}>
                <TresorierDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/presidents/create"
            element={
              <ProtectedRoute requiredRoles={["president"]}>
                <PresidentFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/presidents/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["president"]}>
                <PresidentFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/presidents/:id"
            element={
              <ProtectedRoute requiredRoles={["president"]}>
                <PresidentDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adherents/create"
            element={
              <ProtectedRoute requiredRoles={["president"]}>
                <AdherentFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adherents/edit/:id"
            element={
              <ProtectedRoute requiredRoles={["president"]}>
                <AdherentFormModal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adherents/:id"
            element={
              <ProtectedRoute requiredRoles={["president", "moniteur", "tresorier"]}>
                <AdherentDetails />
              </ProtectedRoute>
            }
          />
        </Routes>
      )}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineBanner />
      <SyncQueueBadge />
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
            borderRadius: "12px",
            padding: "16px",
          },
          success: {
            style: {
              background: "#10B981",
              color: "#fff",
            },
          },
          error: {
            style: {
              background: "#EF4444",
              color: "#fff",
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
