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
import ConfirmModal from "../Common/ConfirmModal";
import StatusBadge from "../Common/StatusBadge";
import SectionCard from "../Common/SectionCard";
import InfoItem from "../Common/InfoItem";
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
  const { useGetById, useRemove, useEnregistrerPaiement, useValider } = useAdhesions();
  // Seule l'adhésion "Club" a un tarif/paiement suivi dans l'app : la
  // licence FFESM et les assurances sont couvertes par cette cotisation.
  const { useGetAll } = useAdherents();
  const { data, isLoading } = useGetById(id);
  const { data: adherentsData } = useGetAll();
  const remove = useRemove();
  const enregistrerPaiement = useEnregistrerPaiement();
  const valider = useValider();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectMotif, setRejectMotif] = useState("");
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

  const handleValider = async () => {
    try {
      await valider.mutateAsync({ id, decision: "Validé" });
    } catch (error) {
      // toast déjà géré par le hook
    }
  };

  const handleRejeter = async () => {
    if (!rejectMotif.trim()) return;
    try {
      await valider.mutateAsync({ id, decision: "Rejeté", motif: rejectMotif.trim() });
      setShowRejectModal(false);
      setRejectMotif("");
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
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </motion.div>
    );
  }

  const isClub = adhesion.type === "Club";

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
              <span className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-900/20">
                <FiCreditCard className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
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
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors duration-150"
              >
                <FiPlusCircle className="w-4 h-4" />
                Enregistrer un paiement
              </button>
            )}
        </div>
        {canManageAdhesion && (
          <div className="flex gap-2 flex-wrap">
            {adhesion.statut_validation === "En attente" && (
              <>
                <button
                  onClick={handleValider}
                  disabled={valider.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors duration-150 disabled:opacity-60"
                >
                  <FiCheckCircle className="w-4 h-4" />
                  Valider
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={valider.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors duration-150 disabled:opacity-60"
                >
                  <FiAlertCircle className="w-4 h-4" />
                  Rejeter
                </button>
              </>
            )}
            {/* Verrouillé côté serveur une fois validé, mais seulement pour
                une soumission adhérent (voir AdhesionService.update/delete) —
                une adhésion créée par le staff reste modifiable comme avant. */}
            {!(adhesion.soumis_par_adherent && adhesion.statut_validation === "Validé") && (
              <>
                <Link
                  to={`/adhesions/edit/${adhesion.id_adhesion}`}
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
              </>
            )}
          </div>
        )}
      </motion.div>

      {/* Carte récapitulative */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6 md:p-8"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {isClub ? "Statut du paiement" : "Statut"}
            </p>
            <div className="flex items-center gap-3 mt-2">
              {isClub ? (
                <StatusBadge status={adhesion.statut_paiement} />
              ) : (
                <StatusBadge status={adhesion.statut_validation} />
              )}
            </div>
            {adhesion.statut_validation === "Rejeté" && adhesion.motif_rejet && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2 italic">
                Motif : {adhesion.motif_rejet}
              </p>
            )}
          </div>
          <div className="flex items-center gap-8 flex-wrap">
            {isClub && (
              <>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(adhesion.montant)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Montant
                  </p>
                </div>
                <div className="w-px h-12 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
              </>
            )}
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{adhesion.type}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Type d'adhésion
              </p>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{adhesion.annee_adhesion}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
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
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400">
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
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6 md:p-8"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400">
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
                className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Enregistrer
              </button>
            </div>
          </motion.form>
        </ModalOverlay>
      )}

      {/* Modal de rejet */}
      {showRejectModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Rejeter cette soumission
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              L&apos;adhérent verra ce motif et pourra soumettre une nouvelle entrée corrigée.
            </p>
            <textarea
              value={rejectMotif}
              onChange={(e) => setRejectMotif(e.target.value)}
              placeholder="Ex. : numéro de licence illisible sur la photo"
              rows={3}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-300 focus:outline-none"
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectMotif("");
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleRejeter}
                disabled={!rejectMotif.trim() || valider.isPending}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Rejeter
              </button>
            </div>
          </motion.div>
        </ModalOverlay>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        message={
          <>
            Êtes-vous sûr de vouloir supprimer cette adhésion{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {adhesion.type} {adhesion.annee_adhesion}
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

export default AdhesionDetails;
