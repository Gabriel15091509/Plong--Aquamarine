import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useCertificats } from "../../hooks/useCertificats";
import { useAdherents } from "../../hooks/useAdherents";
import LoadingSpinner from "../Common/LoadingSpinner";

const CERTIFICAT_TYPES = ["Médical", "Sportif", "Plongée", "Révision"];
const CERTIFICAT_STATUS = ["Valide", "Expiré", "En attente"];

const CertificatForm = ({ editMode = false, certificatId = null }) => {
  const navigate = useNavigate();
  const { useGetById, useCreate, useUpdate } = useCertificats();
  const { useGetAll } = useAdherents();

  const { data: certificatData, isLoading: loadingData } =
    useGetById(certificatId);
  const { data: adherentsData, isLoading: loadingAdherents } = useGetAll();

  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    num_adherent: "",
    type_certificat: "Plongée",
    date_validite: "",
    date_delivrance: new Date().toISOString().split("T")[0],
    medecin: "",
    statut: "Valide",
  });

  useEffect(() => {
    if (editMode && certificatId && certificatData?.data) {
      const cert = certificatData.data;
      setFormData({
        num_adherent: cert.num_adherent || "",
        type_certificat: cert.type_certificat || "Plongée",
        date_validite: cert.date_validite
          ? cert.date_validite.split("T")[0]
          : "",
        date_delivrance: cert.date_delivrance
          ? cert.date_delivrance.split("T")[0]
          : "",
        medecin: cert.medecin || "",
        statut: cert.statut || "Valide",
      });
    }
  }, [editMode, certificatId, certificatData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.num_adherent)
      newErrors.num_adherent = "L'adhérent est requis";
    if (!formData.type_certificat)
      newErrors.type_certificat = "Le type est requis";
    if (!formData.date_validite)
      newErrors.date_validite = "La date de validité est requise";
    if (!formData.medecin) newErrors.medecin = "Le médecin est requis";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (editMode && certificatId) {
        await update.mutateAsync({ id: certificatId, data: formData });
      } else {
        await create.mutateAsync(formData);
      }
      navigate("/certificats");
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
            Type *
          </label>
          <select
            name="type_certificat"
            value={formData.type_certificat}
            onChange={handleChange}
            className="input-field"
          >
            {CERTIFICAT_TYPES.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date de validité *
          </label>
          <input
            type="date"
            name="date_validite"
            value={formData.date_validite}
            onChange={handleChange}
            className={`input-field ${errors.date_validite ? "border-red-500" : ""}`}
          />
          {errors.date_validite && (
            <p className="mt-1 text-sm text-red-600">{errors.date_validite}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date de délivrance
          </label>
          <input
            type="date"
            name="date_delivrance"
            value={formData.date_delivrance}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Médecin *
          </label>
          <input
            type="text"
            name="medecin"
            value={formData.medecin}
            onChange={handleChange}
            className={`input-field ${errors.medecin ? "border-red-500" : ""}`}
          />
          {errors.medecin && (
            <p className="mt-1 text-sm text-red-600">{errors.medecin}</p>
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
            {CERTIFICAT_STATUS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t">
        <button
          type="button"
          onClick={() => navigate("/certificats")}
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

export default CertificatForm;
