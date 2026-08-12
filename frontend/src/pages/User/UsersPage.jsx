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
  FiRefreshCw,
  FiKey,
  FiToggleLeft,
  FiToggleRight,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/Common/ProtectedRoute";
import SearchBar from "../../components/Common/SearchBar";
import LoadingSpinner from "../../components/Common/LoadingSpinner";
import ModalOverlay from "../../components/Common/ModalOverlay";
import { useUsers } from "../../hooks/User/useUsers";
import { Link } from "react-router-dom";
import { photoUrl } from "../../utils/photoUrl";

// ── Helpers ────────────────────────────────────────────────────────────────────

const getRoleInfo = (role) => {
  const roles = {
    president: {
      icon: FiShield,
      label: "Président",
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/30",
    },
    moniteur: {
      icon: FiAward,
      label: "Moniteur",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    tresorier: {
      icon: FiDollarSign,
      label: "Trésorier",
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    adherent: {
      icon: FiUser,
      label: "Adhérent",
      color: "text-gray-600 dark:text-gray-400",
      bg: "bg-gray-100 dark:bg-gray-700",
    },
  };
  return roles[role] || roles.adherent;
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ── Modal Créer Utilisateur ────────────────────────────────────────────────────

// ── Page Principale ────────────────────────────────────────────────────────────

const UsersPage = () => {
  const { user: currentUser, hasRole, hasPermission } = useAuth();

  const {
    useGetAll,
    useDisableAccount,
    useEnableAccount,
    useResetPassword,
    useChangeRole,
    useDeleteAccount,
  } = useUsers();
  const { data: usersResponse, isLoading: loading } = useGetAll();
  const users = usersResponse?.data || [];

  const disableAccount = useDisableAccount();
  const enableAccount = useEnableAccount();
  const resetPassword = useResetPassword();
  const changeRole = useChangeRole();
  const deleteAccount = useDeleteAccount();

  // id de l'user dont une mutation est en cours (pour désactiver ses boutons d'action)
  const actionLoading =
    (disableAccount.isPending && disableAccount.variables) ||
    (enableAccount.isPending && enableAccount.variables) ||
    (resetPassword.isPending && resetPassword.variables) ||
    (changeRole.isPending && changeRole.variables?.id) ||
    (deleteAccount.isPending && deleteAccount.variables) ||
    null;

  // État
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const canManageUsers =
    hasPermission("manage_users") || hasRole(["president"]);
  const canEditRoles = hasRole(["president"]);
  const canDeleteUsers = hasRole(["president"]);

  // ── Filtrage local (rapide, sans re-fetch) ──────────────────────────────────
  const filteredUsers = useMemo(() => {
    let result = users;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s),
      );
    }
    if (filterRole !== "all")
      result = result.filter((u) => u.role === filterRole);
    if (filterStatus !== "all")
      result = result.filter((u) =>
        filterStatus === "active" ? u.active : !u.active,
      );
    return result;
  }, [users, searchTerm, filterRole, filterStatus]);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.active).length,
      inactive: users.filter((u) => !u.active).length,
      byRole: {
        president: users.filter((u) => u.role === "president").length,
        moniteur: users.filter((u) => u.role === "moniteur").length,
        tresorier: users.filter((u) => u.role === "tresorier").length,
        adherent: users.filter((u) => u.role === "adherent").length,
      },
    }),
    [users],
  );

  // ── Actions ─────────────────────────────────────────────────────────────────
  // Les toasts de succès/erreur sont déjà gérés par les mutations de useUsers().
  const handleToggleActive = (u) => {
    const mutation = u.active ? disableAccount : enableAccount;
    mutation.mutate(u.id, {
      onSuccess: () => {
        if (selectedUser?.id === u.id) {
          setSelectedUser((p) => ({ ...p, active: !p.active }));
        }
      },
    });
  };

  const handleResetPassword = (u) => {
    if (!window.confirm(`Réinitialiser le mot de passe de ${u.name} ?`)) return;
    resetPassword.mutate(u.id);
  };

  const handleChangeRole = (u, newRole) => {
    changeRole.mutate(
      { id: u.id, role: newRole },
      {
        onSuccess: () => {
          if (selectedUser?.id === u.id) {
            setSelectedUser((p) => ({ ...p, role: newRole }));
          }
        },
      },
    );
  };

  const handleDelete = (u) => {
    if (
      !window.confirm(
        `Supprimer définitivement le compte de ${u.name} ? Cette action est irréversible.`,
      )
    )
      return;
    deleteAccount.mutate(u.id, {
      onSuccess: () => {
        if (selectedUser?.id === u.id) setIsDetailModalOpen(false);
      },
    });
  };

  if (!canManageUsers) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
          <FiShield className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
          Accès non autorisé
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Vous n'avez pas les permissions pour accéder à cette page.
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
              {stats.total} utilisateur{stats.total > 1 ? "s" : ""} ·{" "}
              {stats.active} actif{stats.active > 1 ? "s" : ""}
            </p>
          </div>
          {canManageUsers && (
            <Link
              to="/users/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/25"
            >
              <FiUserPlus className="w-4 h-4" />
              Nouveau compte
            </Link>
          )}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            {
              label: "Total",
              value: stats.total,
              color: "text-blue-600 dark:text-blue-400",
            },
            {
              label: "Actifs",
              value: stats.active,
              color: "text-green-600 dark:text-green-400",
            },
            {
              label: "Inactifs",
              value: stats.inactive,
              color: "text-red-600 dark:text-red-400",
            },
            ...(canEditRoles
              ? [
                  {
                    label: "Présidents",
                    value: stats.byRole.president,
                    color: "text-purple-600 dark:text-purple-400",
                  },
                  {
                    label: "Moniteurs",
                    value: stats.byRole.moniteur,
                    color: "text-blue-600 dark:text-blue-400",
                  },
                ]
              : []),
            {
              label: "Adhérents",
              value: stats.byRole.adherent,
              color: "text-gray-600 dark:text-gray-400",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-4 text-center border border-gray-100 dark:border-gray-700"
            >
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {s.label}
              </p>
            </div>
          ))}
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
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
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
                  onClick={() => {
                    setSearchTerm("");
                    setFilterRole("all");
                    setFilterStatus("all");
                  }}
                  className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium dark:text-red-400"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
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
                      <option value="all">Tous les rôles</option>
                      <option value="president">Président</option>
                      <option value="moniteur">Moniteur</option>
                      <option value="tresorier">Trésorier</option>
                      <option value="adherent">Adhérent</option>
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
                      <option value="all">Tous les statuts</option>
                      <option value="active">Actifs</option>
                      <option value="inactive">Inactifs</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tableau */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card overflow-hidden border border-gray-100 dark:border-gray-700">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner variant="list" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <FiSearch className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                Aucun utilisateur trouvé
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {[
                      "Utilisateur",
                      "Email",
                      "Rôle",
                      "Statut",
                      "Inscription",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((u, index) => {
                    const roleInfo = getRoleInfo(u.role);
                    const RoleIcon = roleInfo.icon;
                    const isActioning = actionLoading === u.id;

                    return (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedUser(u);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-primary-500 to-ocean-500 flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
                              {u.photo ? (
                                <img
                                  src={photoUrl(u.photo)}
                                  alt={u.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                u.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {u.name}
                              </p>
                              {u.phone && (
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  <FiPhone className="w-3 h-3" />
                                  {u.phone}
                                </p>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <FiCalendar className="w-3 h-3" />
                            {formatDate(u.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className="flex gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {canEditRoles && (
                              <>
                                {/* Activer / Désactiver */}
                                <button
                                  onClick={() => handleToggleActive(u)}
                                  disabled={
                                    isActioning || u.id === currentUser?.id
                                  }
                                  title={u.active ? "Désactiver" : "Activer"}
                                  className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${
                                    u.active
                                      ? "text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
                                      : "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                                  }`}
                                >
                                  {u.active ? (
                                    <FiToggleRight className="w-4 h-4" />
                                  ) : (
                                    <FiToggleLeft className="w-4 h-4" />
                                  )}
                                </button>

                                {/* Réinitialiser mot de passe */}
                                <button
                                  onClick={() => handleResetPassword(u)}
                                  disabled={isActioning}
                                  title="Réinitialiser le mot de passe"
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:text-blue-400 dark:hover:bg-blue-900/20 disabled:opacity-40"
                                >
                                  <FiKey className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {/* Éditer */}
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setIsDetailModalOpen(true);
                              }}
                              title="Voir / Modifier"
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:bg-gray-700"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>

                            {/* Supprimer */}
                            {canDeleteUsers && u.id !== currentUser?.id && (
                              <button
                                onClick={() => handleDelete(u)}
                                disabled={isActioning}
                                title="Supprimer"
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-40"
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

        {/* Modal Détails / Modifier */}
        <AnimatePresence>
          {isDetailModalOpen && selectedUser && (
            <ModalOverlay
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsDetailModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-500 to-ocean-500 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold border-2 border-white/30 overflow-hidden">
                        {selectedUser.photo ? (
                          <img
                            src={photoUrl(selectedUser.photo)}
                            alt={selectedUser.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          selectedUser.name.charAt(0).toUpperCase()
                        )}
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
                      onClick={() => setIsDetailModalOpen(false)}
                      className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Statut
                      </p>
                      <span
                        className={`text-sm font-medium flex items-center gap-1 ${selectedUser.active ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
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
                      </span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Inscription
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(selectedUser.created_at)}
                      </p>
                    </div>
                  </div>

                  {selectedUser.phone && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Téléphone
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <FiPhone className="w-4 h-4 text-gray-400" />
                        {selectedUser.phone}
                      </p>
                    </div>
                  )}

                  {/* Changer le rôle (président uniquement) */}
                  {canEditRoles && selectedUser.id !== currentUser?.id && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Changer le rôle
                      </p>
                      <select
                        value={selectedUser.role}
                        onChange={(e) =>
                          handleChangeRole(selectedUser, e.target.value)
                        }
                        disabled={actionLoading === selectedUser.id}
                        className="input-field text-sm"
                      >
                        <option value="adherent">Adhérent</option>
                        <option value="moniteur">Moniteur</option>
                        <option value="tresorier">Trésorier</option>
                        <option value="president">Président</option>
                      </select>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {canEditRoles && selectedUser.id !== currentUser?.id && (
                      <>
                        <button
                          onClick={() => handleResetPassword(selectedUser)}
                          disabled={actionLoading === selectedUser.id}
                          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors dark:bg-blue-900/20 dark:text-blue-400 disabled:opacity-50"
                        >
                          <FiKey className="w-4 h-4" />
                          Réinitialiser mot de passe
                        </button>
                        <button
                          onClick={() => handleToggleActive(selectedUser)}
                          disabled={actionLoading === selectedUser.id}
                          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-xl transition-colors disabled:opacity-50 ${
                            selectedUser.active
                              ? "bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400"
                              : "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                          }`}
                        >
                          {selectedUser.active ? (
                            <>
                              <FiToggleRight className="w-4 h-4" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <FiToggleLeft className="w-4 h-4" />
                              Activer
                            </>
                          )}
                        </button>
                        {canDeleteUsers && (
                          <button
                            onClick={() => handleDelete(selectedUser)}
                            disabled={actionLoading === selectedUser.id}
                            className="flex items-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors dark:bg-red-900/20 dark:text-red-400 disabled:opacity-50"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => setIsDetailModalOpen(false)}
                      className="ml-auto px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </motion.div>
            </ModalOverlay>
          )}
        </AnimatePresence>

      </motion.div>
    </ProtectedRoute>
  );
};

export default UsersPage;
