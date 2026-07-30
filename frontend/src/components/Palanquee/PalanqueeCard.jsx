import React, { useState } from "react";
import {
  FiUsers,
  FiPlus,
  FiX,
  FiShield,
  FiHeart,
  FiPackage,
  FiActivity,
  FiLock,
  FiCheckCircle,
} from "react-icons/fi";
import { usePalanquees } from "../../hooks/Palanquee/usePalanquees";
import { useAttributions } from "../../hooks/Attribution/useAttributions";
import SearchableSelect from "../Common/SearchableSelect";
import { ETAT_MATERIEL_OPTIONS } from "../../utils/constants";

const NIVEAUX_LIMITANTS = ["Débutant", "Niveau 1"];

function computeMaxRatio(niveaux) {
  const limitant = niveaux.some((n) => NIVEAUX_LIMITANTS.includes(n));
  return limitant ? 4 : 6;
}

const PalanqueeCard = ({ palanquee, presents, moniteurOptions, materielsDisponibles, sortie }) => {
  const {
    useAddMembre,
    useRemoveMembre,
    useUpdateEncadrement,
    useEnregistrerDonneesPlongee,
    useRetournerMateriel,
    useCloturer,
  } = usePalanquees();
  const { useGetByPalanquee, useCreate: useCreateAttribution } = useAttributions();

  const addMembre = useAddMembre();
  const removeMembre = useRemoveMembre();
  const updateEncadrement = useUpdateEncadrement();
  const enregistrerDonnees = useEnregistrerDonneesPlongee();
  const retournerMateriel = useRetournerMateriel();
  const cloturer = useCloturer();
  const createAttribution = useCreateAttribution();

  const { data: attributionsData } = useGetByPalanquee(palanquee.id_palanquee);
  const attributions = attributionsData?.data || [];

  const [selectedAdherent, setSelectedAdherent] = useState("");
  const [selectedMateriel, setSelectedMateriel] = useState("");
  const [selectedMembreMateriel, setSelectedMembreMateriel] = useState("");
  const [showPlongeeForm, setShowPlongeeForm] = useState(false);
  const [plongeeForm, setPlongeeForm] = useState({
    profondeur_max_realisee: "",
    duree_reelle: "",
    temperature_eau: "",
    visibilite: "",
    type_plongee: sortie?.type || "",
    observations_faune: "",
  });
  const [observationsParMembre, setObservationsParMembre] = useState({});
  const [retoursForm, setRetoursForm] = useState({});

  const membres = palanquee.composers || [];
  const membreIds = membres.map((c) => c.num_adherent);
  const niveaux = membres.map((c) => c.adherent?.niveau);
  const maxRatio = computeMaxRatio(niveaux);
  const ratioAtteint = membres.length >= maxRatio;
  const isCloturee = palanquee.statut === "Terminée";

  const adherentsDisponibles = (presents || []).filter(
    (i) => !membreIds.includes(i.num_adherent),
  );

  const handleAddMembre = async () => {
    if (!selectedAdherent) return;
    try {
      await addMembre.mutateAsync({ id: palanquee.id_palanquee, numAdherent: selectedAdherent });
      setSelectedAdherent("");
    } catch (e) {
      // géré par le hook (toast)
    }
  };

  const handleSetEncadrement = async (field, value) => {
    try {
      await updateEncadrement.mutateAsync({
        id: palanquee.id_palanquee,
        data: {
          id_guide_palanquee: field === "guide" ? value : palanquee.id_guide_palanquee,
          id_secouriste: field === "secouriste" ? value : palanquee.id_secouriste,
        },
      });
    } catch (e) {
      // géré par le hook
    }
  };

  const handleSetMoniteurEncadrant = async (value) => {
    try {
      await updateEncadrement.mutateAsync({
        id: palanquee.id_palanquee,
        data: { id_moniteur_encadrant: value || null },
      });
    } catch (e) {
      // géré par le hook
    }
  };

  const moniteurEncadrant = (moniteurOptions || []).find(
    (m) => m.id_moniteur === palanquee.id_moniteur_encadrant,
  );

  const handleAttribuerMateriel = async () => {
    if (!selectedMateriel || !selectedMembreMateriel) return;
    try {
      await createAttribution.mutateAsync({
        num_inventaire: selectedMateriel,
        num_adherent: selectedMembreMateriel,
        id_sortie: palanquee.id_sortie,
        id_palanquee: palanquee.id_palanquee,
        date_attribution: new Date().toISOString(),
        etat_depart: "Bon",
        date_retour_prevue: sortie?.date_heure || new Date().toISOString(),
      });
      setSelectedMateriel("");
      setSelectedMembreMateriel("");
    } catch (e) {
      // géré par le hook
    }
  };

  const handleEnregistrerDonnees = async (e) => {
    e.preventDefault();
    try {
      await enregistrerDonnees.mutateAsync({
        id: palanquee.id_palanquee,
        data: {
          ...plongeeForm,
          observationsParMembre,
        },
      });
      setShowPlongeeForm(false);
    } catch (e2) {
      // géré par le hook
    }
  };

  const handleRetourMateriel = async () => {
    const retours = Object.entries(retoursForm)
      .filter(([, v]) => v?.etat_retour)
      .map(([id_attribution, v]) => ({
        id_attribution: parseInt(id_attribution),
        etat_retour: v.etat_retour,
        constat_deterioration: v.constat_deterioration || null,
      }));
    if (retours.length === 0) return;
    try {
      await retournerMateriel.mutateAsync({ id: palanquee.id_palanquee, retours });
      setRetoursForm({});
    } catch (e) {
      // géré par le hook
    }
  };

  const attributionsEnCours = attributions.filter((a) => !a.date_retour_reel);

  return (
    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          {palanquee.nom_palanquee}
          {isCloturee && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center gap-1">
              <FiLock className="w-3 h-3" /> Clôturée
            </span>
          )}
        </h4>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            ratioAtteint
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          }`}
        >
          {membres.length} / {maxRatio} plongeurs
        </span>
      </div>

      {/* Moniteur encadrant : peut être vide pour une palanquée constituée
          automatiquement au pointage (voir autoConstituerPourPresence) */}
      {isCloturee ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Encadrant : {moniteurEncadrant?.label || "—"}
        </p>
      ) : (
        <div className="max-w-xs">
          <SearchableSelect
            label="Moniteur encadrant"
            value={palanquee.id_moniteur_encadrant || ""}
            onChange={handleSetMoniteurEncadrant}
            options={moniteurOptions || []}
            getOptionLabel={(m) => m.label}
            getOptionValue={(m) => m.id_moniteur}
            placeholder="Aucun moniteur assigné..."
          />
        </div>
      )}

      {/* Membres */}
      <div className="flex flex-wrap gap-2">
        {membres.length === 0 ? (
          <span className="text-sm text-gray-400 dark:text-gray-500">Aucun membre</span>
        ) : (
          membres.map((membre) => (
            <span
              key={membre.num_adherent}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
            >
              {membre.adherent ? `${membre.adherent.nom} ${membre.adherent.prenom}` : `#${membre.num_adherent}`}
              {palanquee.id_guide_palanquee === membre.num_adherent && (
                <FiShield className="w-3 h-3 text-blue-500" title="Guide de palanquée" />
              )}
              {palanquee.id_secouriste === membre.num_adherent && (
                <FiHeart className="w-3 h-3 text-red-500" title="Secouriste" />
              )}
              {!isCloturee && (
                <button
                  onClick={() => removeMembre.mutateAsync({ id: palanquee.id_palanquee, numAdherent: membre.num_adherent })}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Retirer"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              )}
            </span>
          ))
        )}
      </div>

      {!isCloturee && (
        <div className="flex items-center gap-2">
          <div className="flex-1 max-w-xs">
            <SearchableSelect
              value={selectedAdherent}
              onChange={setSelectedAdherent}
              options={adherentsDisponibles}
              getOptionLabel={(i) => `${i.adherent?.nom || ""} ${i.adherent?.prenom || ""}`.trim() || i.num_adherent}
              getOptionValue={(i) => i.num_adherent}
              placeholder="Ajouter un plongeur présent..."
            />
          </div>
          <button
            onClick={handleAddMembre}
            disabled={!selectedAdherent || ratioAtteint || addMembre.isPending}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <FiPlus className="w-4 h-4" /> Ajouter
          </button>
        </div>
      )}

      {/* Guide / secouriste */}
      {membres.length > 0 && !isCloturee && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SearchableSelect
            label="Guide de palanquée"
            value={palanquee.id_guide_palanquee || ""}
            onChange={(v) => handleSetEncadrement("guide", v)}
            options={membres.map((c) => c.adherent).filter(Boolean)}
            getOptionLabel={(a) => `${a.nom} ${a.prenom}`}
            getOptionValue={(a) => a.num_adherent}
            placeholder="Choisir un guide..."
          />
          <SearchableSelect
            label="Secouriste"
            value={palanquee.id_secouriste || ""}
            onChange={(v) => handleSetEncadrement("secouriste", v)}
            options={membres.map((c) => c.adherent).filter(Boolean)}
            getOptionLabel={(a) => `${a.nom} ${a.prenom}`}
            getOptionValue={(a) => a.num_adherent}
            placeholder="Choisir un secouriste..."
          />
        </div>
      )}

      {/* Attribution matériel */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
          <FiPackage className="w-4 h-4" /> Matériel attribué ({attributionsEnCours.length})
        </h5>
        <div className="space-y-1 mb-2">
          {attributions.map((a) => (
            <div key={a.id_attribution} className="flex items-center justify-between text-sm p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
              <span>
                {a.materiel ? `${a.materiel.marque} ${a.materiel.modele}` : a.num_inventaire}
                {" → "}
                {a.adherent ? `${a.adherent.nom} ${a.adherent.prenom}` : a.num_adherent}
              </span>
              {a.date_retour_reel ? (
                <span className="text-xs text-gray-400">Rendu ({a.etat_retour})</span>
              ) : !isCloturee ? (
                <select
                  value={retoursForm[a.id_attribution]?.etat_retour || ""}
                  onChange={(e) =>
                    setRetoursForm((prev) => ({
                      ...prev,
                      [a.id_attribution]: { ...prev[a.id_attribution], etat_retour: e.target.value },
                    }))
                  }
                  className="text-xs border rounded px-1.5 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                >
                  <option value="">État de retour...</option>
                  {ETAT_MATERIEL_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : null}
            </div>
          ))}
        </div>
        {!isCloturee && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1">
                <SearchableSelect
                  value={selectedMateriel}
                  onChange={setSelectedMateriel}
                  options={materielsDisponibles || []}
                  getOptionLabel={(m) => `${m.marque} ${m.modele} - N°${m.num_inventaire}`}
                  getOptionValue={(m) => m.num_inventaire}
                  placeholder="Matériel disponible..."
                />
              </div>
              <div className="flex-1">
                <SearchableSelect
                  value={selectedMembreMateriel}
                  onChange={setSelectedMembreMateriel}
                  options={membres.map((c) => c.adherent).filter(Boolean)}
                  getOptionLabel={(a) => `${a.nom} ${a.prenom}`}
                  getOptionValue={(a) => a.num_adherent}
                  placeholder="Pour quel plongeur..."
                />
              </div>
              <button
                onClick={handleAttribuerMateriel}
                disabled={!selectedMateriel || !selectedMembreMateriel || createAttribution.isPending}
                className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                Attribuer
              </button>
            </div>
            {attributionsEnCours.length > 0 && (
              <button
                onClick={handleRetourMateriel}
                disabled={retournerMateriel.isPending}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Enregistrer le retour du matériel
              </button>
            )}
          </>
        )}
      </div>

      {/* Données de plongée */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <FiActivity className="w-4 h-4" /> Déroulement de la plongée
            {palanquee.profondeur_max_realisee && (
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                {palanquee.profondeur_max_realisee}m
                {palanquee.duree_reelle ? ` • ${palanquee.duree_reelle} min` : ""}
              </span>
            )}
          </h5>
          {!isCloturee && membres.length > 0 && (
            <button
              onClick={() => setShowPlongeeForm((prev) => !prev)}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Saisir les données
            </button>
          )}
        </div>

        {showPlongeeForm && (
          <form onSubmit={handleEnregistrerDonnees} className="space-y-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input type="number" placeholder="Profondeur max (m)" value={plongeeForm.profondeur_max_realisee}
                onChange={(e) => setPlongeeForm((p) => ({ ...p, profondeur_max_realisee: e.target.value }))}
                className="text-sm px-2 py-1.5 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" required />
              <input type="number" placeholder="Durée (min)" value={plongeeForm.duree_reelle}
                onChange={(e) => setPlongeeForm((p) => ({ ...p, duree_reelle: e.target.value }))}
                className="text-sm px-2 py-1.5 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" required />
              <input type="number" step="0.1" placeholder="Temp. eau (°C)" value={plongeeForm.temperature_eau}
                onChange={(e) => setPlongeeForm((p) => ({ ...p, temperature_eau: e.target.value }))}
                className="text-sm px-2 py-1.5 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              <input type="text" placeholder="Visibilité" value={plongeeForm.visibilite}
                onChange={(e) => setPlongeeForm((p) => ({ ...p, visibilite: e.target.value }))}
                className="text-sm px-2 py-1.5 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
            </div>
            <textarea placeholder="Observations faune/flore (partagées)" value={plongeeForm.observations_faune}
              onChange={(e) => setPlongeeForm((p) => ({ ...p, observations_faune: e.target.value }))}
              className="w-full text-sm px-2 py-1.5 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" rows={2} />

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Observations individuelles</p>
              {membres.map((c) => (
                <div key={c.num_adherent} className="flex items-center gap-2">
                  <span className="text-xs w-32 truncate text-gray-600 dark:text-gray-400">
                    {c.adherent ? `${c.adherent.nom} ${c.adherent.prenom}` : c.num_adherent}
                  </span>
                  <input
                    type="text"
                    placeholder="Note du moniteur (optionnel)"
                    value={observationsParMembre[c.num_adherent] || ""}
                    onChange={(e) =>
                      setObservationsParMembre((prev) => ({ ...prev, [c.num_adherent]: e.target.value }))
                    }
                    className="flex-1 text-xs px-2 py-1 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowPlongeeForm(false)} className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                Annuler
              </button>
              <button type="submit" disabled={enregistrerDonnees.isPending} className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60">
                Enregistrer et mettre à jour le carnet
              </button>
            </div>
          </form>
        )}
      </div>

      {!isCloturee && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={() => cloturer.mutateAsync(palanquee.id_palanquee)}
            disabled={cloturer.isPending}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiCheckCircle className="w-4 h-4" /> Clôturer la palanquée
          </button>
        </div>
      )}
    </div>
  );
};

export default PalanqueeCard;
