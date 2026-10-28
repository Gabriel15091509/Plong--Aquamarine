import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiClock,
  FiXCircle,
  FiEye,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiX,
  FiAnchor,
  FiUserPlus,
  FiUserCheck,
  FiList,
  FiGrid,
  FiTrendingDown,
  FiCheckSquare,
  FiFileText,
  FiClipboard,
  FiAlertTriangle,
  FiRefreshCw,
} from "react-icons/fi";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useInscriptions } from "../../hooks/Inscription/useInscriptions";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useMoniteurs } from "../../hooks/Moniteur/useMoniteurs";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/Common/LoadingSpinner";
import ModalOverlay from "../../components/Common/ModalOverlay";
import ConfirmModal from "../../components/Common/ConfirmModal";
import BulkActionBar from "../../components/Common/BulkActionBar";
import Pagination from "../../components/Common/Pagination";
import ErrorState from "../../components/Common/ErrorState";
import ModalLink from "../../components/Common/ModalLink";
import TabBar from "../../components/Common/TabBar";
import { useSelection } from "../../hooks/useSelection";
import { useModalNavigate } from "../../hooks/useModalNavigate";
import { useSortieTabs } from "../../hooks/Sortie/useSortieTabs";
import sortieService from "../../services/Sortie/sortieService";
import SortieRouteMapMini from "../../components/Sortie/SortieRouteMapMini";
import SortieRouteModal from "../../components/Sortie/SortieRouteModal";
import SortieWeatherBadge from "../../components/Sortie/SortieWeatherBadge";
import SortieFormModal from "../../components/Sortie/SortieFormModal";
import SortieDetails from "../../components/Sortie/SortieDetails";

import {
  formatDateTime,
  joursRestants,
  formatCompteARebours,
  sortieDoitEtreCloturee,
} from "../../utils/helpers";
import { TYPE_SORTIE_OPTIONS } from "../../utils/constants";

// Configuration des statuts de sortie
const SORTIE_STATUS = [
  { value: "all", label: "Tous" },
  { value: "Planifiée", label: "Planifiée" },
  { value: "En cours", label: "En cours" },
  { value: "Terminée", label: "Terminée" },
  { value: "Annulée", label: "Annulée" },
];

// Filtre par type d'activité — mêmes valeurs que le formulaire de création
// (TYPE_SORTIE_OPTIONS), avec "Tous" en tête comme pour le statut.
const SORTIE_TYPES = ["all", ...TYPE_SORTIE_OPTIONS];

