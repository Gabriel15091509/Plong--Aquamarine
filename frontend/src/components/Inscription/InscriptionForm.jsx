import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useInscriptions } from "../../hooks/useInscriptions";
import { useAdherents } from "../../hooks/useAdherents";
import { useSorties } from "../../hooks/useSorties";
import LoadingSpinner from "../Common/LoadingSpinner";

const INSCRIPTION_STATUS = [
  "En attente",
  "Confirmée",
  "Annulée",
  "Liste d'attente",
];

const InscriptionForm = ({ editMode = false, inscriptionId = null }) => {
  const navigate = useNavigate();
  const { useGetById, useCreate, useUpdate } = useInscriptions();
  const { useGetAll: useGetAllAdherents } = useAdherents();
  const { useGetAll: useGetAllSorties } = useSorties();

  const { data: inscriptionData, isLoading: loadingData } =
    useGetById(inscriptionId);
  const { data: adherentsData, isLoading: loadingAdherents } =
    useGetAllAdherents();
  const { data: sortiesData, isLoading: loadingSorties } = useGetAllSorties();

  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    num_adherent: "",
    id_sortie: "",
    statut: "En attente",
    rang_liste_attente: "",
    presence: false,
    date_confirmation: "",
  });

  useEffect(() => {
    if (editMode && inscriptionId && inscriptionData?.data) {
      const i = inscriptionData.data;
      setFormData({
        num_adherent: i.num_adherent || "",
        id_sortie: i.id_sortie || "",
        statut: i.statut || "En attente",
        rang_liste_attente: i.rang_liste_attente || "",
        presence: i.presence || false,
        date_confirmation: i.date_confirmation
          ? i.date_confirmation.split("T")[0]
          : "",
      });
    }
  }, [editMode, inscriptionId, inscriptionData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.num_adherent)
      newErrors.num_adherent = "L'adhérent est requis";
    if (!formData.id_sortie) newErrors.id_sortie = "La sortie est requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (editMode && inscriptionId) {
        await update.mutateAsync({ id: inscriptionId, data: formData });
      } else {
        await create.mutateAsync(formData);
      }
      navigate("/inscriptions");
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
            Sortie *
          </label>
          <select
            name="id_sortie"
            value={formData.id_sortie}
            onChange={handleChange}
            className={`input-field ${errors.id_sortie ? "border-red-500" : ""}`}
          >
            <option value="">Sélectionner une sortie...</option>
            {sortiesData?.data?.map((sortie) => (
              <option key={sortie.id_sortie} value={sortie.id_sortie}>
                {sortie.type} - {sortie.lieu} ({sortie.site})
              </option>
            ))}
          </select>
          {errors.id_sortie && (
            <p className="mt-1 text-sm text-red-600">{errors.id_sortie}</p>
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
            {INSCRIPTION_STATUS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rang liste d'attente
          </label>
          <input
            type="number"
            name="rang_liste_attente"
            value={formData.rang_liste_attente}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date confirmation
          </label>
          <input
            type="date"
            name="date_confirmation"
            value={formData.date_confirmation}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        <div className="flex items-center pt-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="presence"
              checked={formData.presence}
              onChange={handleChange}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Présent</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t">
        <button
          type="button"
          onClick={() => navigate("/inscriptions")}
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

export default InscriptionForm;
