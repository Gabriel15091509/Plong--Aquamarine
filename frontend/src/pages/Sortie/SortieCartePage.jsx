import React, { useMemo, useState } from "react";
import ModalLink from "../../components/Common/ModalLink";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { motion } from "framer-motion";
import {
  FiMapPin,
  FiSearch,
  FiX,
  FiAnchor,
  FiCalendar,
  FiLayers,
} from "react-icons/fi";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useSortieTabs } from "../../hooks/Sortie/useSortieTabs";
import LoadingSpinner from "../../components/Common/LoadingSpinner";
import ErrorState from "../../components/Common/ErrorState";
import TabBar from "../../components/Common/TabBar";
import { formatDateTime } from "../../utils/helpers";
import { CLUB_LOCATION, TYPE_SORTIE_OPTIONS, STATUT_SORTIE } from "../../utils/constants";
import { departureIcon, createSiteIcon } from "../../utils/mapPins";

const SORTIE_STATUS = [
  { value: "all", label: "Tous les statuts" },
  { value: "Planifiée", label: "Planifiée" },
  { value: "En cours", label: "En cours" },
  { value: "Terminée", label: "Terminée" },
  { value: "Annulée", label: "Annulée" },
];

const SORTIE_TYPES = ["all", ...TYPE_SORTIE_OPTIONS];

// Couleur du badge de statut dans le popup d'un site — alignée sur
// STATUT_PIN_COLOR ci-dessous (même code couleur que le pin lui-même) plutôt
// que sur la palette verte utilisée pour "En cours" dans SortiesPage, pour
// que le popup et le pin qui l'ouvre se lisent d'un coup d'œil comme une
// seule et même information.
const getStatutColor = (statut) => {
  const colors = {
    Planifiée: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "En cours": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    Terminée: "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400",
    Annulée: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return colors[statut] || "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
};

// Couleur du pin par statut de sortie — mêmes teintes que SortiePointage
// (bleu/ambre/gris/rouge). Un site peut regrouper plusieurs sorties de
// statuts différents (même spot, dates différentes) : STATUT_PRIORITY
// détermine alors quel statut "gagne" pour la couleur du pin — le plus actif
// l'emporte, une sortie En cours prime sur une Terminée au même endroit.
const STATUT_PIN_COLOR = {
  [STATUT_SORTIE.EN_COURS]: "#d97706",
  [STATUT_SORTIE.PLANIFIEE]: "#2563eb",
  [STATUT_SORTIE.TERMINEE]: "#6b7280",
  [STATUT_SORTIE.ANNULEE]: "#dc2626",
};
const STATUT_PRIORITY = [
  STATUT_SORTIE.EN_COURS,
  STATUT_SORTIE.PLANIFIEE,
  STATUT_SORTIE.TERMINEE,
  STATUT_SORTIE.ANNULEE,
];
const getStatutDominant = (sorties) =>
  STATUT_PRIORITY.find((statut) => sorties.some((s) => s.statut === statut)) ||
  sorties[0]?.statut;

// Recale la vue sur l'ensemble des points à chaque changement de filtre —
// même principe que FitBounds dans SortieRouteMap.jsx, généralisé à N points
// (club + tous les sites filtrés) plutôt qu'à une paire départ/arrivée fixe.
function FitBounds({ points }) {
  const map = useMap();
  React.useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }
    map.fitBounds(points, { padding: [40, 40] });
  }, [points, map]);
  return null;
}

