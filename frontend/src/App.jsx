import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";

// Layout
import Layout from "./components/Layout/Layout";

// Pages
import UserCreatePage from "./pages/User/UserCreatePage";
import ChangePasswordPage from "./pages/Auth/ChangePasswordPage";
import LoginPage from "./pages/Auth/LoginPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import AdherentsPage from "./pages/Adherent/AdherentsPage";
import AdherentCreatePage from "./pages/Adherent/AdherentCreatePage";
import AdherentEditPage from "./pages/Adherent/AdherentEditPage";
import AdherentCommunicationPage from "./pages/Adherent/AdherentCommunicationPage";
import AdherentDetailsPage from "./pages/Adherent/AdherentDetailsPage";
import AdhesionsPage from "./pages/Adhesion/AdhesionsPage";
import CertificatsPage from "./pages/CertificatMedical/CertificatsPage";
import PaiementsPage from "./pages/Paiement/PaiementsPage";
import SortiesPage from "./pages/Sortie/SortiesPage";
import InscriptionsPage from "./pages/Inscription/InscriptionsPage";
import PlongeesPage from "./pages/Plongee/PlongeesPage";
import MaterielsPage from "./pages/Materiel/MaterielsPage";
import FormationsPage from "./pages/Formation/FormationsPage";
import SpecialitesFormationPage from "./pages/Formation/SpecialitesFormationPage";
import CalendrierPage from "./pages/Common/CalendrierPage";
import AboutPage from "./pages/Common/AboutPage";
import UsersPage from "./pages/User/UsersPage";
import NotFoundPage from "./pages/Common/NotFoundPage";
import UnauthorizedPage from "./pages/Auth/UnauthorizedPage";
import ProfilePage from "./pages/Common/ProfilePage";
import SortiePointage from "./pages/Sortie/SortiePointage";
import MoniteursPage from "./pages/Moniteur/MoniteursPage";
import PresidentsPage from "./pages/President/PresidentsPage";
import TresoriersPage from "./pages/Tresorier/TresoriersPage";
import IncidentsPage from "./pages/Incident/IncidentsPage";
import AttributionsPage from "./pages/Attribution/AttributionsPage";
import ReparationsPage from "./pages/Reparation/ReparationsPage";

// Details Pages
import AdhesionDetails from "./components/Adhesion/AdhesionDetails";
import CertificatDetails from "./components/CertificatMedical/CertificatDetails";
import PaiementDetails from "./components/Paiement/PaiementDetails";
import FormationDetails from "./components/Formation/FormationDetails";
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

// Components
import SortieForm from "./components/Sortie/SortieForm";
import InscriptionForm from "./components/Inscription/InscriptionForm";
import PlongeeForm from "./components/Plongee/PlongeeForm";
import MaterielForm from "./components/Materiel/MaterielForm";
import FormationForm from "./components/Formation/FormationForm";
import SpecialiteFormationForm from "./components/Formation/SpecialiteFormationForm";
import PaiementForm from "./components/Paiement/PaiementForm";
import CertificatForm from "./components/CertificatMedical/CertificatForm";
import AdhesionForm from "./components/Adhesion/AdhesionForm";
import MoniteurForm from "./components/Moniteur/MoniteurForm";
import PresidentForm from "./components/President/PresidentForm";
import TresorierForm from "./components/Tresorier/TresorierForm";
import IncidentForm from "./components/Incident/IncidentForm";
import AttributionForm from "./components/Attribution/AttributionForm";
import ReparationForm from "./components/Reparation/ReparationForm";

