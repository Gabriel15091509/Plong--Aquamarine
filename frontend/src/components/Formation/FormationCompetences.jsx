import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiStar, FiPlus, FiCheckCircle, FiClock } from "react-icons/fi";
import { useCompetences } from "../../hooks/Formation/useCompetences";
import LoadingSpinner from "../Common/LoadingSpinner";

// Sous-feature "compétences" d'une formation — extraite de FormationDetails
// (gestion de sa propre liste, son propre formulaire d'ajout, sa propre
// validation) pour que FormationDetails reste centré sur l'affichage de la
// fiche formation.
const FormationCompetences = ({ formation, user, canManage = false }) => {
  const {
    useGetByFormation,
    useCreate: useCreateCompetence,
    useValider: useValiderCompetence,
  } = useCompetences();

  const [showCompetenceForm, setShowCompetenceForm] = useState(false);
  const [libelle, setLibelle] = useState("");

  const { data: competencesData, isLoading: loadingCompetences } =
    useGetByFormation(formation?.id_formation);
  const competences = competencesData?.data || [];
  const createCompetence = useCreateCompetence();
  const validerCompetence = useValiderCompetence();

  // Plus de champ "Niveau requis" à saisir : une compétence n'a de sens que
  // dans le cadre de SA formation, donc c'est toujours le niveau visé par
  // cette formation (formation.niveau_vise) — jamais une valeur libre
  // pouvant diverger. Le backend l'impose de toute façon
  // (CompetenceService.create ignore un niveau_requis envoyé par le
  // client), mais on ne l'envoie même plus ici pour ne pas laisser croire
  // que ce champ serait pris en compte.
  const handleAddCompetence = async (e) => {
    e.preventDefault();
    if (!libelle) return;
    try {
      await createCompetence.mutateAsync({
        id_formation: formation.id_formation,
        libelle,
      });
      setLibelle("");
      setShowCompetenceForm(false);
    } catch (error) {
      // géré par le hook (toast)
    }
  };

  const handleValiderCompetence = async (idCompetence) => {
    try {
      await validerCompetence.mutateAsync({
        id: idCompetence,
        data: { validee_par: user?.id },
      });
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
            <FiStar className="w-5 h-5" />
          </span>
          Compétences ({competences.length})
        </h3>
        {canManage && (
          <button
            onClick={() => setShowCompetenceForm((prev) => !prev)}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            <FiPlus className="w-4 h-4" />
            Ajouter une compétence
          </button>
        )}
      </div>

      {canManage && showCompetenceForm && (
        <form
          onSubmit={handleAddCompetence}
          className="mb-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 space-y-3"
        >
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Libellé
            </label>
            <input
              type="text"
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="Ex: Vidage de masque"
              autoFocus
              className="w-full px-3 py-2 text-sm border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          {/* Informatif, pas éditable : le niveau requis se déduit toujours
              de la formation elle-même, voir le commentaire de
              handleAddCompetence ci-dessus. */}
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Niveau requis : sera fixé automatiquement à{" "}
            <span className="font-medium text-gray-600 dark:text-gray-300">
              {formation?.niveau_vise}
            </span>{" "}
            (niveau visé par cette formation).
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCompetenceForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createCompetence.isPending}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60"
            >
              Ajouter
            </button>
          </div>
        </form>
      )}

      {loadingCompetences ? (
        <LoadingSpinner variant="list" />
      ) : competences.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aucune compétence enregistrée pour cette formation.
        </p>
      ) : (
        // Grille (plutôt qu'empilé sur toute la largeur) : chaque carte est
        // courte, un `flex justify-between` sur toute la largeur de la
        // modale laissait un grand vide entre les deux côtés (voir
        // DetailsModal.jsx).
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {competences.map((competence) => (
            <div
              key={competence.id_competence}
              className="flex items-center justify-between gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {competence.libelle}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  Niveau requis : {competence.niveau_requis}
                </p>
              </div>
              {competence.acquise ? (
                <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <FiCheckCircle className="w-3.5 h-3.5" />
                  Validée
                </span>
              ) : canManage ? (
                <button
                  onClick={() => handleValiderCompetence(competence.id_competence)}
                  disabled={validerCompetence.isPending}
                  className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  <FiCheckCircle className="w-3.5 h-3.5" />
                  Valider
                </button>
              ) : (
                <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  <FiClock className="w-3.5 h-3.5" />
                  En attente
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default FormationCompetences;
