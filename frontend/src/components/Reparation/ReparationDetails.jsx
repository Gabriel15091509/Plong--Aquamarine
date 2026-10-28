import React, { useState } from "react";
import ModalLink from "../Common/ModalLink";
import {
  FiTool,
  FiCalendar,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiClock,
  FiInfo,
  FiDollarSign,
  FiUser,
  FiFileText,
} from "react-icons/fi";
import { useReparations } from "../../hooks/Reparation/useReparations";
import { useMateriels } from "../../hooks/Materiel/useMateriels";
import { useDetailsModal } from "../../hooks/useFormModal";
import DetailsModal from "../Common/DetailsModal";
import LoadingSpinner from "../Common/LoadingSpinner";
import ConfirmModal from "../Common/ConfirmModal";
import { formatDate, formatCurrency, formatDateForInput } from "../../utils/helpers";

// Fiche réparation, modale par-dessus la liste (voir MoniteurDetails.jsx
// pour le prototype d'origine et DetailsModal.jsx pour la coquille commune).
// Une seule page : peu d'informations, pas besoin de pagination
// (DetailsModal la masque d'elle-même quand pages.length <= 1).
const ReparationDetails = () => {
  const modal = useDetailsModal("/reparations");
  const { id } = modal;
  const { useGetById, useRemove, useTerminer } = useReparations();
  const { useGetById: useGetMateriel } = useMateriels();
  const { data, isLoading } = useGetById(id);
  const remove = useRemove();
  const terminer = useTerminer();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTerminerForm, setShowTerminerForm] = useState(false);
  const [dateRetour, setDateRetour] = useState(formatDateForInput(new Date()));

  const reparation = data?.data;
  const { data: materielData } = useGetMateriel(reparation?.num_inventaire);
  const materiel = materielData?.data;

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      setShowDeleteModal(false);
      modal.close();
    } catch (error) {
      // toast déjà géré par le hook useRemove
    }
  };

  const handleTerminer = async () => {
    try {
      await terminer.mutateAsync({ id, data: { date_retour: dateRetour } });
      setShowTerminerForm(false);
    } catch (error) {
      // toast déjà géré par le hook useTerminer
    }
  };

  const headerExtra = reparation && (
    <>
      <ModalLink
        to={`/reparations/edit/${reparation.id_reparation}`}
        className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
        title="Modifier"
      >
        <FiEdit className="w-4 h-4" />
      </ModalLink>
      <button
        type="button"
        onClick={() => setShowDeleteModal(true)}
        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
        title="Supprimer"
      >
        <FiTrash2 className="w-4 h-4" />
      </button>
    </>
  );

  if (isLoading || !reparation) {
    return (
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={isLoading ? "Chargement…" : "Réparation non trouvée"}
        icon={FiTool}
        pages={[
          {
            label: "",
            content: isLoading ? (
              <div className="flex items-center justify-center py-10">
                <LoadingSpinner variant="details" />
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">
                La réparation que vous recherchez n&apos;existe pas ou a été
                supprimée.
              </p>
            ),
          },
        ]}
      />
    );
  }

  const isEnCours = !reparation.date_retour;

  const pages = [
    {
      label: "Détails",
      icon: FiInfo,
      content: (
        <div className="space-y-4">
          <div
            className={`rounded-xl p-3 border flex items-center justify-between gap-3 flex-wrap ${
              isEnCours
                ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  isEnCours
                    ? "bg-amber-100 dark:bg-amber-900/30"
                    : "bg-green-100 dark:bg-green-900/30"
                }`}
              >
                {isEnCours ? (
                  <FiClock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                ) : (
                  <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">
                  {isEnCours ? "En cours" : "Terminée"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isEnCours
                    ? `Constatée le ${formatDate(reparation.date_constat)}`
                    : `Retournée le ${formatDate(reparation.date_retour)}`}
                </p>
              </div>
            </div>
            {isEnCours && (
              <button
                onClick={() => setShowTerminerForm((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors duration-150"
              >
                <FiCheckCircle className="w-4 h-4" />
                Terminer la réparation
              </button>
            )}
          </div>

          {showTerminerForm && (
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Date de retour
              </label>
              <input
                type="date"
                value={dateRetour}
                onChange={(e) => setDateRetour(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowTerminerForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleTerminer}
                  disabled={terminer.isPending}
                  className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-60"
                >
                  Confirmer
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <FiCalendar className="text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">Date de constat :</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatDate(reparation.date_constat)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FiUser className="text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">Prestataire :</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {reparation.prestataire}
              </span>
            </div>
            {reparation.cout && (
              <div className="flex items-center gap-2">
                <FiDollarSign className="text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">Coût :</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(reparation.cout)}
                </span>
              </div>
            )}
            {reparation.date_retour && (
              <div className="flex items-center gap-2">
                <FiCalendar className="text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">Date de retour :</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatDate(reparation.date_retour)}
                </span>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1 flex items-center gap-2">
              <FiFileText className="w-3.5 h-3.5" />
              Description de la panne
            </p>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {reparation.description_panne}
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={`Réparation N°${reparation.id_reparation}`}
        subtitle={
          materiel
            ? `${materiel.marque} ${materiel.modele}`
            : `Matériel #${reparation.num_inventaire}`
        }
        icon={FiTool}
        headerExtra={headerExtra}
        pages={pages}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        message="Êtes-vous sûr de vouloir supprimer cette réparation ?"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};

export default ReparationDetails;
