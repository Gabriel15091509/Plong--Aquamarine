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
import UserCreatePage from "./pages/UserCreatePage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AdherentsPage from "./pages/AdherentsPage";
import AdherentCreatePage from "./pages/AdherentCreatePage";
import AdherentEditPage from "./pages/AdherentEditPage";
import AdherentDetailsPage from "./pages/AdherentDetailsPage";
import AdhesionsPage from "./pages/AdhesionsPage";
import CertificatsPage from "./pages/CertificatsPage";
import PaiementsPage from "./pages/PaiementsPage";
import SortiesPage from "./pages/SortiesPage";
import InscriptionsPage from "./pages/InscriptionsPage";
import PlongeesPage from "./pages/PlongeesPage";
import MaterielsPage from "./pages/MaterielsPage";
import FormationsPage from "./pages/FormationsPage";
import CalendrierPage from "./pages/CalendrierPage";
import AboutPage from "./pages/AboutPage";
import UsersPage from "./pages/UsersPage";
import NotFoundPage from "./pages/NotFoundPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import ProfilePage from "./pages/ProfilePage";
import SortiePointage from "./pages/SortiePointage";

// Details Pages
import AdhesionDetails from "./components/Adhesion/AdhesionDetails";
import CertificatDetails from "./components/CertificatMedical/CertificatDetails";
import PaiementDetails from "./components/Paiement/PaiementDetails";
import FormationDetails from "./components/Formation/FormationDetails";
import MaterielDetails from "./components/Materiel/MaterielDetails";
import PlongeeDetails from "./components/Plongee/PlongeeDetails";
import SortieDetails from "./components/Sortie/SortieDetails";
import InscriptionDetails from "./components/Inscription/InscriptionDetails";

// Components
import SortieForm from "./components/Sortie/SortieForm";
import InscriptionForm from "./components/Inscription/InscriptionForm";
import PlongeeForm from "./components/Plongee/PlongeeForm";
import MaterielForm from "./components/Materiel/MaterielForm";
import FormationForm from "./components/Formation/FormationForm";
import PaiementForm from "./components/Paiement/PaiementForm";
import CertificatForm from "./components/CertificatMedical/CertificatForm";
import AdhesionForm from "./components/Adhesion/AdhesionForm";

// Context
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/Common/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
                  <PrivateRoute>
                    <Layout>
                      <Navigate to="/dashboard" replace />
                    </Layout>
                  </PrivateRoute>
                }
              />

              {/* Dashboard - accessible à tous */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Layout>
                      <DashboardPage />
                    </Layout>
                  </PrivateRoute>
                }
              />

              {/* Profile - accessible à tous */}
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Layout>
                      <ProfilePage />
                    </Layout>
                  </PrivateRoute>
                }
              />

              {/* Changement de mot de passe */}
              <Route
                path="/change-password"
                element={
                  <PrivateRoute>
                    <Layout>
                      <ChangePasswordPage />
                    </Layout>
                  </PrivateRoute>
                }
              />

              {/* ============ ADHÉRENTS ============ */}
              <Route
                path="/adherents"
                element={
                  <PrivateRoute>
                    <Layout>
                      <AdherentsPage />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/adherents/create"
                element={
                  <PrivateRoute>
                    <Layout>
                      <AdherentCreatePage />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/adherents/edit/:id"
                element={
                  <PrivateRoute>
                    <Layout>
                      <AdherentEditPage />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/adherents/:id"
                element={
                  <PrivateRoute>
                    <Layout>
                      <AdherentDetailsPage />
                    </Layout>
                  </PrivateRoute>
                }
              />

              {/* ============ ADHÉSIONS ============ */}
              <Route
                path="/adhesions"
                element={
                  <PrivateRoute>
                    <Layout>
                      <AdhesionsPage />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/adhesions/create"
                element={
                  <PrivateRoute>
                    <Layout>
                      <AdhesionForm />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/adhesions/edit/:id"
                element={
                  <PrivateRoute>
                    <Layout>
                      <AdhesionForm />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/adhesions/:id"
                element={
                  <PrivateRoute>
                    <Layout>
                      <AdhesionDetails />
                    </Layout>
                  </PrivateRoute>
                }
              />

              {/* ============ CERTIFICATS ============ */}
              <Route
                path="/certificats"
                element={
                  <PrivateRoute>
                    <Layout>
                      <CertificatsPage />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/certificats/create"
                element={
                  <PrivateRoute>
                    <Layout>
                      <CertificatForm />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/certificats/edit/:id"
                element={
                  <PrivateRoute>
                    <Layout>
                      <CertificatForm />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/certificats/:id"
                element={
                  <PrivateRoute>
                    <Layout>
                      <CertificatDetails />
                    </Layout>
                  </PrivateRoute>
                }
              />

              {/* ============ PAIEMENTS ============ */}
              <Route
                path="/paiements"
                element={
                  <ProtectedRoute requiredRoles={["president", "tresorier"]}>
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
                  <ProtectedRoute requiredRoles={["president", "tresorier"]}>
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
                  <ProtectedRoute requiredRoles={["president", "moniteur"]}>
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
                  <PrivateRoute>
                    <Layout>
                      <SortieDetails />
                    </Layout>
                  </PrivateRoute>
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
                  <PrivateRoute>
                    <Layout>
                      <InscriptionsPage />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/inscriptions/create"
                element={
                  <PrivateRoute>
                    <Layout>
                      <InscriptionForm />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/inscriptions/:id"
                element={
                  <PrivateRoute>
                    <Layout>
                      <InscriptionDetails />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/inscriptions/edit/:id"
                element={
                  <PrivateRoute>
                    <Layout>
                      <InscriptionForm />
                    </Layout>
                  </PrivateRoute>
                }
              />

              {/* ============ PLONGÉES ============ */}
              <Route
                path="/plongees"
                element={
                  <ProtectedRoute requiredRoles={["president", "moniteur"]}>
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
                  <ProtectedRoute requiredRoles={["president", "moniteur"]}>
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

              {/* ============ CALENDRIER ============ */}
              <Route
                path="/calendrier"
                element={
                  <PrivateRoute>
                    <Layout>
                      <CalendrierPage />
                    </Layout>
                  </PrivateRoute>
                }
              />

              {/* ============ À PROPOS ============ */}
              <Route
                path="/about"
                element={
                  <PrivateRoute>
                    <Layout>
                      <AboutPage />
                    </Layout>
                  </PrivateRoute>
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
