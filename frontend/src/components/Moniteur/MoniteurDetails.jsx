import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiAward,
  FiEdit,
  FiArrowLeft,
  FiTag,
  FiClock,
  FiHash,
  FiTrash2,
  FiInfo,
  FiActivity,
  FiBookOpen,
} from "react-icons/fi";
import { useMoniteurs } from "../../hooks/Moniteur/useMoniteurs";
import { useUsers } from "../../hooks/User/useUsers";
import { useSeances } from "../../hooks/Formation/useSeances";
import LoadingSpinner from "../Common/LoadingSpinner";
import ConfirmModal from "../Common/ConfirmModal";
import SectionCard from "../Common/SectionCard";
import InfoItem from "../Common/InfoItem";
import StatusBadge from "../Common/StatusBadge";
import { formatDate } from "../../utils/helpers";

const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return [value];
  }
};

const MoniteurDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { useGetById, useRemove } = useMoniteurs();
  const { useGetAll: useGetAllUsers } = useUsers();
  const { useGetEncadrementByMoniteur } = useSeances();
  const { data, isLoading } = useGetById(id);
  const { data: usersData } = useGetAllUsers();
  const { data: encadrementData } = useGetEncadrementByMoniteur(id);
  const remove = useRemove();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const moniteur = data?.data;
  const user = usersData?.data?.find((u) => u.id === moniteur?.user_id);

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      navigate("/moniteurs");
    } catch (error) {
      console.error("Échec de la suppression du moniteur :", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner variant="details" />
      </div>
    );
  }

  if (!moniteur) {
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
          Moniteur non trouvé
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Le moniteur que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <button
          onClick={() => navigate("/moniteurs")}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </motion.div>
    );
  }

  const specialites = toArray(moniteur.specialites);
  const disponibilites = toArray(moniteur.disponibilites);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 px-4"
    >
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-900/20">
                <FiAward className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {user?.name || `Moniteur #${moniteur.id_moniteur}`}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-sm">
                    <FiHash className="w-3.5 h-3.5" />
                    Brevet {moniteur.num_brevet}
                  </span>
                  {user?.email && (
                    <>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="flex items-center gap-1 text-sm">
                        <FiMail className="w-3.5 h-3.5" />
                        {user.email}
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
            to={`/moniteurs/edit/${moniteur.id_moniteur}`}
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

      {/* Grille d'informations */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Informations utilisateur */}
        <SectionCard title="Informations du compte" icon={FiUser}>
          <InfoItem icon={FiUser} label="Nom" value={user?.name} highlight />
          <InfoItem icon={FiMail} label="Email" value={user?.email} />
          <InfoItem icon={FiPhone} label="Téléphone" value={user?.phone} />
        </SectionCard>

        {/* Informations moniteur */}
        <SectionCard title="Informations du brevet" icon={FiAward}>
          <InfoItem
            icon={FiAward}
            label="Niveau"
            value={moniteur.niveau}
            highlight
          />
          <InfoItem icon={FiHash} label="N° Brevet" value={moniteur.num_brevet} />
          <InfoItem
            icon={FiCalendar}
            label="Date d'obtention"
            value={formatDate(moniteur.date_obtention_brevet)}
          />
        </SectionCard>
      </motion.div>

      {/* Encadrement */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 gap-6"
      >
        <SectionCard title="Encadrement" icon={FiActivity}>
          <div className="flex flex-wrap gap-6 p-2 mb-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Heures d&apos;encadrement réalisées
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {encadrementData?.data?.total_heures ?? 0} h
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Séances réalisées
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {encadrementData?.data?.nb_seances_realisees ?? 0}
              </p>
            </div>
          </div>

          {encadrementData?.data?.formations?.length > 0 ? (
            <div className="space-y-2">
              {encadrementData.data.formations.map((f) => (
                <div
                  key={f.id_formation}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FiBookOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {f.niveau_vise}
                    </span>
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                      N°{f.num_adherent}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatDate(f.date_debut)}
                    </span>
                    <StatusBadge status={f.statut} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 p-2">
              Aucune formation encadrée pour le moment
            </p>
          )}
        </SectionCard>
      </motion.div>

      {/* Spécialités et disponibilités */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <SectionCard title="Spécialités d'encadrement" icon={FiTag}>
          {specialites.length > 0 ? (
            <div className="flex flex-wrap gap-2 p-2">
              {specialites.map((s, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                >
                  <FiTag className="w-3.5 h-3.5" />
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 p-2">
              Aucune spécialité d&apos;encadrement renseignée
            </p>
          )}
        </SectionCard>

        <SectionCard title="Disponibilités" icon={FiClock}>
          {disponibilites.length > 0 ? (
            <div className="flex flex-wrap gap-2 p-2">
              {disponibilites.map((d, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                >
                  <FiClock className="w-3.5 h-3.5" />
                  {d}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 p-2">
              Aucune disponibilité renseignée
            </p>
          )}
        </SectionCard>
      </motion.div>

      <ConfirmModal
        isOpen={showDeleteModal}
        message={
          <>
            Êtes-vous sûr de vouloir supprimer le moniteur{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {user?.name || `#${moniteur.id_moniteur}`}
            </span>
            ?
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </motion.div>
  );
};

export default MoniteurDetails;
