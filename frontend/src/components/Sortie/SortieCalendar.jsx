import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useModalNavigate } from "../../hooks/useModalNavigate";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";

const SortieCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  // Sur mobile, une grille 7 colonnes n'a pas la place d'afficher le détail
  // de chaque sortie dans la cellule (texte illisible en dessous de ~55px
  // de large) — on tape la cellule pour ouvrir l'agenda du jour à la place.
  const [dayAgenda, setDayAgenda] = useState(null);
  const modalNavigate = useModalNavigate();

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

  // navigate() SPA (pas window.location.href, qui forçait un rechargement
  // complet de la page) : modalNavigate pose le state.backgroundLocation
  // attendu par ModalLink.jsx, /calendrier reste affiché en dessous de la
  // fiche /sorties/:id plutôt que d'être remplacé. Cliquer une sortie
  // ouvrait auparavant un aperçu intermédiaire (lieu/date/participants +
  // bouton "Voir les détails") avant la fiche complète — supprimé, on va
  // directement à la fiche.
  const handleSortieClick = (sortie) => {
    modalNavigate(`/sorties/${sortie.id_sortie}`);
  };

  const handleDayCellClick = (day, daySorties) => {
    if (daySorties.length === 0) return;
    setDayAgenda({ date: day, sorties: daySorties });
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
      other: "bg-red-500 dark:bg-red-400",
    };
    return colors[status] || "bg-gray-300";
  };

  const sortiesDuMois = sorties.filter((s) =>
    isSameMonth(new Date(s.date_heure), currentDate),
  );

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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Calendrier
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {sortiesDuMois.length} sortie{sortiesDuMois.length > 1 ? "s" : ""} en{" "}
            {format(currentDate, "MMMM yyyy", { locale: fr })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {"Aujourd'hui"}
          </button>
          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={handlePrevMonth}
              aria-label="Mois précédent"
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <span className="w-32 sm:w-40 text-center text-sm font-semibold text-gray-900 dark:text-white capitalize border-x border-gray-200 dark:border-gray-700 py-1.5">
              {format(currentDate, "MMMM yyyy", { locale: fr })}
            </span>
            <button
              onClick={handleNextMonth}
              aria-label="Mois suivant"
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grille du calendrier — cellules à plat, sans animation : la grille
          se recalcule à chaque changement de mois, autant qu'elle s'affiche
          d'un bloc. */}
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <div
              key={day}
              className="py-2 text-center text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500"
            >
              <span className="sm:hidden">{day.slice(0, 1)}</span>
              <span className="hidden sm:inline">{day}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const daySorties = sortiesByDay[dateKey] || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            const dayStatus = getDayStatus(day);
            const isLastRow = index >= days.length - 7;
            const isLastCol = index % 7 === 6;

            return (
              <div
                key={dateKey}
                onClick={() => handleDayCellClick(day, daySorties)}
                className={`min-h-[52px] sm:min-h-[104px] p-1 sm:p-1.5 border-gray-100 dark:border-gray-700/60 ${
                  isLastRow ? "" : "border-b"
                } ${isLastCol ? "" : "border-r"} ${
                  daySorties.length > 0
                    ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    : ""
                } ${!isCurrentMonth ? "bg-gray-50/60 dark:bg-gray-900/30" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs sm:text-[13px] tabular-nums ${
                      isTodayDate
                        ? "w-6 h-6 rounded-full bg-cyan-600 text-white font-semibold flex items-center justify-center"
                        : isCurrentMonth
                          ? "px-1 font-medium text-gray-700 dark:text-gray-200"
                          : "px-1 text-gray-300 dark:text-gray-600"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {/* Mobile : pas la place des libellés, un compteur + la
                      puce du statut dominant suffisent (le tap ouvre
                      l'agenda du jour). */}
                  {daySorties.length > 0 && (
                    <span className="sm:hidden flex items-center gap-1">
                      <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                        {daySorties.length}
                      </span>
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${getDayDotColor(dayStatus)}`}
                      />
                    </span>
                  )}
                </div>

                <div className="hidden sm:block mt-1 space-y-px">
                  {daySorties.slice(0, 3).map((sortie) => (
                    <button
                      key={sortie.id_sortie}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSortieClick(sortie);
                      }}
                      title={`${format(new Date(sortie.date_heure), "HH:mm")} · ${sortie.type}`}
                      className={`w-full flex items-center gap-1.5 text-left text-[11px] leading-5 px-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        isCurrentMonth ? "" : "opacity-50"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusBgColor(sortie.statut)}`}
                      />
                      <span className="truncate text-gray-700 dark:text-gray-300">
                        {sortie.type}
                      </span>
                    </button>
                  ))}
                  {daySorties.length > 3 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDayCellClick(day, daySorties);
                      }}
                      className="w-full text-left text-[11px] leading-5 px-1 text-gray-500 dark:text-gray-400 hover:text-cyan-700 dark:hover:text-cyan-400"
                    >
                      +{daySorties.length - 3} autres
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Légende : une seule, sous la grille */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
        {["Planifiée", "En cours", "Terminée", "Annulée"].map((statut) => (
          <span key={statut} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${getStatusBgColor(statut)}`} />
            {statut}
          </span>
        ))}
      </div>

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
                          {sortie.statut}
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
