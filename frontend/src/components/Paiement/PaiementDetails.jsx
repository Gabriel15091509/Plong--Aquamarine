import React, { useState } from "react";
import ModalLink from "../Common/ModalLink";
import toast from "react-hot-toast";
import {
  FiUser,
  FiDollarSign,
  FiCreditCard,
  FiFileText,
  FiHash,
  FiEdit,
  FiClock,
  FiTrash2,
  FiCalendar,
  FiAward,
  FiDownload,
  FiCheck,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";
import { usePaiements } from "../../hooks/Paiement/usePaiements";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useAuth } from "../../context/AuthContext";
import { useDetailsModal } from "../../hooks/useFormModal";
import DetailsModal from "../Common/DetailsModal";
import PdfPreviewModal from "../Common/PdfPreviewModal";
import LoadingSpinner from "../Common/LoadingSpinner";
import ConfirmModal from "../Common/ConfirmModal";
import InfoItem from "../Common/InfoItem";
import { photoUrl } from "../../utils/photoUrl";
import StatusBadge from "../Common/StatusBadge";
import { formatDate, formatCurrency } from "../../utils/helpers";
import ModalOverlay from "../Common/ModalOverlay";
import { MODE_PAIEMENT_OPTIONS } from "../../utils/constants";
import paiementService from "../../services/Paiement/paiementService";

