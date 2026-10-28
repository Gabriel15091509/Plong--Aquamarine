import React, { useState } from "react";
import ModalLink from "../Common/ModalLink";
import {
  FiUser,
  FiAward,
  FiCalendar,
  FiClock,
  FiList,
  FiFileText,
  FiEdit,
  FiAlertCircle,
  FiTrash2,
  FiBookOpen,
  FiTarget,
  FiUserCheck,
  FiDollarSign,
  FiPlusCircle,
  FiCheckSquare,
} from "react-icons/fi";
import { useFormations } from "../../hooks/Formation/useFormations";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useMoniteurs } from "../../hooks/Moniteur/useMoniteurs";
import { useAuth } from "../../context/AuthContext";
import { useDetailsModal } from "../../hooks/useFormModal";
import DetailsModal from "../Common/DetailsModal";
import LoadingSpinner from "../Common/LoadingSpinner";
import StatusBadge from "../Common/StatusBadge";
import ConfirmModal from "../Common/ConfirmModal";
import InfoItem from "../Common/InfoItem";
import { photoUrl } from "../../utils/photoUrl";
import FormationCompetences from "./FormationCompetences";
import FormationSeances from "./FormationSeances";
import FormationPaiementModal from "./FormationPaiementModal";
import EcheancierCard from "../Echeancier/EcheancierCard";
import { formatDate, formatCurrency } from "../../utils/helpers";
import { STATUT_PAIEMENT } from "../../utils/constants";

const getProgressionColor = (progress) => {
  if (progress >= 80) return "bg-green-500";
  if (progress >= 50) return "bg-cyan-600";
  if (progress >= 25) return "bg-amber-500";
  return "bg-red-500";
};

