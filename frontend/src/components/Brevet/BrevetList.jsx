import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiAward,
  FiSearch,
  FiFilter,
  FiUser,
  FiCalendar,
  FiHash,
  FiList,
  FiGrid,
  FiX,
  FiEye,
} from "react-icons/fi";
import { useBrevets } from "../../hooks/Brevet/useBrevets";
import { useAuth } from "../../context/AuthContext";
import { formatDate } from "../../utils/helpers";
import { photoUrl } from "../../utils/photoUrl";
import { NIVEAU_OPTIONS } from "../../utils/constants";
import LoadingSpinner from "../Common/LoadingSpinner";
import ErrorState from "../Common/ErrorState";
import Pagination from "../Common/Pagination";
import TabBar from "../Common/TabBar";
import BrevetDetails from "./BrevetDetails";
import { getFormationTabs } from "../../constants/formationTabs";

// Un Baptême n'apparaît jamais dans l'historique des brevets (voir
// identite-service/scripts/seedIdentite.js et backfill-brevet-historique.js :
// ni date d'obtention ni numéro de brevet fiables pour ce niveau) — inutile
// de le proposer comme filtre.
const NIVEAUX_FILTRABLES = NIVEAU_OPTIONS.filter((n) => n !== "Baptême");

const ITEMS_PER_PAGE = 10;

