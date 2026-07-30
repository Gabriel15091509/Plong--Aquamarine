import React, { useState } from "react";
import { FiUsers, FiPlus, FiBarChart2 } from "react-icons/fi";
import { usePalanquees } from "../../hooks/Palanquee/usePalanquees";
import { useInscriptions } from "../../hooks/Inscription/useInscriptions";
import { useMoniteurs } from "../../hooks/Moniteur/useMoniteurs";
import { useMateriels } from "../../hooks/Materiel/useMateriels";
import SearchableSelect from "../Common/SearchableSelect";
import LoadingSpinner from "../Common/LoadingSpinner";
import PalanqueeCard from "./PalanqueeCard";

const PalanqueesManager = ({ sortie }) => {
  const { useGetBySortie, useGetStatsBySortie, useCreate } = usePalanquees();
  const { useGetPresentsBySortie } = useInscriptions();
  const { useGetAll: useGetAllMoniteurs } = useMoniteurs();
  const { useGetAvailable } = useMateriels();

  const { data: palanqueesData, isLoading } = useGetBySortie(sortie.id_sortie);
  const { data: statsData } = useGetStatsBySortie(sortie.id_sortie);
  const { data: presentsData } = useGetPresentsBySortie(sortie.id_sortie);
  const { data: moniteursData } = useGetAllMoniteurs();
  const { data: materielsData } = useGetAvailable();

  const createPalanquee = useCreate();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom_palanquee: "", id_moniteur_encadrant: "" });

  const palanquees = palanqueesData?.data || [];
  const presents = presentsData?.data || [];
  const stats = statsData?.data;
  const isTerminee = sortie.statut === "Terminée";

  const moniteurOptions = (moniteursData?.data || []).map((m) => ({
    ...m,
    label: m.user?.name || `Moniteur #${m.id_moniteur}`,
  }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.nom_palanquee) return;
    try {
      await createPalanquee.mutateAsync({
        id_sortie: sortie.id_sortie,
        nom_palanquee: form.nom_palanquee,
        id_moniteur_encadrant: form.id_moniteur_encadrant || null,
      });
      setForm({ nom_palanquee: "", id_moniteur_encadrant: "" });
      setShowForm(false);
    } catch (error) {
      // géré par le hook (toast)
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100/80 dark:border-gray-800/80 p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400">
            <FiUsers className="w-5 h-5" />
          </span>
          Palanquées ({palanquees.length})
        </h3>
        <div className="flex items-center gap-4">
          {stats && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              <FiBarChart2 className="w-3.5 h-3.5" />
              {stats.nb_plongeurs} plongeurs • ratio moyen {stats.ratio_moyen}
            </span>
          )}
          <button
            onClick={() => setShowForm((prev) => !prev)}
            disabled={isTerminee}
            title={isTerminee ? "Sortie terminée : constitution de palanquée impossible" : undefined}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:text-gray-400 dark:disabled:text-gray-600 disabled:no-underline disabled:cursor-not-allowed"
          >
            <FiPlus className="w-4 h-4" /> Constituer une palanquée
          </button>
        </div>
      </div>

      {presents.length === 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
          Aucun plongeur pointé présent pour cette sortie. Effectuez le pointage avant de constituer les palanquées.
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Nom de la palanquée
            </label>
            <input
              type="text"
              value={form.nom_palanquee}
              onChange={(e) => setForm((prev) => ({ ...prev, nom_palanquee: e.target.value }))}
              placeholder="Ex: Palanquée bleue"
              className="w-full px-3 py-2 text-sm border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <SearchableSelect
              label="Moniteur encadrant"
              value={form.id_moniteur_encadrant}
              onChange={(value) => setForm((prev) => ({ ...prev, id_moniteur_encadrant: value }))}
              options={moniteurOptions}
              getOptionLabel={(m) => m.label}
              getOptionValue={(m) => m.id_moniteur}
              placeholder="Rechercher un moniteur..."
            />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={createPalanquee.isPending} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60">
              Créer
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : palanquees.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aucune palanquée constituée pour cette sortie.
        </p>
      ) : (
        <div className="space-y-4">
          {palanquees.map((palanquee) => (
            <PalanqueeCard
              key={palanquee.id_palanquee}
              palanquee={palanquee}
              presents={presents}
              moniteurOptions={moniteurOptions}
              materielsDisponibles={materielsData?.data || []}
              sortie={sortie}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PalanqueesManager;
