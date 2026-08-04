import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiShield,
  FiEdit,
  FiArrowLeft,
  FiHash,
  FiKey,
  FiTrash2,
  FiInfo,
  FiAward,
} from "react-icons/fi";
import { usePresidents } from "../../hooks/President/usePresidents";
import { useMoniteurs } from "../../hooks/Moniteur/useMoniteurs";
import { useUsers } from "../../hooks/User/useUsers";
import LoadingSpinner from "../Common/LoadingSpinner";
import ConfirmModal from "../Common/ConfirmModal";
import SectionCard from "../Common/SectionCard";
import InfoItem from "../Common/InfoItem";
import { formatDate } from "../../utils/helpers";

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

const PresidentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { useGetById, useRemove } = usePresidents();
  const { useGetAll: useGetAllMoniteurs } = useMoniteurs();
  const { useGetAll: useGetAllUsers } = useUsers();
  const { data, isLoading } = useGetById(id);
  const { data: moniteursData } = useGetAllMoniteurs();
  const { data: usersData } = useGetAllUsers();
  const remove = useRemove();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const president = data?.data;
  const moniteur = moniteursData?.data?.find(
    (m) => m.id_moniteur === president?.id_moniteur,
  );
  const user = usersData?.data?.find((u) => u.id === moniteur?.user_id);

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      navigate("/presidents");
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

  if (!president) {
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
          Président non trouvé
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Le président que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <button
          onClick={() => navigate("/presidents")}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </motion.div>
    );
  }

  const acces = toArray(president.acces);

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
              <span className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-900/20">
                <FiShield className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {user?.name || `Président #${president.id_president}`}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-sm">
                    <FiCalendar className="w-3.5 h-3.5" />
                    Président {president.annee_en_poste}
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
            to={`/presidents/edit/${president.id_president}`}
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

        {/* Informations moniteur / mandat */}
        <SectionCard title="Mandat" icon={FiShield}>
          <InfoItem
            icon={FiCalendar}
            label="Année en poste"
            value={president.annee_en_poste}
            highlight
          />
          <InfoItem
            icon={FiHash}
            label="N° Brevet moniteur"
            value={moniteur?.num_brevet}
          />
          <InfoItem
            icon={FiAward}
            label="Date d'obtention du brevet"
            value={
              moniteur?.date_obtention_brevet
                ? formatDate(moniteur.date_obtention_brevet)
                : "Non défini"
            }
          />
        </SectionCard>
      </motion.div>

      {/* Accès / droits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6 md:p-8"
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
          <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400">
            <FiKey className="w-5 h-5" />
          </span>
          Accès et droits
        </h3>
        {acces.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {acces.map((a, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
              >
                <FiKey className="w-3.5 h-3.5" />
                {a}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Aucun accès particulier renseigné
          </p>
        )}
      </motion.div>

      <ConfirmModal
        isOpen={showDeleteModal}
        message={
          <>
            Êtes-vous sûr de vouloir supprimer le président{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {user?.name || `#${president.id_president}`}
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

export default PresidentDetails;
