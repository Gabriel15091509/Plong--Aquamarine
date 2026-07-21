import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FiUserPlus,
  FiShield,
  FiAward,
  FiDollarSign,
  FiUser,
  FiArrowLeft,
  FiArrowRight,
} from "react-icons/fi";
import ProtectedRoute from "../../components/Common/ProtectedRoute";

// ✅ Chaque rôle a sa propre fiche métier (Adherent, Moniteur, Trésorier,
// Président) avec des champs obligatoires que ce choix ne collecte pas.
// Chaque page dédiée crée elle-même le compte de connexion en même temps
// que la fiche, il n'existe donc pas de formulaire générique "nouveau
// compte" : on redirige vers la bonne page selon le rôle souhaité.
const ROLE_CARDS = [
  {
    role: "adherent",
    label: "Adhérent",
    description: "Membre du club : niveau, certificat médical, cotisation...",
    icon: FiUser,
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-700",
    to: "/adherents/create",
  },
  {
    role: "moniteur",
    label: "Moniteur",
    description: "Encadrant : numéro de brevet, spécialités, disponibilités...",
    icon: FiAward,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    to: "/moniteurs/create",
  },
  {
    role: "tresorier",
    label: "Trésorier",
    description: "Gestion des paiements et de la comptabilité du club.",
    icon: FiDollarSign,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    to: "/tresoriers/create",
  },
  {
    role: "president",
    label: "Président",
    description: "Promotion d'un moniteur existant à la présidence du club.",
    icon: FiShield,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    to: "/presidents/create",
  },
];

const UserCreatePage = () => {
  const navigate = useNavigate();

  return (
    <ProtectedRoute requiredPermission="manage_users">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 p-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <FiUserPlus className="w-6 h-6 text-cyan-500" />
              Nouveau compte
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Quel type de compte souhaitez-vous créer ?
            </p>
          </div>
          <button
            onClick={() => navigate("/users")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-300"
          >
            <FiArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ROLE_CARDS.map(({ role, label, description, icon: Icon, color, bg, to }) => (
            <button
              key={role}
              onClick={() => navigate(to)}
              className="text-left bg-white dark:bg-gray-800 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700 p-5 hover:border-cyan-400 dark:hover:border-cyan-500 hover:shadow-lg transition-all duration-200 group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {label}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {description}
                  </p>
                </div>
                <FiArrowRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-xl p-4 border bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800/30">
          <p className="text-sm text-cyan-700 dark:text-cyan-300">
            Le compte de connexion est créé automatiquement en même temps que
            la fiche choisie — il n'y a rien d'autre à faire ensuite.
          </p>
        </div>
      </motion.div>
    </ProtectedRoute>
  );
};

export default UserCreatePage;
