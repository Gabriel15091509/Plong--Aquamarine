import React, { useState } from "react";
import ModalLink from "../Common/ModalLink";
import {
  FiAlertTriangle,
  FiCalendar,
  FiEdit,
  FiTag,
  FiFileText,
  FiTrash2,
  FiCheckCircle,
  FiTool,
  FiUser,
} from "react-icons/fi";
import { useIncidents } from "../../hooks/Incident/useIncidents";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useDetailsModal } from "../../hooks/useFormModal";
import DetailsModal from "../Common/DetailsModal";
import LoadingSpinner from "../Common/LoadingSpinner";
import ConfirmModal from "../Common/ConfirmModal";
import InfoItem from "../Common/InfoItem";
import { formatDateTime } from "../../utils/helpers";

// Fiche incident, modale par-dessus la liste (voir MoniteurDetails.jsx pour
// le prototype d'origine et DetailsModal.jsx pour la coquille commune). Une
// seule page : peu d'informations, pas besoin de pagination.
const IncidentDetails = () => {
  const modal = useDetailsModal("/incidents");
  const { id } = modal;
  const { useGetById, useRemove, useCloturer } = useIncidents();
  const { useGetById: useGetSortie } = useSorties();
  const { data, isLoading } = useGetById(id);
  const remove = useRemove();
  const cloturer = useCloturer();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mesuresCloture, setMesuresCloture] = useState("");
  const [showClotureForm, setShowClotureForm] = useState(false);

  const incident = data?.data;
  const { data: sortieData } = useGetSortie(incident?.id_sortie);
  const sortie = sortieData?.data;

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      setShowDeleteModal(false);
      modal.close();
    } catch (error) {
      // toast déjà géré par le hook useRemove
    }
  };

  const handleCloturer = async () => {
    try {
      await cloturer.mutateAsync({
        id,
        data: mesuresCloture ? { mesures_prises: mesuresCloture } : {},
      });
      setShowClotureForm(false);
    } catch (error) {
      // toast déjà géré par le hook useCloturer
    }
  };

  const headerExtra = incident && (
    <>
      <ModalLink
        to={`/incidents/edit/${incident.id_incident}`}
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

  if (isLoading || !incident) {
    return (
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={isLoading ? "Chargement…" : "Incident non trouvé"}
        icon={FiAlertTriangle}
        pages={[
          {
            label: "",
            content: isLoading ? (
              <div className="flex items-center justify-center py-10">
                <LoadingSpinner variant="details" />
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">
                L&apos;incident que vous recherchez n&apos;existe pas ou a été
                supprimé.
              </p>
            ),
          },
        ]}
      />
    );
  }

  const pages = [
    {
      label: "Détails",
      icon: FiAlertTriangle,
      content: (
        <div className="space-y-4">
          {/* Bandeau statut, compact */}
          <div
            className={`rounded-xl p-3 border flex items-center justify-between gap-3 flex-wrap ${
              incident.cloture
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  incident.cloture
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-red-100 dark:bg-red-900/30"
                }`}
              >
                {incident.cloture ? (
                  <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <FiAlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">
                  {incident.cloture ? "Clôturé" : "Non clôturé"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {incident.cloture
                    ? `Clôturé le ${formatDateTime(incident.date_cloture)}`
                    : "Cet incident nécessite un suivi"}
                </p>
              </div>
            </div>
            {!incident.cloture && (
              <button
                onClick={() => setShowClotureForm((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors duration-150"
              >
                <FiCheckCircle className="w-4 h-4" />
                Clôturer l&apos;incident
              </button>
            )}
          </div>

          {showClotureForm && (
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
              <textarea
                value={mesuresCloture}
                onChange={(e) => setMesuresCloture(e.target.value)}
                rows={3}
                placeholder="Mesures prises pour clôturer (optionnel)..."
                className="w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowClotureForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCloturer}
                  disabled={cloturer.isPending}
                  className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-60"
                >
                  Confirmer la clôture
                </button>
              </div>
            </div>
          )}

          <InfoItem icon={FiTag} label="Type" value={incident.type} highlight />
          <InfoItem
            icon={FiCalendar}
            label="Date et heure"
            value={formatDateTime(incident.date_heure)}
          />
          {sortie && (
            <InfoItem
              icon={FiFileText}
              label="Sortie concernée"
              value={`${sortie.type} - ${sortie.lieu}`}
            />
          )}
          {incident.declared_by && (
            <InfoItem
              icon={FiUser}
              label="Déclaré par"
              value={incident.declared_by}
            />
          )}
          <InfoItem icon={FiFileText} label="Description">
            <p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-line">
              {incident.description}
            </p>
          </InfoItem>
          {incident.mesures_prises && (
            <InfoItem icon={FiTool} label="Mesures prises">
              <p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-line">
                {incident.mesures_prises}
              </p>
            </InfoItem>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={`Incident ${incident.type}`}
        subtitle={sortie ? `${sortie.type} - ${sortie.lieu}` : `N°${incident.id_incident}`}
        icon={FiAlertTriangle}
        iconColor="red"
        headerExtra={headerExtra}
        pages={pages}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        message="Êtes-vous sûr de vouloir supprimer cet incident ?"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};

export default IncidentDetails;
