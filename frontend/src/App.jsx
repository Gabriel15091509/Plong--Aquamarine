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
import AdhesionForm from "./components/Adhesion/AdhesionForm";
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

import ProtectedRoute from "./components/Common/ProtectedRoute";

// ✅ NOUVEAU - Page de pointage
import SortiePointage from "./pages/SortiePointage";

// Components
import SortieForm from "./components/Sortie/SortieForm";
import SortieDetails from "./components/Sortie/SortieDetails";
import InscriptionForm from "./components/Inscription/InscriptionForm";
import PlongeeForm from "./components/Plongee/PlongeeForm";
import MaterielForm from "./components/Materiel/MaterielForm";
import FormationForm from "./components/Formation/FormationForm";
import PaiementForm from "./components/Paiement/PaiementForm";

// Context
import { AuthProvider, useAuth } from "./context/AuthContext";

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

              {/* Adhérents - accessible à tous les utilisateurs connectés */}
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

              {/* Adhésions - accessible à tous */}
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

              {/* Certificats - accessible à tous */}
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

              {/* Paiements - Réservé au trésorier et président */}
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

              {/* Sorties - Réservé au moniteur et président */}
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
                      <SortieForm editMode={true} />
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

              {/* ✅ NOUVEAU - Pointage de présence pour une sortie */}
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

              {/* Inscriptions - accessible à tous */}
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

              {/* Plongées - Réservé au moniteur et président */}
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

              {/* Matériel - Réservé au président */}
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

              {/* Formations - Réservé au moniteur et président */}
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

              {/* Calendrier - accessible à tous */}
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

              {/* À propos - accessible à tous */}
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

              {/* Gestion des utilisateurs - Réservé au président */}
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

              {/* Pages d'erreur */}
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
