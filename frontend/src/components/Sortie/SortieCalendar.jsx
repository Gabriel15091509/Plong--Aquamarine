import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiMapPin,
  FiClock,
  FiUsers,
  FiInfo,
  FiX,
  FiEye,
  FiTrendingUp,
  FiCheckCircle,
  FiXCircle,
  FiClock as FiClockIcon,
  FiArrowRight,
  FiBarChart2,
} from "react-icons/fi";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  differenceInDays,
} from "date-fns";
import { fr } from "date-fns/locale";
import { useSorties } from "../../hooks/Sortie/useSorties";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";
import StatusBadge from "../Common/StatusBadge";
import { formatDate } from "../../utils/helpers";

// Animations
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const SortieCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSortie, setSelectedSortie] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredDay, setHoveredDay] = useState(null);
  // Sur mobile, une grille 7 colonnes n'a pas la place d'afficher le détail
  // de chaque sortie dans la cellule (texte illisible en dessous de ~55px
  // de large) — on tape la cellule pour ouvrir l'agenda du jour à la place.
  const [dayAgenda, setDayAgenda] = useState(null);

  const { useGetAll } = useSorties();
  const { data, isLoading, error } = useGetAll();

  const sorties = data?.data || [];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const sortiesByDay = useMemo(() => {
    const map = {};
    sorties.forEach((sortie) => {
      const date = new Date(sortie.date_heure);
      const dateKey = format(date, "yyyy-MM-dd");
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(sortie);
    });
    return map;
  }, [sorties]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleSortieClick = (sortie) => {
    setSelectedSortie(sortie);
    setIsModalOpen(true);
  };

  const handleDayCellClick = (day, daySorties) => {
    if (daySorties.length === 0) return;
    setDayAgenda({ date: day, sorties: daySorties });
  };

  const getStatusColor = (statut) => {
    const colors = {
      Planifiée: "border-blue-400 dark:border-blue-500",
      "En cours": "border-green-400 dark:border-green-500",
      Terminée: "border-gray-400 dark:border-gray-500",
      Annulée: "border-red-400 dark:border-red-500",
    };
    return colors[statut] || "border-gray-300";
  };

  const getStatusBgColor = (statut) => {
    const colors = {
      Planifiée: "bg-blue-500",
      "En cours": "bg-green-500",
      Terminée: "bg-gray-500",
      Annulée: "bg-red-500",
    };
    return colors[statut] || "bg-gray-300";
  };

  const getStatusIcon = (statut) => {
    const icons = {
      Planifiée: FiCalendar,
      "En cours": FiClockIcon,
      Terminée: FiCheckCircle,
      Annulée: FiXCircle,
    };
    return icons[statut] || FiCalendar;
  };

  // Badge de statut de l'agenda du jour (dayAgenda) : fonds pleins en mode
  // sombre (dark:bg-*-950), pas de variante /30 semi-transparente — même
  // raison que le correctif des badges de vignette de SortiesPage : un
  // badge posé sur un fond de carte peut se permettre une teinte
  // translucide, mais rien ne garantit ici un fond suffisamment sombre
  // pour rester lisible, autant utiliser d'emblée un fond opaque.
  const getStatusBadgeColor = (statut) => {
    const colors = {
      Planifiée: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
      "En cours":
        "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
      Terminée: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
      Annulée: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
    };
    return (
      colors[statut] ||
      "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
    );
  };

  const getStatusLabel = (statut) => {
    const labels = {
      Planifiée: "Planifiée",
      "En cours": "En cours",
      Terminée: "Terminée",
      Annulée: "Annulée",
    };
    return labels[statut] || statut;
  };

  const getDayStatus = (day) => {
    const dateKey = format(day, "yyyy-MM-dd");
    const daySorties = sortiesByDay[dateKey] || [];
    if (daySorties.length === 0) return null;

    const hasPlanned = daySorties.some((s) => s.statut === "Planifiée");
    const hasOngoing = daySorties.some((s) => s.statut === "En cours");
    const hasCompleted = daySorties.some((s) => s.statut === "Terminée");

    if (hasOngoing) return "ongoing";
    if (hasPlanned) return "planned";
    if (hasCompleted) return "completed";
    return "other";
  };

  const getDayDotColor = (status) => {
    const colors = {
      planned: "bg-blue-500 dark:bg-blue-400",
      ongoing: "bg-green-500 dark:bg-green-400",
      completed: "bg-gray-400 dark:bg-gray-500",
      other: "bg-purple-400 dark:bg-purple-400",
    };
    return colors[status] || "bg-gray-300";
  };

  // Statistiques
  const stats = {
    total: sorties.length,
    planifiees: sorties.filter((s) => s.statut === "Planifiée").length,
    enCours: sorties.filter((s) => s.statut === "En cours").length,
    terminees: sorties.filter((s) => s.statut === "Terminée").length,
    annulees: sorties.filter((s) => s.statut === "Annulée").length,
  };

  if (isLoading) {
    return <LoadingSpinner variant="calendar" />;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-2xl p-6 text-center">
        <p className="text-red-600 dark:text-red-400">
          Erreur lors du chargement des sorties
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête du calendrier */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-2xl border border-gray-100/80 dark:border-gray-800/80"
      >
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
          >
            <FiChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          <div className="min-w-[140px] sm:min-w-[200px] text-center">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white capitalize">
              {format(currentDate, "MMMM yyyy", { locale: fr })}
            </h2>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
          >
            <FiChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <button
          onClick={handleToday}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150"
        >
          <FiCalendar className="w-4 h-4" />
          Aujourd'hui
        </button>
      </motion.div>

      {/* Statistiques rapides */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 sm:grid-cols-5 gap-3"
      >
        {[
          {
            label: "Total",
            value: stats.total,
            color: "cyan",
            icon: FiBarChart2,
          },
          {
            label: "Planifiées",
            value: stats.planifiees,
            color: "blue",
            icon: FiCalendar,
          },
          {
            label: "En cours",
            value: stats.enCours,
            color: "green",
            icon: FiClockIcon,
          },
          {
            label: "Terminées",
            value: stats.terminees,
            color: "gray",
            icon: FiCheckCircle,
          },
          {
            label: "Annulées",
            value: stats.annulees,
            color: "red",
            icon: FiXCircle,
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
            whileHover={{ scale: 1.03, y: -2 }}
            className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center shadow-sm hover:shadow-md transition-all`}
          >
            <p
              className={`text-lg font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}
            >
              {stat.value}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Légende */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap items-center gap-4 text-xs bg-white dark:bg-gray-800 p-3 rounded-xl shadow-card border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm" />
          <span className="text-gray-600 dark:text-gray-400">Planifiée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm" />
          <span className="text-gray-600 dark:text-gray-400">En cours</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-500 rounded-full shadow-sm" />
          <span className="text-gray-600 dark:text-gray-400">Terminée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm" />
          <span className="text-gray-600 dark:text-gray-400">Annulée</span>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <div className="w-3 h-3 bg-cyan-200 border-2 border-cyan-500 rounded-full shadow-sm" />
          <span className="text-gray-600 dark:text-gray-400">Aujourd'hui</span>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <div className="w-3 h-3 bg-purple-400 rounded-full shadow-sm" />
          <span className="text-gray-600 dark:text-gray-400">
            Sorties multiples
          </span>
        </div>
      </motion.div>

      {/* Grille du calendrier */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700"
      >
        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(
            (day, index) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="py-2 sm:py-3 text-center text-[11px] sm:text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800"
              >
                <span className="sm:hidden">{day.slice(0, 2)}</span>
                <span className="hidden sm:inline">{day}</span>
              </motion.div>
            ),
          )}
        </div>

        {/* Jours du mois */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
          {days.map((day, index) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const daySorties = sortiesByDay[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            const dayStatus = getDayStatus(day);
            const isHovered = hoveredDay === dateKey;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.003 }}
                whileHover={{ scale: 1.02 }}
                onHoverStart={() => setHoveredDay(dateKey)}
                onHoverEnd={() => setHoveredDay(null)}
                onClick={() => handleDayCellClick(day, daySorties)}
                className={`relative min-h-[52px] sm:min-h-[110px] p-1 sm:p-2 bg-white dark:bg-gray-800 transition-all duration-200 ${
                  daySorties.length > 0 ? "cursor-pointer" : ""
                } ${!isCurrentMonth ? "opacity-40" : ""} ${
                  isTodayDate ? "bg-cyan-50 dark:bg-cyan-900/10" : ""
                } ${isHovered ? "shadow-inner" : ""}`}
              >
                <div className="flex flex-col h-full">
                  {/* Numéro du jour */}
                  <div className="flex items-center justify-between mb-1">
                    <motion.span
                      whileHover={{ scale: 1.1 }}
                      className={`text-xs sm:text-sm font-medium ${
                        isTodayDate
                          ? "w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {format(day, "d")}
                    </motion.span>
                    {daySorties.length > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1"
                      >
                        <span className="sm:hidden text-[10px] font-semibold leading-none text-gray-500 dark:text-gray-400">
                          {daySorties.length}
                        </span>
                        <div
                          className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${getDayDotColor(dayStatus)} shadow-sm`}
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Sorties du jour — assez de place seulement à partir de
                      sm : sur mobile la cellule ne fait qu'~52px de large sur
                      7 colonnes, le nom de la sortie y serait illisible.
                      Un tap sur la cellule ouvre l'agenda du jour à la
                      place (voir dayAgenda plus bas). */}
                  <div className="hidden sm:block flex-1 space-y-0.5 mt-0.5 overflow-hidden">
                    {daySorties.slice(0, 3).map((sortie, idx) => (
                      <motion.button
                        key={sortie.id_sortie}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.03, x: 3 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSortieClick(sortie);
                        }}
                        className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded border-l-2 ${getStatusColor(
                          sortie.statut,
                        )} hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 truncate group`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="font-medium truncate text-gray-700 dark:text-gray-300">
                            {sortie.type}
                          </span>
                          <span className="text-[8px] text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            {format(new Date(sortie.date_heure), "HH:mm")}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                    {daySorties.length > 3 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDayCellClick(day, daySorties);
                        }}
                        className="w-full text-left text-[10px] px-1.5 py-0.5 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium"
                      >
                        +{daySorties.length - 3} autres
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Tooltip au survol (desktop uniquement, pas de hover tactile) */}
                {isHovered && daySorties.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hidden sm:block absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap z-10"
                  >
                    {daySorties.length} sortie{daySorties.length > 1 ? "s" : ""}
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Modal Détails Sortie amélioré */}
      <AnimatePresence>
        {isModalOpen && selectedSortie && (
          <ModalOverlay
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30, rotateX: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 30, rotateX: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* En-tête */}
              <div
                className={`sticky top-0 ${
                  selectedSortie.statut === "Planifiée"
                    ? "bg-blue-600"
                    : selectedSortie.statut === "En cours"
                      ? "bg-green-600"
                      : selectedSortie.statut === "Terminée"
                        ? "bg-gray-600"
                        : "bg-red-600"
                } p-4 flex items-center justify-between`}
              >
                <div className="flex items-center gap-3 text-white">
                  <div className="p-2 bg-white/20 rounded-xl">
                    {React.createElement(getStatusIcon(selectedSortie.statut), {
                      className: "w-5 h-5",
                    })}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedSortie.type}
                    </h3>
                    <p className="text-xs text-white/80">
                      {getStatusLabel(selectedSortie.statut)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Contenu avec animations */}
              <div className="p-6 space-y-4">
                {[
                  {
                    icon: FiMapPin,
                    label: "Lieu",
                    value: `${selectedSortie.lieu} - ${selectedSortie.site}`,
                    color: "cyan",
                  },
                  {
                    icon: FiCalendar,
                    label: "Date",
                    value: format(
                      new Date(selectedSortie.date_heure),
                      "EEEE d MMMM yyyy",
                      { locale: fr },
                    ),
                    sub: format(new Date(selectedSortie.date_heure), "HH:mm"),
                    color: "blue",
                  },
                  {
                    icon: FiUsers,
                    label: "Participants",
                    value: `${selectedSortie.nb_places} places`,
                    sub: `Niveau: ${selectedSortie.niveau_requis}`,
                    color: "green",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div
                      className={`p-2 bg-${item.color}-100 dark:bg-${item.color}-900/30 rounded-xl flex-shrink-0`}
                    >
                      <item.icon
                        className={`w-5 h-5 text-${item.color}-600 dark:text-${item.color}-400`}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.label}
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.value}
                      </p>
                      {item.sub && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {item.sub}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}

                {selectedSortie.description_site && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {selectedSortie.description_site}
                    </p>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"
                >
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      window.location.href = `/sorties/${selectedSortie.id_sortie}`;
                    }}
                    className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl transition-colors duration-150 flex items-center justify-center gap-2 font-medium"
                  >
                    <FiEye className="w-4 h-4" />
                    Voir les détails
                    <FiArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Agenda du jour (mobile) — ouvert en tapant une cellule du
          calendrier qui contient des sorties, puisque la grille 7 colonnes
          n'a pas la place d'afficher le détail de chaque sortie sur
          téléphone. Reste utilisable au clavier/souris sur desktop
          (tap sur une case vide de la cellule). */}
      <AnimatePresence>
        {dayAgenda && (
          <ModalOverlay
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md"
            onClick={() => setDayAgenda(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Poignée du tiroir (mobile) : simple affordance visuelle,
                  n'a pas de rôle interactif propre. */}
              <div className="sm:hidden flex justify-center pt-2.5 pb-1">
                <div className="h-1.5 w-10 rounded-full bg-gray-200 dark:bg-gray-600" />
              </div>

              <div className="sticky top-0 bg-white dark:bg-gray-800 px-5 pt-3 sm:pt-5 pb-4 flex items-start justify-between border-b border-gray-100 dark:border-gray-700">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-primary-600 dark:text-primary-400">
                    {format(dayAgenda.date, "EEEE", { locale: fr })}
                  </p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                      {format(dayAgenda.date, "d")}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {format(dayAgenda.date, "MMMM yyyy", { locale: fr })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                    {dayAgenda.sorties.length} sortie
                    {dayAgenda.sorties.length > 1 ? "s" : ""} ce jour-là
                  </p>
                </div>
                <button
                  onClick={() => setDayAgenda(null)}
                  className="p-2 -mr-1.5 -mt-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 transition-colors"
                  aria-label="Fermer"
                >
                  <FiX className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Agenda du jour : l'horaire ancre chaque ligne à gauche
                  (ce sont des événements ordonnés dans le temps, pas une
                  simple liste), le statut se lit par une puce discrète +
                  un badge, plutôt qu'un pictogramme générique dans un
                  carré et une barre de couleur verticale. */}
              <div className="px-5 py-1">
                {dayAgenda.sorties.map((sortie) => (
                  <button
                    key={sortie.id_sortie}
                    type="button"
                    onClick={() => {
                      setDayAgenda(null);
                      handleSortieClick(sortie);
                    }}
                    className="w-full flex items-start gap-3 text-left py-3.5 border-b border-gray-100 dark:border-gray-700/60 last:border-0 group"
                  >
                    <div className="flex flex-col items-center flex-shrink-0 w-11 pt-0.5">
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 tabular-nums">
                        {format(new Date(sortie.date_heure), "HH:mm")}
                      </span>
                      <span
                        className={`mt-1.5 w-2 h-2 rounded-full ${getStatusBgColor(sortie.statut)}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                          {sortie.type}
                        </p>
                        <span
                          className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadgeColor(
                            sortie.statut,
                          )}`}
                        >
                          {getStatusLabel(sortie.statut)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {sortie.lieu}
                        {sortie.site ? ` · ${sortie.site}` : ""}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SortieCalendar;
