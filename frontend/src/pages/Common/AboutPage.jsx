import React from "react";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiAward,
  FiAnchor,
  FiHeart,
  FiTrendingUp,
  FiStar,
  FiClock,
  FiShield,
  FiDroplet,
  FiSun,
  FiCompass,
  FiChevronRight,
  FiChevronDown,
} from "react-icons/fi";
import { CLUB_LOCATION } from "../../utils/constants";
import Breadcrumb from "../../components/Common/Breadcrumb";

// Photos libres de droits (licence Unsplash — usage commercial libre, sans
// attribution obligatoire) : ce dépôt ne contient aucune photothèque propre
// au club, ces images servent de rendu "site vitrine" en attendant de
// vraies photos d'Aquanature (sorties, local, équipe) à substituer ici.
// Paramètres w/q/auto/fit=crop : redimensionnement côté CDN Unsplash, pas
// de fichier à héberger dans le dépôt.
const IMAGES = {
  hero: "https://images.unsplash.com/photo-1761145586920-8eb35f3c7c9b?w=2400&q=75&auto=format&fit=crop",
  histoire:
    "https://images.unsplash.com/photo-1637308109237-4ea1a7dd22f5?w=1600&q=75&auto=format&fit=crop",
  fondsMarins:
    "https://images.unsplash.com/photo-1471079502516-250c19af6928?w=1600&q=75&auto=format&fit=crop",
  equipe:
    "https://images.unsplash.com/photo-1646947009718-1cb77aaa2a6d?w=1600&q=75&auto=format&fit=crop",
  cta: "https://images.unsplash.com/photo-1611483816818-a74360466650?w=2400&q=75&auto=format&fit=crop",
  equipement:
    "https://images.unsplash.com/photo-1786690511605-28e5120c0062?w=1600&q=75&auto=format&fit=crop",
};

