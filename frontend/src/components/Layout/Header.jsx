import React, { useState, useRef, useEffect } from "react";
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
  FiDollarSign,
  FiAward,
  FiX,
  FiChevronRight,
  FiSun,
  FiMoon,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useAlertes } from "../../hooks/useAlertes";
import { formatRelativeTime } from "../../utils/helpers";
import Logo from "../Common/Logo";

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const profileButtonRef = useRef(null);

  // Récupération des alertes
  const { useGetUnread, useMarkAsRead, useMarkAllAsRead, useRemove } =
    useAlertes();
  const { data: unreadData, isLoading: loadingUnread } = useGetUnread();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const remove = useRemove();

  const notifications = unreadData?.data || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

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

  const getAlertIcon = (type) => {
    const icons = {
      "Certificat expiré": {
        icon: FiAlertCircle,
        color: "text-red-500",
        bg: "bg-red-50 dark:bg-red-900/30",
      },
      "Adhésion expirée": {
        icon: FiAlertCircle,
        color: "text-orange-500",
        bg: "bg-orange-50 dark:bg-orange-900/30",
      },
      "Paiement en retard": {
        icon: FiDollarSign,
        color: "text-yellow-500",
        bg: "bg-yellow-50 dark:bg-yellow-900/30",
      },
      Formation: {
        icon: FiAward,
        color: "text-blue-500",
        bg: "bg-blue-50 dark:bg-blue-900/30",
      },
    };
    return (
      icons[type] || {
        icon: FiBell,
        color: "text-gray-500",
        bg: "bg-gray-50 dark:bg-gray-700",
      }
    );
  };

  const getAlertDescription = (alerte) => {
    const descriptions = {
      "Certificat expiré": "Le certificat médical a expiré",
      "Adhésion expirée": "L'adhésion est arrivée à expiration",
      "Paiement en retard": "Un paiement est en attente",
      Formation: "Une formation est disponible",
    };
    return descriptions[alerte.type] || alerte.type;
  };

  const handleMarkAsRead = async (id) => {
    await markAsRead.mutateAsync(id);
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
      president: "👑 Président",
      moniteur: "🏊 Moniteur",
      tresorier: "💰 Trésorier",
      adherent: "🤿 Adhérent",
    };
    return roles[role] || "👤 Utilisateur";
  };

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/80 sticky top-0 z-40 transition-colors duration-300 dark:bg-gray-800/80 dark:border-gray-700/80">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors dark:hover:bg-gray-700"
          >
            <FiMenu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </motion.button>

          <div className="relative hidden md:block">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:bg-gray-600"
            />
          </div>
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
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg"
                >
                  {unreadCount}
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
                            onClick={() =>
                              handleMarkAsRead(notification.id_alerte)
                            }
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

                  {/* Footer notifications */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-700">
                      <button className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors flex items-center justify-center gap-1 dark:text-primary-400 dark:hover:text-primary-300">
                        Voir toutes les notifications
                        <FiChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
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
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-ocean-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                  {user?.name?.charAt(0) || "A"}
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
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white/30 mx-auto">
                        {user?.name?.charAt(0) || "A"}
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

                  {/* Menu profil */}
                  <div className="p-2">
                    {[
                      { icon: FiUser, label: "Mon profil", href: "/profile" },
                      { icon: FiSettings, label: "Paramètres", href: "#" },
                      {
                        icon: FiMail,
                        label: "Messages",
                        href: "#",
                        badge: "3",
                      },
                    ].map((item, index) => (
                      <motion.a
                        key={index}
                        href={item.href}
                        whileHover={{ x: 5, backgroundColor: "#f3f4f6" }}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {item.label}
                          </span>
                        </div>
                        {item.badge && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </motion.a>
                    ))}
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
    </header>
  );
};

export default Header;
