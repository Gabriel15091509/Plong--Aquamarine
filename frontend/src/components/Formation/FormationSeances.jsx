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
} from "../../utils/helpers";

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
  // Une séance "Pratique" se déroule réellement lors d'une sortie : on ne
  // propose que les sorties de type "Formation" (cf. taxonomie des types
  // d'activités), cohérent avec la validation faite côté formation-service,
  // et seulement celles qui tombent dans la période de la formation (pas de
  // sens à rattacher une séance à une sortie hors de son déroulement).
  const sortiesFormation = useMemo(() => {
    const debut = formation?.date_debut ? new Date(formation.date_debut) : null;
    const fin = formation?.date_fin_prevue ? new Date(formation.date_fin_prevue) : null;
    if (fin) fin.setHours(23, 59, 59, 999);
    return (sortiesData?.data || []).filter((s) => {
      if (s.type !== "Formation") return false;
      if (!isSortieSelectionnable(s)) return false;
      const dateSortie = new Date(s.date_heure);
      if (debut && dateSortie < debut) return false;
      if (fin && dateSortie > fin) return false;
      return true;
    });
  }, [sortiesData, formation?.date_debut, formation?.date_fin_prevue]);
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

  const handleAddSeance = async (e) => {
    e.preventDefault();
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
          Séances ({seances.length})
        </h3>
        {canManage && (
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            <FiPlus className="w-4 h-4" />
            Planifier une séance
          </button>
        )}
      </div>

      {canManage && showForm && (
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
        <LoadingSpinner />
      ) : seances.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aucune séance planifiée pour cette formation.
        </p>
      ) : (
        <div className="space-y-2">
          {seances.map((seance) => (
            <div
              key={seance.id_seance}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800"
            >
              <div>
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
              {seance.statut === "Planifiée" && canManage ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMarquer(seance.id_seance, "Réalisée")}
                    disabled={updateStatut.isPending}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-60"
                  >
                    <FiCheck className="w-3.5 h-3.5" />
                    Présent
                  </button>
                  <button
                    onClick={() => handleMarquer(seance.id_seance, "Absence")}
                    disabled={updateStatut.isPending}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                  >
                    <FiX className="w-3.5 h-3.5" />
                    Absent
                  </button>
                </div>
              ) : (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${STATUT_STYLES[seance.statut] || ""}`}
                >
                  {seance.statut}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default FormationSeances;
