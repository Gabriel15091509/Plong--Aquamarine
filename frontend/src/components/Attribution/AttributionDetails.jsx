import React, { useState } from "react";
import ModalLink from "../Common/ModalLink";
import {
  FiPackage,
  FiCalendar,
  FiEdit,
  FiUser,
  FiAlertCircle,
  FiTrash2,
  FiCheckCircle,
  FiClock,
  FiInfo,
  FiTag,
  FiDollarSign,
  FiShield,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useAttributions } from "../../hooks/Attribution/useAttributions";
import { useMateriels } from "../../hooks/Materiel/useMateriels";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useDetailsModal } from "../../hooks/useFormModal";
import DetailsModal from "../Common/DetailsModal";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";
import ConfirmModal from "../Common/ConfirmModal";
import { formatDate, formatDateForInput, formatCurrency } from "../../utils/helpers";
import { ETAT_MATERIEL_OPTIONS, MODE_PAIEMENT_OPTIONS } from "../../utils/constants";

// Fiche attribution, modale par-dessus la liste (voir MoniteurDetails.jsx
// pour le prototype d'origine et DetailsModal.jsx pour la coquille commune).
// Les formulaires d'action (retour, caution, détérioration) restent des
// panneaux/overlays indépendants des pages de la modale — ils s'affichent
// par-dessus quelle que soit la page consultée, comme ConfirmModal.
const AttributionDetails = () => {
  const modal = useDetailsModal("/attributions");
  const { id } = modal;
  const { hasRole } = useAuth();
  // Même garde que AttributionList.jsx (canManageAttribution) : un
  // moniteur/adhérent qui ouvre cette fiche depuis la liste (désormais
  // accessible en lecture, voir AttributionService.getAll côté backend) n'a
  // ici qu'une consultation — modifier/supprimer/retour/caution/
  // détérioration restent présidentiels.
  const canManageAttribution = hasRole(["president"]);
  const {
    useGetById,
    useRemove,
    useRetour,
    useEnregistrerCaution,
    useRestituerCaution,
    useTraiterDeterioration,
  } = useAttributions();
  const { useGetById: useGetMateriel } = useMateriels();
  const { useGetAll: useGetAllAdherents } = useAdherents();
  const { useGetById: useGetSortie } = useSorties();
  const { data, isLoading } = useGetById(id);
  const remove = useRemove();
  const retour = useRetour();
  const enregistrerCaution = useEnregistrerCaution();
  const restituerCaution = useRestituerCaution();
  const traiterDeterioration = useTraiterDeterioration();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRetourForm, setShowRetourForm] = useState(false);
  const [etatRetour, setEtatRetour] = useState("Bon");
  const [dateRetourReel, setDateRetourReel] = useState(
    formatDateForInput(new Date()),
  );
  const [showCautionModal, setShowCautionModal] = useState(false);
  const [cautionForm, setCautionForm] = useState({ montant: "", mode: "Espèces" });
  const [showDeteriorationModal, setShowDeteriorationModal] = useState(false);
  const [deteriorationForm, setDeteriorationForm] = useState({
    description: "",
    prestataire: "",
    cout_reparation: "",
  });

  const attribution = data?.data;
  const { data: materielData } = useGetMateriel(attribution?.num_inventaire);
  const materiel = materielData?.data;
  const { data: adherentsData } = useGetAllAdherents({}, { enabled: !!id });
  const adherent = adherentsData?.data?.find(
    (a) => a.num_adherent === attribution?.num_adherent,
  );
  const { data: sortieData } = useGetSortie(attribution?.id_sortie);
  const sortie = sortieData?.data;

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      setShowDeleteModal(false);
      modal.close();
    } catch (error) {
      // toast déjà géré par le hook useRemove
    }
  };

  const handleRetour = async () => {
    try {
      await retour.mutateAsync({
        id,
        data: { etat_retour: etatRetour, date_retour_reel: dateRetourReel },
      });
      setShowRetourForm(false);
    } catch (error) {
      // toast déjà géré par le hook useRetour
    }
  };

  const handleEnregistrerCaution = async (e) => {
    e.preventDefault();
    try {
      await enregistrerCaution.mutateAsync({
        id,
        data: { montant: parseFloat(cautionForm.montant), mode: cautionForm.mode },
      });
      setShowCautionModal(false);
      setCautionForm({ montant: "", mode: "Espèces" });
    } catch (error) {
      // toast déjà géré par le hook
    }
  };

  const handleRestituerCaution = async () => {
    try {
      await restituerCaution.mutateAsync(id);
    } catch (error) {
      // toast déjà géré par le hook
    }
  };

  const handleTraiterDeterioration = async (e) => {
    e.preventDefault();
    try {
      await traiterDeterioration.mutateAsync({
        id,
        data: {
          description: deteriorationForm.description,
          prestataire: deteriorationForm.prestataire,
          cout_reparation: parseFloat(deteriorationForm.cout_reparation),
        },
      });
      setShowDeteriorationModal(false);
      setDeteriorationForm({ description: "", prestataire: "", cout_reparation: "" });
    } catch (error) {
      // toast déjà géré par le hook
    }
  };

  const headerExtra = attribution && canManageAttribution && (
    <>
      <ModalLink
        to={`/attributions/edit/${attribution.id_attribution}`}
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
  );

  if (isLoading || !attribution) {
    return (
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={isLoading ? "Chargement…" : "Attribution non trouvée"}
        icon={FiPackage}
        pages={[
          {
            label: "",
            content: isLoading ? (
              <div className="flex items-center justify-center py-10">
                <LoadingSpinner variant="details" />
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">
                L&apos;attribution que vous recherchez n&apos;existe pas ou a
                été supprimée.
              </p>
            ),
          },
        ]}
      />
    );
  }

  const isEnCours = !attribution.date_retour_reel;
  const isEnRetard = isEnCours && new Date(attribution.date_retour_prevue) < new Date();

  const pages = [
    {
      label: "Détails",
      icon: FiInfo,
      content: (
        <div className="space-y-4">
          {/* Bandeau statut, compact */}
          <div
            className={`rounded-xl p-3 border flex items-center justify-between gap-3 flex-wrap ${
              isEnRetard
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                : isEnCours
                  ? "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800"
                  : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  isEnRetard
                    ? "bg-red-100 dark:bg-red-900/30"
                    : isEnCours
                      ? "bg-cyan-100 dark:bg-cyan-900/30"
                      : "bg-green-100 dark:bg-green-900/30"
                }`}
              >
                {isEnRetard ? (
                  <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                ) : isEnCours ? (
                  <FiClock className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                ) : (
                  <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">
                  {isEnRetard ? "En retard" : isEnCours ? "En cours" : "Retourné"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isEnCours
                    ? `Retour prévu le ${formatDate(attribution.date_retour_prevue)}`
                    : `Retourné le ${formatDate(attribution.date_retour_reel)}`}
                </p>
              </div>
            </div>
            {isEnCours && canManageAttribution && (
              <button
                onClick={() => setShowRetourForm((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150"
              >
                <FiCheckCircle className="w-4 h-4" />
                Enregistrer le retour
              </button>
            )}
          </div>

          {showRetourForm && canManageAttribution && (
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    État au retour
                  </label>
                  <select
                    value={etatRetour}
                    onChange={(e) => setEtatRetour(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {ETAT_MATERIEL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Date de retour réel
                  </label>
                  <input
                    type="date"
                    value={dateRetourReel}
                    onChange={(e) => setDateRetourReel(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowRetourForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRetour}
                  disabled={retour.isPending}
                  className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-60"
                >
                  Confirmer le retour
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <FiUser className="text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">Adhérent :</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {adherent ? `${adherent.nom} ${adherent.prenom}` : attribution.num_adherent}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FiPackage className="text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">Matériel :</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {materiel ? `${materiel.marque} ${materiel.modele}` : attribution.num_inventaire}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FiCalendar className="text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">Date d&apos;attribution :</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatDate(attribution.date_attribution)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FiPackage className="text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">Sortie :</span>
              {attribution.id_sortie ? (
                <ModalLink
                  to={`/sorties/${attribution.id_sortie}`}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {sortie ? `${sortie.type} - ${sortie.lieu}` : `#${attribution.id_sortie}`}
                </ModalLink>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  Prêt (sans sortie)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <FiTag className="text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">État au départ :</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {attribution.etat_depart}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FiCalendar className="text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">Retour prévu :</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatDate(attribution.date_retour_prevue)}
              </span>
            </div>
            {attribution.date_retour_reel && (
              <>
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">Retour réel :</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDate(attribution.date_retour_reel)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FiTag className="text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">État au retour :</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {attribution.etat_retour}
                  </span>
                </div>
              </>
            )}
            {attribution.constat_deterioration && (
              <div className="flex items-center gap-2 sm:col-span-2">
                <FiAlertCircle className="text-red-400" />
                <span className="text-gray-500 dark:text-gray-400">Constat de détérioration :</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {attribution.constat_deterioration}
                </span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      label: "Caution",
      icon: FiShield,
      content: (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {attribution.statut_caution === "Aucune" && canManageAttribution && (
              <button
                onClick={() => setShowCautionModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150"
              >
                <FiDollarSign className="w-4 h-4" />
                Enregistrer la caution
              </button>
            )}
            {attribution.statut_caution === "Payée" && !isEnCours && canManageAttribution && (
              <>
                <button
                  onClick={handleRestituerCaution}
                  disabled={restituerCaution.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors duration-150 disabled:opacity-60"
                >
                  <FiCheckCircle className="w-4 h-4" />
                  Restituer la caution
                </button>
                <button
                  onClick={() => setShowDeteriorationModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors duration-150"
                >
                  <FiAlertCircle className="w-4 h-4" />
                  Traiter une détérioration
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <FiDollarSign className="text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">Montant :</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {attribution.montant_caution ? formatCurrency(attribution.montant_caution) : "Non renseigné"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FiShield className="text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">Statut :</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {attribution.statut_caution}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <FiShield className="text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">Pièce d&apos;identité retenue :</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {attribution.piece_identite_retenue || "Aucune"}
              </span>
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
        title={`Attribution N°${attribution.id_attribution}`}
        subtitle={`${
          materiel ? `${materiel.marque} ${materiel.modele}` : `Matériel #${attribution.num_inventaire}`
        } → ${adherent ? `${adherent.nom} ${adherent.prenom}` : `Adhérent #${attribution.num_adherent}`}`}
        icon={FiPackage}
        headerExtra={headerExtra}
        pages={pages}
      />

      {showCautionModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleEnregistrerCaution}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Enregistrer la caution
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Montant (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={cautionForm.montant}
                  onChange={(e) =>
                    setCautionForm((prev) => ({ ...prev, montant: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Mode de paiement
                </label>
                <select
                  value={cautionForm.mode}
                  onChange={(e) =>
                    setCautionForm((prev) => ({ ...prev, mode: e.target.value }))
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
                onClick={() => setShowCautionModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {showDeteriorationModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleTraiterDeterioration}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Traiter une détérioration
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Caution actuelle :{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(attribution.montant_caution || 0)}
              </span>
              . La caution couvrira tout ou partie du coût de réparation ; le
              reliquat éventuel sera à restituer, le complément éventuel à réclamer.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Description de la panne *
                </label>
                <textarea
                  required
                  rows={3}
                  value={deteriorationForm.description}
                  onChange={(e) =>
                    setDeteriorationForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Prestataire *
                </label>
                <input
                  type="text"
                  required
                  value={deteriorationForm.prestataire}
                  onChange={(e) =>
                    setDeteriorationForm((prev) => ({ ...prev, prestataire: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Coût de réparation (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={deteriorationForm.cout_reparation}
                  onChange={(e) =>
                    setDeteriorationForm((prev) => ({ ...prev, cout_reparation: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDeteriorationModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors duration-150"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        message="Êtes-vous sûr de vouloir supprimer cette attribution ?"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};

export default AttributionDetails;