const getProgressionTextColor = (progress) => {
  if (progress >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (progress >= 50) return "text-blue-600 dark:text-blue-400";
  if (progress >= 25) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
};

// Fiche formation, modale par-dessus la liste (voir MoniteurDetails.jsx pour
// le prototype d'origine et DetailsModal.jsx pour la coquille commune).
// Plafonnée à 3 pages (voir DetailsModal.jsx) : Séances et Compétences
// restent chacune sur leur propre page (ce sont de vraies sous-listes avec
// leur propre gestion, pas de simples champs d'info à mettre côte à côte) ;
// tout le reste (adhérent/formation/paiement/évaluation) tient sur une
// seule page "Vue d'ensemble".
const FormationDetails = () => {
  const modal = useDetailsModal("/formations");
  const { id } = modal;
  const { useGetById, useRemove } = useFormations();
  const { useGetAll } = useAdherents();
  const { useGetAll: useGetAllMoniteurs } = useMoniteurs();
  const { user, hasRole } = useAuth();
  const canManage = hasRole(["president", "tresorier"]);
  const { data, isLoading } = useGetById(id);
  const { data: adherentsData } = useGetAll({}, { enabled: !!id });
  const { data: moniteursData } = useGetAllMoniteurs({}, { enabled: !!id });
  const remove = useRemove();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaiementModal, setShowPaiementModal] = useState(false);

  const formation = data?.data;
  const adherent = adherentsData?.data?.find(
    (a) => a.num_adherent === formation?.num_adherent,
  );
  const moniteur = moniteursData?.data?.find(
    (m) => m.id_moniteur === formation?.id_moniteur,
  );
  // Seul le moniteur assigné à CETTE formation (pas n'importe quel moniteur)
  // peut la modifier/supprimer, ou gérer ses séances/compétences — même
  // règle que FormationService.assertCanModifyFormation côté backend.
  const canManageFormation =
    hasRole(["president"]) ||
    (hasRole(["moniteur"]) && !!moniteur && moniteur.user_id === user?.id);

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      setShowDeleteModal(false);
      modal.close();
    } catch (error) {
      // toast déjà géré par le hook
    }
  };

  const headerExtra = formation && (
    <>
      {canManage && formation.statut_paiement === STATUT_PAIEMENT.PARTIEL && (
        <button
          onClick={() => setShowPaiementModal(true)}
          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-colors"
          title="Enregistrer un paiement"
        >
          <FiPlusCircle className="w-4 h-4" />
        </button>
      )}
      {canManageFormation && (
        <>
          {isClotureeFrom(formation) ? (
            <span
              className="p-2 text-gray-300 dark:text-gray-700 cursor-not-allowed"
              title="Formation terminée ou abandonnée : modification impossible"
            >
              <FiEdit className="w-4 h-4" />
            </span>
          ) : (
            <ModalLink
              to={`/formations/edit/${formation.id_formation}`}
              className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
              title="Modifier"
            >
              <FiEdit className="w-4 h-4" />
            </ModalLink>
          )}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            disabled={isClotureeFrom(formation)}
            title={
              isClotureeFrom(formation)
                ? "Formation terminée ou abandonnée : suppression impossible"
                : "Supprimer"
            }
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </>
      )}
    </>
  );

  if (isLoading || !formation) {
    return (
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={isLoading ? "Chargement…" : "Formation non trouvée"}
        icon={FiBookOpen}
        pages={[
          {
            label: "",
            content: isLoading ? (
              <div className="flex items-center justify-center py-10">
                <LoadingSpinner variant="details" />
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">
                La formation que vous recherchez n&apos;existe pas ou a été
                supprimée.
              </p>
            ),
          },
        ]}
      />
    );
  }

  const progression = formation.nb_seances_prevues
    ? Math.min(
        Math.round((formation.nb_seances_realisees / formation.nb_seances_prevues) * 100),
        100,
      )
    : 0;

  const pages = [
    {
      label: "Vue d'ensemble",
      icon: FiTarget,
      content: (
        <div className="space-y-3">
          {/* Bandeau progression, compact */}
          <div className="rounded-xl p-2.5 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {formation.nb_seances_realisees} /{" "}
                {formation.nb_seances_prevues ?? "?"} séances
              </span>
              <span
                className={`text-lg font-bold ${getProgressionTextColor(progression)}`}
              >
                {progression}%
              </span>
            </div>
            <div className="relative w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                style={{ width: `${progression}%` }}
                className={`h-full ${getProgressionColor(progression)} rounded-full transition-all duration-300`}
              />
            </div>
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
                      {adherent.civilite} {adherent.nom} {adherent.prenom}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      N°{adherent.num_adherent}
                    </p>
                  </div>
                ) : (
                  <p className="font-semibold text-gray-900 dark:text-white">
                    N°{formation.num_adherent}
                  </p>
                )}
              </InfoItem>
              {adherent && (
                <>
                  <InfoItem
                    icon={FiAward}
                    label="Niveau actuel"
                    value={adherent.niveau || "Non défini"}
                  />
                  <InfoItem
                    icon={FiUserCheck}
                    label="Email"
                    value={adherent.email}
                  />
                </>
              )}
            </div>
            <div className="space-y-1">
              <InfoItem
                icon={FiAward}
                label="Niveau visé"
                value={formation.niveau_vise}
                highlight
              />
              <InfoItem
                icon={FiUserCheck}
                label="Moniteur responsable"
                value={
                  moniteur?.user?.name || `Moniteur #${formation.id_moniteur}`
                }
              />
              <InfoItem
                icon={FiCalendar}
                label="Date de début"
                value={formatDate(formation.date_debut)}
              />
              <InfoItem
                icon={FiCalendar}
                label="Date de fin prévue"
                value={formatDate(formation.date_fin_prevue)}
              />
              <InfoItem
                icon={FiCalendar}
                label="Date de passage du brevet"
                value={formatDate(formation.date_examen_brevet)}
              />
              <InfoItem
                icon={FiClock}
                label="Statut"
                value={<StatusBadge status={formation.statut} />}
              />
            </div>
          </div>

          {/* Paiement — fusionné ici (plutôt qu'une page à part) pour
              rester sous la limite de 3 pages (voir DetailsModal.jsx). */}
          {formation.montant_total ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                <InfoItem
                  icon={FiDollarSign}
                  label="Montant total"
                  value={formatCurrency(formation.montant_total)}
                />
                <InfoItem
                  icon={FiDollarSign}
                  label="Montant payé / Solde restant"
                  value={`${formatCurrency(formation.montant_paye || 0)} / ${formatCurrency(
                    Math.max((formation.montant_total || 0) - (formation.montant_paye || 0), 0),
                  )}`}
                />
                <InfoItem
                  icon={FiClock}
                  label="Statut du paiement"
                  value={<StatusBadge status={formation.statut_paiement} />}
                />
              </div>
              <EcheancierCard
                type_paiement="Formation"
                reference_id={formation.id_formation}
                num_adherent={formation.num_adherent}
                soldeRestant={Math.max(
                  (formation.montant_total || 0) - (formation.montant_paye || 0),
                  0,
                )}
                canManage={canManage}
                ownerQueryKeys={[["formations"]]}
              />
            </>
          ) : (
            <InfoItem icon={FiDollarSign} label="Tarif" value="Gratuite" />
          )}

          {(formation.commentaire_moniteur || formation.appreciation_moniteur) && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2">
                <FiFileText className="w-3.5 h-3.5" />
                Évaluation du moniteur
              </p>
              {formation.appreciation_moniteur && (
                <div className="mb-2">
                  <StatusBadge status={formation.appreciation_moniteur} />
                </div>
              )}
              {formation.commentaire_moniteur && (
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                    {formation.commentaire_moniteur}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  pages.push(
    {
      label: "Séances",
      icon: FiList,
      content: (
        <FormationSeances formation={formation} canManage={canManageFormation} />
      ),
    },
    {
      label: "Compétences",
      icon: FiCheckSquare,
      content: (
        <FormationCompetences
          formation={formation}
          user={user}
          canManage={canManageFormation}
        />
      ),
    },
  );

  return (
    <>
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={`Formation ${formation.niveau_vise}`}
        subtitle={`N°${formation.id_formation} • ${
          adherent ? `${adherent.nom} ${adherent.prenom}` : `N°${formation.num_adherent}`
        }`}
        icon={FiBookOpen}
        headerExtra={headerExtra}
        pages={pages}
      />

      <FormationPaiementModal
        isOpen={showPaiementModal}
        formation={formation}
        id={id}
        onClose={() => setShowPaiementModal(false)}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        icon={FiAlertCircle}
        message={
          <>
            Êtes-vous sûr de vouloir supprimer cette formation{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {formation.niveau_vise}
            </span>
            ?
          </>
        }
        confirmLabel="Confirmer la suppression"
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />
    </>
  );
};

// "Terminée"/"Abandonnée" : parcours clos, verrouillé côté serveur (voir
// FormationService.assertFormationModifiable) — même règle que
// FormationList.jsx. Fonction à part (plutôt qu'une variable locale au
// render) car réutilisée dans headerExtra, calculé avant le early-return.
function isClotureeFrom(formation) {
  return formation.statut === "Terminée" || formation.statut === "Abandonnée";
}

export default FormationDetails;