// Historique des niveaux/brevets obtenus (voir identite-service/src/models/
// Brevet.js) — alimenté automatiquement à chaque passage de niveau, jamais
// de saisie manuelle ici : liste en lecture seule. Le scope (tout le club
// pour président/moniteur, uniquement les siens pour un adhérent) est posé
// côté backend (BrevetService.getAll) — ce composant se contente d'afficher
// ce que l'API renvoie, et masque juste la colonne "Adhérent"/le filtre par
// niveau quand ils n'ont pas de sens (vue adhérent, toujours son propre nom
// et rarement plus d'une poignée de lignes).
const BrevetList = () => {
  const { hasRole, user } = useAuth();
  const isAdherent = hasRole(["adherent"]);
  const { useGetAll } = useBrevets();
  const { data, isLoading, error, refetch } = useGetAll();
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [niveauFilter, setNiveauFilter] = useState("");
  const [viewMode, setViewMode] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 640 ? "grid" : "list",
  );
  const [currentPage, setCurrentPage] = useState(1);

  // Formations/Spécialités/Brevets (voir constants/formationTabs.js et
  // pages/Formation/FormationGroupPage.jsx) : Spécialités reste masquée
  // pour un adhérent, comme sur FormationList.jsx.
  const formationTabs = getFormationTabs(!isAdherent, user?.role === "moniteur");

  const brevets = useMemo(() => data?.data || [], [data]);

  const filteredBrevets = useMemo(() => {
    return brevets.filter((b) => {
      if (niveauFilter && b.niveau !== niveauFilter) return false;
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      const adherent = b.adherent;
      // Le nom affiché sur chaque ligne est "nom prénom" (voir BrevetRow/
      // BrevetCard, même ordre que AdherentList.jsx) : comparer séparément à
      // `nom` et `prenom` ne matchait jamais une recherche sur ce nom complet
      // ("Jean Dupont" n'est inclus ni dans "Dupont" ni dans "Jean" pris
      // isolément) — recherche donc aussi sur les deux combinés, dans les
      // deux ordres (au cas où l'utilisateur tape "Prénom Nom" par réflexe).
      const nomComplet = adherent ? `${adherent.nom} ${adherent.prenom}`.toLowerCase() : "";
      const nomCompletInverse = adherent ? `${adherent.prenom} ${adherent.nom}`.toLowerCase() : "";
      return (
        b.niveau?.toLowerCase().includes(search) ||
        b.num_brevet?.toLowerCase().includes(search) ||
        adherent?.nom?.toLowerCase().includes(search) ||
        adherent?.prenom?.toLowerCase().includes(search) ||
        nomComplet.includes(search) ||
        nomCompletInverse.includes(search) ||
        b.num_adherent?.toLowerCase?.().includes(search)
      );
    });
  }, [brevets, searchTerm, niveauFilter]);

  const totalPages = Math.ceil(filteredBrevets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedBrevets = filteredBrevets.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const resetFilters = () => {
    setSearchTerm("");
    setNiveauFilter("");
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleNiveauFilterChange = (value) => {
    setNiveauFilter(value);
    setCurrentPage(1);
  };

  if (isLoading) return <LoadingSpinner variant="list" />;
  if (error) return <ErrorState onRetry={refetch} />;

  if (brevets.length === 0) {
    return (
      <div className="space-y-4">
        <TabBar tabs={formationTabs} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
            <FiAward className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isAdherent ? "Aucun brevet obtenu pour l'instant" : "Aucun brevet enregistré"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isAdherent
              ? "Votre premier niveau obtenu apparaîtra ici automatiquement."
              : "Les brevets apparaissent ici dès qu'un adhérent obtient un niveau."}
          </p>
        </motion.div>
        <BrevetDetails />
      </div>
    );
  }

  // Icône "Voir" (FiEye, vers la fiche détail) — même composant, même style
  // exact que partout ailleurs dans l'appli (voir AttributionList.jsx/
  // CertificatList.jsx : "p-2 ... hover:bg-blue-50 ... rounded-lg",
  // title="Voir") : Brevet n'a aucune AUTRE action (créer/modifier/
  // supprimer), donc un seul bouton ici là où les autres entités en
  // alignent plusieurs.
  const VoirButton = ({ brevet }) => (
    <Link
      to={`/brevets/${brevet.id_brevet}`}
      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
      title="Voir"
    >
      <FiEye className="w-4 h-4" />
    </Link>
  );

  const BrevetCard = ({ brevet }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col items-center text-center hover:shadow-lg transition-shadow"
    >
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 flex items-center justify-center border-2 border-cyan-200 dark:border-cyan-700 shadow-sm">
        <FiAward className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mt-3 truncate w-full">
        {brevet.niveau}
      </h3>
      {!isAdherent && (
        <p className="flex items-center justify-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate w-full">
          <FiUser className="w-3.5 h-3.5 flex-shrink-0" />
          {brevet.adherent
            ? `${brevet.adherent.nom} ${brevet.adherent.prenom}`
            : `Adhérent #${brevet.num_adherent}`}
        </p>
      )}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 truncate w-full">
        {brevet.num_brevet || "Numéro non renseigné"}
      </p>
      <p className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1 truncate w-full">
        <FiCalendar className="w-3 h-3 flex-shrink-0" />
        Obtenu le {formatDate(brevet.date_obtention)}
      </p>
      {/* Même emplacement que CertificatList.jsx (rangée d'actions séparée
          par un filet, en bas de carte) : ici réduite à "Voir" seul. */}
      <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 w-full">
        <VoirButton brevet={brevet} />
      </div>
    </motion.div>
  );

  // Même structure de ligne que FormationList.jsx (vue liste) : avatar rond
  // (photo si disponible, sinon icône générique) + "Nom • badge" sur la
  // première ligne + une ligne d'infos secondaires en dessous + actions à
  // droite — plutôt que le bandeau compact précédent, pour que "Brevets"
  // (un onglet du même groupe, voir TabBar juste au-dessus) se lise comme
  // les 2 autres onglets de ce groupe, pas comme une entité à part.
  const BrevetRow = ({ brevet }) => {
    // "Nom Prénom", même ordre que partout ailleurs (AdherentList.jsx,
    // AttributionList.jsx, FormationList.jsx) — jusqu'ici affiché "Prénom
    // Nom" ici seulement, ce qui rendait ce nom introuvable en le collant
    // tel quel dans la recherche de la page Adhérents (qui ne compare qu'à
    // "nom prenom", jamais l'ordre inverse).
    const adherentLabel = brevet.adherent
      ? `${brevet.adherent.nom} ${brevet.adherent.prenom}`
      : `Adhérent #${brevet.num_adherent}`;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start gap-4">
          {/* Avatar de l'adhérent — masqué en vue adhérent (toujours
              soi-même, voir plus bas pour le même raisonnement sur le nom). */}
          {!isAdherent && (
            <div className="flex-shrink-0">
              {brevet.adherent?.photo ? (
                <img
                  src={photoUrl(brevet.adherent.photo)}
                  alt={adherentLabel}
                  className="w-16 h-16 rounded-full object-cover border-2 border-cyan-200 dark:border-cyan-700 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 flex items-center justify-center border-2 border-cyan-200 dark:border-cyan-700 shadow-sm">
                  <FiUser className="w-8 h-8 text-cyan-500 dark:text-cyan-400" />
                </div>
              )}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {isAdherent ? (
                    <h3 className="font-semibold text-gray-900 dark:text-white break-words">
                      {brevet.niveau}
                    </h3>
                  ) : (
                    <>
                      <h3 className="font-semibold text-gray-900 dark:text-white break-words">
                        {adherentLabel}
                      </h3>
                      <span className="text-sm text-gray-400 dark:text-gray-500">
                        •
                      </span>
                      <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                        <FiAward className="w-3.5 h-3.5" />
                        {brevet.niveau}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <FiHash className="w-3.5 h-3.5 flex-shrink-0" />
                    {brevet.num_brevet || "Numéro non renseigné"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                    Obtenu le {formatDate(brevet.date_obtention)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <VoirButton brevet={brevet} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      <TabBar tabs={formationTabs} />
      {/* Barre de recherche / filtre niveau / bascule liste-grille — le
          filtre par niveau et la bascule d'affichage n'ont guère d'intérêt
          pour un adhérent qui ne voit que ses propres brevets (rarement plus
          d'une poignée de lignes). */}
      {/* Bouton "Filtres" (mobile uniquement) : recherche + filtres
          repliés par défaut pour ne pas encombrer l'écran — un tap les
          affiche. Toujours visibles à partir de sm (recherche fréquente
          sur grand écran, pas besoin de la cacher). */}
      <button
        type="button"
        onClick={() => setShowFilters((v) => !v)}
        className="sm:hidden inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
      >
        {showFilters ? <FiX className="w-4 h-4" /> : <FiFilter className="w-4 h-4" />}
        Filtres
      </button>
      <div className={`${showFilters ? "flex" : "hidden"} flex-col gap-3 sm:flex sm:flex-row`}>
        <div className="relative flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={
              isAdherent
                ? "Rechercher par niveau ou numéro de brevet..."
                : "Rechercher par adhérent, niveau ou numéro de brevet..."
            }
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-cyan-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {!isAdherent && (
          <>
            <select
              value={niveauFilter}
              onChange={(e) => handleNiveauFilterChange(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white py-2 px-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-cyan-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-56"
            >
              <option value="">Tous les niveaux</option>
              {NIVEAUX_FILTRABLES.map((niveau) => (
                <option key={niveau} value={niveau}>
                  {niveau}
                </option>
              ))}
            </select>

            <div className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                title="Vue liste"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-white dark:bg-gray-700 text-cyan-600 dark:text-cyan-400 shadow-sm"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                <FiList className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Vue grille"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-gray-700 text-cyan-600 dark:text-cyan-400 shadow-sm"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                <FiGrid className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {filteredBrevets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-3">
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Aucun résultat pour ces critères.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <FiX className="w-4 h-4" /> Réinitialiser les filtres
          </button>
        </div>
      ) : viewMode === "grid" && !isAdherent ? (
        <AnimatePresence>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedBrevets.map((brevet) => (
              <BrevetCard key={brevet.id_brevet} brevet={brevet} />
            ))}
          </div>
        </AnimatePresence>
      ) : (
        // Cartes individuelles empilées (pas un bandeau partagé à filets
        // internes) : même structure que la vue liste de FormationList.jsx,
        // pour que "Brevets" se lise comme les 2 autres onglets du même
        // groupe (Formations/Formations que j'encadre/Spécialités/Brevets).
        <AnimatePresence>
          <div className="grid gap-3">
            {paginatedBrevets.map((brevet) => (
              <BrevetRow key={brevet.id_brevet} brevet={brevet} />
            ))}
          </div>
        </AnimatePresence>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <BrevetDetails />
    </div>
  );
};

export default BrevetList;
