import React, { useEffect, useRef } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
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
} from "react-icons/fi";
import { CLUB_LOCATION } from "../../utils/constants";

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
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

  const stats = [
    { icon: FiCalendar, label: "Création", value: "2008" },
    { icon: FiMapPin, label: "Localisation", value: "Saint-Leu" },
    { icon: FiUsers, label: "Adhérents", value: "120" },
    { icon: FiTrendingUp, label: "Sorties/an", value: "500" },
    { icon: FiAward, label: "Affiliation", value: "FFESM" },
  ];

  const activities = [
    { icon: FiAnchor, label: "Baptêmes", color: "from-blue-400 to-blue-600" },
    {
      icon: FiAward,
      label: "Formations",
      color: "from-green-400 to-green-600",
    },
    {
      icon: FiCompass,
      label: "Exploration",
      color: "from-purple-400 to-purple-600",
    },
    {
      icon: FiTrendingUp,
      label: "Sorties bateau",
      color: "from-orange-400 to-orange-600",
    },
    { icon: FiHeart, label: "Nettoyages", color: "from-red-400 to-red-600" },
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
      color: "primary",
    },
    {
      icon: FiShield,
      label: "Sécurité",
      desc: "La plongée en toute confiance",
      color: "green",
    },
    {
      icon: FiUsers,
      label: "Partage",
      desc: "Transmettre et apprendre ensemble",
      color: "purple",
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
    primary: {
      border: "border-primary-100 dark:border-primary-800/30",
      iconBg: "bg-primary-100 dark:bg-primary-900/30",
      iconText: "text-primary-600 dark:text-primary-400",
    },
    green: {
      border: "border-green-100 dark:border-green-800/30",
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconText: "text-green-600 dark:text-green-400",
    },
    purple: {
      border: "border-purple-100 dark:border-purple-800/30",
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconText: "text-purple-600 dark:text-purple-400",
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Hero plein cadre : photo (vue plongeur) + dégradé de lisibilité,
          au lieu de l'ancien bandeau uniquement en dégradé de couleur —
          c'est ce qui donne le ton "site vitrine" plutôt que "back-office". */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl shadow-2xl h-[420px] sm:h-[460px]"
      >
        <motion.img
          src={IMAGES.hero}
          alt="Plongeur évoluant dans une eau bleue cristalline"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/95 via-ocean-900/60 to-primary-900/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-ocean-900/50 via-transparent to-transparent" />

        {/* Particules flottantes, ambiance "bulles" */}
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
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-3 mb-3"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="p-3 bg-white/15 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20"
            >
              <FiAnchor className="w-7 h-7 sm:w-8 sm:h-8" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-3xl md:text-5xl font-bold tracking-tight text-balance"
              >
                Aquanature Plongée
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-white/85 text-base md:text-lg font-light mt-1"
              >
                Club de plongée sous-marine — Saint-Leu, La Réunion
              </motion.p>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-white/85 max-w-xl text-sm md:text-base leading-relaxed"
          >
            Plongez au cœur d&apos;une aventure humaine et océanique, où la
            passion de la mer se transmet depuis 2008.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-4 flex flex-wrap gap-2.5"
          >
            <span className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-medium flex items-center gap-1 border border-white/20">
              <FiCalendar className="w-3 h-3" /> 2008
            </span>
            <span className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-medium flex items-center gap-1 border border-white/20">
              <FiUsers className="w-3 h-3" /> 120 adhérents
            </span>
            <span className="px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-medium flex items-center gap-1 border border-white/20">
              <FiAward className="w-3 h-3" /> FFESM
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Bandeau de statistiques, chevauchant légèrement le bas du hero
          pour l'effet "carte flottante" typique d'un site vitrine. */}
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={controls}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 -mt-16 relative z-10 px-1"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-card p-4 text-center border border-gray-100 dark:border-gray-700 group cursor-default"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1, type: "spring", stiffness: 200 }}
            >
              <stat.icon className="w-6 h-6 mx-auto text-primary-500 dark:text-primary-400 mb-2 group-hover:scale-110 transition-transform" />
            </motion.div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Notre Histoire : mise en page éditoriale texte + photo, plutôt que
          l'ancien bloc texte seul avec icône décorative. */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-card border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow duration-300 grid grid-cols-1 md:grid-cols-2"
      >
        <div className="p-6 sm:p-8 flex flex-col justify-center order-2 md:order-1">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-primary-500 dark:text-primary-400 mb-2">
            Depuis 2008
          </p>
          <div className="flex items-center gap-2 mb-3">
            <FiCompass className="w-5 h-5 text-primary-500 dark:text-primary-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notre Histoire
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Créé en 2008 à Saint-Leu, sur la côte ouest de La Réunion,
            Aquanature Plongée est un club affilié à la Fédération Française
            d&apos;Études et de Sports Sous-Marins (FFESM). Notre région est
            réputée pour la richesse exceptionnelle de ses fonds marins, où se
            côtoient baleines, tortues et coraux dans une eau cristalline.
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
            className="text-gray-600 dark:text-gray-300 leading-relaxed mt-3"
          >
            Aujourd&apos;hui, notre club compte 120 adhérents actifs, des
            débutants (N1) aux moniteurs (N4), unis par la même passion pour
            l&apos;océan et la transmission. Ensemble, nous organisons plus de
            500 sorties par an, entre exploration, formation et baptêmes.
          </motion.p>
        </div>
        <div className="relative h-56 md:h-auto order-1 md:order-2 overflow-hidden">
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

      {/* Infos pratiques */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-card p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <FiClock className="w-5 h-5 text-primary-500" />
          </motion.div>
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
              whileHover={{ scale: 1.03, y: -2 }}
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
          <h3 className="text-xl sm:text-2xl font-bold text-balance">
            Une réserve marine exceptionnelle
          </h3>
          <p className="text-white/85 text-sm sm:text-base mt-1.5 leading-relaxed">
            Baleines à bosse, tortues vertes et récifs coralliens : les fonds
            de la côte ouest réunionnaise à chaque sortie.
          </p>
        </div>
      </motion.div>

      {/* Activités */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-card p-6 border border-gray-100 dark:border-gray-700"
      >
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-primary-500 dark:text-primary-400 mb-1">
          Ce que nous proposons
        </p>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FiAnchor className="w-5 h-5 text-primary-500" />
          </motion.div>
          Nos Activités
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.label}
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.08, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className={`p-4 rounded-xl text-center bg-gradient-to-br ${activity.color} text-white shadow-lg cursor-pointer relative overflow-hidden group`}
            >
              <motion.div
                className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                initial={{ scale: 0 }}
                whileHover={{ scale: 1 }}
              />
              <motion.div whileHover={{ rotate: 360, scale: 1.2 }} transition={{ duration: 0.6 }}>
                <activity.icon className="w-8 h-8 mx-auto mb-2" />
              </motion.div>
              <p className="text-sm font-medium">{activity.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Équipe (photo) + Équipement (icônes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <div className="relative z-10 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <FiUsers className="w-5 h-5" />
              </motion.div>
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
                  whileHover={{ x: 6 }}
                  className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 cursor-default"
                >
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-white/70">{member.role}</p>
                  </div>
                  <span className="text-2xl font-bold">{member.count}</span>
                </motion.div>
              ))}
            </div>
            <p className="text-sm text-white/80 text-center mt-3 flex items-center justify-center gap-2">
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
          <div className="p-6 pt-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FiShield className="w-5 h-5 text-primary-500" />
              </motion.div>
              Notre Équipement
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center cursor-default"
                >
                  <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                    <feature.icon className="w-5 h-5 mx-auto text-primary-500 dark:text-primary-400 mb-1" />
                  </motion.div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {feature.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {feature.description}
                  </p>
                </motion.div>
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
        className="bg-gradient-to-r from-primary-50 to-ocean-50 dark:from-primary-900/20 dark:to-ocean-900/20 rounded-2xl p-6 border border-primary-100 dark:border-primary-800/30"
      >
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-primary-500 dark:text-primary-400 mb-1">
          Notre état d&apos;esprit
        </p>
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            animate={{ rotate: [0, 20, -20, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <FiStar className="w-6 h-6 text-primary-500 dark:text-primary-400" />
          </motion.div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Nos Valeurs
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {values.map((value, index) => {
            const style = valueStyles[value.color];
            return (
              <motion.div
                key={value.label}
                initial={{ opacity: 0, y: 30, rotate: -5 }}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ delay: index * 0.2, type: "spring", stiffness: 200 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`text-center p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border ${style.border} shadow-lg cursor-default`}
              >
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ duration: 0.6 }}
                  className={`w-14 h-14 ${style.iconBg} rounded-full flex items-center justify-center mx-auto mb-3`}
                >
                  <value.icon className={`w-7 h-7 ${style.iconText}`} />
                </motion.div>
                <p className="font-semibold text-gray-900 dark:text-white">{value.label}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{value.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* CTA final : bandeau photo pleine largeur (vue aérienne de l'océan)
          pour clore la page sur une note "vitrine", plutôt que la simple
          pastille flottante précédente. */}
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
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex p-3 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20 mb-3"
          >
            <FiAnchor className="w-6 h-6 text-white" />
          </motion.div>
          <p className="text-lg sm:text-xl font-semibold text-white text-balance">
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
  );
};

export default AboutPage;
