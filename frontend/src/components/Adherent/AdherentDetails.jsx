import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiMapPin,
  FiCalendar,
  FiAward,
  FiUserCheck,
  FiEdit,
  FiArrowLeft,
  FiHeart,
  FiSmartphone,
  FiAlertCircle,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiFileText,
  FiDroplet,
  FiAnchor,
  FiHash,
  FiClock,
  FiDownload,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useAdhesions } from "../../hooks/Adhesion/useAdhesions";
import { useCertificats } from "../../hooks/CertificatMedical/useCertificats";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../Common/LoadingSpinner";
import StatusBadge from "../Common/StatusBadge";
import { formatDate, formatDuration } from "../../utils/helpers";
import { photoUrl } from "../../utils/photoUrl";
import plongeeService from "../../services/Plongee/plongeeService";

// Animations - j'ai repris les mêmes que sur la page d'accueil
// Faudrait peut-être mutualiser ça un jour...
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
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// TODO: Ajouter un composant pour les informations de santé (allergies, etc.)
// Le client a demandé mais j'attends le retour du médecin fédéral
const AdherentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canManageAdherent = hasRole(["president"]);
  const canViewDossier = hasRole(["president", "moniteur", "tresorier"]);
  const { useGetById, useRemove } = useAdherents();
  const { data, isLoading } = useGetById(id);
  const remove = useRemove();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [downloadingCarnet, setDownloadingCarnet] = useState(false);

  const adherent = data?.data;

  const handleDownloadCarnet = async () => {
    setDownloadingCarnet(true);
    try {
      await plongeeService.downloadCarnet(adherent.num_adherent);
    } catch (error) {
      toast.error("Erreur lors du téléchargement du carnet");
    } finally {
      setDownloadingCarnet(false);
    }
  };

  // Même calcul que ProfilePage.jsx (anneesMembre) : différence en années
  // pleines depuis l'inscription.
  const anciennete = adherent?.date_inscription
    ? `${new Date().getFullYear() - new Date(adherent.date_inscription).getFullYear()} an(s)`
    : "-";

  const { useDossierStatus } = useAdhesions();
  const { useStatus } = useCertificats();
  const { data: dossierData } = useDossierStatus(
    canViewDossier ? adherent?.num_adherent : undefined,
  );
  const { data: certStatusData } = useStatus(
    canViewDossier ? adherent?.num_adherent : undefined,
  );
  const dossier = dossierData?.data;
  const certStatus = certStatusData?.data;

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      navigate("/adherents");
    } catch (error) {
      console.error("Delete error:", error); // J'ai ajouté le log pour debug
    }
  };

  // J'ai mis un petit loading avec un minimum de hauteur
  // Sinon ça fait des sauts de page pas sympa
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  // Je devrais peut-être gérer le cas où l'ID est invalide...
  if (!adherent) {
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
          Adhérent non trouvé
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          L'adhérent que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <button
          onClick={() => navigate("/adherents")}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </motion.div>
    );
  }

  // J'ai fait un composant réutilisable pour les infos
  // C'est plus propre que de répéter le même code 15 fois
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

  // Section card avec un joli fond
  // J'ai mis un gradient subtil, j'espère que ça rend bien sur tous les écrans
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
              <span className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center flex-shrink-0">
                {photoUrl(adherent.photo) ? (
                  <img
                    src={photoUrl(adherent.photo)}
                    alt="Photo d'identité"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FiUser className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                )}
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {adherent.nom}{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    {adherent.prenom}
                  </span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-sm">
                    <FiFileText className="w-3.5 h-3.5" />
                    N°{adherent.num_adherent}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1 text-sm">
                    <FiMail className="w-3.5 h-3.5" />
                    {adherent.email}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadCarnet}
            disabled={downloadingCarnet}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-all duration-300 disabled:opacity-60"
          >
            <FiDownload className="w-4 h-4" />
            Télécharger le carnet
          </button>
        </div>
        {canManageAdherent && (
          <div className="flex gap-2">
            <Link
              to={`/adherents/edit/${adherent.num_adherent}`}
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

      {/* Statut - Carte d'identité */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 dark:from-cyan-800 dark:via-blue-800 dark:to-indigo-800 rounded-2xl shadow-xl p-6 md:p-8 text-white"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-100/80 uppercase tracking-wider">
              Statut du compte
            </p>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={adherent.statut} />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {adherent.niveau || "Non défini"}
              </p>
              <p className="text-xs text-blue-100/70 uppercase tracking-wider">
                Niveau
              </p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold">{anciennete}</p>
              <p className="text-xs text-blue-100/70 uppercase tracking-wider">
                Ancienneté
              </p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold">
                {adherent.nb_plongees_total ?? 0}
              </p>
              <p className="text-xs text-blue-100/70 uppercase tracking-wider">
                Plongées club
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
        {/* Informations personnelles */}
        <SectionCard title="Informations personnelles" icon={FiUser}>
          <InfoItem icon={FiUser} label="Civilité" value={adherent.civilite} />
          <InfoItem
            icon={FiUserCheck}
            label="Nom complet"
            value={`${adherent.nom} ${adherent.prenom}`}
            highlight
          />
          <InfoItem
            icon={FiCalendar}
            label="Date de naissance"
            value={formatDate(adherent.date_naissance)}
          />
          <InfoItem icon={FiMail} label="Email" value={adherent.email} />
          <InfoItem
            icon={FiSmartphone}
            label="Téléphone"
            value={adherent.telephone || "Non renseigné"}
          />
          <InfoItem
            icon={FiMapPin}
            label="Adresse"
            value={adherent.adresse || "Non renseignée"}
          />
        </SectionCard>

        {/* Informations club */}
        <SectionCard title="Informations club" icon={FiAnchor}>
          <InfoItem
            icon={FiAward}
            label="Niveau de plongée"
            value={adherent.niveau || "Non défini"}
            highlight
          />
          <InfoItem
            icon={FiCalendar}
            label="Date d'obtention"
            value={
              adherent.niveau === "Baptême"
                ? "Non applicable"
                : adherent.date_obtention_niveau
                  ? formatDate(adherent.date_obtention_niveau)
                  : "Non défini"
            }
          />
          <InfoItem
            icon={FiFileText}
            label="Brevet délivré"
            value={
              adherent.niveau === "Baptême"
                ? "Non applicable"
                : adherent.num_brevet || "Non renseigné"
            }
          />
          <InfoItem
            icon={FiHash}
            label="N° Licence FFESM"
            value={
              adherent.niveau === "Baptême"
                ? "Non applicable"
                : adherent.num_licence_ffesm || "Non renseigné"
            }
          />
          <InfoItem
            icon={FiCalendar}
            label="Date d'inscription"
            value={formatDate(adherent.date_inscription)}
          />
          <InfoItem
            icon={FiUserCheck}
            label="Statut"
            value={<StatusBadge status={adherent.statut} />}
          />
          <InfoItem
            icon={FiHeart}
            label="Contact d'urgence"
            value={adherent.contact_urgence || "Non renseigné"}
          />
          <InfoItem
            icon={FiDroplet}
            label="Nombre de plongées club"
            value={String(adherent.nb_plongees_total ?? 0)}
          />
          <InfoItem
            icon={FiDroplet}
            label="Plongées réellement enregistrées"
            value={
              adherent.nb_plongees_reelles === null ||
              adherent.nb_plongees_reelles === undefined
                ? "Indisponible"
                : String(adherent.nb_plongees_reelles)
            }
          />
          <InfoItem
            icon={FiAnchor}
            label="Profondeur max réalisée"
            value={
              adherent.profondeur_max_reelle === null ||
              adherent.profondeur_max_reelle === undefined
                ? "Indisponible"
                : `${adherent.profondeur_max_reelle} m`
            }
          />
          <InfoItem
            icon={FiClock}
            label="Temps total sous l'eau"
            value={
              adherent.duree_totale_reelle === null ||
              adherent.duree_totale_reelle === undefined
                ? "Indisponible"
                : formatDuration(adherent.duree_totale_reelle)
            }
          />
        </SectionCard>
      </motion.div>

      {/* Dossier adhésion : validité adhésion + certificat médical */}
      {canViewDossier && (dossier || certStatus) && (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100/80 dark:border-gray-800/80 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400">
              <FiCheckCircle className="w-5 h-5" />
            </span>
            Dossier adhésion
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className={`flex items-center gap-3 p-4 rounded-xl border ${
                dossier?.valid
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              }`}
            >
              {dossier?.valid ? (
                <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <FiXCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
              )}
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Adhésion {dossier?.valid ? "complète" : "incomplète"}
                </p>
                {!dossier?.valid && dossier?.missing?.length > 0 && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Manquant : {dossier.missing.join(", ")}
                  </p>
                )}
              </div>
            </div>
            <div
              className={`flex items-center gap-3 p-4 rounded-xl border ${
                certStatus?.hasValidCertificate
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              }`}
            >
              {certStatus?.hasValidCertificate ? (
                <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <FiXCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
              )}
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Certificat médical{" "}
                  {certStatus?.hasValidCertificate ? "valide" : "expiré ou manquant"}
                </p>
              </div>
            </div>
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
              Êtes-vous sûr de vouloir supprimer l'adhérent{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {adherent.nom} {adherent.prenom}
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

export default AdherentDetails;
