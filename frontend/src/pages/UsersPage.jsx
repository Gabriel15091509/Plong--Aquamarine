import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUserPlus,
  FiEdit,
  FiTrash2,
  FiShield,
  FiUser,
  FiAward,
  FiDollarSign,
  FiSearch,
  FiFilter,
  FiX,
  FiCheckCircle,
  FiXCircle,
  FiMail,
  FiPhone,
  FiCalendar,
  FiChevronDown,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/Common/ProtectedRoute";
import SearchBar from "../components/Common/SearchBar";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import RoleBasedContent from "../components/Common/RoleBasedContent";

// Données simulées - À remplacer par l'appel API réel
const mockUsers = [
  {
    id: 1,
    name: "Jean Dupont",
    email: "jean@plongee.com",
    role: "president",
    phone: "0612345678",
    active: true,
    created_at: "2024-01-15",
  },
  {
    id: 2,
    name: "Marie Martin",
    email: "marie@plongee.com",
    role: "moniteur",
    phone: "0623456789",
    active: true,
    created_at: "2024-02-01",
  },
  {
    id: 3,
    name: "Pierre Durand",
    email: "pierre@plongee.com",
    role: "tresorier",
    phone: "0634567890",
    active: true,
    created_at: "2024-02-15",
  },
  {
    id: 4,
    name: "Sophie Bernard",
    email: "sophie@plongee.com",
    role: "adherent",
    phone: "0645678901",
    active: true,
    created_at: "2024-03-01",
  },
  {
    id: 5,
    name: "Luc Moreau",
    email: "luc@plongee.com",
    role: "adherent",
    phone: "0656789012",
    active: false,
    created_at: "2024-03-15",
  },
  {
    id: 6,
    name: "Claire Petit",
    email: "claire@plongee.com",
    role: "moniteur",
    phone: "0667890123",
    active: true,
    created_at: "2024-04-01",
  },
  {
    id: 7,
    name: "Michel Robert",
    email: "michel@plongee.com",
    role: "adherent",
    phone: "0678901234",
    active: true,
    created_at: "2024-04-15",
  },
  {
    id: 8,
    name: "Isabelle Dubois",
    email: "isabelle@plongee.com",
    role: "tresorier",
    phone: "0689012345",
    active: false,
    created_at: "2024-05-01",
  },
];

