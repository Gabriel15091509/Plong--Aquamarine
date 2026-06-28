import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { usePaiements } from "../../hooks/usePaiements";
import { useAdherents } from "../../hooks/useAdherents";
import LoadingSpinner from "../Common/LoadingSpinner";
import {
  MODE_PAIEMENT_OPTIONS,
  STATUT_PAIEMENT_OPTIONS,
} from "../../utils/constants";

const PaiementForm = ({ editMode = false, paiementId = null }) => {
  const navigate = useNavigate();
  const { useGetById, useCreate, useUpdate } = usePaiements();
  const { useGetAll } = useAdherents();

  const { data: paiementData, isLoading: loadingData } = useGetById(paiementId);
  const { data: adherentsData, isLoading: loadingAdherents } = useGetAll();

  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    num_adherent: "",
    montant: "",
    mode: "Espèces",
    motif: "",
    statut: "En attente",
    reference: "",
  });

  useEffect(() => {
    if (editMode && paiementId && paiementData?.data) {
      const p = paiementData.data;
      setFormData({
        num_adherent: p.num_adherent || "",
        montant: p.montant || "",
        mode: p.mode || "Espèces",
        motif: p.motif || "",
        statut: p.statut || "En attente",
        reference: p.reference || "",
      });
    }
  }, [editMode, paiementId, paiementData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.num_adherent)
      newErrors.num_adherent = "L'adhérent est requis";
    if (!formData.montant || formData.montant <= 0)
      newErrors.montant = "Le montant doit être supérieur à 0";
    if (!formData.mode) newErrors.mode = "Le mode est requis";
    if (!formData.motif) newErrors.motif = "Le motif est requis";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (editMode && paiementId) {
        await update.mutateAsync({ id: paiementId, data: formData });
      } else {
        await create.mutateAsync(formData);
      }
      navigate("/paiements");
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
            Montant (€) *
          </label>
          <input
            type="number"
            step="0.01"
            name="montant"
            value={formData.montant}
            onChange={handleChange}
            className={`input-field ${errors.montant ? "border-red-500" : ""}`}
          />
          {errors.montant && (
            <p className="mt-1 text-sm text-red-600">{errors.montant}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mode *
          </label>
          <select
            name="mode"
            value={formData.mode}
            onChange={handleChange}
            className="input-field"
          >
            {MODE_PAIEMENT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motif *
          </label>
          <input
            type="text"
            name="motif"
            value={formData.motif}
            onChange={handleChange}
            className={`input-field ${errors.motif ? "border-red-500" : ""}`}
          />
          {errors.motif && (
            <p className="mt-1 text-sm text-red-600">{errors.motif}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Statut
          </label>
          <select
            name="statut"
            value={formData.statut}
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
            Référence
          </label>
          <input
            type="text"
            name="reference"
            value={formData.reference}
            onChange={handleChange}
            className="input-field"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t">
        <button
          type="button"
          onClick={() => navigate("/paiements")}
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

export default PaiementForm;
