import React, { useMemo, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiEdit,
  FiArrowLeft,
  FiUser,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiMapPin,
  FiTag,
  FiDroplet,
  FiAward,
  FiUsers,
  FiAnchor,
  FiInfo,
  FiFileText,
  FiAlertCircle,
  FiBarChart2,
  FiDollarSign,
  FiPlusCircle,
} from "react-icons/fi";
import { useInscriptions } from "../../hooks/Inscription/useInscriptions";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";
import StatusBadge from "../Common/StatusBadge";
import SectionCard from "../Common/SectionCard";
import InfoItem from "../Common/InfoItem";
import EcheancierCard from "../Echeancier/EcheancierCard";
import { formatDate, formatDateTime, formatCurrency } from "../../utils/helpers";
import { MODE_PAIEMENT_OPTIONS, STATUT_INSCRIPTION } from "../../utils/constants";

// Animations
const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: "easeOut" },
};

const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.25, ease: "easeOut" },
};

const InscriptionDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const inscriptionId = parseInt(id);

  // TOUS LES HOOKS EN PREMIER - AVANT TOUT RETURN CONDITIONNEL
  const { hasRole } = useAuth();
  // "moniteur" retiré : les deux usages de ce flag plus bas (bouton
  // "Enregistrer un paiement" et gestion de l'échéancier) sont des actions
  // financières, réservées à président/trésorier partout ailleurs dans
  // l'appli (canManagePaiement dans PaiementList.jsx, permission
  // manage_paiements côté backend — voir AuthController.getPermissionsForRole,
  // absente du rôle moniteur) — le nom "canManage" laissait croire que
  // c'était une gestion générale de l'inscription, alors que le moniteur
  // gère bien les inscriptions elles-mêmes (confirmer/annuler, voir
  // InscriptionRow.jsx) mais pas leurs paiements.
  const canManagePaiement = hasRole(["president", "tresorier"]);
  const { useGetById: useGetInscriptionById, useEnregistrerPaiement } = useInscriptions();
  const { useGetById: useGetAdherentById } = useAdherents();
  const { useGetById: useGetSortieById } = useSorties();
  const enregistrerPaiement = useEnregistrerPaiement();
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [paiementForm, setPaiementForm] = useState({ montant: "", mode: "Espèces" });
  const submittingPaiementRef = useRef(false);

  const handleEnregistrerPaiement = async (e) => {
    e.preventDefault();
    if (submittingPaiementRef.current) return;
    submittingPaiementRef.current = true;
    try {
      await enregistrerPaiement.mutateAsync({
        id: inscriptionId,
        data: { montant: parseFloat(paiementForm.montant), mode: paiementForm.mode },
      });
      setShowPaiementModal(false);
      setPaiementForm({ montant: "", mode: "Espèces" });
    } catch (error) {
      // toast déjà géré par le hook
    } finally {
      submittingPaiementRef.current = false;
    }
  };

  const {
    data: inscriptionData,
    isLoading: isLoadingInscription,
    error: inscriptionError,
  } = useGetInscriptionById(inscriptionId);

  // Récupération des données liées avec des hooks directs
  const numAdherent = useMemo(() => {
    if (!inscriptionData?.data) return null;
    return inscriptionData.data.num_adherent;
  }, [inscriptionData]);

  const idSortie = useMemo(() => {
    if (!inscriptionData?.data) return null;
    return inscriptionData.data.id_sortie;
  }, [inscriptionData]);

  // Appel des hooks pour les données liées
  const {
    data: adherentData,
    isLoading: isLoadingAdherent,
    error: adherentError,
  } = useGetAdherentById(numAdherent, {
    enabled: !!numAdherent, // Ne s'exécute que si numAdherent existe
  });

  const {
    data: sortieData,
    isLoading: isLoadingSortie,
    error: sortieError,
  } = useGetSortieById(idSortie, {
    enabled: !!idSortie, // Ne s'exécute que si idSortie existe
  });

  // Construction des états avec useMemo
  const inscription = useMemo(() => {
    if (!inscriptionData?.data) return null;
    return inscriptionData.data;
  }, [inscriptionData]);

  const adherent = useMemo(() => {
    if (!adherentData?.data) return null;
    return adherentData.data;
  }, [adherentData]);

  const sortie = useMemo(() => {
    if (!sortieData?.data) return null;
    return sortieData.data;
  }, [sortieData]);

  // Vérification du chargement combiné
  const isLoading = isLoadingInscription || isLoadingAdherent || isLoadingSortie;
  const error = inscriptionError || adherentError || sortieError;

  // RETOURS CONDITIONNELS APRÈS TOUS LES HOOKS
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner variant="details" />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        className="text-center py-16"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
          <FiAlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          Erreur de chargement
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {/* Jamais error.message (technique : "Network Error", "timeout
              of 30000ms exceeded"...) — error?.message était quasi toujours
              vrai, ce texte générique ne s'affichait donc en pratique
              jamais. */}
          Une erreur est survenue lors du chargement des données. Vérifiez
          votre connexion et réessayez dans un instant.
        </p>
        <button
          onClick={() => navigate("/inscriptions")}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </motion.div>
    );
  }

  if (!inscription) {
    return (
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        className="text-center py-16"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800/50 mb-6">
          <FiInfo className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          Inscription non trouvée
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          L'inscription que vous recherchez n'existe pas ou a été supprimée.
        </p>
        <button
          onClick={() => navigate("/inscriptions")}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </motion.div>
    );
  }

  const getStatutColor = (statut) => {
    const colors = {
      [STATUT_INSCRIPTION.CONFIRMEE]:
        "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      [STATUT_INSCRIPTION.ANNULEE]:
        "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      [STATUT_INSCRIPTION.LISTE_ATTENTE]:
        "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
      [STATUT_INSCRIPTION.EN_ATTENTE]:
        "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    };
    return colors[statut] || colors[STATUT_INSCRIPTION.EN_ATTENTE];
  };

  const getStatutIcon = (statut) => {
    const icons = {
      [STATUT_INSCRIPTION.CONFIRMEE]: FiCheckCircle,
      [STATUT_INSCRIPTION.ANNULEE]: FiXCircle,
      [STATUT_INSCRIPTION.LISTE_ATTENTE]: FiClock,
      [STATUT_INSCRIPTION.EN_ATTENTE]: FiClock,
    };
    return icons[statut] || FiClock;
  };

  const getStatutText = (statut) => {
    const texts = {
      [STATUT_INSCRIPTION.CONFIRMEE]: "L'inscription est confirmée et validée",
      [STATUT_INSCRIPTION.ANNULEE]: "L'inscription a été annulée",
      [STATUT_INSCRIPTION.LISTE_ATTENTE]: "En attente d'une place disponible",
      [STATUT_INSCRIPTION.EN_ATTENTE]: "En attente de confirmation par le moniteur",
    };
    return texts[statut] || "Statut inconnu";
  };

  const StatutIcon = getStatutIcon(inscription.statut);

  // Sortie annulée après coup, ou inscription elle-même annulée (l'adhérent
  // s'est désisté) : dans les deux cas, plus aucun paiement ne doit être
  // activement réclamé — le solde affiché reste un fait historique à
  // régulariser manuellement (remboursement/avoir), pas une dette en cours.
  const paiementARegulariser =
    sortie?.statut === "Annulée" || inscription.statut === STATUT_INSCRIPTION.ANNULEE;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 px-4"
    >
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <button
          onClick={() => navigate("/inscriptions")}
          className="group inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
        >
          <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
          Retour à la liste
        </button>
        <div className="flex gap-2 flex-wrap">
          {canManagePaiement &&
            Number(inscription.montant_du) > 0 &&
            !inscription.paye &&
            !paiementARegulariser && (
            <button
              onClick={() => setShowPaiementModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors duration-150"
            >
              <FiPlusCircle className="w-4 h-4" />
              Enregistrer un paiement
            </button>
          )}
          <Link
            to={`/inscriptions/edit/${inscription.id_inscription}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150"
          >
            <FiEdit className="w-4 h-4" />
            Modifier l'inscription
          </Link>
        </div>
      </motion.div>

      {/* Titre */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6 md:p-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-900/20">
                <FiFileText className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Inscription{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    N°{inscription.id_inscription}
                  </span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <FiUser className="w-3.5 h-3.5" />
                    {adherent
                      ? `${adherent.civilite} ${adherent.prenom} ${adherent.nom}`
                      : `Adhérent N°${inscription.num_adherent}`}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1">
                    <FiAnchor className="w-3.5 h-3.5" />
                    {sortie
                      ? `${sortie.type} - ${sortie.lieu}`
                      : `Sortie N°${inscription.id_sortie}`}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={inscription.statut} />
          </div>
        </div>
      </motion.div>

      {/* La sortie a été annulée après coup, ou l'adhérent s'est désisté :
          dans les deux cas le statut affiché plus haut (Confirmée, etc.)
          reste un fait historique exact, mais ne doit pas laisser croire
          qu'un paiement est encore activement réclamé — voir le bouton
          "Enregistrer un paiement" (masqué dans ce cas) et le "Statut du
          paiement" ci-dessous. Même logique que la carte météo d'une sortie
          annulée (SortieDetails.jsx). */}
      {paiementARegulariser && Number(inscription.montant_du) > 0 && (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="flex items-start gap-3 rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-5 py-4"
        >
          <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">
            <span className="font-semibold">
              {sortie?.statut === "Annulée"
                ? "Cette sortie a été annulée après cette inscription."
                : "Cette inscription a été annulée."}
            </span>{" "}
            Les montants ci-dessous reflètent la situation avant
            l&apos;annulation ; un remboursement ou un avoir doit être géré
            manuellement si un paiement avait déjà été enregistré.
          </p>
        </motion.div>
      )}

      {/* Grille d'informations */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Adhérent */}
        <SectionCard title="Informations adhérent" icon={FiUser}>
          <InfoItem icon={FiUser} label="Adhérent" highlight>
            {adherent ? (
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {adherent.civilite} {adherent.prenom} {adherent.nom}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  N°{adherent.num_adherent}
                </p>
              </div>
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">
                N°{inscription.num_adherent}
              </p>
            )}
          </InfoItem>
          {adherent && (
            <>
              <InfoItem
                icon={FiAward}
                label="Niveau de plongée"
                value={adherent.niveau || "Non défini"}
              />
              <InfoItem
                icon={FiCalendar}
                label="Date d'adhésion"
                value={formatDate(adherent.date_adhesion)}
              />
              <InfoItem icon={FiUsers} label="Email" value={adherent.email} />
            </>
          )}
        </SectionCard>

        {/* Sortie */}
        <SectionCard title="Informations sortie" icon={FiMapPin}>
          <InfoItem icon={FiCalendar} label="Sortie" highlight>
            {sortie ? (
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {sortie.type} - {sortie.lieu}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  N°{sortie.id_sortie} • {sortie.site}
                </p>
              </div>
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">
                N°{inscription.id_sortie}
              </p>
            )}
          </InfoItem>
          {sortie && (
            <>
              <InfoItem icon={FiTag} label="Type" value={sortie.type} />
              <InfoItem
                icon={FiDroplet}
                label="Profondeur max"
                value={`${sortie.profondeur_max || 0} mètres`}
              />
              <InfoItem
                icon={FiCalendar}
                label="Date et heure"
                value={formatDateTime(sortie.date_heure)}
              />
              <InfoItem
                icon={FiBarChart2}
                label="Statut"
                value={<StatusBadge status={sortie.statut} />}
              />
            </>
          )}
          <InfoItem
            icon={FiDollarSign}
            label="Montant dû"
            value={
              Number(inscription.montant_du) > 0
                ? formatCurrency(inscription.montant_du)
                : "Gratuit"
            }
            highlight
          />
          {Number(inscription.montant_du) > 0 && (
            <>
              <InfoItem
                icon={FiDollarSign}
                label="Montant payé / Solde restant"
                value={`${formatCurrency(inscription.montant_paye || 0)} / ${formatCurrency(
                  Math.max((inscription.montant_du || 0) - (inscription.montant_paye || 0), 0),
                )}`}
              />
              <InfoItem
                icon={
                  inscription.paye
                    ? FiCheckCircle
                    : paiementARegulariser
                      ? FiAlertCircle
                      : FiClock
                }
                label="Statut du paiement"
                value={
                  inscription.paye
                    ? "Payé"
                    : paiementARegulariser
                      ? "À régulariser (annulée)"
                      : "En attente / partiel"
                }
              />
            </>
          )}
        </SectionCard>
      </motion.div>

      {/* Échéancier de paiement */}
      {Number(inscription.montant_du) > 0 && (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400">
              <FiDollarSign className="w-5 h-5" />
            </span>
            Échéancier
          </h3>
          <EcheancierCard
            type_paiement="Sortie"
            reference_id={inscription.id_inscription}
            num_adherent={inscription.num_adherent}
            soldeRestant={Math.max(
              (inscription.montant_du || 0) - (inscription.montant_paye || 0),
              0,
            )}
            // Lecture seule si sortie/inscription annulée : consulter un
            // échéancier déjà créé reste utile, en créer un nouveau ou
            // marquer une échéance payée ne l'est plus (voir
            // paiementARegulariser).
            canManage={canManagePaiement && !paiementARegulariser}
            ownerQueryKeys={[["inscriptions"], ["inscription", inscription.id_inscription]]}
          />
        </motion.div>
      )}

      {/* Statut de l'inscription */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6 md:p-8"
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
          <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400">
            <FiCheckCircle className="w-5 h-5" />
          </span>
          Statut de l'inscription
        </h3>

        <div
          className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-xl border-2 ${getStatutColor(inscription.statut)}`}
        >
          <div
            className={`p-3 rounded-full ${
              inscription.statut === STATUT_INSCRIPTION.CONFIRMEE
                ? "bg-green-100 dark:bg-green-900/30"
                : inscription.statut === STATUT_INSCRIPTION.ANNULEE
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-yellow-100 dark:bg-yellow-900/30"
            }`}
          >
            <StatutIcon
              className={`w-7 h-7 ${
                inscription.statut === STATUT_INSCRIPTION.CONFIRMEE
                  ? "text-green-600 dark:text-green-400"
                  : inscription.statut === STATUT_INSCRIPTION.ANNULEE
                    ? "text-red-600 dark:text-red-400"
                    : "text-yellow-600 dark:text-yellow-400"
              }`}
            />
          </div>
          <div className="flex-1">
            <p
              className={`font-bold text-lg ${
                inscription.statut === STATUT_INSCRIPTION.CONFIRMEE
                  ? "text-green-800 dark:text-green-400"
                  : inscription.statut === STATUT_INSCRIPTION.ANNULEE
                    ? "text-red-800 dark:text-red-400"
                    : "text-yellow-800 dark:text-yellow-400"
              }`}
            >
              {inscription.statut}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getStatutText(inscription.statut)}
            </p>
          </div>
          {inscription.rang_liste_attente && (
            <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Rang{" "}
                <span className="font-bold text-gray-900 dark:text-white">
                  N°{inscription.rang_liste_attente}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Détails supplémentaires */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-700/30 transition-colors duration-300">
            <FiCalendar className="w-4 h-4 text-blue-500 mt-0.5" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Date d'inscription
              </p>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {formatDate(inscription.date_inscription)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-700/30 transition-colors duration-300">
            {!inscription.presence_checked ? (
              <FiClock className="w-4 h-4 text-gray-400 mt-0.5" />
            ) : inscription.presence ? (
              <FiCheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            ) : (
              <FiXCircle className="w-4 h-4 text-red-500 mt-0.5" />
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Présence
              </p>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {!inscription.presence_checked
                  ? "Non pointé"
                  : inscription.presence
                    ? "Présent"
                    : "Absent"}
              </p>
            </div>
          </div>

          {inscription.date_confirmation && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-700/30 transition-colors duration-300">
              <FiCheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Date de confirmation
                </p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {formatDate(inscription.date_confirmation)}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-700/30 transition-colors duration-300">
            <FiFileText className="w-4 h-4 text-blue-500 mt-0.5" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Référence
              </p>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                INS-{String(inscription.id_inscription).padStart(4, "0")}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pied de page */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-xs text-gray-400 dark:text-gray-500 pt-2"
      >
        <p>Dernière mise à jour : {formatDateTime(new Date().toISOString())}</p>
      </motion.div>

      {/* Modal paiement complémentaire */}
      {showPaiementModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.form
            onSubmit={handleEnregistrerPaiement}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 25 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Enregistrer un paiement
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Solde restant :{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(
                  Math.max((inscription.montant_du || 0) - (inscription.montant_paye || 0), 0),
                )}
              </span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Montant (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paiementForm.montant}
                  onChange={(e) =>
                    setPaiementForm((prev) => ({ ...prev, montant: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Mode de paiement
                </label>
                <select
                  value={paiementForm.mode}
                  onChange={(e) =>
                    setPaiementForm((prev) => ({ ...prev, mode: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {MODE_PAIEMENT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowPaiementModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={enregistrerPaiement.isPending}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Enregistrer
              </button>
            </div>
          </motion.form>
        </ModalOverlay>
      )}
    </motion.div>
  );
};

export default InscriptionDetails;