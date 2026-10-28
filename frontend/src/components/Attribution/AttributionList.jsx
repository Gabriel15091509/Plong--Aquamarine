import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiPackage,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiX,
  FiSearch,
  FiFilter,
  FiList,
  FiGrid,
  FiUser,
  FiAnchor,
  FiRefreshCw,
} from "react-icons/fi";
import toast from "react-hot-toast";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";
import ConfirmModal from "../Common/ConfirmModal";
import BulkActionBar from "../Common/BulkActionBar";
import Pagination from "../Common/Pagination";
import { useAuth } from "../../context/AuthContext";
import { useAttributions } from "../../hooks/Attribution/useAttributions";
import { useMateriels } from "../../hooks/Materiel/useMateriels";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useSelection } from "../../hooks/useSelection";
import { formatDate } from "../../utils/helpers";
import attributionService from "../../services/Attribution/attributionService";
import AttributionFormModal from "./AttributionFormModal";
import AttributionDetails from "./AttributionDetails";
import TabBar from "../Common/TabBar";
import { MATERIEL_TABS } from "../../constants/materielTabs";

import ErrorState from "../Common/ErrorState";

const AttributionList = () => {
  const { hasRole } = useAuth();
  // Seul le président gère réellement le matériel (créer/modifier/
  // supprimer une attribution, TabBar Matériel/Réparations — voir
  // MaterielGroupPage.needsPresident, qui bloque déjà /attributions/create
  // et /attributions/edit/:id côté route pour les autres) : un moniteur/
  // adhérent n'a ici qu'un accès en LECTURE à SA PROPRE vue, déjà scopée
  // côté backend (voir AttributionService.getAll).
  const canManageAttribution = hasRole(["president"]);
  const isMoniteur = hasRole(["moniteur"]);

  const { useGetAll, useRemove } = useAttributions();
  const { useGetAll: useGetAllMateriels } = useMateriels();
  const { useGetAll: useGetAllAdherents } = useAdherents();
  const { useGetAll: useGetAllSorties } = useSorties();

  const { data, isLoading, error, refetch } = useGetAll();
  const { data: materielsData } = useGetAllMateriels();
  const { data: adherentsData } = useGetAllAdherents();
  // Uniquement pour le libellé des groupes en vue moniteur (voir
  // groupedAttributions ci-dessous) — sans intérêt pour la vue président
  // (regroupée par adhérent), mais un appel de plus au cache déjà partagé
  // avec SortiesPage reste anodin comme pour materielsData/adherentsData
  // juste au-dessus.
  const { data: sortiesData } = useGetAllSorties();
  const remove = useRemove();
  const selection = useSelection();

  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [deleteModal, setDeleteModal] = useState(null);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  // Clé de l'action en cours (`delete-<id>`) : seule l'icône de la ligne
  // concernée passe en spinner (même motif que InscriptionList.jsx).
  const [actionLoading, setActionLoading] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  // Paginé par GROUPE (adhérent ou sortie selon le rôle, voir
  // groupedAttributions), pas par attribution individuelle : paginer sur
  // les attributions brutes couperait un même groupe en deux pages.
  const groupsPerPage = 10;
  // Vue grille par défaut (cartes verticales, comme SortiesPage/AdherentList)
  // : mieux adapté au mobile que les lignes horizontales de la vue liste.
  const [viewMode, setViewMode] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 640 ? "grid" : "list",
  );

  const materielMap = useMemo(() => {
    const map = {};
    materielsData?.data?.forEach((m) => {
      map[m.num_inventaire] = `${m.marque} ${m.modele}`;
    });
    return map;
  }, [materielsData]);

  const adherentMap = useMemo(() => {
    const map = {};
    adherentsData?.data?.forEach((a) => {
      map[a.num_adherent] = `${a.nom} ${a.prenom}`;
    });
    return map;
  }, [adherentsData]);

  const sortieMap = useMemo(() => {
    const map = {};
    sortiesData?.data?.forEach((s) => {
      map[s.id_sortie] = `${s.type} — ${s.lieu}`;
    });
    return map;
  }, [sortiesData]);

  const allAttributions = data?.data || [];

  const filteredAttributions = useMemo(() => {
    return allAttributions.filter((a) => {
      const isEnCours = !a.date_retour_reel;
      const isEnRetard = isEnCours && new Date(a.date_retour_prevue) < new Date();
      if (filter === "en-cours" && !isEnCours) return false;
      if (filter === "retournes" && isEnCours) return false;
      if (filter === "retard" && !isEnRetard) return false;
      if (filter === "prets" && a.id_sortie) return false;

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const materielName = (materielMap[a.num_inventaire] || "").toLowerCase();
        const adherentName = (adherentMap[a.num_adherent] || "").toLowerCase();
        return (
          materielName.includes(search) || adherentName.includes(search)
        );
      }
      return true;
    });
  }, [allAttributions, materielMap, adherentMap, filter, searchTerm]);

  // Regroupement — par adhérent pour la vue président (repérer d'un coup
  // d'œil tout ce qu'un même adhérent a en cours/emprunté, plutôt que de
  // parcourir une liste plate mélangeant tout le monde), par SORTIE pour la
  // vue moniteur : côté backend (voir AttributionService.getAll), un
  // moniteur ne reçoit déjà que les attributions des sorties qu'il encadre
  // — regrouper par sortie colle donc mieux à "le matériel de mes sorties"
  // qu'un regroupement par adhérent. Chaque groupe garde l'ordre d'origine
  // de filteredAttributions ; les groupes eux-mêmes sont triés par libellé
  // (alphabétique), une clé non résolue (adherentMap/sortieMap pas encore
  // chargée) restant regroupée sous son numéro/id brut plutôt que dispersée
  // un peu partout dans le tri.
  const groupedAttributions = useMemo(() => {
    const groups = new Map();
    filteredAttributions.forEach((attribution) => {
      const key = isMoniteur ? attribution.id_sortie : attribution.num_adherent;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(attribution);
    });
    return Array.from(groups.entries())
      .map(([key, items]) => ({
        key,
        label: isMoniteur
          ? sortieMap[key] || `Sortie #${key}`
          : adherentMap[key] || `Adhérent #${key}`,
        items,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "fr"));
  }, [filteredAttributions, adherentMap, sortieMap, isMoniteur]);

  const totalPages = Math.ceil(groupedAttributions.length / groupsPerPage);
  const startIndex = (currentPage - 1) * groupsPerPage;
  const paginatedGroups = groupedAttributions.slice(
    startIndex,
    startIndex + groupsPerPage,
  );

  const handleDelete = async (id) => {
    // Ferme la modale dès le lancement : elle masquerait sinon le spinner
    // de la ligne pendant la requête.
    setDeleteModal(null);
    setActionLoading(`delete-${id}`);
    try {
      await remove.mutateAsync(id);
      await refetch();
    } catch (error) {
      // toast déjà géré par le hook useRemove
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const result = await attributionService.bulkDelete(Array.from(selection.selectedIds));
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

  // N'attend que la propre liste : materielsData/adherentsData ne servent
  // qu'aux libellés affichés (materielMap/adherentMap), avec repli
  // "Matériel #<id>"/"Adhérent #<id>" déjà prévu tant qu'ils ne sont pas
  // encore chargés — chargement progressif.
  if (isLoading) return <LoadingSpinner variant="list" />;
  if (error) return <ErrorState onRetry={refetch} />;

  if (filteredAttributions.length === 0) {
    return (
      <div className="space-y-4">
        {canManageAttribution && <TabBar tabs={MATERIEL_TABS} />}
        <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <FiPackage className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aucune attribution trouvée
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm || filter !== "all"
            ? "Aucun résultat pour vos critères"
            : canManageAttribution
              ? "Commencez par créer une nouvelle attribution"
              : "Rien à afficher pour le moment"}
        </p>
        {(searchTerm || filter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setFilter("all");
            }}
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <FiX className="w-4 h-4" /> Réinitialiser la recherche
          </button>
        )}
        {canManageAttribution && (
          <Link
            to="/attributions/create"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <FiPlus className="w-4 h-4" /> Nouvelle attribution
          </Link>
        )}
        <AttributionFormModal />
        <AttributionDetails />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canManageAttribution && <TabBar tabs={MATERIEL_TABS} />}
      {/* Bouton "Filtres" (mobile uniquement) : recherche + filtres
          repliés par défaut pour ne pas encombrer l'écran — un tap les
          affiche. Toujours visibles à partir de sm (recherche fréquente
          sur grand écran, pas besoin de la cacher). */}
      <button
        type="button"
        onClick={() => setShowFilters((v) => !v)}
        className="sm:hidden inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
      >
        {showFilters ? <FiX className="w-4 h-4" /> : <FiFilter className="w-4 h-4" />}
        Filtres
      </button>
      <div className={`${showFilters ? "flex" : "hidden"} flex-col gap-3 sm:flex sm:flex-row`}>
        <div className="relative flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par matériel ou adhérent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-auto"
          >
            <option value="all">Toutes</option>
            <option value="en-cours">En cours</option>
            <option value="retournes">Retournées</option>
            <option value="retard">En retard</option>
            <option value="prets">Prêts (sans sortie)</option>
          </select>
          {canManageAttribution && (
            <Link
              to="/attributions/create"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 sm:w-auto"
            >
              <FiPlus className="w-4 h-4" />
              Nouvelle
            </Link>
          )}
          <div className="col-span-2 flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800 sm:col-auto">
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

      {canManageAttribution && (
        <>
          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              checked={selection.allSelected(
                paginatedGroups.flatMap((g) => g.items.map((a) => a.id_attribution)),
              )}
              onChange={() =>
                selection.toggleAll(
                  paginatedGroups.flatMap((g) => g.items.map((a) => a.id_attribution)),
                )
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Tout sélectionner (page courante)
            </span>
          </div>
          <BulkActionBar
            count={selection.selectedCount}
            onClear={selection.clear}
            onDelete={() => setBulkDeleteModal(true)}
          />
        </>
      )}

      {/* Groupées par adhérent ou par sortie selon le rôle (voir
          groupedAttributions) — même esprit que le "groupé par sortie" de
          PlongeeList, en plus léger (pas de repli/dépli : le nombre de
          groupes actifs à la fois reste largement gérable d'un coup d'œil,
          contrairement aux centaines de plongées d'une saison). Paginée
          par groupe (paginatedGroups), pas par attribution individuelle —
          voir groupsPerPage. */}
      <div className="space-y-6">
        {paginatedGroups.map((groupe) => (
          <div key={groupe.key ?? "inconnu"}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                {isMoniteur ? <FiAnchor className="w-4 h-4" /> : <FiUser className="w-4 h-4" />}
              </div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
                {groupe.label}
              </h3>
              <span className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
                {groupe.items.length} attribution{groupe.items.length > 1 ? "s" : ""}
              </span>
            </div>
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    : "grid gap-3"
                }
              >
                {viewMode === "grid"
                  ? groupe.items.map((attribution) => {
                const isEnCours = !attribution.date_retour_reel;
                const isEnRetard =
                  isEnCours && new Date(attribution.date_retour_prevue) < new Date();
                return (
                  <motion.div
                    key={attribution.id_attribution}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col items-center text-center hover:shadow-lg transition-shadow"
                  >
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        isEnRetard
                          ? "bg-red-100 dark:bg-red-900/30"
                          : isEnCours
                            ? "bg-blue-100 dark:bg-blue-900/30"
                            : "bg-green-100 dark:bg-green-900/30"
                      }`}
                    >
                      {isEnRetard ? (
                        <FiAlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
                      ) : isEnCours ? (
                        <FiClock className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <FiCheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mt-3 break-words w-full">
                      {materielMap[attribution.num_inventaire] ||
                        `Matériel #${attribution.num_inventaire}`}
                    </h3>
                    {/* Nom de l'adhérent retiré ici : déjà porté par l'en-tête
                        du groupe ci-dessus (groupedByAdherent), pas besoin de
                        le répéter sur chaque carte. */}
                    <p className="flex items-center justify-center flex-wrap gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                      {formatDate(attribution.date_attribution)}
                      <span>→</span>
                      {formatDate(attribution.date_retour_prevue)}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          isEnRetard
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : isEnCours
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        {isEnRetard ? "En retard" : isEnCours ? "En cours" : "Retourné"}
                      </span>
                      {!attribution.id_sortie && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          Prêt (sans sortie)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 w-full">
                      {canManageAttribution && (
                        <input
                          type="checkbox"
                          checked={selection.isSelected(attribution.id_attribution)}
                          onChange={() => selection.toggle(attribution.id_attribution)}
                          className="mr-1 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                          title="Sélectionner"
                        />
                      )}
                      <Link
                        to={`/attributions/${attribution.id_attribution}`}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Voir"
                      >
                        <FiEye className="w-4 h-4" />
                      </Link>
                      {canManageAttribution && (
                        <>
                          <Link
                            to={`/attributions/edit/${attribution.id_attribution}`}
                            className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <FiEdit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteModal(attribution.id_attribution)}
                            disabled={actionLoading === `delete-${attribution.id_attribution}`}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Supprimer"
                          >
                            {actionLoading === `delete-${attribution.id_attribution}` ? (
                              <FiRefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <FiTrash2 className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })
            : groupe.items.map((attribution) => {
            const isEnCours = !attribution.date_retour_reel;
            const isEnRetard = isEnCours && new Date(attribution.date_retour_prevue) < new Date();
            return (
              <motion.div
                key={attribution.id_attribution}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {canManageAttribution && (
                    <input
                      type="checkbox"
                      checked={selection.isSelected(attribution.id_attribution)}
                      onChange={() => selection.toggle(attribution.id_attribution)}
                      className="mt-1 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                  )}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isEnRetard
                          ? "bg-red-100 dark:bg-red-900/30"
                          : isEnCours
                            ? "bg-blue-100 dark:bg-blue-900/30"
                            : "bg-green-100 dark:bg-green-900/30"
                      }`}
                    >
                      {isEnRetard ? (
                        <FiAlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                      ) : isEnCours ? (
                        <FiClock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 dark:text-white break-words">
                            {materielMap[attribution.num_inventaire] ||
                              `Matériel #${attribution.num_inventaire}`}
                          </h3>
                          {/* Nom de l'adhérent retiré ici : déjà porté par
                              l'en-tête du groupe ci-dessus
                              (groupedByAdherent). */}
                        </div>
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {/* flex-wrap : sans ça, la plage de dates ("→")
                              est un flex-item unique qui ne peut pas passer
                              à la ligne — sur mobile, une colonne trop
                              étroite la faisait déborder du côté droit de
                              la carte, silencieusement coupée par le filet
                              anti-scroll horizontal global (overflow-x:
                              hidden). Vérifié en conditions réelles. */}
                          <span className="flex items-center gap-1 flex-wrap">
                            <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                            {formatDate(attribution.date_attribution)}
                            <span>→</span>
                            {formatDate(attribution.date_retour_prevue)}
                          </span>
                          <span className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                isEnRetard
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : isEnCours
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              }`}
                            >
                              {isEnRetard ? "En retard" : isEnCours ? "En cours" : "Retourné"}
                            </span>
                            {!attribution.id_sortie && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                Prêt (sans sortie)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link
                          to={`/attributions/${attribution.id_attribution}`}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Voir"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        {canManageAttribution && (
                          <>
                            <Link
                              to={`/attributions/edit/${attribution.id_attribution}`}
                              className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <FiEdit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => setDeleteModal(attribution.id_attribution)}
                              disabled={actionLoading === `delete-${attribution.id_attribution}`}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Supprimer"
                            >
                              {actionLoading === `delete-${attribution.id_attribution}` ? (
                                <FiRefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <FiTrash2 className="w-4 h-4" />
                              )}
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
            </AnimatePresence>
          </div>
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

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
              Êtes-vous sûr de vouloir supprimer cette attribution ?
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

      <ConfirmModal
        isOpen={bulkDeleteModal}
        message={`Êtes-vous sûr de vouloir supprimer les ${selection.selectedCount} attribution(s) sélectionnée(s) ?`}
        confirmLabel={isBulkDeleting ? "Suppression..." : "Supprimer"}
        onCancel={() => setBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
      />

      <AttributionFormModal />
      <AttributionDetails />
    </div>
  );
};

export default AttributionList;