const AboutPage = () => {
  const stats = [
    { icon: FiCalendar, label: "Création", value: "2008" },
    { icon: FiMapPin, label: "Localisation", value: "Saint-Leu" },
    { icon: FiUsers, label: "Adhérents", value: "120" },
    { icon: FiTrendingUp, label: "Sorties / an", value: "500" },
    { icon: FiAward, label: "Affiliation", value: "FFESM" },
  ];

  // Numérotées à dessein (voir la mise en page ci-dessous) : ce sont bien 5
  // domaines d'activité distincts et énumérables, pas une simple décoration.
  const activities = [
    {
      icon: FiAnchor,
      label: "Baptêmes",
      description: "Première immersion encadrée, aucune expérience requise.",
    },
    {
      icon: FiAward,
      label: "Formations",
      description: "Du niveau 1 au niveau 4, encadrées par nos moniteurs FFESM.",
    },
    {
      icon: FiCompass,
      label: "Exploration",
      description: "Sorties sur les spots emblématiques de la côte ouest.",
    },
    {
      icon: FiTrendingUp,
      label: "Sorties bateau",
      description: "Départs réguliers vers les récifs au large de Saint-Leu.",
    },
    {
      icon: FiHeart,
      label: "Nettoyages",
      description: "Journées bénévoles de préservation des fonds marins.",
    },
  ];

  const team = [
    { name: "Directeur Technique", role: "Salarié permanent", count: 1 },
    { name: "Bénévoles actifs", role: "Équipe", count: 5 },
  ];

  const practicalInfo = [
    {
      icon: FiClock,
      label: "Local ouvert",
      value: "Mercredi-Vendredi 14h-18h, Samedi 9h-12h",
    },
    {
      icon: FiCompass,
      label: "Sorties",
      value: "Mercredi, Samedi, Dimanche (selon météo)",
    },
    { icon: FiSun, label: "Saison forte", value: "Juin-Septembre (baleines)" },
    { icon: FiMapPin, label: "Adresse", value: CLUB_LOCATION.address },
  ];

  const features = [
    { icon: FiDroplet, label: "20 blocs", description: "Air comprimé" },
    { icon: FiShield, label: "10 détendeurs", description: "Ensembles complets" },
    { icon: FiSun, label: "Combinaisons", description: "Toutes tailles" },
    { icon: FiClock, label: "Accessoires", description: "Équipement complet" },
  ];

  const values = [
    {
      icon: FiHeart,
      label: "Passion",
      desc: "La mer comme vecteur d'émotions",
      color: "coral",
    },
    {
      icon: FiShield,
      label: "Sécurité",
      desc: "La plongée en toute confiance",
      color: "ocean",
    },
    {
      icon: FiUsers,
      label: "Partage",
      desc: "Transmettre et apprendre ensemble",
      color: "primary",
    },
  ];

  // Classes complètes et littérales par couleur (et non construites à la
  // volée via `border-${value.color}-100`) : le scanner de contenu de
  // Tailwind ne lit que le texte brut des fichiers, pas la valeur réelle
  // des variables JS — une classe assemblée par interpolation de chaîne
  // n'apparaît donc jamais telle quelle dans le code source et se fait
  // silencieusement purger du CSS final (même défaut que le correctif
  // isolation/Leaflet). Les cartes "Nos Valeurs" perdaient ainsi bordure,
  // fond d'icône et couleur d'icône en production.
  const valueStyles = {
    coral: {
      border: "border-coral-100 dark:border-coral-900/30",
      iconBg: "bg-coral-100 dark:bg-coral-900/30",
      iconText: "text-coral-600 dark:text-coral-400",
    },
    ocean: {
      border: "border-ocean-100 dark:border-ocean-800/30",
      iconBg: "bg-ocean-100 dark:bg-ocean-900/30",
      iconText: "text-ocean-600 dark:text-ocean-400",
    },
    primary: {
      border: "border-primary-100 dark:border-primary-800/30",
      iconBg: "bg-primary-100 dark:bg-primary-900/30",
      iconText: "text-primary-600 dark:text-primary-400",
    },
  };

  return (
    <>
      <Breadcrumb current="À propos" />
      <div className="space-y-14 pb-12">
      {/* Hero plein cadre : photo (vue plongeur) + dégradé de lisibilité,
          typographie serif (font-display) pour le titre — c'est ce couple
          photo pleine page + serif éditoriale qui donne le ton "site
          vitrine premium" plutôt que "back-office". */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl shadow-2xl h-[480px] sm:h-[560px]"
      >
        <motion.img
          src={IMAGES.hero}
          alt="Plongeur évoluant dans une eau bleue cristalline"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/95 via-ocean-900/55 to-primary-900/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-ocean-900/50 via-transparent to-transparent" />

        {/* Particules flottantes, ambiance "bulles" — seul moment animé en
            boucle de toute la page (voir plus bas : les icônes de section
            ne s'agitent plus en continu, un site vitrine soigné réserve le
            mouvement perpétuel à un seul endroit). */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/20 border border-white/10"
            style={{
              width: 6 + ((i * 7) % 22),
              height: 6 + ((i * 7) % 22),
              top: `${15 + ((i * 11) % 65)}%`,
              left: `${8 + ((i * 13) % 80)}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.15, 0.5, 0.15],
            }}
            transition={{
              duration: 5 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}

        <div className="relative z-10 h-full flex flex-col justify-end p-6 sm:p-10 text-white">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase text-white/70 mb-3"
          >
            Club FFESM · Saint-Leu, La Réunion
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="font-display text-4xl md:text-6xl font-semibold tracking-tight text-balance"
          >
            Aquanature Plongée
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-white/85 max-w-xl text-base md:text-lg leading-relaxed mt-4 font-light"
          >
            Plongez au cœur d&apos;une aventure humaine et océanique, où la
            passion de la mer se transmet depuis 2008.
          </motion.p>

          <motion.a
            href="#histoire"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-8 inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors w-fit"
          >
            Découvrir le club
            <motion.span
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <FiChevronDown className="w-4 h-4" />
            </motion.span>
          </motion.a>
        </div>
      </motion.div>

      {/* Bandeau de statistiques : une seule barre éditoriale sombre à
          chiffres serif, plutôt que cinq cartes blanches identiques — évite
          l'effet "grille de widgets" et chevauche le bas du hero pour la
          continuité visuelle. */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative -mt-20 sm:-mt-24 z-10 mx-1"
      >
        {/* divide-x réservé à sm+ : à 2 colonnes (mobile) la grille passe
            sur plusieurs lignes et `divide-x` (border-left sur tout enfant
            sauf le premier) laisserait un trait flottant en début de ligne
            2 et 3 — à 5 colonnes (sm+), tout tient sur une seule ligne et le
            découpage est toujours correct. */}
        <div className="bg-gradient-to-r from-ocean-900 to-primary-900 rounded-2xl shadow-2xl px-5 sm:px-10 py-7 sm:py-9 grid grid-cols-2 sm:grid-cols-5 gap-y-6 sm:divide-x sm:divide-white/10">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + index * 0.08, duration: 0.5 }}
              className="text-center px-2 sm:px-3 first:pl-0"
            >
              <stat.icon className="w-4 h-4 mx-auto text-white/50 mb-2" />
              <p className="font-display text-2xl sm:text-3xl font-semibold text-white">
                {stat.value}
              </p>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider text-white/60 mt-1">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Notre Histoire : mise en page éditoriale texte + photo. */}
      <motion.div
        id="histoire"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="scroll-mt-24 bg-white dark:bg-gray-800 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow duration-300 grid grid-cols-1 md:grid-cols-2"
      >
        <div className="p-6 sm:p-10 flex flex-col justify-center order-2 md:order-1">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-coral-500 dark:text-coral-400 mb-2">
            Depuis 2008
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-4 text-balance">
            Notre Histoire
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Créé en 2008 à Saint-Leu, sur la côte ouest de La Réunion,
            Aquanature Plongée est un club affilié à la Fédération Française
            d&apos;Études et de Sports Sous-Marins (FFESM). Notre région est
            réputée pour la richesse exceptionnelle de ses fonds marins, où se
            côtoient baleines, tortues et coraux dans une eau cristalline.
          </p>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
            Aujourd&apos;hui, notre club compte 120 adhérents actifs, des
            débutants (N1) aux moniteurs (N4), unis par la même passion pour
            l&apos;océan et la transmission. Ensemble, nous organisons plus de
            500 sorties par an, entre exploration, formation et baptêmes.
          </p>
        </div>
        <div className="relative h-64 md:h-auto order-1 md:order-2 overflow-hidden">
          <motion.img
            src={IMAGES.histoire}
            alt="Récif corallien coloré au large de Saint-Leu"
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ scale: 1.15 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-black/20 to-transparent" />
        </div>
      </motion.div>

      {/* Philosophie : bandeau plein cadre en couleur (pas une photo) pour
          respirer entre deux sections à carte blanche, citation serif
          italique — la voix du club, pas un faux témoignage attribué à
          quelqu'un. */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 via-ocean-900 to-primary-800 px-6 sm:px-16 py-14 sm:py-20 text-center"
      >
        <FiAnchor className="absolute -right-8 -bottom-10 w-56 h-56 text-white/5 rotate-12" />
        <div className="relative z-10">
          <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-ocean-300 mb-5">
            Notre philosophie
          </p>
          <p className="font-display italic text-2xl sm:text-4xl text-white leading-snug max-w-3xl mx-auto text-balance">
            « La plongée n&apos;est pas seulement une activité : c&apos;est
            une manière de regarder la mer, et de la protéger. »
          </p>
        </div>
      </motion.div>

      {/* Activités : liste indexée (1 à 5), pas cinq tuiles arc-en-ciel
          identiques — l'énumération a ici un vrai sens (5 domaines
          distincts), donc la numérotation porte de l'information plutôt
          que de la décorer. */}
      <motion.div
        id="activites"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="scroll-mt-24 bg-white dark:bg-gray-800 rounded-2xl shadow-card p-6 sm:p-10 border border-gray-100 dark:border-gray-700"
      >
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-coral-500 dark:text-coral-400 mb-1">
          Ce que nous proposons
        </p>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-6">
          Nos Activités
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-12">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              viewport={{ once: true }}
              className="group flex items-start gap-4 py-5 border-b border-gray-100 dark:border-gray-700 last:border-b-0 sm:[&:nth-child(4)]:border-b-0"
            >
              <span className="font-display text-2xl text-gray-200 dark:text-gray-700 group-hover:text-coral-400 dark:group-hover:text-coral-500 transition-colors leading-none pt-1 tabular-nums">
                0{index + 1}
              </span>
              <span className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-primary-600 dark:text-primary-400 group-hover:bg-coral-50 dark:group-hover:bg-coral-900/20 group-hover:text-coral-600 dark:group-hover:text-coral-400 transition-colors flex-shrink-0">
                <activity.icon className="w-5 h-5" />
              </span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {activity.label}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {activity.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Bandeau photo pleine largeur : richesse des fonds marins de
          Saint-Leu — respire entre les sections plutôt qu'un simple bloc
          de texte de plus. */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-2xl shadow-xl h-64 sm:h-80"
      >
        <img
          src={IMAGES.fondsMarins}
          alt="Tortue marine évoluant dans les eaux de l'océan Indien"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-end p-6 sm:p-8 text-white max-w-lg">
          <h3 className="font-display text-xl sm:text-2xl font-semibold text-balance">
            Une réserve marine exceptionnelle
          </h3>
          <p className="text-white/85 text-sm sm:text-base mt-1.5 leading-relaxed">
            Baleines à bosse, tortues vertes et récifs coralliens : les fonds
            de la côte ouest réunionnaise à chaque sortie.
          </p>
        </div>
      </motion.div>

      {/* Infos pratiques */}
      <motion.div
        id="infos-pratiques"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="scroll-mt-24 bg-white dark:bg-gray-800 rounded-2xl shadow-card p-6 sm:p-10 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
      >
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-coral-500 dark:text-coral-400 mb-1">
          Pour préparer votre venue
        </p>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-6">
          Infos pratiques
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {practicalInfo.map((info, index) => (
            <motion.div
              key={info.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -3 }}
              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <info.icon className="w-4 h-4 text-primary-500 dark:text-primary-400 flex-shrink-0" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {info.label}
                </p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {info.value}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Équipe (photo) + Équipement (icônes) */}
      <div id="equipe" className="scroll-mt-24 grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="relative rounded-2xl shadow-card border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow duration-300 min-h-[320px] flex flex-col justify-end text-white"
        >
          <img
            src={IMAGES.equipe}
            alt="Groupe de plongeurs évoluant ensemble sous l'eau"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="relative z-10 p-6 sm:p-8">
            <h2 className="font-display text-xl sm:text-2xl font-semibold mb-4">
              Notre Équipe
            </h2>
            <div className="space-y-2.5">
              {team.map((member, index) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10"
                >
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-white/70">{member.role}</p>
                  </div>
                  <span className="font-display text-2xl font-semibold">
                    {member.count}
                  </span>
                </motion.div>
              ))}
            </div>
            <p className="text-sm text-white/80 text-center mt-4 flex items-center justify-center gap-2">
              <FiHeart className="w-4 h-4" />
              Une équipe passionnée au service de la plongée
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow duration-300"
        >
          <div className="relative h-28">
            <img
              src={IMAGES.equipement}
              alt="Bouteilles de plongée et détendeurs prêts à l'usage"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-800 via-black/10 to-black/30" />
          </div>
          <div className="p-6 sm:p-8 pt-4">
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Notre Équipement
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature) => (
                <div
                  key={feature.label}
                  className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center"
                >
                  <feature.icon className="w-5 h-5 mx-auto text-primary-500 dark:text-primary-400 mb-1" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {feature.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-sm text-gray-600 dark:text-gray-300 text-center">
              Un local équipé pour accueillir tous les plongeurs
            </p>
          </div>
        </motion.div>
      </div>

      {/* Valeurs */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="bg-gradient-to-r from-primary-50 to-ocean-50 dark:from-primary-900/20 dark:to-ocean-900/20 rounded-2xl p-6 sm:p-10 border border-primary-100 dark:border-primary-800/30"
      >
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-coral-500 dark:text-coral-400 mb-1">
          Notre état d&apos;esprit
        </p>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2.5">
          <FiStar className="w-5 h-5 text-primary-500 dark:text-primary-400" />
          Nos Valeurs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {values.map((value, index) => {
            const style = valueStyles[value.color];
            return (
              <motion.div
                key={value.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                className={`text-center p-6 bg-white/60 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border ${style.border} shadow-lg transition-shadow hover:shadow-xl`}
              >
                <div
                  className={`w-14 h-14 ${style.iconBg} rounded-full flex items-center justify-center mx-auto mb-3`}
                >
                  <value.icon className={`w-7 h-7 ${style.iconText}`} />
                </div>
                <p className="font-display text-lg font-semibold text-gray-900 dark:text-white">
                  {value.label}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {value.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* CTA final : bandeau photo pleine largeur (vue aérienne de l'océan)
          pour clore la page sur une note "vitrine". */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-2xl shadow-2xl h-56 sm:h-64 flex items-center justify-center text-center"
      >
        <img
          src={IMAGES.cta}
          alt="Vue aérienne des vagues de l'océan Indien"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 via-ocean-900/70 to-primary-900/80" />
        <div className="relative z-10 px-6">
          <div className="inline-flex p-3 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20 mb-3">
            <FiAnchor className="w-6 h-6 text-white" />
          </div>
          <p className="font-display text-lg sm:text-2xl font-semibold text-white text-balance">
            Plongez avec nous dans l&apos;aventure Aquanature !
          </p>
          <motion.div
            animate={{ x: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="inline-flex mt-2 text-white/85"
          >
            <FiChevronRight className="w-5 h-5" />
          </motion.div>
        </div>
      </motion.div>
      </div>
    </>
  );
};

export default AboutPage;
