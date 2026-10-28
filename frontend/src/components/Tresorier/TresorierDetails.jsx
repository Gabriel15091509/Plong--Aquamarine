import React, { useState } from "react";
import ModalLink from "../Common/ModalLink";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiDollarSign,
  FiEdit,
  FiTrash2,
} from "react-icons/fi";
import { useTresoriers } from "../../hooks/Tresorier/useTresoriers";
import { useUsers } from "../../hooks/User/useUsers";
import { useDetailsModal } from "../../hooks/useFormModal";
import DetailsModal from "../Common/DetailsModal";
import LoadingSpinner from "../Common/LoadingSpinner";
import ConfirmModal from "../Common/ConfirmModal";
import InfoItem from "../Common/InfoItem";
import AccountManagementCard from "../User/AccountManagementCard";

// Fiche trésorier, modale par-dessus la liste (voir MoniteurDetails.jsx pour
// le prototype d'origine et DetailsModal.jsx pour la coquille commune).
// Une seule page : peu d'informations (compte + mandat), pas besoin de
// pagination (DetailsModal la masque d'elle-même quand pages.length <= 1).
const TresorierDetails = () => {
  const modal = useDetailsModal("/tresoriers");
  const { id } = modal;
  const { useGetById, useRemove } = useTresoriers();
  const { useGetAll: useGetAllUsers } = useUsers();
  const { data, isLoading } = useGetById(id);
  const { data: usersData } = useGetAllUsers({}, { enabled: !!id });
  const remove = useRemove();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const tresorier = data?.data;
  const user = usersData?.data?.find((u) => u.id === tresorier?.user_id);

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      setShowDeleteModal(false);
      modal.close();
    } catch (error) {
      console.error("Échec de la suppression du trésorier :", error);
    }
  };

  const headerExtra = tresorier && (
    <>
      <ModalLink
        to={`/tresoriers/edit/${tresorier.id_tresorier}`}
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

  if (isLoading || !tresorier) {
    return (
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={isLoading ? "Chargement…" : "Trésorier non trouvé"}
        icon={FiDollarSign}
        pages={[
          {
            label: "",
            content: isLoading ? (
              <div className="flex items-center justify-center py-10">
                <LoadingSpinner variant="details" />
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">
                Le trésorier que vous recherchez n&apos;existe pas ou a été
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
      label: "Compte & mandat",
      icon: FiUser,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
          <div className="space-y-1">
            <InfoItem icon={FiUser} label="Nom" value={user?.name} highlight />
            <InfoItem icon={FiMail} label="Email" value={user?.email} />
            <InfoItem icon={FiPhone} label="Téléphone" value={user?.phone} />
          </div>
          {/* "Gestion du compte" nichée dans cette colonne (plutôt qu'en
              ligne à part sur toute la largeur) : avec un seul champ ici
              contre 3 à gauche, une ligne pleine largeur en dessous des
              deux colonnes aurait laissé cette colonne bien plus courte
              que l'autre, tout cet espace perdu au-dessus d'elle. */}
          <div className="space-y-1">
            <InfoItem
              icon={FiCalendar}
              label="Année en poste"
              value={tresorier.annee_en_poste || "Non renseignée"}
              highlight
            />
            <AccountManagementCard user={user} className="mt-2" />
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
        title={user?.name || `Trésorier #${tresorier.id_tresorier}`}
        subtitle={
          tresorier.annee_en_poste
            ? `Trésorier ${tresorier.annee_en_poste}`
            : undefined
        }
        icon={FiDollarSign}
        headerExtra={headerExtra}
        pages={pages}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        message={
          <>
            Êtes-vous sûr de vouloir supprimer le trésorier{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {user?.name || `#${tresorier.id_tresorier}`}
            </span>
            ?
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
};

export default TresorierDetails;
