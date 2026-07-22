import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiTool,
  FiSave,
  FiX,
  FiCalendar,
  FiFileText,
  FiDollarSign,
  FiUser,
} from "react-icons/fi";
import { useReparations } from "../../hooks/Reparation/useReparations";
import { useMateriels } from "../../hooks/Materiel/useMateriels";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchableSelect from "../Common/SearchableSelect";
import { formatDateForInput } from "../../utils/helpers";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const ReparationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const editMode = !!id;

  const { useGetById, useCreate, useUpdate } = useReparations();
  const { useGetAll: useGetAllMateriels } = useMateriels();

  const { data: reparationData, isLoading: loadingData } = useGetById(id);
  const { data: materielsData, isLoading: loadingMateriels } =
    useGetAllMateriels();

  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    num_inventaire: searchParams.get("num_inventaire") || "",
    date_constat: formatDateForInput(new Date()),
    description_panne: "",
    prestataire: "",
    cout: "",
    date_retour: "",
  });

  useEffect(() => {
    if (editMode && id && reparationData?.data) {
      const r = reparationData.data;
      setFormData({
        num_inventaire: r.num_inventaire || "",
        date_constat: r.date_constat ? r.date_constat.split("T")[0] : "",
        description_panne: r.description_panne || "",
        prestataire: r.prestataire || "",
        cout: r.cout ?? "",
        date_retour: r.date_retour ? r.date_retour.split("T")[0] : "",
      });
    }
  }, [editMode, id, reparationData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.num_inventaire)
      newErrors.num_inventaire = "Le matériel est requis";
    if (!formData.date_constat)
      newErrors.date_constat = "La date de constat est requise";
    if (!formData.description_panne)
      newErrors.description_panne = "La description de la panne est requise";
    if (!formData.prestataire)
      newErrors.prestataire = "Le prestataire est requis";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { ...formData };
      if (!payload.date_retour) delete payload.date_retour;
      if (editMode && id) {
        await update.mutateAsync({ id, data: payload });
      } else {
        await create.mutateAsync(payload);
      }
      navigate("/reparations");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if ((editMode && loadingData) || loadingMateriels) return <LoadingSpinner />;

  const inputClasses = (fieldName) =>
    `w-full pl-4 pr-4 py-2.5 text-sm border rounded-lg focus:outline-none transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
      errors[fieldName]
        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
    }`;

  const labelClasses =
    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editMode ? "Modifier la réparation" : "Nouvelle réparation"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Déclarez une panne et suivez sa réparation
            </p>
          </div>
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
            <FiTool className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div {...fadeInUp} className="md:col-span-2">
            <SearchableSelect
              label="Matériel *"
              value={formData.num_inventaire}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, num_inventaire: value }));
                if (errors.num_inventaire)
                  setErrors((prev) => ({ ...prev, num_inventaire: "" }));
              }}
              options={materielsData?.data || []}
              getOptionLabel={(m) =>
                `${m.marque} ${m.modele} - N°${m.num_inventaire}`
              }
              getOptionValue={(m) => m.num_inventaire}
              placeholder="Rechercher un matériel..."
              error={errors.num_inventaire}
              required={true}
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Date de constat *
              </span>
            </label>
            <input
              type="date"
              name="date_constat"
              value={formData.date_constat}
              onChange={handleChange}
              className={inputClasses("date_constat")}
            />
            {errors.date_constat && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.date_constat}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiUser className="w-4 h-4 text-gray-400" />
                Prestataire *
              </span>
            </label>
            <input
              type="text"
              name="prestataire"
              value={formData.prestataire}
              onChange={handleChange}
              className={inputClasses("prestataire")}
              placeholder="Nom du réparateur/prestataire"
            />
            {errors.prestataire && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.prestataire}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-gray-400" />
                Description de la panne *
              </span>
            </label>
            <textarea
              name="description_panne"
              value={formData.description_panne}
              onChange={handleChange}
              rows={4}
              className={inputClasses("description_panne")}
              placeholder="Décrivez la panne constatée..."
            />
            {errors.description_panne && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.description_panne}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiDollarSign className="w-4 h-4 text-gray-400" />
                Coût (€)
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              name="cout"
              value={formData.cout}
              onChange={handleChange}
              className={inputClasses("cout")}
              placeholder="0.00"
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Date de retour
              </span>
            </label>
            <input
              type="date"
              name="date_retour"
              value={formData.date_retour}
              onChange={handleChange}
              className={inputClasses("date_retour")}
            />
          </motion.div>
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate("/reparations")}
          className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          <FiX className="w-4 h-4" />
          Annuler
        </button>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <FiSave className="w-4 h-4" />
          )}
          {editMode ? "Mettre à jour" : "Créer la réparation"}
        </button>
      </div>
    </motion.form>
  );
};

export default ReparationForm;
