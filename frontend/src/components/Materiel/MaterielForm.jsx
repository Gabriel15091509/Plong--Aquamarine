import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useMateriels } from "../../hooks/useMateriels";
import LoadingSpinner from "../Common/LoadingSpinner";
import {
  CATEGORIE_MATERIEL_OPTIONS,
  ETAT_MATERIEL_OPTIONS,
} from "../../utils/constants";

const MaterielForm = ({ editMode = false, materielId = null }) => {
  const navigate = useNavigate();
  const { useGetById, useCreate, useUpdate } = useMateriels();

  const getMateriel = useGetById(materielId);
  const { data: materielData, isLoading: loadingData } = getMateriel;

  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    num_inventaire: "",
    categorie: "Bloc",
    marque: "",
    modele: "",
    taille: "",
    epaisseur: "",
    date_achat: "",
    etat: "Bon",
    localisation: "",
    date_verif_visuelle: "",
    date_revision_technique: "",
    date_prochaine_echeance: "",
  });

  useEffect(() => {
    if (editMode && materielId && materielData?.data) {
      const m = materielData.data;
      setFormData({
        num_inventaire: m.num_inventaire || "",
        categorie: m.categorie || "Bloc",
        marque: m.marque || "",
        modele: m.modele || "",
        taille: m.taille || "",
        epaisseur: m.epaisseur || "",
        date_achat: m.date_achat ? m.date_achat.split("T")[0] : "",
        etat: m.etat || "Bon",
        localisation: m.localisation || "",
        date_verif_visuelle: m.date_verif_visuelle
          ? m.date_verif_visuelle.split("T")[0]
          : "",
        date_revision_technique: m.date_revision_technique
          ? m.date_revision_technique.split("T")[0]
          : "",
        date_prochaine_echeance: m.date_prochaine_echeance
          ? m.date_prochaine_echeance.split("T")[0]
          : "",
      });
    }
  }, [editMode, materielId, materielData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.num_inventaire)
      newErrors.num_inventaire = "Le numéro d'inventaire est requis";
    if (!formData.categorie) newErrors.categorie = "La catégorie est requise";
    if (!formData.marque) newErrors.marque = "La marque est requise";
    if (!formData.modele) newErrors.modele = "Le modèle est requis";
    if (!formData.date_achat)
      newErrors.date_achat = "La date d'achat est requise";
    if (!formData.localisation)
      newErrors.localisation = "La localisation est requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (editMode && materielId) {
        await update.mutateAsync({ id: materielId, data: formData });
      } else {
        await create.mutateAsync(formData);
      }
      navigate("/materiels");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData && editMode) {
    return <LoadingSpinner />;
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-card p-6 space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Numéro d'inventaire */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            N° Inventaire *
          </label>
          <input
            type="text"
            name="num_inventaire"
            value={formData.num_inventaire}
            onChange={handleChange}
            disabled={editMode}
            className={`input-field ${errors.num_inventaire ? "border-red-500" : ""} ${editMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
          />
          {errors.num_inventaire && (
            <p className="mt-1 text-sm text-red-600">{errors.num_inventaire}</p>
          )}
        </div>

        {/* Catégorie */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catégorie *
          </label>
          <select
            name="categorie"
            value={formData.categorie}
            onChange={handleChange}
            className={`input-field ${errors.categorie ? "border-red-500" : ""}`}
          >
            {CATEGORIE_MATERIEL_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {errors.categorie && (
            <p className="mt-1 text-sm text-red-600">{errors.categorie}</p>
          )}
        </div>

        {/* Marque */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Marque *
          </label>
          <input
            type="text"
            name="marque"
            value={formData.marque}
            onChange={handleChange}
            className={`input-field ${errors.marque ? "border-red-500" : ""}`}
          />
          {errors.marque && (
            <p className="mt-1 text-sm text-red-600">{errors.marque}</p>
          )}
        </div>

        {/* Modèle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Modèle *
          </label>
          <input
            type="text"
            name="modele"
            value={formData.modele}
            onChange={handleChange}
            className={`input-field ${errors.modele ? "border-red-500" : ""}`}
          />
          {errors.modele && (
            <p className="mt-1 text-sm text-red-600">{errors.modele}</p>
          )}
        </div>

        {/* Taille */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Taille
          </label>
          <input
            type="text"
            name="taille"
            value={formData.taille}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        {/* Épaisseur */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Épaisseur
          </label>
          <input
            type="text"
            name="epaisseur"
            value={formData.epaisseur}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        {/* Date d'achat */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date d'achat *
          </label>
          <input
            type="date"
            name="date_achat"
            value={formData.date_achat}
            onChange={handleChange}
            className={`input-field ${errors.date_achat ? "border-red-500" : ""}`}
          />
          {errors.date_achat && (
            <p className="mt-1 text-sm text-red-600">{errors.date_achat}</p>
          )}
        </div>

        {/* État */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            État *
          </label>
          <select
            name="etat"
            value={formData.etat}
            onChange={handleChange}
            className={`input-field ${errors.etat ? "border-red-500" : ""}`}
          >
            {ETAT_MATERIEL_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {errors.etat && (
            <p className="mt-1 text-sm text-red-600">{errors.etat}</p>
          )}
        </div>

        {/* Localisation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Localisation *
          </label>
          <input
            type="text"
            name="localisation"
            value={formData.localisation}
            onChange={handleChange}
            className={`input-field ${errors.localisation ? "border-red-500" : ""}`}
          />
          {errors.localisation && (
            <p className="mt-1 text-sm text-red-600">{errors.localisation}</p>
          )}
        </div>

        {/* Date vérification visuelle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date vérification visuelle
          </label>
          <input
            type="date"
            name="date_verif_visuelle"
            value={formData.date_verif_visuelle}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        {/* Date révision technique */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date révision technique
          </label>
          <input
            type="date"
            name="date_revision_technique"
            value={formData.date_revision_technique}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        {/* Date prochaine échéance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date prochaine échéance
          </label>
          <input
            type="date"
            name="date_prochaine_echeance"
            value={formData.date_prochaine_echeance}
            onChange={handleChange}
            className="input-field"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t">
        <button
          type="button"
          onClick={() => navigate("/materiels")}
          className="btn-secondary"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          )}
          {editMode ? "Mettre à jour" : "Créer"}
        </button>
      </div>
    </motion.form>
  );
};

export default MaterielForm;
