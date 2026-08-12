import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  FiAward,
  FiShield,
  FiHeart,
  FiCalendar,
  FiAlertTriangle,
  FiBarChart2,
  FiPieChart,
  FiClock,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useAdhesions } from "../../hooks/Adhesion/useAdhesions";
import { useCertificats } from "../../hooks/CertificatMedical/useCertificats";
import { usePlongees } from "../../hooks/Plongee/usePlongees";
import { usePaiements } from "../../hooks/Paiement/usePaiements";
import { useInscriptions } from "../../hooks/Inscription/useInscriptions";
import StatsCard from "../Common/StatsCard";
import LoadingSpinner from "../Common/LoadingSpinner";
import DashboardHero from "./DashboardHero";
import BarChart from "../Charts/BarChart";
import PieChart from "../Charts/PieChart";
import RecentActivityAdherent from "./RecentActivityAdherent";

const NOMS_MOIS_COURTS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

// 6 derniers mois (le mois en cours inclus), pour regrouper les plongées,
// inscriptions et paiements réels de l'adhérent par mois.
const getLast6MonthsBuckets = () => {
  const now = new Date();
  const buckets = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      month: NOMS_MOIS_COURTS[d.getMonth()],
    });
  }
  return buckets;
};

const bucketKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth()}`;
};

const STATUT_LABELS = {
  ok: "À jour",
  bientot: "Bientôt",
  expire: "Expiré",
  inconnu: "Non renseigné",
};

const SEUIL_ALERTE_JOURS = 30;

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Non renseigné";

// Statut d'échéance (expiré / bientôt / à jour / inconnu), sur le même
// seuil J-30 que AlerteService côté backend.
const getEcheance = (dateFin) => {
  if (!dateFin) return { statut: "inconnu", joursRestants: null };
  const jours = Math.ceil(
    (new Date(dateFin) - new Date()) / (1000 * 60 * 60 * 24),
  );
  if (jours < 0) return { statut: "expire", joursRestants: jours };
  if (jours <= SEUIL_ALERTE_JOURS)
    return { statut: "bientot", joursRestants: jours };
  return { statut: "ok", joursRestants: jours };
};

const URGENCE_STYLES = {
  expire: {
    bgColor: "bg-red-50 dark:bg-red-900/20",
    textColor: "text-red-600 dark:text-red-400",
    badge: (j) => `Expiré depuis ${Math.abs(j)} j`,
  },
  bientot: {
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    textColor: "text-amber-600 dark:text-amber-400",
    badge: (j) => `Expire dans ${j} j`,
  },
  ok: {
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    textColor: "text-emerald-600 dark:text-emerald-400",
    badge: () => "À jour",
  },
  inconnu: {
    bgColor: "bg-slate-100 dark:bg-slate-700/40",
    textColor: "text-slate-500 dark:text-slate-400",
    badge: () => "Non renseigné",
  },
};

// Sélectionne, parmi les adhésions d'un type donné, celle en cours (date_fin
// la plus proche dans le futur), sinon la plus récemment expirée.
const getAdhesionPertinente = (adhesions, type) => {
  const candidates = (adhesions || []).filter((a) => a.type === type);
  if (candidates.length === 0) return null;
  const now = new Date();
  const enCours = candidates
    .filter((a) => new Date(a.date_fin) >= now)
    .sort((a, b) => new Date(a.date_fin) - new Date(b.date_fin));
  if (enCours.length > 0) return enCours[0];
  return candidates.sort(
    (a, b) => new Date(b.date_fin) - new Date(a.date_fin),
  )[0];
};

const AdherentRecapCard = () => {
  const { user } = useAuth();
  const { useGetAll: useGetAllAdherents } = useAdherents();
  const { useGetByAdherent: useGetAdhesionsByAdherent } = useAdhesions();
  const { useGetByAdherent: useGetCertificatsByAdherent } = useCertificats();
  const { useGetByAdherent: useGetPlongeesByAdherent } = usePlongees();
  const { useGetByAdherent: useGetPaiementsByAdherent } = usePaiements();
  const { useGetByAdherent: useGetInscriptionsByAdherent } = useInscriptions();

  const { data: adherentsResponse, isLoading: loadingAdherent } =
    useGetAllAdherents();
  const adherent = adherentsResponse?.data?.[0] || null;
  const numAdherent = adherent?.num_adherent;

  const { data: adhesionsResponse, isLoading: loadingAdhesions } =
    useGetAdhesionsByAdherent(numAdherent);
  const adhesions = adhesionsResponse?.data || [];

  const { data: certificatsResponse, isLoading: loadingCertificats } =
    useGetCertificatsByAdherent(numAdherent);
  const certificats = certificatsResponse?.data || [];

  const { data: plongeesResponse } = useGetPlongeesByAdherent(numAdherent);
  const { data: paiementsResponse } = useGetPaiementsByAdherent(numAdherent);
  const { data: inscriptionsResponse } =
    useGetInscriptionsByAdherent(numAdherent);

  const certificatActuel = useMemo(() => {
    if (certificats.length === 0) return null;
    return [...certificats].sort(
      (a, b) => new Date(b.date_validite) - new Date(a.date_validite),
    )[0];
  }, [certificats]);

  const adhesionClub = useMemo(
    () => getAdhesionPertinente(adhesions, "Club"),
    [adhesions],
  );
  const adhesionAssurance = useMemo(
    () => getAdhesionPertinente(adhesions, "Assurance RC"),
    [adhesions],
  );

  const monthlyPersonalData = useMemo(() => {
    const buckets = getLast6MonthsBuckets();
    const counts = Object.fromEntries(
      buckets.map((b) => [b.key, { plongees: 0, sorties: 0, paiements: 0 }]),
    );

    (plongeesResponse?.data || []).forEach((p) => {
      const key = bucketKey(p.date);
      if (counts[key]) counts[key].plongees += 1;
    });
    (inscriptionsResponse?.data || []).forEach((i) => {
      const date = i.sortie?.date_heure || i.created_at;
      if (!date) return;
      const key = bucketKey(date);
      if (counts[key]) counts[key].sorties += 1;
    });
    (paiementsResponse?.data || []).forEach((p) => {
      const key = bucketKey(p.date_paiement);
      if (counts[key]) counts[key].paiements += 1;
    });

    return buckets.map((b) => ({
      month: b.month,
      adherents: counts[b.key].plongees,
      sorties: counts[b.key].sorties,
      paiements: counts[b.key].paiements,
    }));
  }, [plongeesResponse, inscriptionsResponse, paiementsResponse]);

  const isLoading = loadingAdherent || loadingAdhesions || loadingCertificats;

  if (isLoading) return <LoadingSpinner />;

  if (!adherent) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 text-center">
        <p className="text-slate-500 dark:text-slate-400">
          Aucune fiche adhérent n'est associée à votre compte pour le moment.
        </p>
      </div>
    );
  }

  const echeanceClub = getEcheance(adhesionClub?.date_fin);
  const echeanceCertificat = getEcheance(certificatActuel?.date_validite);
  const echeanceAssurance = getEcheance(adhesionAssurance?.date_fin);

  const alerteActive = [
    echeanceClub,
    echeanceCertificat,
    echeanceAssurance,
  ].some((e) => e.statut === "expire" || e.statut === "bientot");

  const dossierPieCounts = {};
  [echeanceClub, echeanceCertificat, echeanceAssurance].forEach((e) => {
    dossierPieCounts[e.statut] = (dossierPieCounts[e.statut] || 0) + 1;
  });
  const dossierPieData = Object.entries(dossierPieCounts).map(
    ([statut, value]) => ({ name: STATUT_LABELS[statut], value }),
  );

  const mainStats = [
    {
      title: "Mon niveau",
      value: adherent.niveau,
      icon: FiAward,
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      textColor: "text-blue-600 dark:text-blue-400",
      subValue: adherent.date_obtention_niveau
        ? `Obtenu le ${formatDate(adherent.date_obtention_niveau)}`
        : `N° adhérent : ${adherent.num_adherent}`,
    },
    {
      title: "Adhésion Club",
      value: formatDate(adhesionClub?.date_fin),
      icon: FiCalendar,
      bgColor: URGENCE_STYLES[echeanceClub.statut].bgColor,
      textColor: URGENCE_STYLES[echeanceClub.statut].textColor,
      subValue: "Date de fin de validité",
      badge: URGENCE_STYLES[echeanceClub.statut].badge(
        echeanceClub.joursRestants,
      ),
      badgeColor: URGENCE_STYLES[echeanceClub.statut].textColor,
    },
    {
      title: "Certificat médical",
      value: formatDate(certificatActuel?.date_validite),
      icon: FiHeart,
      bgColor: URGENCE_STYLES[echeanceCertificat.statut].bgColor,
      textColor: URGENCE_STYLES[echeanceCertificat.statut].textColor,
      subValue: "Date de fin de validité",
      badge: URGENCE_STYLES[echeanceCertificat.statut].badge(
        echeanceCertificat.joursRestants,
      ),
      badgeColor: URGENCE_STYLES[echeanceCertificat.statut].textColor,
    },
    {
      title: "Assurance RC",
      value: formatDate(adhesionAssurance?.date_fin),
      icon: FiShield,
      bgColor: URGENCE_STYLES[echeanceAssurance.statut].bgColor,
      textColor: URGENCE_STYLES[echeanceAssurance.statut].textColor,
      subValue: "Date de fin de validité",
      badge: URGENCE_STYLES[echeanceAssurance.statut].badge(
        echeanceAssurance.joursRestants,
      ),
      badgeColor: URGENCE_STYLES[echeanceAssurance.statut].textColor,
    },
  ];

  return (
    <div className="space-y-6">
      {alerteActive && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 flex items-center gap-3 backdrop-blur-sm"
        >
          <FiAlertTriangle className="text-amber-600 dark:text-amber-400 text-xl flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Une échéance approche ou est dépassée
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Vérifiez vos dates d'adhésion, de certificat médical ou
              d'assurance ci-dessous.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Graphiques personnels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <FiBarChart2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Mon activité mensuelle
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Mes plongées, sorties et paiements sur 6 mois
              </p>
            </div>
          </div>
          <BarChart
            data={monthlyPersonalData}
            labels={{
              adherents: "Mes plongées",
              sorties: "Mes sorties",
              paiements: "Mes paiements",
            }}
          />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl">
              <FiPieChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Mon dossier
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Adhésion, certificat, assurance
              </p>
            </div>
          </div>
          <PieChart data={dossierPieData} />
        </div>
      </div>

      {/* Activité récente personnelle */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl">
            <FiClock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              Mon activité récente
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Mes dernières plongées, inscriptions et paiements
            </p>
          </div>
        </div>
        <RecentActivityAdherent numAdherent={numAdherent} />
      </div>
    </div>
  );
};

export default AdherentRecapCard;
