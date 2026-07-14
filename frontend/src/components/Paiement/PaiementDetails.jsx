import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiUser,
  FiDollarSign,
  FiCreditCard,
  FiFileText,
  FiHash,
  FiEdit,
  FiArrowLeft,
  FiClock,
  FiAlertCircle,
  FiTrash2,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiTrendingUp,
  FiAward,
  FiDownload,
} from "react-icons/fi";
import { usePaiements } from "../../hooks/usePaiements";
import { useAdherents } from "../../hooks/useAdherents";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../Common/LoadingSpinner";
import StatusBadge from "../Common/StatusBadge";
import { formatDate, formatCurrency } from "../../utils/helpers";
import paiementService from "../../services/paiementService";

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

const PaiementDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canManagePaiement = hasRole(["president", "tresorier"]);
  const { useGetById, useRemove } = usePaiements();
  const { useGetAll } = useAdherents();
  const { data, isLoading } = useGetById(id);
  const { data: adherentsData } = useGetAll();
  const remove = useRemove();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const paiement = data?.data;
  const adherent = adherentsData?.data?.find(
    (a) => a.num_adherent === paiement?.num_adherent,
  );

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      navigate("/paiements");
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleDownloadRecu = async () => {
    setDownloading(true);
    try {
      await paiementService.downloadRecu(id);
    } catch (error) {
      toast.error("Erreur lors du téléchargement du reçu");
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!paiement) {
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
          Paiement non trouvé
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Le paiement que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <button
          onClick={() => navigate("/paiements")}
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

  const getStatutColor = (statut) => {
    const colors = {
      Confirmé:
        "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      "En attente":
        "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
      Annulé: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      Remboursé:
        "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    };
    return colors[statut] || colors["En attente"];
  };

  const getStatutIcon = (statut) => {
    const icons = {
      Confirmé: FiCheckCircle,
      "En attente": FiClock,
      Annulé: FiXCircle,
      Remboursé: FiTrendingUp,
    };
    return icons[statut] || FiClock;
  };

  const getStatutText = (statut) => {
    const texts = {
      Confirmé: "Le paiement a été confirmé avec succès",
      "En attente": "Le paiement est en attente de validation",
      Annulé: "Le paiement a été annulé",
      Remboursé: "Le paiement a été remboursé",
    };
    return texts[statut] || "Statut inconnu";
  };

  const StatutIcon = getStatutIcon(paiement.statut);

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
              <span className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                <FiCreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Paiement{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    {paiement.type_paiement}
                  </span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-sm">
                    <FiFileText className="w-3.5 h-3.5" />
                    N°{paiement.id_paiement}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1 text-sm">
                    <FiCreditCard className="w-3.5 h-3.5" />
                    {paiement.mode}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1 text-sm">
                    <FiUser className="w-3.5 h-3.5" />
                    {adherent
                      ? `${adherent.nom} ${adherent.prenom}`
                      : `N°${paiement.num_adherent}`}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleDownloadRecu}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-all duration-300 disabled:opacity-60"
          >
            <FiDownload className="w-4 h-4" />
            Télécharger le reçu
          </button>
        </div>
        {canManagePaiement && (
        <div className="flex gap-2">
          <Link
            to={`/paiements/edit/${paiement.id_paiement}`}
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
        )}
      </motion.div>

      {/* Carte récapitulative */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl shadow-xl p-6 md:p-8 border-2 ${getStatutColor(paiement.statut)}`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Statut du paiement
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div
                className={`p-3 rounded-full ${
                  paiement.statut === "Confirmé"
                    ? "bg-green-100 dark:bg-green-900/30"
                    : paiement.statut === "Annulé"
                      ? "bg-red-100 dark:bg-red-900/30"
                      : paiement.statut === "Remboursé"
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : "bg-yellow-100 dark:bg-yellow-900/30"
                }`}
              >
                <StatutIcon
                  className={`w-7 h-7 ${
                    paiement.statut === "Confirmé"
                      ? "text-green-600 dark:text-green-400"
                      : paiement.statut === "Annulé"
                        ? "text-red-600 dark:text-red-400"
                        : paiement.statut === "Remboursé"
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-yellow-600 dark:text-yellow-400"
                  }`}
                />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {paiement.statut}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getStatutText(paiement.statut)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8 flex-wrap">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(paiement.montant)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Montant
              </p>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {paiement.mode}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Mode
              </p>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatDate(paiement.created_at)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
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
                N°{paiement.num_adherent}
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

        {/* Informations paiement */}
        <SectionCard title="Informations paiement" icon={FiCreditCard}>
          <InfoItem
            icon={FiDollarSign}
            label="Montant"
            value={formatCurrency(paiement.montant)}
            highlight
          />
          <InfoItem
            icon={FiCreditCard}
            label="Mode de paiement"
            value={paiement.mode}
          />
          <InfoItem
            icon={FiFileText}
            label="Type de paiement"
            value={paiement.type_paiement}
          />
          <InfoItem
            icon={FiClock}
            label="Statut"
            value={<StatusBadge status={paiement.statut} />}
          />
          <InfoItem
            icon={FiHash}
            label="Référence"
            value={paiement.reference_id || "Non renseignée"}
          />
          <InfoItem
            icon={FiFileText}
            label="Description"
            value={paiement.description || "Non renseignée"}
          />
          <InfoItem
            icon={FiCalendar}
            label="Date du paiement"
            value={formatDate(paiement.created_at)}
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
              Êtes-vous sûr de vouloir supprimer ce paiement{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {paiement.type_paiement}
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

export default PaiementDetails;
