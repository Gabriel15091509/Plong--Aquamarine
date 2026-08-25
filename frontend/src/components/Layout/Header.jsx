import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiMenu,
  FiBell,
  FiUser,
  FiSearch,
  FiLogOut,
  FiSettings,
  FiUserPlus,
  FiMail,
  FiCalendar,
  FiX,
  FiChevronRight,
  FiSun,
  FiMoon,
  FiCheckCircle,
  FiKey,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useAlertes } from "../../hooks/Alerte/useAlertes";
import { formatRelativeTime } from "../../utils/helpers";
import { getAlertIcon, getAlertDescription } from "../../utils/alerteDisplay";
import { photoUrl } from "../../utils/photoUrl";
import Logo from "../Common/Logo";
import AlerteDetailsModal from "../Alerte/AlerteDetailsModal";

const Header = ({ sidebarOpen, setSidebarOpen, onOpenMobileMenu }) => {
  const { user, logout, hasPermission } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlerte, setSelectedAlerte] = useState(null);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const profileButtonRef = useRef(null);

  // Récupération des alertes
  const { useGetUnread, useGetStats, useMarkAsRead, useMarkAllAsRead, useRemove } =
    useAlertes();
  const { data: unreadData, isLoading: loadingUnread } = useGetUnread();
  const { data: statsData } = useGetStats();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const remove = useRemove();

  const notifications = unreadData?.data || [];
  // Compteur réel (pas juste la longueur de `notifications`, plafonnée à 20
  // côté backend pour ne pas alourdir le dropdown — voir useGetUnread) :
  // repose sur /alertes/stats, jamais tronqué.
  const unreadCount = statsData?.data?.unreadCount ?? notifications.length;
  const autresNonLues = Math.max(unreadCount - notifications.length, 0);

  // Fermer les menus quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target) &&
        !notificationButtonRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target) &&
        !profileButtonRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    await markAsRead.mutateAsync(id);
  };

  const handleOpenAlerte = (notification) => {
    setSelectedAlerte(notification);
    setIsNotificationOpen(false);
    if (!notification.read) {
      handleMarkAsRead(notification.id_alerte);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync();
  };

  const handleRemove = async (id) => {
    await remove.mutateAsync(id);
  };

  // Obtenir le label du rôle
  const getRoleLabel = (role) => {
    const roles = {
      president: "Président",
      moniteur: "Moniteur",
      tresorier: "Trésorier",
      adherent: "Adhérent",
    };
    return roles[role] || "Utilisateur";
  };

  const today = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });
  const formattedToday = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/80 sticky top-0 z-40 transition-colors duration-300 dark:bg-gray-800/80 dark:border-gray-700/80 h-16">
      <div className="px-4 sm:px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors dark:hover:bg-gray-700"
            aria-label="Ouvrir le menu"
          >
            <FiMenu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </motion.button>
          <span className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            <FiCalendar className="w-4 h-4 text-cyan-500" />
            {formattedToday}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Bouton Toggle Thème */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors dark:hover:bg-gray-700"
          >
            {theme === "dark" ? (
              <FiSun className="w-5 h-5 text-yellow-400" />
            ) : (
              <FiMoon className="w-5 h-5 text-gray-600" />
            )}
          </motion.button>

          {/* Bouton Notifications */}
          <div className="relative">
            <motion.button
              ref={notificationButtonRef}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors dark:hover:bg-gray-700"
            >
              <FiBell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </motion.span>
              )}
            </motion.button>

            {/* Dropdown Notifications */}
            <AnimatePresence>
              {isNotificationOpen && (
                <motion.div
                  ref={notificationRef}
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 dark:bg-gray-800 dark:border-gray-700"
                >
                  {/* En-tête notifications */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          ({unreadCount} non lues)
                        </span>
                      )}
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        disabled={markAllAsRead.isPending}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50"
                      >
                        {markAllAsRead.isPending
                          ? "..."
                          : "Tout marquer comme lu"}
                      </button>
                    )}
                  </div>

                  {/* Liste des notifications */}
                  <div className="max-h-96 overflow-y-auto">
                    {loadingUnread ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <FiBell className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p>Aucune notification</p>
                      </div>
                    ) : (
                      notifications.map((notification, index) => {
                        const AlertIcon = getAlertIcon(notification.type);
                        const IconComponent = AlertIcon.icon;

                        return (
                          <motion.div
                            key={notification.id_alerte}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`relative flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer dark:hover:bg-gray-700 ${
                              !notification.read
                                ? "bg-blue-50/50 dark:bg-blue-900/20"
                                : ""
                            } ${index !== notifications.length - 1 ? "border-b border-gray-100 dark:border-gray-700" : ""}`}
                            onClick={() => handleOpenAlerte(notification)}
                          >
                            <div
                              className={`p-2 rounded-xl ${AlertIcon.bg} flex-shrink-0`}
                            >
                              <IconComponent
                                className={`w-4 h-4 ${AlertIcon.color}`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-white">
                                {notification.type}
                                {notification.detail && (
                                  <span className="font-normal text-gray-500 dark:text-gray-400">
                                    {" "}
                                    · {notification.detail}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-300 truncate font-medium">
                                {notification.adherent_nom || notification.num_adherent}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {getAlertDescription(notification)}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {formatRelativeTime(notification.date_envoi)}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(notification.id_alerte);
                              }}
                              disabled={remove.isPending}
                              className="p-1 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0 dark:hover:bg-gray-600 disabled:opacity-50"
                            >
                              <FiX className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                            </button>
                            {!notification.read && (
                              <span className="absolute top-3 right-8 w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </motion.div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer notifications — le dropdown ne montre que les
                  quelques dernières non lues (voir useGetUnread) : ce lien
                  donne accès à l'historique complet, paginé. */}
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-700">
                    {autresNonLues > 0 && (
                      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                        + {autresNonLues} autre{autresNonLues > 1 ? "s" : ""} non lue
                        {autresNonLues > 1 ? "s" : ""}
                      </p>
                    )}
                    <Link
                      to="/notifications"
                      onClick={() => setIsNotificationOpen(false)}
                      className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors flex items-center justify-center gap-1 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      Voir toutes les notifications
                      <FiChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profil utilisateur - Bouton */}
          <div className="relative">
            <motion.button
              ref={profileButtonRef}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors dark:hover:bg-gray-700"
            >
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-ocean-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md overflow-hidden">
                  {user?.photo ? (
                    <img
                      src={photoUrl(user.photo)}
                      alt={user?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user?.name?.charAt(0) || "A"
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full dark:border-gray-800"></span>
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.name || "Admin"}
              </span>
            </motion.button>

            {/* Dropdown Profil */}
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  ref={profileRef}
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 dark:bg-gray-800 dark:border-gray-700"
                >
                  {/* En-tête profil avec gradient */}
                  <div className="px-4 py-6 bg-gradient-to-r from-primary-500 to-ocean-500 text-white text-center">
                    <div className="relative inline-block">
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white/30 mx-auto overflow-hidden">
                        {user?.photo ? (
                          <img
                            src={photoUrl(user.photo)}
                            alt={user?.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          user?.name?.charAt(0) || "A"
                        )}
                      </div>
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></span>
                    </div>
                    <h4 className="font-semibold mt-2">
                      {user?.name || "Administrateur"}
                    </h4>
                    <p className="text-sm text-primary-100">
                      {user?.email || "admin@plongee.com"}
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                        {getRoleLabel(user?.role)}
                      </span>
                    </div>
                  </div>

                  {/* Menu profil avec tous les liens */}
                  <div className="p-2">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FiUser className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Mon profil
                      </span>
                    </Link>

                    <Link
                      to="/change-password"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FiKey className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Changer mot de passe
                      </span>
                    </Link>

                    {/* Lien Créer un utilisateur (visible uniquement pour le DT) */}
                    {hasPermission("manage_users") && (
                      <Link
                        to="/users/create"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FiUserPlus className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Créer un utilisateur
                        </span>
                      </Link>
                    )}

                    {/* Séparateur */}
                    <div className="border-t border-gray-100 dark:border-gray-700 my-2" />

                    {/* Paramètres */}
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FiSettings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Paramètres
                      </span>
                    </Link>
                  </div>

                  {/* Séparateur */}
                  <div className="border-t border-gray-100 dark:border-gray-700" />

                  {/* Bouton déconnexion */}
                  <div className="p-2">
                    <motion.button
                      whileHover={{ x: 5, backgroundColor: "#fef2f2" }}
                      onClick={logout}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-600 hover:text-red-700 transition-colors dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Se déconnecter
                      </span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {selectedAlerte && (
        <AlerteDetailsModal
          alerte={selectedAlerte}
          onClose={() => setSelectedAlerte(null)}
        />
      )}
    </header>
  );
};

export default Header;
