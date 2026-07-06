import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiUser,
  FiCalendar,
  FiDroplet,
  FiClock,
  FiThermometer,
  FiEye,
  FiTag,
  FiImage,
  FiFileText,
  FiCheckCircle,
  FiEdit,
  FiArrowLeft,
  FiActivity,
  FiAlertCircle,
  FiTrash2,
  FiInfo,
  FiAward,
  FiAnchor,
  FiMapPin,
} from "react-icons/fi";
import { usePlongees } from "../../hooks/usePlongees";
import { useAdherents } from "../../hooks/useAdherents";
import LoadingSpinner from "../Common/LoadingSpinner";
import StatusBadge from "../Common/StatusBadge";
import { formatDate, formatDateTime } from "../../utils/helpers";

// Animations
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

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.4, ease: "easeOut" },
};

const PlongeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { useGetById, useRemove } = usePlongees();
  const { useGetAll } = useAdherents();
  const { data, isLoading } = useGetById(id);
  const { data: adherentsData } = useGetAll();
  const remove = useRemove();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const plongee = data?.data;
  const adherent = adherentsData?.data?.find(
    (a) => a.num_adherent === plongee?.num_adherent,
  );

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      toast.success("Plongée supprimée avec succès");
      navigate("/plongees");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!plongee) {
    return (
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        className="text-center py-16"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800/50 mb-6">
          <FiInfo className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          Plongée non trouvée
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          La plongée que vous recherchez n'existe pas ou a été supprimée.
        </p>
        <button
          onClick={() => navigate("/plongees")}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </motion.div>
    );
  }

  const InfoItem = ({
    icon: Icon,
    label,
    value,
    highlight = false,
    children,
  }) => (
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

  const isValide = plongee.valide_moniteur;

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
          <button
            onClick={() => navigate("/plongees")}
            className="group inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-white transition-colors" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                <FiActivity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Plongée du{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    {formatDate(plongee.date)}
                  </span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-sm">
                    <FiFileText className="w-3.5 h-3.5" />
                    N°{plongee.id_plongee}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1 text-sm">
                    <FiTag className="w-3.5 h-3.5" />
                    {plongee.type_plongee}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1 text-sm">
                    <FiUser className="w-3.5 h-3.5" />
                    {adherent
                      ? `${adherent.nom} ${adherent.prenom}`
                      : `N°${plongee.num_adherent}`}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/plongees/edit/${plongee.id_plongee}`}
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

      {/* Carte récapitulative */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl shadow-xl p-6 md:p-8 border-2 ${
          isValide
            ? "bg-gradient-to-r from-emerald-500 to-green-600 dark:from-emerald-700 dark:to-green-800"
            : "bg-gradient-to-r from-yellow-500 to-amber-600 dark:from-yellow-700 dark:to-amber-800"
        } text-white`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-white/80 uppercase tracking-wider">
              Statut de la plongée
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className="p-3 rounded-full bg-white/20">
                {isValide ? (
                  <FiCheckCircle className="w-7 h-7" />
                ) : (
                  <FiClock className="w-7 h-7" />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {isValide ? "✅ Validée" : "⏳ En attente"}
                </p>
                <p className="text-sm text-white/80">
                  {isValide
                    ? "Plongée validée par le moniteur"
                    : "En attente de validation par le moniteur"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8 flex-wrap">
            <div className="text-center">
              <p className="text-3xl font-bold">{plongee.profondeur_max}m</p>
              <p className="text-xs text-white/70 uppercase tracking-wider">
                Profondeur max
              </p>
            </div>
            <div className="w-px h-12 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <p className="text-3xl font-bold">{plongee.duree} min</p>
              <p className="text-xs text-white/70 uppercase tracking-wider">
                Durée
              </p>
            </div>
            <div className="w-px h-12 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <p className="text-3xl font-bold">{plongee.type_plongee}</p>
              <p className="text-xs text-white/70 uppercase tracking-wider">
                Type
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grille d'informations */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Informations adhérent */}
        <SectionCard title="Informations adhérent" icon={FiUser}>
          <InfoItem icon={FiUser} label="Adhérent" highlight>
            {adherent ? (
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {adherent.civilite} {adherent.nom} {adherent.prenom}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  N°{adherent.num_adherent}
                </p>
              </div>
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">
                N°{plongee.num_adherent}
              </p>
            )}
          </InfoItem>
          {adherent && (
            <>
              <InfoItem
                icon={FiAward}
                label="Niveau"
                value={adherent.niveau || "Non défini"}
              />
              <InfoItem
                icon={FiCalendar}
                label="Date d'adhésion"
                value={formatDate(adherent.date_adhesion)}
              />
            </>
          )}
        </SectionCard>

        {/* Informations plongée */}
        <SectionCard title="Informations plongée" icon={FiActivity}>
          <InfoItem
            icon={FiCalendar}
            label="Date"
            value={formatDate(plongee.date)}
            highlight
          />
          <InfoItem
            icon={FiDroplet}
            label="Profondeur max"
            value={`${plongee.profondeur_max} mètres`}
          />
          <InfoItem
            icon={FiClock}
            label="Durée"
            value={`${plongee.duree} minutes`}
          />
          <InfoItem
            icon={FiThermometer}
            label="Température de l'eau"
            value={
              plongee.temperature_eau
                ? `${plongee.temperature_eau}°C`
                : "Non renseignée"
            }
          />
          <InfoItem
            icon={FiEye}
            label="Visibilité"
            value={plongee.visibilite || "Non renseignée"}
          />
          <InfoItem
            icon={FiTag}
            label="Type de plongée"
            value={plongee.type_plongee}
          />
          <InfoItem
            icon={isValide ? FiCheckCircle : FiClock}
            label="Validation moniteur"
            value={isValide ? "✅ Validée" : "⏳ En attente"}
          />
          {plongee.lien_photos && (
            <InfoItem
              icon={FiImage}
              label="Photos"
              value={
                <a
                  href={plongee.lien_photos}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  📸 Voir les photos
                </a>
              }
            />
          )}
        </SectionCard>
      </motion.div>

      {/* Observations */}
      {plongee.observations_faune && (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100/80 dark:border-gray-800/80 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400">
              <FiFileText className="w-5 h-5" />
            </span>
            Observations
          </h3>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {plongee.observations_faune}
            </p>
          </div>
        </motion.div>
      )}

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
              Êtes-vous sûr de vouloir supprimer cette plongée du{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatDate(plongee.date)}
              </span>
              ?
              <br />
              <span className="text-sm text-red-500 font-medium">
                ⚠️ Cette action est irréversible.
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

export default PlongeeDetails;
