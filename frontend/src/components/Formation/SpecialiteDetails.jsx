import React, { useState } from "react";
import ModalLink from "../Common/ModalLink";
import {
  FiAward,
  FiUser,
  FiCalendar,
  FiEdit,
  FiTrash2,
  FiMessageSquare,
} from "react-icons/fi";
import { useSpecialitesFormation } from "../../hooks/Formation/useSpecialitesFormation";
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
import { formatDate } from "../../utils/helpers";

// Fiche spécialité, modale par-dessus la liste (voir FormationDetails.jsx
// pour le même principe et DetailsModal.jsx pour la coquille commune) — une
// seule page, l'entité n'ayant ni sous-liste (séances/compétences) ni
// paiement associé, contrairement à Formation.
//
// Volontairement SANS les actions "Valider"/"Abandonner" (contrairement à ce
// que propose SpecialiteFormationList.jsx) : même choix que FormationDetails,
// qui ne duplique pas non plus "Terminer"/"Ajourner" — ces actions restent
// uniquement dans la liste.
const SpecialiteDetails = () => {
  const modal = useDetailsModal("/specialites-formation");
  const { id } = modal;
  const { useGetById, useRemove } = useSpecialitesFormation();
  const { useGetAll: useGetAllAdherents } = useAdherents();
  const { useGetAll: useGetAllMoniteurs } = useMoniteurs();
  const { hasRole } = useAuth();
  const canManage = hasRole(["president", "moniteur"]);
  const { data, isLoading } = useGetById(id);
  const { data: adherentsData } = useGetAllAdherents({}, { enabled: !!id });
  const { data: moniteursData } = useGetAllMoniteurs({}, { enabled: !!id });
  const remove = useRemove();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const specialite = data?.data;
  const adherent = (adherentsData?.data || []).find(
    (a) => a.num_adherent === specialite?.num_adherent,
  );
  const moniteur = (moniteursData?.data || []).find(
    (m) => m.id_moniteur === specialite?.id_moniteur,
  );
  const adherentLabel = adherent
    ? `${adherent.nom} ${adherent.prenom}`
    : `Adhérent #${specialite?.num_adherent}`;
  const moniteurLabel = moniteur?.user?.name || `Moniteur #${specialite?.id_moniteur}`;

  // Même règle que FormationSpecialiteService.assertSpecialiteModifiable
  // côté serveur : une spécialité close n'est plus modifiable/supprimable.
  const isCloturee =
    specialite?.statut === "Terminée" || specialite?.statut === "Abandonnée";

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      setShowDeleteModal(false);
      modal.close();
    } catch (error) {
      // toast déjà géré par le hook
    }
  };

  const headerExtra = specialite && canManage && (
    <>
      {isCloturee ? (
        <span
          className="p-2 text-gray-300 dark:text-gray-700 cursor-not-allowed"
          title="Spécialité terminée ou abandonnée : modification impossible"
        >
          <FiEdit className="w-4 h-4" />
        </span>
      ) : (
        <ModalLink
          to={`/specialites-formation/edit/${id}`}
          className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
          title="Modifier"
        >
          <FiEdit className="w-4 h-4" />
        </ModalLink>
      )}
      <button
        type="button"
        onClick={() => setShowDeleteModal(true)}
        disabled={isCloturee}
        title={
          isCloturee
            ? "Spécialité terminée ou abandonnée : suppression impossible"
            : "Supprimer"
        }
        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        <FiTrash2 className="w-4 h-4" />
      </button>
    </>
  );

  if (isLoading || !specialite) {
    return (
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={isLoading ? "Chargement…" : "Spécialité non trouvée"}
        icon={FiAward}
        pages={[
          {
            label: "",
            content: isLoading ? (
              <div className="flex items-center justify-center py-10">
                <LoadingSpinner variant="details" />
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">
                Cette spécialité n&apos;existe pas ou a été supprimée.
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
      icon: FiAward,
      content: (
        <div className="space-y-1">
          <InfoItem
            icon={FiUser}
            label="Adhérent"
            value={adherentLabel}
            avatarUrl={adherent?.photo ? photoUrl(adherent.photo) : undefined}
          />
          <InfoItem icon={FiUser} label="Moniteur" value={moniteurLabel} />
          <InfoItem
            icon={FiCalendar}
            label="Date de début"
            value={formatDate(specialite.date_debut)}
          />
          {specialite.date_obtention_prevue && (
            <InfoItem
              icon={FiCalendar}
              label="Obtention prévue"
              value={formatDate(specialite.date_obtention_prevue)}
            />
          )}
          <InfoItem icon={FiAward} label="Statut" highlight>
            <StatusBadge status={specialite.statut} />
          </InfoItem>
          {specialite.commentaire && (
            <InfoItem
              icon={FiMessageSquare}
              label="Commentaire"
              value={specialite.commentaire}
            />
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
        title={specialite.type_specialite}
        subtitle={adherentLabel}
        icon={FiAward}
        pages={pages}
        headerExtra={headerExtra}
      />
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cette spécialité ?"
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default SpecialiteDetails;
