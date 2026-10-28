import React, { useState } from "react";
import ModalLink from "../Common/ModalLink";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiShield,
  FiEdit,
  FiHash,
  FiKey,
  FiTrash2,
  FiAward,
  FiTag,
  FiClock,
} from "react-icons/fi";
import { usePresidents } from "../../hooks/President/usePresidents";
import { useMoniteurs } from "../../hooks/Moniteur/useMoniteurs";
import { useUsers } from "../../hooks/User/useUsers";
import { useDetailsModal } from "../../hooks/useFormModal";
import DetailsModal from "../Common/DetailsModal";
import LoadingSpinner from "../Common/LoadingSpinner";
import ConfirmModal from "../Common/ConfirmModal";
import InfoItem from "../Common/InfoItem";
import AccountManagementCard from "../User/AccountManagementCard";
import { formatDate } from "../../utils/helpers";

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return [value];
  }
};

// Fiche président, modale par-dessus la liste (voir MoniteurDetails.jsx pour
// le prototype d'origine et DetailsModal.jsx pour la coquille commune) :
// s'ouvre/se ferme en naviguant vers/depuis `/presidents/:id`
// (useDetailsModal), la liste restant montée en dessous.
const PresidentDetails = () => {
  const modal = useDetailsModal("/presidents");
  const { id } = modal;
  const { useGetById, useRemove } = usePresidents();
  const { useGetAll: useGetAllMoniteurs } = useMoniteurs();
  const { useGetAll: useGetAllUsers } = useUsers();
  const { data, isLoading } = useGetById(id);
  const { data: moniteursData } = useGetAllMoniteurs({}, { enabled: !!id });
  const { data: usersData } = useGetAllUsers({}, { enabled: !!id });
  const remove = useRemove();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const president = data?.data;
  const moniteur = moniteursData?.data?.find(
    (m) => m.id_moniteur === president?.id_moniteur,
  );
  const user = usersData?.data?.find((u) => u.id === moniteur?.user_id);

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      setShowDeleteModal(false);
      modal.close();
    } catch (error) {
      console.error("Échec de la suppression du président :", error);
    }
  };

  const headerExtra = president && (
    <>
      <ModalLink
        to={`/presidents/edit/${president.id_president}`}
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

  if (isLoading || !president) {
    return (
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={isLoading ? "Chargement…" : "Président non trouvé"}
        icon={FiShield}
        pages={[
          {
            label: "",
            content: isLoading ? (
              <div className="flex items-center justify-center py-10">
                <LoadingSpinner variant="details" />
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">
                Le président que vous recherchez n&apos;existe pas ou a été
                supprimé.
              </p>
            ),
          },
        ]}
      />
    );
  }

  const acces = toArray(president.acces);
  const specialites = toArray(moniteur?.specialites);
  const disponibilites = toArray(moniteur?.disponibilites);

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
          <div className="space-y-1">
            <InfoItem
              icon={FiCalendar}
              label="Année en poste"
              value={president.annee_en_poste}
              highlight
            />
            <InfoItem
              icon={FiHash}
              label="N° Brevet moniteur"
              value={moniteur?.num_brevet}
            />
            <InfoItem
              icon={FiAward}
              label="Date d'obtention du brevet"
              value={
                moniteur?.date_obtention_brevet
                  ? formatDate(moniteur.date_obtention_brevet)
                  : "Non défini"
              }
            />
            {/* Nichée dans cette colonne (plutôt qu'en ligne à part sur
                toute la largeur) : une carte avec juste un badge + un
                bouton engrenage étalée sur toute la largeur de la modale,
                c'est un grand vide entre les deux. */}
            <AccountManagementCard user={user} className="mt-2" />
          </div>
        </div>
      ),
    },
    {
      // Un président est nécessairement aussi moniteur (President.id_moniteur,
      // FK obligatoire), mais il n'apparaît plus dans la liste "Moniteurs"
      // (voir MoniteurList.jsx) pour éviter le doublon avec "Présidents" :
      // son profil moniteur complet reste donc consultable ici.
      label: "Profil moniteur",
      icon: FiAward,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <div className="space-y-2">
            <InfoItem
              icon={FiAward}
              label="Niveau"
              value={moniteur?.niveau}
              highlight
            />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                Spécialités d&apos;encadrement
              </p>
              {specialites.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {specialites.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                    >
                      <FiTag className="w-3.5 h-3.5" />
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Aucune spécialité d&apos;encadrement renseignée
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              Disponibilités
            </p>
            {disponibilites.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {disponibilites.map((d, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    <FiClock className="w-3.5 h-3.5" />
                    {d}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Aucune disponibilité renseignée
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      label: "Accès et droits",
      icon: FiKey,
      content:
        acces.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {acces.map((a, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
              >
                <FiKey className="w-3.5 h-3.5" />
                {a}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Aucun accès particulier renseigné
          </p>
        ),
    },
  ];

  return (
    <>
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={user?.name || `Président #${president.id_president}`}
        subtitle={`Président ${president.annee_en_poste}`}
        icon={FiShield}
        headerExtra={headerExtra}
        pages={pages}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        message={
          <>
            Êtes-vous sûr de vouloir supprimer le président{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {user?.name || `#${president.id_president}`}
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

export default PresidentDetails;
