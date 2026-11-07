import React from "react";
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
  FiChevronLeft,
  FiChevronRight,
  FiLogOut,
  FiActivity,
  FiSettings,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { photoUrl } from "../../utils/photoUrl";
import Logo from "../Common/Logo";
import { useInscriptions } from "../../hooks/Inscription/useInscriptions";
import { usePlongees } from "../../hooks/Plongee/usePlongees";
import { useFormations } from "../../hooks/Formation/useFormations";
import { useAdhesions } from "../../hooks/Adhesion/useAdhesions";
import { useCertificats } from "../../hooks/CertificatMedical/useCertificats";

// Élément de menu simple (plus de sous-menu dépliable — les vues qui en
// avaient un, ex. "Validation"/"Mes X", sont désormais des onglets DANS
// la page elle-même, voir TabBar.jsx, pour raccourcir la sidebar).
const MenuItem = ({ item, isOpen, onNavigate }) => {
  // "Incidents" a rejoint les onglets du groupe Sorties (voir
  // useSortieTabs.js) mais vit sous /incidents, un chemin qui ne commence
  // pas par /sorties : le matching par défaut de NavLink (actif si
  // location.pathname commence par `to`) ne surligne donc plus rien dans
  // la sidebar une fois sur cet onglet. `activePaths` liste les chemins
  // supplémentaires à traiter comme cet item pour la surbrillance, sans
  // toucher la navigation elle-même (toujours portée par `item.path`).
  const location = useLocation();
  const extraActive = (item.activePaths || []).some(
    (p) => location.pathname === p || location.pathname.startsWith(`${p}/`),
  );

  const linkClasses = ({ isActive }) => `
    relative flex items-center gap-3 px-3 py-2.5 rounded-xl
    transition-colors duration-150
    ${
      isActive || extraActive
        ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
        : "text-gray-600 hover:bg-gray-50 hover:text-cyan-700 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-cyan-400"
    }
    ${!isOpen ? "justify-center" : ""}
    group
  `;

  const badgeCount = item.badge > 0 ? (item.badge > 99 ? "99+" : item.badge) : null;

  const linkContent = ({ isActive: navActive }) => {
    const isActive = navActive || extraActive;
    return (
    <>
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-full bg-cyan-500 transition-all duration-150 ${
          isActive ? "h-5 opacity-100" : "h-5 opacity-0"
        }`}
      />

      <span className="relative flex-shrink-0">
        <item.icon
          className={`relative z-10 w-5 h-5 flex-shrink-0 transition-colors duration-150 ${
            isActive
              ? "text-cyan-600 dark:text-cyan-400"
              : "text-gray-500 group-hover:text-cyan-600 dark:text-gray-500 dark:group-hover:text-cyan-400"
          }`}
        />
        {/* Replié : un point rouge suffit sur l'icône, pas la place pour un chiffre */}
        {!isOpen && badgeCount && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
        )}
      </span>

      {isOpen && (
        <span className="relative z-10 text-sm font-medium truncate">
          {item.label}
        </span>
      )}

      {isOpen && badgeCount && (
        <span className="relative z-10 ml-auto min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full flex-shrink-0">
          {badgeCount}
        </span>
      )}
    </>
    );
  };

  return (
    <NavLink to={item.path} onClick={onNavigate} className={linkClasses}>
      {linkContent}
    </NavLink>
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
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (await logout()) navigate("/login");
  };

  const canSeeSorties = hasRole(["president", "moniteur", "adherent"]);
  const canSeeAdministration = hasRole(["president", "moniteur", "tresorier"]);
  const canSeePaiements = hasRole(["president", "tresorier", "adherent"]);
  const canSeeAdherentsList = hasRole(["president", "moniteur", "tresorier"]);
  const canSeeMateriel = hasRole(["president"]);
  // Accès direct pour un adhérent/moniteur : seul l'onglet "Attributions"
  // leur est ouvert dans ce groupe (voir MaterielGroupPage.needsPresident +
  // AttributionService.getAll côté backend), pas de sens à les envoyer sur
  // /materiels (onglet "Matériel", réservé président) comme le fait
  // l'entrée ci-dessus pour lui.
  const canSeeMesAttributions = hasRole(["moniteur", "adherent"]);
  // "Spécialités"/"Brevets" fusionnées en onglets DANS "Formations" (voir
  // formationMenu ci-dessous et constants/formationTabs.js) — un adhérent
  // atteint donc "Spécialités" via l'URL directe s'il la connaît déjà,
  // mais la garde de rôle réelle vit dans FormationGroupPage.jsx (comme
  // pour Adhérents/création dans MembresPage.jsx), pas ici.
  const canSeeMyFormations = hasRole(["president", "moniteur", "adherent"]);

  // Accès public (Tailscale Funnel, voir k8s/overlays/production/
  // 17-ingress-public.yaml) : seules les routes adhérent sont exposées
  // depuis internet — /api/paiements, /api/materiels, /api/moniteurs,
  // /api/president, /api/tresoriers, /api/users n'existent tout
  // simplement pas sur ce chemin réseau (le contrôleur nginx-public ne
  // les connaît pas). Un président/trésorier PEUT se connecter depuis
  // l'extérieur (l'auth est publique), mais sans ce masquage il verrait
  // des menus dont chaque clic échoue silencieusement (l'appel retombe
  // sur le frontend statique au lieu du JSON attendu). "Incidents" a
  // rejoint les onglets du groupe Sorties (voir useSortieTabs.js) : plus
  // de lien sidebar dédié à masquer ici pour lui.
  const isPublicAccess =
    typeof window !== "undefined" && window.location.hostname.endsWith(".ts.net");

  // Badges (petits compteurs sur le menu) : uniquement pour le staff qui peut
  // réellement agir sur la file en question — un adhérent n'a aucun bouton
  // pour "traiter" ces éléments, un chiffre serait juste du bruit pour lui.
  // Chaque badge lit un COUNT léger côté serveur (voir useGetPendingCount
  // ci-dessous), jamais un useGetAll() de la liste complète : la Sidebar est
  // montée sur TOUTES les pages, donc un badge basé sur useGetAll s'ajoute
  // systématiquement aux requêtes propres de la page réellement affichée
  // (ex: /sorties, qui a déjà 4-5 appels) — sur le serveur de dev Vite
  // (HTTP/1.1, 6 connexions/origine max), ça suffisait à mettre en file
  // d'attente les requêtes de la page visible derrière celles, sans lien,
  // des badges des AUTRES sections. `enabled` évite même ce premier appel
  // pour les rôles qui ne verront jamais le badge.
  const canManageInscriptionsBadge = hasRole(["president", "moniteur"]);
  const canManagePlongeesBadge = hasRole(["president", "moniteur"]);
  const canManageFormationsBadge = hasRole(["president", "moniteur"]);
  const canManageAdhesionValidation = hasRole(["president", "tresorier"]);
  const canManageCertificatValidation = hasRole(["president"]);

  // useGetPendingCount (COUNT léger côté serveur) plutôt que useGetAll
  // filtré côté client ci-après : ce dernier recomposait `.adherent` par
  // HTTP pour CHAQUE inscription existante (voir InscriptionService.getAll)
  // rien que pour en jeter le contenu et ne garder qu'un chiffre — sur un
  // club avec de l'historique, cet appel à lui seul dépassait 8s et, la
  // Sidebar étant montée sur toutes les pages, retardait par ricochet (limite
  // Chrome de 6 connexions/origine) le chargement de la page réellement
  // demandée (ex. /plongees). Le queryKey ["inscriptions", ...] de
  // useGetAll reste partagé avec InscriptionList.jsx (dédoublonnage React
  // Query) — mais useGetPendingCount, lui, n'est plus partagé : c'est
  // volontaire, un second appel léger vaut mieux qu'un seul appel lourd.
  const { useGetPendingCount } = useInscriptions();
  const { data: pendingInscriptionsData } = useGetPendingCount({
    enabled: canManageInscriptionsBadge,
  });
  const nouvellesInscriptions = canManageInscriptionsBadge
    ? pendingInscriptionsData?.data?.count || 0
    : 0;

  // useGetAValiderCount (COUNT léger côté serveur) plutôt que useGetAll +
  // filtre client — même motif que useGetPendingCount ci-dessus : la liste
  // complète des plongées du club n'est utile qu'à PlongeeList, jamais à ce
  // seul chiffre de badge.
  const { useGetAValiderCount } = usePlongees();
  const { data: plongeesAValiderData } = useGetAValiderCount({
    enabled: canManagePlongeesBadge,
  });
  const plongeesAValider = canManagePlongeesBadge
    ? plongeesAValiderData?.data?.count || 0
    : 0;

  // "Prêtes à terminer" plutôt que "Terminées" : une formation Terminée le
  // reste pour toujours (rien à traiter après), le badge ne retomberait
  // donc jamais à zéro tout seul. Ici on compte celles qui ont atteint leur
  // nombre de séances prévues mais attendent encore le clic "Terminer" du
  // moniteur — actionnable, et ça se vide une fois traité, comme les autres
  // badges.
  // useGetPretesATerminerCount (COUNT léger côté serveur) plutôt que
  // useGetAll + filtre client — même motif que useGetPendingCount ci-dessus.
  const { useGetPretesATerminerCount } = useFormations();
  const { data: formationsPretesData } = useGetPretesATerminerCount({
    enabled: canManageFormationsBadge,
  });
  const formationsPretesATerminer = canManageFormationsBadge
    ? formationsPretesData?.data?.count || 0
    : 0;

  // useGetEnAttenteValidationCount (COUNT léger côté serveur) plutôt que
  // useGetAll + filtre client — même motif que useGetPendingCount ci-dessus.
  const { useGetEnAttenteValidationCount: useGetAdhesionsEnAttenteCount } = useAdhesions();
  const { data: adhesionsEnAttenteData } = useGetAdhesionsEnAttenteCount({
    enabled: canManageAdhesionValidation,
  });
  const adhesionsEnAttente = canManageAdhesionValidation
    ? adhesionsEnAttenteData?.data?.count || 0
    : 0;

  const { useGetEnAttenteValidationCount: useGetCertificatsEnAttenteCount } = useCertificats();
  const { data: certificatsEnAttenteData } = useGetCertificatsEnAttenteCount({
    enabled: canManageCertificatValidation,
  });
  const certificatsEnAttente = canManageCertificatValidation
    ? certificatsEnAttenteData?.data?.count || 0
    : 0;

  // Menu général - visible par tous
  const mainMenu = [
    { path: "/dashboard", icon: FiHome, label: "Tableau de bord" },
    // Libellé "Membres" (et non "Adhérents") : ce lien sert aussi de point
    // d'entrée vers Moniteurs/Présidents/Trésoriers via les onglets de la
    // page (voir plus bas) — la route reste /adherents, seul le libellé
    // change pour refléter ce rôle de hub.
    canSeeAdherentsList && {
      path: "/adherents",
      icon: FiUsers,
      label: "Membres",
    },
    // "Validation" (?validation=soumis, toutes les auto-soumissions
    // soumis_par_adherent quel que soit leur statut) n'est plus un
    // sous-menu ici — c'est désormais un onglet DANS AdhesionList.jsx/
    // CertificatList.jsx (voir TabBar), pour raccourcir la sidebar.
    //
    // Adhésions/Certificats fusionnés en une seule entrée ("Dossier") :
    // les deux représentent le même dossier administratif du club
    // (licence FFESM/assurance d'un côté, certificat médical de l'autre)
    // — un seul point d'entrée, depuis lequel on rejoint l'autre via
    // TabBar (constants/dossierTabs.js), même schéma que "Membres"
    // ci-dessus pour Adhérents/Moniteurs/Présidents/Trésoriers. Badge =
    // somme des deux compteurs en attente, pour ne rien perdre de
    // l'alerte qu'avaient les 2 entrées séparées.
    {
      path: "/adhesions",
      icon: FiFileText,
      label: "Dossier",
      badge: adhesionsEnAttente + certificatsEnAttente,
    },
  ].filter(Boolean);

  const calendrierMenu = [
    { path: "/calendrier", icon: FiCalendar, label: "Calendrier" },
  ];

  const sortieMenu = [
    // "Mes sorties"/"Sorties que j'encadre"/"Carte des sites"/"Incidents"
    // (?filtre=mes-sorties, ?filtre=mes-sorties-encadrees, /sorties/carte,
    // /incidents) ne sont plus un sous-menu ici — ce sont désormais des
    // onglets DANS SortiesPage.jsx/SortieCartePage.jsx/IncidentsPage.jsx
    // (voir TabBar/useSortieTabs), pour raccourcir la sidebar. /incidents
    // ne commence pas par /sorties (ex-section "Sécurité" à part) :
    // activePaths force la surbrillance de "Sorties" quand on y est, sinon
    // plus rien ne s'allume dans la sidebar sur cet onglet (voir
    // MenuItem/extraActive dans ce fichier).
    { path: "/sorties", icon: FiCalendar, label: "Sorties", activePaths: ["/incidents"] },
    {
      path: "/inscriptions",
      icon: FiAnchor,
      label: "Inscriptions",
      badge: nouvellesInscriptions,
    },
    // "Mes plongées" (?filtre=mes-plongees) : idem, onglet DANS
    // PlongeeList.jsx désormais.
    {
      path: "/plongees",
      icon: FiActivity,
      label: "Plongées",
      badge: plongeesAValider,
    },
  ];

  // "Brevets"/"Spécialités" : fusionnées dans des onglets DANS la page
  // (TabBar, voir constants/formationTabs.js), même schéma que Matériel/
  // Attributions/Réparations ci-dessus — un seul point d'entrée sidebar
  // ("Formations", route /formations), depuis lequel un président/
  // moniteur rejoint Spécialités/Brevets via ces onglets (un adhérent n'a
  // que Formations/Brevets, voir FormationGroupPage.jsx).
  const formationMenu = [
    {
      path: "/formations",
      icon: FiAward,
      label: "Formations",
      badge: formationsPretesATerminer,
    },
  ];

  // "Attributions"/"Réparations" : fusionnées dans des onglets DANS la page
  // (TabBar, voir constants/materielTabs.js), même schéma que Moniteurs/
  // Présidents/Trésoriers ci-dessous pour Membres — un point d'entrée
  // sidebar ("Matériel", route /materiels), depuis lequel un président
  // rejoint Attributions/Réparations via ces onglets. Un moniteur/adhérent
  // (canSeeMesAttributions) a sa propre entrée pointant directement sur
  // /attributions (seul onglet qui leur soit ouvert, voir
  // MaterielGroupPage.needsPresident) — jamais les deux à la fois, un
  // compte n'a qu'un rôle.
  const adminMenu = [
    canSeeMateriel && { path: "/materiels", icon: FiPackage, label: "Matériel" },
    canSeeMesAttributions && { path: "/attributions", icon: FiPackage, label: "Matériel" },
  ].filter(Boolean);

  const paiementsMenu = [
    { path: "/paiements", icon: FiCreditCard, label: "Paiements" },
  ];

  // "Moniteurs"/"Présidents"/"Trésoriers" (ex-section "Rôles") : fusionnés
  // dans des onglets DANS la page (TabBar, voir constants/roleTabs.js) —
  // la page "Utilisateurs" elle-même a depuis été supprimée : sa gestion
  // de compte vit désormais sur la fiche Détails de chaque moniteur/
  // président/trésorier/adhérent (AccountManagementCard.jsx). Le point
  // d'entrée sidebar pour toute cette famille de pages est désormais
  // l'entrée "Membres" ci-dessous (canSeeAdherentsList, route /adherents),
  // depuis laquelle un président rejoint Moniteurs/Présidents/Trésoriers
  // via ces onglets.

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
          {/* "Mon profil" retiré de la sidebar (déjà accessible depuis le
              menu déroulant de l'avatar dans Header.jsx) : plus de section
              "Personnel" ici. */}
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
            {/* Le thème vit désormais dans Paramètres (voir
                ParametresPage.jsx, lié depuis le dropdown profil de
                Header.jsx) avec tout ce qui EST du paramétrage — ce bouton
                y renvoie directement plutôt que de dupliquer le toggle ici. */}
            <motion.button
              whileTap={tapScale}
              onClick={() => navigate("/parametres")}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors duration-150 ${
                !isOpen ? "justify-center flex-1" : ""
              } ${
                theme === "dark"
                  ? "hover:bg-cyan-900/30 text-cyan-400"
                  : "hover:bg-cyan-100/50 text-cyan-600"
              }`}
              title="Paramètres"
            >
              <FiSettings className="w-4 h-4" />
              {isOpen && (
                <span className="text-xs font-medium">Paramètres</span>
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
