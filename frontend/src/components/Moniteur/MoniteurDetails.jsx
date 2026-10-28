import React, { useState } from "react";
import ModalLink from "../Common/ModalLink";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiAward,
  FiEdit,
  FiTag,
  FiClock,
  FiHash,
  FiTrash2,
  FiActivity,
  FiBookOpen,
} from "react-icons/fi";
import { useMoniteurs } from "../../hooks/Moniteur/useMoniteurs";
import { useUsers } from "../../hooks/User/useUsers";
import { useSeances } from "../../hooks/Formation/useSeances";
import { useDetailsModal } from "../../hooks/useFormModal";
import DetailsModal from "../Common/DetailsModal";
import LoadingSpinner from "../Common/LoadingSpinner";
import ConfirmModal from "../Common/ConfirmModal";
import InfoItem from "../Common/InfoItem";
import Pagination from "../Common/Pagination";
import StatusBadge from "../Common/StatusBadge";
import AccountManagementCard from "../User/AccountManagementCard";
import MoniteurAvailabilityToggle from "./MoniteurAvailabilityToggle";
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

// Taille de page pour la liste "Encadrement" — cette page ne doit jamais
// avoir besoin de défiler (voir DetailsModal.jsx), une liste illimitée le
// forcerait immanquablement pour un moniteur très actif. Paginée plutôt
// que résumée en "+N autres" (ancien comportement) : un moniteur très actif
// pouvait voir ses formations récentes mais jamais les plus anciennes sans
// changer de page ailleurs dans l'appli.
const MAX_FORMATIONS_AFFICHEES = 4;

