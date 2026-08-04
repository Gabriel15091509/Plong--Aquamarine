import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiTool,
  FiCalendar,
  FiEdit,
  FiArrowLeft,
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
import LoadingSpinner from "../Common/LoadingSpinner";
import ConfirmModal from "../Common/ConfirmModal";
import SectionCard from "../Common/SectionCard";
import { formatDate, formatCurrency, formatDateForInput } from "../../utils/helpers";

const ReparationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
      navigate("/reparations");
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!reparation) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800/50 mb-6">
          <FiInfo className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          Réparation non trouvée
        </h3>
        <button
          onClick={() => navigate("/reparations")}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </motion.div>
    );
  }

  const isEnCours = !reparation.date_retour;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 px-4"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-900/20">
              <FiTool className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </span>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Réparation N°{reparation.id_reparation}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                {materiel
                  ? `${materiel.marque} ${materiel.modele}`
                  : `Matériel #${reparation.num_inventaire}`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/reparations/edit/${reparation.id_reparation}`}
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl shadow-sm p-6 md:p-8 border-2 ${
          isEnCours
            ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
            : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-full ${
                isEnCours
                  ? "bg-amber-100 dark:bg-amber-900/30"
                  : "bg-green-100 dark:bg-green-900/30"
              }`}
            >
              {isEnCours ? (
                <FiClock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              ) : (
                <FiCheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEnCours ? "En cours" : "Terminée"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isEnCours
                  ? `Constatée le ${formatDate(reparation.date_constat)}`
                  : `Retournée le ${formatDate(reparation.date_retour)}`}
              </p>
            </div>
          </div>
          {isEnCours && (
            <button
              onClick={() => setShowTerminerForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors duration-150"
            >
              <FiCheckCircle className="w-4 h-4" />
              Terminer la réparation
            </button>
          )}
        </div>
      </motion.div>

      {showTerminerForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            Terminer la réparation
          </h3>
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
              className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleTerminer}
              disabled={terminer.isPending}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-60"
            >
              Confirmer
            </button>
          </div>
        </motion.div>
      )}

      <SectionCard title="Détails" icon={FiInfo}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
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
      </SectionCard>

      <ConfirmModal
        isOpen={showDeleteModal}
        message="Êtes-vous sûr de vouloir supprimer cette réparation ?"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </motion.div>
  );
};

export default ReparationDetails;
