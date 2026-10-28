import React, { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiCheck,
  FiX,
  FiClock,
  FiDroplet,
  FiChevronRight,
  FiUser,
  FiCalendar,
  FiSearch,
  FiFilter,
  FiClipboard,
  FiSave,
  FiList,
  FiGrid,
  FiLayers,
  FiAnchor,
  FiUsers,
  FiExternalLink,
  FiRefreshCw,
} from "react-icons/fi";
import toast from "react-hot-toast";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";
import ConfirmModal from "../Common/ConfirmModal";
import BulkActionBar from "../Common/BulkActionBar";
import Pagination from "../Common/Pagination";
import ModalLink from "../Common/ModalLink";
import TabBar from "../Common/TabBar";
import { usePlongees } from "../../hooks/Plongee/usePlongees";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useMoniteurs } from "../../hooks/Moniteur/useMoniteurs";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { usePalanquees } from "../../hooks/Palanquee/usePalanquees";
import { useAuth } from "../../context/AuthContext";
import { useSelection } from "../../hooks/useSelection";
import { formatDate, courantDepuisVitesse } from "../../utils/helpers";
import { photoUrl } from "../../utils/photoUrl";
import {
  TYPE_PLONGEE_OPTIONS,
  VISIBILITE_OPTIONS,
  COURANT_OPTIONS,
} from "../../utils/constants";
import sortieService from "../../services/Sortie/sortieService";
import plongeeService from "../../services/Plongee/plongeeService";
import PlongeeFormModal from "./PlongeeFormModal";
import PlongeeDetails from "./PlongeeDetails";

import ErrorState from "../Common/ErrorState";

// Brouillon : plongée créée automatiquement au pointage de présence (voir
// PalanqueeService.creerPlongeeBrouillon), profondeur/durée pas encore
// saisies par le moniteur — distinct de "Non validée" (des mesures peuvent
// être renseignées sans que la plongée soit encore validée).
const isBrouillon = (p) => p.profondeur_max == null || p.duree == null;

// Nombre de sorties dépliées par défaut dans la vue groupée (les plus
// récentes, voir groupedPlongees déjà trié par date décroissante) — voir
// defaultCollapsedIds plus bas pour le pourquoi.
const SORTIES_DEPLIEES_PAR_DEFAUT = 3;

// Nombre de sorties (groupes) affichées par défaut dans la vue groupée, et
// à chaque clic sur "Charger plus" — au-delà des lignes déjà repliées par
// défaut ci-dessus, le simple fait de monter l'EN-TÊTE de chaque sortie
// (une par sortie, même repliée : libellé, badge, chevron, Framer Motion)
// a un coût de rendu DOM mesurable à grande échelle — profilé à ~3s en
// production pour 260 sorties (2250 plongées), alors que la vue Liste
// (paginée à 10 éléments) rendait, elle, en quelques millisecondes.
const GROUPES_PAR_PALIER = 20;

