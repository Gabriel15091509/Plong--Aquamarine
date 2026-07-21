import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  FiLogOut,
  FiActivity,
  FiInfo,
  FiSun,
  FiMoon,
  FiShield,
  FiUser,
  FiCompass,
  FiStar,
  FiBriefcase,
  FiAlertTriangle,
  FiTool,
  FiDollarSign,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { photoUrl } from "../../utils/photoUrl";
import Logo from "../Common/Logo";

const MenuSection = ({
  title,
  items,
  isVisible = true,
  isOpen,
  theme,
  themeTransition,
  getHoverAnimation,
}) => {
  if (!isVisible || items.length === 0) return null;

  return (
    <>
      {isOpen && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={themeTransition}
          className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider dark:text-gray-500"
        >
          {title}
        </motion.p>
      )}
      {items.map((item) => (
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
              <motion.div
                className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/10 to-teal-500/10"
                    : "group-hover:bg-gradient-to-r group-hover:from-cyan-500/5 group-hover:to-teal-500/5"
                }`}
                layoutId={`bg-${item.path}`}
                transition={themeTransition}
              />

              <motion.div
                className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-b from-cyan-500 to-teal-500"
                    : "group-hover:bg-gradient-to-b group-hover:from-cyan-400/50 group-hover:to-teal-400/50 opacity-0 group-hover:opacity-100"
                }`}
                animate={{
                  height: isActive ? 32 : 8,
                  opacity: isActive ? 1 : 0.3,
                }}
                transition={themeTransition}
              />

              <motion.div
                whileHover={getHoverAnimation("icon")}
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                transition={themeTransition}
              >
                <item.icon
                  className={`relative z-10 w-5 h-5 flex-shrink-0 transition-all duration-300 ${
                    isActive
                      ? "text-cyan-600 dark:text-cyan-400"
                      : "text-gray-500 group-hover:text-cyan-600 dark:text-gray-500 dark:group-hover:text-cyan-400"
                  }`}
                />
              </motion.div>

              {isOpen && (
                <motion.span
                  className="relative z-10 text-sm font-medium"
                  whileHover={getHoverAnimation("menu")}
                  animate={{
                    color: isActive
                      ? theme === "dark"
                        ? "#22d3ee"
                        : "#0891b2"
                      : theme === "dark"
                        ? "#9ca3af"
                        : "#4b5563",
                  }}
                  transition={themeTransition}
                >
                  {item.label}
                </motion.span>
              )}

              <motion.div
                className={`absolute right-3 w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-cyan-500 shadow-lg shadow-cyan-500/50"
                    : "group-hover:bg-cyan-400 group-hover:shadow-lg group-hover:shadow-cyan-400/30 opacity-0 group-hover:opacity-100"
                }`}
                animate={{
                  scale: isActive ? 1 : 0.5,
                  opacity: isActive ? 1 : 0,
                }}
                transition={themeTransition}
              />
            </>
          )}
        </NavLink>
      ))}
    </>
  );
};

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout, hasRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const canSeeSorties = hasRole(["president", "moniteur", "adherent"]);
  const canSeeAdministration = hasRole(["president", "moniteur", "tresorier"]);
  const canSeeUsers = hasRole(["president"]);
  const canSeePaiements = hasRole(["president", "tresorier", "adherent"]);
  const canSeeAdherentsList = hasRole(["president", "moniteur", "tresorier"]);
  const canSeeMateriel = hasRole(["president"]);
  const canSeeFormations = hasRole(["president", "moniteur"]);
  const canSeeIncidents = hasRole(["president", "moniteur"]);
  const canSeeRoles = hasRole(["president"]);

  // ✅ Menu général - visible par tous
  const mainMenu = [
    { path: "/dashboard", icon: FiHome, label: "Tableau de bord" },
    canSeeAdherentsList && {
      path: "/adherents",
      icon: FiUsers,
      label: "Adhérents",
    },
    { path: "/adhesions", icon: FiFileText, label: "Adhésions" },
    { path: "/certificats", icon: FiClipboard, label: "Certificats" },
  ].filter(Boolean);

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
    canSeeMateriel && { path: "/materiels", icon: FiPackage, label: "Matériel" },
    canSeeMateriel && {
      path: "/attributions",
      icon: FiBriefcase,
      label: "Attributions",
    },
    canSeeMateriel && {
      path: "/reparations",
      icon: FiTool,
      label: "Réparations",
    },
    canSeeFormations && {
      path: "/formations",
      icon: FiAward,
      label: "Formations",
    },
    canSeeFormations && {
      path: "/specialites-formation",
      icon: FiStar,
      label: "Spécialités",
    },
  ].filter(Boolean);

  const paiementsMenu = [
    { path: "/paiements", icon: FiCreditCard, label: "Paiements" },
  ];

  const securiteMenu = [
    { path: "/incidents", icon: FiAlertTriangle, label: "Incidents" },
  ];

  const rolesMenu = [
    { path: "/moniteurs", icon: FiCompass, label: "Moniteurs" },
    { path: "/presidents", icon: FiStar, label: "Présidents" },
    { path: "/tresoriers", icon: FiDollarSign, label: "Trésoriers" },
  ];

  const usersMenu = [{ path: "/users", icon: FiShield, label: "Utilisateurs" }];
  const profileMenu = user
    ? [{ path: "/profile", icon: FiUser, label: "Mon profil" }]
    : [];

  const themeTransition = {
    duration: 0.3,
    ease: "easeInOut",
  };

  const getHoverAnimation = (type = "default") => {
    if (theme === "dark") {
      switch (type) {
        case "menu":
          return {
            scale: 1.05,
            x: 5,
            rotate: -2,
            transition: { duration: 0.2 },
          };
        case "icon":
          return { scale: 1.2, rotate: 10, transition: { duration: 0.3 } };
        case "button":
          return {
            scale: 1.1,
            rotate: -5,
            boxShadow: "0 0 30px rgba(6, 182, 212, 0.3)",
            transition: { duration: 0.2 },
          };
        case "theme":
          return { scale: 1.15, rotate: -15, transition: { duration: 0.3 } };
        case "logout":
          return {
            scale: 1.1,
            x: 3,
            backgroundColor: "rgba(239, 68, 68, 0.2)",
            transition: { duration: 0.2 },
          };
        default:
          return { scale: 1.05, transition: { duration: 0.2 } };
      }
    } else {
      switch (type) {
        case "menu":
          return {
            scale: 1.03,
            x: 8,
            rotate: 2,
            transition: { duration: 0.2 },
          };
        case "icon":
          return { scale: 1.15, rotate: -8, transition: { duration: 0.3 } };
        case "button":
          return {
            scale: 1.08,
            rotate: 5,
            boxShadow: "0 0 30px rgba(6, 182, 212, 0.2)",
            transition: { duration: 0.2 },
          };
        case "theme":
          return { scale: 1.12, rotate: 15, transition: { duration: 0.3 } };
        case "logout":
          return {
            scale: 1.08,
            x: 3,
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            transition: { duration: 0.2 },
          };
        default:
          return { scale: 1.03, transition: { duration: 0.2 } };
      }
    }
  };

  const menuSectionProps = { isOpen, theme, themeTransition, getHoverAnimation };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 260 : 72 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`fixed left-0 top-0 h-full shadow-xl z-50 overflow-hidden transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gray-900/95 border-r border-cyan-800/30"
          : "bg-white/95 backdrop-blur-xl border-r border-cyan-100/50"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* ✅ Logo avec taille fixe - bien aligné */}
        <div
          className={`h-16 flex items-center border-b flex-shrink-0 transition-colors duration-300 ${
            isOpen ? "px-4" : "px-1.5"
          } ${theme === "dark" ? "border-cyan-800/30" : "border-cyan-100/50"}`}
        >
          {/* ✅ Logo toujours visible avec taille fixe */}
          <div className="flex items-center gap-2 overflow-hidden flex-shrink-0">
            <motion.div
              whileHover={getHoverAnimation("button")}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative flex-shrink-0"
            >
              <div
                className={`flex-shrink-0 ${isOpen ? "w-10 h-10" : "w-8 h-8"}`}
              >
                <Logo size={isOpen ? "md" : "sm"} className="flex-shrink-0" />
              </div>
              <motion.div
                className={`absolute inset-0 rounded-xl blur-xl -z-10 transition-colors duration-300 ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-cyan-500/30 to-teal-500/30"
                    : "bg-gradient-to-r from-cyan-500/20 to-teal-500/20"
                }`}
                animate={{
                  opacity: theme === "dark" ? 0.6 : 0.3,
                }}
                transition={themeTransition}
              />
            </motion.div>

            {/* ✅ Texte du logo avec animation */}
            <AnimatePresence mode="wait">
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`text-lg font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent transition-colors duration-300 whitespace-nowrap ${
                    theme === "dark"
                      ? "from-cyan-400 to-teal-400"
                      : "from-cyan-600 to-teal-600"
                  }`}
                >
                  Plongée Club
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* ✅ Bouton toggle - toujours visible et bien positionné */}
          <div className="ml-auto flex-shrink-0">
            <motion.button
              whileHover={getHoverAnimation("button")}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(!isOpen)}
              className={`rounded-lg transition-colors duration-300 flex-shrink-0 ${
                isOpen ? "p-1.5" : "p-1"
              } ${
                theme === "dark"
                  ? "hover:bg-cyan-900/30 text-cyan-400"
                  : "hover:bg-cyan-100/50 text-cyan-600"
              }`}
            >
              {isOpen ? (
                <FiChevronLeft className="w-4 h-4" />
              ) : (
                <FiChevronRight className="w-4 h-4" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Navigation */}
        <nav
          className={`flex-1 overflow-y-auto px-2 py-3 space-y-0.5 scrollbar-thin transition-colors duration-300 ${
            theme === "dark"
              ? "scrollbar-thumb-cyan-800"
              : "scrollbar-thumb-cyan-200"
          }`}
        >
          <MenuSection title="Personnel" items={profileMenu} {...menuSectionProps} />

          {isOpen && (
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div
                  className={`w-full border-t transition-colors duration-300 ${
                    theme === "dark"
                      ? "border-cyan-800/30"
                      : "border-cyan-100/50"
                  }`}
                />
              </div>
              <div className="relative flex justify-center">
                <span
                  className={`px-2 text-xs transition-colors duration-300 ${
                    theme === "dark"
                      ? "text-cyan-500/70 bg-gray-900"
                      : "text-cyan-500/70 bg-white"
                  }`}
                >
                  Principal
                </span>
              </div>
            </div>
          )}

          <MenuSection title="Général" items={mainMenu} {...menuSectionProps} />

          {isOpen && (
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div
                  className={`w-full border-t transition-colors duration-300 ${
                    theme === "dark"
                      ? "border-cyan-800/30"
                      : "border-cyan-100/50"
                  }`}
                />
              </div>
              <div className="relative flex justify-center">
                <span
                  className={`px-2 text-xs transition-colors duration-300 ${
                    theme === "dark"
                      ? "text-cyan-500/70 bg-gray-900"
                      : "text-cyan-500/70 bg-white"
                  }`}
                >
                  Activités
                </span>
              </div>
            </div>
          )}

          <MenuSection
            title="Sorties"
            items={sortieMenu}
            isVisible={canSeeSorties}
            {...menuSectionProps}
          />
          <MenuSection title="Calendrier" items={calendrierMenu} {...menuSectionProps} />

          {isOpen && (
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div
                  className={`w-full border-t transition-colors duration-300 ${
                    theme === "dark"
                      ? "border-cyan-800/30"
                      : "border-cyan-100/50"
                  }`}
                />
              </div>
              <div className="relative flex justify-center">
                <span
                  className={`px-2 text-xs transition-colors duration-300 ${
                    theme === "dark"
                      ? "text-cyan-500/70 bg-gray-900"
                      : "text-cyan-500/70 bg-white"
                  }`}
                >
                  Administration
                </span>
              </div>
            </div>
          )}

          <MenuSection
            title="Paiements"
            items={paiementsMenu}
            isVisible={canSeePaiements}
            {...menuSectionProps}
          />
          <MenuSection
            title="Administration"
            items={adminMenu}
            isVisible={canSeeAdministration}
            {...menuSectionProps}
          />
          <MenuSection
            title="Sécurité"
            items={securiteMenu}
            isVisible={canSeeIncidents}
            {...menuSectionProps}
          />
          <MenuSection
            title="Rôles"
            items={rolesMenu}
            isVisible={canSeeRoles}
            {...menuSectionProps}
          />
          <MenuSection
            title="Utilisateurs"
            items={usersMenu}
            isVisible={canSeeUsers}
            {...menuSectionProps}
          />

          {isOpen && (
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div
                  className={`w-full border-t transition-colors duration-300 ${
                    theme === "dark"
                      ? "border-cyan-800/30"
                      : "border-cyan-100/50"
                  }`}
                />
              </div>
              <div className="relative flex justify-center">
                <span
                  className={`px-2 text-xs transition-colors duration-300 ${
                    theme === "dark"
                      ? "text-cyan-500/70 bg-gray-900"
                      : "text-cyan-500/70 bg-white"
                  }`}
                >
                  Informations
                </span>
              </div>
            </div>
          )}

          <MenuSection title="À propos" items={aboutMenu} {...menuSectionProps} />
        </nav>

        {/* Footer */}
        <div
          className={`border-t p-3 flex-shrink-0 transition-colors duration-300 ${
            theme === "dark" ? "border-cyan-800/30" : "border-cyan-100/50"
          }`}
        >
          {/* Profil utilisateur */}
          <motion.div
            whileHover={getHoverAnimation("menu")}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-300 cursor-pointer group ${
              theme === "dark"
                ? "hover:bg-gradient-to-r hover:from-cyan-900/20 hover:to-teal-900/20"
                : "hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-teal-50/50"
            }`}
            onClick={() => navigate("/profile")}
          >
            <div className="relative flex-shrink-0">
              <motion.div
                className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-lg overflow-hidden"
                whileHover={getHoverAnimation("icon")}
                animate={{
                  boxShadow:
                    theme === "dark"
                      ? "0 0 20px rgba(6, 182, 212, 0.3)"
                      : "0 0 15px rgba(6, 182, 212, 0.2)",
                }}
                transition={themeTransition}
              >
                {user?.photo ? (
                  <img
                    src={photoUrl(user.photo)}
                    alt={user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0) || "A"
                )}
              </motion.div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full dark:border-gray-900" />
              <motion.div
                className={`absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-cyan-500/30 to-teal-500/30"
                    : "bg-gradient-to-r from-cyan-500/20 to-teal-500/20"
                }`}
              />
            </div>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate transition-colors duration-300 ${
                    theme === "dark" ? "text-white" : "text-gray-800"
                  }`}
                >
                  {user?.name || "Administrateur"}
                </p>
                <p
                  className={`text-xs truncate transition-colors duration-300 ${
                    theme === "dark" ? "text-cyan-400/70" : "text-cyan-600/70"
                  }`}
                >
                  {user?.role === "president" && "👑 Président"}
                  {user?.role === "moniteur" && "🏊 Moniteur"}
                  {user?.role === "tresorier" && "💰 Trésorier"}
                  {user?.role === "adherent" && "🤿 Adhérent"}
                </p>
              </div>
            )}
          </motion.div>

          {/* Actions du footer */}
          <div className="flex items-center gap-1 mt-2">
            <motion.button
              whileHover={getHoverAnimation("theme")}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-300 ${
                !isOpen ? "justify-center flex-1" : ""
              } ${
                theme === "dark"
                  ? "hover:bg-cyan-900/30 text-cyan-400"
                  : "hover:bg-cyan-100/50 text-cyan-600"
              }`}
              title={theme === "dark" ? "Mode clair" : "Mode sombre"}
            >
              <motion.div
                animate={{
                  rotate: theme === "dark" ? 360 : 0,
                  scale: theme === "dark" ? 1.2 : 1,
                }}
                transition={{ duration: 0.5 }}
              >
                {theme === "dark" ? (
                  <FiSun className="w-4 h-4 text-amber-400" />
                ) : (
                  <FiMoon className="w-4 h-4" />
                )}
              </motion.div>
              {isOpen && (
                <motion.span
                  className="text-xs font-medium"
                  animate={{
                    color: theme === "dark" ? "#e5e7eb" : "#4b5563",
                  }}
                  transition={themeTransition}
                >
                  {theme === "dark" ? "Mode clair" : "Mode sombre"}
                </motion.span>
              )}
            </motion.button>

            <motion.button
              whileHover={getHoverAnimation("logout")}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-300 ${
                !isOpen ? "justify-center flex-1" : ""
              } text-red-500 hover:text-red-600 dark:hover:bg-red-900/20`}
              title="Déconnexion"
            >
              <FiLogOut className="w-4 h-4" />
              {isOpen && (
                <span className="text-xs font-medium">Déconnexion</span>
              )}
            </motion.button>
          </div>

          {isOpen && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={getHoverAnimation("default")}
              className={`text-center text-[10px] mt-2 transition-colors duration-300 cursor-default ${
                theme === "dark" ? "text-cyan-500/40" : "text-cyan-400/60"
              }`}
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
