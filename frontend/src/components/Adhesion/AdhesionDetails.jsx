import React, { useState, useRef, useEffect } from "react";
import ModalLink from "../Common/ModalLink";
import toast from "react-hot-toast";
import {
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiCreditCard,
  FiEdit,
  FiTag,
  FiClock,
  FiHash,
  FiAlertCircle,
  FiTrash2,
  FiCheckCircle,
  FiAward,
  FiPaperclip,
  FiDownload,
  FiPlusCircle,
} from "react-icons/fi";
import { useAdhesions } from "../../hooks/Adhesion/useAdhesions";
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
import EcheancierCard from "../Echeancier/EcheancierCard";
import { formatDate, formatCurrency } from "../../utils/helpers";
import adhesionService from "../../services/Adhesion/adhesionService";
import { MODE_PAIEMENT_OPTIONS } from "../../utils/constants";

// Fiche adhésion, modale par-dessus la liste (voir MoniteurDetails.jsx pour
// le prototype d'origine et DetailsModal.jsx pour la coquille commune). Les
// formulaires d'action (paiement, rejet) restent des overlays indépendants
// des pages de la modale, comme ConfirmModal.
const AdhesionDetails = () => {
  const modal = useDetailsModal("/adhesions");
  const { id } = modal;
  const { hasRole } = useAuth();
  const canManageAdhesion = hasRole(["president", "tresorier"]);
  const { useGetById, useRemove, useEnregistrerPaiement, useValider } = useAdhesions();
  // Seule l'adhésion "Club" a un tarif/paiement suivi dans l'app : la
  // licence FFESM et les assurances sont couvertes par cette cotisation.
  const { useGetAll } = useAdherents();
  const { data, isLoading } = useGetById(id);
  const { data: adherentsData } = useGetAll({}, { enabled: !!id });
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
  const [pdfPreview, setPdfPreview] = useState(null);
  // "checking" tant que la vérification n'a pas répondu, "ok"/"missing"
  // ensuite — voir le useEffect plus bas pour le raisonnement (remplace un
  // essai d'ouverture en blob dans un nouvel onglet, qui s'est révélé peu
  // fiable pour naviguer une fenêtre tierce).
  const [documentStatus, setDocumentStatus] = useState("checking");
  // Même principe pour le verso, indépendant du recto (voir
  // models/Adhesion.js document_path_verso côté vie-associative-service —
  // facultatif, peut être absent même quand le recto existe).
  const [documentStatusVerso, setDocumentStatusVerso] = useState("checking");
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

  const adhesion = data?.data;

  const closePdfPreview = () => {
    if (pdfPreview?.blobUrl) window.URL.revokeObjectURL(pdfPreview.blobUrl);
    setPdfPreview(null);
  };

  // Aperçu (PdfPreviewModal, voir AdherentDetails.jsx pour le même principe
  // sur carnet/attestation de plongée) plutôt qu'un téléchargement direct —
  // l'aperçu a son propre bouton "Télécharger" une fois le document affiché.
  const handlePreviewAttestation = async () => {
    setDownloading(true);
    try {
      const { blobUrl, filename } = await adhesionService.previewAttestation(
        adhesion.num_adherent,
        adhesion.annee_adhesion,
      );
      setPdfPreview({ blobUrl, filename });
    } catch (error) {
      toast.error("Erreur lors du chargement de l'attestation");
    } finally {
      setDownloading(false);
    }
  };

  const adherent = adherentsData?.data?.find(
    (a) => a.num_adherent === adhesion?.num_adherent,
  );

  // Vérifie que le fichier existe encore avant même d'afficher le lien,
  // plutôt que de laisser cliquer puis échouer silencieusement. Fait exprès
  // en <a href> natif (pas de window.open()+blob() : ouvrir un onglet vide
  // puis le faire naviguer par-dessus depuis la fenêtre d'origine s'est
  // révélé peu fiable pour afficher quoi que ce soit, y compris avec une
  // URL bien accessible — un lien classique, lui, fonctionne toujours) ;
  // le document n'étant pas chiffré (contrairement aux certificats médicaux),
  // rien n'empêche de le pointer directement sans passer par une route
  // authentifiée.
  useEffect(() => {
    if (!adhesion?.document_path) return;
    let cancelled = false;
    setDocumentStatus("checking");
    fetch(adhesion.document_path, { method: "HEAD" })
      .then((res) => {
        if (!cancelled) setDocumentStatus(res.ok ? "ok" : "missing");
      })
      .catch(() => {
        if (!cancelled) setDocumentStatus("missing");
      });
    return () => {
      cancelled = true;
    };
  }, [adhesion?.document_path]);

  // Même vérification, indépendante, pour le verso.
  useEffect(() => {
    if (!adhesion?.document_path_verso) return;
    let cancelled = false;
    setDocumentStatusVerso("checking");
    fetch(adhesion.document_path_verso, { method: "HEAD" })
      .then((res) => {
        if (!cancelled) setDocumentStatusVerso(res.ok ? "ok" : "missing");
      })
      .catch(() => {
        if (!cancelled) setDocumentStatusVerso("missing");
      });
    return () => {
      cancelled = true;
    };
  }, [adhesion?.document_path_verso]);

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

  if (isLoading || !adhesion) {
    return (
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={isLoading ? "Chargement…" : "Adhésion non trouvée"}
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
                L&apos;adhésion que vous recherchez n&apos;existe pas ou a été
                supprimée.
              </p>
            ),
          },
        ]}
      />
    );
  }

  const isClub = adhesion.type === "Club";
  const isRejected = adhesion.statut_validation === "Rejeté";
  // Tant que le président/trésorier n'a pas validé la soumission, "À jour"/
  // "Expirée" n'a pas de sens : ce n'est pas encore un dossier accepté par
  // le club. Idem pour "Modifier" plus bas : le corriger directement
  // court-circuiterait le circuit rejet/resoumission.
  const isPending = adhesion.statut_validation === "En attente";

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

  const headerExtra = (
    <>
      {/* Pas encore acceptée : une attestation ne doit pas pouvoir être
          produite pour une soumission qui attend toujours une décision du
          président/trésorier. */}
      {!isPending && (
        <button
          onClick={handlePreviewAttestation}
          disabled={downloading}
          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors disabled:opacity-60"
          title="Attestation"
        >
          <FiDownload className="w-4 h-4" />
        </button>
      )}
      {isClub && canManageAdhesion && adhesion.statut_paiement === "Partiel" && (
        <button
          onClick={() => setShowPaiementModal(true)}
          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-colors"
          title="Enregistrer un paiement"
        >
          <FiPlusCircle className="w-4 h-4" />
        </button>
      )}
      {canManageAdhesion && (
        <>
          {/* Verrouillé côté serveur une fois validé, mais seulement pour
              une soumission adhérent (voir AdhesionService.update/delete) —
              une adhésion créée par le staff reste modifiable comme avant. */}
          {!(adhesion.soumis_par_adherent && adhesion.statut_validation === "Validé") && (
            <>
              {!isPending && (
                <ModalLink
                  to={`/adhesions/edit/${adhesion.id_adhesion}`}
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
      )}
    </>
  );

  const pages = [
    {
      label: "Vue d'ensemble",
      icon: FiCreditCard,
      content: (
        <div className="space-y-4">
          {/* Décision en attente : valider/rejeter est l'action prioritaire
              sur cette fiche, mise en avant en haut de page plutôt que
              noyée dans l'en-tête. */}
          {canManageAdhesion && isPending && (
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

          {isRejected && adhesion.motif_rejet && (
            <p className="text-sm text-red-600 dark:text-red-400 italic">
              Motif du rejet : {adhesion.motif_rejet}
            </p>
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
            </div>
            <div className="space-y-1">
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
                value={
                  <span className="flex items-center gap-2">
                    {formatDate(adhesion.date_fin)}
                    {!isRejected && !isPending && (
                      <StatusBadge status={adhesion.statut} />
                    )}
                  </span>
                }
              />
              <InfoItem
                icon={FiHash}
                label="N° Licence FFESM"
                value={adhesion.num_licence_ffesm || "Non renseigné"}
              />
              {(adhesion.document_path || adhesion.document_path_verso) && (
                <InfoItem icon={FiPaperclip} label="Document">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {adhesion.document_path &&
                      (documentStatus === "missing" ? (
                        <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-sm font-medium">
                          <FiAlertCircle className="w-4 h-4" />
                          Recto introuvable — à re-téléverser
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={documentStatus === "checking"}
                          onClick={() =>
                            setPdfPreview({
                              blobUrl: adhesion.document_path,
                              filename:
                                adhesion.document_path.split("/").pop() || "document",
                            })
                          }
                          className={`font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-block disabled:opacity-50 ${
                            documentStatus === "checking" ? "pointer-events-none" : ""
                          }`}
                        >
                          {documentStatus === "checking"
                            ? "Vérification..."
                            : adhesion.document_path_verso
                              ? "Voir le recto"
                              : "Voir le document"}
                        </button>
                      ))}
                    {adhesion.document_path_verso &&
                      (documentStatusVerso === "missing" ? (
                        <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-sm font-medium">
                          <FiAlertCircle className="w-4 h-4" />
                          Verso introuvable — à re-téléverser
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={documentStatusVerso === "checking"}
                          onClick={() =>
                            setPdfPreview({
                              blobUrl: adhesion.document_path_verso,
                              filename:
                                adhesion.document_path_verso.split("/").pop() ||
                                "document-verso",
                            })
                          }
                          className={`font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-block disabled:opacity-50 ${
                            documentStatusVerso === "checking" ? "pointer-events-none" : ""
                          }`}
                        >
                          {documentStatusVerso === "checking" ? "Vérification..." : "Voir le verso"}
                        </button>
                      ))}
                  </div>
                </InfoItem>
              )}
            </div>
          </div>
        </div>
      ),
    },
  ];

  if (isClub) {
    pages.push({
      label: "Paiement",
      icon: FiDollarSign,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            <InfoItem
              icon={FiDollarSign}
              label="Montant"
              value={formatCurrency(adhesion.montant)}
              highlight
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
          </div>

          <div
            className={`flex items-center gap-3 p-3 rounded-xl border ${getStatutColor(adhesion.statut_paiement)}`}
          >
            <FiCheckCircle
              className={`w-5 h-5 flex-shrink-0 ${
                adhesion.statut_paiement === "Payé"
                  ? "text-green-600 dark:text-green-400"
                  : adhesion.statut_paiement === "Annulé"
                    ? "text-red-600 dark:text-red-400"
                    : adhesion.statut_paiement === "Remboursé"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-yellow-600 dark:text-yellow-400"
              }`}
            />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {adhesion.statut_paiement === "Payé" &&
                "Le paiement a été effectué avec succès"}
              {adhesion.statut_paiement === "En attente" &&
                "En attente de réception du paiement"}
              {adhesion.statut_paiement === "Annulé" &&
                "Le paiement a été annulé"}
              {adhesion.statut_paiement === "Remboursé" &&
                "Le paiement a été remboursé"}
            </p>
          </div>

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
        </div>
      ),
    });
  }

  return (
    <>
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={`Adhésion ${adhesion.annee_adhesion}`}
        subtitle={`${adhesion.type} • ${
          adherent ? `${adherent.nom} ${adherent.prenom}` : `N°${adhesion.num_adherent}`
        }`}
        icon={FiCreditCard}
        headerExtra={headerExtra}
        pages={pages}
      />

      {showPaiementModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleEnregistrerPaiement}
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
          </form>
        </ModalOverlay>
      )}

      {showRejectModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl">
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
          </div>
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

      <PdfPreviewModal
        isOpen={!!pdfPreview}
        onClose={closePdfPreview}
        blobUrl={pdfPreview?.blobUrl}
        filename={pdfPreview?.filename}
      />
    </>
  );
};

export default AdhesionDetails;
