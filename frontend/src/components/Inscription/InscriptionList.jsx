import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { FiPlus, FiClipboard, FiX } from "react-icons/fi";
import LoadingSpinner from "../Common/LoadingSpinner";
import ConfirmModal from "../Common/ConfirmModal";
import InscriptionRow from "./InscriptionRow";
import InscriptionActionModals from "./InscriptionActionModals";
import { useInscriptions } from "../../hooks/Inscription/useInscriptions";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useAuth } from "../../context/AuthContext";
import { STATUT_INSCRIPTION } from "../../utils/constants";

// TODO: Ajouter un filtre par date de sortie
const InscriptionList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [filterSortie, setFilterSortie] = useState("all");
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [waitlistModal, setWaitlistModal] = useState(null);
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

  const { data, isLoading, error, refetch } = useGetAll();
  const { data: adherentsData, isLoading: loadingAdherents } =
    useGetAllAdherents();
  const { data: sortiesData, isLoading: loadingSorties } = useGetAllSorties();

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

  // Pagination
  const totalPages = Math.ceil(filteredInscriptions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInscriptions = useMemo(() => {
    return filteredInscriptions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInscriptions, startIndex, itemsPerPage]);

  if (isLoading || loadingAdherents || loadingSorties)
    return <LoadingSpinner variant="list" />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  // Actions
  const handleDelete = async (id) => {
    if (!isAdmin) {
      toast.error("Vous n'avez pas les droits pour supprimer une inscription");
      return;
    }
    setLoading(true);
    try {
      await remove.mutateAsync(id);
      toast.success("Inscription supprimée avec succès");
      refetch();
      setDeleteModal(null);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de la suppression",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    if (!isAdmin) {
      toast.error("Seul un gestionnaire peut confirmer");
      return;
    }
    setLoading(true);
    try {
      await confirm.mutateAsync(id);
      toast.success("Inscription confirmée avec succès");
      refetch();
      setConfirmModal(null);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de la confirmation",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    setLoading(true);
    try {
      await cancel.mutateAsync(id);
      toast.success("Inscription annulée avec succès");
      refetch();
      setCancelModal(null);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de l'annulation",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleWaitlist = async (id) => {
    if (!isAdmin) {
      toast.error("Seul un gestionnaire peut gérer la liste d'attente");
      return;
    }
    setLoading(true);
    try {
      await updateInscription.mutateAsync({
        id,
        data: { statut: "Liste d'attente" },
      });
      toast.success("Inscription ajoutée à la liste d'attente");
      refetch();
      setWaitlistModal(null);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la mise en liste d'attente",
      );
    } finally {
      setLoading(false);
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
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
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
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tous</option>
            <option value="En attente">En attente</option>
            <option value="Confirmée">Confirmées</option>
            <option value="Annulée">Annulées</option>
            <option value="Liste d'attente">Liste d'attente</option>
          </select>

          <select
            value={filterSortie}
            onChange={(e) => {
              setFilterSortie(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            {sortieOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Link
            to="/inscriptions/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            {isAdherent ? "M'inscrire" : "Nouvelle"}
          </Link>
        </div>
      </div>

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
            className="grid gap-3"
          >
            {paginatedInscriptions.map((inscription) => {
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

              return (
                <InscriptionRow
                  key={inscription.id_inscription}
                  inscription={inscription}
                  adherentInfo={adherentInfo}
                  sortieInfo={sortieInfo}
                  capacityInfo={capacityInfo}
                  isAdmin={isAdmin}
                  isOwnInscription={isOwnInscription}
                  loading={loading}
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
                />
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

      {/* Modal Suppression */}
      <ConfirmModal
        isOpen={!!deleteModal}
        message="Êtes-vous sûr de vouloir supprimer cette inscription ?"
        onCancel={() => setDeleteModal(null)}
        onConfirm={() => handleDelete(deleteModal)}
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
    </div>
  );
};

export default InscriptionList;