const SortieCartePage = () => {
  const { useGetAll } = useSorties();
  // Onglets remplaçant l'ancien sous-menu dépliable "Sorties" de la
  // Sidebar — partagés avec SortiesPage.jsx (voir useSortieTabs.js).
  const sortieTabs = useSortieTabs();
  const { data: sortiesData, isLoading, error, refetch } = useGetAll();

  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Sorties positionnées (latitude/longitude renseignées via
  // SortieLocationPicker) — celles créées avant l'ajout de cette
  // fonctionnalité n'ont pas de coordonnées et ne peuvent pas figurer sur la
  // carte, voir avertissement affiché plus bas.
  const sortiesAvecPosition = useMemo(
    () =>
      (sortiesData?.data || []).filter((s) => {
        const lat = s.latitude != null ? Number(s.latitude) : null;
        const lng = s.longitude != null ? Number(s.longitude) : null;
        return Number.isFinite(lat) && Number.isFinite(lng);
      }),
    [sortiesData],
  );
  const nbSansPosition = (sortiesData?.data?.length || 0) - sortiesAvecPosition.length;

  const filteredSorties = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return sortiesAvecPosition.filter((sortie) => {
      const matchSearch =
        !normalizedSearch ||
        [sortie.lieu, sortie.site, sortie.type]
          .some((val) => String(val || "").toLowerCase().includes(normalizedSearch));
      const matchStatut = statutFilter === "all" || sortie.statut === statutFilter;
      const matchType = typeFilter === "all" || sortie.type === typeFilter;
      return matchSearch && matchStatut && matchType;
    });
  }, [sortiesAvecPosition, searchTerm, statutFilter, typeFilter]);

  // Regroupement par site : plusieurs sorties peuvent partager le même spot
  // (mêmes coordonnées exactes, choisies via SortieLocationPicker) — un seul
  // repère par site, avec la liste des sorties concernées dans son popup,
  // plutôt qu'un marqueur superposé illisible par sortie.
  const sitesGroupes = useMemo(() => {
    const groupes = new Map();
    filteredSorties.forEach((sortie) => {
      const lat = Number(sortie.latitude);
      const lng = Number(sortie.longitude);
      const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
      if (!groupes.has(key)) {
        groupes.set(key, {
          key,
          lat,
          lng,
          nom: sortie.site || sortie.lieu || "Site de plongée",
          lieu: sortie.lieu,
          sorties: [],
        });
      }
      groupes.get(key).sorties.push(sortie);
    });
    return Array.from(groupes.values()).sort((a, b) => b.sorties.length - a.sorties.length);
  }, [filteredSorties]);

  const clubPoint = [CLUB_LOCATION.lat, CLUB_LOCATION.lng];
  const fitPoints = useMemo(
    () => [clubPoint, ...sitesGroupes.map((s) => [s.lat, s.lng])],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sitesGroupes],
  );

  const hasActiveFilters = searchTerm || statutFilter !== "all" || typeFilter !== "all";
  const clearFilters = () => {
    setSearchTerm("");
    setStatutFilter("all");
    setTypeFilter("all");
  };

  if (isLoading) return <LoadingSpinner variant="dashboard" />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
          Carte des sites
          <FiMapPin className="w-5 h-5 text-indigo-500" />
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {sitesGroupes.length} site{sitesGroupes.length > 1 ? "s" : ""} ·{" "}
          {filteredSorties.length} sortie{filteredSorties.length > 1 ? "s" : ""}
          {hasActiveFilters ? " (filtrées)" : ""}
        </p>
      </div>

      {/* Onglets remplaçant l'ancien sous-menu dépliable "Sorties" de la
          Sidebar — partagés avec SortiesPage.jsx (voir useSortieTabs.js) :
          permet de revenir vers "Toutes les sorties"/"Mes sorties" sans
          repasser par la sidebar. */}
      <TabBar tabs={sortieTabs} />

      {nbSansPosition > 0 && (
        <div className="flex items-start gap-2 px-4 py-2.5 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg border border-amber-100 dark:border-amber-900/40">
          <FiLayers className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            {nbSansPosition} sortie{nbSansPosition > 1 ? "s" : ""} sans position enregistrée
            {nbSansPosition > 1 ? " ne sont pas affichées" : " n'est pas affichée"} sur cette
            carte.
          </span>
        </div>
      )}

      {/* Barre de recherche et filtres — mêmes options que SortiesPage */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par lieu, site, type..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 min-w-[140px]"
          >
            {SORTIE_STATUS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 min-w-[160px]"
          >
            {SORTIE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type === "all" ? "Tous les types" : type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {sitesGroupes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
            <FiAnchor className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {hasActiveFilters ? "Aucun site pour ces critères" : "Aucun site positionné pour le moment"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {hasActiveFilters
              ? "Essayez de modifier vos filtres"
              : "Les sites apparaissent ici une fois leur position choisie sur la carte à la création de la sortie"}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 mt-4 px-6 py-3 font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <FiX className="w-4 h-4" /> Réinitialiser
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg h-[60vh] sm:h-[70vh]">
          <MapContainer
            center={clubPoint}
            zoom={11}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds points={fitPoints} />
            <Marker position={clubPoint} icon={departureIcon}>
              <Popup>
                <strong>{CLUB_LOCATION.name}</strong>
                <br />
                {CLUB_LOCATION.address}
              </Popup>
            </Marker>
            {sitesGroupes.map((site) => {
              const statutDominant = getStatutDominant(site.sorties);
              const pinColor =
                STATUT_PIN_COLOR[statutDominant] || STATUT_PIN_COLOR[STATUT_SORTIE.PLANIFIEE];
              return (
              <Marker
                key={site.key}
                position={[site.lat, site.lng]}
                icon={createSiteIcon(site.sorties.length, pinColor)}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <p className="font-semibold text-sm text-gray-900">{site.nom}</p>
                    {site.lieu && site.lieu !== site.nom && (
                      <p className="text-xs text-gray-500 mb-1.5">{site.lieu}</p>
                    )}
                    <ul className="mt-1.5 space-y-1.5 max-h-48 overflow-y-auto">
                      {site.sorties
                        .slice()
                        .sort((a, b) => new Date(b.date_heure) - new Date(a.date_heure))
                        .map((sortie) => {
                          const sortieId = sortie.id_sortie || sortie.id;
                          return (
                            <li key={sortieId}>
                              <ModalLink
                                to={`/sorties/${sortieId}`}
                                className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 hover:underline"
                              >
                                <FiCalendar className="w-3 h-3 flex-shrink-0" />
                                {formatDateTime(sortie.date_heure)}
                                <span
                                  className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatutColor(sortie.statut)}`}
                                >
                                  {sortie.statut || "Planifiée"}
                                </span>
                              </ModalLink>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                </Popup>
              </Marker>
              );
            })}
          </MapContainer>
        </div>
      )}

      {sitesGroupes.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUT_PIN_COLOR[STATUT_SORTIE.PLANIFIEE] }} />
            Planifiée
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUT_PIN_COLOR[STATUT_SORTIE.EN_COURS] }} />
            En cours
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUT_PIN_COLOR[STATUT_SORTIE.TERMINEE] }} />
            Terminée
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUT_PIN_COLOR[STATUT_SORTIE.ANNULEE] }} />
            Annulée
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
            Club (départ)
          </span>
          <span className="text-gray-400 dark:text-gray-500">
            Plusieurs sorties au même site : couleur du statut le plus actif
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default SortieCartePage;
