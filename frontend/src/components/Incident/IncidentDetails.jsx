import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiAlertTriangle,
  FiCalendar,
  FiEdit,
  FiArrowLeft,
  FiTag,
  FiFileText,
  FiTrash2,
  FiCheckCircle,
  FiInfo,
  FiTool,
  FiUser,
} from "react-icons/fi";
import { useIncidents } from "../../hooks/Incident/useIncidents";
import { useSorties } from "../../hooks/Sortie/useSorties";
import LoadingSpinner from "../Common/LoadingSpinner";
import ConfirmModal from "../Common/ConfirmModal";
import SectionCard from "../Common/SectionCard";
import InfoItem from "../Common/InfoItem";
import { formatDateTime } from "../../utils/helpers";

const IncidentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
      navigate("/incidents");
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner variant="details" />
      </div>
    );
  }

  if (!incident) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800/50 mb-6">
          <FiInfo className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          Incident non trouvé
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          L'incident que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <button
          onClick={() => navigate("/incidents")}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 px-4"
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20">
                <FiAlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Incident{" "}
                  <span className="text-red-600 dark:text-red-400">
                    {incident.type}
                  </span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-sm">
                    <FiFileText className="w-3.5 h-3.5" />
                    N°{incident.id_incident}
                  </span>
                  {sortie && (
                    <>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="flex items-center gap-1 text-sm">
                        {sortie.type} - {sortie.lieu}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/incidents/edit/${incident.id_incident}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150"
          >
            <FiEdit className="w-4 h-4" />
            Modifier
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors duration-150"
          >
            <FiTrash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </motion.div>

      {/* Carte de statut */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl shadow-sm p-6 md:p-8 border-2 ${
          incident.cloture
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-full ${
                incident.cloture
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              {incident.cloture ? (
                <FiCheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
              ) : (
                <FiAlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {incident.cloture ? "Clôturé" : "Non clôturé"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {incident.cloture
                  ? `Clôturé le ${formatDateTime(incident.date_cloture)}`
                  : "Cet incident nécessite un suivi"}
              </p>
            </div>
          </div>
          {!incident.cloture && (
            <button
              onClick={() => setShowClotureForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors duration-150"
            >
              <FiCheckCircle className="w-4 h-4" />
              Clôturer l'incident
            </button>
          )}
        </div>
      </motion.div>

      {showClotureForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            Clôturer l'incident
          </h3>
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
              className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleCloturer}
              disabled={cloturer.isPending}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-60"
            >
              Confirmer la clôture
            </button>
          </div>
        </motion.div>
      )}

      {/* Informations */}
      <SectionCard title="Détails de l'incident" icon={FiInfo}>
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
      </SectionCard>

      <ConfirmModal
        isOpen={showDeleteModal}
        message="Êtes-vous sûr de vouloir supprimer cet incident ?"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </motion.div>
  );
};

export default IncidentDetails;
