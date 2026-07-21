import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { usePlongees } from "../../hooks/Plongee/usePlongees";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useFormations } from "../../hooks/Formation/useFormations";
import { useInscriptions } from "../../hooks/Inscription/useInscriptions";
import { useUsers } from "../../hooks/User/useUsers";
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
  FiRefreshCw,
  FiFileText,
  FiInfo,
  FiStar,
  FiZap,
  FiCompass,
  FiUsers,
  FiBarChart2,
  FiDollarSign,
  FiBookOpen,
  FiCamera,
  FiDownload,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { formatDate, formatDateTime } from "../../utils/helpers";
import { photoUrl } from "../../utils/photoUrl";
import LoadingSpinner from "../../components/Common/LoadingSpinner";
import api from "../../services/api";

const MAX_PHOTO_SIZE = 8 * 1024 * 1024; // 8 Mo, aligné sur la limite serveur (multer + ingress)

// Animations
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [exportingData, setExportingData] = useState(false);

  // RGPD (droit d'accès/portabilité, exigence 4.4) : télécharge un export
  // JSON des données personnelles du compte connecté.
  const handleExportData = async () => {
    setExportingData(true);
    try {
      const response = await api.get("/users/me/export");
      const blob = new Blob([JSON.stringify(response.data.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mes-donnees-${user?.id || "compte"}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Impossible d'exporter vos données",
      );
    } finally {
      setExportingData(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > MAX_PHOTO_SIZE) {
      toast.error("Photo trop volumineuse : la taille maximale autorisée est de 8 Mo.");
      e.target.value = "";
      return;
    }
    setPhotoFile(file);
    setPhotoPreview((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  // ✅ Récupération des données API
  const { useGetAll: useGetAllAdherents } = useAdherents();
  const { useGetAll: useGetAllPlongees } = usePlongees();
  const { useGetAll: useGetAllSorties } = useSorties();
  const { useGetAll: useGetAllFormations } = useFormations();
  const { useGetAll: useGetAllInscriptions } = useInscriptions();
  const { useGetAll: useGetAllUsers } = useUsers();
  const { useUpdateProfile } = useUsers();
  const updateProfile = useUpdateProfile();

  // ✅ Appels API
  const { data: adherentsData, isLoading: loadingAdherents } =
    useGetAllAdherents();
  const { data: plongeesData, isLoading: loadingPlongees } =
    useGetAllPlongees();
  const { data: sortiesData, isLoading: loadingSorties } = useGetAllSorties();
  const { data: formationsData, isLoading: loadingFormations } =
    useGetAllFormations();
  const { data: inscriptionsData, isLoading: loadingInscriptions } =
    useGetAllInscriptions();
  const { data: usersData, isLoading: loadingUsers } = useGetAllUsers();

  const isLoading =
    loadingAdherents ||
    loadingPlongees ||
    loadingSorties ||
    loadingFormations ||
    loadingInscriptions ||
    loadingUsers;

  // ✅ Trouver l'adhérent correspondant à l'utilisateur connecté
  const currentAdherent = useMemo(() => {
    if (!adherentsData?.data || !user) return null;
    return adherentsData.data.find((adherent) => adherent.email === user.email);
  }, [adherentsData, user]);

  // ✅ Statistiques en fonction du rôle
  const stats = useMemo(() => {
    const allPlongees = plongeesData?.data || [];
    const allSorties = sortiesData?.data || [];
    const allFormations = formationsData?.data || [];
    const allInscriptions = inscriptionsData?.data || [];
    const allAdherents = adherentsData?.data || [];
    const allUsers = usersData?.data || [];

    const userPlongees = currentAdherent
      ? allPlongees.filter(
          (p) => p.num_adherent === currentAdherent.num_adherent,
        )
      : [];

    const userInscriptions = currentAdherent
      ? allInscriptions.filter(
          (i) => i.num_adherent === currentAdherent.num_adherent,
        )
      : [];

    const userFormations = currentAdherent
      ? allFormations.filter(
          (f) => f.num_adherent === currentAdherent.num_adherent,
        )
      : [];

    // Statistiques communes
    const commonStats = {
      totalPlongees: userPlongees.length || 0,
      sortiesInscrites: userInscriptions.length || 0,
      formationsSuivies: userFormations.length || 0,
      certifications: currentAdherent?.niveau ? 1 : 0,
      anneesMembre: currentAdherent?.date_inscription
        ? new Date().getFullYear() -
          new Date(currentAdherent.date_inscription).getFullYear()
        : 1,
    };

    // Statistiques selon le rôle
    const roleStats = {
      // Président
      president: {
        ...commonStats,
        totalAdherents: allAdherents.length || 0,
        totalUsers: allUsers.filter((u) => u.role !== "admin").length || 0,
        totalSorties: allSorties.length || 0,
        totalPlongeesGlobal: allPlongees.length || 0,
        formationsEnCours:
          allFormations.filter((f) => f.statut === "En cours").length || 0,
        sortiesAvenir:
          allSorties.filter((s) => new Date(s.date_heure) > new Date())
            .length || 0,
      },
      // Moniteur
      moniteur: {
        ...commonStats,
        plongeesValidees:
          allPlongees.filter((p) => !!p.id_moniteur_validateur).length || 0,
        plongeesEnAttente:
          allPlongees.filter((p) => !p.id_moniteur_validateur).length || 0,
        formationsEncadrees:
          allFormations.filter(
            (f) => f.num_adherent === currentAdherent?.num_adherent,
          ).length || 0,
        sortiesEncadrees:
          allSorties.filter(
            (s) => s.moniteur_id === currentAdherent?.num_adherent,
          ).length || 0,
      },
      // Trésorier
      tresorier: {
        ...commonStats,
        totalPaiements: 0, // À remplacer par les données réelles des paiements
        paiementsEnAttente: 0,
        totalAdhesions:
          allAdherents.filter((a) => a.statut === "actif").length || 0,
        renouvellements:
          allAdherents.filter((a) => {
            const dateAdhesion = new Date(a.date_adhesion);
            const anneeActuelle = new Date().getFullYear();
            return dateAdhesion.getFullYear() === anneeActuelle;
          }).length || 0,
      },
      // Adhérent
      adherent: {
        ...commonStats,
        prochainesSorties:
          userInscriptions
            .filter((i) => i.statut === "Confirmée")
            .map((i) => i.id_sortie)
            .filter((id) => {
              const sortie = allSorties.find((s) => s.id_sortie === id);
              return sortie && new Date(sortie.date_heure) > new Date();
            }).length || 0,
        formationsTerminees:
          userFormations.filter((f) => f.statut === "Terminée").length || 0,
        participation:
          userPlongees.length > 0
            ? Math.round((userPlongees.length / allPlongees.length) * 100)
            : 0,
      },
    };

    const role = user?.role || "adherent";
    return roleStats[role] || roleStats.adherent;
  }, [
    plongeesData,
    sortiesData,
    formationsData,
    inscriptionsData,
    adherentsData,
    usersData,
    currentAdherent,
    user?.role,
  ]);

  // ✅ Dernières plongées (limité à 3)
  const recentDives = useMemo(() => {
    if (!currentAdherent) return [];
    const userPlongees = (plongeesData?.data || [])
      .filter((p) => p.num_adherent === currentAdherent.num_adherent)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);

    return userPlongees.map((p) => ({
      date: formatDate(p.date),
      site: p.site || p.lieu || "Site non renseigné",
      depth: p.profondeur_max ? `${p.profondeur_max}m` : "—",
      duration: p.duree ? `${p.duree}min` : "—",
    }));
  }, [plongeesData, currentAdherent]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let payload = formData;
      if (photoFile) {
        payload = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          payload.append(key, value);
        });
        payload.append("photo", photoFile);
      }
      const response = await updateProfile.mutateAsync(payload);
      updateUser(response.data);
      setPhotoFile(null);
      setPhotoPreview((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return null;
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleInfo = () => {
    const roles = {
      president: {
        icon: FiShield,
        label: "Président",
        color: "text-purple-500",
        bg: "bg-purple-100/50 dark:bg-purple-900/20",
      },
      moniteur: {
        icon: FiAnchor,
        label: "Moniteur",
        color: "text-blue-500",
        bg: "bg-blue-100/50 dark:bg-blue-900/20",
      },
      tresorier: {
        icon: FiDollarSign,
        label: "Trésorier",
        color: "text-green-500",
        bg: "bg-green-100/50 dark:bg-green-900/20",
      },
      adherent: {
        icon: FiUser,
        label: "Adhérent",
        color: "text-teal-500",
        bg: "bg-teal-100/50 dark:bg-teal-900/20",
      },
    };
    return roles[user?.role] || roles.adherent;
  };

  const roleInfo = getRoleInfo();

  // ✅ Statistiques en fonction du rôle
  const getDiveStats = () => {
    const role = user?.role || "adherent";

    const allStats = {
      president: [
        {
          icon: FiUsers,
          label: "Adhérents",
          value: stats.totalAdherents || 0,
          color: "from-purple-500 to-pink-500",
          bg: "bg-purple-500/10",
        },
        {
          icon: FiAnchor,
          label: "Sorties",
          value: stats.totalSorties || 0,
          color: "from-blue-500 to-cyan-500",
          bg: "bg-blue-500/10",
        },
        {
          icon: FiDroplet,
          label: "Plongées totales",
          value: stats.totalPlongeesGlobal || 0,
          color: "from-cyan-500 to-teal-500",
          bg: "bg-cyan-500/10",
        },
        {
          icon: FiBookOpen,
          label: "Formations en cours",
          value: stats.formationsEnCours || 0,
          color: "from-amber-500 to-orange-500",
          bg: "bg-amber-500/10",
        },
      ],
      moniteur: [
        {
          icon: FiCheckCircle,
          label: "Plongées validées",
          value: stats.plongeesValidees || 0,
          color: "from-green-500 to-emerald-500",
          bg: "bg-green-500/10",
        },
        {
          icon: FiClock,
          label: "En attente",
          value: stats.plongeesEnAttente || 0,
          color: "from-yellow-500 to-amber-500",
          bg: "bg-yellow-500/10",
        },
        {
          icon: FiBookOpen,
          label: "Formations encadrées",
          value: stats.formationsEncadrees || 0,
          color: "from-purple-500 to-indigo-500",
          bg: "bg-purple-500/10",
        },
        {
          icon: FiAnchor,
          label: "Sorties encadrées",
          value: stats.sortiesEncadrees || 0,
          color: "from-blue-500 to-cyan-500",
          bg: "bg-blue-500/10",
        },
      ],
      tresorier: [
        {
          icon: FiDollarSign,
          label: "Paiements",
          value: stats.totalPaiements || 0,
          color: "from-green-500 to-emerald-500",
          bg: "bg-green-500/10",
        },
        {
          icon: FiClock,
          label: "En attente",
          value: stats.paiementsEnAttente || 0,
          color: "from-yellow-500 to-amber-500",
          bg: "bg-yellow-500/10",
        },
        {
          icon: FiUsers,
          label: "Adhésions actives",
          value: stats.totalAdhesions || 0,
          color: "from-blue-500 to-cyan-500",
          bg: "bg-blue-500/10",
        },
        {
          icon: FiTrendingUp,
          label: "Renouvellements",
          value: stats.renouvellements || 0,
          color: "from-purple-500 to-pink-500",
          bg: "bg-purple-500/10",
        },
      ],
      adherent: [
        {
          icon: FiAnchor,
          label: "Plongées",
          value: stats.totalPlongees || 0,
          color: "from-cyan-500 to-blue-500",
          bg: "bg-cyan-500/10",
        },
        {
          icon: FiCalendar,
          label: "Sorties à venir",
          value: stats.prochainesSorties || 0,
          color: "from-emerald-500 to-teal-500",
          bg: "bg-emerald-500/10",
        },
        {
          icon: FiAward,
          label: "Formations suivies",
          value: stats.formationsSuivies || 0,
          color: "from-purple-500 to-pink-500",
          bg: "bg-purple-500/10",
        },
        {
          icon: FiCheckCircle,
          label: "Certifications",
          value: stats.certifications || 0,
          color: "from-amber-500 to-orange-500",
          bg: "bg-amber-500/10",
        },
      ],
    };

    return allStats[role] || allStats.adherent;
  };

  const diveStats = getDiveStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 px-4"
    >
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 dark:from-cyan-800 dark:via-blue-800 dark:to-indigo-800 p-6 md:p-8 text-white shadow-2xl"
      >
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
            <circle cx="70" cy="30" r="10" fill="white" opacity="0.15" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl md:text-4xl font-bold border-2 border-white/30 shadow-xl relative overflow-hidden">
              {photoUrl(user?.photo) ? (
                <img
                  src={photoUrl(user.photo)}
                  alt={user?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.name?.charAt(0) || "A"
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
                {user?.name || "Utilisateur"}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span
                  className={`px-3 py-1 ${roleInfo.bg} backdrop-blur-sm rounded-full text-xs md:text-sm font-medium flex items-center gap-1 ${roleInfo.color}`}
                >
                  <roleInfo.icon className="w-3 h-3 md:w-4 md:h-4" />
                  {roleInfo.label}
                </span>
                <span className="text-white/70 text-xs flex items-center gap-1">
                  <FiCalendar className="w-3 h-3 md:w-4 md:h-4" />
                  Membre depuis {stats.anneesMembre} an
                  {stats.anneesMembre > 1 ? "s" : ""}
                </span>
                <span className="text-white/70 text-xs flex items-center gap-1">
                  <FiDroplet className="w-3 h-3 md:w-4 md:h-4" />
                  {stats.totalPlongees} plongées
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2.5 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-300 flex items-center gap-2 text-sm font-medium border border-white/20 hover:border-white/40"
          >
            {isEditing ? (
              <>
                <FiX className="w-4 h-4" />
                Annuler
              </>
            ) : (
              <>
                <FiEdit2 className="w-4 h-4" />
                Modifier le profil
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Formulaire d'édition */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-100/80 dark:border-gray-800/80"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-xl font-bold text-gray-500 flex-shrink-0">
                {photoPreview || photoUrl(user?.photo) ? (
                  <img
                    src={photoPreview || photoUrl(user.photo)}
                    alt={user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0) || "A"
                )}
              </div>
              <div>
                <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl cursor-pointer transition-colors">
                  <FiCamera className="w-4 h-4" />
                  Changer la photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
                {photoFile && (
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {photoFile.name}
                  </p>
                )}
              </div>
            </div>
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
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 flex items-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FiSave className="w-4 h-4" />
                )}
                Enregistrer
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Statistiques adaptées au rôle */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {diveStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            variants={fadeInUp}
            whileHover={{ scale: 1.03, y: -3 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-4 text-center border border-gray-100/80 dark:border-gray-800/80 hover:shadow-2xl transition-all duration-300"
          >
            <div
              className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg mb-3`}
            >
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </p>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Informations personnelles et dernières plongées */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Informations personnelles */}
        <motion.div
          variants={fadeInUp}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-100/80 dark:border-gray-800/80"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400">
              <FiUser className="w-5 h-5" />
            </span>
            Informations personnelles
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
              <FiMail className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Email
                </p>
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
              <FiPhone className="w-5 h-5 text-teal-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Téléphone
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {currentAdherent?.telephone || user?.phone || "Non renseigné"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
              <FiAward className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Niveau
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {currentAdherent?.niveau || "Non défini"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
              <FiMapPin className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Adresse
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {currentAdherent?.adresse || "Non renseignée"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
              <FiHeart className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Contact urgence
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {currentAdherent?.contact_urgence || "Non renseigné"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dernières plongées */}
        <motion.div
          variants={fadeInUp}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-100/80 dark:border-gray-800/80"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400">
              <FiDroplet className="w-5 h-5" />
            </span>
            Dernières plongées
          </h3>
          {recentDives.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FiDroplet className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>Aucune plongée enregistrée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDives.map((dive, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors duration-300"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {dive.site}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {dive.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {dive.depth}
                    </span>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {dive.duration}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Confidentialité & données personnelles (RGPD) */}
      <motion.div
        variants={fadeInUp}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-100/80 dark:border-gray-800/80"
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
          <span className="p-2 rounded-xl bg-gradient-to-br from-slate-500/10 to-gray-500/10 text-slate-600 dark:text-slate-400">
            <FiShield className="w-5 h-5" />
          </span>
          Confidentialité & données personnelles
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            type="button"
            onClick={handleExportData}
            disabled={exportingData}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <FiDownload className="w-4 h-4" />
            {exportingData ? "Export en cours..." : "Télécharger mes données"}
          </button>
          <Link
            to="/confidentialite"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Consulter la politique de confidentialité
          </Link>
        </div>
      </motion.div>

      {/* Badge de membre */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 dark:from-cyan-800 dark:via-blue-800 dark:to-indigo-800 rounded-2xl p-6 text-white text-center shadow-xl"
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <FiHeart className="w-5 h-5 text-white/80 flex-shrink-0 animate-pulse" />
          <p className="text-sm font-medium">
            Membre actif depuis {stats.anneesMembre} an
            {stats.anneesMembre > 1 ? "s" : ""} • {stats.totalPlongees} plongées
            réalisées
          </p>
          <FiHeart className="w-5 h-5 text-white/80 flex-shrink-0 animate-pulse" />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProfilePage;