const UsersPage = () => {
  const { user, hasRole, hasPermission } = useAuth();
  const [users, setUsers] = useState(mockUsers);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ Vérifier si l'utilisateur peut gérer les utilisateurs
  const canManageUsers =
    hasPermission("manage_users") || hasRole(["president"]);

  // ✅ Vérifier si l'utilisateur peut modifier les rôles
  const canEditRoles = hasRole(["president"]);

  // ✅ Vérifier si l'utilisateur peut supprimer des utilisateurs
  const canDeleteUsers = hasRole(["president"]);

  // ✅ Vérifier si l'utilisateur peut voir les options avancées
  const canSeeAdvanced = hasRole(["president", "tresorier"]);

  // ✅ Fonctions pour obtenir les infos des rôles
  const getRoleInfo = (role) => {
    const roles = {
      president: {
        icon: FiShield,
        label: "Président",
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-100 dark:bg-purple-900/30",
        border: "border-purple-200 dark:border-purple-800",
      },
      moniteur: {
        icon: FiAward,
        label: "Moniteur",
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-100 dark:bg-blue-900/30",
        border: "border-blue-200 dark:border-blue-800",
      },
      tresorier: {
        icon: FiDollarSign,
        label: "Trésorier",
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-100 dark:bg-green-900/30",
        border: "border-green-200 dark:border-green-800",
      },
      adherent: {
        icon: FiUser,
        label: "Adhérent",
        color: "text-gray-600 dark:text-gray-400",
        bg: "bg-gray-100 dark:bg-gray-700",
        border: "border-gray-200 dark:border-gray-600",
      },
    };
    return roles[role] || roles.adherent;
  };

  // ✅ Filtrer les utilisateurs
  const filteredUsers = useMemo(() => {
    let result = users;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search),
      );
    }

    if (filterRole !== "all") {
      result = result.filter((u) => u.role === filterRole);
    }

    if (filterStatus !== "all") {
      result = result.filter((u) =>
        filterStatus === "active" ? u.active : !u.active,
      );
    }

    return result;
  }, [users, searchTerm, filterRole, filterStatus]);

  // ✅ Statistiques des filtres
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.active).length;
    const inactive = users.filter((u) => !u.active).length;
    const byRole = {
      president: users.filter((u) => u.role === "president").length,
      moniteur: users.filter((u) => u.role === "moniteur").length,
      tresorier: users.filter((u) => u.role === "tresorier").length,
      adherent: users.filter((u) => u.role === "adherent").length,
    };
    return { total, active, inactive, byRole };
  }, [users]);

  // ✅ Réinitialiser les filtres
  const clearFilters = () => {
    setSearchTerm("");
    setFilterRole("all");
    setFilterStatus("all");
  };

  // ✅ Ouvrir le modal de détails
  const openUserDetails = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  // ✅ Formatter la date
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // ✅ Options de filtres (cachées selon le rôle)
  const roleOptions = useMemo(() => {
    const options = [{ value: "all", label: "Tous les rôles" }];

    // ✅ Seul le président voit tous les rôles
    if (hasRole(["president"])) {
      options.push(
        { value: "president", label: "👑 Président" },
        { value: "moniteur", label: "🏊 Moniteur" },
        { value: "tresorier", label: "💰 Trésorier" },
        { value: "adherent", label: "🤿 Adhérent" },
      );
    } else if (hasRole(["moniteur"])) {
      // Le moniteur voit seulement les adhérents et moniteurs
      options.push(
        { value: "moniteur", label: "🏊 Moniteur" },
        { value: "adherent", label: "🤿 Adhérent" },
      );
    } else if (hasRole(["tresorier"])) {
      // Le trésorier voit seulement les adhérents
      options.push({ value: "adherent", label: "🤿 Adhérent" });
    } else {
      // L'adhérent voit seulement son rôle
      options.push({ value: "adherent", label: "🤿 Adhérent" });
    }

    return options;
  }, [user]);

  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "active", label: "✅ Actifs" },
    { value: "inactive", label: "❌ Inactifs" },
  ];

  if (!canManageUsers) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
          <FiShield className="w-12 h-12 text-red-500 dark:text-red-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
          Accès non autorisé
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission="manage_users">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <FiShield className="w-6 h-6 text-primary-500" />
              Gestion des utilisateurs
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Gérez les comptes et les permissions des utilisateurs
            </p>
          </div>

          {/* ✅ Bouton "Nouvel utilisateur" - Visible uniquement pour le président */}
          {canEditRoles && (
            <button className="btn-primary flex items-center gap-2">
              <FiUserPlus className="w-4 h-4" />
              Nouvel utilisateur
            </button>
          )}
        </div>

        {/* Statistiques - Adaptées selon le rôle */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-4 text-center border border-gray-100 dark:border-gray-700">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.total}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-4 text-center border border-gray-100 dark:border-gray-700">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.active}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Actifs</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-4 text-center border border-gray-100 dark:border-gray-700">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.inactive}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Inactifs</p>
          </div>

          {/* ✅ Statistiques par rôle - Cachées selon le rôle */}
          {canEditRoles && (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-4 text-center border border-gray-100 dark:border-gray-700">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.byRole.president}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  👑 Présidents
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-4 text-center border border-gray-100 dark:border-gray-700">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.byRole.moniteur}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  🏊 Moniteurs
                </p>
              </div>
            </>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-4 text-center border border-gray-100 dark:border-gray-700">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.byRole.tresorier + stats.byRole.adherent}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              📋 Autres
            </p>
          </div>
        </div>

        {/* Recherche et filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Rechercher par nom ou email..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 ${
                  showFilters
                    ? "bg-primary-500 text-white border-primary-500"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                }`}
              >
                <FiFilter className="w-4 h-4" />
                <span className="text-sm font-medium">Filtres</span>
                <FiChevronDown
                  className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
                />
              </button>
              {(searchTerm ||
                filterRole !== "all" ||
                filterStatus !== "all") && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>

          {/* Filtres avancés */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Rôle
                    </label>
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="input-field"
                    >
                      {roleOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Statut
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="input-field"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Liste des utilisateurs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card overflow-hidden border border-gray-100 dark:border-gray-700">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <FiSearch className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                Aucun utilisateur trouvé
              </p>
              {(searchTerm ||
                filterRole !== "all" ||
                filterStatus !== "all") && (
                <button
                  onClick={clearFilters}
                  className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Rôle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((u, index) => {
                    const roleInfo = getRoleInfo(u.role);
                    const RoleIcon = roleInfo.icon;

                    return (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        onClick={() => openUserDetails(u)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full bg-gradient-to-r from-primary-500 to-ocean-500 flex items-center justify-center text-white text-sm font-semibold`}
                            >
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {u.name}
                              </span>
                              {u.phone && (
                                <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                  <FiPhone className="w-3 h-3" />
                                  {u.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <FiMail className="w-3 h-3 text-gray-400" />
                            {u.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${roleInfo.bg} ${roleInfo.color} flex items-center gap-1 w-fit`}
                          >
                            <RoleIcon className="w-3 h-3" />
                            {roleInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 w-fit ${
                              u.active
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {u.active ? (
                              <>
                                <FiCheckCircle className="w-3 h-3" />
                                Actif
                              </>
                            ) : (
                              <>
                                <FiXCircle className="w-3 h-3" />
                                Inactif
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:text-blue-400 dark:hover:bg-blue-900/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                openUserDetails(u);
                              }}
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>

                            {/* ✅ Bouton Supprimer - Visible uniquement pour le président */}
                            {canDeleteUsers && (
                              <button
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-red-400 dark:hover:bg-red-900/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Détails Utilisateur - Adapté selon le rôle */}
        <AnimatePresence>
          {isModalOpen && selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* En-tête */}
                <div className="bg-gradient-to-r from-primary-500 to-ocean-500 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold border-2 border-white/30">
                        {selectedUser.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">
                          {selectedUser.name}
                        </h3>
                        <p className="text-primary-100 text-sm">
                          {selectedUser.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Informations */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Rôle
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        {getRoleInfo(selectedUser.role).icon &&
                          React.createElement(
                            getRoleInfo(selectedUser.role).icon,
                            { className: "w-4 h-4" },
                          )}
                        {getRoleInfo(selectedUser.role).label}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Statut
                      </p>
                      <p
                        className={`font-medium flex items-center gap-2 ${
                          selectedUser.active
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {selectedUser.active ? (
                          <>
                            <FiCheckCircle className="w-4 h-4" />
                            Actif
                          </>
                        ) : (
                          <>
                            <FiXCircle className="w-4 h-4" />
                            Inactif
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Téléphone
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <FiPhone className="w-4 h-4 text-gray-400" />
                      {selectedUser.phone || "Non renseigné"}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Date d'inscription
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <FiCalendar className="w-4 h-4 text-gray-400" />
                      {formatDate(selectedUser.created_at)}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                      Fermer
                    </button>

                    {/* ✅ Bouton Modifier - Visible uniquement pour le président */}
                    {canEditRoles && (
                      <button className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium flex items-center justify-center gap-2">
                        <FiEdit className="w-4 h-4" />
                        Modifier
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </ProtectedRoute>
  );
};

export default UsersPage;
