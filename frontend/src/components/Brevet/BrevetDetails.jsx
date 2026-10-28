import React from "react";
import { FiAward, FiUser, FiHash, FiCalendar } from "react-icons/fi";
import { useBrevets } from "../../hooks/Brevet/useBrevets";
import { useDetailsModal } from "../../hooks/useFormModal";
import DetailsModal from "../Common/DetailsModal";
import LoadingSpinner from "../Common/LoadingSpinner";
import { formatDate } from "../../utils/helpers";

// Fiche brevet, modale par-dessus la liste (voir MoniteurDetails.jsx pour le
// prototype d'origine et DetailsModal.jsx pour la coquille commune) —
// entièrement en lecture, sans headerExtra (voir BrevetList.jsx : historique
// alimenté automatiquement à chaque passage de niveau, jamais de création/
// modification/suppression manuelle pour cette entité).
//
// Pas de useGetById dédié : il n'existe pas de route GET /brevets/:id côté
// backend (jamais eu besoin d'une fiche détail jusqu'ici) — le brevet est
// retrouvé dans les données déjà chargées par useGetAll(), avec la MÊME
// queryKey que BrevetList.jsx (React Query dédoublonne : pas de second
// appel réseau, juste une lecture du cache déjà là).
const BrevetDetails = () => {
  const modal = useDetailsModal("/brevets");
  const { id } = modal;
  const { useGetAll } = useBrevets();
  const { data, isLoading } = useGetAll();
  const brevet = (data?.data || []).find(
    (b) => String(b.id_brevet) === String(id),
  );

  if (isLoading || !brevet) {
    return (
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={isLoading ? "Chargement…" : "Brevet non trouvé"}
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
                Ce brevet n&apos;existe pas ou a été supprimé.
              </p>
            ),
          },
        ]}
      />
    );
  }

  // "Nom Prénom", même ordre que le reste de l'app (AdherentList.jsx,
  // FormationList.jsx...) — voir le même correctif dans BrevetList.jsx.
  const adherentLabel = brevet.adherent
    ? `${brevet.adherent.nom} ${brevet.adherent.prenom}`
    : `Adhérent #${brevet.num_adherent}`;

  const pages = [
    {
      label: "Détails",
      icon: FiAward,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <FiAward className="text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Niveau :</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {brevet.niveau}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FiUser className="text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Adhérent :</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {adherentLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FiHash className="text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">N° de brevet :</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {brevet.num_brevet || "Non renseigné"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FiCalendar className="text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Obtenu le :</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatDate(brevet.date_obtention)}
            </span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <DetailsModal
      isOpen={modal.isOpen}
      onClose={modal.close}
      title={brevet.niveau}
      subtitle={adherentLabel}
      icon={FiAward}
      pages={pages}
    />
  );
};

export default BrevetDetails;
