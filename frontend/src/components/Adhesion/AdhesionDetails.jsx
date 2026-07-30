import React, { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiCreditCard,
  FiEdit,
  FiArrowLeft,
  FiTag,
  FiClock,
  FiHash,
  FiAlertCircle,
  FiTrash2,
  FiCheckCircle,
  FiFileText,
  FiInfo,
  FiTrendingUp,
  FiAward,
  FiPaperclip,
  FiDownload,
  FiPlusCircle,
} from "react-icons/fi";
import { useAdhesions } from "../../hooks/Adhesion/useAdhesions";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";
import StatusBadge from "../Common/StatusBadge";
import EcheancierCard from "../Echeancier/EcheancierCard";
import { formatDate, formatCurrency } from "../../utils/helpers";
import adhesionService from "../../services/Adhesion/adhesionService";
import { MODE_PAIEMENT_OPTIONS } from "../../utils/constants";

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

const AdhesionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canManageAdhesion = hasRole(["president", "tresorier"]);
  const { useGetById, useRemove, useEnregistrerPaiement } = useAdhesions();
  // Seule l'adhésion "Club" a un tarif/paiement suivi dans l'app : la
  // licence FFESM et les assurances sont couvertes par cette cotisation.
  const { useGetAll } = useAdherents();
  const { data, isLoading } = useGetById(id);
  const { data: adherentsData } = useGetAll();
  const remove = useRemove();
  const enregistrerPaiement = useEnregistrerPaiement();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [paiementForm, setPaiementForm] = useState({
    montant: "",
    mode: "Espèces",
  });
  const [downloading, setDownloading] = useState(false);
  // Meme garde-fou que PaiementForm.jsx : sans lui, un double-clic sur
  // "Enregistrer" envoie deux mutations avant que le re-render (asynchrone)
  // ne desactive le bouton, ce qui cree deux paiements lies a l'adhesion.
  const submittingPaiementRef = useRef(false);

  const handleEnregistrerPaiement = async (e) => {
    e.preventDefault();
    if (submittingPaiementRef.current) return;
    submittingPaiementRef.current = true;
    try {
      await enregistrerPaiement.mutateAsync({
        id,
        data: {
          montant: parseFloat(paiementForm.montant),
          mode: paiementForm.mode,
        },
      });
      setShowPaiementModal(false);
      setPaiementForm({ montant: "", mode: "Espèces" });
    } catch (error) {
      // toast déjà géré par le hook
    } finally {
      submittingPaiementRef.current = false;
    }
  };

  const handleDownloadAttestation = async () => {
    setDownloading(true);
    try {
      await adhesionService.downloadAttestation(
        adhesion.num_adherent,
        adhesion.annee_adhesion,
      );
    } catch (error) {
      toast.error("Erreur lors du téléchargement de l'attestation");
    } finally {
      setDownloading(false);
    }
  };

  const adhesion = data?.data;
  const adherent = adherentsData?.data?.find(
    (a) => a.num_adherent === adhesion?.num_adherent,
  );

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      navigate("/adhesions");
    } catch (error) {
      // toast déjà géré par le hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!adhesion) {
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
          Adhésion non trouvée
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          L'adhésion que vous recherchez n'existe pas ou a été supprimée.
        </p>
        <button
          onClick={() => navigate("/adhesions")}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </motion.div>
    );
  }

  const isClub = adhesion.type === "Club";

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
      Payé: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
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
      Payé: FiCheckCircle,
      "En attente": FiClock,
      Annulé: FiAlertCircle,
      Remboursé: FiTrendingUp,
    };
    return icons[statut] || FiClock;
  };

  const getStatutText = (statut) => {
    const texts = {
      Payé: "Le paiement a été effectué avec succès",
      "En attente": "En attente de réception du paiement",
      Annulé: "Le paiement a été annulé",
      Remboursé: "Le paiement a été remboursé",
    };
    return texts[statut] || "Statut inconnu";
  };

  const StatutIcon = getStatutIcon(adhesion.statut_paiement);

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
                <FiCreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Adhésion{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    {adhesion.annee_adhesion}
                  </span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-sm">
                    <FiTag className="w-3.5 h-3.5" />
                    {adhesion.type}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1 text-sm">
                    <FiFileText className="w-3.5 h-3.5" />
                    N°{adhesion.id_adhesion}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1 text-sm">
                    <FiUser className="w-3.5 h-3.5" />
                    {adherent
                      ? `${adherent.nom} ${adherent.prenom}`
                      : `N°${adhesion.num_adherent}`}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleDownloadAttestation}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-all duration-300 disabled:opacity-60"
          >
            <FiDownload className="w-4 h-4" />
            Télécharger l'attestation
          </button>
          {isClub &&
            canManageAdhesion &&
            adhesion.statut_paiement === "Partiel" && (
              <button
                onClick={() => setShowPaiementModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-xl transition-all duration-300 shadow-lg shadow-green-500/25 hover:shadow-xl hover:-translate-y-0.5"
              >
                <FiPlusCircle className="w-4 h-4" />
                Enregistrer un paiement
              </button>
            )}
        </div>
        {canManageAdhesion && (
          <div className="flex gap-2">
            <Link
              to={`/adhesions/edit/${adhesion.id_adhesion}`}
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
        className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 dark:from-cyan-800 dark:via-blue-800 dark:to-indigo-800 rounded-2xl shadow-xl p-6 md:p-8 text-white"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-blue-100/80 uppercase tracking-wider">
              {isClub ? "Statut du paiement" : "Statut"}
            </p>
            <div className="flex items-center gap-3 mt-2">
              {isClub ? (
                <StatusBadge status={adhesion.statut_paiement} />
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-white/15">
                  <FiCheckCircle className="w-4 h-4" />
                  Validée
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-8 flex-wrap">
            {isClub && (
              <>
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {formatCurrency(adhesion.montant)}
                  </p>
                  <p className="text-xs text-blue-100/70 uppercase tracking-wider">
                    Montant
                  </p>
                </div>
                <div className="w-px h-12 bg-white/20 hidden sm:block" />
              </>
            )}
            <div className="text-center">
              <p className="text-2xl font-bold">{adhesion.type}</p>
              <p className="text-xs text-blue-100/70 uppercase tracking-wider">
                Type d'adhésion
              </p>
            </div>
            <div className="w-px h-12 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl font-bold">{adhesion.annee_adhesion}</p>
              <p className="text-xs text-blue-100/70 uppercase tracking-wider">
                Année
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
                N°{adhesion.num_adherent}
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

        {/* Informations adhésion */}
        <SectionCard title="Informations adhésion" icon={FiCreditCard}>
          <InfoItem
            icon={FiTag}
            label="Type d'adhésion"
            value={adhesion.type}
            highlight
          />
          <InfoItem
            icon={FiCalendar}
            label="Date de début"
            value={formatDate(adhesion.date_debut)}
          />
          <InfoItem
            icon={FiCalendar}
            label="Date de fin"
            value={formatDate(adhesion.date_fin)}
          />
          {isClub && (
            <>
              <InfoItem
                icon={FiDollarSign}
                label="Montant"
                value={formatCurrency(adhesion.montant)}
              />
              <InfoItem
                icon={FiDollarSign}
                label="Montant payé / Solde restant"
                value={`${formatCurrency(adhesion.montant_paye || 0)} / ${formatCurrency(
                  Math.max(
                    (adhesion.montant || 0) - (adhesion.montant_paye || 0),
                    0,
                  ),
                )}`}
              />
              <InfoItem
                icon={FiClock}
                label="Statut du paiement"
                value={<StatusBadge status={adhesion.statut_paiement} />}
              />
            </>
          )}
          <InfoItem
            icon={FiHash}
            label="N° Licence FFESM"
            value={adhesion.num_licence_ffesm || "Non renseigné"}
          />
          <InfoItem
            icon={FiCalendar}
            label="Année"
            value={adhesion.annee_adhesion}
          />
          {adhesion.document_path && (
            <InfoItem icon={FiPaperclip} label="Document">
              <a
                href={adhesion.document_path}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-0.5 inline-block"
              >
                Voir le document
              </a>
            </InfoItem>
          )}
        </SectionCard>
      </motion.div>

      {/* Échéancier de paiement */}
      {isClub && (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100/80 dark:border-gray-800/80 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400">
              <FiDollarSign className="w-5 h-5" />
            </span>
            Échéancier
          </h3>
          <EcheancierCard
            type_paiement="Adhesion"
            reference_id={adhesion.id_adhesion}
            num_adherent={adhesion.num_adherent}
            soldeRestant={Math.max(
              (adhesion.montant || 0) - (adhesion.montant_paye || 0),
              0,
            )}
            canManage={canManageAdhesion}
            ownerQueryKeys={[["adhesions"]]}
          />
        </motion.div>
      )}

      {/* Statut détaillé */}
      {isClub && (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100/80 dark:border-gray-800/80 p-6 md:p-8"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400">
              <FiCheckCircle className="w-5 h-5" />
            </span>
            Statut du paiement
          </h3>

          <div
            className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-xl border-2 ${getStatutColor(adhesion.statut_paiement)}`}
          >
            <div
              className={`p-3 rounded-full ${
                adhesion.statut_paiement === "Payé"
                  ? "bg-green-100 dark:bg-green-900/30"
                  : adhesion.statut_paiement === "Annulé"
                    ? "bg-red-100 dark:bg-red-900/30"
                    : adhesion.statut_paiement === "Remboursé"
                      ? "bg-blue-100 dark:bg-blue-900/30"
                      : "bg-yellow-100 dark:bg-yellow-900/30"
              }`}
            >
              <StatutIcon
                className={`w-7 h-7 ${
                  adhesion.statut_paiement === "Payé"
                    ? "text-green-600 dark:text-green-400"
                    : adhesion.statut_paiement === "Annulé"
                      ? "text-red-600 dark:text-red-400"
                      : adhesion.statut_paiement === "Remboursé"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-yellow-600 dark:text-yellow-400"
                }`}
              />
            </div>
            <div className="flex-1">
              <p
                className={`font-bold text-lg ${
                  adhesion.statut_paiement === "Payé"
                    ? "text-green-800 dark:text-green-400"
                    : adhesion.statut_paiement === "Annulé"
                      ? "text-red-800 dark:text-red-400"
                      : adhesion.statut_paiement === "Remboursé"
                        ? "text-blue-800 dark:text-blue-400"
                        : "text-yellow-800 dark:text-yellow-400"
                }`}
              >
                {adhesion.statut_paiement}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getStatutText(adhesion.statut_paiement)}
              </p>
            </div>
            <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Montant{" "}
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatCurrency(adhesion.montant)}
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Modal paiement complémentaire */}
      {showPaiementModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.form
            onSubmit={handleEnregistrerPaiement}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 25 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Enregistrer un paiement complémentaire
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Solde restant :{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(
                  Math.max(
                    (adhesion.montant || 0) - (adhesion.montant_paye || 0),
                    0,
                  ),
                )}
              </span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Montant (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paiementForm.montant}
                  onChange={(e) =>
                    setPaiementForm((prev) => ({
                      ...prev,
                      montant: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Mode de paiement
                </label>
                <select
                  value={paiementForm.mode}
                  onChange={(e) =>
                    setPaiementForm((prev) => ({
                      ...prev,
                      mode: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {MODE_PAIEMENT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowPaiementModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={enregistrerPaiement.isPending}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-xl transition-all duration-300 shadow-lg shadow-green-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Enregistrer
              </button>
            </div>
          </motion.form>
        </ModalOverlay>
      )}

      {/* Modal suppression */}
      {showDeleteModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
              Êtes-vous sûr de vouloir supprimer cette adhésion{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {adhesion.type} {adhesion.annee_adhesion}
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
        </ModalOverlay>
      )}
    </motion.div>
  );
};

export default AdhesionDetails;