const PlongeeList = () => {
  // TOUS LES HOOKS EN PREMIER - AVANT TOUT RETURN CONDITIONNEL
  const { user, hasRole } = useAuth();
  const canManagePlongee = hasRole(["president", "moniteur"]);
  // Distinct de canManagePlongee (staff, président ET moniteur) : réserve
  // au président le filtre "Encadrant/validateur" (liste de TOUS les
  // encadrants du club, voir moniteurFilter plus bas) — même correctif que
  // SortiesPage.jsx (isPresident).
  const isPresident = user?.role === "president";
  const [searchParams] = useSearchParams();
  const { useGetAll, useRemove, useValidate, useUpdate } = usePlongees();
  const { useGetAll: useGetAllAdherents } = useAdherents();
  const { useGetAll: useGetAllMoniteurs } = useMoniteurs();
  const { useGetAll: useGetAllSorties } = useSorties();
  const { useGetAllLight: useGetAllPalanquees } = usePalanquees();

  const { data, isLoading, error, refetch } = useGetAll();
  const { data: adherentsData } =
    useGetAllAdherents();
  // Sert au sous-menu "Mes plongées" (voir Sidebar.jsx) — résoudre le
  // moniteur connecté, et savoir quelles sorties il encadre (Sortie.
  // encadrants), pour couvrir aussi les plongées qu'il n'a pas encore
  // personnellement validées (nécessaire à TOUT moniteur, pas seulement au
  // président) — ET au filtre "Encadrant/validateur" ci-dessous (réservé
  // au président lui, voir isPresident). Reste chargé dès qu'on est staff
  // (président/moniteur), inutile pour un rôle qui n'en a besoin nulle
  // part sur cette page.
  const { data: moniteursData } = useGetAllMoniteurs({}, { enabled: canManagePlongee });
  // sortiesData/palanqueesData : plus seulement pour le filtre "Encadrant"
  // (staff) — servent aussi de libellés au groupement "par sortie/par
  // palanquée" (voir groupedPlongees plus bas), ouvert à tout le monde
  // (un adhérent groupant ses propres plongées en profite tout autant).
  const { data: sortiesData } = useGetAllSorties();
  const { data: palanqueesData } = useGetAllPalanquees();

  const remove = useRemove();
  const validate = useValidate();
  const update = useUpdate();
  const selection = useSelection();

  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deleteModal, setDeleteModal] = useState(null);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  // Clé de l'action en cours d'une ligne (`delete-<id>`, `validate-<id>`) :
  // seule l'icône de la ligne concernée passe en spinner (même motif que
  // InscriptionList.jsx). `loading` reste pour la modale "Compléter".
  const [actionLoading, setActionLoading] = useState(null);
  // Vue "groupée" (par sortie puis par palanquée) par défaut : une plongée
  // isolée de son contexte (quelle sortie, quelle palanquée) ne veut pas
  // dire grand-chose pour retrouver "qui a plongé avec qui, ce jour-là" —
  // grid/list restent disponibles pour parcourir à plat.
  const [viewMode, setViewMode] = useState("grouped");
  // Sections repliées dans la vue groupée (Set d'id_sortie). `null` tant que
  // l'utilisateur n'a jamais déplié/replié manuellement — dans cet état, le
  // repli effectif retombe sur defaultCollapsedIds (voir plus bas, calculé à
  // chaque render depuis groupedPlongees) plutôt que sur un Set figé une
  // seule fois : au premier rendu, sortiesData/palanqueesData n'ont pas
  // encore chargé, donc groupedPlongees trie sur des dates encore à 0 pour
  // toutes les sorties (ordre non significatif) — un Set calculé une seule
  // fois à ce moment-là (ancienne version, via useEffect) figeait "les 3
  // plus récentes" sur un tri pas encore fiable, qui ne correspondait plus
  // aux 3 vraiment les plus récentes une fois les vraies dates arrivées
  // (constaté : aucune section dépliée à l'affichage final). En recalculant
  // à chaque render tant que l'utilisateur n'a rien touché, le résultat
  // reste toujours cohérent avec le tri du moment, y compris une fois les
  // dates réelles chargées.
  const [collapsedSorties, setCollapsedSorties] = useState(null);
  const toggleSortieCollapse = (idSortie) => {
    setCollapsedSorties((prev) => {
      const next = new Set(prev ?? defaultCollapsedIds);
      if (next.has(idSortie)) next.delete(idSortie);
      else next.add(idSortie);
      return next;
    });
  };
  // Sous-menu sidebar "Mes plongées" (?filtre=mes-plongees, réservé au
  // moniteur, voir Sidebar.jsx) : plongées qu'il a validées OU issues d'une
  // sortie qu'il encadre (même s'il ne les a pas encore validées lui-même).
  const [mesPlongeesFiltre, setMesPlongeesOnly] = useState(
    searchParams.get("filtre") === "mes-plongees",
  );
  // Un moniteur n'a pas d'onglet "Toutes les plongées" : sa page est
  // toujours limitée à "Mes plongées". Le président garde les deux vues.
  const isMoniteurSeul = user?.role === "moniteur";
  const mesPlongeesOnly = isMoniteurSeul || mesPlongeesFiltre;
  // Filtre "Encadrant/validateur" (staff, président ET moniteur) :
  // contrairement à mesPlongeesOnly ci-dessus (toujours "moi"), celui-ci
  // permet de choisir n'importe quel moniteur — même règle de rattachement
  // (validateur de la plongée OU encadrant de la sortie d'origine).
  const [moniteurFilter, setMoniteurFilter] = useState("all");
  // Page courante des sorties (groupes) dans la vue groupée, par paliers de
  // GROUPES_PAR_PALIER — voir son commentaire de définition. Réinitialisée à
  // chaque changement de filtre (même effet que currentPage ci-dessous) :
  // l'ensemble filtré change, la pagination groupée doit repartir de la
  // page 1 plutôt que de rester sur une page qui n'a plus de sens pour un
  // tout autre résultat.
  const [groupedPage, setGroupedPage] = useState(1);
  useEffect(() => {
    setGroupedPage(1);
  }, [searchTerm, filter, typeFilter, mesPlongeesOnly, moniteurFilter]);
  useEffect(() => {
    const mesPlongeesSeulement = searchParams.get("filtre") === "mes-plongees";
    setMesPlongeesOnly(mesPlongeesSeulement);
    // Filtre "Encadrant/validateur" (masqué plus bas dans cette vue, déjà
    // scopée à "moi") : le réinitialiser évite qu'une valeur choisie avant
    // de basculer ici ne continue à restreindre silencieusement les
    // résultats sans plus aucun contrôle visible pour l'expliquer — même
    // correctif que SortiesPage.jsx.
    if (mesPlongeesSeulement) setMoniteurFilter("all");
    setCurrentPage(1);
  }, [searchParams]);
  const itemsPerPage = 10;

  // Onglets remplaçant l'ancien sous-menu dépliable "Mes plongées" de la
  // Sidebar (voir Sidebar.jsx, canSeeMoniteurSousMenus — mêmes rôles) :
  // basculer entre les deux vues sans quitter la page.
  const plongeeTabs = isMoniteurSeul
    ? []
    : [
        { to: "/plongees", label: "Toutes les plongées" },
        ...(canManagePlongee
          ? [{ to: "/plongees?filtre=mes-plongees", label: "Mes plongées" }]
          : []),
      ];

  const currentMoniteurId = useMemo(() => {
    if (!user || !moniteursData?.data) return null;
    const moniteur = moniteursData.data.find((m) => m.user?.email === user.email);
    return moniteur?.id_moniteur || null;
  }, [user, moniteursData]);

  // Map id_sortie -> liste d'id_moniteur encadrants (Sortie.encadrants)
  const sortieEncadrantsMap = useMemo(() => {
    const map = new Map();
    (sortiesData?.data || []).forEach((s) => {
      map.set(s.id_sortie || s.id, Array.isArray(s.encadrants) ? s.encadrants : []);
    });
    return map;
  }, [sortiesData]);

  // Actions de gestion d'UNE plongée donnée (Compléter/Valider/Modifier/
  // Supprimer, sélection groupée) : réservées au président (accès total) ou
  // au moniteur désigné encadrant de LA SORTIE d'origine de cette plongée
  // (Sortie.encadrants) — pas seulement "être son validateur", pour rester
  // strictement identique à la règle serveur (PlongeeService.
  // assertCanManagePlongee) et ne jamais montrer un bouton qu'un 403
  // refuserait ensuite. Avant ce garde-fou, canManagePlongee (rôle
  // générique) ouvrait ces actions à n'importe quel moniteur sur n'importe
  // quelle plongée, y compris celles issues d'une sortie confiée à un
  // autre — même correctif que SortiesPage.jsx:canManageCetteSortie.
  const canManageCettePlongee = (plongee) => {
    if (!canManagePlongee) return false;
    if (user?.role === "president") return true;
    return (
      currentMoniteurId != null &&
      (sortieEncadrantsMap.get(plongee.id_sortie) || []).includes(currentMoniteurId)
    );
  };

  // Complétion rapide d'un brouillon (voir isBrouillon) : uniquement les
  // champs qu'un moniteur saisit après-coup — adhérent/sortie/date/type sont
  // déjà fixés depuis le pointage de présence, inutile de repasser par le
  // formulaire complet (PlongeeForm) pour eux.
  const [completeModal, setCompleteModal] = useState(null);
  const [completeForm, setCompleteForm] = useState({
    profondeur_max: "",
    duree: "",
    temperature_eau: "",
    visibilite: "Bonne",
    courant: "Nul",
  });
  const [completeErrors, setCompleteErrors] = useState({});

  // Map des adhérents avec leurs infos (useMemo)
  const adherentMap = useMemo(() => {
    const map = {};
    if (adherentsData?.data) {
      adherentsData.data.forEach((adherent) => {
        map[adherent.num_adherent] = {
          nom: `${adherent.civilite} ${adherent.nom} ${adherent.prenom}`,
          photo: adherent.photo,
          num_adherent: adherent.num_adherent,
        };
      });
    }
    return map;
  }, [adherentsData]);

  // Mémoïsé : `data?.data || []` créait un nouveau tableau [] à CHAQUE
  // rendu tant que la requête n'a pas encore de données (chargement initial,
  // refetch), invalidant du même coup la mémoïsation de tout ce qui en
  // dépend (filteredPlongees, groupedPlongees...) — recalculs inutiles à
  // chaque rendu plutôt qu'au seul changement réel de `data`.
  const allPlongees = useMemo(() => data?.data || [], [data]);

  // Priorité d'affichage : à compléter (brouillon) puis en attente (non
  // validée mais complète) en tête de liste, validées en dernier — ce sont
  // les deux seules qui demandent encore une action du moniteur.
  const priorite = (p) => {
    if (isBrouillon(p)) return 0;
    if (!p.id_moniteur_validateur) return 1;
    return 2;
  };

  // Filtrage (useMemo)
  const filteredPlongees = useMemo(() => {
    return allPlongees
      .filter((p) => {
      const adherentInfo = adherentMap[p.num_adherent] || {
        nom: `#${p.num_adherent}`,
        photo: null,
      };
      const adherentName = adherentInfo.nom;

      if (filter !== "all") {
        const isValide = !!p.id_moniteur_validateur;
        if (filter === "valide" && !isValide) return false;
        if (filter === "non_valide" && isValide) return false;
        if (filter === "brouillon" && !isBrouillon(p)) return false;
      }

      if (typeFilter !== "all" && p.type_plongee !== typeFilter) return false;

      if (mesPlongeesOnly) {
        const jeSuisValidateur =
          currentMoniteurId != null && p.id_moniteur_validateur === currentMoniteurId;
        const jEncadreLaSortie =
          currentMoniteurId != null &&
          (sortieEncadrantsMap.get(p.id_sortie) || []).includes(currentMoniteurId);
        if (!jeSuisValidateur && !jEncadreLaSortie) return false;
      }

      if (moniteurFilter !== "all") {
        const idMoniteur = Number(moniteurFilter);
        const estValidateur = p.id_moniteur_validateur === idMoniteur;
        const encadreLaSortie = (sortieEncadrantsMap.get(p.id_sortie) || []).includes(idMoniteur);
        if (!estValidateur && !encadreLaSortie) return false;
      }

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          p.type_plongee?.toLowerCase().includes(search) ||
          adherentName.toLowerCase().includes(search)
        );
      }
      return true;
    })
      .sort((a, b) => priorite(a) - priorite(b));
  }, [
    allPlongees,
    adherentMap,
    filter,
    typeFilter,
    searchTerm,
    mesPlongeesOnly,
    moniteurFilter,
    currentMoniteurId,
    sortieEncadrantsMap,
  ]);

  const sortieMap = useMemo(() => {
    const map = new Map();
    (sortiesData?.data || []).forEach((s) => map.set(s.id_sortie || s.id, s));
    return map;
  }, [sortiesData]);

  const palanqueeMap = useMemo(() => {
    const map = new Map();
    (palanqueesData?.data || []).forEach((p) => map.set(p.id_palanquee, p));
    return map;
  }, [palanqueesData]);

  // Vue groupée (viewMode === "grouped") : sortie (la plus récente en tête)
  // > palanquée (nommée, "Sans palanquée" en dernier — une plongée créée
  // hors pointage/hors palanquée) > plongées (mêmes filtres que la vue à
  // plat, appliqués en amont sur filteredPlongees).
  const groupedPlongees = useMemo(() => {
    const bySortie = new Map();
    filteredPlongees.forEach((p) => {
      if (!bySortie.has(p.id_sortie)) bySortie.set(p.id_sortie, new Map());
      const byPalanquee = bySortie.get(p.id_sortie);
      const key = p.id_palanquee ?? "sans-palanquee";
      if (!byPalanquee.has(key)) byPalanquee.set(key, []);
      byPalanquee.get(key).push(p);
    });

    return Array.from(bySortie.entries())
      .map(([idSortie, byPalanquee]) => {
        const sortie = sortieMap.get(idSortie);
        const groupesPalanquee = Array.from(byPalanquee.entries())
          .map(([idPalanquee, plongees]) => ({
            idPalanquee,
            palanquee: idPalanquee === "sans-palanquee" ? null : palanqueeMap.get(idPalanquee),
            plongees,
          }))
          .sort((a, b) => {
            if (a.idPalanquee === "sans-palanquee") return 1;
            if (b.idPalanquee === "sans-palanquee") return -1;
            return (a.palanquee?.nom_palanquee || "").localeCompare(
              b.palanquee?.nom_palanquee || "",
            );
          });
        const total = groupesPalanquee.reduce((sum, g) => sum + g.plongees.length, 0);
        return { idSortie, sortie, groupesPalanquee, total };
      })
      .sort((a, b) => {
        const dateA = a.sortie?.date_heure ? new Date(a.sortie.date_heure).getTime() : 0;
        const dateB = b.sortie?.date_heure ? new Date(b.sortie.date_heure).getTime() : 0;
        return dateB - dateA;
      });
  }, [filteredPlongees, sortieMap, palanqueeMap]);

  // Repli par défaut tant que l'utilisateur n'a rien touché (voir
  // collapsedSorties ci-dessus) : toutes les sorties sauf les
  // SORTIES_DEPLIEES_PAR_DEFAUT plus récentes (groupedPlongees est déjà trié
  // par date décroissante). Recalculé à CHAQUE changement de groupedPlongees
  // plutôt qu'une seule fois — nécessaire pour rester correct une fois
  // sortiesData/palanqueesData chargés (voir le commentaire sur
  // collapsedSorties), et de toute façon bon marché (un .slice + .map sur au
  // plus quelques centaines de groupes, sans rapport avec le coût de rendu
  // DOM que ce repli évite par ailleurs). Avant ce correctif (repli
  // permanent, sans repli par défaut du tout), TOUTES les sorties étaient
  // dépliées d'emblée : sur un club avec de l'historique (2250 plongées
  // mesurées en conditions réelles), ça montait ~2500 lignes animées (Framer
  // Motion) d'un coup et bloquait le thread principal du navigateur ~7
  // secondes au premier affichage de cette page — mesuré via Playwright, la
  // bascule vers la vue Liste (paginée à 10 éléments) prenait elle 8ms,
  // confirmant que le réseau n'y était pour rien.
  const defaultCollapsedIds = useMemo(
    () => new Set(groupedPlongees.slice(SORTIES_DEPLIEES_PAR_DEFAUT).map((g) => g.idSortie)),
    [groupedPlongees],
  );
  const effectiveCollapsedSorties = collapsedSorties ?? defaultCollapsedIds;

  const brouillonsCount = useMemo(
    () => allPlongees.filter(isBrouillon).length,
    [allPlongees],
  );

  // Pagination (vue à plat)
  const totalPages = Math.ceil(filteredPlongees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPlongees = filteredPlongees.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Pagination (vue groupée) : par sortie plutôt que par plongée
  // individuelle, comme le "Charger plus" qu'elle remplace (voir
  // GROUPES_PAR_PALIER) — remonte moins de DOM à la fois qu'un chargement
  // cumulatif (qui, lui, ne démontait jamais les groupes déjà chargés).
  const groupedTotalPages = Math.ceil(groupedPlongees.length / GROUPES_PAR_PALIER);
  const groupedStartIndex = (groupedPage - 1) * GROUPES_PAR_PALIER;
  const paginatedGroupedPlongees = groupedPlongees.slice(
    groupedStartIndex,
    groupedStartIndex + GROUPES_PAR_PALIER,
  );

  // Fonctions
  const handleDelete = async (id) => {
    // Ferme la modale dès le lancement : elle masquerait sinon le spinner
    // de la ligne pendant la requête.
    setDeleteModal(null);
    setActionLoading(`delete-${id}`);
    try {
      await remove.mutateAsync(id);
      await refetch();
    } catch (error) {
      console.error("Échec de la suppression de la plongée :", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const result = await plongeeService.bulkDelete(Array.from(selection.selectedIds));
      toast[result.success ? "success" : "error"](result.message);
      selection.clear();
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur lors de la suppression groupée");
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteModal(false);
    }
  };

  const handleValidate = async (id) => {
    setActionLoading(`validate-${id}`);
    try {
      await validate.mutateAsync(id);
      await refetch();
    } catch (error) {
      console.error("Échec de la validation de la plongée :", error);
    } finally {
      setActionLoading(null);
    }
  };

  const openCompleteModal = (plongee) => {
    setCompleteForm({
      profondeur_max: plongee.profondeur_max ?? "",
      duree: plongee.duree ?? "",
      temperature_eau: plongee.temperature_eau ?? "",
      visibilite: plongee.visibilite || "Bonne",
      courant: plongee.courant || "Nul",
    });
    setCompleteErrors({});
    setCompleteModal(plongee.id_plongee);

    // Courant non encore saisi : proposé d'après la météo relevée ce jour-là
    // sur le lieu de la sortie (best-effort — sans relevé, "Nul" reste).
    if ((!plongee.courant || plongee.courant === "Nul") && plongee.id_sortie) {
      sortieService
        .getMeteo(plongee.id_sortie)
        .then((res) => {
          const courant = courantDepuisVitesse(res?.data?.forecast?.currentVelocity);
          if (!courant) return;
          setCompleteForm((prev) =>
            prev.courant === "Nul" ? { ...prev, courant } : prev,
          );
        })
        .catch(() => {});
    }
  };

  const handleCompleteChange = (e) => {
    const { name, value } = e.target;
    setCompleteForm((prev) => ({ ...prev, [name]: value }));
    if (completeErrors[name]) setCompleteErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateCompleteForm = () => {
    const newErrors = {};
    if (!completeForm.profondeur_max || completeForm.profondeur_max <= 0)
      newErrors.profondeur_max = "La profondeur est requise";
    if (!completeForm.duree || completeForm.duree <= 0)
      newErrors.duree = "La durée est requise";
    setCompleteErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!validateCompleteForm()) return;
    try {
      setLoading(true);
      await update.mutateAsync({ id: completeModal, data: completeForm });
      setCompleteModal(null);
      refetch();
    } catch (error) {
      console.error("Échec de la complétion de la plongée :", error);
    } finally {
      setLoading(false);
    }
  };

  // Une ligne de la vue "liste" — extraite en fonction plutôt que dupliquée
  // inline pour être réutilisée telle quelle par la vue groupée
  // (groupedPlongees) ci-dessous, sans réécrire toutes les actions
  // (compléter/valider/voir/modifier/supprimer) une seconde fois.
  // `animated` : la vue "liste" (bornée à itemsPerPage=10, dans une
  // AnimatePresence) profite de l'entrée/sortie Framer Motion sans risque.
  // La vue "groupée" (par défaut) appelle ce même rendu de ligne pour un
  // nombre de plongées non borné (jusqu'à des centaines une fois plusieurs
  // "Charger plus" cliqués) — y garder motion.div montait/démontait autant
  // d'instances Framer Motion simultanées, contribuant au blocage du thread
  // déjà mesuré sur cette page (voir GROUPES_PAR_PALIER) : `animated: false`
  // y rend un simple <div>, sans perte fonctionnelle (juste moins de fioriture).
  const renderPlongeeRow = (plongee, { animated = true } = {}) => {
    const adherentInfo = adherentMap[plongee.num_adherent] || {
      nom: `#${plongee.num_adherent}`,
      photo: null,
    };
    const adherentName = adherentInfo.nom;
    const Wrapper = animated ? motion.div : "div";
    const motionProps = animated
      ? {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, scale: 0.95 },
        }
      : {};

    return (
      <Wrapper
        key={plongee.id_plongee}
        {...motionProps}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start gap-3 sm:gap-4">
          {canManageCettePlongee(plongee) && !plongee.id_moniteur_validateur && (
            <input
              type="checkbox"
              checked={selection.isSelected(plongee.id_plongee)}
              onChange={() => selection.toggle(plongee.id_plongee)}
              className="mt-1 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
            />
          )}
          {/* Photo / Avatar de l'adhérent — masquée sur mobile : elle
              mangeait ~60px d'une carte déjà étroite (checkbox + gaps),
              laissant le texte en colonne serrée et de l'espace perdu. */}
          <div className="hidden sm:block flex-shrink-0">
            {adherentInfo.photo ? (
              <img
                src={photoUrl(adherentInfo.photo)}
                alt={adherentName}
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-700 shadow-sm">
                <FiDroplet className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
              </div>
            )}
          </div>

          {/* Informations */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 dark:text-white break-words">
                    {adherentName}
                  </h3>
                  <span className="hidden sm:inline text-sm text-gray-400 dark:text-gray-500">
                    •
                  </span>
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    {plongee.type_plongee}
                  </span>
                  {isBrouillon(plongee) && (
                    <span
                      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
                      title="Créée automatiquement au pointage de présence, en attente de saisie par le moniteur"
                    >
                      <FiEdit className="w-3 h-3" /> À compléter
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                    {formatDate(plongee.date)}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1">
                      Profondeur:{" "}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {plongee.profondeur_max != null ? `${plongee.profondeur_max}m` : "—"}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      Durée:{" "}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {plongee.duree != null ? `${plongee.duree}min` : "—"}
                      </span>
                    </span>
                  </span>
                  {plongee.id_moniteur_validateur ? (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                      <FiCheck className="w-3.5 h-3.5" /> Validée
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-medium">
                      <FiClock className="w-3.5 h-3.5" /> En attente
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-end gap-1 flex-shrink-0 max-sm:w-full max-sm:gap-0 max-sm:[&>a]:p-1.5 max-sm:[&>button]:p-1.5 max-sm:[&>button:first-child]:px-2 max-sm:[&>button:first-child]:text-xs max-sm:[&>button:first-child]:mr-auto max-sm:pt-2 max-sm:border-t max-sm:border-gray-100 max-sm:dark:border-gray-700">
                {/* Compléter - action mise en avant tant que la
                    plongée est un brouillon (voir isBrouillon) :
                    évite de passer par le formulaire complet pour
                    seulement saisir profondeur/durée/etc. */}
                {canManageCettePlongee(plongee) && isBrouillon(plongee) && (
                  <button
                    onClick={() => openCompleteModal(plongee)}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 rounded-lg transition-colors disabled:opacity-50"
                    title="Compléter les données de cette plongée"
                  >
                    <FiClipboard className="w-4 h-4" /> Compléter
                  </button>
                )}
                {/* Valider - uniquement si non validée ; désactivé
                    tant que profondeur/durée ne sont pas saisies
                    (voir PlongeeService.validatePlongee, même
                    règle revalidée côté serveur). */}
                {canManageCettePlongee(plongee) && !plongee.id_moniteur_validateur && (
                  <button
                    onClick={() => handleValidate(plongee.id_plongee)}
                    disabled={(actionLoading === `validate-${plongee.id_plongee}` || actionLoading === `delete-${plongee.id_plongee}`) || isBrouillon(plongee)}
                    className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      isBrouillon(plongee)
                        ? "Complétez d'abord la profondeur et la durée"
                        : "Valider la plongée"
                    }
                  >
                    {actionLoading === `validate-${plongee.id_plongee}` ? (
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <FiCheck className="w-4 h-4" />
                    )}
                  </button>
                )}

                <Link
                  to={`/plongees/${plongee.id_plongee}`}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Voir"
                >
                  <FiEye className="w-4 h-4" />
                </Link>
                {/* Verrouillé côté serveur (PlongeeService.update/delete) :
                    une plongée validée par un moniteur n'est plus
                    modifiable ni supprimable. */}
                {canManageCettePlongee(plongee) && !plongee.id_moniteur_validateur && (
                  <>
                    <ModalLink
                      to={`/plongees/edit/${plongee.id_plongee}`}
                      className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <FiEdit className="w-4 h-4" />
                    </ModalLink>
                    <button
                      onClick={() => setDeleteModal(plongee.id_plongee)}
                      disabled={(actionLoading === `validate-${plongee.id_plongee}` || actionLoading === `delete-${plongee.id_plongee}`)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Supprimer"
                    >
                      {actionLoading === `delete-${plongee.id_plongee}` ? (
                        <FiRefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <FiTrash2 className="w-4 h-4" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Wrapper>
    );
  };

  // RETOURS CONDITIONNELS APRÈS TOUS LES HOOKS
  // N'attend que la propre liste : adherentsData ne sert qu'au nom affiché
  // (adherentMap), avec repli "#<num_adherent>" déjà prévu tant qu'il n'est
  // pas encore chargé — chargement progressif (moniteursData/sortiesData,
  // utilisés pour le filtre "Tous les encadrants", ne bloquaient déjà pas
  // ici).
  if (isLoading) return <LoadingSpinner variant="list" />;
  if (error) return <ErrorState onRetry={refetch} />;

  if (filteredPlongees.length === 0) {
    return (
      <div className="space-y-4">
      {plongeeTabs.length > 0 && <TabBar tabs={plongeeTabs} />}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <FiDroplet className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {mesPlongeesOnly
            ? "Aucune plongée liée à vous"
            : searchTerm || filter !== "all"
              ? "Aucune plongée trouvée"
              : "Aucune plongée enregistrée"}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {mesPlongeesOnly
            ? "Aucune plongée que vous avez validée ou issue d'une sortie que vous encadrez"
            : searchTerm || filter !== "all"
              ? "Aucun résultat pour vos critères"
              : "Commencez par enregistrer votre première plongée"}
        </p>
        {(searchTerm ||
          filter !== "all" ||
          typeFilter !== "all" ||
          mesPlongeesOnly ||
          moniteurFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setFilter("all");
              setTypeFilter("all");
              setMesPlongeesOnly(false);
              setMoniteurFilter("all");
              setCurrentPage(1);
            }}
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <FiX className="w-4 h-4" /> Réinitialiser la recherche
          </button>
        )}
        {canManagePlongee && (
          <ModalLink
            to="/plongees/create"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <FiPlus className="w-4 h-4" /> Nouvelle plongée
          </ModalLink>
        )}
        <PlongeeFormModal />
        <PlongeeDetails />
      </motion.div>
      </div>
    );
  }

  // RENDU DU COMPOSANT
  return (
    <div className="space-y-4">
      {plongeeTabs.length > 0 && <TabBar tabs={plongeeTabs} />}
      {mesPlongeesOnly && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <FiUser className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
          {filteredPlongees.length} plongée
          {filteredPlongees.length > 1 ? "s" : ""} que vous avez validée(s) ou
          issue(s) d&apos;une sortie que vous encadrez
        </p>
      )}
            {/* Bouton "Filtres" (mobile uniquement) : recherche + filtres
          repliés par défaut pour ne pas encombrer l'écran — un tap les
          affiche. Toujours visibles à partir de sm (recherche fréquente
          sur grand écran, pas besoin de la cacher). */}
      <button
        type="button"
        onClick={() => setShowFilters((v) => !v)}
        className="sm:hidden inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
      >
        {showFilters ? <FiX className="w-4 h-4" /> : <FiFilter className="w-4 h-4" />}
        Filtres
      </button>
      <div className={`${showFilters ? "flex" : "hidden"} flex-col gap-3 sm:flex sm:flex-row`}>
        <div className="relative flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par adhérent ou type de plongée..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-auto"
          >
            <option value="all">Toutes</option>
            <option value="brouillon">
              À compléter{brouillonsCount > 0 ? ` (${brouillonsCount})` : ""}
            </option>
            <option value="valide">Validées</option>
            <option value="non_valide">Non validées</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-auto"
          >
            <option value="all">Tous les types</option>
            {TYPE_PLONGEE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {/* Réservé au président (isPresident) : un moniteur n'a pas à
              parcourir les plongées encadrées/validées par un autre. Masqué
              aussi dans "Mes plongées" (mesPlongeesOnly) : cette vue est déjà
              scopée à "moi", un filtre "choisir un autre encadrant" n'y a
              pas sa place — même correctif que SortiesPage.jsx. */}
          {isPresident && !mesPlongeesOnly && (
            <select
              value={moniteurFilter}
              onChange={(e) => {
                setMoniteurFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-auto"
            >
              <option value="all">Tous les encadrants</option>
              {(moniteursData?.data || []).map((moniteur) => (
                <option key={moniteur.id_moniteur} value={String(moniteur.id_moniteur)}>
                  {moniteur.user?.name || `Moniteur #${moniteur.id_moniteur}`}
                </option>
              ))}
            </select>
          )}
          
          <div className="col-span-2 flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800 sm:col-auto">
            <button
              type="button"
              onClick={() => setViewMode("grouped")}
              title="Grouper par sortie et par palanquée"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grouped"
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <FiLayers className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Vue grille"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="Vue liste"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sélection multiple / actions groupées (mêmes plongées verrouillées
          que le bouton Supprimer individuel : déjà validées exclues) —
          scopée à la page courante dans les deux vues (paginatedPlongees /
          paginatedGroupedPlongees), pas à l'ensemble filtré. */}
      {canManagePlongee && (() => {
        const selectableIds = (
          viewMode === "grouped"
            ? paginatedGroupedPlongees.flatMap((g) =>
                g.groupesPalanquee.flatMap((gp) => gp.plongees),
              )
            : paginatedPlongees
        )
          .filter((p) => !p.id_moniteur_validateur && canManageCettePlongee(p))
          .map((p) => p.id_plongee);
        return (
          <>
            {selectableIds.length > 0 && (
              <div className="flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  checked={selection.allSelected(selectableIds)}
                  onChange={() => selection.toggleAll(selectableIds)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Tout sélectionner (page courante)
                </span>
              </div>
            )}
            <BulkActionBar
              count={selection.selectedCount}
              onClear={selection.clear}
              onDelete={() => setBulkDeleteModal(true)}
            />
          </>
        );
      })()}

      {/* Liste des plongées */}
      {viewMode === "grouped" ? (
        <div className="space-y-3">
          {paginatedGroupedPlongees.map((groupe) => {
            const sortieLabel = groupe.sortie
              ? groupe.sortie.site || groupe.sortie.lieu || `Sortie #${groupe.idSortie}`
              : `Sortie #${groupe.idSortie}`;
            const isCollapsed = effectiveCollapsedSorties.has(groupe.idSortie);
            // div simple (pas motion.div) : même paginée à GROUPES_PAR_PALIER
            // en-têtes à la fois (voir sa définition — déjà mesuré à ~3s de
            // blocage pour 260 sorties en production avec l'animation Framer
            // Motion active sur un chargement cumulatif non borné, avant ce
            // découpage en pages). L'entrée/sortie individuelle de chaque
            // groupe n'apporte presque rien visuellement une fois la
            // transition de page globale déjà assurée (Layout.jsx) — inutile
            // de payer son coût de montage/démontage à cette échelle.
            return (
              <div
                key={groupe.idSortie}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5">
                  <button
                    type="button"
                    onClick={() => toggleSortieCollapse(groupe.idSortie)}
                    className="flex flex-1 min-w-0 items-center gap-3 text-left"
                  >
                    <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                      <FiAnchor className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {sortieLabel}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {groupe.sortie
                          ? `${groupe.sortie.type} • ${formatDate(groupe.sortie.date_heure)}`
                          : "Sortie introuvable (supprimée ?)"}
                      </p>
                    </div>
                    <FiChevronRight
                      className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-auto transition-transform ${
                        isCollapsed ? "" : "rotate-90"
                      }`}
                    />
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {groupe.total} plongée{groupe.total > 1 ? "s" : ""}
                    </span>
                    {groupe.sortie && (
                      <ModalLink
                        to={`/sorties/${groupe.idSortie}`}
                        title="Voir la sortie"
                        className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                      >
                        <FiExternalLink className="w-4 h-4" />
                      </ModalLink>
                    )}
                  </div>
                </div>
                {!isCollapsed && (
                  <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                    {groupe.groupesPalanquee.map((gp) => (
                      <div key={gp.idPalanquee} className="px-4 sm:px-5 py-3">
                        <div className="flex items-center gap-2 mb-2.5">
                          <FiUsers className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {gp.palanquee?.nom_palanquee || "Sans palanquée"}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            ({gp.plongees.length})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {gp.plongees.map((plongee) =>
                            renderPlongeeRow(plongee, { animated: false }),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <Pagination
            currentPage={groupedPage}
            totalPages={groupedTotalPages}
            onPageChange={setGroupedPage}
          />
        </div>
      ) : (
      <AnimatePresence>
        {paginatedPlongees.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
          >
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Aucune plongée trouvée
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {searchTerm || filter !== "all"
                ? "Essayez de modifier vos filtres"
                : "Aucune plongée pour le moment"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "grid gap-3"
            }
          >
            {viewMode === "grid"
              ? paginatedPlongees.map((plongee) => {
                  const adherentInfo = adherentMap[plongee.num_adherent] || {
                    nom: `#${plongee.num_adherent}`,
                    photo: null,
                  };
                  const adherentName = adherentInfo.nom;

                  return (
                    <motion.div
                      key={plongee.id_plongee}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col items-center text-center hover:shadow-lg transition-shadow"
                    >
                      {adherentInfo.photo ? (
                        <img
                          src={photoUrl(adherentInfo.photo)}
                          alt={adherentName}
                          className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700 shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-700 shadow-sm">
                          <FiDroplet className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                        </div>
                      )}
                      <h3 className="font-semibold text-gray-900 dark:text-white mt-3 break-words w-full">
                        {adherentName}
                      </h3>
                      <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        {plongee.type_plongee}
                      </p>
                      <p className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                        {formatDate(plongee.date)}
                      </p>
                      <p className="flex items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>
                          Profondeur:{" "}
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {plongee.profondeur_max != null ? `${plongee.profondeur_max}m` : "—"}
                          </span>
                        </span>
                        <span>
                          Durée:{" "}
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {plongee.duree != null ? `${plongee.duree}min` : "—"}
                          </span>
                        </span>
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                        {isBrouillon(plongee) && (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
                            title="Créée automatiquement au pointage de présence, en attente de saisie par le moniteur"
                          >
                            <FiEdit className="w-3 h-3" /> À compléter
                          </span>
                        )}
                        {plongee.id_moniteur_validateur ? (
                          <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                            <FiCheck className="w-3.5 h-3.5" /> Validée
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400">
                            <FiClock className="w-3.5 h-3.5" /> En attente
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-center flex-wrap gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 w-full">
                        {canManageCettePlongee(plongee) && !plongee.id_moniteur_validateur && (
                          <input
                            type="checkbox"
                            checked={selection.isSelected(plongee.id_plongee)}
                            onChange={() => selection.toggle(plongee.id_plongee)}
                            className="mr-1 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                            title="Sélectionner"
                          />
                        )}
                        {canManageCettePlongee(plongee) && isBrouillon(plongee) && (
                          <button
                            onClick={() => openCompleteModal(plongee)}
                            disabled={loading}
                            className="p-2 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Compléter les données de cette plongée"
                          >
                            <FiClipboard className="w-4 h-4" />
                          </button>
                        )}
                        {canManageCettePlongee(plongee) && !plongee.id_moniteur_validateur && (
                          <button
                            onClick={() => handleValidate(plongee.id_plongee)}
                            disabled={(actionLoading === `validate-${plongee.id_plongee}` || actionLoading === `delete-${plongee.id_plongee}`) || isBrouillon(plongee)}
                            className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              isBrouillon(plongee)
                                ? "Complétez d'abord la profondeur et la durée"
                                : "Valider la plongée"
                            }
                          >
                            {actionLoading === `validate-${plongee.id_plongee}` ? (
                              <FiRefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <FiCheck className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <Link
                          to={`/plongees/${plongee.id_plongee}`}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Voir"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        {canManageCettePlongee(plongee) && !plongee.id_moniteur_validateur && (
                          <>
                            <ModalLink
                              to={`/plongees/edit/${plongee.id_plongee}`}
                              className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <FiEdit className="w-4 h-4" />
                            </ModalLink>
                            <button
                              onClick={() => setDeleteModal(plongee.id_plongee)}
                              disabled={(actionLoading === `validate-${plongee.id_plongee}` || actionLoading === `delete-${plongee.id_plongee}`)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Supprimer"
                            >
                              {actionLoading === `delete-${plongee.id_plongee}` ? (
                                <FiRefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <FiTrash2 className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              : paginatedPlongees.map((plongee) => renderPlongeeRow(plongee))}
          </motion.div>
        )}
      </AnimatePresence>
      )}

      {/* Masquée en vue groupée : cette vue a sa propre pagination par
          sortie (groupedPage), affichée juste après la liste des groupes
          ci-dessus plutôt qu'ici, sur les plongées à plat. */}
      {viewMode !== "grouped" && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Modal de confirmation de suppression */}
      {deleteModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                <FiTrash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Confirmer la suppression</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer cette plongée ?
              <br />
              <span className="text-sm text-red-500 font-medium">
                Cette action est irréversible.
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteModal)}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                Supprimer
              </button>
            </div>
          </motion.div>
        </ModalOverlay>
      )}

      {/* Modal de complétion rapide d'un brouillon — uniquement les champs
          qu'un moniteur saisit après le pointage (voir openCompleteModal),
          pas le formulaire complet (PlongeeForm) qui redemanderait
          adhérent/sortie/date/type déjà fixés. */}
      {completeModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.form
            onSubmit={handleCompleteSubmit}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-4">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <FiClipboard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Compléter la plongée
              </h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Profondeur max (m) *
                  </label>
                  <input
                    type="number"
                    name="profondeur_max"
                    value={completeForm.profondeur_max}
                    onChange={handleCompleteChange}
                    min="0"
                    placeholder="0"
                    className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      completeErrors.profondeur_max
                        ? "border-red-400"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {completeErrors.profondeur_max && (
                    <p className="mt-1 text-xs text-red-500">
                      {completeErrors.profondeur_max}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Durée (min) *
                  </label>
                  <input
                    type="number"
                    name="duree"
                    value={completeForm.duree}
                    onChange={handleCompleteChange}
                    min="0"
                    placeholder="0"
                    className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      completeErrors.duree
                        ? "border-red-400"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  {completeErrors.duree && (
                    <p className="mt-1 text-xs text-red-500">{completeErrors.duree}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Température de l&apos;eau (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="temperature_eau"
                  value={completeForm.temperature_eau}
                  onChange={handleCompleteChange}
                  placeholder="Facultatif"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Visibilité
                  </label>
                  <select
                    name="visibilite"
                    value={completeForm.visibilite}
                    onChange={handleCompleteChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {VISIBILITE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Courant
                  </label>
                  <select
                    name="courant"
                    value={completeForm.courant}
                    onChange={handleCompleteChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {COURANT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setCompleteModal(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors disabled:opacity-60"
              >
                <FiSave className="w-4 h-4" />
                Enregistrer
              </button>
            </div>
          </motion.form>
        </ModalOverlay>
      )}

      <ConfirmModal
        isOpen={bulkDeleteModal}
        message={`Êtes-vous sûr de vouloir supprimer les ${selection.selectedCount} plongée(s) sélectionnée(s) ?`}
        confirmLabel={isBulkDeleting ? "Suppression..." : "Supprimer"}
        onCancel={() => setBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
      />

      <PlongeeFormModal />
      <PlongeeDetails />
    </div>
  );
};

export default PlongeeList;
