import React from "react";
import { motion } from "framer-motion";
import {
  FiShield,
  FiDatabase,
  FiClock,
  FiLock,
  FiUserCheck,
  FiMail,
} from "react-icons/fi";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

const Section = ({ icon: Icon, title, children }) => (
  <motion.div
    variants={fadeInUp}
    initial="initial"
    animate="animate"
    className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-100/80 dark:border-gray-800/80"
  >
    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
      <span className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 text-cyan-600 dark:text-cyan-400">
        <Icon className="w-5 h-5" />
      </span>
      {title}
    </h2>
    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-3 leading-relaxed">
      {children}
    </div>
  </motion.div>
);

const PrivacyPolicyPage = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <motion.div variants={fadeInUp} initial="initial" animate="animate">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Politique de confidentialité
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Traitement des données personnelles des adhérents du club de
          plongée — conforme au RGPD.
        </p>
      </motion.div>

      <Section icon={FiUserCheck} title="Responsable du traitement">
        <p>
          Le club de plongée (association loi 1901, Saint-Leu) est
          responsable du traitement des données collectées via cette
          application, utilisée pour la gestion de ses adhérents, sorties,
          formations et paiements.
        </p>
      </Section>

      <Section icon={FiDatabase} title="Données collectées et finalités">
        <p>Les données traitées se limitent à ce qui est nécessaire à :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Identité et contact</strong> (nom, prénom, email,
            téléphone, adresse) — gestion des comptes et communication avec
            les adhérents.
          </li>
          <li>
            <strong>Certificat médical</strong> — vérification de l’aptitude
            à la plongée, conservé chiffré et jamais consultable sans
            authentification.
          </li>
          <li>
            <strong>Historique des sorties et plongées</strong> — carnet de
            plongée, sécurité (palanquées, incidents).
          </li>
          <li>
            <strong>Paiements</strong> (cotisation, formation, sortie) —
            suivi comptable de l’association.
          </li>
        </ul>
      </Section>

      <Section icon={FiClock} title="Durée de conservation">
        <p>
          Les données sont conservées pendant <strong>5 ans</strong>, durée
          couvrant l’historique nécessaire au suivi d’un adhérent (niveaux,
          plongées, obligations comptables). Une sauvegarde quotidienne
          chiffrée de la base est effectuée automatiquement ; elle sert à la
          continuité du service, pas à prolonger cette durée de conservation.
        </p>
      </Section>

      <Section icon={FiLock} title="Sécurité">
        <ul className="list-disc pl-5 space-y-1">
          <li>Mots de passe hachés, jamais stockés en clair.</li>
          <li>
            Authentification renforcée (code à usage unique par email) pour
            les comptes présidents.
          </li>
          <li>Certificats médicaux chiffrés au repos (AES-256).</li>
          <li>
            Déconnexion automatique après 15 minutes d’inactivité.
          </li>
        </ul>
      </Section>

      <Section icon={FiShield} title="Vos droits">
        <p>
          Conformément au RGPD, vous disposez d’un droit d’accès, de
          rectification et d’effacement de vos données :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Accès / portabilité</strong> : téléchargez un export de
            vos données depuis votre page{" "}
            <a href="/profile" className="text-blue-600 dark:text-blue-400 hover:underline">
              Mon profil
            </a>
            .
          </li>
          <li>
            <strong>Rectification</strong> : modifiez vos informations
            directement depuis votre profil, ou demandez au président de le
            faire.
          </li>
          <li>
            <strong>Effacement</strong> : la suppression d’un compte
            anonymise vos données identifiantes (nom, email, téléphone,
            adresse) ; l’historique comptable et de sécurité du club (déjà
            dépersonnalisé) est conservé.
          </li>
        </ul>
      </Section>

      <Section icon={FiMail} title="Contact">
        <p>
          Pour toute question relative à vos données personnelles, contactez
          le président du club depuis l’application.
        </p>
      </Section>
    </div>
  );
};

export default PrivacyPolicyPage;
