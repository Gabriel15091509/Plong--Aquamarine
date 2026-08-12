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
  const [competenceForm, setCompetenceForm] = useState({
    libelle: "",
    niveau_requis: "",
  });

  const { data: competencesData, isLoading: loadingCompetences } =
    useGetByFormation(formation?.id_formation);
  const competences = competencesData?.data || [];
  const createCompetence = useCreateCompetence();
  const validerCompetence = useValiderCompetence();

  const handleAddCompetence = async (e) => {
    e.preventDefault();
    if (!competenceForm.libelle || !competenceForm.niveau_requis) return;
    try {
      await createCompetence.mutateAsync({
        id_formation: formation.id_formation,
        libelle: competenceForm.libelle,
        niveau_requis: competenceForm.niveau_requis,
      });
      setCompetenceForm({ libelle: "", niveau_requis: "" });
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
          className="mb-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
        >
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Libellé
            </label>
            <input
              type="text"
              value={competenceForm.libelle}
              onChange={(e) =>
                setCompetenceForm((prev) => ({
                  ...prev,
                  libelle: e.target.value,
                }))
              }
              placeholder="Ex: Vidage de masque"
              className="w-full px-3 py-2 text-sm border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Niveau requis
            </label>
            <input
              type="text"
              value={competenceForm.niveau_requis}
              onChange={(e) =>
                setCompetenceForm((prev) => ({
                  ...prev,
                  niveau_requis: e.target.value,
                }))
              }
              placeholder="Ex: N1"
              className="w-full px-3 py-2 text-sm border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div className="sm:col-span-3 flex justify-end gap-2">
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
        <div className="space-y-2">
          {competences.map((competence) => (
            <div
              key={competence.id_competence}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {competence.libelle}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Niveau requis : {competence.niveau_requis}
                </p>
              </div>
              {competence.acquise ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <FiCheckCircle className="w-3.5 h-3.5" />
                  Validée
                </span>
              ) : canManage ? (
                <button
                  onClick={() => handleValiderCompetence(competence.id_competence)}
                  disabled={validerCompetence.isPending}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  <FiCheckCircle className="w-3.5 h-3.5" />
                  Valider
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
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
