import React, { useState } from "react";
import ModalLink from "../Common/ModalLink";
import {
  FiUser,
  FiCalendar,
  FiDroplet,
  FiClock,
  FiThermometer,
  FiEye,
  FiTag,
  FiImage,
  FiCheckCircle,
  FiEdit,
  FiActivity,
  FiTrash2,
  FiAward,
  FiUsers,
  FiWind,
  FiTool,
  FiAlertTriangle,
  FiRefreshCw,
} from "react-icons/fi";
import { usePlongees } from "../../hooks/Plongee/usePlongees";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useSeances } from "../../hooks/Formation/useSeances";
import { useMoniteurs } from "../../hooks/Moniteur/useMoniteurs";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useAuth } from "../../context/AuthContext";
import { useDetailsModal } from "../../hooks/useFormModal";
import DetailsModal from "../Common/DetailsModal";
import LoadingSpinner from "../Common/LoadingSpinner";
import ConfirmModal from "../Common/ConfirmModal";
import InfoItem from "../Common/InfoItem";
import { photoUrl } from "../../utils/photoUrl";
import PalanqueeResponsables from "../Palanquee/PalanqueeResponsables";
import { formatDate } from "../../utils/helpers";

// Fiche plongée, modale par-dessus la liste (voir MoniteurDetails.jsx pour
// le prototype d'origine et DetailsModal.jsx pour la coquille commune).
const PlongeeDetails = () => {
  const modal = useDetailsModal("/plongees");
  const { id } = modal;
  const { user, hasRole } = useAuth();
  const canManagePlongee = hasRole(["president", "moniteur"]);
  const { useGetWithDetails, useRemove } = usePlongees();
  const { useGetAll } = useAdherents();
  const { useGetById: useGetSeanceById } = useSeances();
  // Résoudre le moniteur connecté et la sortie d'origine de cette plongée
  // (Sortie.encadrants) — sert à canManageCettePlongee ci-dessous, réservé
  // au staff (président/moniteur), inutile pour un rôle qui n'en a besoin
  // nulle part sur cette page. Même besoin que PlongeeList.jsx.
  const { useGetAll: useGetAllMoniteurs } = useMoniteurs();
  const { useGetAll: useGetAllSorties } = useSorties();
  // `error` était ignoré jusqu'ici : un échec de la requête (403/404/500,
  // timeout réseau...) retombait silencieusement sur l'écran générique
  // "Plongée non trouvée" ci-dessous (data reste undefined), sans jamais
  // rien montrer de ce qui a réellement échoué — ni dans l'UI, ni dans la
  // console (react-query capture le rejet en interne, pas d'erreur non
  // gérée). Affiché explicitement plus bas pour pouvoir enfin diagnostiquer
  // un cas où "Voir" affiche une page vide/inattendue.
  const { data, isLoading, error, refetch, isRefetching } = useGetWithDetails(id);
  const { data: adherentsData } = useGetAll({}, { enabled: !!id });
  const { data: seanceData } = useGetSeanceById(data?.data?.id_seance);
  const { data: moniteursData } = useGetAllMoniteurs({}, { enabled: !!id && canManagePlongee });
  const { data: sortiesData } = useGetAllSorties({}, { enabled: !!id && canManagePlongee });
  const remove = useRemove();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const plongee = data?.data;
  const adherent = adherentsData?.data?.find(
    (a) => a.num_adherent === plongee?.num_adherent,
  );

  // Modifier/Supprimer : réservés au président (accès total) ou au moniteur
  // désigné encadrant de LA SORTIE d'origine de cette plongée (Sortie.
  // encadrants) — strictement la même règle que le serveur (PlongeeService.
  // assertCanManagePlongee), pour ne jamais montrer un bouton qu'un 403
  // refuserait ensuite. Même correctif que PlongeeList.jsx.
  const currentMoniteurId =
    moniteursData?.data?.find((m) => m.user?.email === user?.email)
      ?.id_moniteur || null;
  const sortieDeCettePlongee = sortiesData?.data?.find(
    (s) => (s.id_sortie || s.id) === plongee?.id_sortie,
  );
  const canManageCettePlongee =
    !!plongee &&
    canManagePlongee &&
    (user?.role === "president" ||
      (currentMoniteurId != null &&
        Array.isArray(sortieDeCettePlongee?.encadrants) &&
        sortieDeCettePlongee.encadrants.includes(currentMoniteurId)));

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      setShowDeleteModal(false);
      modal.close();
    } catch (error) {
      // toast déjà géré par le hook useRemove
    }
  };

  const isValide = !!plongee?.id_moniteur_validateur;

  const headerExtra = plongee && canManageCettePlongee && (
    <>
      {/* Verrouillé côté serveur (PlongeeService.update/delete) : une
          plongée validée par un moniteur n'est plus modifiable. */}
      {isValide ? (
        <span
          className="p-2 text-gray-300 dark:text-gray-700 cursor-not-allowed"
          title="Plongée validée : modification impossible"
        >
          <FiEdit className="w-4 h-4" />
        </span>
      ) : (
        <ModalLink
          to={`/plongees/edit/${plongee.id_plongee}`}
          className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
          title="Modifier"
        >
          <FiEdit className="w-4 h-4" />
        </ModalLink>
      )}
      <button
        type="button"
        onClick={() => setShowDeleteModal(true)}
        disabled={isValide}
        title={isValide ? "Plongée validée : suppression impossible" : "Supprimer"}
        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        <FiTrash2 className="w-4 h-4" />
      </button>
    </>
  );

  if (isLoading || error || !plongee) {
    return (
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={isLoading ? "Chargement…" : error ? "Erreur" : "Plongée non trouvée"}
        icon={FiActivity}
        pages={[
          {
            label: "",
            content: isLoading ? (
              <div className="flex items-center justify-center py-10">
                <LoadingSpinner variant="details" />
              </div>
            ) : error ? (
              // Distingue un vrai échec (réseau, 403, 500...) d'un simple
              // "id inconnu" (404, `data` reste undefined mais sans
              // `error`) — voir le commentaire sur `error` plus haut.
              <div className="text-center py-10">
                <FiAlertTriangle className="w-10 h-10 text-red-500 dark:text-red-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
                  {error.response?.data?.message ||
                    error.message ||
                    "Une erreur inattendue est survenue."}
                </p>
                <button
                  onClick={() => refetch()}
                  disabled={isRefetching}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150 disabled:opacity-50"
                >
                  <FiRefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
                  Réessayer
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">
                La plongée que vous recherchez n&apos;existe pas ou a été
                supprimée.
              </p>
            ),
          },
        ]}
      />
    );
  }

  const pages = [
    {
      label: "Vue d'ensemble",
      icon: FiActivity,
      content: (
        <div className="space-y-4">
          {/* Bandeau statut, compact */}
          <div
            className={`rounded-xl p-3 border flex items-center justify-between gap-3 flex-wrap ${
              isValide
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  isValide
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-amber-100 dark:bg-amber-900/30"
                }`}
              >
                {isValide ? (
                  <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <FiClock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <p className="font-bold text-gray-900 dark:text-white">
                {isValide ? "Validée" : "En attente de validation"}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>
                {plongee.profondeur_max != null ? `${plongee.profondeur_max}m` : "—"}
              </span>
              <span>{plongee.duree != null ? `${plongee.duree} min` : "—"}</span>
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
                    N°{plongee.num_adherent}
                  </p>
                )}
              </InfoItem>
              {adherent && (
                <InfoItem
                  icon={FiAward}
                  label="Niveau"
                  value={adherent.niveau || "Non défini"}
                />
              )}
              <InfoItem
                icon={FiCalendar}
                label="Date"
                value={formatDate(plongee.date)}
                highlight
              />
              <InfoItem
                icon={FiTag}
                label="Type de plongée"
                value={plongee.type_plongee}
              />
            </div>
            <div className="space-y-1">
              <InfoItem
                icon={FiDroplet}
                label="Profondeur max"
                value={
                  plongee.profondeur_max != null
                    ? `${plongee.profondeur_max} mètres`
                    : "À renseigner par le moniteur"
                }
              />
              <InfoItem
                icon={FiClock}
                label="Durée"
                value={
                  plongee.duree != null
                    ? `${plongee.duree} minutes`
                    : "À renseigner par le moniteur"
                }
              />
              <InfoItem
                icon={FiThermometer}
                label="Température de l'eau"
                value={
                  plongee.temperature_eau
                    ? `${plongee.temperature_eau}°C`
                    : "Non renseignée"
                }
              />
              <InfoItem
                icon={FiEye}
                label="Visibilité"
                value={plongee.visibilite || "Non renseignée"}
              />
              <InfoItem
                icon={FiWind}
                label="Courant"
                value={plongee.courant || "Non renseigné"}
              />
              {/* Les photos ne sont plus liées à cette plongée individuelle
                  mais à la sortie entière (partagées par tous les
                  participants, plusieurs à la fois) — voir SortieDetails.jsx,
                  page "Photos". */}
              <InfoItem
                icon={FiImage}
                label="Photos"
                value={
                  <ModalLink
                    to={`/sorties/${plongee.id_sortie}#photos`}
                    className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                  >
                    Voir les photos de la sortie
                  </ModalLink>
                }
              />
            </div>
          </div>
        </div>
      ),
    },
  ];

  // Matériel utilisé (CDC 3.3.1, résolu côté serveur) + observations : de
  // simples blocs de lecture, regroupés sur une même page plutôt qu'étalés
  // en plusieurs — n'apparaît que si au moins un des trois existe.
  if (
    plongee.materiel_utilise?.length > 0 ||
    plongee.observations_faune ||
    plongee.observations_moniteur
  ) {
    pages.push({
      label: "Matériel & observations",
      icon: FiTool,
      content: (
        <div className="space-y-4">
          {plongee.materiel_utilise?.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                Matériel utilisé
              </p>
              <div className="flex flex-wrap gap-2">
                {plongee.materiel_utilise.map((materiel) => (
                  <span
                    key={materiel.num_inventaire}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
                    title={`N° d'inventaire ${materiel.num_inventaire}`}
                  >
                    {materiel.categorie
                      ? `${materiel.categorie}${materiel.marque ? ` — ${materiel.marque}${materiel.modele ? " " + materiel.modele : ""}` : ""}`
                      : `#${materiel.num_inventaire}`}
                  </span>
                ))}
              </div>
            </div>
          )}
          {plongee.observations_faune && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                Observations
              </p>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                  {plongee.observations_faune}
                </p>
              </div>
            </div>
          )}
          {plongee.observations_moniteur && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                Note du moniteur
              </p>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                  {plongee.observations_moniteur}
                </p>
              </div>
            </div>
          )}
        </div>
      ),
    });
  }

  // Lien formation + palanquée : deux rappels courts vers d'autres
  // ressources, regroupés sur une même page — n'apparaît que si au moins
  // l'un des deux existe.
  if (seanceData?.data || plongee.palanquee) {
    pages.push({
      label: "Formation & palanquée",
      icon: FiUsers,
      content: (
        <div className="space-y-4">
          {seanceData?.data && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                Cette plongée compte pour une formation
              </p>
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Séance du {formatDate(seanceData.data.date_seance)} ({seanceData.data.type_seance})
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Statut : {seanceData.data.statut}
                  </p>
                </div>
                <ModalLink
                  to={`/formations/${seanceData.data.id_formation}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:underline flex-shrink-0"
                >
                  Voir la formation
                </ModalLink>
              </div>
            </div>
          )}

          {plongee.palanquee && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                Palanquée : {plongee.palanquee.nom_palanquee}
              </p>
              {/* Qui est responsable de cette palanquée : moniteur
                  encadrant, guide, secouriste — voir PalanqueeResponsables. */}
              <PalanqueeResponsables palanquee={plongee.palanquee} />
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 mt-3">
                Co-plongeurs
              </p>
              <div className="flex flex-wrap gap-2">
                {(plongee.palanquee.composers || [])
                  .filter((c) => c.num_adherent !== plongee.num_adherent)
                  .map((membre) => (
                    <span
                      key={membre.num_adherent}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
                    >
                      {membre.adherent
                        ? `${membre.adherent.nom} ${membre.adherent.prenom}`
                        : `#${membre.num_adherent}`}
                      {membre.num_adherent === plongee.palanquee.id_guide_palanquee && " · Guide"}
                      {membre.num_adherent === plongee.palanquee.id_secouriste && " · Secouriste"}
                    </span>
                  ))}
                {(plongee.palanquee.composers || []).length <= 1 && (
                  <span className="text-sm text-gray-400 dark:text-gray-500">
                    Aucun autre co-plongeur
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ),
    });
  }

  return (
    <>
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={`Plongée du ${formatDate(plongee.date)}`}
        subtitle={`N°${plongee.id_plongee} • ${
          adherent ? `${adherent.nom} ${adherent.prenom}` : `N°${plongee.num_adherent}`
        }`}
        icon={FiActivity}
        headerExtra={headerExtra}
        pages={pages}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        message={
          <>
            Êtes-vous sûr de vouloir supprimer cette plongée du{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatDate(plongee.date)}
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

export default PlongeeDetails;
