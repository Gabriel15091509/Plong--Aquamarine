import React, { useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiSave, FiX } from "react-icons/fi";
import ToggleSwitch from "../Common/ToggleSwitch";
import { useMoniteurs } from "../../hooks/Moniteur/useMoniteurs";

// Bascule "disponible pour être désigné encadrant" + motif si indisponible.
// Utilisé à deux endroits : MoniteurDetails.jsx (le président gère
// n'importe quel moniteur) et ProfilePage.jsx (un moniteur gère SA PROPRE
// fiche, en libre-service) — même composant, seule la permission d'appel
// change (le backend refait de toute façon le contrôle self-or-président,
// voir MoniteurService.updateDisponibilite : `canEdit` ici n'est qu'un
// confort d'affichage, pas la source de vérité).
//
// Un moniteur marqué indisponible ne peut plus être désigné encadrant
// d'une sortie (voir SortieForm.jsx) ; s'il l'était déjà sur une sortie
// planifiée, SortieDetails.jsx/SortiesPage.jsx le signalent au président.
const MoniteurAvailabilityToggle = ({ moniteur, canEdit }) => {
  const { useUpdateDisponibilite } = useMoniteurs();
  const updateDisponibilite = useUpdateDisponibilite();
  // Formulaire de motif affiché seulement pendant la bascule vers
  // "indisponible" — tant qu'on ne l'a pas confirmé, le statut réel reste
  // celui de `moniteur.disponible` (pas de bascule optimiste avant d'avoir
  // un motif valide).
  const [showCauseForm, setShowCauseForm] = useState(false);
  const [cause, setCause] = useState("");

  if (!moniteur) return null;

  const disponible = moniteur.disponible !== false;

  const handleToggle = () => {
    if (disponible) {
      setCause("");
      setShowCauseForm(true);
      return;
    }
    updateDisponibilite.mutate({ id: moniteur.id_moniteur, disponible: true });
  };

  const handleConfirmIndisponible = (e) => {
    e.preventDefault();
    if (!cause.trim()) return;
    updateDisponibilite.mutate(
      { id: moniteur.id_moniteur, disponible: false, cause: cause.trim() },
      { onSuccess: () => setShowCauseForm(false) },
    );
  };

  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {disponible ? (
            <FiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          ) : (
            <FiAlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p
              className={`text-sm font-medium ${disponible ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}
            >
              {disponible
                ? "Disponible pour encadrer"
                : "Indisponible pour encadrer"}
            </p>
            {!disponible && moniteur.cause_indisponibilite && (
              <p className="text-xs text-gray-500 dark:text-gray-400 break-words">
                {moniteur.cause_indisponibilite}
              </p>
            )}
          </div>
        </div>
        {canEdit && (
          <ToggleSwitch
            checked={disponible}
            onChange={handleToggle}
            disabled={updateDisponibilite.isPending}
            label="Disponible pour être désigné encadrant"
          />
        )}
      </div>

      {canEdit && showCauseForm && (
        <form
          onSubmit={handleConfirmIndisponible}
          className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2"
        >
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Motif de l&apos;indisponibilité *
          </label>
          <textarea
            value={cause}
            onChange={(e) => setCause(e.target.value)}
            placeholder="Ex. congés du 10 au 20 juillet, arrêt médical…"
            rows={2}
            autoFocus
            className="w-full text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!cause.trim() || updateDisponibilite.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiSave className="w-3.5 h-3.5" />
              Confirmer
            </button>
            <button
              type="button"
              onClick={() => setShowCauseForm(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FiX className="w-3.5 h-3.5" />
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default MoniteurAvailabilityToggle;
