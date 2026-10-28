import React, { useState } from "react";
import ModalLink from "../Common/ModalLink";
import {
  FiUser,
  FiFileText,
  FiCalendar,
  FiEdit,
  FiBriefcase,
  FiAward,
  FiTrash2,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiFile,
  FiHeart,
  FiPaperclip,
  FiAlertCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useCertificats } from "../../hooks/CertificatMedical/useCertificats";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useAuth } from "../../context/AuthContext";
import { useDetailsModal } from "../../hooks/useFormModal";
import DetailsModal from "../Common/DetailsModal";
import PdfPreviewModal from "../Common/PdfPreviewModal";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";
import ConfirmModal from "../Common/ConfirmModal";
import StatusBadge from "../Common/StatusBadge";
import InfoItem from "../Common/InfoItem";
import { photoUrl } from "../../utils/photoUrl";
import { formatDate } from "../../utils/helpers";
import api from "../../services/api";

// Fiche certificat médical, modale par-dessus la liste (voir
// MoniteurDetails.jsx pour le prototype d'origine et DetailsModal.jsx pour
// la coquille commune).
const CertificatDetails = () => {
  const modal = useDetailsModal("/certificats");
  const { id } = modal;
  const { hasRole } = useAuth();
  const canManageCertificat = hasRole(["president"]);
  const { useGetById, useRemove, useValider } = useCertificats();
  const { useGetAll } = useAdherents();
  const { data, isLoading } = useGetById(id);
  const { data: adherentsData } = useGetAll({}, { enabled: !!id });
  const remove = useRemove();
  const valider = useValider();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [openingDocument, setOpeningDocument] = useState(false);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectMotif, setRejectMotif] = useState("");

  const certificat = data?.data;
  const adherent = adherentsData?.data?.find(
    (a) => a.num_adherent === certificat?.num_adherent,
  );

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      setShowDeleteModal(false);
      modal.close();
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
  // le récupère par la route authentifiée puis on l'affiche dans
  // PdfPreviewModal (voir AdhesionDetails.jsx pour le même principe sur
  // l'attestation d'adhésion) — plus besoin du contournement "onglet ouvert
  // de façon synchrone" qu'exigeait l'ancien window.open (bloqué par les
  // navigateurs s'il n'est plus rattaché au geste utilisateur après un
  // `await`) : le document reste dans l'appli, dans une modale par-dessus
  // la fiche.
  const handleViewDocument = async () => {
    setOpeningDocument(true);
    try {
      const response = await api.get(
        `/certificats-medicaux/${certificat.id_certificat}/document`,
        { responseType: "blob" },
      );
      const blobUrl = URL.createObjectURL(response.data);
      setDocumentPreview({
        blobUrl,
        filename: `Certificat - ${certificat.type_certificat}`,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Impossible d'ouvrir le document",
      );
    } finally {
      setOpeningDocument(false);
    }
  };

  const closeDocumentPreview = () => {
    if (documentPreview?.blobUrl) URL.revokeObjectURL(documentPreview.blobUrl);
    setDocumentPreview(null);
  };

  const headerExtra = certificat && canManageCertificat && (
    <>
      {/* Verrouillé côté serveur une fois validé, mais seulement pour une
          soumission adhérent (voir CertificatMedicalService.update/delete) —
          un certificat créé par le staff reste modifiable comme avant. */}
      {!(certificat.soumis_par_adherent && certificat.statut_validation === "Validé") && (
        <>
          {certificat.statut_validation !== "En attente" && (
            <ModalLink
              to={`/certificats/edit/${certificat.id_certificat}`}
              className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
              title="Modifier"
            >
              <FiEdit className="w-4 h-4" />
            </ModalLink>
          )}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            title="Supprimer"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </>
      )}
    </>
  );

  if (isLoading || !certificat) {
    return (
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={isLoading ? "Chargement…" : "Certificat non trouvé"}
        icon={FiFile}
        pages={[
          {
            label: "",
            content: isLoading ? (
              <div className="flex items-center justify-center py-10">
                <LoadingSpinner variant="details" />
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">
                Le certificat que vous recherchez n&apos;existe pas ou a été
                supprimé.
              </p>
            ),
          },
        ]}
      />
    );
  }

  const isExpired =
    certificat.date_validite && new Date(certificat.date_validite) < new Date();
  const isRejected = certificat.statut_validation === "Rejeté";
  // Tant que le président n'a pas validé la soumission, "À jour"/"Expiré"
  // n'a pas de sens : ce n'est pas encore un certificat accepté par le club.
  const isPending = certificat.statut_validation === "En attente";

  const daysUntilExpiry = () => {
    if (!certificat.date_validite) return null;
    const today = new Date();
    const expiry = new Date(certificat.date_validite);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = daysUntilExpiry();

  const pages = [
    {
      label: "Détails",
      icon: FiFileText,
      content: (
        <div className="space-y-4">
          {canManageCertificat && isPending && (
            <div className="rounded-xl p-3 border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Soumission en attente de décision
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleValider}
                  disabled={valider.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors duration-150 disabled:opacity-60"
                >
                  <FiCheckCircle className="w-4 h-4" />
                  Valider
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={valider.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors duration-150 disabled:opacity-60"
                >
                  <FiAlertCircle className="w-4 h-4" />
                  Rejeter
                </button>
              </div>
            </div>
          )}

          {!isPending && (
            <div
              className={`rounded-xl p-3 border flex items-center gap-3 flex-wrap justify-between ${
                isRejected || isExpired
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  : daysLeft && daysLeft <= 30
                    ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                    : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {isRejected || isExpired ? (
                  <FiXCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                ) : (
                  <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                )}
                <span className="font-bold text-gray-900 dark:text-white">
                  {isRejected ? "Rejeté" : isExpired ? "Expiré" : "À jour"}
                </span>
                {isRejected && certificat.motif_rejet && (
                  <span className="text-sm text-red-600 dark:text-red-400 italic">
                    — Motif : {certificat.motif_rejet}
                  </span>
                )}
              </div>
              {!isRejected && daysLeft !== null && !isExpired && (
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {daysLeft} jour{daysLeft > 1 ? "s" : ""} restant
                  {daysLeft > 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            <div className="space-y-1">
              <InfoItem
                icon={FiUser}
                label="Adhérent"
                highlight
                avatarUrl={photoUrl(adherent?.photo)}
              >
                {adherent ? (
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {adherent.civilite} {adherent.nom} {adherent.prenom}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
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
                    icon={FiHeart}
                    label="Contact d'urgence"
                    value={adherent.contact_urgence || "Non renseigné"}
                  />
                </>
              )}
            </div>
            <div className="space-y-1">
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
              {certificat.statut_validation !== "Validé" && !isPending && (
                <InfoItem
                  icon={FiAlertCircle}
                  label="Validation"
                  value={<StatusBadge status={certificat.statut_validation} />}
                />
              )}
              {certificat.document_path && (
                <InfoItem icon={FiPaperclip} label="Document">
                  <button
                    type="button"
                    onClick={handleViewDocument}
                    disabled={openingDocument}
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-block disabled:opacity-50"
                  >
                    {openingDocument ? "Ouverture..." : "Voir le document"}
                  </button>
                </InfoItem>
              )}
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={certificat.type_certificat}
        subtitle={`N°${certificat.id_certificat} • ${
          adherent ? `${adherent.nom} ${adherent.prenom}` : `N°${certificat.num_adherent}`
        }`}
        icon={FiFile}
        headerExtra={headerExtra}
        pages={pages}
      />

      {showRejectModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl">
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
          </div>
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

      <PdfPreviewModal
        isOpen={!!documentPreview}
        onClose={closeDocumentPreview}
        blobUrl={documentPreview?.blobUrl}
        filename={documentPreview?.filename}
      />
    </>
  );
};

export default CertificatDetails;
