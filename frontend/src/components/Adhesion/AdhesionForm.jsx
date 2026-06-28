import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAdhesions } from "../../hooks/useAdhesions";
import { useAdherents } from "../../hooks/useAdherents";
import LoadingSpinner from "../Common/LoadingSpinner";
import {
  TYPE_ADHESION_OPTIONS,
  STATUT_PAIEMENT_OPTIONS,
} from "../../utils/constants";

const AdhesionForm = ({ editMode = false, adhesionId = null }) => {
  const navigate = useNavigate();
  const { useGetById, useCreate, useUpdate } = useAdhesions();
  const { useGetAll } = useAdherents();

  // ✅ Récupération des données
  const { data: adhesionData, isLoading: loadingData } = useGetById(adhesionId);
  const { data: adherentsData, isLoading: loadingAdherents } = useGetAll();

  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    num_adherent: "",
    type: "Adhésion annuelle",
    date_debut: "",
    date_fin: "",
    montant_paye: "",
    num_licence_ffesm: "",
    statut_paiement: "En attente",
    annee_adhesion: new Date().getFullYear(),
  });

  useEffect(() => {
    if (editMode && adhesionId && adhesionData?.data) {
      const adhesion = adhesionData.data;
      setFormData({
        num_adherent: adhesion.num_adherent || "",
        type: adhesion.type || "Adhésion annuelle",
        date_debut: adhesion.date_debut
          ? adhesion.date_debut.split("T")[0]
          : "",
        date_fin: adhesion.date_fin ? adhesion.date_fin.split("T")[0] : "",
        montant_paye: adhesion.montant_paye || "",
        num_licence_ffesm: adhesion.num_licence_ffesm || "",
        statut_paiement: adhesion.statut_paiement || "En attente",
        annee_adhesion: adhesion.annee_adhesion || new Date().getFullYear(),
      });
    }
  }, [editMode, adhesionId, adhesionData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.num_adherent)
      newErrors.num_adherent = "L'adhérent est requis";
    if (!formData.type) newErrors.type = "Le type est requis";
    if (!formData.date_debut)
      newErrors.date_debut = "La date de début est requise";
    if (!formData.date_fin) newErrors.date_fin = "La date de fin est requise";
    if (!formData.montant_paye || formData.montant_paye <= 0) {
      newErrors.montant_paye = "Le montant doit être supérieur à 0";
    }
    if (!formData.annee_adhesion)
      newErrors.annee_adhesion = "L'année est requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (editMode && adhesionId) {
        await update.mutateAsync({ id: adhesionId, data: formData });
      } else {
        await create.mutateAsync(formData);
      }
      navigate("/adhesions");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

 

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-card p-6 space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sélecteur d'adhérent - Version simple avec select natif */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adhérent *
          </label>
          <select
            name="num_adherent"
            value={formData.num_adherent}
            onChange={handleChange}
            className={`input-field ${errors.num_adherent ? "border-red-500" : ""}`}
          >
            <option value="">Sélectionner un adhérent...</option>
            {adherentsData?.data?.map((adherent) => (
              <option key={adherent.num_adherent} value={adherent.num_adherent}>
                {adherent.civilite} {adherent.nom} {adherent.prenom} -{" "}
                {adherent.email}
              </option>
            ))}
          </select>
          {errors.num_adherent && (
            <p className="mt-1 text-sm text-red-600">{errors.num_adherent}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type *
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="input-field"
          >
            {TYPE_ADHESION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date début *
          </label>
          <input
            type="date"
            name="date_debut"
            value={formData.date_debut}
            onChange={handleChange}
            className={`input-field ${errors.date_debut ? "border-red-500" : ""}`}
          />
          {errors.date_debut && (
            <p className="mt-1 text-sm text-red-600">{errors.date_debut}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date fin *
          </label>
          <input
            type="date"
            name="date_fin"
            value={formData.date_fin}
            onChange={handleChange}
            className={`input-field ${errors.date_fin ? "border-red-500" : ""}`}
          />
          {errors.date_fin && (
            <p className="mt-1 text-sm text-red-600">{errors.date_fin}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Montant (€) *
          </label>
          <input
            type="number"
            step="0.01"
            name="montant_paye"
            value={formData.montant_paye}
            onChange={handleChange}
            className={`input-field ${errors.montant_paye ? "border-red-500" : ""}`}
          />
          {errors.montant_paye && (
            <p className="mt-1 text-sm text-red-600">{errors.montant_paye}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Statut paiement
          </label>
          <select
            name="statut_paiement"
            value={formData.statut_paiement}
            onChange={handleChange}
            className="input-field"
          >
            {STATUT_PAIEMENT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            N° Licence FFESM
          </label>
          <input
            type="text"
            name="num_licence_ffesm"
            value={formData.num_licence_ffesm}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Année *
          </label>
          <input
            type="number"
            name="annee_adhesion"
            value={formData.annee_adhesion}
            onChange={handleChange}
            className={`input-field ${errors.annee_adhesion ? "border-red-500" : ""}`}
          />
          {errors.annee_adhesion && (
            <p className="mt-1 text-sm text-red-600">{errors.annee_adhesion}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t">
        <button
          type="button"
          onClick={() => navigate("/adhesions")}
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

export default AdhesionForm;
