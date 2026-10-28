import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiCalendar, FiPlus, FiCheck, FiX } from "react-icons/fi";
import { useSeances } from "../../hooks/Formation/useSeances";
import { useSorties } from "../../hooks/Sortie/useSorties";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchableSelect from "../Common/SearchableSelect";
import {
  formatDate,
  formatDateTime,
  formatDateForInput,
  isSortieSelectionnable,
  isNiveauCompatible,
  computeNoteMoyenneSeances,
} from "../../utils/helpers";
import { NIVEAU_ENTREE_FORMATION } from "../../utils/constants";

const STATUT_STYLES = {
  "Planifiée": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Réalisée": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "Absence": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

// Sous-feature "séances" d'une formation, calquée sur FormationCompetences :
// planification (date/type/contenu) et feuille de présence (statut) d'une
// même formation, qui n'a qu'un seul adhérent — pas besoin d'une table de
// participants séparée comme pour les sorties.
const FormationSeances = ({ formation, canManage = false }) => {
  const { useGetByFormation, useCreate, useUpdateStatut } = useSeances();
  const { useGetAll: useGetAllSorties } = useSorties();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date_seance: "",
    type_seance: "Pratique",
    contenu: "",
    id_sortie: "",
  });
  const [sortieError, setSortieError] = useState("");

  const { data: seancesData, isLoading: loadingSeances } = useGetByFormation(
    formation?.id_formation,
  );
  const { data: sortiesData } = useGetAllSorties();
  const seances = seancesData?.data || [];
  // nb_seances_prevues : cible connue à la création de la formation,
  // nullable pour les formations existantes créées avant l'ajout de ce
  // champ (voir Formation.js) — pas de limite tant qu'elle n'est pas
  // renseignée. Miroir du garde-fou serveur (SeanceService.validateSeanceData).
  const quotaAtteint =
    !!formation?.nb_seances_prevues && seances.length >= formation.nb_seances_prevues;
  // Une séance "Pratique" se déroule réellement lors d'une sortie : on ne
  // propose que les sorties de type "Formation" (cf. taxonomie des types
  // d'activités), et seulement celles qui tombent dans la période de la
  // formation (pas de sens à rattacher une séance à une sortie hors de son
  // déroulement). Deux filtres supplémentaires, en miroir du garde-fou
  // serveur (SeanceService.validateSeanceData) :
  // - niveau cohérent : le stagiaire n'a, au mieux, que le niveau d'entrée
  //   de la formation visée (NIVEAU_ENTREE_FORMATION) — une sortie exigeant
  //   davantage ne lui serait de toute façon pas accessible ;
  // - encadrée par le moniteur en charge de CETTE formation
  //   (formation.id_moniteur doit figurer dans Sortie.encadrants), sinon la
  //   séance référencerait une sortie où ce moniteur n'est même pas présent.
  const sortiesFormation = useMemo(() => {
    const debut = formation?.date_debut ? new Date(formation.date_debut) : null;
    const fin = formation?.date_fin_prevue ? new Date(formation.date_fin_prevue) : null;
    if (fin) fin.setHours(23, 59, 59, 999);
    const niveauEntree = NIVEAU_ENTREE_FORMATION[formation?.niveau_vise] || "Baptême";
    return (sortiesData?.data || []).filter((s) => {
      if (s.type !== "Formation") return false;
      if (!isSortieSelectionnable(s)) return false;
      if (!isNiveauCompatible(niveauEntree, s.niveau_requis)) return false;
      if (!(s.encadrants || []).includes(formation?.id_moniteur)) return false;
      const dateSortie = new Date(s.date_heure);
      if (debut && dateSortie < debut) return false;
      if (fin && dateSortie > fin) return false;
      return true;
    });
  }, [sortiesData, formation?.date_debut, formation?.date_fin_prevue, formation?.niveau_vise, formation?.id_moniteur]);
  const sortieById = useMemo(
    () =>
      (sortiesData?.data || []).reduce((map, s) => {
        map[s.id_sortie] = s;
        return map;
      }, {}),
    [sortiesData],
  );
  const createSeance = useCreate();
  const updateStatut = useUpdateStatut();

  // Une séance "Pratique" se déroule réellement lors de la sortie liée : même
  // garde-fou que le pointage de sortie (SortiePointage.jsx isFutureSortie,
  // et son miroir serveur SeanceService.updateStatut) — on ne propose plus
  // de la marquer Réalisée/Absence avant le jour de cette sortie. Comparaison
  // au jour près (setHours(0,0,0,0) des deux côtés, pas une comparaison
  // d'horodatage exact) : une sortie prévue plus tard dans la journée reste
  // pointable dès ce jour-là, comme pour le pointage de sortie. Une séance
  // "Théorique" (pas de sortie liée) n'est jamais concernée.
  const isSeancePratiqueFuture = (seance) => {
    if (seance.type_seance !== "Pratique" || !seance.id_sortie) return false;
    const sortie = sortieById[seance.id_sortie];
    if (!sortie?.date_heure) return false;
    const dateSortie = new Date(sortie.date_heure);
    const today = new Date();
    dateSortie.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return dateSortie > today;
  };

  const handleAddSeance = async (e) => {
    e.preventDefault();
    if (quotaAtteint) return;
    if (!form.date_seance || !form.type_seance) return;
    if (form.type_seance === "Pratique" && !form.id_sortie) {
      setSortieError('Une séance pratique doit être liée à une sortie de type "Formation"');
      return;
    }
    try {
      await createSeance.mutateAsync({
        id_formation: formation.id_formation,
        date_seance: form.date_seance,
        type_seance: form.type_seance,
        contenu: form.contenu,
        id_sortie: form.type_seance === "Pratique" ? form.id_sortie : null,
      });
      setForm({ date_seance: "", type_seance: "Pratique", contenu: "", id_sortie: "" });
      setSortieError("");
      setShowForm(false);
    } catch (error) {
      // géré par le hook (toast)
    }
  };

  const handleMarquer = async (idSeance, statut) => {
    try {
      await updateStatut.mutateAsync({ id: idSeance, data: { statut } });
    } catch (error) {
      // géré par le hook (toast)
    }
  };

  // Note /20 facultative, saisie/corrigée une fois la séance marquée
  // "Réalisée" (jamais au moment du clic Présent lui-même — la présence doit
  // rester un geste rapide, voir le champ dédié plus bas) : toujours
  // renvoyer statut: "Réalisée" (inchangé) avec, ce qui évite de re-déclencher
  // l'incrément de nb_seances_realisees (SeanceService.updateStatut ne
  // l'incrémente qu'au PREMIER passage à "Réalisée").
  const handleNoteChange = async (idSeance, rawValue) => {
    try {
      await updateStatut.mutateAsync({
        id: idSeance,
        data: { statut: "Réalisée", note: rawValue },
      });
    } catch (error) {
      // géré par le hook (toast)
    }
  };

  // Moyenne indicative des séances déjà notées (voir suggestion
  // d'appréciation finale dans FormationForm.jsx) — n'affichée que si au
  // moins une séance a déjà une note.
  const noteMoyenne = useMemo(
    () => computeNoteMoyenneSeances(seancesData?.data || []),
    [seancesData],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100/80 dark:border-gray-800/80 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400">
            <FiCalendar className="w-5 h-5" />
          </span>
          Séances ({seances.length}
          {formation?.nb_seances_prevues ? `/${formation.nb_seances_prevues}` : ""})
          {noteMoyenne !== null && (
            <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
              — Moyenne : {noteMoyenne.toFixed(1)}/20
            </span>
          )}
        </h3>
        {canManage && (
          quotaAtteint ? (
            <span
              className="text-sm font-medium text-gray-400 dark:text-gray-600"
              title={`Nombre de séances prévues (${formation.nb_seances_prevues}) déjà atteint`}
            >
              Quota de séances atteint
            </span>
          ) : (
            <button
              onClick={() => setShowForm((prev) => !prev)}
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <FiPlus className="w-4 h-4" />
              Planifier une séance
            </button>
          )
        )}
      </div>

      {canManage && showForm && !quotaAtteint && (
        <form
          onSubmit={handleAddSeance}
          className="mb-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Date
            </label>
            <input
              type="date"
              value={form.date_seance}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, date_seance: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Type
            </label>
            <select
              value={form.type_seance}
              onChange={(e) => {
                const type_seance = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  type_seance,
                  id_sortie: type_seance === "Pratique" ? prev.id_sortie : "",
                }));
                if (type_seance !== "Pratique") setSortieError("");
              }}
              className="w-full px-3 py-2 text-sm border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="Pratique">Pratique</option>
              <option value="Théorique">Théorique</option>
            </select>
          </div>
          {form.type_seance === "Pratique" && (
            <div className="sm:col-span-3">
              <SearchableSelect
                label="Sortie liée (type Formation)"
                required
                value={form.id_sortie}
                onChange={(value) => {
                  const sortie = sortiesFormation.find(
                    (s) => String(s.id_sortie) === String(value),
                  );
                  setForm((prev) => ({
                    ...prev,
                    id_sortie: value,
                    date_seance: sortie
                      ? formatDateForInput(sortie.date_heure)
                      : prev.date_seance,
                  }));
                  if (value) setSortieError("");
                }}
                options={sortiesFormation}
                getOptionLabel={(s) => `${s.site} — ${formatDateTime(s.date_heure)}`}
                getOptionValue={(s) => s.id_sortie}
                placeholder="Rechercher une sortie de type Formation..."
                error={sortieError}
              />
              {sortiesFormation.length === 0 && (
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Aucune sortie ne convient : il faut une sortie de type
                  Formation, dans la période de la formation, dont le niveau
                  requis reste accessible au niveau d&apos;entrée (
                  {NIVEAU_ENTREE_FORMATION[formation?.niveau_vise] || "Baptême"}
                  ), et encadrée par le moniteur en charge de cette formation.
                </p>
              )}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Contenu
            </label>
            <input
              type="text"
              value={form.contenu}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, contenu: e.target.value }))
              }
              placeholder="Ex: Vidage de masque"
              className="w-full px-3 py-2 text-sm border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div className="sm:col-span-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createSeance.isPending}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60"
            >
              Planifier
            </button>
          </div>
        </form>
      )}

      {loadingSeances ? (
        <LoadingSpinner variant="list" />
      ) : seances.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aucune séance planifiée pour cette formation.
        </p>
      ) : (
        // Grille (plutôt qu'empilé sur toute la largeur) : chaque carte est
        // courte, un `justify-between` sur toute la largeur de la modale
        // laissait un grand vide entre les deux côtés (voir DetailsModal.jsx).
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {seances.map((seance) => (
            <div
              key={seance.id_seance}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatDate(seance.date_seance)} — {seance.type_seance}
                </p>
                {seance.contenu && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {seance.contenu}
                  </p>
                )}
                {seance.id_sortie && sortieById[seance.id_sortie] && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    Sortie : {sortieById[seance.id_sortie].site} —{" "}
                    {formatDateTime(sortieById[seance.id_sortie].date_heure)}
                  </p>
                )}
              </div>
              {seance.statut === "Planifiée" &&
              canManage &&
              formation?.statut === "En cours" &&
              !isSeancePratiqueFuture(seance) ? (
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleMarquer(seance.id_seance, "Réalisée")}
                    disabled={updateStatut.isPending}
                    className="inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-60 flex-1 sm:flex-initial"
                  >
                    <FiCheck className="w-3.5 h-3.5" />
                    Présent
                  </button>
                  <button
                    onClick={() => handleMarquer(seance.id_seance, "Absence")}
                    disabled={updateStatut.isPending}
                    className="inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60 flex-1 sm:flex-initial"
                  >
                    <FiX className="w-3.5 h-3.5" />
                    Absent
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-start sm:items-end gap-1">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${STATUT_STYLES[seance.statut] || ""}`}
                  >
                    {seance.statut}
                  </span>
                  {/* Même message que SortiePointage.jsx pour une sortie
                      future : explique pourquoi les boutons Présent/Absent
                      sont absents plutôt que de laisser deviner. */}
                  {seance.statut === "Planifiée" &&
                    canManage &&
                    formation?.statut === "En cours" &&
                    isSeancePratiqueFuture(seance) && (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400">
                        Pointable le jour de la sortie
                      </span>
                    )}
                  {/* Note /20 facultative — key incluant la note en base
                      resynchronise l'input non-contrôlé après enregistrement
                      (voir handleNoteChange), sans avoir à gérer un state
                      local par séance. */}
                  {seance.statut === "Réalisée" && canManage && (
                    <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      Note :
                      <input
                        key={`${seance.id_seance}-${seance.note ?? "none"}`}
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        defaultValue={seance.note ?? ""}
                        placeholder="—"
                        disabled={updateStatut.isPending}
                        onBlur={(e) => {
                          if (e.target.value === (seance.note ?? "").toString()) return;
                          handleNoteChange(seance.id_seance, e.target.value);
                        }}
                        className="w-16 px-1.5 py-0.5 text-xs border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                      /20
                    </label>
                  )}
                  {seance.statut === "Réalisée" && !canManage && seance.note !== null && seance.note !== undefined && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Note : {Number(seance.note).toFixed(1)}/20
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default FormationSeances;
