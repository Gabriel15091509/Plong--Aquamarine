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
  FiBookOpen,
  FiCompass,
  FiPackage,
  FiCreditCard,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useAdhesions } from "../../hooks/Adhesion/useAdhesions";
import { useCertificats } from "../../hooks/CertificatMedical/useCertificats";
import { useFormations } from "../../hooks/Formation/useFormations";
import { useInscriptions } from "../../hooks/Inscription/useInscriptions";
import { useAttributions } from "../../hooks/Attribution/useAttributions";
import { usePaiements } from "../../hooks/Paiement/usePaiements";
import { useMateriels } from "../../hooks/Materiel/useMateriels";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../Common/LoadingSpinner";
import StatusBadge from "../Common/StatusBadge";
import PdfPreviewModal from "../Common/PdfPreviewModal";
import ConfirmModal from "../Common/ConfirmModal";
import SectionCard from "../Common/SectionCard";
import InfoItem from "../Common/InfoItem";
import {
  formatDate,
  formatDateTime,
  formatDuration,
  formatCurrency,
} from "../../utils/helpers";
import { photoUrl } from "../../utils/photoUrl";
import plongeeService from "../../services/Plongee/plongeeService";

// Animations - j'ai repris les mêmes que sur la page d'accueil
// Faudrait peut-être mutualiser ça un jour...
const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: "easeOut" },
};

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
  const [downloadingAttestation, setDownloadingAttestation] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);

  const adherent = data?.data;

  const closePdfPreview = () => {
    if (pdfPreview?.blobUrl) window.URL.revokeObjectURL(pdfPreview.blobUrl);
    setPdfPreview(null);
  };

  const handlePreviewCarnet = async () => {
    setDownloadingCarnet(true);
    try {
      const { blobUrl, filename } = await plongeeService.previewCarnet(adherent.num_adherent);
      setPdfPreview({ blobUrl, filename });
    } catch (error) {
      toast.error("Erreur lors du chargement du carnet");
    } finally {
      setDownloadingCarnet(false);
    }
  };

  const handlePreviewAttestationSuivi = async () => {
    setDownloadingAttestation(true);
    try {
      const { blobUrl, filename } = await plongeeService.previewAttestationSuivi(
        adherent.num_adherent,
      );
      setPdfPreview({ blobUrl, filename });
    } catch (error) {
      toast.error("Erreur lors du chargement de l'attestation");
    } finally {
      setDownloadingAttestation(false);
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

  // Dossier complet de l'adhérent (formations, sorties, matériel, paiements) —
  // réservé au même public que le dossier adhésion ci-dessus : cette page
  // n'est de toute façon accessible depuis le menu qu'à ces trois rôles.
  const { useGetByAdherent: useFormationsByAdherent } = useFormations();
  const { useGetByAdherent: useInscriptionsByAdherent } = useInscriptions();
  const { useGetByAdherent: useAttributionsByAdherent } = useAttributions();
  const { useGetByAdherent: usePaiementsByAdherent } = usePaiements();
  const { useGetAll: useGetAllMateriels } = useMateriels();

  const { data: formationsData } = useFormationsByAdherent(
    canViewDossier ? adherent?.num_adherent : undefined,
  );
  const { data: inscriptionsData } = useInscriptionsByAdherent(
    canViewDossier ? adherent?.num_adherent : undefined,
  );
  const { data: attributionsData } = useAttributionsByAdherent(
    canViewDossier ? adherent?.num_adherent : undefined,
  );
  const { data: paiementsData } = usePaiementsByAdherent(
    canViewDossier ? adherent?.num_adherent : undefined,
  );
  const { data: materielsData } = useGetAllMateriels();

  const formations = formationsData?.data || [];
  const inscriptions = inscriptionsData?.data || [];
  const attributionsEnCours = (attributionsData?.data || []).filter(
    (a) => !a.date_retour_reel,
  );
  const paiements = paiementsData?.data || [];
  const materielMap = (materielsData?.data || []).reduce((map, m) => {
    map[m.num_inventaire] = `${m.marque} ${m.modele}`;
    return map;
  }, {});

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      navigate("/adherents");
    } catch (error) {
      console.error("Échec de la suppression de l'adhérent :", error);
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
        initial={{ opacity: 0, scale: 0.98 }}
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
              <span className="w-12 h-12 rounded-xl overflow-hidden bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center flex-shrink-0">
                {photoUrl(adherent.photo) ? (
                  <img
                    src={photoUrl(adherent.photo)}
                    alt="Photo d'identité"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FiUser className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
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
            onClick={handlePreviewCarnet}
            disabled={downloadingCarnet}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-all duration-300 disabled:opacity-60"
          >
            <FiDownload className="w-4 h-4" />
            Carnet de plongée
          </button>
          <button
            onClick={handlePreviewAttestationSuivi}
            disabled={downloadingAttestation}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl transition-all duration-300 disabled:opacity-60"
          >
            <FiAward className="w-4 h-4" />
            Attestation de suivi
          </button>
        </div>
        {canManageAdherent && (
          <div className="flex gap-2">
            <Link
              to={`/adherents/edit/${adherent.num_adherent}`}
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
        )}
      </motion.div>

      {/* Statut - Carte d'identité */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6 md:p-8"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Statut du compte
            </p>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={adherent.statut} />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {adherent.niveau || "Non défini"}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Niveau
              </p>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{anciennete}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Ancienneté
              </p>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {adherent.nb_plongees_total ?? 0}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
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
        </SectionCard>

        {/* Historique des brevets : une ligne par passage de niveau (jamais
            écrasée, contrairement au niveau courant ci-dessus) */}
        <SectionCard title="Historique des brevets" icon={FiBookOpen}>
          {!adherent.brevets || adherent.brevets.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 px-4 py-2">
              Aucun passage de niveau enregistré.
            </p>
          ) : (
            adherent.brevets.map((brevet) => (
              <div
                key={brevet.id_brevet}
                className="flex items-center justify-between gap-3 p-4 rounded-xl"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {brevet.niveau}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(brevet.date_obtention)}
                    {brevet.num_brevet ? ` — Brevet n° ${brevet.num_brevet}` : ""}
                  </p>
                </div>
              </div>
            ))
          )}
        </SectionCard>

        {/* Informations club (suite) */}
        <SectionCard title="Statut administratif" icon={FiAnchor}>
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
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400">
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

      {/* Dossier complet : formations, sorties, matériel, paiements */}
      {canViewDossier && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Formations en cours */}
          <SectionCard title="Formations en cours" icon={FiBookOpen}>
            {formations.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 px-4 py-2">
                Aucune formation en cours.
              </p>
            ) : (
              formations.map((formation) => (
                <Link
                  key={formation.id_formation}
                  to={`/formations/${formation.id_formation}`}
                  className="flex items-center justify-between gap-3 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formation.niveau_vise}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(formation.montant_paye)} /{" "}
                      {formatCurrency(formation.montant_total)}
                    </p>
                  </div>
                  <StatusBadge status={formation.statut} />
                </Link>
              ))
            )}
          </SectionCard>

          {/* Inscriptions à des sorties */}
          <SectionCard title="Inscriptions à des sorties" icon={FiCompass}>
            {inscriptions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 px-4 py-2">
                Aucune inscription à une sortie.
              </p>
            ) : (
              inscriptions.map((inscription) => (
                <Link
                  key={inscription.id_inscription}
                  to={`/sorties/${inscription.id_sortie}`}
                  className="flex items-center justify-between gap-3 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {inscription.sortie
                        ? `${inscription.sortie.type} — ${inscription.sortie.lieu}`
                        : `Sortie #${inscription.id_sortie}`}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {inscription.sortie?.date_heure
                        ? formatDateTime(inscription.sortie.date_heure)
                        : "Date inconnue"}
                    </p>
                  </div>
                  <StatusBadge status={inscription.statut} />
                </Link>
              ))
            )}
          </SectionCard>

          {/* Matériel attribué */}
          <SectionCard title="Matériel attribué" icon={FiPackage}>
            {attributionsEnCours.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 px-4 py-2">
                Aucun matériel actuellement attribué.
              </p>
            ) : (
              attributionsEnCours.map((attribution) => (
                <Link
                  key={attribution.id_attribution}
                  to={`/attributions/${attribution.id_attribution}`}
                  className="flex items-center justify-between gap-3 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {materielMap[attribution.num_inventaire] ||
                        `Matériel #${attribution.num_inventaire}`}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Depuis le {formatDate(attribution.date_attribution)}
                    </p>
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    En cours
                  </span>
                </Link>
              ))
            )}
          </SectionCard>

          {/* Paiements */}
          <SectionCard title="Paiements" icon={FiCreditCard}>
            {paiements.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 px-4 py-2">
                Aucun paiement enregistré.
              </p>
            ) : (
              paiements.map((paiement) => (
                <Link
                  key={paiement.id_paiement}
                  to={`/paiements/${paiement.id_paiement}`}
                  className="flex items-center justify-between gap-3 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {paiement.type_paiement} — {formatCurrency(paiement.montant)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(paiement.date_paiement)}
                    </p>
                  </div>
                  <StatusBadge status={paiement.statut} />
                </Link>
              ))
            )}
          </SectionCard>
        </motion.div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        message={
          <>
            Êtes-vous sûr de vouloir supprimer l'adhérent{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {adherent.nom} {adherent.prenom}
            </span>
            ?
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      <PdfPreviewModal
        isOpen={!!pdfPreview}
        onClose={closePdfPreview}
        blobUrl={pdfPreview?.blobUrl}
        filename={pdfPreview?.filename}
      />
    </motion.div>
  );
};

export default AdherentDetails;
