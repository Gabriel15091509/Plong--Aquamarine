import React, { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiFileText,
  FiUser,
  FiDollarSign,
  FiCalendar,
  FiCheck,
  FiX,
  FiSearch,
  FiFilter,
  FiList,
  FiGrid,
  FiRefreshCw,
} from "react-icons/fi";
import toast from "react-hot-toast";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";
import ConfirmModal from "../Common/ConfirmModal";
import BulkActionBar from "../Common/BulkActionBar";
import Pagination from "../Common/Pagination";
import ModalLink from "../Common/ModalLink";
import TabBar from "../Common/TabBar";
import { DOSSIER_TABS } from "../../constants/dossierTabs";
import { useAdhesions } from "../../hooks/Adhesion/useAdhesions";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useAuth } from "../../context/AuthContext";
import { useSelection } from "../../hooks/useSelection";
import StatusBadge from "../Common/StatusBadge";
import { formatDate, formatCurrency } from "../../utils/helpers";
import { photoUrl } from "../../utils/photoUrl";
import { TYPE_ADHESION_OPTIONS } from "../../utils/constants";
import adhesionService from "../../services/Adhesion/adhesionService";
import AdhesionFormModal from "./AdhesionFormModal";
import AdhesionDetails from "./AdhesionDetails";

import ErrorState from "../Common/ErrorState";

// Le nom de l'adhérent est désormais porté par le seul en-tête de groupe
// (renderGroupHeader plus bas, une fois par personne) : le répéter sur
// chaque carte/ligne du groupe n'apportait rien. Le type prend sa place
// comme information mise en avant de chaque entrée — via son libellé lisible
// (TYPE_ADHESION_OPTIONS), pas le code brut stocké en base ("FFESM" plutôt
// que la valeur affichée "Licence FFESM").
const typeLabel = (type) =>
  TYPE_ADHESION_OPTIONS.find((o) => o.value === type)?.label || type;

