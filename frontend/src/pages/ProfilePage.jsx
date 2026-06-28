import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiShield,
  FiEdit2,
  FiSave,
  FiX,
  FiAnchor,
  FiClock,
  FiCheckCircle,
  FiAward,
  FiTrendingUp,
  FiMapPin,
  FiHeart,
  FiDroplet,
} from "react-icons/fi";
import { formatDate } from "../utils/helpers";

const ProfilePage = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
  });

  const [stats] = useState({
    totalPlongees: 42,
    sortiesInscrites: 15,
    formationsSuivies: 3,
    certifications: 2,
    anneesMembre: 3,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsEditing(false);
  };

  const getRoleInfo = () => {
    const roles = {
      president: {
        icon: FiShield,
        label: "Président",
        color: "text-purple-500",
        bg: "bg-purple-100/50",
      },
      moniteur: {
        icon: FiAnchor,
        label: "Moniteur",
        color: "text-blue-500",
        bg: "bg-blue-100/50",
      },
      tresorier: {
        icon: FiShield,
        label: "Trésorier",
        color: "text-green-500",
        bg: "bg-green-100/50",
      },
      adherent: {
        icon: FiUser,
        label: "Adhérent",
        color: "text-teal-500",
        bg: "bg-teal-100/50",
      },
    };
    return roles[user?.role] || roles.adherent;
  };

  const roleInfo = getRoleInfo();

  // ✅ Statistiques du carnet de plongée
  const diveStats = [
    {
      icon: FiAnchor,
      label: "Plongées totales",
      value: stats.totalPlongees,
      color: "from-cyan-400 to-blue-500",
    },
    {
      icon: FiCalendar,
      label: "Sorties inscrites",
      value: stats.sortiesInscrites,
      color: "from-emerald-400 to-teal-500",
    },
    {
      icon: FiAward,
      label: "Formations suivies",
      value: stats.formationsSuivies,
      color: "from-purple-400 to-pink-500",
    },
    {
      icon: FiCheckCircle,
      label: "Certifications",
      value: stats.certifications,
      color: "from-amber-400 to-orange-500",
    },
  ];

  // ✅ Dernières plongées
  const recentDives = [
    {
      date: "15/06/2024",
      site: "Récif de l'Hermitage",
      depth: "22m",
      duration: "38min",
    },
    {
      date: "08/06/2024",
      site: "Épave du Dromadaire",
      depth: "18m",
      duration: "45min",
    },
    {
      date: "01/06/2024",
      site: "Jardin des Coraux",
      depth: "15m",
      duration: "30min",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* En-tête avec gradient aquamarine */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 p-8 text-white">
        <div className="absolute inset-0 opacity-10">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 L100,0 L100,100 L0,100 Z"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
            <circle cx="20" cy="20" r="15" fill="white" opacity="0.3" />
            <circle cx="80" cy="80" r="20" fill="white" opacity="0.2" />
            <circle cx="50" cy="50" r="25" fill="white" opacity="0.1" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl font-bold border-2 border-white/30 shadow-xl">
              {user?.name?.charAt(0) || "A"}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{user?.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span
                  className={`px-3 py-1 ${roleInfo.bg} backdrop-blur-sm rounded-full text-sm font-medium flex items-center gap-1 ${roleInfo.color}`}
                >
                  <roleInfo.icon className="w-4 h-4" />
                  {roleInfo.label}
                </span>
                <span className="text-white/70 text-sm flex items-center gap-1">
                  <FiCalendar className="w-4 h-4" />
                  Membre depuis 2021
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-300 flex items-center gap-2 text-sm font-medium"
          >
            {isEditing ? (
              <>
                <FiX className="w-4 h-4" />
                Annuler
              </>
            ) : (
              <>
                <FiEdit2 className="w-4 h-4" />
                Modifier
              </>
            )}
          </button>
        </div>
      </div>

      {/* Formulaire d'édition */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-gray-700/50"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-primary bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 flex items-center gap-2"
              >
                <FiSave className="w-4 h-4" />
                Enregistrer
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Statistiques du carnet de plongée */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {diveStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.03, y: -3 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 text-center border border-white/20 dark:border-gray-700/50"
          >
            <div
              className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg mb-2`}
            >
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Informations personnelles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-gray-700/50">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FiUser className="w-5 h-5 text-cyan-500" />
            Informations personnelles
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl">
              <FiMail className="w-5 h-5 text-cyan-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Email
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl">
              <FiPhone className="w-5 h-5 text-teal-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Téléphone
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {user?.phone || "Non renseigné"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl">
              <FiMapPin className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Localisation
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  Saint-Leu, La Réunion
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dernières plongées */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-gray-700/50">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FiDroplet className="w-5 h-5 text-cyan-500" />
            Dernières plongées
          </h3>
          <div className="space-y-3">
            {recentDives.map((dive, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl hover:bg-cyan-50/50 dark:hover:bg-cyan-900/20 transition-colors cursor-pointer"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {dive.site}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {dive.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                    {dive.depth}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {dive.duration}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Badge de membre */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 rounded-2xl p-6 text-white text-center"
      >
        <div className="flex items-center justify-center gap-3">
          <FiHeart className="w-6 h-6 text-white/80" />
          <p className="text-sm font-medium">
            Membre actif depuis {stats.anneesMembre} ans • {stats.totalPlongees}{" "}
            plongées réalisées
          </p>
          <FiHeart className="w-6 h-6 text-white/80" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProfilePage;
