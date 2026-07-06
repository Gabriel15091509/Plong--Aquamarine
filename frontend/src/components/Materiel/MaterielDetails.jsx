import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiPackage,
  FiTag,
  FiAward,
  FiBox,
  FiMaximize,
  FiActivity,
  FiCalendar,
  FiTool,
  FiMapPin,
  FiEdit,
  FiArrowLeft,
  FiClipboard,
  FiCheckCircle,
  FiClock,
  FiHash,
  FiAlertCircle,
  FiTrash2,
  FiInfo,
  FiFileText,
  FiShield,
  FiDroplet,
  FiAnchor,
} from "react-icons/fi";
import { useMateriels } from "../../hooks/useMateriels";
import LoadingSpinner from "../Common/LoadingSpinner";
import StatusBadge from "../Common/StatusBadge";
import { formatDate } from "../../utils/helpers";

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

const MaterielDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { useGetById, useRemove } = useMateriels();
  const { data, isLoading } = useGetById(id);
  const remove = useRemove();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const materiel = data?.data;

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      toast.success("Matériel supprimé avec succès");
      navigate("/materiels");
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

  if (!materiel) {
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
          Matériel non trouvé
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Le matériel que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <button
          onClick={() => navigate("/materiels")}
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

  const getEtatColor = (etat) => {
    const colors = {
      Neuf: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
      Bon: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      "À réviser":
        "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
      Hors_service:
        "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    };
    return colors[etat] || colors["Bon"];
  };

  const getEtatIcon = (etat) => {
    const icons = {
      Neuf: FiCheckCircle,
      Bon: FiCheckCircle,
      "À réviser": FiClock,
      Hors_service: FiAlertCircle,
    };
    return icons[etat] || FiCheckCircle;
  };

  const getEtatText = (etat) => {
    const texts = {
      Neuf: "Matériel neuf, jamais utilisé",
      Bon: "Matériel en bon état de fonctionnement",
      "À réviser": "Matériel nécessitant une révision",
      Hors_service: "Matériel hors service",
    };
    return texts[etat] || "État inconnu";
  };

  const EtatIcon = getEtatIcon(materiel.etat);

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
            onClick={() => navigate("/materiels")}
            className="group inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-white transition-colors" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                <FiPackage className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {materiel.marque}{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    {materiel.modele}
                  </span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-sm">
                    <FiHash className="w-3.5 h-3.5" />
                    N°{materiel.num_inventaire}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1 text-sm">
                    <FiTag className="w-3.5 h-3.5" />
                    {materiel.categorie}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1 text-sm">
                    <FiMapPin className="w-3.5 h-3.5" />
                    {materiel.localisation}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/materiels/edit/${materiel.num_inventaire}`}
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

      {/* Carte récapitulative - État */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl shadow-xl p-6 md:p-8 border-2 ${getEtatColor(materiel.etat)}`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              État du matériel
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div
                className={`p-3 rounded-full ${
                  materiel.etat === "Neuf" || materiel.etat === "Bon"
                    ? "bg-green-100 dark:bg-green-900/30"
                    : materiel.etat === "À réviser"
                      ? "bg-yellow-100 dark:bg-yellow-900/30"
                      : "bg-red-100 dark:bg-red-900/30"
                }`}
              >
                <EtatIcon
                  className={`w-7 h-7 ${
                    materiel.etat === "Neuf" || materiel.etat === "Bon"
                      ? "text-green-600 dark:text-green-400"
                      : materiel.etat === "À réviser"
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-red-600 dark:text-red-400"
                  }`}
                />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {materiel.etat}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getEtatText(materiel.etat)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8 flex-wrap">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatDate(materiel.date_achat)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date d'achat
              </p>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {materiel.taille || "-"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Taille
              </p>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {materiel.epaisseur || "-"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Épaisseur
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
        {/* Informations générales */}
        <SectionCard title="Informations générales" icon={FiPackage}>
          <InfoItem
            icon={FiHash}
            label="N° Inventaire"
            value={materiel.num_inventaire}
            highlight
          />
          <InfoItem icon={FiTag} label="Catégorie" value={materiel.categorie} />
          <InfoItem icon={FiAward} label="Marque" value={materiel.marque} />
          <InfoItem icon={FiBox} label="Modèle" value={materiel.modele} />
          <InfoItem
            icon={FiMaximize}
            label="Taille"
            value={materiel.taille || "Non renseignée"}
          />
          <InfoItem
            icon={FiActivity}
            label="Épaisseur"
            value={materiel.epaisseur || "Non renseignée"}
          />
          <InfoItem
            icon={FiMapPin}
            label="Localisation"
            value={materiel.localisation}
          />
        </SectionCard>

        {/* Maintenance et entretien */}
        <SectionCard title="Maintenance & entretien" icon={FiTool}>
          <InfoItem
            icon={FiCalendar}
            label="Date d'achat"
            value={formatDate(materiel.date_achat)}
          />
          <InfoItem
            icon={FiCheckCircle}
            label="État"
            value={<StatusBadge status={materiel.etat} />}
          />
          <InfoItem
            icon={FiTool}
            label="Vérification visuelle"
            value={
              materiel.date_verif_visuelle
                ? formatDate(materiel.date_verif_visuelle)
                : "Non effectuée"
            }
          />
          <InfoItem
            icon={FiClipboard}
            label="Révision technique"
            value={
              materiel.date_revision_technique
                ? formatDate(materiel.date_revision_technique)
                : "Non effectuée"
            }
          />
          <InfoItem
            icon={FiClock}
            label="Prochaine échéance"
            value={
              materiel.date_prochaine_echeance
                ? formatDate(materiel.date_prochaine_echeance)
                : "Non définie"
            }
            highlight={
              materiel.date_prochaine_echeance &&
              new Date(materiel.date_prochaine_echeance) < new Date()
            }
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
              Êtes-vous sûr de vouloir supprimer ce matériel{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {materiel.marque} {materiel.modele}
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

export default MaterielDetails;