const AdhesionList = () => {
  // TOUS LES HOOKS EN PREMIER - AVANT TOUT RETURN CONDITIONNEL
  const { hasRole } = useAuth();
  const canManageAdhesion = hasRole(["president", "tresorier"]);
  // Un adhérent ne gère pas les adhésions des autres, mais peut soumettre
  // sa propre licence FFESM / assurance (voir AdhesionForm) — CTA distincte
  // de "Nouvelle adhésion", jamais les deux en même temps pour un rôle donné.
  const canSubmitOwn = hasRole(["adherent"]);
  const { useGetAll, useRemove, useValider } = useAdhesions();
  const { useGetAll: useGetAllAdherents } = useAdherents();

  const { data, isLoading, error, refetch } = useGetAll();
  const { data: adherentsData } =
    useGetAllAdherents();
  const remove = useRemove();
  const valider = useValider();
  const selection = useSelection();

  // "Validation" : activé depuis ?validation=soumis (lien du sous-menu
  // "Validation" dans la Sidebar) — affiche uniquement les auto-soumissions
  // (soumis_par_adherent) qui attendent encore une décision ou viennent
  // d'être rejetées (En attente/Rejeté, distingués par le badge sur chaque
  // ligne). Une auto-soumission validée quitte cette file et rejoint
  // "Adhésions" (voir enFileDeValidation ci-dessous). Ce n'est
  // plus un filtre réglable en page : c'est une vue dédiée, il n'y a donc
  // pas de <select> correspondant, seulement ce booléen dérivé de l'URL.
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  // Statut d'adhésion (Valide/Expiré, dérivé de date_fin — voir
  // AdhesionService.deriveStatut) : distinct de `filter` (statut_paiement)
  // et de showValidationOnly (statut_validation) ci-dessus, aucun des deux
  // ne renseigne si l'adhésion est encore en cours de validité.
  const [statutFilter, setStatutFilter] = useState("all");
  const [showValidationOnly, setShowValidationOnly] = useState(
    searchParams.get("validation") === "soumis",
  );
  // Le lien de la Sidebar change juste ?validation=... sans démonter cette
  // page (même route /adhesions) : l'état initial de useState ci-dessus ne
  // se ré-évalue pas tout seul dans ce cas, il faut le resynchroniser
  // explicitement à chaque changement d'URL, sinon le clic ne fait rien de
  // visible (l'URL change, la vue affichée reste l'ancienne).
  useEffect(() => {
    setShowValidationOnly(searchParams.get("validation") === "soumis");
  }, [searchParams]);
  const [deleteModal, setDeleteModal] = useState(null);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  // Clé de l'action en cours (`delete-<id>`, `validate-<id>`, `reject-<id>`) :
  // seule l'icône de la ligne concernée passe en spinner (même motif que
  // InscriptionList.jsx).
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectMotif, setRejectMotif] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  // Vue grille par défaut (cartes verticales, comme SortiesPage/AdherentList)
  // : mieux adapté au mobile que les lignes horizontales de la vue liste.
  const [viewMode, setViewMode] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 640 ? "grid" : "list",
  );
  const itemsPerPage = 10;

  // Map des adhérents avec toutes leurs infos
  const adherentMap = useMemo(() => {
    const map = {};
    if (adherentsData?.data) {
      adherentsData.data.forEach((adherent) => {
        map[adherent.num_adherent] = {
          nom: `${adherent.civilite} ${adherent.nom} ${adherent.prenom}`,
          // Clé de tri alphabétique dédiée (regroupement par personne,
          // sortedAdhesions plus bas) : `nom` ci-dessus commence par la
          // civilité ("M." / "Mme"), ce qui fausserait l'ordre alphabétique
          // par NOM DE FAMILLE ("M." < "Mme" lexicographiquement, avant même
          // de comparer "Bernard" à "Dupont").
          nomTri: `${adherent.nom} ${adherent.prenom}`.toLowerCase(),
          photo: adherent.photo,
          num_adherent: adherent.num_adherent,
        };
      });
    }
    return map;
  }, [adherentsData]);

  const allAdhesions = data?.data || [];

  // Onglets remplaçant l'ancien sous-menu dépliable "Validation" de la
  // Sidebar (voir Sidebar.jsx, canSeeAdhesionValidationMenu — mêmes rôles)
  // : basculer entre les deux vues sans quitter la page. Badge recalculé
  // depuis les données déjà chargées ci-dessus, jamais via un nouvel appel
  // réseau dédié. Fusionné avec DOSSIER_TABS (Adhésions/Certificats,
  // désormais une seule entrée Sidebar — voir constants/dossierTabs.js) :
  // un seul et même TabBar sert les deux usages plutôt que d'en empiler
  // deux (même principe que formationTabs, voir FormationList.jsx).
  const adhesionTabs = [
    ...DOSSIER_TABS,
    ...(hasRole(["president", "tresorier", "adherent"])
      ? [
          {
            to: "/adhesions?validation=soumis",
            label: "Validation",
            badge: allAdhesions.filter(
              (a) => a.soumis_par_adherent && a.statut_validation !== "Validé",
            ).length,
          },
        ]
      : []),
  ];

  const filteredAdhesions = useMemo(() => {
    return allAdhesions.filter((a) => {
      const adherentInfo = adherentMap[a.num_adherent] || {
        nom: `#${a.num_adherent}`,
        photo: null,
      };
      const adherentName = adherentInfo.nom;

      if (filter !== "all" && a.statut_paiement !== filter) return false;
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (statutFilter !== "all" && a.statut !== statutFilter) return false;
      // "Adhésions" et "Validation" sont deux files distinctes,
      // sans doublon : une auto-soumission (soumis_par_adherent) relève de
      // "Validation" tant qu'elle attend une décision ou vient d'être
      // rejetée (En attente/Rejeté) — une fois validée, elle n'a plus rien à
      // y faire et rejoint "Adhésions" comme n'importe quel
      // dossier accepté.
      const enFileDeValidation =
        a.soumis_par_adherent && a.statut_validation !== "Validé";
      if (showValidationOnly && !enFileDeValidation) return false;
      if (!showValidationOnly && enFileDeValidation) return false;

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          a.type?.toLowerCase().includes(search) ||
          a.num_licence_ffesm?.toLowerCase().includes(search) ||
          adherentName.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [allAdhesions, adherentMap, filter, typeFilter, statutFilter, showValidationOnly, searchTerm]);

  // Regroupement par personne : les adhésions d'un même adhérent doivent
  // apparaître ensemble à l'affichage (voir le rendu plus bas, qui insère un
  // en-tête à chaque changement d'adhérent) — ça suppose qu'elles soient déjà
  // contiguës dans la liste, d'où ce tri par nom d'adhérent (alphabétique,
  // comme la plupart des listes de personnes de l'app), puis par date de
  // début la plus récente en premier au sein d'une même personne (plusieurs
  // adhésions successives, ex. Club puis FFESM).
  const sortedAdhesions = useMemo(() => {
    return [...filteredAdhesions].sort((a, b) => {
      const nameA =
        adherentMap[a.num_adherent]?.nomTri || `#${a.num_adherent}`;
      const nameB =
        adherentMap[b.num_adherent]?.nomTri || `#${b.num_adherent}`;
      const cmp = nameA.localeCompare(nameB, "fr");
      if (cmp !== 0) return cmp;
      return new Date(b.date_debut || 0) - new Date(a.date_debut || 0);
    });
  }, [filteredAdhesions, adherentMap]);

  const totalPages = Math.ceil(sortedAdhesions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAdhesions = sortedAdhesions.slice(
    startIndex,
    startIndex + itemsPerPage,
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
      console.error("Échec de la suppression de l'adhésion :", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const result = await adhesionService.bulkDelete(Array.from(selection.selectedIds));
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

  const handleValider = async (id) => {
    setActionLoading(`validate-${id}`);
    try {
      await valider.mutateAsync({ id, decision: "Validé" });
      await refetch();
    } catch (error) {
      console.error("Échec de la validation de l'adhésion :", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejeter = async () => {
    if (!rejectModal || !rejectMotif.trim()) return;
    const id = rejectModal;
    const motif = rejectMotif.trim();
    // Ferme la modale dès le lancement : elle masquerait sinon le spinner
    // de la ligne pendant la requête.
    setRejectModal(null);
    setRejectMotif("");
    setActionLoading(`reject-${id}`);
    try {
      await valider.mutateAsync({ id, decision: "Rejeté", motif });
      await refetch();
    } catch (error) {
      console.error("Échec du rejet de l'adhésion :", error);
    } finally {
      setActionLoading(null);
    }
  };

  // RETOUR CONDITIONNEL APRÈS TOUS LES HOOKS
  // N'attend que la propre liste (isLoading) : adherentsData ne sert qu'à
  // résoudre les noms affichés (adherentMap ci-dessus), avec un repli
  // "#<num_adherent>" déjà prévu tant qu'il n'est pas encore chargé — pas
  // besoin de bloquer toute la liste pour ça (chargement progressif).
  if (isLoading) return <LoadingSpinner variant="list" />;
  if (error) return <ErrorState onRetry={refetch} />;

  if (filteredAdhesions.length === 0) {
    // Un vrai critère de recherche/filtre est actif — distinct de
    // showValidationOnly, qui n'est pas un filtre réglable mais la vue
    // "Validation" elle-même (voir commentaire plus haut). Sans cette
    // distinction, une file de validation simplement vide (rien à valider,
    // aucune recherche tapée) affichait quand même "Réinitialiser la
    // recherche" — et ce bouton désactivait showValidationOnly, faisant
    // brutalement basculer vers "Adhésions" alors qu'il n'y avait
    // rien à réinitialiser : confusion pour l'utilisateur qui n'avait rien
    // cherché.
    const rechercheOuFiltreActif =
      searchTerm || filter !== "all" || typeFilter !== "all" || statutFilter !== "all";
    return (
      <div className="space-y-4">
      <TabBar tabs={adhesionTabs} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <FiFileText className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aucune adhésion trouvée
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {rechercheOuFiltreActif
            ? "Aucun résultat pour vos critères"
            : showValidationOnly
              ? "Aucune soumission en attente de validation"
              : "Commencez par créer une nouvelle adhésion"}
        </p>
        {rechercheOuFiltreActif && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setFilter("all");
              setTypeFilter("all");
              setStatutFilter("all");
              setCurrentPage(1);
            }}
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <FiX className="w-4 h-4" /> Réinitialiser la recherche
          </button>
        )}
        {(canManageAdhesion || canSubmitOwn) && (
          <ModalLink
            to="/adhesions/create"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <FiPlus className="w-4 h-4" />
            {canManageAdhesion ? "Nouvelle adhésion" : "Soumettre ma licence / assurance"}
          </ModalLink>
        )}
        <AdhesionFormModal />
        <AdhesionDetails />
      </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TabBar tabs={adhesionTabs} />
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
            placeholder="Rechercher par adhérent, type ou licence..."
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
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-auto"
          >
            <option value="all">Tous les types</option>
            {TYPE_ADHESION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-auto"
          >
            <option value="all">Tous</option>
            <option value="Payé">Payés</option>
            <option value="En attente">En attente</option>
            <option value="Partiel">Partiels</option>
            <option value="Annulé">Annulés</option>
          </select>
          <select
            value={statutFilter}
            onChange={(e) => {
              setStatutFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-auto"
          >
            <option value="all">Tous statuts</option>
            <option value="Valide">À jour</option>
            <option value="Expiré">Expirés</option>
          </select>
          {(canManageAdhesion || canSubmitOwn) && (
            <ModalLink
              to="/adhesions/create"
              className="col-span-2 inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 sm:col-auto sm:w-auto"
            >
              <FiPlus className="w-4 h-4" />
              {canManageAdhesion ? "Nouvelle" : "Soumettre"}
            </ModalLink>
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

      {/* Sélection multiple / actions groupées (mêmes dossiers verrouillés
          que le bouton Supprimer individuel : soumission adhérent déjà
          validée exclue) */}
      {canManageAdhesion && (() => {
        const selectableIds = paginatedAdhesions
          .filter((a) => !(a.soumis_par_adherent && a.statut_validation === "Validé"))
          .map((a) => a.id_adhesion);
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

      {/* Liste des adhésions avec photos en évidence */}
      <AnimatePresence>
        {paginatedAdhesions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
          >
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Aucune adhésion trouvée
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {searchTerm ||
              filter !== "all" ||
              typeFilter !== "all" ||
              statutFilter !== "all" ||
              showValidationOnly
                ? "Essayez de modifier vos filtres"
                : "Aucune adhésion pour le moment"}
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
              // En-tête de groupe seulement s'il y a plus d'une personne sur
              // la page courante — avec un seul groupe (ex. recherche déjà
              // ciblée sur un adhérent), un unique en-tête ne ferait que
              // répéter ce qu'affiche déjà chaque carte. paginatedAdhesions
              // est trié par adhérent (voir sortedAdhesions plus haut), donc
              // une même personne y est toujours contiguë : comparer au
              // précédent suffit à détecter chaque changement de groupe.
              // Fonction partagée entre les deux modes d'affichage
              // (grille/liste) ci-dessous — même logique, même en-tête.
              const showGroupHeaders =
                new Set(paginatedAdhesions.map((a) => a.num_adherent)).size > 1;
              let previousNumAdherent;
              const renderGroupHeader = (adhesion, adherentName, adherentInfo) => {
                const isNewGroup =
                  showGroupHeaders && adhesion.num_adherent !== previousNumAdherent;
                previousNumAdherent = adhesion.num_adherent;
                if (!isNewGroup) return null;
                return (
                  <div className="col-span-full flex items-center gap-2 px-1 pt-4 mt-1 border-t border-gray-100 dark:border-gray-700 first:mt-0 first:pt-0 first:border-t-0">
                    {adherentInfo.photo ? (
                      <img
                        src={photoUrl(adherentInfo.photo)}
                        alt={adherentName}
                        className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <FiUser className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    )}
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {adherentName}
                    </h3>
                  </div>
                );
              };

              return viewMode === "grid"
              ? paginatedAdhesions.map((adhesion) => {
                  const adherentInfo = adherentMap[adhesion.num_adherent] || {
                    nom: `#${adhesion.num_adherent}`,
                    photo: null,
                  };
                  const adherentName = adherentInfo.nom;
                  const verrouillee =
                    adhesion.soumis_par_adherent && adhesion.statut_validation === "Validé";
                  const groupHeader = renderGroupHeader(adhesion, adherentName, adherentInfo);

                  return (
                    <React.Fragment key={adhesion.id_adhesion}>
                    {groupHeader}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col items-center text-center hover:shadow-lg transition-shadow"
                    >
                      {adhesion.document_path ? (
                        <img
                          src={photoUrl(adhesion.document_path)}
                          alt={`Document de ${adherentName}`}
                          className="w-24 h-16 rounded-lg object-cover border-2 border-indigo-200 dark:border-indigo-700 shadow-sm bg-gray-50 dark:bg-gray-900"
                          onError={(e) => {
                            e.currentTarget.classList.add("hidden");
                            e.currentTarget.nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-24 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 ${adhesion.document_path ? "hidden" : ""}`}
                      >
                        <FiFileText className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex items-center gap-2 mt-3 w-full justify-center">
                        {adherentInfo.photo ? (
                          <img
                            src={photoUrl(adherentInfo.photo)}
                            alt={adherentName}
                            className="w-8 h-8 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700 shadow-sm flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-700 shadow-sm flex-shrink-0">
                            <FiUser className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                          </div>
                        )}
                        <h3 className="font-semibold text-indigo-700 dark:text-indigo-400 break-words min-w-0">
                          {typeLabel(adhesion.type)}
                        </h3>
                      </div>
                      <p className="flex items-center justify-center flex-wrap gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                        {formatDate(adhesion.date_debut)}
                        <span>→</span>
                        {formatDate(adhesion.date_fin)}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                        {adhesion.statut_validation === "Validé" && (
                          <StatusBadge status={adhesion.statut} />
                        )}
                        {adhesion.type === "Club" && (
                          <span className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                            <FiDollarSign className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                            {formatCurrency(adhesion.montant)}
                          </span>
                        )}
                        {adhesion.type === "Club" && (
                          <StatusBadge status={adhesion.statut_paiement} />
                        )}
                        {adhesion.statut_validation !== "Validé" && (
                          <StatusBadge status={adhesion.statut_validation} />
                        )}
                        {adhesion.num_licence_ffesm && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            Licence: {adhesion.num_licence_ffesm}
                          </span>
                        )}
                      </div>
                      {adhesion.statut_validation === "Rejeté" && adhesion.motif_rejet && (
                        <p className="text-xs text-red-500 dark:text-red-400 italic mt-1">
                          ({adhesion.motif_rejet})
                        </p>
                      )}
                      <div className="flex items-center justify-center flex-wrap gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 w-full">
                        {canManageAdhesion && !verrouillee && (
                          <input
                            type="checkbox"
                            checked={selection.isSelected(adhesion.id_adhesion)}
                            onChange={() => selection.toggle(adhesion.id_adhesion)}
                            className="mr-1 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                            title="Sélectionner"
                          />
                        )}
                        <Link
                          to={`/adhesions/${adhesion.id_adhesion}`}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Voir"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        {canManageAdhesion && adhesion.statut_validation === "En attente" && (
                          <>
                            <button
                              onClick={() => handleValider(adhesion.id_adhesion)}
                              disabled={(actionLoading === `validate-${adhesion.id_adhesion}` || actionLoading === `reject-${adhesion.id_adhesion}` || actionLoading === `delete-${adhesion.id_adhesion}`)}
                              className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Valider"
                            >
                              {actionLoading === `validate-${adhesion.id_adhesion}` ? (
                                <FiRefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <FiCheck className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setRejectModal(adhesion.id_adhesion)}
                              disabled={(actionLoading === `validate-${adhesion.id_adhesion}` || actionLoading === `reject-${adhesion.id_adhesion}` || actionLoading === `delete-${adhesion.id_adhesion}`)}
                              className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Rejeter"
                            >
                              {actionLoading === `reject-${adhesion.id_adhesion}` ? (
                                <FiRefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <FiX className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                        {canManageAdhesion && !verrouillee && (
                          <>
                            {adhesion.statut_validation !== "En attente" && (
                              <ModalLink
                                to={`/adhesions/edit/${adhesion.id_adhesion}`}
                                className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <FiEdit className="w-4 h-4" />
                              </ModalLink>
                            )}
                            <button
                              onClick={() => setDeleteModal(adhesion.id_adhesion)}
                              disabled={actionLoading === `delete-${adhesion.id_adhesion}`}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Supprimer"
                            >
                              {actionLoading === `delete-${adhesion.id_adhesion}` ? (
                                <FiRefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <FiTrash2 className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                    </React.Fragment>
                  );
                })
              : paginatedAdhesions.map((adhesion) => {
              const adherentInfo = adherentMap[adhesion.num_adherent] || {
                nom: `#${adhesion.num_adherent}`,
                photo: null,
              };
              const adherentName = adherentInfo.nom;
              const groupHeader = renderGroupHeader(adhesion, adherentName, adherentInfo);

              return (
                <React.Fragment key={adhesion.id_adhesion}>
                {groupHeader}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {canManageAdhesion &&
                      !(adhesion.soumis_par_adherent && adhesion.statut_validation === "Validé") && (
                        <input
                          type="checkbox"
                          checked={selection.isSelected(adhesion.id_adhesion)}
                          onChange={() => selection.toggle(adhesion.id_adhesion)}
                          className="mt-1 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                        />
                      )}
                    {/* Document (rectangle, mis en avant) et photo de
                        l'adhérent côte à côte — le document est ce qui doit
                        être vérifié en un coup d'œil dans cette liste, la
                        photo n'est là que pour identifier la personne, quel
                        que soit le rôle du visiteur (un adhérent qui
                        consulte sa propre liste — vue "Toutes les
                        adhésions"/"Validation" scopée à lui-même côté
                        backend, voir AdhesionService.getAll — voit la même
                        disposition que le staff). document_path n'est
                        jamais chiffré pour une adhésion (contrairement au
                        certificat médical, voir CertificatList.jsx) :
                        servable directement en <img>. Empilés (colonne) sur
                        mobile pour laisser toute la largeur aux
                        informations, côte à côte (ligne) à partir de sm:
                        comme en affichage bureau. */}
                    <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-2">
                      {adhesion.document_path ? (
                        <img
                          src={photoUrl(adhesion.document_path)}
                          alt={`Document de ${adherentName}`}
                          className="w-20 h-14 rounded-lg object-cover border-2 border-indigo-200 dark:border-indigo-700 shadow-sm bg-gray-50 dark:bg-gray-900"
                          onError={(e) => {
                            e.currentTarget.classList.add("hidden");
                            e.currentTarget.nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-20 h-14 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 ${adhesion.document_path ? "hidden" : ""}`}
                      >
                        <FiFileText className="w-6 h-6 text-gray-400" />
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        {adherentInfo.photo ? (
                          <img
                            src={photoUrl(adherentInfo.photo)}
                            alt={adherentName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700 shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-700 shadow-sm">
                            <FiUser className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Informations */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-indigo-700 dark:text-indigo-400 break-words">
                              {typeLabel(adhesion.type)}
                            </h3>
                          </div>
                          <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {/* flex-wrap : sans ça, la plage de dates ("→")
                                est un flex-item unique qui ne peut pas
                                passer à la ligne — sur mobile, une colonne
                                trop étroite la faisait déborder du côté
                                droit de la carte, silencieusement coupée
                                par le filet anti-scroll horizontal global
                                (overflow-x:hidden). Vérifié en conditions
                                réelles. */}
                            <span className="flex items-center gap-1 flex-wrap">
                              <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                              {formatDate(adhesion.date_debut)}
                              <span>→</span>
                              {formatDate(adhesion.date_fin)}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            {/* Badges et infos secondaires regroupés sur leur
                                propre ligne sur mobile — évite les puces "•"
                                qui se retrouvent seules en début de ligne
                                quand ça déborde. */}
                            <span className="flex flex-wrap items-center gap-2">
                              {/* En attente ou rejetée : "À jour"/"Expirée"
                                  n'a pas de sens pour un dossier pas (encore)
                                  accepté — seul le statut de validation
                                  (badge suivant) compte tant qu'il n'est pas
                                  "Validé". */}
                              {adhesion.statut_validation === "Validé" && (
                                <StatusBadge status={adhesion.statut} />
                              )}
                              {adhesion.type === "Club" && (
                                <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                                  <FiDollarSign className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                                  {formatCurrency(adhesion.montant)}
                                </span>
                              )}
                              {adhesion.type === "Club" && (
                                <StatusBadge status={adhesion.statut_paiement} />
                              )}
                              {adhesion.statut_validation !== "Validé" && (
                                <StatusBadge status={adhesion.statut_validation} />
                              )}
                              {adhesion.statut_validation === "Rejeté" &&
                                adhesion.motif_rejet && (
                                  <span className="text-xs text-red-500 dark:text-red-400 italic">
                                    ({adhesion.motif_rejet})
                                  </span>
                                )}
                              {adhesion.num_licence_ffesm && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  Licence: {adhesion.num_licence_ffesm}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Link
                            to={`/adhesions/${adhesion.id_adhesion}`}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Voir"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          {canManageAdhesion && adhesion.statut_validation === "En attente" && (
                            <>
                              <button
                                onClick={() => handleValider(adhesion.id_adhesion)}
                                disabled={(actionLoading === `validate-${adhesion.id_adhesion}` || actionLoading === `reject-${adhesion.id_adhesion}` || actionLoading === `delete-${adhesion.id_adhesion}`)}
                                className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Valider"
                              >
                                {actionLoading === `validate-${adhesion.id_adhesion}` ? (
                                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <FiCheck className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => setRejectModal(adhesion.id_adhesion)}
                                disabled={(actionLoading === `validate-${adhesion.id_adhesion}` || actionLoading === `reject-${adhesion.id_adhesion}` || actionLoading === `delete-${adhesion.id_adhesion}`)}
                                className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Rejeter"
                              >
                                {actionLoading === `reject-${adhesion.id_adhesion}` ? (
                                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <FiX className="w-4 h-4" />
                                )}
                              </button>
                            </>
                          )}
                          {/* Verrouillé côté serveur (AdhesionService.update/delete)
                              uniquement pour une soumission adhérent déjà validée —
                              une adhésion créée par le staff (ex. Club) reste
                              modifiable comme avant. */}
                          {canManageAdhesion &&
                            !(adhesion.soumis_par_adherent && adhesion.statut_validation === "Validé") && (
                            <>
                              {/* En attente : Modifier n'a pas sa place ici —
                                  c'est Valider/Rejeter ci-dessus qui tranche,
                                  pas une correction silencieuse du dossier
                                  soumis par l'adhérent. */}
                              {adhesion.statut_validation !== "En attente" && (
                                <ModalLink
                                  to={`/adhesions/edit/${adhesion.id_adhesion}`}
                                  className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                  title="Modifier"
                                >
                                  <FiEdit className="w-4 h-4" />
                                </ModalLink>
                              )}
                              <button
                                onClick={() => setDeleteModal(adhesion.id_adhesion)}
                                disabled={actionLoading === `delete-${adhesion.id_adhesion}`}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Supprimer"
                              >
                                {actionLoading === `delete-${adhesion.id_adhesion}` ? (
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
              Êtes-vous sûr de vouloir supprimer cette adhésion ?
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

      {/* Modal de rejet (motif obligatoire — l'adhérent doit savoir pourquoi
          pour pouvoir resoumettre) */}
      {rejectModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400 mb-4">
              <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                <FiX className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Rejeter cette soumission</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">
              L&apos;adhérent verra ce motif et pourra soumettre une nouvelle entrée corrigée.
            </p>
            <textarea
              value={rejectMotif}
              onChange={(e) => setRejectMotif(e.target.value)}
              placeholder="Ex. : numéro de licence illisible sur la photo"
              rows={3}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-300 focus:outline-none"
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectMotif("");
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleRejeter}
                disabled={!rejectMotif.trim()}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Rejeter
              </button>
            </div>
          </motion.div>
        </ModalOverlay>
      )}

      <ConfirmModal
        isOpen={bulkDeleteModal}
        message={`Êtes-vous sûr de vouloir supprimer les ${selection.selectedCount} adhésion(s) sélectionnée(s) ?`}
        confirmLabel={isBulkDeleting ? "Suppression..." : "Supprimer"}
        onCancel={() => setBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
      />

      <AdhesionFormModal />
      <AdhesionDetails />
    </div>
  );
};

export default AdhesionList;