// Fiche paiement, modale par-dessus la liste (voir MoniteurDetails.jsx pour
// le prototype d'origine et DetailsModal.jsx pour la coquille commune).
// Une seule page : peu d'informations, pas besoin de pagination.
const PaiementDetails = () => {
  const modal = useDetailsModal("/paiements");
  const { id } = modal;
  const { hasRole } = useAuth();
  const canManagePaiement = hasRole(["president", "tresorier"]);
  const { useGetById, useRemove, useProcess } = usePaiements();
  const { useGetAll } = useAdherents();
  const { data, isLoading } = useGetById(id);
  const { data: adherentsData } = useGetAll({}, { enabled: !!id });
  const remove = useRemove();
  const process = useProcess();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [showEnregistrer, setShowEnregistrer] = useState(false);
  const [saisie, setSaisie] = useState({
    montant: "",
    mode: "",
    reference_id: "",
    date_paiement: "",
  });

  const paiement = data?.data;
  const adherent = adherentsData?.data?.find(
    (a) => a.num_adherent === paiement?.num_adherent,
  );

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      setShowDeleteModal(false);
      modal.close();
    } catch (error) {
      console.error("Échec de la suppression du paiement :", error);
    }
  };

  // Enregistrer le règlement : petit formulaire prérempli avec les valeurs
  // du paiement (le trésorier ne change que ce qui diffère — montant
  // réellement reçu, mode, n° de chèque/virement, date d'encaissement), puis
  // PATCH /paiements/:id/process qui passe le statut à "Payé". Le toast de
  // succès et le rafraîchissement du cache sont dans useProcess.
  const ouvrirEnregistrer = () => {
    setSaisie({
      montant: paiement.montant ?? "",
      mode: paiement.mode || MODE_PAIEMENT_OPTIONS[0],
      reference_id: paiement.reference_id || "",
      date_paiement: new Date().toISOString().slice(0, 10),
    });
    setShowEnregistrer(true);
  };

  const handleEnregistrer = async (e) => {
    e.preventDefault();
    try {
      await process.mutateAsync({ id, ajustements: saisie });
      setShowEnregistrer(false);
    } catch (error) {
      console.error("Échec de l'enregistrement du paiement :", error);
    }
  };

  const peutEnregistrer =
    canManagePaiement && ["En attente", "Partiel"].includes(paiement?.statut);

  const closePdfPreview = () => {
    if (pdfPreview?.blobUrl) window.URL.revokeObjectURL(pdfPreview.blobUrl);
    setPdfPreview(null);
  };

  // Aperçu (PdfPreviewModal, voir AdherentDetails.jsx pour le même principe
  // sur carnet/attestation) plutôt qu'un téléchargement direct — l'aperçu a
  // son propre bouton "Télécharger" une fois le document affiché.
  const handlePreviewRecu = async () => {
    setDownloading(true);
    try {
      const { blobUrl, filename } = await paiementService.previewRecu(id);
      setPdfPreview({ blobUrl, filename });
    } catch (error) {
      toast.error("Erreur lors du chargement du reçu");
    } finally {
      setDownloading(false);
    }
  };

  const headerExtra = paiement && (
    <>
      <button
        onClick={handlePreviewRecu}
        disabled={downloading}
        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors disabled:opacity-60"
        title="Reçu"
      >
        <FiDownload className="w-4 h-4" />
      </button>
      {canManagePaiement && (
        <>
          <ModalLink
            to={`/paiements/edit/${paiement.id_paiement}`}
            className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
            title="Modifier"
          >
            <FiEdit className="w-4 h-4" />
          </ModalLink>
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

  if (isLoading || !paiement) {
    return (
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={isLoading ? "Chargement…" : "Paiement non trouvé"}
        icon={FiCreditCard}
        pages={[
          {
            label: "",
            content: isLoading ? (
              <div className="flex items-center justify-center py-10">
                <LoadingSpinner variant="details" />
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">
                Le paiement que vous recherchez n&apos;existe pas ou a été
                supprimé.
              </p>
            ),
          },
        ]}
      />
    );
  }

  const pages = [
    {
      label: "Détails",
      icon: FiCreditCard,
      content: (
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
                  N°{paiement.num_adherent}
                </p>
              )}
            </InfoItem>
            {adherent && (
              <InfoItem
                icon={FiAward}
                label="Niveau"
                value={adherent.niveau || "Non défini"}
              />
            )}
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
          </div>
          <div className="space-y-1">
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
          </div>
          {peutEnregistrer && (
            <div className="md:col-span-2 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Ce paiement de{" "}
                <span className="font-semibold">
                  {formatCurrency(paiement.montant)}
                </span>{" "}
                n&apos;est pas encore encaissé.
              </p>
              <button
                type="button"
                onClick={ouvrirEnregistrer}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                <FiCheck className="w-4 h-4" />
                Enregistrer le paiement
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={`Paiement ${paiement.type_paiement}`}
        subtitle={`N°${paiement.id_paiement} • ${
          adherent ? `${adherent.nom} ${adherent.prenom}` : `N°${paiement.num_adherent}`
        }`}
        icon={FiCreditCard}
        headerExtra={headerExtra}
        pages={pages}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        message={
          <>
            Êtes-vous sûr de vouloir supprimer ce paiement{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {paiement.type_paiement}
            </span>
            ?
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {showEnregistrer && (
        <ModalOverlay
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowEnregistrer(false)}
        >
          <form
            onSubmit={handleEnregistrer}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Enregistrer le paiement
              </h3>
              <button
                type="button"
                onClick={() => setShowEnregistrer(false)}
                aria-label="Fermer"
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Vérifiez les informations, modifiez ce qui diffère du
                règlement reçu, puis confirmez.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Montant reçu (€)</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={saisie.montant}
                    onChange={(e) => setSaisie({ ...saisie, montant: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Mode de paiement</span>
                  <select
                    value={saisie.mode}
                    onChange={(e) => setSaisie({ ...saisie, mode: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {MODE_PAIEMENT_OPTIONS.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Date d&apos;encaissement</span>
                  <input
                    type="date"
                    required
                    value={saisie.date_paiement}
                    onChange={(e) => setSaisie({ ...saisie, date_paiement: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Référence (n° chèque…)</span>
                  <input
                    type="text"
                    maxLength={50}
                    value={saisie.reference_id}
                    onChange={(e) => setSaisie({ ...saisie, reference_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </label>
              </div>
            </div>

            <div className="px-5 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEnregistrer(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={process.isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {process.isLoading ? (
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FiCheck className="w-4 h-4" />
                )}
                Confirmer l&apos;encaissement
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}

      <PdfPreviewModal
        isOpen={!!pdfPreview}
        onClose={closePdfPreview}
        blobUrl={pdfPreview?.blobUrl}
        filename={pdfPreview?.filename}
      />
    </>
  );
};

export default PaiementDetails;
