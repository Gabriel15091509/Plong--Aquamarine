import React, { createContext, useState, useContext, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import toast from "react-hot-toast";
import { prefetchForOffline } from "../utils/offlinePrefetch";

const AuthContext = createContext();

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

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      console.log("✅ Réponse reçue:", response.data);

      if (response.data.success) {
        const { token, user } = response.data.data;

        // Un compte peut se reconnecter directement après un autre sans
        // passer par logout() (session expirée, onglet resté ouvert) : vider
        // le cache React Query ici aussi évite d'afficher les données du rôle
        // précédent tant qu'elles n'ont pas expiré (staleTime).
        queryClient.clear();

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        setUser(user);
        setPermissions(getUserPermissions(user.role));
        prefetchForOffline();

        if (user.must_change_password) {
          toast("Veuillez changer votre mot de passe avant de continuer", {
            icon: "🔑",
          });
          return { user, mustChangePassword: true };
        }

        toast.success(`Bienvenue ${user.name} !`);
        return { user, mustChangePassword: false };
      }

      throw new Error("Erreur de connexion");
    } catch (error) {
      console.log("❌ Erreur complète:", error);
      console.log("❌ Status:", error.response?.status);
      console.log("❌ Data:", error.response?.data);
      console.log("❌ Message:", error.message);
      const message = error.response?.data?.message || "Erreur de connexion";
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

  // ✅ Ajout : pour mettre à jour user + token après changement de mot de passe
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
        logout,
        permissions,
        hasPermission,
        hasRole,
        updateUser, // ✅ Ajout
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
