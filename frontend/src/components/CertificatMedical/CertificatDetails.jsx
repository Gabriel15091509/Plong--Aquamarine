import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUser,
  FiFileText,
  FiCalendar,
  FiEdit,
  FiArrowLeft,
  FiBriefcase,
  FiAward,
  FiTrash2,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiFile,
  FiHeart,
  FiUserCheck,
  FiPaperclip,
  FiAlertCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useCertificats } from "../../hooks/CertificatMedical/useCertificats";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";
import ConfirmModal from "../Common/ConfirmModal";
import StatusBadge from "../Common/StatusBadge";
import SectionCard from "../Common/SectionCard";
import InfoItem from "../Common/InfoItem";
import { formatDate } from "../../utils/helpers";
import api from "../../services/api";

// Animations
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

const CertificatDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canManageCertificat = hasRole(["president"]);
  const { useGetById, useRemove, useValider } = useCertificats();
  const { useGetAll } = useAdherents();
  const { data, isLoading } = useGetById(id);
  const { data: adherentsData } = useGetAll();
  const remove = useRemove();
  const valider = useValider();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [openingDocument, setOpeningDocument] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectMotif, setRejectMotif] = useState("");

  const certificat = data?.data;
  const adherent = adherentsData?.data?.find(
    (a) => a.num_adherent === certificat?.num_adherent,
  );

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      navigate("/certificats");
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

  // Document chiffré au repos, jamais accessible via une URL statique : on
  // le récupère par la route authentifiée puis on l'ouvre depuis un blob.
  // L'onglet doit être ouvert de façon synchrone, dans le même tick que le
  // clic — un `window.open` appelé après un `await` n'est plus rattaché au
  // geste utilisateur et se fait bloquer silencieusement par le navigateur
  // (pas d'erreur, juste rien qui s'affiche).
  const handleViewDocument = async () => {
    // Sans "noopener"/"noreferrer" ici (contrairement à un <a target="_blank">
    // classique) : ces deux flags forcent window.open() à renvoyer null (pas
    // de référence vers l'onglet créé), ce qui empêchait justement la ligne
    // `tab.location.href = url` plus bas de s'exécuter — l'onglet ouvert
    // restait sur about:blank indéfiniment (page blanche, sans la moindre
    // erreur ni toast). Confirmé en testant directement window.open() dans
    // Chromium. Pas de risque ici : l'onglet ne navigue jamais vers une URL
    // fournie par un tiers, seulement vers un blob qu'on vient de créer.
    const tab = window.open("", "_blank");
    setOpeningDocument(true);
    try {
      const response = await api.get(
        `/certificats-medicaux/${certificat.id_certificat}/document`,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(response.data);
      if (tab) {
        tab.location.href = url;
      } else {
        toast.error(
          "Le navigateur a bloqué l'ouverture de l'onglet. Autorisez les pop-ups pour ce site.",
        );
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      if (tab) tab.close();
      toast.error(
        error.response?.data?.message || "Impossible d'ouvrir le document",
      );
    } finally {
      setOpeningDocument(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!certificat) {
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
          Certificat non trouvé
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Le certificat que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <button
          onClick={() => navigate("/certificats")}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </motion.div>
    );
  }

  const isExpired =
    certificat.date_validite && new Date(certificat.date_validite) < new Date();

  const daysUntilExpiry = () => {
    if (!certificat.date_validite) return null;
    const today = new Date();
    const expiry = new Date(certificat.date_validite);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = daysUntilExpiry();

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
                <FiFile className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {certificat.type_certificat}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-sm">
                    <FiFileText className="w-3.5 h-3.5" />
                    N°{certificat.id_certificat}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1 text-sm">
                    <FiBriefcase className="w-3.5 h-3.5" />
                    {certificat.medecin || "Médecin non renseigné"}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1 text-sm">
                    <FiUser className="w-3.5 h-3.5" />
                    {adherent
                      ? `${adherent.nom} ${adherent.prenom}`
                      : `N°${certificat.num_adherent}`}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
        {canManageCertificat && (
          <div className="flex gap-2 flex-wrap">
            {certificat.statut_validation === "En attente" && (
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
                une soumission adhérent (voir CertificatMedicalService.
                update/delete) — un certificat créé par le staff reste
                modifiable comme avant. */}
            {!(certificat.soumis_par_adherent && certificat.statut_validation === "Validé") && (
              <>
                <Link
                  to={`/certificats/edit/${certificat.id_certificat}`}
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

      {/* Carte récapitulative - Statut */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl shadow-sm p-6 md:p-8 border-2 ${
          isExpired
            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            : daysLeft && daysLeft <= 30
              ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
              : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Statut du certificat
            </p>
            <div className="flex items-center gap-3 mt-2">
              {isExpired ? (
                <>
                  <FiXCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  <span className="text-xl font-bold text-gray-900 dark:text-white">Expiré</span>
                </>
              ) : (
                <>
                  <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <span className="text-xl font-bold text-gray-900 dark:text-white">Valide</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-8 flex-wrap">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {daysLeft !== null ? (isExpired ? "0" : daysLeft) : "-"}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {isExpired ? "Expiré" : "Jours restants"}
              </p>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatDate(certificat.date_validite)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Date d'expiration
              </p>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
            <div className="text-center">
              <StatusBadge status={certificat.statut} />
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
                N°{certificat.num_adherent}
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
              <InfoItem
                icon={FiHeart}
                label="Contact d'urgence"
                value={adherent.contact_urgence || "Non renseigné"}
              />
            </>
          )}
        </SectionCard>

        {/* Informations certificat */}
        <SectionCard title="Informations certificat" icon={FiFileText}>
          <InfoItem
            icon={FiFileText}
            label="Type de certificat"
            value={certificat.type_certificat}
            highlight
          />
          <InfoItem
            icon={FiCalendar}
            label="Date de validité"
            value={formatDate(certificat.date_validite)}
          />
          <InfoItem
            icon={FiClock}
            label="Date de délivrance"
            value={
              certificat.date_delivrance
                ? formatDate(certificat.date_delivrance)
                : "Non renseignée"
            }
          />
          <InfoItem
            icon={FiBriefcase}
            label="Médecin traitant"
            value={certificat.medecin || "Non renseigné"}
          />
          <InfoItem
            icon={FiAward}
            label="Statut"
            value={<StatusBadge status={certificat.statut} />}
          />
          {certificat.statut_validation !== "Validé" && (
            <InfoItem
              icon={FiAlertCircle}
              label="Validation"
              value={
                <div>
                  <StatusBadge status={certificat.statut_validation} />
                  {certificat.statut_validation === "Rejeté" && certificat.motif_rejet && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 italic">
                      Motif : {certificat.motif_rejet}
                    </p>
                  )}
                </div>
              }
            />
          )}
          <InfoItem
            icon={isExpired ? FiXCircle : FiCheckCircle}
            label="Validité"
            value={
              <span
                className={`font-semibold ${
                  isExpired
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {isExpired ? "Expiré" : "Valide"}
              </span>
            }
          />
          {daysLeft !== null && !isExpired && (
            <InfoItem
              icon={FiClock}
              label="Jours restants"
              value={
                <span
                  className={`font-semibold ${
                    daysLeft <= 7
                      ? "text-red-600 dark:text-red-400"
                      : daysLeft <= 30
                        ? "text-orange-500 dark:text-orange-400"
                        : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {daysLeft} jour{daysLeft > 1 ? "s" : ""}
                </span>
              }
            />
          )}
          {certificat.document_path && (
            <InfoItem icon={FiPaperclip} label="Document">
              <button
                type="button"
                onClick={handleViewDocument}
                disabled={openingDocument}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-0.5 inline-block disabled:opacity-50"
              >
                {openingDocument ? "Ouverture..." : "Voir le document"}
              </button>
            </InfoItem>
          )}
        </SectionCard>
      </motion.div>

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
              L&apos;adhérent verra ce motif et pourra soumettre un nouveau certificat corrigé.
            </p>
            <textarea
              value={rejectMotif}
              onChange={(e) => setRejectMotif(e.target.value)}
              placeholder="Ex. : document illisible, date de validité incohérente"
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
            Êtes-vous sûr de vouloir supprimer ce certificat{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {certificat.type_certificat}
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

export default CertificatDetails;