// Fiche moniteur, désormais une modale par-dessus la liste (voir
// DetailsModal.jsx) plutôt qu'une page à part : s'ouvre/se ferme en
// naviguant vers/depuis `/moniteurs/:id` (useDetailsModal), la liste
// restant montée en dessous — même principe que MoniteurFormModal.jsx pour
// créer/modifier. Le contenu, auparavant une longue page à faire défiler
// (Compte, Brevet, Encadrement, Spécialités, Disponibilités empilés), est
// maintenant réparti en "pages" navigables (voir la prop `pages` de
// DetailsModal) : chacune tient dans la modale sans défiler.
const MoniteurDetails = () => {
  const modal = useDetailsModal("/moniteurs");
  const { id } = modal;
  const { useGetById, useRemove } = useMoniteurs();
  const { useGetAll: useGetAllUsers } = useUsers();
  const { useGetEncadrementByMoniteur } = useSeances();
  const { data, isLoading } = useGetById(id);
  const { data: usersData } = useGetAllUsers({}, { enabled: !!id });
  const { data: encadrementData } = useGetEncadrementByMoniteur(id);
  const remove = useRemove();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formationsPage, setFormationsPage] = useState(1);

  const moniteur = data?.data;
  const user = usersData?.data?.find((u) => u.id === moniteur?.user_id);

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      setShowDeleteModal(false);
      modal.close();
    } catch (error) {
      console.error("Échec de la suppression du moniteur :", error);
    }
  };

  const headerExtra = moniteur && (
    <>
      <ModalLink
        to={`/moniteurs/edit/${moniteur.id_moniteur}`}
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

  // Chargement/introuvable : une seule page (DetailsModal masque la
  // pagination quand `pages.length <= 1`), pas de titre définitif tant que
  // la fiche n'est pas résolue.
  if (isLoading || !moniteur) {
    return (
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={isLoading ? "Chargement…" : "Moniteur non trouvé"}
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
                Le moniteur que vous recherchez n&apos;existe pas ou a été
                supprimé.
              </p>
            ),
          },
        ]}
      />
    );
  }

  const specialites = toArray(moniteur.specialites);
  const disponibilites = toArray(moniteur.disponibilites);
  const formations = encadrementData?.data?.formations || [];

  const pages = [
    {
      label: "Compte & brevet",
      icon: FiUser,
      // Deux blocs courts (3 champs chacun) : côte à côte plutôt que sur 2
      // pages séparées à feuilleter pour rien — ne repasse à 1 colonne
      // qu'en dessous de md, où les deux ne tiendraient plus côte à côte
      // sans se compresser illisiblement.
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
          <div className="space-y-1">
            <InfoItem icon={FiUser} label="Nom" value={user?.name} highlight />
            <InfoItem icon={FiMail} label="Email" value={user?.email} />
            <InfoItem icon={FiPhone} label="Téléphone" value={user?.phone} />
          </div>
          <div className="space-y-1">
            <InfoItem
              icon={FiAward}
              label="Niveau"
              value={moniteur.niveau}
              highlight
            />
            <InfoItem
              icon={FiHash}
              label="N° Brevet"
              value={moniteur.num_brevet}
            />
            <InfoItem
              icon={FiCalendar}
              label="Date d'obtention"
              value={formatDate(moniteur.date_obtention_brevet)}
            />
            {/* Nichée dans cette colonne (plutôt qu'en ligne à part sur
                toute la largeur) : une carte avec juste un badge + un
                bouton engrenage étalée sur toute la largeur de la modale,
                c'est un grand vide entre les deux. */}
            <AccountManagementCard user={user} className="mt-2" />
          </div>
          {/* Pleine largeur : distincte des deux colonnes d'identité
              ci-dessus, c'est un statut opérationnel qui conditionne les
              sorties/palanquées (voir SortieForm.jsx). canEdit=true ici : le
              président peut la basculer pour n'importe quel moniteur (cette
              fiche lui est réservée, voir App.jsx) ; le moniteur bascule la
              sienne depuis "Mon profil" (ProfilePage.jsx), pas ici. */}
          <div className="md:col-span-2 mt-2">
            <MoniteurAvailabilityToggle moniteur={moniteur} canEdit />
          </div>
        </div>
      ),
    },
    {
      label: "Encadrement",
      icon: FiActivity,
      content: (
        <div>
          <div className="flex flex-wrap gap-6 p-2 mb-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Heures d&apos;encadrement réalisées
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {encadrementData?.data?.total_heures ?? 0} h
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Séances réalisées
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {encadrementData?.data?.nb_seances_realisees ?? 0}
              </p>
            </div>
          </div>

          {formations.length > 0 ? (
            <>
              {/* Grille (plutôt qu'empilé sur toute la largeur) : chaque
                  carte est courte, un `flex justify-between` sur toute la
                  largeur de la modale laissait un grand vide entre les
                  deux côtés (voir DetailsModal.jsx). */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {formations
                  .slice(
                    (formationsPage - 1) * MAX_FORMATIONS_AFFICHEES,
                    formationsPage * MAX_FORMATIONS_AFFICHEES,
                  )
                  .map((f) => (
                    <div
                      key={f.id_formation}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FiBookOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {f.niveau_vise}
                        </span>
                        <span className="text-sm text-gray-400 dark:text-gray-500">
                          N°{f.num_adherent}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDate(f.date_debut)}
                        </span>
                        <StatusBadge status={f.statut} />
                      </div>
                    </div>
                  ))}
              </div>
              <Pagination
                currentPage={formationsPage}
                totalPages={Math.ceil(
                  formations.length / MAX_FORMATIONS_AFFICHEES,
                )}
                onPageChange={setFormationsPage}
                scrollToTop={false}
              />
            </>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 p-2">
              Aucune formation encadrée pour le moment
            </p>
          )}
        </div>
      ),
    },
    {
      label: "Spécialités & disponibilités",
      icon: FiTag,
      // Même logique que la page "Compte & brevet" : 2 blocs courts côte
      // à côte plutôt qu'empilés, une seule colonne en dessous de md.
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
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
  ];

  return (
    <>
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={user?.name || `Moniteur #${moniteur.id_moniteur}`}
        subtitle={`Brevet ${moniteur.num_brevet}`}
        icon={FiAward}
        headerExtra={headerExtra}
        pages={pages}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        message={
          <>
            Êtes-vous sûr de vouloir supprimer le moniteur{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {user?.name || `#${moniteur.id_moniteur}`}
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

export default MoniteurDetails;
