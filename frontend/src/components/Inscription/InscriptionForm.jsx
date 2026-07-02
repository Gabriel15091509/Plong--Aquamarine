import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useInscriptions } from "../../hooks/useInscriptions";
import { useAdherents } from "../../hooks/useAdherents";
import { useSorties } from "../../hooks/useSorties";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../Common/LoadingSpinner";

const INSCRIPTION_STATUS = [
  "En attente",
  "Confirmée",
  "Annulée",
  "Liste d'attente",
];

const InscriptionForm = ({ editMode = false, inscriptionId = null }) => {
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ Récupérer l'utilisateur connecté
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

  // ✅ Vérifier si l'utilisateur est un adhérent
  const isAdherent = user?.role === "adherent";
  const isAdmin = ["president", "moniteur", "tresorier"].includes(user?.role);

  // ✅ Récupérer l'adhérent correspondant à l'utilisateur connecté
  const currentAdherent = useMemo(() => {
    if (!adherentsData?.data || !user) return null;
    // Chercher l'adhérent avec le même email que l'utilisateur connecté
    return adherentsData.data.find((adherent) => adherent.email === user.email);
  }, [adherentsData, user]);

  const [formData, setFormData] = useState({
    num_adherent: "",
    id_sortie: "",
    statut: "En attente",
    rang_liste_attente: "",
    presence: false,
    date_confirmation: "",
  });

  useEffect(() => {
    // ✅ Si l'utilisateur est un adhérent, pré-remplir avec son numéro
    if (isAdherent && currentAdherent) {
      setFormData((prev) => ({
        ...prev,
        num_adherent: currentAdherent.num_adherent,
      }));
    }
  }, [isAdherent, currentAdherent]);

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

    // ✅ Bloquer le changement de statut pour les adhérents
    if (name === "statut" && isAdherent) {
      return; // Ne rien faire
    }

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

    // ✅ Vérifier que l'adhérent ne s'inscrit pas deux fois à la même sortie
    // (optionnel - à ajouter si vous avez un hook pour vérifier)

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // ✅ Forcer le statut à "En attente" pour les adhérents
      const dataToSubmit = {
        ...formData,
        statut: isAdherent ? "En attente" : formData.statut,
      };

      if (editMode && inscriptionId) {
        await update.mutateAsync({ id: inscriptionId, data: dataToSubmit });
      } else {
        await create.mutateAsync(dataToSubmit);
      }
      navigate("/inscriptions");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Status disponibles selon le rôle
  const availableStatus = isAdherent
    ? ["En attente"] // Les adhérents ne peuvent voir que "En attente"
    : INSCRIPTION_STATUS;

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-card p-6 space-y-6"
    >
      {/* ✅ Message d'information pour les adhérents */}
      {isAdherent && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 text-xl">ℹ️</span>
            <div>
              <p className="text-sm text-blue-800 font-medium">
                Vous êtes connecté en tant qu'adhérent
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Votre inscription sera automatiquement mise en attente. Un
                moniteur ou le président devra la confirmer.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adhérent *
          </label>
          <select
            name="num_adherent"
            value={formData.num_adherent}
            onChange={handleChange}
            disabled={isAdherent} // ✅ Désactiver pour les adhérents
            className={`input-field ${errors.num_adherent ? "border-red-500" : ""} ${isAdherent ? "bg-gray-100 cursor-not-allowed" : ""}`}
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
          {isAdherent && currentAdherent && (
            <p className="mt-1 text-xs text-gray-500">
              Vous êtes automatiquement sélectionné
            </p>
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
            disabled={isAdherent} // ✅ Désactiver pour les adhérents
            className={`input-field ${isAdherent ? "bg-gray-100 cursor-not-allowed" : ""}`}
          >
            {availableStatus.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {isAdherent && (
            <p className="mt-1 text-xs text-blue-600">
              ⏳ Statut bloqué sur "En attente" pour les adhérents
            </p>
          )}
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
            disabled={isAdherent} // ✅ Désactiver pour les adhérents
          />
          {isAdherent && (
            <p className="mt-1 text-xs text-gray-500">
              Le rang sera déterminé automatiquement
            </p>
          )}
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
            disabled={isAdherent} // ✅ Désactiver pour les adhérents
          />
          {isAdherent && (
            <p className="mt-1 text-xs text-gray-500">
              Sera définie lors de la confirmation
            </p>
          )}
        </div>

        <div className="flex items-center pt-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="presence"
              checked={formData.presence}
              onChange={handleChange}
              disabled={isAdherent} // ✅ Désactiver pour les adhérents
              className={`w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 ${isAdherent ? "opacity-50 cursor-not-allowed" : ""}`}
            />
            <span className="text-sm font-medium text-gray-700">Présent</span>
          </label>
          {isAdherent && (
            <span className="ml-2 text-xs text-gray-400">
              (Géré par le moniteur)
            </span>
          )}
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
