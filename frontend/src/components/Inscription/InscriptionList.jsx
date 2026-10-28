import React, { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiClipboard,
  FiX,
  FiSearch,
  FiFilter,
  FiList,
  FiGrid,
  FiMapPin,
} from "react-icons/fi";
import LoadingSpinner from "../Common/LoadingSpinner";
import ConfirmModal from "../Common/ConfirmModal";
import BulkActionBar from "../Common/BulkActionBar";
import Pagination from "../Common/Pagination";
import SearchableSelect from "../Common/SearchableSelect";
import InscriptionRow from "./InscriptionRow";
import InscriptionActionModals from "./InscriptionActionModals";
import { formatDateTime } from "../../utils/helpers";
import { useInscriptions } from "../../hooks/Inscription/useInscriptions";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useMoniteurs } from "../../hooks/Moniteur/useMoniteurs";
import { useAuth } from "../../context/AuthContext";
import { useSelection } from "../../hooks/useSelection";
import { STATUT_INSCRIPTION } from "../../utils/constants";
import inscriptionService from "../../services/Inscription/inscriptionService";
import InscriptionFormModal from "./InscriptionFormModal";
import InscriptionDetails from "./InscriptionDetails";

import ErrorState from "../Common/ErrorState";

// TODO: Ajouter un filtre par date de sortie
const InscriptionList = () => {
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all");
  // Préfiltre venu de SortiesPage.jsx ("Voir les inscriptions de cette
  // sortie", ?sortie=<id>) — même pattern que mesSortiesOnly dans
  // SortiesPage.jsx (état local initialisé depuis l'URL puis synchronisé).
  const [filterSortie, setFilterSortie] = useState(
    searchParams.get("sortie") || "all",
  );
  useEffect(() => {
    setFilterSortie(searchParams.get("sortie") || "all");
    setCurrentPage(1);
  }, [searchParams]);
  // Clé de l'action en cours (ex. "confirm-42") — voir InscriptionRow.jsx :
  // seule l'icône de l'action concernée passe en spinner, pas tout le
  // bouton d'un simple opacity-50 comme avant (même motif que
  // FormationList.jsx/actionLoading).
  const [actionLoading, setActionLoading] = useState(null);
  const selection = useSelection();
  const [deleteModal, setDeleteModal] = useState(null);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [waitlistModal, setWaitlistModal] = useState(null);
  // Vue grille par défaut (cartes verticales, comme SortiesPage/AdherentList)
  // : mieux adapté au mobile que les lignes horizontales de la vue liste.
  const [viewMode, setViewMode] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 640 ? "grid" : "list",
  );
  const itemsPerPage = 10;

  // Auth
  const { user } = useAuth();
  const isAdmin = ["president", "moniteur", "tresorier"].includes(
    user?.role,
  );
  const isAdherent = !isAdmin;

  // Hooks
  const { useGetAll, useRemove, useConfirm, useCancel, useUpdate } =
    useInscriptions();
  const { useGetAll: useGetAllAdherents } = useAdherents();
  const { useGetAll: useGetAllSorties } = useSorties();
  const { useGetAll: useGetAllMoniteurs } = useMoniteurs();

  const { data, isLoading, error, refetch } = useGetAll();
  const { data: adherentsData } = useGetAllAdherents();
  const { data: sortiesData } = useGetAllSorties();
  // Résout le moniteur connecté et les encadrants désignés par sortie —
  // uniquement pour restreindre les ACTIONS de gestion (confirmer/annuler/
  // mettre en liste d'attente/supprimer) au président, au trésorier, ou à un
  // moniteur désigné encadrant de LA SORTIE de chaque inscription (voir
  // canManageCetteInscription plus bas) — même garde-fou que
  // InscriptionService.assertCanManageInscription côté serveur, et même
  // correctif que PlongeeList.jsx/SortiesPage.jsx pour le même motif. isAdmin
  // (rôle générique) reste utilisé tel quel pour ce qui ne dépend PAS d'une
  // sortie précise (visibilité de la liste complète, bouton "Nouvelle").
  const { data: moniteursData } = useGetAllMoniteurs({}, { enabled: isAdmin });

  const remove = useRemove();
  const confirm = useConfirm();
  const cancel = useCancel();
  const updateInscription = useUpdate();

  const allInscriptions = data?.data || [];

  // Map des adhérents avec leurs infos
  const adherentMap = useMemo(() => {
    const map = {};
    if (adherentsData?.data) {
      adherentsData.data.forEach((adherent) => {
        map[adherent.num_adherent] = {
          nom: `${adherent.civilite} ${adherent.nom} ${adherent.prenom}`,
          photo: adherent.photo,
          num_adherent: adherent.num_adherent,
        };
      });
    }
    return map;
  }, [adherentsData]);

  const currentAdherent = useMemo(() => {
    if (!adherentsData?.data || !user) return null;
    return adherentsData.data.find((adherent) => adherent.email === user.email);
  }, [adherentsData, user]);

  // Capacités par sortie
  const capacityBySortie = useMemo(() => {
    const map = {};
    if (sortiesData?.data) {
      sortiesData.data.forEach((sortie) => {
        const sortieInscriptions = allInscriptions.filter(
          (inscription) => inscription.id_sortie === sortie.id_sortie,
        );
        const confirmees = sortieInscriptions.filter(
          (inscription) => inscription.statut === STATUT_INSCRIPTION.CONFIRMEE,
        ).length;
        const listeAttente = sortieInscriptions.filter(
          (inscription) => inscription.statut === STATUT_INSCRIPTION.LISTE_ATTENTE,
        ).length;
        const enAttente = sortieInscriptions.filter(
          (inscription) => inscription.statut === STATUT_INSCRIPTION.EN_ATTENTE,
        ).length;

        map[sortie.id_sortie] = {
          nbPlaces: sortie.nb_places || 0,
          confirmees,
          listeAttente,
          enAttente,
          placesDisponibles: Math.max((sortie.nb_places || 0) - confirmees, 0),
        };
      });
    }
    return map;
  }, [sortiesData, allInscriptions]);

  // Map des sorties
  const sortieMap = useMemo(() => {
    const map = {};
    if (sortiesData?.data) {
      sortiesData.data.forEach((sortie) => {
        map[sortie.id_sortie] = {
          label: `${sortie.type} - ${sortie.lieu} (${sortie.site})`,
          date: sortie.date_heure,
          type: sortie.type,
          id: sortie.id_sortie,
          capacity: capacityBySortie[sortie.id_sortie],
        };
      });
    }
    return map;
  }, [sortiesData, capacityBySortie]);

  const currentMoniteurId = useMemo(() => {
    if (!user || !moniteursData?.data) return null;
    const moniteur = moniteursData.data.find((m) => m.user?.email === user.email);
    return moniteur?.id_moniteur || null;
  }, [user, moniteursData]);

  // Map id_sortie -> liste d'id_moniteur encadrants (Sortie.encadrants)
  const sortieEncadrantsMap = useMemo(() => {
    const map = new Map();
    (sortiesData?.data || []).forEach((s) => {
      map.set(s.id_sortie || s.id, Array.isArray(s.encadrants) ? s.encadrants : []);
    });
    return map;
  }, [sortiesData]);

  // Actions de gestion d'UNE inscription donnée (confirmer/mettre en liste
  // d'attente/annuler-en-tant-que-gestionnaire/supprimer/pointage) :
  // réservées au président et au trésorier (accès total, le trésorier
  // n'encadrant jamais de sortie lui-même) ou au moniteur désigné encadrant
  // de LA SORTIE de cette inscription (Sortie.encadrants) — pas seulement
  // "être un moniteur", pour rester strictement identique à la règle serveur
  // (InscriptionService.assertCanManageInscription) et ne jamais montrer un
  // bouton qu'un 403 refuserait ensuite. Avant ce garde-fou, isAdmin (rôle
  // générique) ouvrait ces actions à n'importe quel moniteur sur n'importe
  // quelle inscription, y compris celles d'une sortie confiée à un autre.
  const canManageCetteInscription = (inscription) => {
    if (!isAdmin) return false;
    if (user?.role === "president" || user?.role === "tresorier") return true;
    return (
      currentMoniteurId != null &&
      (sortieEncadrantsMap.get(inscription.id_sortie) || []).includes(currentMoniteurId)
    );
  };

  // Options de filtrage
  const sortieOptions = useMemo(() => {
    const options = [{ value: "all", label: "Toutes les sorties" }];
    if (sortiesData?.data) {
      sortiesData.data.forEach((sortie) => {
        options.push({
          value: sortie.id_sortie.toString(),
          label: `${sortie.type} - ${sortie.lieu} (${new Date(sortie.date_heure).toLocaleDateString("fr-FR")})`,
        });
      });
    }
    return options;
  }, [sortiesData]);

  // Filtrage par rôle
  const filteredByRole = useMemo(() => {
    if (isAdmin) return allInscriptions;
    if (isAdherent && currentAdherent) {
      return allInscriptions.filter(
        (i) => i.num_adherent === currentAdherent.num_adherent,
      );
    }
    return [];
  }, [allInscriptions, isAdmin, isAdherent, currentAdherent]);

  // Filtrage final
  const filteredInscriptions = useMemo(() => {
    return filteredByRole.filter((i) => {
      const adherentInfo = adherentMap[i.num_adherent] || { nom: `#${i.num_adherent}` };
      const adherentName = adherentInfo.nom;
      const sortieName = sortieMap[i.id_sortie]?.label || "";
      const matchSearch =
        adherentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sortieName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = filter === "all" || i.statut === filter;
      const matchSortie =
        filterSortie === "all" || i.id_sortie.toString() === filterSortie;

      return matchSearch && matchStatus && matchSortie;
    });
  }, [
    filteredByRole,
    adherentMap,
    sortieMap,
    searchTerm,
    filter,
    filterSortie,
  ]);

  // Regroupement par sortie : les inscriptions d'une même sortie doivent
  // apparaître ensemble à l'affichage (voir le rendu plus bas, qui insère un
  // en-tête à chaque changement de sortie) — ça suppose qu'elles soient déjà
  // contiguës dans la liste, d'où ce tri par PROXIMITÉ avec aujourd'hui
  // (distance absolue à `now`, pas un simple ordre chronologique croissant) :
  // la sortie la plus proche de la date du jour arrive en premier, qu'elle
  // soit à venir ou déjà passée. Sorties sans date connue (pas encore
  // chargées) repoussées en fin de liste plutôt que de casser l'ordre.
  const sortedInscriptions = useMemo(() => {
    const now = Date.now();
    return [...filteredInscriptions].sort((a, b) => {
      const dateA = sortieMap[a.id_sortie]?.date;
      const dateB = sortieMap[b.id_sortie]?.date;
      if (dateA && dateB) {
        const diff =
          Math.abs(new Date(dateA) - now) - Math.abs(new Date(dateB) - now);
        if (diff !== 0) return diff;
      } else if (dateA) {
        return -1;
      } else if (dateB) {
        return 1;
      }
      return (a.id_inscription || 0) - (b.id_inscription || 0);
    });
  }, [filteredInscriptions, sortieMap]);

  // Pagination
  const totalPages = Math.ceil(sortedInscriptions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInscriptions = useMemo(() => {
    return sortedInscriptions.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedInscriptions, startIndex, itemsPerPage]);

  // N'attend que la propre liste : adherentsData/sortiesData ne servent
  // qu'aux libellés affichés (adherentMap/sortieMap), avec repli déjà prévu
  // tant qu'ils ne sont pas encore chargés — chargement progressif.
  if (isLoading) return <LoadingSpinner variant="list" />;
  if (error) return <ErrorState onRetry={refetch} />;

  // Actions
  const handleDelete = async (id) => {
    if (!isAdmin) {
      toast.error("Vous n'avez pas les droits pour supprimer une inscription");
      return;
    }
    // Ferme la modale de confirmation dès le lancement de la requête (pas à
    // la fin) : elle masquerait sinon le spinner qui remplace l'icône de la
    // ligne pendant le chargement (voir InscriptionRow.jsx/actionLoading).
    setDeleteModal(null);
    setActionLoading(`delete-${id}`);
    try {
      await remove.mutateAsync(id);
      toast.success("Inscription supprimée avec succès");
      // Attend le refetch (pas juste la mutation) avant de retirer le
      // spinner : sinon l'icône reprend son état normal un instant avant
      // que la ligne ne disparaisse réellement de l'écran.
      await refetch();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de la suppression",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!isAdmin) {
      toast.error("Vous n'avez pas les droits pour supprimer une inscription");
      return;
    }
    setIsBulkDeleting(true);
    try {
      const result = await inscriptionService.bulkDelete(Array.from(selection.selectedIds));
      toast[result.success ? "success" : "error"](result.message);
      selection.clear();
      await refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur lors de la suppression groupée");
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteModal(false);
    }
  };

  const handleConfirm = async (id) => {
    if (!isAdmin) {
      toast.error("Seul un gestionnaire peut confirmer");
      return;
    }
    setConfirmModal(null);
    setActionLoading(`confirm-${id}`);
    try {
      await confirm.mutateAsync(id);
      toast.success("Inscription confirmée avec succès");
      await refetch();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de la confirmation",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id) => {
    setCancelModal(null);
    setActionLoading(`cancel-${id}`);
    try {
      await cancel.mutateAsync(id);
      toast.success("Inscription annulée avec succès");
      await refetch();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de l'annulation",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleWaitlist = async (id) => {
    if (!isAdmin) {
      toast.error("Seul un gestionnaire peut gérer la liste d'attente");
      return;
    }
    setWaitlistModal(null);
    setActionLoading(`waitlist-${id}`);
    try {
      await updateInscription.mutateAsync({
        id,
        data: { statut: "Liste d'attente" },
      });
      toast.success("Inscription ajoutée à la liste d'attente");
      await refetch();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la mise en liste d'attente",
      );
    } finally {
      setActionLoading(null);
    }
  };

  if (filteredInscriptions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <FiClipboard className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {isAdherent
            ? "Vous n'avez pas encore d'inscription"
            : "Aucune inscription trouvée"}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm || filter !== "all" || filterSortie !== "all"
            ? "Aucun résultat pour vos critères"
            : isAdherent
              ? "Inscrivez-vous à une sortie de plongée"
              : "Commencez par créer une nouvelle inscription"}
        </p>
        {(searchTerm || filter !== "all" || filterSortie !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setFilter("all");
              setFilterSortie("all");
              setCurrentPage(1);
            }}
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <FiX className="w-4 h-4" /> Réinitialiser la recherche
          </button>
        )}
        <Link
          to="/inscriptions/create"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <FiPlus className="w-4 h-4" />
          {isAdherent ? "M'inscrire" : "Nouvelle inscription"}
        </Link>
        <InscriptionFormModal />
        <InscriptionDetails />
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
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
            placeholder={
              isAdherent
                ? "Rechercher dans vos inscriptions..."
                : "Rechercher par adhérent ou sortie..."
            }
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-auto"
          >
            <option value="all">Tous</option>
            <option value="En attente">En attente</option>
            <option value="Confirmée">Confirmées</option>
            <option value="Annulée">Annulées</option>
            <option value="Liste d'attente">Liste d&apos;attente</option>
          </select>

          {/* Sur mobile, un <select> natif avec une option par sortie
              (parfois des dizaines) oblige à faire défiler toute la liste
              dans le picker du téléphone — remplacé par un menu avec
              recherche, comme pour les champs Adhérent/Sortie du
              formulaire d'inscription. */}
          <SearchableSelect
            options={sortieOptions}
            value={filterSortie}
            onChange={(value) => {
              setFilterSortie(value);
              setCurrentPage(1);
            }}
            placeholder="Rechercher une sortie..."
            className="w-full sm:w-72"
          />

          <Link
            to="/inscriptions/create"
            className="col-span-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 sm:col-auto sm:w-auto"
          >
            <FiPlus className="w-4 h-4" />
            {isAdherent ? "M'inscrire" : "Nouvelle"}
          </Link>
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

      {/* Sélection multiple / actions groupées (suppression réservée aux
          inscriptions que l'utilisateur peut effectivement gérer, même règle
          que le bouton individuel — voir canManageCetteInscription) */}
      {isAdmin && (() => {
        const selectableIds = paginatedInscriptions
          .filter(canManageCetteInscription)
          .map((i) => i.id_inscription);
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

      {/* Liste des inscriptions */}
      <AnimatePresence>
        {paginatedInscriptions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
          >
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Aucune inscription trouvée
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {searchTerm || filter !== "all" || filterSortie !== "all"
                ? "Essayez de modifier vos filtres"
                : "Aucune inscription pour le moment"}
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
            {(() => {
              // En-tête de groupe seulement s'il y a plus d'une sortie sur
              // la page courante — avec un seul groupe (ex. filtre "sortie"
              // déjà appliqué), un unique en-tête ne ferait que répéter ce
              // que la barre de filtres affiche déjà. paginatedInscriptions
              // est trié par sortie (voir sortedInscriptions plus haut),
              // donc une même sortie y est toujours contiguë : comparer au
              // précédent suffit à détecter chaque changement de groupe.
              const showGroupHeaders =
                new Set(paginatedInscriptions.map((i) => i.id_sortie)).size > 1;
              let previousSortieId;

              return paginatedInscriptions.map((inscription) => {
                const adherentInfo = adherentMap[inscription.num_adherent] || {
                  nom: `#${inscription.num_adherent}`,
                  photo: null,
                };
                const sortieInfo = sortieMap[inscription.id_sortie] || {
                  label: `#${inscription.id_sortie}`,
                };
                const capacityInfo = capacityBySortie[inscription.id_sortie] || {};
                const isOwnInscription =
                  isAdherent &&
                  currentAdherent &&
                  inscription.num_adherent === currentAdherent.num_adherent;
                const isNewGroup =
                  showGroupHeaders && inscription.id_sortie !== previousSortieId;
                previousSortieId = inscription.id_sortie;

                return (
                  <React.Fragment key={inscription.id_inscription}>
                    {isNewGroup && (
                      <div className="col-span-full flex items-center gap-2 px-1 pt-4 mt-1 border-t border-gray-100 dark:border-gray-700 first:mt-0 first:pt-0 first:border-t-0">
                        <FiMapPin className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {sortieInfo.label}
                        </h3>
                        {sortieInfo.date && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                            {formatDateTime(sortieInfo.date)}
                          </span>
                        )}
                      </div>
                    )}
                    <InscriptionRow
                      variant={viewMode}
                      inscription={inscription}
                      adherentInfo={adherentInfo}
                      sortieInfo={sortieInfo}
                      capacityInfo={capacityInfo}
                      isAdmin={canManageCetteInscription(inscription)}
                      isOwnInscription={isOwnInscription}
                      actionLoading={actionLoading}
                      onRequestConfirm={() =>
                        setConfirmModal(inscription.id_inscription)
                      }
                      onRequestWaitlist={() =>
                        setWaitlistModal(inscription.id_inscription)
                      }
                      onRequestCancel={() =>
                        setCancelModal(inscription.id_inscription)
                      }
                      onRequestDelete={() =>
                        setDeleteModal(inscription.id_inscription)
                      }
                      selected={
                        canManageCetteInscription(inscription)
                          ? selection.isSelected(inscription.id_inscription)
                          : undefined
                      }
                      onToggleSelect={
                        canManageCetteInscription(inscription)
                          ? () => selection.toggle(inscription.id_inscription)
                          : undefined
                      }
                    />
                  </React.Fragment>
                );
              });
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modal Suppression */}
      <ConfirmModal
        isOpen={!!deleteModal}
        message="Êtes-vous sûr de vouloir supprimer cette inscription ?"
        onCancel={() => setDeleteModal(null)}
        onConfirm={() => handleDelete(deleteModal)}
      />

      <ConfirmModal
        isOpen={bulkDeleteModal}
        message={`Êtes-vous sûr de vouloir supprimer les ${selection.selectedCount} inscription(s) sélectionnée(s) ?`}
        confirmLabel={isBulkDeleting ? "Suppression..." : "Supprimer"}
        onCancel={() => setBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
      />

      <InscriptionActionModals
        confirmModal={confirmModal}
        onCancelConfirm={() => setConfirmModal(null)}
        onConfirm={handleConfirm}
        cancelModal={cancelModal}
        onCancelCancel={() => setCancelModal(null)}
        onCancel={handleCancel}
        waitlistModal={waitlistModal}
        onCancelWaitlist={() => setWaitlistModal(null)}
        onWaitlist={handleWaitlist}
      />

      <InscriptionFormModal />
      <InscriptionDetails />
    </div>
  );
};

export default InscriptionList;