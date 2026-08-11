import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiDollarSign,
  FiEdit,
  FiArrowLeft,
  FiTrash2,
  FiInfo,
} from "react-icons/fi";
import { useTresoriers } from "../../hooks/Tresorier/useTresoriers";
import { useUsers } from "../../hooks/User/useUsers";
import LoadingSpinner from "../Common/LoadingSpinner";
import ConfirmModal from "../Common/ConfirmModal";
import SectionCard from "../Common/SectionCard";
import InfoItem from "../Common/InfoItem";

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

const TresorierDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { useGetById, useRemove } = useTresoriers();
  const { useGetAll: useGetAllUsers } = useUsers();
  const { data, isLoading } = useGetById(id);
  const { data: usersData } = useGetAllUsers();
  const remove = useRemove();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const tresorier = data?.data;
  const user = usersData?.data?.find((u) => u.id === tresorier?.user_id);

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      navigate("/tresoriers");
    } catch (error) {
      console.error("Échec de la suppression du trésorier :", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!tresorier) {
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
          Trésorier non trouvé
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Le trésorier que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <button
          onClick={() => navigate("/tresoriers")}
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
                <FiDollarSign className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {user?.name || `Trésorier #${tresorier.id_tresorier}`}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                  {tresorier.annee_en_poste && (
                    <span className="flex items-center gap-1 text-sm">
                      <FiCalendar className="w-3.5 h-3.5" />
                      Trésorier {tresorier.annee_en_poste}
                    </span>
                  )}
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
            to={`/tresoriers/edit/${tresorier.id_tresorier}`}
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

        {/* Informations mandat */}
        <SectionCard title="Mandat" icon={FiDollarSign}>
          <InfoItem
            icon={FiCalendar}
            label="Année en poste"
            value={tresorier.annee_en_poste || "Non renseignée"}
            highlight
          />
        </SectionCard>
      </motion.div>

      <ConfirmModal
        isOpen={showDeleteModal}
        message={
          <>
            Êtes-vous sûr de vouloir supprimer le trésorier{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {user?.name || `#${tresorier.id_tresorier}`}
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

export default TresorierDetails;
