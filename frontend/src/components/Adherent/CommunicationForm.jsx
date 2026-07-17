import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiSend, FiX, FiUsers, FiCalendar, FiTag, FiMessageSquare } from "react-icons/fi";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { NIVEAU_OPTIONS } from "../../utils/constants";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

// Communication ciblée (CDC 3.6.1) : message libre envoyé par email à un
// segment d'adhérents Actifs, filtré par niveau et/ou ancienneté minimale.
const CommunicationForm = () => {
  const navigate = useNavigate();
  const { useSendCommunication } = useAdherents();
  const send = useSendCommunication();

  const [formData, setFormData] = useState({
    niveau: "",
    ancienneteMinAnnees: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.subject.trim()) newErrors.subject = "L'objet est requis";
    if (!formData.message.trim()) newErrors.message = "Le message est requis";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    send.mutate({
      niveau: formData.niveau || undefined,
      ancienneteMinAnnees: formData.ancienneteMinAnnees || undefined,
      subject: formData.subject,
      message: formData.message,
    });
  };

  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";
  const inputClasses =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-6 md:p-8 space-y-6"
    >
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Communication ciblée
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Envoie un email à tous les adhérents actifs correspondant aux critères ci-dessous.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiUsers className="w-4 h-4 text-gray-400" />
                Niveau
              </span>
            </label>
            <select
              name="niveau"
              value={formData.niveau}
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="">Tous les niveaux</option>
              {NIVEAU_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Ancienneté minimale (années)
              </span>
            </label>
            <input
              type="number"
              name="ancienneteMinAnnees"
              value={formData.ancienneteMinAnnees}
              onChange={handleChange}
              min="0"
              placeholder="Aucun filtre"
              className={inputClasses}
            />
          </motion.div>
        </div>

        <motion.div {...fadeInUp}>
          <label className={labelClasses}>
            <span className="flex items-center gap-2">
              <FiTag className="w-4 h-4 text-gray-400" />
              Objet *
            </span>
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Ex : Newsletter du mois"
            className={inputClasses}
          />
          {errors.subject && (
            <p className="mt-1.5 text-sm text-red-500">{errors.subject}</p>
          )}
        </motion.div>

        <motion.div {...fadeInUp}>
          <label className={labelClasses}>
            <span className="flex items-center gap-2">
              <FiMessageSquare className="w-4 h-4 text-gray-400" />
              Message *
            </span>
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={8}
            placeholder="Contenu du message..."
            className={inputClasses}
          />
          {errors.message && (
            <p className="mt-1.5 text-sm text-red-500">{errors.message}</p>
          )}
        </motion.div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/adherents")}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl transition-all"
          >
            <FiX className="w-4 h-4" />
            Annuler
          </button>
          <button
            type="submit"
            disabled={send.isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 disabled:opacity-60"
          >
            <FiSend className="w-4 h-4" />
            Envoyer
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default CommunicationForm;
