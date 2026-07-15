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
  FiAlertCircle,
  FiTrash2,
  FiInfo,
} from "react-icons/fi";
import { useTresoriers } from "../../hooks/Tresorier/useTresoriers";
import { useUsers } from "../../hooks/User/useUsers";
import LoadingSpinner from "../Common/LoadingSpinner";

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

  if (!tresorier) {
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
          Trésorier non trouvé
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Le trésorier que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <button
          onClick={() => navigate("/tresoriers")}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35"
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
          ? "bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 border-l-4 border-emerald-500"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/30"
      }`}
    >
      <div
        className={`mt-0.5 p-2 rounded-lg ${
          highlight
            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
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
        <span className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400">
          <Icon className="w-5 h-5" />
        </span>
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-6xl mx-auto px-4"
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
              <span className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
                <FiDollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
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
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 hover:-translate-y-0.5"
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
              Êtes-vous sûr de vouloir supprimer le trésorier{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {user?.name || `#${tresorier.id_tresorier}`}
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

export default TresorierDetails;
