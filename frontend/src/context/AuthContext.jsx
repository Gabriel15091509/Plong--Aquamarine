import React, { createContext, useState, useContext, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import toast from "react-hot-toast";
import { prefetchForOffline } from "../utils/offlinePrefetch";

const AuthContext = createContext();

// Déconnexion automatique après 15 minutes d'inactivité (exigence 4.4).
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart"];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setPermissions(getUserPermissions(parsedUser.role));
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        prefetchForOffline();
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const getUserPermissions = (role) => {
    const permissionsMap = {
      president: [
        "all",
        "manage_users",
        "manage_staff",
        "view_stats",
        "manage_settings",
      ],
      moniteur: [
        "manage_sorties",
        "validate_plongees",
        "manage_formations",
        "view_adherents",
      ],
      adherent: ["view_profile", "inscription_sorties", "view_carnet"],
      tresorier: ["manage_paiements", "view_stats", "exports"],
    };
    return permissionsMap[role] || [];
  };

  // Finalise la session une fois le JWT obtenu (login direct, ou après
  // vérification du code OTP pour le président).
  const completeSession = (token, user) => {
    // Un compte peut se reconnecter directement après un autre sans passer
    // par logout() (session expirée, onglet resté ouvert) : vider le cache
    // React Query ici aussi évite d'afficher les données du rôle précédent
    // tant qu'elles n'ont pas expiré (staleTime).
    queryClient.clear();

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    setUser(user);
    setPermissions(getUserPermissions(user.role));
    prefetchForOffline();

    if (user.must_change_password) {
      toast("Veuillez changer votre mot de passe avant de continuer");
      return { user, mustChangePassword: true };
    }

    toast.success(`Bienvenue ${user.name} !`);
    return { user, mustChangePassword: false };
  };

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });

      if (!response.data.success) throw new Error("Erreur de connexion");

      // Authentification renforcée (président) : pas de token tant que le
      // code reçu par email n'est pas vérifié.
      if (response.data.data.otpRequired) {
        return { otpRequired: true, email: response.data.data.email };
      }

      const { token, user } = response.data.data;
      return completeSession(token, user);
    } catch (error) {
      const message = error.response?.data?.message || "Erreur de connexion";
      toast.error(message);
      throw error;
    }
  };

  const verifyOtp = async (email, code) => {
    try {
      const response = await api.post("/auth/verify-otp", { email, code });
      if (!response.data.success) throw new Error("Code invalide");

      const { token, user } = response.data.data;
      return completeSession(token, user);
    } catch (error) {
      const message = error.response?.data?.message || "Code invalide";
      toast.error(message);
      throw error;
    }
  };

  // "Mot de passe oublié ?" (LoginPage.jsx) — étape 1 : demande un lien de
  // réinitialisation. Le backend répond toujours le même message générique
  // (compte trouvé ou non), donc pas de rejet possible à afficher ici —
  // toute erreur réseau reste une exception normale.
  const forgotPassword = async (email) => {
    const response = await api.post("/auth/forgot-password", {
      email,
      // Le backend construit le lien de réinitialisation à partir de cette
      // origine (même convention que loginUrl dans utils/welcomeEmail.js) :
      // il n'a lui-même aucune notion fiable de l'URL publique du frontend.
      resetUrlBase: window.location.origin,
    });
    return response.data;
  };

  // Étape 2 : jeton + nouveau mot de passe → connecte directement (comme
  // verifyOtp) plutôt que de renvoyer vers /login.
  const resetPassword = async (token, newPassword) => {
    try {
      const response = await api.post("/auth/reset-password", {
        token,
        newPassword,
      });
      if (!response.data.success) throw new Error("Réinitialisation impossible");

      const { token: authToken, user } = response.data.data;
      return completeSession(authToken, user);
    } catch (error) {
      const message =
        error.response?.data?.message || "Lien de réinitialisation invalide ou expiré";
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    setPermissions([]);
    // La déconnexion navigue en SPA (pas de rechargement complet de page) :
    // sans ça, les données du compte précédent restent en cache React Query
    // et s'affichent encore au prochain compte connecté, selon les mêmes clés
    // de requête (staleTime 5 min dans App.jsx).
    queryClient.clear();
    toast.success("Déconnexion réussie");
  };

  // Rechargement complet (pas navigate()) : ce contexte est monté au-dessus
  // du <Router> dans App.jsx, useNavigate() n'y est donc pas disponible —
  // même convention que l'intercepteur 401 de services/api.js.
  const isLoggedIn = !!user;
  useEffect(() => {
    if (!isLoggedIn) return undefined;

    let timeoutId;

    const handleInactivityLogout = () => {
      logout();
      toast("Session expirée après 15 minutes d'inactivité", { icon: "⏱️" });
      window.location.href = "/login";
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleInactivityLogout, INACTIVITY_LIMIT_MS);
    };

    resetTimer();
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetTimer),
    );

    return () => {
      clearTimeout(timeoutId);
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, resetTimer),
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Ajout : pour mettre à jour user + token après changement de mot de passe
  const updateUser = (newData) => {
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    if (newData.permissions) setPermissions(newData.permissions);
    if (newData.token) {
      localStorage.setItem("token", newData.token);
      api.defaults.headers.common["Authorization"] = `Bearer ${newData.token}`;
    }
  };

  const hasPermission = (permission) => {
    return permissions.includes("all") || permissions.includes(permission);
  };

  const hasRole = (roles) => {
    return roles.includes(user?.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        verifyOtp,
        forgotPassword,
        resetPassword,
        logout,
        permissions,
        hasPermission,
        hasRole,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
