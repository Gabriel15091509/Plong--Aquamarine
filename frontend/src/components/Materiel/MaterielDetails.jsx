import React, { useState } from "react";
import ModalLink from "../Common/ModalLink";
import {
  FiPackage,
  FiTag,
  FiAward,
  FiBox,
  FiMaximize,
  FiActivity,
  FiCalendar,
  FiTool,
  FiEdit,
  FiClipboard,
  FiCheckCircle,
  FiClock,
  FiHash,
  FiAlertCircle,
  FiTrash2,
  FiDroplet,
  FiUser,
  FiPlus,
  FiDollarSign,
} from "react-icons/fi";
import { useMateriels } from "../../hooks/Materiel/useMateriels";
import { useAttributions } from "../../hooks/Attribution/useAttributions";
import { useReparations } from "../../hooks/Reparation/useReparations";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useDetailsModal } from "../../hooks/useFormModal";
import DetailsModal from "../Common/DetailsModal";
import LoadingSpinner from "../Common/LoadingSpinner";
import StatusBadge from "../Common/StatusBadge";
import ConfirmModal from "../Common/ConfirmModal";
import InfoItem from "../Common/InfoItem";
import Pagination from "../Common/Pagination";
import { formatDate, formatCurrency } from "../../utils/helpers";
import { photoUrl } from "../../utils/photoUrl";

const getEtatColor = (etat) => {
  const colors = {
    Neuf: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    Bon: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    "Usagé":
      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    "À réparer":
      "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
    "Hors service":
      "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
  };
  return colors[etat] || colors["Bon"];
};

const getEtatIcon = (etat) => {
  const icons = {
    Neuf: FiCheckCircle,
    Bon: FiCheckCircle,
    "Usagé": FiClock,
    "À réparer": FiTool,
    "Hors service": FiAlertCircle,
  };
  return icons[etat] || FiCheckCircle;
};

const getLocalisationColor = (localisation) => {
  const colors = {
    Local: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    "Prêté": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "En réparation": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  };
  return colors[localisation] || "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400";
};

