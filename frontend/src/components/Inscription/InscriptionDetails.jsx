import React, { useMemo, useState, useRef } from "react";
import ModalLink from "../Common/ModalLink";
import toast from "react-hot-toast";
import {
  FiEdit,
  FiUser,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiTag,
  FiDroplet,
  FiAward,
  FiUsers,
  FiAnchor,
  FiFileText,
  FiAlertCircle,
  FiBarChart2,
  FiDollarSign,
  FiPlusCircle,
} from "react-icons/fi";
import { useInscriptions } from "../../hooks/Inscription/useInscriptions";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useAuth } from "../../context/AuthContext";
import { useDetailsModal } from "../../hooks/useFormModal";
import DetailsModal from "../Common/DetailsModal";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";
import StatusBadge from "../Common/StatusBadge";
import InfoItem from "../Common/InfoItem";
import { photoUrl } from "../../utils/photoUrl";
import EcheancierCard from "../Echeancier/EcheancierCard";
import { formatDate, formatDateTime, formatCurrency } from "../../utils/helpers";
import { MODE_PAIEMENT_OPTIONS, STATUT_INSCRIPTION } from "../../utils/constants";

// Fiche inscription, modale par-dessus la liste (voir MoniteurDetails.jsx
// pour le prototype d'origine et DetailsModal.jsx pour la coquille commune).
const InscriptionDetails = () => {
  const modal = useDetailsModal("/inscriptions");
  const inscriptionId = modal.id ? parseInt(modal.id) : undefined;

  const { hasRole } = useAuth();
  // "moniteur" retiré : les deux usages de ce flag plus bas (bouton
  // "Enregistrer un paiement" et gestion de l'échéancier) sont des actions
  // financières, réservées à président/trésorier partout ailleurs dans
  // l'appli (canManagePaiement dans PaiementList.jsx, permission
  // manage_paiements côté backend — voir AuthController.getPermissionsForRole,
  // absente du rôle moniteur) — le nom "canManage" laissait croire que
  // c'était une gestion générale de l'inscription, alors que le moniteur
  // gère bien les inscriptions elles-mêmes (confirmer/annuler, voir
  // InscriptionRow.jsx) mais pas leurs paiements.
  const canManagePaiement = hasRole(["president", "tresorier"]);
  const { useGetById: useGetInscriptionById, useEnregistrerPaiement, useConfirm } =
    useInscriptions();
  const { useGetById: useGetAdherentById } = useAdherents();
  const { useGetById: useGetSortieById } = useSorties();
  const enregistrerPaiement = useEnregistrerPaiement();
  const confirmInscription = useConfirm();
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [paiementForm, setPaiementForm] = useState({ montant: "", mode: "Espèces" });
  const submittingPaiementRef = useRef(false);

  const handleEnregistrerPaiement = async (e) => {
    e.preventDefault();
    if (submittingPaiementRef.current) return;
    submittingPaiementRef.current = true;
    try {
      await enregistrerPaiement.mutateAsync({
        id: inscriptionId,
        data: { montant: parseFloat(paiementForm.montant), mode: paiementForm.mode },
      });
      setShowPaiementModal(false);
      setPaiementForm({ montant: "", mode: "Espèces" });
    } catch (error) {
      // toast déjà géré par le hook
    } finally {
      submittingPaiementRef.current = false;
    }
  };

  // useConfirm (partagé avec InscriptionList.jsx, action "gestionnaire")
  // n'affiche aucun toast lui-même — géré ici, comme handleConfirm dans
  // InscriptionList.jsx.
  const handleReconfirmer = async () => {
    try {
      await confirmInscription.mutateAsync(inscriptionId);
      toast.success("Inscription reconfirmée avec succès");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de la reconfirmation",
      );
    }
  };

  const {
    data: inscriptionData,
    isLoading: isLoadingInscription,
    error: inscriptionError,
  } = useGetInscriptionById(inscriptionId);

  const numAdherent = useMemo(() => {
    if (!inscriptionData?.data) return null;
    return inscriptionData.data.num_adherent;
  }, [inscriptionData]);

  const idSortie = useMemo(() => {
    if (!inscriptionData?.data) return null;
    return inscriptionData.data.id_sortie;
  }, [inscriptionData]);

  const {
    data: adherentData,
    isLoading: isLoadingAdherent,
    error: adherentError,
  } = useGetAdherentById(numAdherent, { enabled: !!numAdherent });

  const {
    data: sortieData,
    isLoading: isLoadingSortie,
    error: sortieError,
  } = useGetSortieById(idSortie, { enabled: !!idSortie });

  const inscription = useMemo(() => inscriptionData?.data || null, [inscriptionData]);
  const adherent = useMemo(() => adherentData?.data || null, [adherentData]);
  const sortie = useMemo(() => sortieData?.data || null, [sortieData]);

  const isLoading = isLoadingInscription || isLoadingAdherent || isLoadingSortie;
  const error = inscriptionError || adherentError || sortieError;

  const headerExtra = inscription && (
    <>
      {canManagePaiement &&
        Number(inscription.montant_du) > 0 &&
        !inscription.paye &&
        !(sortie?.statut === "Annulée" || inscription.statut === STATUT_INSCRIPTION.ANNULEE) && (
        <button
          onClick={() => setShowPaiementModal(true)}
          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-colors"
          title="Enregistrer un paiement"
        >
          <FiPlusCircle className="w-4 h-4" />
        </button>
      )}
      <ModalLink
        to={`/inscriptions/edit/${inscription.id_inscription}`}
        className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
        title="Modifier l'inscription"
      >
        <FiEdit className="w-4 h-4" />
      </ModalLink>
    </>
  );

  if (isLoading || error || !inscription) {
    return (
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={isLoading ? "Chargement…" : error ? "Erreur" : "Inscription non trouvée"}
        icon={FiFileText}
        pages={[
          {
            label: "",
            content: isLoading ? (
              <div className="flex items-center justify-center py-10">
                <LoadingSpinner variant="details" />
              </div>
            ) : error ? (
              <div className="text-center py-10">
                <FiAlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  {/* Jamais error.message (technique : "Network Error",
                      "timeout of 30000ms exceeded"...) — error?.message
                      était quasi toujours vrai, ce texte générique ne
                      s'affichait donc en pratique jamais. */}
                  Une erreur est survenue lors du chargement des données.
                  Vérifiez votre connexion et réessayez dans un instant.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">
                L&apos;inscription que vous recherchez n&apos;existe pas ou a
                été supprimée.
              </p>
            ),
          },
        ]}
      />
    );
  }

  const getStatutColor = (statut) => {
    const colors = {
      [STATUT_INSCRIPTION.CONFIRMEE]:
        "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      [STATUT_INSCRIPTION.ANNULEE]:
        "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      [STATUT_INSCRIPTION.LISTE_ATTENTE]:
        "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
      [STATUT_INSCRIPTION.EN_ATTENTE]:
        "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    };
    return colors[statut] || colors[STATUT_INSCRIPTION.EN_ATTENTE];
  };

  const getStatutIcon = (statut) => {
    const icons = {
      [STATUT_INSCRIPTION.CONFIRMEE]: FiCheckCircle,
      [STATUT_INSCRIPTION.ANNULEE]: FiXCircle,
      [STATUT_INSCRIPTION.LISTE_ATTENTE]: FiClock,
      [STATUT_INSCRIPTION.EN_ATTENTE]: FiClock,
    };
    return icons[statut] || FiClock;
  };

  const getStatutText = (statut) => {
    const texts = {
      [STATUT_INSCRIPTION.CONFIRMEE]: "L'inscription est confirmée et validée",
      [STATUT_INSCRIPTION.ANNULEE]: "L'inscription a été annulée",
      [STATUT_INSCRIPTION.LISTE_ATTENTE]: "En attente d'une place disponible",
      [STATUT_INSCRIPTION.EN_ATTENTE]: "En attente de confirmation par le moniteur",
    };
    return texts[statut] || "Statut inconnu";
  };

  // Posé par SortieService.replanifier quand la sortie, annulée météo, est
  // replanifiée : la place n'est plus garantie à la nouvelle date. Seul cas
  // où l'adhérent peut reconfirmer lui-même (voir InscriptionService.
  // confirmInscription).
  const doitReconfirmer =
    inscription.reconfirmation_requise && inscription.statut === STATUT_INSCRIPTION.EN_ATTENTE;

  const StatutIcon = getStatutIcon(inscription.statut);

  // Sortie annulée après coup, ou inscription elle-même annulée (l'adhérent
  // s'est désisté) : dans les deux cas, plus aucun paiement ne doit être
  // activement réclamé.
  const paiementARegulariser =
    sortie?.statut === "Annulée" || inscription.statut === STATUT_INSCRIPTION.ANNULEE;

  const pages = [
    {
      label: "Vue d'ensemble",
      icon: FiFileText,
      content: (
        <div className="space-y-4">
          {paiementARegulariser && Number(inscription.montant_du) > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2.5">
              <FiAlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">
                <span className="font-semibold">
                  {sortie?.statut === "Annulée"
                    ? "Cette sortie a été annulée après cette inscription."
                    : "Cette inscription a été annulée."}
                </span>{" "}
                Les montants ci-dessous reflètent la situation avant
                l&apos;annulation ; un remboursement ou un avoir doit être
                géré manuellement.
              </p>
            </div>
          )}

          {/* Bandeau statut, compact */}
          <div
            className={`rounded-xl p-3 border flex items-center justify-between gap-3 flex-wrap ${getStatutColor(inscription.statut)}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  inscription.statut === STATUT_INSCRIPTION.CONFIRMEE
                    ? "bg-green-100 dark:bg-green-900/30"
                    : inscription.statut === STATUT_INSCRIPTION.ANNULEE
                      ? "bg-red-100 dark:bg-red-900/30"
                      : "bg-yellow-100 dark:bg-yellow-900/30"
                }`}
              >
                <StatutIcon
                  className={`w-5 h-5 ${
                    inscription.statut === STATUT_INSCRIPTION.CONFIRMEE
                      ? "text-green-600 dark:text-green-400"
                      : inscription.statut === STATUT_INSCRIPTION.ANNULEE
                        ? "text-red-600 dark:text-red-400"
                        : "text-yellow-600 dark:text-yellow-400"
                  }`}
                />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">
                  {inscription.statut}
                  {inscription.rang_liste_attente && ` — Rang N°${inscription.rang_liste_attente}`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {doitReconfirmer
                    ? "La sortie a été replanifiée après une annulation météo : votre place n'est plus garantie, merci de reconfirmer."
                    : getStatutText(inscription.statut)}
                </p>
              </div>
            </div>
            {doitReconfirmer && (
              <button
                onClick={handleReconfirmer}
                disabled={confirmInscription.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                <FiCheckCircle className="w-4 h-4" />
                Reconfirmer
              </button>
            )}
          </div>

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
                      {adherent.civilite} {adherent.prenom} {adherent.nom}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      N°{adherent.num_adherent}
                    </p>
                  </div>
                ) : (
                  <p className="font-semibold text-gray-900 dark:text-white">
                    N°{inscription.num_adherent}
                  </p>
                )}
              </InfoItem>
              {adherent && (
                <>
                  <InfoItem
                    icon={FiAward}
                    label="Niveau de plongée"
                    value={adherent.niveau || "Non défini"}
                  />
                  <InfoItem icon={FiUsers} label="Email" value={adherent.email} />
                </>
              )}
              <InfoItem icon={FiCalendar} label="Sortie" highlight>
                {sortie ? (
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {sortie.type} - {sortie.lieu}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      N°{sortie.id_sortie} • {sortie.site}
                    </p>
                  </div>
                ) : (
                  <p className="font-semibold text-gray-900 dark:text-white">
                    N°{inscription.id_sortie}
                  </p>
                )}
              </InfoItem>
              {sortie && (
                <InfoItem
                  icon={FiDroplet}
                  label="Profondeur max"
                  value={`${sortie.profondeur_max || 0} mètres`}
                />
              )}
            </div>
            <div className="space-y-1">
              {sortie && (
                <>
                  <InfoItem
                    icon={FiCalendar}
                    label="Date et heure"
                    value={formatDateTime(sortie.date_heure)}
                  />
                  <InfoItem
                    icon={FiBarChart2}
                    label="Statut de la sortie"
                    value={<StatusBadge status={sortie.statut} />}
                  />
                </>
              )}
              <InfoItem
                icon={FiDollarSign}
                label="Montant dû"
                value={
                  Number(inscription.montant_du) > 0
                    ? formatCurrency(inscription.montant_du)
                    : "Gratuit"
                }
                highlight
              />
              {Number(inscription.montant_du) > 0 && (
                <>
                  <InfoItem
                    icon={FiDollarSign}
                    label="Montant payé / Solde restant"
                    value={`${formatCurrency(inscription.montant_paye || 0)} / ${formatCurrency(
                      Math.max((inscription.montant_du || 0) - (inscription.montant_paye || 0), 0),
                    )}`}
                  />
                  <InfoItem
                    icon={
                      inscription.paye
                        ? FiCheckCircle
                        : paiementARegulariser
                          ? FiAlertCircle
                          : FiClock
                    }
                    label="Statut du paiement"
                    value={
                      inscription.paye
                        ? "Payé"
                        : paiementARegulariser
                          ? "À régulariser (annulée)"
                          : "En attente / partiel"
                    }
                  />
                </>
              )}
              <InfoItem
                icon={FiCalendar}
                label="Date d'inscription"
                value={formatDate(inscription.date_inscription)}
              />
              <InfoItem
                icon={
                  !inscription.presence_checked
                    ? FiClock
                    : inscription.presence
                      ? FiCheckCircle
                      : FiXCircle
                }
                label="Présence"
                value={
                  !inscription.presence_checked
                    ? "Non pointé"
                    : inscription.presence
                      ? "Présent"
                      : "Absent"
                }
              />
              {inscription.date_confirmation && (
                <InfoItem
                  icon={FiCheckCircle}
                  label="Date de confirmation"
                  value={formatDate(inscription.date_confirmation)}
                />
              )}
              <InfoItem
                icon={FiTag}
                label="Référence"
                value={`INS-${String(inscription.id_inscription).padStart(4, "0")}`}
              />
            </div>
          </div>
        </div>
      ),
    },
  ];

  if (Number(inscription.montant_du) > 0) {
    pages.push({
      label: "Paiement",
      icon: FiDollarSign,
      content: (
        <EcheancierCard
          type_paiement="Sortie"
          reference_id={inscription.id_inscription}
          num_adherent={inscription.num_adherent}
          soldeRestant={Math.max(
            (inscription.montant_du || 0) - (inscription.montant_paye || 0),
            0,
          )}
          // Lecture seule si sortie/inscription annulée : consulter un
          // échéancier déjà créé reste utile, en créer un nouveau ou marquer
          // une échéance payée ne l'est plus (voir paiementARegulariser).
          canManage={canManagePaiement && !paiementARegulariser}
          ownerQueryKeys={[["inscriptions"], ["inscription", inscription.id_inscription]]}
        />
      ),
    });
  }

  return (
    <>
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={`Inscription N°${inscription.id_inscription}`}
        subtitle={`${
          adherent ? `${adherent.civilite} ${adherent.prenom} ${adherent.nom}` : `Adhérent N°${inscription.num_adherent}`
        } • ${sortie ? `${sortie.type} - ${sortie.lieu}` : `Sortie N°${inscription.id_sortie}`}`}
        icon={FiAnchor}
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
              Enregistrer un paiement
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Solde restant :{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(
                  Math.max((inscription.montant_du || 0) - (inscription.montant_paye || 0), 0),
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
                    setPaiementForm((prev) => ({ ...prev, montant: e.target.value }))
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
                    setPaiementForm((prev) => ({ ...prev, mode: e.target.value }))
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
    </>
  );
};

export default InscriptionDetails;
