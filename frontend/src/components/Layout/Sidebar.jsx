import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
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
  FiX,
  FiChevronDown,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { photoUrl } from "../../utils/photoUrl";
import Logo from "../Common/Logo";

// Élément de menu simple, ou avec un sous-menu pliable (`item.children`) —
// utilisé par Adhésions/Certificats pour donner un accès direct à la file
// "en attente de validation" sans quitter la vue "toutes". Déplié par
// défaut (un sous-menu replié par défaut passait inaperçu), mais un
// chevron permet de le replier une fois qu'on sait qu'il est là.
const MenuItem = ({ item, isOpen, onNavigate }) => {
  const location = useLocation();
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const currentUrl = `${location.pathname}${location.search}`;
  const [expanded, setExpanded] = useState(true);

  const linkClasses = ({ isActive }) => `
    relative flex items-center gap-3 px-3 py-2.5 rounded-xl
    transition-colors duration-150
    ${
      isActive
        ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
        : "text-gray-600 hover:bg-gray-50 hover:text-cyan-700 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-cyan-400"
    }
    ${!isOpen ? "justify-center" : ""}
    group
  `;

  const linkContent = ({ isActive }) => (
    <>
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-full bg-cyan-500 transition-all duration-150 ${
          isActive ? "h-5 opacity-100" : "h-5 opacity-0"
        }`}
      />

      <item.icon
        className={`relative z-10 w-5 h-5 flex-shrink-0 transition-colors duration-150 ${
          isActive
            ? "text-cyan-600 dark:text-cyan-400"
            : "text-gray-500 group-hover:text-cyan-600 dark:text-gray-500 dark:group-hover:text-cyan-400"
        }`}
      />

      {isOpen && (
        <span className="relative z-10 text-sm font-medium truncate">
          {item.label}
        </span>
      )}
    </>
  );

  if (!hasChildren) {
    return (
      <NavLink to={item.path} onClick={onNavigate} className={linkClasses}>
        {linkContent}
      </NavLink>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-0.5">
        <NavLink
          to={item.path}
          end
          onClick={onNavigate}
          className={({ isActive }) => `flex-1 ${linkClasses({ isActive })}`}
        >
          {linkContent}
        </NavLink>
        {isOpen && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-label={expanded ? "Replier" : "Déplier"}
            className="p-2 rounded-lg text-gray-400 hover:text-cyan-600 hover:bg-gray-50 dark:hover:bg-gray-800/60 dark:hover:text-cyan-400 transition-colors duration-150 flex-shrink-0"
          >
            <FiChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-150 ${expanded ? "" : "-rotate-90"}`}
            />
          </button>
        )}
      </div>

      {isOpen && expanded && (
        <div className="ml-6 pl-2.5 border-l border-gray-200 dark:border-gray-700 mt-0.5 mb-1 space-y-0.5">
          {item.children.map((child) => (
            <NavLink
              key={child.path}
              to={child.path}
              onClick={onNavigate}
              className={() => `
                block px-3 py-2 rounded-lg text-sm truncate transition-colors duration-150
                ${
                  currentUrl === child.path
                    ? "text-cyan-700 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-900/30 font-medium"
                    : "text-gray-500 hover:text-cyan-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-cyan-400"
                }
              `}
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

const MenuSection = ({
  title,
  items,
  isVisible = true,
  isOpen,
  themeTransition,
  onNavigate,
}) => {
  if (!isVisible || items.length === 0) return null;

  return (
    <>
      {isOpen && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={themeTransition}
          className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider dark:text-gray-500"
        >
          {title}
        </motion.p>
      )}
      {items.map((item) => (
        <MenuItem key={item.path} item={item} isOpen={isOpen} onNavigate={onNavigate} />
      ))}
    </>
  );
};

const Sidebar = ({ isOpen, setIsOpen, mobileOpen, setMobileOpen }) => {
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
  // Un adhérent doit voir "Formations" (sa propre progression, en lecture
  // seule) mais pas "Spécialités" (catalogue géré par le staff) — d'où un
  // flag séparé plutôt que d'ajouter "adherent" à canSeeFormations, qui
  // couvre encore Spécialités.
  const canSeeMyFormations = hasRole(["president", "moniteur", "adherent"]);
  const canSeeIncidents = hasRole(["president", "moniteur"]);
  const canSeeRoles = hasRole(["president"]);
  // Sous-menu "Validation" (lien vers ?validation=soumis, qui affiche
  // toutes les auto-soumissions — soumis_par_adherent — quel que soit leur
  // statut) : voir AdhesionService.validerAdhesion /
  // CertificatMedicalService.validerCertificat pour qui peut réellement
  // valider (président/trésorier pour les adhésions, président seul pour
  // les certificats — géré séparément par canManageAdhesion/
  // canManageCertificat dans AdhesionList/CertificatList, pas ici). Un
  // adhérent ne valide rien, mais voit le même sous-menu pour suivre le
  // statut de ses propres soumissions — la liste est déjà scopée à
  // lui-même côté backend (AdhesionService/CertificatMedicalService.getAll)
  // — sans ça, "ma licence a-t-elle été acceptée ?" n'était accessible
  // qu'au staff.
  const canSeeAdhesionValidationMenu = hasRole(["president", "tresorier", "adherent"]);
  const canSeeCertificatValidationMenu = hasRole(["president", "adherent"]);

  // Accès public (Tailscale Funnel, voir k8s/overlays/production/
  // 17-ingress-public.yaml) : seules les routes adhérent sont exposées
  // depuis internet — /api/paiements, /api/materiels, /api/moniteurs,
  // /api/president, /api/tresoriers, /api/users n'existent tout
  // simplement pas sur ce chemin réseau (le contrôleur nginx-public ne
  // les connaît pas). Un président/trésorier PEUT se connecter depuis
  // l'extérieur (l'auth est publique), mais sans ce masquage il verrait
  // des menus dont chaque clic échoue silencieusement (l'appel retombe
  // sur le frontend statique au lieu du JSON attendu). "Incidents" reste
  // volontairement visible : cette route-là est publique (décision
  // produit — un adhérent doit pouvoir signaler un incident hors club).
  const isPublicAccess =
    typeof window !== "undefined" && window.location.hostname.endsWith(".ts.net");

  // Menu général - visible par tous
  const mainMenu = [
    { path: "/dashboard", icon: FiHome, label: "Tableau de bord" },
    canSeeAdherentsList && {
      path: "/adherents",
      icon: FiUsers,
      label: "Adhérents",
    },
    {
      path: "/adhesions",
      icon: FiFileText,
      label: "Adhésions",
      children: canSeeAdhesionValidationMenu
        ? [
            { path: "/adhesions", label: "Toutes les adhésions" },
            {
              path: "/adhesions?validation=soumis",
              label: "Validation",
            },
          ]
        : undefined,
    },
    {
      path: "/certificats",
      icon: FiClipboard,
      label: "Certificats",
      children: canSeeCertificatValidationMenu
        ? [
            { path: "/certificats", label: "Tous les certificats" },
            {
              path: "/certificats?validation=soumis",
              label: "Validation",
            },
          ]
        : undefined,
    },
  ].filter(Boolean);

  const calendrierMenu = [
    { path: "/calendrier", icon: FiCalendar, label: "Calendrier" },
  ];
  const aboutMenu = [
    { path: "/about", icon: FiInfo, label: "À propos" },
    { path: "/confidentialite", icon: FiShield, label: "Confidentialité" },
  ];

  const sortieMenu = [
    { path: "/sorties", icon: FiCalendar, label: "Sorties" },
    { path: "/inscriptions", icon: FiAnchor, label: "Inscriptions" },
    { path: "/plongees", icon: FiActivity, label: "Plongées" },
  ];

  const formationMenu = [
    { path: "/formations", icon: FiAward, label: "Formations" },
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

  const themeTransition = { duration: 0.15, ease: "easeOut" };
  const tapScale = { scale: 0.96 };

  const closeMobileMenu = () => setMobileOpen(false);
  const menuSectionProps = {
    isOpen,
    themeTransition,
    onNavigate: closeMobileMenu,
  };

  return (
    <>
      {/* Fond sombre derrière le tiroir mobile - ferme le menu au clic */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 260 : 72 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={`fixed left-0 top-0 h-full shadow-xl z-50 overflow-hidden transition-colors duration-300 transform md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          theme === "dark"
            ? "bg-gray-900/95 border-r border-cyan-800/30"
            : "bg-white/95 backdrop-blur-xl border-r border-cyan-100/50"
        }`}
        style={{ transitionProperty: "color, background-color, border-color, transform" }}
      >
      <div className="flex flex-col h-full">
        {/* Logo avec taille fixe - bien aligné */}
        <div
          className={`h-16 flex items-center border-b flex-shrink-0 transition-colors duration-300 ${
            isOpen ? "px-4" : "px-1.5"
          } ${theme === "dark" ? "border-cyan-800/30" : "border-cyan-100/50"}`}
        >
          {/* Logo toujours visible avec taille fixe */}
          <div className="flex items-center gap-2 overflow-hidden flex-shrink-0">
            <div
              className={`flex-shrink-0 ${isOpen ? "w-10 h-10" : "w-8 h-8"}`}
            >
              <Logo size={isOpen ? "md" : "sm"} className="flex-shrink-0" />
            </div>

            {/* Texte du logo */}
            <AnimatePresence>
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={themeTransition}
                  className={`text-lg font-bold whitespace-nowrap ${
                    theme === "dark" ? "text-cyan-400" : "text-cyan-700"
                  }`}
                >
                  Plongée Club
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Bouton toggle collapse - desktop uniquement (le tiroir mobile se ferme via le bouton X ou le fond sombre) */}
          <div className="ml-auto flex-shrink-0 hidden md:block">
            <motion.button
              whileTap={tapScale}
              onClick={() => setIsOpen(!isOpen)}
              className={`rounded-lg transition-colors duration-150 flex-shrink-0 ${
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

          {/* Bouton fermeture - mobile uniquement */}
          <div className="ml-auto flex-shrink-0 md:hidden">
            <motion.button
              whileTap={tapScale}
              onClick={closeMobileMenu}
              className={`p-1.5 rounded-lg transition-colors duration-150 flex-shrink-0 ${
                theme === "dark"
                  ? "hover:bg-cyan-900/30 text-cyan-400"
                  : "hover:bg-cyan-100/50 text-cyan-600"
              }`}
            >
              <FiX className="w-5 h-5" />
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
          <MenuSection
            title="Formation"
            items={formationMenu}
            isVisible={canSeeMyFormations}
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
            isVisible={canSeePaiements && !isPublicAccess}
            {...menuSectionProps}
          />
          <MenuSection
            title="Administration"
            items={adminMenu}
            isVisible={canSeeAdministration && !isPublicAccess}
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
            isVisible={canSeeRoles && !isPublicAccess}
            {...menuSectionProps}
          />
          <MenuSection
            title="Utilisateurs"
            items={usersMenu}
            isVisible={canSeeUsers && !isPublicAccess}
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
          <div
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors duration-150 cursor-pointer ${
              theme === "dark" ? "hover:bg-gray-800/60" : "hover:bg-gray-50"
            }`}
            onClick={() => navigate("/profile")}
          >
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
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
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full dark:border-gray-900" />
            </div>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    theme === "dark" ? "text-white" : "text-gray-800"
                  }`}
                >
                  {user?.name || "Administrateur"}
                </p>
                <p
                  className={`text-xs truncate ${
                    theme === "dark" ? "text-cyan-400/70" : "text-cyan-600/70"
                  }`}
                >
                  {user?.role === "president" && "Président"}
                  {user?.role === "moniteur" && "Moniteur"}
                  {user?.role === "tresorier" && "Trésorier"}
                  {user?.role === "adherent" && "Adhérent"}
                </p>
              </div>
            )}
          </div>

          {/* Actions du footer */}
          <div className="flex items-center gap-1 mt-2">
            <motion.button
              whileTap={tapScale}
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors duration-150 ${
                !isOpen ? "justify-center flex-1" : ""
              } ${
                theme === "dark"
                  ? "hover:bg-cyan-900/30 text-cyan-400"
                  : "hover:bg-cyan-100/50 text-cyan-600"
              }`}
              title={theme === "dark" ? "Mode clair" : "Mode sombre"}
            >
              {theme === "dark" ? (
                <FiSun className="w-4 h-4" />
              ) : (
                <FiMoon className="w-4 h-4" />
              )}
              {isOpen && (
                <span className="text-xs font-medium">
                  {theme === "dark" ? "Mode clair" : "Mode sombre"}
                </span>
              )}
            </motion.button>

            <motion.button
              whileTap={tapScale}
              onClick={handleLogout}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors duration-150 ${
                !isOpen ? "justify-center flex-1" : ""
              } text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20`}
              title="Déconnexion"
            >
              <FiLogOut className="w-4 h-4" />
              {isOpen && (
                <span className="text-xs font-medium">Déconnexion</span>
              )}
            </motion.button>
          </div>

          {isOpen && (
            <p
              className={`text-center text-[10px] mt-2 ${
                theme === "dark" ? "text-cyan-500/40" : "text-cyan-400/60"
              }`}
            >
              v1.0.0 • {new Date().getFullYear()} Plongée Club
            </p>
          )}
        </div>
      </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
