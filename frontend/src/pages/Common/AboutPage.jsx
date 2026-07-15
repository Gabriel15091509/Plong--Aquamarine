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
  FiChevronLeft,
  FiPlay,
  FiPause,
} from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext";

const AboutPage = () => {
  const { theme } = useTheme();
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

  const stats = [
    { icon: FiCalendar, label: "Création", value: "2008", delay: 0.1 },
    {
      icon: FiMapPin,
      label: "Localisation",
      value: "Saint-Leu, La Réunion",
      delay: 0.2,
    },
    { icon: FiUsers, label: "Adhérents", value: "120", delay: 0.3 },
    { icon: FiAward, label: "Affiliation", value: "FFESM", delay: 0.4 },
  ];

  const activities = [
    {
      icon: FiAnchor,
      label: "Baptêmes",
      color: "from-blue-400 to-blue-600",
      delay: 0.1,
    },
    {
      icon: FiAward,
      label: "Formations",
      color: "from-green-400 to-green-600",
      delay: 0.2,
    },
    {
      icon: FiCompass,
      label: "Exploration",
      color: "from-purple-400 to-purple-600",
      delay: 0.3,
    },
    {
      icon: FiTrendingUp,
      label: "Sorties bateau",
      color: "from-orange-400 to-orange-600",
      delay: 0.4,
    },
    {
      icon: FiHeart,
      label: "Nettoyages",
      color: "from-red-400 to-red-600",
      delay: 0.5,
    },
  ];

  const team = [
    {
      name: "Directeur Technique",
      role: "Salarié permanent",
      count: 1,
      delay: 0.1,
    },
    { name: "Bénévoles actifs", role: "Équipe", count: 5, delay: 0.2 },
  ];

  const features = [
    {
      icon: FiDroplet,
      label: "20 blocs",
      description: "Air comprimé",
      delay: 0.1,
    },
    {
      icon: FiShield,
      label: "10 détendeurs",
      description: "Ensembles complets",
      delay: 0.2,
    },
    {
      icon: FiSun,
      label: "Combinaisons",
      description: "Toutes tailles",
      delay: 0.3,
    },
    {
      icon: FiClock,
      label: "Accessoires",
      description: "Équipement complet",
      delay: 0.4,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  const floatVariants = {
    animate: {
      y: [0, -10, 0],
      rotate: [0, 2, -2, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const waveVariants = {
    animate: {
      d: [
        "M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
        "M0,64L48,80C96,96,192,128,288,144C384,160,480,160,576,144C672,128,768,96,864,96C960,96,1056,128,1152,144C1248,160,1344,160,1392,160L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
        "M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
      ],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="space-y-8 pb-12">
      {/* En-tête avec parallax */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-ocean-800 p-8 text-white shadow-2xl"
      >
        {/* Vagues animées */}
        <div className="absolute inset-0 opacity-10">
          <svg
            className="absolute bottom-0 w-full"
            viewBox="0 0 1440 320"
            xmlns="http://www.w3.org/2000/svg"
          >
            <motion.path
              variants={waveVariants}
              animate="animate"
              fill="rgba(255,255,255,0.15)"
            />
          </svg>
        </div>

        {/* Particules flottantes */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: Math.random() * 40 + 10,
              height: Math.random() * 40 + 10,
              top: `${Math.random() * 80 + 10}%`,
              left: `${Math.random() * 80 + 10}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 20, -20, 0],
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 5 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-3 mb-4"
          >
            <motion.div
              variants={floatVariants}
              animate="animate"
              className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg"
            >
              <FiAnchor className="w-8 h-8" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-3xl md:text-4xl font-bold tracking-tight"
              >
                Aquanature Plongée
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-primary-100/90 text-lg font-light mt-1"
              >
                Club de plongée sous-marine - La Réunion
              </motion.p>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-primary-100/80 max-w-2xl text-sm md:text-base leading-relaxed"
          >
            Plongez au cœur d'une aventure humaine et océanique, où la passion
            de la mer se transmet depuis 2008.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-4 flex flex-wrap gap-3"
          >
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium flex items-center gap-1">
              <FiCalendar className="w-3 h-3" /> 2008
            </span>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium flex items-center gap-1">
              <FiUsers className="w-3 h-3" /> 120 adhérents
            </span>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium flex items-center gap-1">
              <FiAward className="w-3 h-3" /> FFESM
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Statistiques avec animation de compteur */}
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={controls}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
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
              transition={{
                delay: 0.3 + index * 0.1,
                type: "spring",
                stiffness: 200,
              }}
            >
              <stat.icon className="w-6 h-6 mx-auto text-primary-500 dark:text-primary-400 mb-2 group-hover:scale-110 transition-transform" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              {stat.value}
            </motion.p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Description avec effet de révélation */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-card p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
      >
        <div className="flex items-start gap-4">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className="p-3 bg-gradient-to-br from-primary-100 to-ocean-100 dark:from-primary-900/30 dark:to-ocean-900/30 rounded-xl flex-shrink-0"
          >
            <FiCompass className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </motion.div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Notre Histoire
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Créé en 2008 à Saint-Leu, sur la côte ouest de La Réunion,
              Aquanature Plongée est un club affilié à la Fédération Française
              d'Études et de Sports Sous-Marins (FFESM). Notre région est
              réputée pour la richesse exceptionnelle de ses fonds marins, où se
              côtoient baleines, tortues et coraux dans une eau cristalline.
            </p>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 dark:text-gray-300 leading-relaxed mt-2"
            >
              Aujourd'hui, notre club compte 120 adhérents actifs, des débutants
              (N1) aux moniteurs (N4), unis par la même passion pour l'océan et
              la transmission.
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Activités avec animations au survol */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-card p-6 border border-gray-100 dark:border-gray-700"
      >
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
              transition={{
                delay: index * 0.1,
                type: "spring",
                stiffness: 200,
              }}
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
              <motion.div
                whileHover={{ rotate: 360, scale: 1.2 }}
                transition={{ duration: 0.6 }}
              >
                <activity.icon className="w-8 h-8 mx-auto mb-2" />
              </motion.div>
              <p className="text-sm font-medium">{activity.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Équipement et Équipe avec animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-card p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
        >
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
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
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
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl"
          >
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
              Un local équipé pour accueillir tous les plongeurs
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-card p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <FiUsers className="w-5 h-5 text-primary-500" />
            </motion.div>
            Notre Équipe
          </h2>
          <div className="space-y-3">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ x: 10, scale: 1.02 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-default"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {member.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {member.role}
                  </p>
                </div>
                <motion.span
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.2, type: "spring" }}
                  className="text-2xl font-bold text-primary-500 dark:text-primary-400"
                >
                  {member.count}
                </motion.span>
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl"
          >
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center flex items-center justify-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <FiHeart className="w-4 h-4 text-green-500" />
              </motion.div>
              Une équipe passionnée au service de la plongée
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Valeurs avec animation de cartes */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="bg-gradient-to-r from-primary-50 to-ocean-50 dark:from-primary-900/20 dark:to-ocean-900/20 rounded-2xl p-6 border border-primary-100 dark:border-primary-800/30"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 mb-4"
        >
          <motion.div
            animate={{ rotate: [0, 20, -20, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <FiStar className="w-6 h-6 text-primary-500 dark:text-primary-400" />
          </motion.div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Nos Valeurs
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
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
          ].map((value, index) => (
            <motion.div
              key={value.label}
              initial={{ opacity: 0, y: 30, rotate: -5 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{
                delay: index * 0.2,
                type: "spring",
                stiffness: 200,
              }}
              viewport={{ once: true }}
              whileHover={{ y: -5, scale: 1.02 }}
              className={`text-center p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-${value.color}-100 dark:border-${value.color}-800/30 shadow-lg cursor-default`}
            >
              <motion.div
                whileHover={{ rotate: 360, scale: 1.2 }}
                transition={{ duration: 0.6 }}
                className={`w-14 h-14 bg-${value.color}-100 dark:bg-${value.color}-900/30 rounded-full flex items-center justify-center mx-auto mb-3`}
              >
                <value.icon
                  className={`w-7 h-7 text-${value.color}-600 dark:text-${value.color}-400`}
                />
              </motion.div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {value.label}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {value.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Pied de page avec animation */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center pt-4"
      >
        <motion.div
          animate={{
            scale: [1, 1.02, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-100 to-ocean-100 dark:from-primary-900/20 dark:to-ocean-900/20 rounded-full border border-primary-200 dark:border-primary-800/30"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <FiAnchor className="w-5 h-5 text-primary-500 dark:text-primary-400" />
          </motion.div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Plongez avec nous dans l'aventure Aquanature !
          </span>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <FiChevronRight className="w-5 h-5 text-primary-500 dark:text-primary-400" />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AboutPage;
