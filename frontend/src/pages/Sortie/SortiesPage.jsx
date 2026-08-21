import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom"; // Ajouter useNavigate ici
import toast from "react-hot-toast";
import {
  FiPlus,
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiClock,
  FiTrendingUp,
  FiCheckCircle,
  FiXCircle,
  FiBarChart2,
  FiEye,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiFilter,
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
} from "react-icons/fi";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useInscriptions } from "../../hooks/Inscription/useInscriptions";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../../components/Common/LoadingSpinner";
import ModalOverlay from "../../components/Common/ModalOverlay";
import ErrorState from "../../components/Common/ErrorState";

import { formatDateTime, joursRestants, formatCompteARebours } from "../../utils/helpers";
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
  // useNavigate doit être appelé à l'intérieur du composant
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { useGetAll, useRemove } = useSorties();
  const { useGetAll: useGetAllInscriptions, useCreate: useCreateInscription } =
    useInscriptions();
  const { useGetAll: useGetAllAdherents } = useAdherents();
  const { user, hasRole } = useAuth();
  const canManageSortie = hasRole(["president", "moniteur"]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  // Sous-menu sidebar "Mes sorties" (?filtre=mes-sorties, voir Sidebar.jsx) —
  // même pattern que showValidationOnly dans AdhesionList/CertificatList.
  const [mesSortiesOnly, setMesSortiesOnly] = useState(
    searchParams.get("filtre") === "mes-sorties",
  );
  useEffect(() => {
    setMesSortiesOnly(searchParams.get("filtre") === "mes-sorties");
    setCurrentPage(1);
  }, [searchParams]);
  const itemsPerPage = 10;

  const {
    data: sortiesData,
    isLoading: loadingSorties,
    error: sortiesError,
    refetch,
  } = useGetAll();

  const { data: adherentsData, isLoading: loadingAdherents } =
    useGetAllAdherents();
  // Scopée à l'adhérent connecté côté backend (InscriptionService.getAll) —
  // sert à déterminer "mes sorties" : celles où il a une inscription active
  // (inscrit ou demande envoyée), peu importe le statut précis, sauf
  // Annulée.
  const { data: mesInscriptionsData } = useGetAllInscriptions();
  const remove = useRemove();
  const createInscription = useCreateInscription();

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

      return matchSearch && matchFilter && matchType && matchMesSorties;
    }).sort((a, b) => {
      const now = Date.now();
      const diffA = Math.abs(new Date(a.date_heure) - now);
      const diffB = Math.abs(new Date(b.date_heure) - now);
      return diffA - diffB;
    });
  }, [sortiesList, searchTerm, filter, typeFilter, mesSortiesOnly, mesSortiesIds]);

  // Pagination
  const totalPages = Math.ceil(filteredSorties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSorties = filteredSorties.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Suppression
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await remove.mutateAsync(id);
      refetch();
      setDeleteModal(null);
    } catch (error) {
      console.error("Échec de la suppression de la sortie :", error);
    } finally {
      setLoading(false);
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

    setLoading(true);
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
      setLoading(false);
    }
  };

  // Ajouter une inscription pour un autre adhérent (admin) - avec navigate
  const handleAddInscription = (sortieId) => {
    navigate(`/inscriptions/create?sortie=${sortieId}`);
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

  const handleSearchChange = (newSearch) => {
    setSearchTerm(newSearch);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilter("all");
    setTypeFilter("all");
    setMesSortiesOnly(false);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm || filter !== "all" || typeFilter !== "all" || mesSortiesOnly;

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

  if (loadingSorties || loadingAdherents) return <LoadingSpinner variant="list" />;

  if (sortiesError) {
    return <ErrorState onRetry={refetch} />;
  }

  if (filteredSorties.length === 0) {
    return (
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
            : hasActiveFilters
              ? "Aucune sortie trouvée"
              : "Commencez par créer votre première sortie"}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {mesSortiesOnly
            ? "Aucune sortie où vous êtes inscrit(e) ou avez envoyé une demande"
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
          <Link
            to="/sorties/create"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <FiPlus className="w-4 h-4" /> Créer une sortie
          </Link>
        )}
      </motion.div>
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
            {mesSortiesOnly ? "Mes sorties" : "Gestion des sorties"}
            <FiMapPin className="w-5 h-5 text-indigo-500" />
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {mesSortiesOnly
              ? `${filteredSorties.length} sortie${filteredSorties.length > 1 ? "s" : ""} où vous êtes inscrit(e) ou avez envoyé une demande`
              : `${filteredSorties.length} sorties trouvées`}
          </p>
        </div>
        {canManageSortie && (
          <Link
            to="/sorties/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <FiPlus className="w-4 h-4" />
            Nouvelle sortie
          </Link>
        )}
      </div>

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

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1"
            >
              <FiX className="w-4 h-4" />
              Effacer
            </button>
          )}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
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
          </div>
        </div>
      </div>

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
              const isFull =
                (sortie.nb_places || 0) <= (sortie.nb_inscrits || 0);
              const canInscribe =
                !isPastSortie && !isFull && sortie.statut === "Planifiée";
              // Verrouillé côté serveur (SortieService.update/delete) dès que
              // la sortie a quitté "Planifiée" — pas seulement "Terminée".
              const isVerrouillee = sortie.statut !== "Planifiée";
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

              if (viewMode === "grid") {
                return (
                  <motion.div
                    key={sortieId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                  >
                    {/* Photo / bandeau de la sortie */}
                    <div className="relative h-40 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center">
                      {sortie.image ? (
                        <img
                          src={sortie.image}
                          alt={sortie.lieu}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <FiAnchor className="w-12 h-12 text-indigo-400 dark:text-indigo-500" />
                      )}
                      <div className="absolute inset-x-0 top-0 p-3 flex items-center justify-between gap-1.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatutColor(sortie.statut)}`}
                        >
                          {sortie.statut || "Planifiée"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {showCompteARebours && (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 shadow-sm">
                              <FiClock className="w-3 h-3 flex-shrink-0" />
                              {formatCompteARebours(jours)}
                            </span>
                          )}
                          {isFull && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 shadow-sm">
                              Complet
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
                          {isAdherent ? (
                            monInscription ? (
                              <Link
                                to={`/inscriptions/${monInscription.id_inscription}`}
                                className="p-2 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors"
                                title="Voir mon inscription à cette sortie"
                              >
                                <FiFileText className="w-4 h-4" />
                              </Link>
                            ) : (
                              canInscribe && (
                                <button
                                  onClick={() => handleInscription(sortieId)}
                                  disabled={loading}
                                  className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-50"
                                  title="S'inscrire à cette sortie"
                                >
                                  <FiUserPlus className="w-4 h-4" />
                                </button>
                              )
                            )
                          ) : (
                            isAdmin &&
                            canInscribe && (
                              <button
                                onClick={() => handleAddInscription(sortieId)}
                                disabled={loading}
                                className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Ajouter une inscription à cette sortie"
                              >
                                <FiUserCheck className="w-4 h-4" />
                              </button>
                            )
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
                          {canManageSortie && (
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
                                <Link
                                  to={`/sorties/edit/${sortieId}`}
                                  className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                  title="Modifier"
                                >
                                  <FiEdit className="w-4 h-4" />
                                </Link>
                              )}
                              <button
                                onClick={() => setDeleteModal(sortieId)}
                                disabled={loading || isVerrouillee}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                  isVerrouillee
                                    ? 'Cette sortie a quitté le statut "Planifiée" : suppression impossible'
                                    : "Supprimer"
                                }
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
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
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Bouton S'inscrire / Voir mon inscription / Ajouter inscription selon le rôle */}
                          {isAdherent ? (
                            monInscription ? (
                              // Adhérent déjà inscrit (ou demande envoyée) : voir son inscription
                              <Link
                                to={`/inscriptions/${monInscription.id_inscription}`}
                                className="p-2 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors"
                                title="Voir mon inscription à cette sortie"
                              >
                                <FiFileText className="w-4 h-4" />
                              </Link>
                            ) : (
                              // Adhérent pas encore inscrit : S'inscrire (pour lui-même)
                              canInscribe && (
                                <button
                                  onClick={() => handleInscription(sortieId)}
                                  disabled={loading}
                                  className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-50"
                                  title="S'inscrire à cette sortie"
                                >
                                  <FiUserPlus className="w-4 h-4" />
                                </button>
                              )
                            )
                          ) : (
                            // Admin : Ajouter inscription (pour un autre)
                            isAdmin &&
                            canInscribe && (
                              <button
                                onClick={() => handleAddInscription(sortieId)}
                                disabled={loading}
                                className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Ajouter une inscription à cette sortie"
                              >
                                <FiUserCheck className="w-4 h-4" />
                              </button>
                            )
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
                          {canManageSortie && (
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
                                <Link
                                  to={`/sorties/edit/${sortieId}`}
                                  className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                  title="Modifier"
                                >
                                  <FiEdit className="w-4 h-4" />
                                </Link>
                              )}
                              <button
                                onClick={() => setDeleteModal(sortieId)}
                                disabled={loading || isVerrouillee}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                  isVerrouillee
                                    ? 'Cette sortie a quitté le statut "Planifiée" : suppression impossible'
                                    : "Supprimer"
                                }
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </motion.div>
      )}

      {/* Modal de confirmation de suppression */}
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
    </motion.div>
  );
};

export default SortiesPage;