// Fiche matériel, modale par-dessus la liste (voir MoniteurDetails.jsx pour
// le prototype d'origine et DetailsModal.jsx pour la coquille commune) :
// s'ouvre/se ferme en naviguant vers/depuis `/materiels/:id` — l'id de route
// est le num_inventaire lui-même (clé primaire du matériel, ex. "INV-1234").
const MaterielDetails = () => {
  const modal = useDetailsModal("/materiels");
  const { id } = modal;
  const { useGetById, useRemove } = useMateriels();
  const { useGetByMateriel: useGetAttributionsByMateriel } =
    useAttributions();
  const { useGetByMateriel: useGetReparationsByMateriel } = useReparations();
  const { useGetAll: useGetAllAdherents } = useAdherents();
  const { data, isLoading } = useGetById(id);
  const remove = useRemove();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // Un matériel utilisé depuis des années accumule des dizaines
  // d'attributions/réparations — pagination plutôt que tout afficher
  // d'un coup (même principe que "Mon matériel attribué", ProfilePage.jsx).
  const [attributionsPage, setAttributionsPage] = useState(1);
  const [reparationsPage, setReparationsPage] = useState(1);
  const HISTORIQUE_PAR_PAGE = 6;

  const materiel = data?.data;

  const { data: attributionsData, isLoading: loadingAttributions } =
    useGetAttributionsByMateriel(materiel?.num_inventaire);
  const { data: reparationsData, isLoading: loadingReparations } =
    useGetReparationsByMateriel(materiel?.num_inventaire);
  const { data: adherentsData } = useGetAllAdherents({}, { enabled: !!id });

  const attributions = attributionsData?.data || [];
  const reparations = reparationsData?.data || [];
  const adherentMap = {};
  adherentsData?.data?.forEach((a) => {
    adherentMap[a.num_adherent] = `${a.nom} ${a.prenom}`;
  });

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      setShowDeleteModal(false);
      modal.close();
    } catch (error) {
      // toast déjà géré par le hook useRemove
    }
  };

  const headerExtra = materiel && (
    <>
      <ModalLink
        to={`/materiels/edit/${materiel.num_inventaire}`}
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

  if (isLoading || !materiel) {
    return (
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={isLoading ? "Chargement…" : "Matériel non trouvé"}
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
                Le matériel que vous recherchez n&apos;existe pas ou a été
                supprimé.
              </p>
            ),
          },
        ]}
      />
    );
  }

  const EtatIcon = getEtatIcon(materiel.etat);

  const pages = [
    {
      label: "Informations",
      icon: FiPackage,
      content: (
        <div className="space-y-4">
          {/* Bandeau état, compact */}
          <div
            className={`rounded-xl p-3 border flex items-center gap-3 ${getEtatColor(materiel.etat)}`}
          >
            <div
              className={`p-2 rounded-full ${
                materiel.etat === "Neuf" || materiel.etat === "Bon"
                  ? "bg-green-100 dark:bg-green-900/30"
                  : materiel.etat === "Usagé"
                    ? "bg-yellow-100 dark:bg-yellow-900/30"
                    : materiel.etat === "À réparer"
                      ? "bg-orange-100 dark:bg-orange-900/30"
                      : "bg-red-100 dark:bg-red-900/30"
              }`}
            >
              <EtatIcon
                className={`w-5 h-5 ${
                  materiel.etat === "Neuf" || materiel.etat === "Bon"
                    ? "text-green-600 dark:text-green-400"
                    : materiel.etat === "Usagé"
                      ? "text-yellow-600 dark:text-yellow-400"
                      : materiel.etat === "À réparer"
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-red-600 dark:text-red-400"
                }`}
              />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                {materiel.etat}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Localisation :{" "}
                <span
                  className={`inline-block px-2 py-0.5 rounded-full font-semibold ${getLocalisationColor(materiel.localisation)}`}
                >
                  {materiel.localisation}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            <div className="space-y-1">
              <InfoItem
                icon={FiHash}
                label="N° Inventaire"
                value={materiel.num_inventaire}
                highlight
              />
              <InfoItem icon={FiTag} label="Catégorie" value={materiel.categorie} />
              <InfoItem icon={FiAward} label="Marque" value={materiel.marque} />
              <InfoItem icon={FiBox} label="Modèle" value={materiel.modele} />
              <InfoItem
                icon={FiMaximize}
                label="Taille"
                value={materiel.taille || "Non renseignée"}
              />
              <InfoItem
                icon={FiActivity}
                label="Épaisseur"
                value={materiel.epaisseur || "Non renseignée"}
              />
              {materiel.categorie === "Bloc" && (
                <InfoItem
                  icon={FiDroplet}
                  label="Capacité"
                  value={materiel.capacite || "Non renseignée"}
                />
              )}
              {materiel.categorie === "Stabilisateur" && (
                <InfoItem
                  icon={FiCheckCircle}
                  label="État des sangles"
                  value={materiel.etat_sangles || "Non renseigné"}
                />
              )}
              {materiel.categorie === "Ordinateur" && (
                <InfoItem
                  icon={FiActivity}
                  label="Batterie"
                  value={materiel.batterie || "Non renseignée"}
                />
              )}
            </div>
            <div className="space-y-1">
              <InfoItem
                icon={FiCalendar}
                label="Date d'achat"
                value={formatDate(materiel.date_achat)}
              />
              <InfoItem
                icon={FiCheckCircle}
                label="État"
                value={<StatusBadge status={materiel.etat} />}
              />
              <InfoItem
                icon={FiTool}
                label="Vérification visuelle"
                value={
                  materiel.date_verif_visuelle
                    ? formatDate(materiel.date_verif_visuelle)
                    : "Non effectuée"
                }
              />
              <InfoItem
                icon={FiClipboard}
                label="Révision technique"
                value={
                  materiel.date_revision_technique
                    ? formatDate(materiel.date_revision_technique)
                    : "Non effectuée"
                }
              />
              <InfoItem
                icon={FiClock}
                label="Prochaine échéance"
                value={
                  materiel.date_prochaine_echeance
                    ? formatDate(materiel.date_prochaine_echeance)
                    : "Non définie"
                }
                highlight={
                  materiel.date_prochaine_echeance &&
                  new Date(materiel.date_prochaine_echeance) < new Date()
                }
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      label: `Attributions (${attributions.length})`,
      icon: FiUser,
      content: (
        <div>
          <div className="flex items-center justify-end mb-3">
            <ModalLink
              to={`/attributions/create?num_inventaire=${materiel.num_inventaire}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <FiPlus className="w-4 h-4" />
              Nouvelle attribution
            </ModalLink>
          </div>
          {loadingAttributions ? (
            <LoadingSpinner variant="list" />
          ) : attributions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucune attribution enregistrée pour ce matériel.
            </p>
          ) : (
            // Grille (plutôt qu'empilé sur toute la largeur) : chaque carte
            // n'a que 2 courtes lignes de texte + un badge, un `flex
            // justify-between` sur toute la largeur de la modale laissait
            // un grand vide entre les deux (voir DetailsModal.jsx).
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {attributions
                  .slice(
                    (attributionsPage - 1) * HISTORIQUE_PAR_PAGE,
                    attributionsPage * HISTORIQUE_PAR_PAGE,
                  )
                  .map((attribution) => (
                    <ModalLink
                      key={attribution.id_attribution}
                      to={`/attributions/${attribution.id_attribution}`}
                      className="flex items-center justify-between gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {adherentMap[attribution.num_adherent] ||
                            `Adhérent #${attribution.num_adherent}`}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {formatDate(attribution.date_attribution)} →{" "}
                          {formatDate(attribution.date_retour_prevue)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                          attribution.date_retour_reel
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                      >
                        {attribution.date_retour_reel ? "Retourné" : "En cours"}
                      </span>
                    </ModalLink>
                  ))}
              </div>
              <Pagination
                currentPage={attributionsPage}
                totalPages={Math.ceil(attributions.length / HISTORIQUE_PAR_PAGE)}
                onPageChange={setAttributionsPage}
                scrollToTop={false}
              />
            </>
          )}
        </div>
      ),
    },
    {
      label: `Réparations (${reparations.length})`,
      icon: FiTool,
      content: (
        <div>
          <div className="flex items-center justify-end mb-3">
            <ModalLink
              to={`/reparations/create?num_inventaire=${materiel.num_inventaire}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              <FiPlus className="w-4 h-4" />
              Nouvelle réparation
            </ModalLink>
          </div>
          {loadingReparations ? (
            <LoadingSpinner variant="list" />
          ) : reparations.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucune réparation enregistrée pour ce matériel.
            </p>
          ) : (
            // Même grille que les attributions ci-dessus (voir commentaire).
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {reparations
                  .slice(
                    (reparationsPage - 1) * HISTORIQUE_PAR_PAGE,
                    reparationsPage * HISTORIQUE_PAR_PAGE,
                  )
                  .map((reparation) => (
                    <ModalLink
                      key={reparation.id_reparation}
                      to={`/reparations/${reparation.id_reparation}`}
                      className="flex items-center justify-between gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                          {reparation.description_panne}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 truncate">
                          {formatDate(reparation.date_constat)}
                          {reparation.cout && (
                            <span className="flex items-center gap-1 shrink-0">
                              <FiDollarSign className="w-3 h-3" />
                              {formatCurrency(reparation.cout)}
                            </span>
                          )}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                          reparation.date_retour
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        }`}
                      >
                        {reparation.date_retour ? "Terminée" : "En cours"}
                      </span>
                    </ModalLink>
                  ))}
              </div>
              <Pagination
                currentPage={reparationsPage}
                totalPages={Math.ceil(reparations.length / HISTORIQUE_PAR_PAGE)}
                onPageChange={setReparationsPage}
                scrollToTop={false}
              />
            </>
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
        title={`${materiel.marque} ${materiel.modele}`}
        subtitle={`N°${materiel.num_inventaire}`}
        icon={FiPackage}
        headerExtra={
          <>
            {materiel.photo_path && (
              <img
                src={photoUrl(materiel.photo_path)}
                alt={`${materiel.marque} ${materiel.modele}`}
                className="w-8 h-8 rounded-lg object-cover mr-1 hidden sm:block"
              />
            )}
            {headerExtra}
          </>
        }
        pages={pages}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        icon={FiAlertCircle}
        message={
          <>
            Êtes-vous sûr de vouloir supprimer ce matériel{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {materiel.marque} {materiel.modele}
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

export default MaterielDetails;