const SortiesPage = () => {
  const modalNavigate = useModalNavigate();
  const [searchParams] = useSearchParams();
  // Onglets remplaçant l'ancien sous-menu dépliable "Sorties" de la Sidebar
  // (voir Sidebar.jsx) — partagés avec SortieCartePage.jsx (voir
  // useSortieTabs.js).
  const sortieTabs = useSortieTabs();

  const { useGetAll, useRemove, useUpdate } = useSorties();
  const { useGetAll: useGetAllInscriptions, useCreate: useCreateInscription } =
    useInscriptions();
  const { useGetAll: useGetAllAdherents } = useAdherents();
  const { useGetAll: useGetAllMoniteurs } = useMoniteurs();
  const { user, hasRole } = useAuth();
  const canManageSortie = hasRole(["president", "moniteur"]);
  // Distinct de canManageSortie (staff, président ET moniteur) : sert
  // uniquement à réserver le filtre "Encadrant" (liste de TOUS les
  // encadrants du club) au président — voir moniteurFilter plus bas.
  const isPresident = user?.role === "president";

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState(null);
  // Clé de l'action en cours d'une carte (`delete-<id>`, `cancel-<id>`) :
  // seule l'icône de la carte concernée passe en spinner (même motif que
  // InscriptionList.jsx).
  const [actionLoading, setActionLoading] = useState(null);
  const [annulerModal, setAnnulerModal] = useState(null);
  const [routeModal, setRouteModal] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  // Sous-menu sidebar "Mes sorties" (?filtre=mes-sorties, voir Sidebar.jsx) —
  // même pattern que showValidationOnly dans AdhesionList/CertificatList.
  const [mesSortiesOnly, setMesSortiesOnly] = useState(
    searchParams.get("filtre") === "mes-sorties",
  );
  // Sous-menu sidebar "Sorties que j'encadre" (?filtre=mes-sorties-
  // encadrees, réservé au moniteur, voir Sidebar.jsx) : distinct de
  // "Mes sorties" (réservé à l'adhérent, basé sur ses inscriptions) —
  // ici basé sur Sortie.encadrants, la liste des moniteurs désignés.
  const [mesSortiesEncadreesFiltre, setMesSortiesEncadreesOnly] = useState(
    searchParams.get("filtre") === "mes-sorties-encadrees",
  );
  // Un moniteur ne voit jamais "toutes les sorties" (pas d'onglet dédié,
  // voir useSortieTabs.js) : sa liste est toujours limitée à celles qu'il
  // encadre.
  const mesSortiesEncadreesOnly = user?.role === "moniteur" || mesSortiesEncadreesFiltre;
  // Filtre "Encadrant" : contrairement à mesSortiesEncadreesOnly ci-dessus
  // (toujours "moi"), celui-ci permet de choisir N'IMPORTE QUEL moniteur
  // dans la liste — donc de voir la charge d'encadrement de tout le club en
  // un coup d'œil. Réservé au président (voir la condition d'affichage plus
  // bas, isPresident) : un moniteur n'a pas à parcourir les sorties confiées
  // aux autres, seulement les siennes (mesSortiesEncadreesOnly, ou aucun
  // filtre pour voir tout comme n'importe quel staff).
  const [moniteurFilter, setMoniteurFilter] = useState("all");
  useEffect(() => {
    setMesSortiesOnly(searchParams.get("filtre") === "mes-sorties");
    const encadreesOnly = searchParams.get("filtre") === "mes-sorties-encadrees";
    setMesSortiesEncadreesOnly(encadreesOnly);
    // Le filtre "Encadrant" (voir plus bas, masqué dans cette vue car
    // redondant — elle est déjà scopée à "moi") ne doit pas continuer à
    // restreindre silencieusement les résultats une fois caché : une valeur
    // choisie avant de basculer ici resterait active sans plus aucun
    // contrôle visible pour l'expliquer ou la changer — confusion.
    if (encadreesOnly) setMoniteurFilter("all");
    setCurrentPage(1);
  }, [searchParams]);
  const itemsPerPage = 12;

  const {
    data: sortiesData,
    isLoading: loadingSorties,
    error: sortiesError,
    refetch,
  } = useGetAll();

  const { data: adherentsData } = useGetAllAdherents();
  // Sert à résoudre le moniteur connecté (id_moniteur, pour "Sorties que
  // j'encadre" et canManageCetteSortie ci-dessous — nécessaire à TOUT
  // moniteur, pas seulement au président) ET à peupler le filtre
  // "Encadrant" (réservé au président, voir isPresident/moniteurFilter
  // plus bas) — reste chargé dès qu'on est staff (président/moniteur),
  // inutile pour un rôle qui n'en a besoin nulle part sur cette page.
  const { data: moniteursData } = useGetAllMoniteurs({}, { enabled: canManageSortie });
  // Scopée à l'adhérent connecté côté backend (InscriptionService.getAll) —
  // sert à déterminer "mes sorties" : celles où il a une inscription active
  // (inscrit ou demande envoyée), peu importe le statut précis, sauf
  // Annulée.
  const { data: mesInscriptionsData } = useGetAllInscriptions();
  const remove = useRemove();
  const update = useUpdate();
  const createInscription = useCreateInscription();
  const selection = useSelection();
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Map id_sortie -> inscription active de l'adhérent connecté (statut !==
  // "Annulée") — sert à la fois à "Mes sorties" (mesSortiesIds ci-dessous)
  // et à remplacer l'action "S'inscrire" par "Voir mon inscription" une fois
  // qu'une demande a été envoyée pour cette sortie.
  const mesInscriptionsParSortie = useMemo(() => {
    const inscriptions = mesInscriptionsData?.data || [];
    const map = new Map();
    inscriptions
      .filter((i) => i.statut !== "Annulée")
      .forEach((i) => map.set(i.id_sortie, i));
    return map;
  }, [mesInscriptionsData]);

  const mesSortiesIds = useMemo(
    () => new Set(mesInscriptionsParSortie.keys()),
    [mesInscriptionsParSortie],
  );

  const sortiesList = useMemo(() => {
    if (!sortiesData?.data) return [];
    return sortiesData.data;
  }, [sortiesData]);

  // Vérifier le rôle de l'utilisateur
  const isAdmin = ["president", "moniteur", "tresorier"].includes(
    user?.role,
  );
  const isAdherent = !isAdmin && user?.role === "adherent";

  // Récupérer l'adhérent connecté
  const currentAdherentNum = useMemo(() => {
    if (!user || !adherentsData?.data) return null;
    const adherent = adherentsData.data.find((a) => a.email === user.email);
    return adherent?.num_adherent || null;
  }, [user, adherentsData]);

  // Récupérer le moniteur connecté (pour "Sorties que j'encadre" —
  // Sortie.encadrants est une liste d'id_moniteur, pas de user.id).
  const currentMoniteurId = useMemo(() => {
    if (!user || !moniteursData?.data) return null;
    const moniteur = moniteursData.data.find((m) => m.user?.email === user.email);
    return moniteur?.id_moniteur || null;
  }, [user, moniteursData]);

  // Actions de gestion d'UNE sortie donnée (Modifier/Supprimer/Pointage,
  // sélection groupée) : réservées au président (accès total) ou au
  // moniteur explicitement désigné encadrant de CETTE sortie précise
  // (Sortie.encadrants) — un autre moniteur, staff du club mais non désigné
  // ici, ne les voit plus. Avant ce garde-fou, canManageSortie (rôle
  // générique) ouvrait ces actions à n'importe quel moniteur sur n'importe
  // quelle sortie ; même correctif côté API, voir SortieService.
  // assertCanManageSortie (backend), donc pas seulement un masquage
  // cosmétique — une tentative directe est aussi refusée (403) côté serveur.
  const canManageCetteSortie = (sortie) => {
    if (!canManageSortie) return false;
    if (user?.role === "president") return true;
    return (
      currentMoniteurId != null &&
      Array.isArray(sortie.encadrants) &&
      sortie.encadrants.includes(currentMoniteurId)
    );
  };

  // Filtrage
  const filteredSorties = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return sortiesList.filter((sortie) => {
      const searchable = [
        sortie.type,
        sortie.lieu,
        sortie.site,
        sortie.statut,
        sortie.niveau_requis,
      ];
      const matchSearch =
        !normalizedSearch ||
        searchable.some((val) =>
          String(val || "")
            .toLowerCase()
            .includes(normalizedSearch),
        );

      const matchFilter = filter === "all" || sortie.statut === filter;

      const matchType = typeFilter === "all" || sortie.type === typeFilter;

      const matchMesSorties =
        !mesSortiesOnly || mesSortiesIds.has(sortie.id_sortie || sortie.id);

      const matchMesSortiesEncadrees =
        !mesSortiesEncadreesOnly ||
        (currentMoniteurId != null &&
          Array.isArray(sortie.encadrants) &&
          sortie.encadrants.includes(currentMoniteurId));

      const matchMoniteurFilter =
        moniteurFilter === "all" ||
        (Array.isArray(sortie.encadrants) &&
          sortie.encadrants.some((id) => String(id) === moniteurFilter));

      return (
        matchSearch &&
        matchFilter &&
        matchType &&
        matchMesSorties &&
        matchMesSortiesEncadrees &&
        matchMoniteurFilter
      );
    }).sort((a, b) => {
      // 4 groupes, dans cet ordre : "En cours" (ça se passe maintenant — plus
      // urgent que tout, y compris une sortie à venir), Planifiée à jour
      // (date à venir — la plus proche en tête), Planifiée à terminer (date
      // passée mais jamais clôturée, voir "aTerminer" plus bas), puis le
      // reste (Terminée/Annulée — plus récentes en tête, esprit historique).
      const priorite = (s) => {
        if (s.statut === "En cours") return 0;
        if (s.statut !== "Planifiée") return 3;
        return new Date(s.date_heure) < new Date() ? 2 : 1;
      };
      const prioriteA = priorite(a);
      const prioriteB = priorite(b);
      if (prioriteA !== prioriteB) return prioriteA - prioriteB;
      return prioriteA <= 1
        ? new Date(a.date_heure) - new Date(b.date_heure)
        : new Date(b.date_heure) - new Date(a.date_heure);
    });
  }, [
    sortiesList,
    searchTerm,
    filter,
    typeFilter,
    mesSortiesOnly,
    mesSortiesIds,
    mesSortiesEncadreesOnly,
    currentMoniteurId,
    moniteurFilter,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredSorties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSorties = filteredSorties.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Suppression (sortie "Terminée"/"Annulée" — voir peutSupprimerCard)
  const handleDelete = async (id) => {
    // Ferme la modale dès le lancement : elle masquerait sinon le spinner
    // de la carte pendant la requête.
    setDeleteModal(null);
    setActionLoading(`delete-${id}`);
    try {
      await remove.mutateAsync(id);
      await refetch();
    } catch (error) {
      console.error("Échec de la suppression de la sortie :", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Annulation (sortie encore "Planifiée" uniquement — voir
  // isEnCoursCard/peutSupprimerCard) : changement de statut, pas de destroy.
  const handleAnnuler = async (id) => {
    setAnnulerModal(null);
    setActionLoading(`cancel-${id}`);
    try {
      await update.mutateAsync({ id, data: { statut: "Annulée" } });
    } catch (error) {
      console.error("Échec de l'annulation de la sortie :", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const result = await sortieService.bulkDelete(Array.from(selection.selectedIds));
      toast[result.success ? "success" : "error"](result.message);
      selection.clear();
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur lors de la suppression groupée");
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteModal(false);
    }
  };

  // Inscription pour un adhérent (lui-même)
  const handleInscription = async (sortieId) => {
    if (!currentAdherentNum) {
      toast.error(
        "Vous devez être connecté en tant qu'adhérent pour vous inscrire",
      );
      return;
    }

    setActionLoading(`register-${sortieId}`);
    try {
      await createInscription.mutateAsync({
        num_adherent: currentAdherentNum,
        id_sortie: sortieId,
        statut: "En attente",
      });
      toast.success("Inscription en attente de confirmation");
      refetch();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de l'inscription",
      );
      console.error("Échec de l'inscription à la sortie :", error);
    } finally {
      setActionLoading(null);
    }
  };

  // Ajouter une inscription pour un autre adhérent (admin) — modalNavigate
  // (et non navigate) pour que la modale s'ouvre PAR-DESSUS cette page de
  // sorties au lieu de la remplacer par la liste des inscriptions.
  const handleAddInscription = (sortieId) => {
    modalNavigate(`/inscriptions/create?sortie=${sortieId}`);
  };

  // Gestion des filtres
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (newType) => {
    setTypeFilter(newType);
    setCurrentPage(1);
  };

  const handleMoniteurFilterChange = (newMoniteur) => {
    setMoniteurFilter(newMoniteur);
    setCurrentPage(1);
  };

  const handleSearchChange = (newSearch) => {
    setSearchTerm(newSearch);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilter("all");
    setTypeFilter("all");
    setMesSortiesOnly(false);
    setMesSortiesEncadreesOnly(false);
    setMoniteurFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm ||
    filter !== "all" ||
    typeFilter !== "all" ||
    mesSortiesOnly ||
    mesSortiesEncadreesFiltre ||
    moniteurFilter !== "all";

  const getStatutColor = (statut) => {
    const colors = {
      Planifiée:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      "En cours":
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      Terminée:
        "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400",
      Annulée: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return (
      colors[statut] ||
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    );
  };

  // Variante des badges pour la vignette en grille : contrairement à
  // getStatutColor (utilisé sur une ligne de tableau, surface plane), ces
  // badges flottent en overlay sur la bannière de la carte — un fond de
  // couleur photo OU la mini-carte d'itinéraire (SortieRouteMapMini, dont
  // les tuiles OSM restent claires quel que soit le thème). Les teintes
  // semi-transparentes (/30, /40) utilisées ailleurs en mode sombre
  // deviennent illisibles une fois mélangées à ce fond clair — d'où des
  // fonds opaques ici, indépendants de ce qu'il y a en dessous.
  const getStatutOverlayColor = (statut) => {
    const colors = {
      Planifiée: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
      "En cours":
        "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
      Terminée: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      Annulée: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    };
    return (
      colors[statut] || "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
    );
  };

  // N'attend que la liste des sorties elle-même : adherentsData/moniteursData
  // ne servent qu'à des besoins annexes déjà tolérants à l'absence de
  // donnée (bouton "S'inscrire" gardé par currentAdherentNum, filtre
  // "Encadrant"/repli "mes sorties encadrées" sur moniteursData) — aucune
  // ligne de la grille n'en dépend pour s'afficher. Chargement progressif.
  if (loadingSorties) return <LoadingSpinner variant="grid" />;

  if (sortiesError) {
    return <ErrorState onRetry={refetch} />;
  }

  if (filteredSorties.length === 0) {
    return (
      <div className="space-y-4">
      <TabBar tabs={sortieTabs} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <FiAnchor className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {mesSortiesOnly
            ? "Vous n'êtes inscrit à aucune sortie"
            : mesSortiesEncadreesOnly
              ? "Aucune sortie où vous êtes désigné(e) encadrant"
              : hasActiveFilters
                ? "Aucune sortie trouvée"
                : "Commencez par créer votre première sortie"}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {mesSortiesOnly
            ? "Aucune sortie où vous êtes inscrit(e) ou avez envoyé une demande"
            : mesSortiesEncadreesOnly
              ? "Le président ne vous a encore désigné encadrant sur aucune sortie"
              : hasActiveFilters
                ? "Aucun résultat pour vos critères"
                : "Organisez une nouvelle sortie de plongée"}
        </p>
        {/* Cet état vide remplace toute la vue, y compris la barre de
            recherche : sans ce bouton, rien ne permettait de revenir à la
            liste complète une fois une recherche/filtre sans résultat. */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <FiX className="w-4 h-4" /> Réinitialiser la recherche
          </button>
        )}
        {canManageSortie && (
          <ModalLink
            to="/sorties/create"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <FiPlus className="w-4 h-4" /> Créer une sortie
          </ModalLink>
        )}
        <SortieFormModal />
        <SortieDetails />
      </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
            {mesSortiesOnly
              ? "Mes sorties"
              : mesSortiesEncadreesOnly
                ? "Sorties que j'encadre"
                : "Gestion des sorties"}
            <FiMapPin className="w-5 h-5 text-indigo-500" />
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {mesSortiesOnly
              ? `${filteredSorties.length} sortie${filteredSorties.length > 1 ? "s" : ""} où vous êtes inscrit(e) ou avez envoyé une demande`
              : mesSortiesEncadreesOnly
                ? `${filteredSorties.length} sortie${filteredSorties.length > 1 ? "s" : ""} où vous êtes désigné(e) encadrant`
                : `${filteredSorties.length} sorties trouvées`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManageSortie && (
            <ModalLink
              to="/sorties/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <FiPlus className="w-4 h-4" />
              Nouvelle sortie
            </ModalLink>
          )}
        </div>
      </div>

      {/* Onglets remplaçant l'ancien sous-menu dépliable "Sorties" de la
          Sidebar (voir Sidebar.jsx) — "Carte des sites" y était aussi, d'où
          son retrait du bloc En-tête ci-dessus (voir useSortieTabs.js). */}
      <TabBar tabs={sortieTabs} />

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Rechercher par lieu, site, type..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 min-w-[140px]"
          >
            {SORTIE_STATUS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => handleTypeFilterChange(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 min-w-[160px]"
          >
            {SORTIE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type === "all" ? "Tous les types" : type}
              </option>
            ))}
          </select>

          {/* Réservé au président (voir isPresident, moniteurFilter) — un
              moniteur n'a pas à parcourir la liste des encadrants d'un autre.
              Masqué aussi dans "Sorties que j'encadre" (mesSortiesEncadreesOnly) :
              cette vue est déjà scopée à "moi" (voir matchMesSortiesEncadrees
              plus haut), un filtre "choisir un autre encadrant" n'y a pas sa
              place — il ne ferait que vider silencieusement la liste dès
              qu'on choisit quelqu'un d'autre que soi-même. */}
          {isPresident && !mesSortiesEncadreesOnly && (
            <select
              value={moniteurFilter}
              onChange={(e) => handleMoniteurFilterChange(e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 min-w-[160px]"
            >
              <option value="all">Tous les encadrants</option>
              {(moniteursData?.data || []).map((moniteur) => (
                <option key={moniteur.id_moniteur} value={String(moniteur.id_moniteur)}>
                  {moniteur.user?.name || `Moniteur #${moniteur.id_moniteur}`}
                </option>
              ))}
            </select>
          )}

          {/* Grille en premier : c'est la vue par défaut de cette page
              (voir viewMode initial ci-dessus), l'ordre des deux boutons
              suit cette priorité plutôt que l'ordre alphabétique. */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Vue grille"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="Vue liste"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sélection multiple / actions groupées (suppression réelle, groupée,
          restée volontairement limitée à "Planifiée" — voir
          peutSupprimerCard/isEnCoursCard plus bas pour l'action individuelle
          Supprimer/Annuler, élargie elle à "Terminée"/"Annulée"). */}
      {canManageSortie && (() => {
        const selectableIds = paginatedSorties
          .filter((s) => s.statut === "Planifiée" && canManageCetteSortie(s))
          .map((s) => s.id_sortie || s.id);
        return (
          <>
            {selectableIds.length > 0 && (
              <div className="flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  checked={selection.allSelected(selectableIds)}
                  onChange={() => selection.toggleAll(selectableIds)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Tout sélectionner (page courante)
                </span>
              </div>
            )}
            <BulkActionBar
              count={selection.selectedCount}
              onClear={selection.clear}
              onDelete={() => setBulkDeleteModal(true)}
            />
          </>
        );
      })()}

      {/* Liste des sorties */}
      <AnimatePresence>
        {paginatedSorties.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
          >
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Aucune sortie trouvée
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {hasActiveFilters
                ? "Essayez de modifier vos filtres"
                : "Aucune sortie pour le moment"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "grid gap-3"
            }
          >
            {paginatedSorties.map((sortie) => {
              const sortieId = sortie.id_sortie || sortie.id;
              const isPastSortie = new Date(sortie.date_heure) < new Date();
              // Durée estimée dépassée mais toujours "Planifiée"/"En cours" :
              // le passage à "En cours" est automatique (voir
              // SortieService.demarrerSortiesEchues), mais "Terminée" reste
              // une décision humaine — l'organisateur doit clôturer
              // manuellement (bouton "Terminer", même bandeau ambre que
              // SortieDetails). Voir utils/helpers.js:sortieDoitEtreCloturee.
              // Visible seulement pour qui peut clôturer CETTE sortie (président ou
              // moniteur désigné encadrant) — pas pour l'adhérent ni un autre
              // moniteur, comme dans SortieDetails (canManageCetteSortie).
              const aTerminer =
                canManageCetteSortie(sortie) && sortieDoitEtreCloturee(sortie);
              const isFull =
                (sortie.nb_places || 0) <= (sortie.nb_inscrits || 0);
              const canInscribe =
                !isPastSortie && !isFull && sortie.statut === "Planifiée";
              // Raison affichée dans le title de l'icône désactivée (pas
              // seulement masquée, pour que "inscription fermée" reste
              // visible/compréhensible plutôt que de disparaître sans
              // explication) — priorité à la date passée, la raison la plus
              // fréquente et la plus définitive des trois.
              const raisonNonInscriptible = isPastSortie
                ? "Cette sortie a déjà eu lieu : inscription impossible"
                : isFull
                  ? "Sortie complète : inscription impossible"
                  : "Sortie non planifiée : inscription impossible";
              // Verrouillé côté serveur (SortieService.update/delete) dès que
              // la sortie a quitté "Planifiée" — pas seulement "Terminée".
              const isVerrouillee = sortie.statut !== "Planifiée";
              // Cycle de vie de l'action "Supprimer/Annuler" — même règle que
              // SortieService.assertSortieModifiable (Annuler) et
              // SortieService.delete (Supprimer) côté backend, et que
              // SortieDetails.jsx : "Planifiée" → Annuler, "En cours" → ni
              // l'un ni l'autre (des inscrits sont déjà partis), "Terminée"/
              // "Annulée" → Supprimer (nettoyage d'un enregistrement final).
              const isEnCoursCard = sortie.statut === "En cours";
              const peutSupprimerCard =
                sortie.statut === "Terminée" || sortie.statut === "Annulée";
              // Une fois une demande envoyée (quel que soit son statut tant
              // qu'elle n'est pas annulée), l'action "S'inscrire" devient
              // "Voir mon inscription" — y compris si la sortie est ensuite
              // devenue complète/verrouillée, puisque la place de l'adhérent
              // est déjà acquise ou en cours d'examen.
              const monInscription = mesInscriptionsParSortie.get(sortieId);
              // Compte à rebours : même convention d'urgence que
              // CertificatList (30 jours) — n'a de sens que pour une sortie
              // encore à venir et non verrouillée (Planifiée), et ne
              // s'affiche que si elle approche (<=30j), pas des mois à
              // l'avance.
              const jours = joursRestants(sortie.date_heure);
              const showCompteARebours =
                sortie.statut === "Planifiée" && jours >= 0 && jours <= 30;
              // Coordonnées du site (saisies via SortieLocationPicker à la
              // création) : quand elles existent et qu'aucune photo n'a été
              // définie, la vignette grille montre un aperçu de l'itinéraire
              // (SortieRouteMapMini) plutôt que l'icône générique — cliquer
              // dessus ouvre l'itinéraire complet en modale.
              const siteLat = sortie.latitude != null ? Number(sortie.latitude) : null;
              const siteLng = sortie.longitude != null ? Number(sortie.longitude) : null;
              const hasCoords = Number.isFinite(siteLat) && Number.isFinite(siteLng);
              // Pastille météo (SortieWeatherBadge) : seulement pour une
              // sortie imminente (J-3 à aujourd'hui — au-delà, la prévision
              // est trop peu fiable pour être montrée en un coup d'œil dans
              // la liste ; la fiche détaillée, elle, va jusqu'à 16 jours) et
              // avec une position connue, sinon rien à prévoir.
              const showWeatherBadge =
                sortie.statut === "Planifiée" &&
                jours >= 0 &&
                jours <= 3 &&
                hasCoords;
              // Signal pour le président (voir SortieDetails.jsx pour le
              // détail par sortie) : un des encadrants désignés s'est
              // déclaré indisponible depuis — n'a d'intérêt que tant que la
              // sortie est encore modifiable, pas une fois "En cours".
              const encadrantsIndisponiblesCard = canManageSortie
                ? (sortie.encadrants || [])
                    .map((idM) =>
                      moniteursData?.data?.find((m) => m.id_moniteur === idM),
                    )
                    .filter((m) => m && m.disponible === false)
                : [];
              const showEncadrantIndisponible =
                sortie.statut === "Planifiée" &&
                encadrantsIndisponiblesCard.length > 0;
              const titreEncadrantIndisponible = `Encadrant(s) indisponible(s) : ${encadrantsIndisponiblesCard
                .map((m) => m.user?.name || `#${m.id_moniteur}`)
                .join(", ")}`;

              if (viewMode === "grid") {
                return (
                  <motion.div
                    key={sortieId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                  >
                    {/* Photo / bandeau de la sortie */}
                    <div
                      className={`relative h-40 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center ${
                        !sortie.image && hasCoords ? "cursor-pointer" : ""
                      }`}
                      onClick={
                        !sortie.image && hasCoords
                          ? () =>
                              setRouteModal({
                                lat: siteLat,
                                lng: siteLng,
                                name: sortie.site || sortie.lieu,
                              })
                          : undefined
                      }
                      title={
                        !sortie.image && hasCoords
                          ? "Voir l'itinéraire vers ce site"
                          : undefined
                      }
                    >
                      {sortie.image ? (
                        <img
                          src={sortie.image}
                          alt={sortie.lieu}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : hasCoords ? (
                        <div className="absolute inset-0 pointer-events-none">
                          <SortieRouteMapMini siteLat={siteLat} siteLng={siteLng} />
                        </div>
                      ) : (
                        <FiAnchor className="w-12 h-12 text-indigo-400 dark:text-indigo-500" />
                      )}
                      {/* Voile derrière les badges : quand la vignette est une
                          carte (SortieRouteMapMini), le fond de carte
                          OpenStreetMap peut porter ses propres libellés (noms
                          de lieux) juste sous cette bande — hors de notre
                          contrôle, ni leur couleur ni leur placement ne se
                          personnalisent, et sur un fond clair ils passaient
                          par-dessus les badges eux-mêmes. Ce dégradé assombrit
                          uniformément la bande du haut (même principe que le
                          dégradé du prix en bas) pour que les badges restent
                          lisibles quel que soit le contenu de la carte
                          dessous. */}
                      {hasCoords && !sortie.image && (
                        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
                      )}
                      <div className="absolute inset-x-0 top-0 p-3 flex items-center justify-between gap-1.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatutOverlayColor(sortie.statut)}`}
                        >
                          {sortie.statut || "Planifiée"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {aTerminer && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 shadow-sm">
                              À terminer
                            </span>
                          )}
                          {showCompteARebours && (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 shadow-sm">
                              <FiClock className="w-3 h-3 flex-shrink-0" />
                              {formatCompteARebours(jours)}
                            </span>
                          )}
                          {showWeatherBadge && (
                            <SortieWeatherBadge idSortie={sortieId} />
                          )}
                          {isFull && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 shadow-sm">
                              Complet
                            </span>
                          )}
                          {showEncadrantIndisponible && (
                            <span
                              title={titreEncadrantIndisponible}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 shadow-sm"
                            >
                              <FiAlertTriangle className="w-3 h-3 flex-shrink-0" />
                              Encadrant indisponible
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <span className="text-lg font-bold text-white drop-shadow">
                          {Number(sortie.tarif_adherent) > 0
                            ? `${Number(sortie.tarif_adherent).toFixed(2)} €`
                            : "Gratuit"}
                        </span>
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="p-4 flex flex-col flex-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                        {sortie.type || "Sortie"}
                      </span>
                      <h3 className="font-semibold text-gray-900 dark:text-white mt-1 truncate">
                        {sortie.lieu || "Lieu non défini"}
                      </h3>
                      <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        <FiMapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{sortie.site || "—"}</span>
                      </p>

                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-center">
                        <div>
                          <FiUsers className="w-4 h-4 mx-auto text-gray-400" />
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                            {sortie.nb_inscrits || 0}/{sortie.nb_places || 0}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            Places
                          </div>
                        </div>
                        <div>
                          <FiTrendingDown className="w-4 h-4 mx-auto text-gray-400" />
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                            {sortie.profondeur_max ?? "—"}m
                          </div>
                          <div className="text-[11px] text-gray-400">
                            Profondeur
                          </div>
                        </div>
                        <div>
                          <FiClock className="w-4 h-4 mx-auto text-gray-400" />
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                            {sortie.duree_estimee
                              ? sortie.duree_estimee.slice(0, 5)
                              : "—"}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            Durée
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <span className="text-xs text-gray-400">
                          Niveau {sortie.niveau_requis || "—"}
                        </span>
                        <div className="flex items-center gap-1">
                          {canManageCetteSortie(sortie) && sortie.statut === "Planifiée" && (
                            <input
                              type="checkbox"
                              checked={selection.isSelected(sortieId)}
                              onChange={() => selection.toggle(sortieId)}
                              className="mr-1 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                              title="Sélectionner"
                            />
                          )}
                          {isAdherent ? (
                            monInscription ? (
                              <ModalLink
                                to={`/inscriptions/${monInscription.id_inscription}`}
                                className="p-2 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors"
                                title="Voir mon inscription à cette sortie"
                              >
                                <FiFileText className="w-4 h-4" />
                              </ModalLink>
                            ) : canInscribe ? (
                              <button
                                onClick={() => handleInscription(sortieId)}
                                disabled={(actionLoading === `register-${sortieId}` || actionLoading === `delete-${sortieId}` || actionLoading === `cancel-${sortieId}`)}
                                className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="S'inscrire à cette sortie"
                              >
                                {actionLoading === `register-${sortieId}` ? (
                                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <FiUserPlus className="w-4 h-4" />
                                )}
                              </button>
                            ) : (
                              <span
                                className="p-2 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                title={raisonNonInscriptible}
                              >
                                <FiUserPlus className="w-4 h-4" />
                              </span>
                            )
                          ) : (
                            isAdmin &&
                            (canInscribe ? (
                              <button
                                onClick={() => handleAddInscription(sortieId)}
                                disabled={(actionLoading === `register-${sortieId}` || actionLoading === `delete-${sortieId}` || actionLoading === `cancel-${sortieId}`)}
                                className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Ajouter une inscription à cette sortie"
                              >
                                <FiUserCheck className="w-4 h-4" />
                              </button>
                            ) : (
                              <span
                                className="p-2 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                title={raisonNonInscriptible}
                              >
                                <FiUserCheck className="w-4 h-4" />
                              </span>
                            ))
                          )}
                          {isAdmin && (
                            <Link
                              to={`/inscriptions?sortie=${sortieId}`}
                              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                              title={`Voir les inscriptions de cette sortie (${sortie.nb_inscrits || 0})`}
                            >
                              <FiClipboard className="w-4 h-4" />
                            </Link>
                          )}
                          <Link
                            to={`/sorties/${sortieId}`}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Voir"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          {canManageCetteSortie(sortie) && (
                            <>
                              <Link
                                to={`/sorties/${sortieId}/pointage`}
                                className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                title="Pointage"
                              >
                                <FiCheckSquare className="w-4 h-4" />
                              </Link>
                              {isVerrouillee ? (
                                <span
                                  className="p-2 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                  title='Cette sortie a quitté le statut "Planifiée" : modification impossible'
                                >
                                  <FiEdit className="w-4 h-4" />
                                </span>
                              ) : (
                                <ModalLink
                                  to={`/sorties/edit/${sortieId}`}
                                  className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                  title="Modifier"
                                >
                                  <FiEdit className="w-4 h-4" />
                                </ModalLink>
                              )}
                              {peutSupprimerCard ? (
                                <button
                                  onClick={() => setDeleteModal(sortieId)}
                                  disabled={(actionLoading === `delete-${sortieId}` || actionLoading === `cancel-${sortieId}`)}
                                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Supprimer"
                                >
                                  {actionLoading === `delete-${sortieId}` ? (
                                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <FiTrash2 className="w-4 h-4" />
                                  )}
                                </button>
                              ) : isEnCoursCard ? (
                                <span
                                  className="p-2 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                  title="Sortie en cours : ni annulation ni suppression possible"
                                >
                                  <FiXCircle className="w-4 h-4" />
                                </span>
                              ) : (
                                <button
                                  onClick={() => setAnnulerModal(sortieId)}
                                  disabled={(actionLoading === `delete-${sortieId}` || actionLoading === `cancel-${sortieId}`)}
                                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Annuler la sortie"
                                >
                                  {actionLoading === `cancel-${sortieId}` ? (
                                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <FiXCircle className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={sortieId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    {canManageCetteSortie(sortie) && sortie.statut === "Planifiée" && (
                      <input
                        type="checkbox"
                        checked={selection.isSelected(sortieId)}
                        onChange={() => selection.toggle(sortieId)}
                        className="h-4 w-4 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                    )}
                    {/* Icône de la sortie */}
                    <div className="flex-shrink-0">
                      {sortie.image ? (
                        <img
                          src={sortie.image}
                          alt={sortie.lieu}
                          className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700 shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-700 shadow-sm">
                          <FiAnchor className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                        </div>
                      )}
                      <div className="text-center mt-1">
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                          {sortie.type || "Sortie"}
                        </span>
                      </div>
                    </div>

                    {/* Informations */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {sortie.lieu || "Lieu non défini"}
                            </h3>
                            <span className="text-sm text-gray-400 dark:text-gray-500">
                              •
                            </span>
                            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                              {sortie.site || ""}
                            </span>
                            {showCompteARebours && (
                              <span className="flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400">
                                <FiClock className="w-3.5 h-3.5 flex-shrink-0" />
                                {formatCompteARebours(jours)}
                              </span>
                            )}
                            {showWeatherBadge && (
                              <SortieWeatherBadge idSortie={sortieId} variant="inline" />
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <FiCalendar className="w-3.5 h-3.5" />
                              {formatDateTime(sortie.date_heure)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <FiUsers className="w-3.5 h-3.5" />
                              {sortie.nb_inscrits || 0}/{sortie.nb_places || 0}
                              {isFull && (
                                <span className="text-orange-600 dark:text-orange-400 font-medium ml-1">
                                  (Complet)
                                </span>
                              )}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              Niveau {sortie.niveau_requis || "—"}
                            </span>
                            <span>•</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatutColor(sortie.statut)}`}
                            >
                              {sortie.statut || "Planifiée"}
                            </span>
                            {aTerminer && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                À terminer
                              </span>
                            )}
                            {showEncadrantIndisponible && (
                              <span
                                title={titreEncadrantIndisponible}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                              >
                                <FiAlertTriangle className="w-3 h-3 flex-shrink-0" />
                                Encadrant indisponible
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Bouton S'inscrire / Voir mon inscription / Ajouter inscription selon le rôle */}
                          {isAdherent ? (
                            monInscription ? (
                              // Adhérent déjà inscrit (ou demande envoyée) : voir son inscription
                              <ModalLink
                                to={`/inscriptions/${monInscription.id_inscription}`}
                                className="p-2 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors"
                                title="Voir mon inscription à cette sortie"
                              >
                                <FiFileText className="w-4 h-4" />
                              </ModalLink>
                            ) : canInscribe ? (
                              // Adhérent pas encore inscrit : S'inscrire (pour lui-même)
                              <button
                                onClick={() => handleInscription(sortieId)}
                                disabled={(actionLoading === `register-${sortieId}` || actionLoading === `delete-${sortieId}` || actionLoading === `cancel-${sortieId}`)}
                                className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="S'inscrire à cette sortie"
                              >
                                {actionLoading === `register-${sortieId}` ? (
                                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <FiUserPlus className="w-4 h-4" />
                                )}
                              </button>
                            ) : (
                              <span
                                className="p-2 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                title={raisonNonInscriptible}
                              >
                                <FiUserPlus className="w-4 h-4" />
                              </span>
                            )
                          ) : (
                            // Admin : Ajouter inscription (pour un autre)
                            isAdmin &&
                            (canInscribe ? (
                              <button
                                onClick={() => handleAddInscription(sortieId)}
                                disabled={(actionLoading === `register-${sortieId}` || actionLoading === `delete-${sortieId}` || actionLoading === `cancel-${sortieId}`)}
                                className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Ajouter une inscription à cette sortie"
                              >
                                <FiUserCheck className="w-4 h-4" />
                              </button>
                            ) : (
                              <span
                                className="p-2 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                title={raisonNonInscriptible}
                              >
                                <FiUserCheck className="w-4 h-4" />
                              </span>
                            ))
                          )}
                          {isAdmin && (
                            <Link
                              to={`/inscriptions?sortie=${sortieId}`}
                              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                              title={`Voir les inscriptions de cette sortie (${sortie.nb_inscrits || 0})`}
                            >
                              <FiClipboard className="w-4 h-4" />
                            </Link>
                          )}

                          <Link
                            to={`/sorties/${sortieId}`}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Voir"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          {canManageCetteSortie(sortie) && (
                            <>
                              <Link
                                to={`/sorties/${sortieId}/pointage`}
                                className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                title="Pointage"
                              >
                                <FiCheckSquare className="w-4 h-4" />
                              </Link>
                              {isVerrouillee ? (
                                <span
                                  className="p-2 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                  title='Cette sortie a quitté le statut "Planifiée" : modification impossible'
                                >
                                  <FiEdit className="w-4 h-4" />
                                </span>
                              ) : (
                                <ModalLink
                                  to={`/sorties/edit/${sortieId}`}
                                  className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                  title="Modifier"
                                >
                                  <FiEdit className="w-4 h-4" />
                                </ModalLink>
                              )}
                              {peutSupprimerCard ? (
                                <button
                                  onClick={() => setDeleteModal(sortieId)}
                                  disabled={(actionLoading === `delete-${sortieId}` || actionLoading === `cancel-${sortieId}`)}
                                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Supprimer"
                                >
                                  {actionLoading === `delete-${sortieId}` ? (
                                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <FiTrash2 className="w-4 h-4" />
                                  )}
                                </button>
                              ) : isEnCoursCard ? (
                                <span
                                  className="p-2 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                  title="Sortie en cours : ni annulation ni suppression possible"
                                >
                                  <FiXCircle className="w-4 h-4" />
                                </span>
                              ) : (
                                <button
                                  onClick={() => setAnnulerModal(sortieId)}
                                  disabled={(actionLoading === `delete-${sortieId}` || actionLoading === `cancel-${sortieId}`)}
                                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Annuler la sortie"
                                >
                                  {actionLoading === `cancel-${sortieId}` ? (
                                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <FiXCircle className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modal de confirmation de suppression (sortie "Terminée"/"Annulée" —
          voir peutSupprimerCard) */}
      {deleteModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                <FiTrash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Confirmer la suppression</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer cette sortie ?
              <br />
              <span className="text-sm text-red-500 font-medium">
                Cette action est irréversible.
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteModal)}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                Supprimer
              </button>
            </div>
          </motion.div>
        </ModalOverlay>
      )}

      {/* Modal annulation (sortie encore "Planifiée" — voir
          peutSupprimerCard/isEnCoursCard) */}
      {annulerModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                <FiXCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Confirmer l&apos;annulation</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir annuler cette sortie ?
              <br />
              <span className="text-sm text-red-500 font-medium">
                Cette action est irréversible.
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAnnulerModal(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Retour
              </button>
              <button
                onClick={() => handleAnnuler(annulerModal)}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                Annuler la sortie
              </button>
            </div>
          </motion.div>
        </ModalOverlay>
      )}

      <SortieRouteModal
        isOpen={!!routeModal}
        onClose={() => setRouteModal(null)}
        siteLat={routeModal?.lat}
        siteLng={routeModal?.lng}
        siteName={routeModal?.name}
      />

      <ConfirmModal
        isOpen={bulkDeleteModal}
        message={`Êtes-vous sûr de vouloir supprimer les ${selection.selectedCount} sortie(s) sélectionnée(s) ?`}
        confirmLabel={isBulkDeleting ? "Suppression..." : "Supprimer"}
        onCancel={() => setBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
      />

      {/* Pied de page */}
      <div className="text-xs text-gray-400 text-center pt-3 border-t border-gray-200 dark:border-gray-700">
        {filteredSorties.length} sorties • Dernière mise à jour :{" "}
        {new Date().toLocaleString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>

      <SortieFormModal />
      <SortieDetails />
    </motion.div>
  );
};

export default SortiesPage;
