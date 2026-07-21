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
  FiAlertCircle,
  FiTrash2,
  FiInfo,
  FiActivity,
  FiBookOpen,
} from "react-icons/fi";
import { useMoniteurs } from "../../hooks/Moniteur/useMoniteurs";
import { useUsers } from "../../hooks/User/useUsers";
import { useSeances } from "../../hooks/Formation/useSeances";
import LoadingSpinner from "../Common/LoadingSpinner";
import StatusBadge from "../Common/StatusBadge";
import { formatDate } from "../../utils/helpers";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
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
      console.error("Delete error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!moniteur) {
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
          Moniteur non trouvé
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Le moniteur que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <button
          onClick={() => navigate("/moniteurs")}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </motion.div>
    );
  }

  const InfoItem = ({ icon: Icon, label, value, highlight = false, children }) => (
    <motion.div
      variants={fadeInUp}
      className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-300 ${
        highlight
          ? "bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-l-4 border-blue-500"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/30"
      }`}
    >
      <div
        className={`mt-0.5 p-2 rounded-lg ${
          highlight
            ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {label}
        </p>
        {children || (
          <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
            {value || "Non défini"}
          </p>
        )}
      </div>
    </motion.div>
  );

  const SectionCard = ({ title, icon: Icon, children, className = "" }) => (
    <motion.div
      variants={fadeInUp}
      className={`bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100/80 dark:border-gray-800/80 p-6 hover:shadow-2xl transition-shadow duration-300 ${className}`}
    >
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
        <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400">
          <Icon className="w-5 h-5" />
        </span>
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </motion.div>
  );

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
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                <FiAward className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5"
          >
            <FiEdit className="w-4 h-4" />
            Modifier
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-xl transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/35 hover:-translate-y-0.5"
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

      {/* Modal suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 25 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                <FiAlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Confirmer la suppression</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer le moniteur{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {user?.name || `#${moniteur.id_moniteur}`}
              </span>
              ?
              <br />
              <span className="text-sm text-red-500 font-medium">
                Cette action est irréversible.
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-xl transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/35"
              >
                <FiTrash2 className="w-4 h-4 inline mr-2" />
                Confirmer la suppression
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default MoniteurDetails;
