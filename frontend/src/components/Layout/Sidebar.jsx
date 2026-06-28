import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiPackage,
  FiAward,
  FiFileText,
  FiCreditCard,
  FiAnchor,
  FiClipboard,
  FiChevronLeft,
  FiChevronRight,
  FiSettings,
  FiHelpCircle,
  FiLogOut,
  FiActivity,
  FiInfo,
  FiSun,
  FiMoon,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Logo from "../Common/Logo";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout, hasRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ✅ Menu général - visible par tous
  const mainMenu = [
    { path: "/dashboard", icon: FiHome, label: "Tableau de bord" },
    { path: "/adherents", icon: FiUsers, label: "Adhérents" },
    { path: "/adhesions", icon: FiFileText, label: "Adhésions" },
    { path: "/certificats", icon: FiClipboard, label: "Certificats" },
  ];

  const calendrierMenu = [
    { path: "/calendrier", icon: FiCalendar, label: "Calendrier" },
  ];
  const aboutMenu = [{ path: "/about", icon: FiInfo, label: "À propos" }];

  const sortieMenu = [
    { path: "/sorties", icon: FiCalendar, label: "Sorties" },
    { path: "/inscriptions", icon: FiAnchor, label: "Inscriptions" },
    { path: "/plongees", icon: FiActivity, label: "Plongées" },
  ];

  const adminMenu = [
    { path: "/paiements", icon: FiCreditCard, label: "Paiements" },
    { path: "/materiels", icon: FiPackage, label: "Matériel" },
    { path: "/formations", icon: FiAward, label: "Formations" },
  ];

  const usersMenu = [{ path: "/users", icon: FiShield, label: "Utilisateurs" }];
  const profileMenu = [{ path: "/profile", icon: FiUser, label: "Mon profil" }];

  const canSeeSorties = hasRole(["president", "moniteur", "adherent"]);
  const canSeeAdministration = hasRole(["president", "moniteur", "tresorier"]);
  const canSeeUsers = hasRole(["president"]);
  const canSeePaiements = hasRole(["president", "tresorier"]);
  const canSeeMateriel = hasRole(["president"]);
  const canSeeFormations = hasRole(["president", "moniteur"]);

  const MenuSection = ({ title, items, isVisible = true }) => {
    if (!isVisible || items.length === 0) return null;

    return (
      <>
        {isOpen && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider dark:text-gray-500"
          >
            {title}
          </motion.p>
        )}
        {items.map((item) => {
          if (item.path === "/paiements" && !canSeePaiements) return null;
          if (item.path === "/materiels" && !canSeeMateriel) return null;
          if (item.path === "/formations" && !canSeeFormations) return null;
          if (item.path === "/users" && !canSeeUsers) return null;
          if (item.path === "/profile" && !user) return null;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-300 ease-out
                ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-50 to-teal-50 text-cyan-700 shadow-sm dark:from-cyan-900/30 dark:to-teal-900/30 dark:text-cyan-400"
                    : "text-gray-600 hover:text-cyan-700 dark:text-gray-400 dark:hover:text-cyan-400"
                }
                ${!isOpen ? "justify-center" : ""}
                group
              `}
            >
              {({ isActive }) => (
                <>
                  {/* ✅ Effet de survol - barre lumineuse */}
                  <div
                    className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-500/10 to-teal-500/10"
                        : "group-hover:bg-gradient-to-r group-hover:from-cyan-500/5 group-hover:to-teal-500/5"
                    }`}
                  />

                  {/* ✅ Effet de survol - bordure gauche */}
                  <div
                    className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-full transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-b from-cyan-500 to-teal-500"
                        : "group-hover:bg-gradient-to-b group-hover:from-cyan-400/50 group-hover:to-teal-400/50 opacity-0 group-hover:opacity-100"
                    }`}
                  />

                  <item.icon
                    className={`relative z-10 w-5 h-5 flex-shrink-0 transition-all duration-300 ${
                      isActive
                        ? "text-cyan-600 dark:text-cyan-400"
                        : "text-gray-500 group-hover:text-cyan-600 dark:text-gray-500 dark:group-hover:text-cyan-400"
                    }`}
                  />
                  {isOpen && (
                    <span className="relative z-10 text-sm font-medium">
                      {item.label}
                    </span>
                  )}

                  {/* ✅ Effet de survol - indicateur lumineux */}
                  <div
                    className={`absolute right-3 w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      isActive
                        ? "bg-cyan-500 shadow-lg shadow-cyan-500/50"
                        : "group-hover:bg-cyan-400 group-hover:shadow-lg group-hover:shadow-cyan-400/30 opacity-0 group-hover:opacity-100"
                    }`}
                  />
                </>
              )}
            </NavLink>
          );
        })}
      </>
    );
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 260 : 72 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 h-full bg-white/80 backdrop-blur-xl border-r border-cyan-100/50 shadow-xl z-50 overflow-hidden dark:bg-gray-900/80 dark:border-cyan-800/30"
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-cyan-100/50 flex-shrink-0 dark:border-cyan-800/30">
          <div className="flex items-center gap-2 overflow-hidden">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative"
            >
              <Logo size="md" className="flex-shrink-0" />
              {/* ✅ Effet de lueur autour du logo */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 to-teal-500/20 blur-xl -z-10" />
            </motion.div>
            {isOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent dark:from-cyan-400 dark:to-teal-400"
              >
                Plongée Club
              </motion.span>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: isOpen ? 5 : -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg hover:bg-cyan-100/50 transition-colors flex-shrink-0 dark:hover:bg-cyan-900/30"
          >
            {isOpen ? (
              <FiChevronLeft className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            ) : (
              <FiChevronRight className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            )}
          </motion.button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 scrollbar-thin scrollbar-thumb-cyan-200 dark:scrollbar-thumb-cyan-800">
          <MenuSection title="Personnel" items={profileMenu} />

          {isOpen && (
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-cyan-100/50 dark:border-cyan-800/30" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 text-xs text-cyan-500/70 bg-white dark:bg-gray-900">
                  Principal
                </span>
              </div>
            </div>
          )}

          <MenuSection title="Général" items={mainMenu} />

          {isOpen && (
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-cyan-100/50 dark:border-cyan-800/30" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 text-xs text-cyan-500/70 bg-white dark:bg-gray-900">
                  Activités
                </span>
              </div>
            </div>
          )}

          <MenuSection
            title="Sorties"
            items={sortieMenu}
            isVisible={canSeeSorties}
          />
          <MenuSection title="Calendrier" items={calendrierMenu} />

          {isOpen && (
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-cyan-100/50 dark:border-cyan-800/30" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 text-xs text-cyan-500/70 bg-white dark:bg-gray-900">
                  Administration
                </span>
              </div>
            </div>
          )}

          <MenuSection
            title="Administration"
            items={adminMenu}
            isVisible={canSeeAdministration}
          />
          <MenuSection
            title="Utilisateurs"
            items={usersMenu}
            isVisible={canSeeUsers}
          />

          {isOpen && (
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-cyan-100/50 dark:border-cyan-800/30" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 text-xs text-cyan-500/70 bg-white dark:bg-gray-900">
                  Informations
                </span>
              </div>
            </div>
          )}

          <MenuSection title="À propos" items={aboutMenu} />
        </nav>

        {/* Footer */}
        <div className="border-t border-cyan-100/50 dark:border-cyan-800/30 p-3 flex-shrink-0">
          {/* Profil utilisateur avec effet de survol */}
          <motion.div
            whileHover={{ x: 5, scale: 1.02 }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-teal-50/50 transition-all duration-300 cursor-pointer dark:hover:from-cyan-900/20 dark:hover:to-teal-900/20 group"
            onClick={() => navigate("/profile")}
          >
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-lg group-hover:shadow-cyan-500/30 transition-shadow duration-300">
                {user?.name?.charAt(0) || "A"}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full dark:border-gray-900" />
              {/* ✅ Effet de lueur autour de l'avatar */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-teal-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate dark:text-white">
                  {user?.name || "Administrateur"}
                </p>
                <p className="text-xs text-cyan-600/70 truncate dark:text-cyan-400/70">
                  {user?.role === "president" && "👑 Président"}
                  {user?.role === "moniteur" && "🏊 Moniteur"}
                  {user?.role === "tresorier" && "💰 Trésorier"}
                  {user?.role === "adherent" && "🤿 Adhérent"}
                </p>
              </div>
            )}
          </motion.div>

          {/* Actions du footer avec effets de survol */}
          <div className="flex items-center gap-1 mt-2">
            {/* Toggle Thème */}
            <motion.button
              whileHover={{ scale: 1.05, rotate: theme === "dark" ? -10 : 10 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cyan-100/50 transition-all duration-300 dark:hover:bg-cyan-900/30 ${
                !isOpen ? "justify-center flex-1" : ""
              }`}
              title={theme === "dark" ? "Mode clair" : "Mode sombre"}
            >
              {theme === "dark" ? (
                <>
                  <FiSun className="w-4 h-4 text-amber-400" />
                  {isOpen && (
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      Mode clair
                    </span>
                  )}
                </>
              ) : (
                <>
                  <FiMoon className="w-4 h-4 text-cyan-600" />
                  {isOpen && (
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      Mode sombre
                    </span>
                  )}
                </>
              )}
            </motion.button>

            {/* Paramètres */}
            {hasRole(["president", "moniteur", "tresorier"]) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/settings")}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cyan-100/50 transition-all duration-300 text-gray-500 hover:text-cyan-700 dark:hover:bg-cyan-900/30 dark:text-gray-400 dark:hover:text-cyan-400 ${
                  !isOpen ? "justify-center flex-1" : ""
                }`}
                title="Paramètres"
              >
                <FiSettings className="w-4 h-4" />
                {isOpen && (
                  <span className="text-xs font-medium">Paramètres</span>
                )}
              </motion.button>
            )}

            {/* Aide */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/help")}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cyan-100/50 transition-all duration-300 text-gray-500 hover:text-cyan-700 dark:hover:bg-cyan-900/30 dark:text-gray-400 dark:hover:text-cyan-400 ${
                !isOpen ? "justify-center flex-1" : ""
              }`}
              title="Aide"
            >
              <FiHelpCircle className="w-4 h-4" />
              {isOpen && <span className="text-xs font-medium">Aide</span>}
            </motion.button>

            {/* Déconnexion */}
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "#fef2f2" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-all duration-300 text-red-500 hover:text-red-600 dark:hover:bg-red-900/20 ${
                !isOpen ? "justify-center flex-1" : ""
              }`}
              title="Déconnexion"
            >
              <FiLogOut className="w-4 h-4" />
              {isOpen && (
                <span className="text-xs font-medium">Déconnexion</span>
              )}
            </motion.button>
          </div>

          {/* Version */}
          {isOpen && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-[10px] text-cyan-400/60 dark:text-cyan-500/40 mt-2"
            >
              v1.0.0 • {new Date().getFullYear()} Plongée Club
            </motion.p>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