// Context
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/Common/ProtectedRoute";
import OfflineBanner from "./components/Common/OfflineBanner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineBanner />
      <AuthProvider>
        <Router>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Page de login - sans layout */}
              <Route path="/login" element={<LoginPage />} />

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

              {/* ============ ADHÉRENTS ============ */}
              <Route
                path="/adherents"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur", "tresorier"]}>
                    <Layout>
                      <AdherentsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/adherents/create"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <AdherentCreatePage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/adherents/edit/:id"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <AdherentEditPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/adherents/communication"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <AdherentCommunicationPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/adherents/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <AdherentDetailsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ============ ADHÉSIONS ============ */}
              <Route
                path="/adhesions"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <AdhesionsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/adhesions/create"
                element={
                  <ProtectedRoute requiredRoles={["president", "tresorier"]}>
                    <Layout>
                      <AdhesionForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/adhesions/edit/:id"
                element={
                  <ProtectedRoute requiredRoles={["president", "tresorier"]}>
                    <Layout>
                      <AdhesionForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/adhesions/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <AdhesionDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ============ CERTIFICATS ============ */}
              <Route
                path="/certificats"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CertificatsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/certificats/create"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <CertificatForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/certificats/edit/:id"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <CertificatForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/certificats/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CertificatDetails />
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
              <Route
                path="/paiements/create"
                element={
                  <ProtectedRoute requiredRoles={["president", "tresorier"]}>
                    <Layout>
                      <PaiementForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/paiements/edit/:id"
                element={
                  <ProtectedRoute requiredRoles={["president", "tresorier"]}>
                    <Layout>
                      <PaiementForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/paiements/:id"
                element={
                  <ProtectedRoute requiredRoles={["president", "tresorier", "adherent"]}>
                    <Layout>
                      <PaiementDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ============ SORTIES ============ */}
              <Route
                path="/sorties"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur", "adherent"]}>
                    <Layout>
                      <SortiesPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sorties/create"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                    <Layout>
                      <SortieForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sorties/edit/:id"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                    <Layout>
                      <SortieForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sorties/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <SortieDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              />

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
              <Route
                path="/inscriptions/create"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <InscriptionForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inscriptions/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <InscriptionDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inscriptions/edit/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <InscriptionForm />
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
                      <PlongeeForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plongees/edit/:id"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                    <Layout>
                      <PlongeeForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plongees/:id"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur", "adherent"]}>
                    <Layout>
                      <PlongeeDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ============ MATÉRIEL ============ */}
              <Route
                path="/materiels"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <MaterielsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/materiels/create"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <MaterielForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/materiels/edit/:id"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <MaterielForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/materiels/:id"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <MaterielDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ============ FORMATIONS ============ */}
              <Route
                path="/formations"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                    <Layout>
                      <FormationsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/formations/create"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                    <Layout>
                      <FormationForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/formations/edit/:id"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                    <Layout>
                      <FormationForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/formations/:id"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                    <Layout>
                      <FormationDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ============ SPÉCIALITÉS DE FORMATION ============ */}
              <Route
                path="/specialites-formation"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                    <Layout>
                      <SpecialitesFormationPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/specialites-formation/create"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                    <Layout>
                      <SpecialiteFormationForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/specialites-formation/edit/:id"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                    <Layout>
                      <SpecialiteFormationForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />

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

              {/* ============ GESTION DES UTILISATEURS ============ */}
              <Route
                path="/users"
                element={
                  <ProtectedRoute requiredPermission="manage_users">
                    <Layout>
                      <UsersPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
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

              {/* ============ MONITEURS ============ */}
              <Route
                path="/moniteurs"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <MoniteursPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/moniteurs/create"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <MoniteurForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/moniteurs/edit/:id"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <MoniteurForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/moniteurs/:id"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <MoniteurDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ============ PRESIDENTS ============ */}
              <Route
                path="/presidents"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <PresidentsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/presidents/create"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <PresidentForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/presidents/edit/:id"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <PresidentForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/presidents/:id"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <PresidentDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ============ TRESORIERS ============ */}
              <Route
                path="/tresoriers"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <TresoriersPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tresoriers/create"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <TresorierForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tresoriers/edit/:id"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <TresorierForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tresoriers/:id"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <TresorierDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ============ INCIDENTS ============ */}
              <Route
                path="/incidents"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                    <Layout>
                      <IncidentsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/incidents/create"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                    <Layout>
                      <IncidentForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/incidents/edit/:id"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                    <Layout>
                      <IncidentForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/incidents/:id"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur"]}>
                    <Layout>
                      <IncidentDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ============ ATTRIBUTIONS ============ */}
              <Route
                path="/attributions"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <AttributionsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attributions/create"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <AttributionForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attributions/edit/:id"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <AttributionForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attributions/:id"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <AttributionDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ============ REPARATIONS ============ */}
              <Route
                path="/reparations"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <ReparationsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reparations/create"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <ReparationForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reparations/edit/:id"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <ReparationForm />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reparations/:id"
                element={
                  <ProtectedRoute requiredRoles={["president"]}>
                    <Layout>
                      <ReparationDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ============ PAGES D'ERREUR ============ */}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AnimatePresence>
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
            icon: "✅",
            style: {
              background: "#10B981",
              color: "#fff",
            },
          },
          error: {
            icon: "❌",
            style: {
              background: "#EF4444",
              color: "#fff",
            },
          },
        }}
      />

      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

export default App;
