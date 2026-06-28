import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiUserPlus, FiUser, FiMail, FiPhone, FiShield, FiAward, FiArrowLeft, FiSave } from 'react-icons/fi';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/Common/ProtectedRoute';

const UserCreatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { useCreate } = useUsers();
  const create = useCreate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'adherent',
    phone: '',
    contact_urgence: '',
    niveau: ''
  });

  const roleOptions = [
    { value: 'president', label: '👑 Président', bg: 'bg-purple-100 text-purple-700' },
    { value: 'moniteur', label: '🏊 Moniteur', bg: 'bg-blue-100 text-blue-700' },
    { value: 'tresorier', label: '💰 Trésorier', bg: 'bg-green-100 text-green-700' },
    { value: 'adherent', label: '🤿 Adhérent', bg: 'bg-teal-100 text-teal-700' },
  ];

  const niveauOptions = [
    'Débutant',
    'Niveau 1',
    'Niveau 2',
    'Niveau 3',
    'Niveau 4',
    'Moniteur'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'L\'email est requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    if (!formData.name) newErrors.name = 'Le nom est requis';
    if (!formData.role) newErrors.role = 'Le rôle est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      await create.mutateAsync(formData);
      navigate('/users');
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredPermission="manage_users">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-3xl mx-auto space-y-6"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <FiUserPlus className="w-6 h-6 text-cyan-500" />
              Nouvel utilisateur
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Créez un nouveau compte utilisateur
            </p>
          </div>
          <button
            onClick={() => navigate('/users')}
            className="btn-secondary flex items-center gap-2"
          >
            <FiArrowLeft className="w-4 h-4" />
            Retour
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-card p-6 space-y-6 border border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom complet *
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jean Dupont"
                  className={`input-field pl-10 ${errors.name ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jean@email.com"
                  className={`input-field pl-10 ${errors.email ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Rôle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rôle *
              </label>
              <div className="relative">
                <FiShield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`input-field pl-10 ${errors.role ? 'border-red-500' : ''}`}
                >
                  {roleOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Téléphone
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0612345678"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Contact urgence */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact d'urgence
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="contact_urgence"
                  value={formData.contact_urgence}
                  onChange={handleChange}
                  placeholder="Marie Dupont - 0612345678"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Niveau */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Niveau de plongée
              </label>
              <div className="relative">
                <FiAward className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  name="niveau"
                  value={formData.niveau}
                  onChange={handleChange}
                  className="input-field pl-10"
                >
                  <option value="">Sélectionner un niveau</option>
                  {niveauOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Informations */}
          <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-xl p-4 border border-cyan-200 dark:border-cyan-800/30">
            <p className="text-sm text-cyan-700 dark:text-cyan-300 flex items-start gap-2">
              <span className="text-lg">📧</span>
              <span>
                Un email sera envoyé à l'utilisateur avec ses identifiants de connexion.
                L'utilisateur devra changer son mot de passe à la première connexion.
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || create.isPending}
              className="btn-primary bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 flex items-center gap-2"
            >
              {loading || create.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Création...
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  Créer l'utilisateur
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </ProtectedRoute>
  );
};

export default UserCreatePage;