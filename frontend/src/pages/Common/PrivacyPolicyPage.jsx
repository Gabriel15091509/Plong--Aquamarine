import React from "react";
import {
  FiShield,
  FiDatabase,
  FiClock,
  FiLock,
  FiUserCheck,
  FiMail,
  FiCheckCircle,
  FiShare2,
  FiHardDrive,
} from "react-icons/fi";
import Breadcrumb from "../../components/Common/Breadcrumb";

// break-inside-avoid : une carte ne se coupe pas entre deux colonnes.
const Section = ({ icon: Icon, title, children }) => (
  <section className="break-inside-avoid mb-4 bg-white dark:bg-gray-900 rounded-xl p-5 sm:p-6 border border-gray-200 dark:border-gray-800">
    <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-3">
      <span className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400">
        <Icon className="w-5 h-5" />
      </span>
      {title}
    </h2>
    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-3 leading-relaxed">
      {children}
    </div>
  </section>
);

const PrivacyPolicyPage = () => {
  return (
    <div className="pb-10">
      <Breadcrumb current="Confidentialité" />

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Politique de confidentialité
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Traitement des données personnelles des adhérents du club de plongée —
          conforme au RGPD.
        </p>
      </div>

      {/* Pleine largeur : 1 colonne sur mobile/tablette, 2 dès lg (les
          cartes s'enchaînent dans l'ordre de lecture, colonne après
          colonne). */}
      <div className="lg:columns-2 lg:gap-4">
        <Section icon={FiUserCheck} title="Responsable du traitement">
          <p>
            Le club de plongée (association loi 1901, Saint-Leu) est responsable
            du traitement des données collectées via cette application, utilisée
            pour la gestion de ses adhérents, sorties, formations et paiements.
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
              <strong>Certificat médical</strong> — vérification de l’aptitude à
              la plongée, conservé chiffré et jamais consultable sans
              authentification.
            </li>
            <li>
              <strong>Historique des sorties et plongées</strong> — carnet de
              plongée, sécurité (palanquées, incidents).
            </li>
            <li>
              <strong>Paiements</strong> (cotisation, formation, sortie) — suivi
              comptable de l’association.
            </li>
          </ul>
        </Section>

        <Section icon={FiCheckCircle} title="Base légale du traitement">
          <p>Selon les données concernées, le traitement repose sur :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>L’exécution du contrat d’adhésion</strong> : identité,
              cotisation, inscriptions aux sorties et formations.
            </li>
            <li>
              <strong>Une obligation légale</strong> : conservation du
              certificat médical d’aptitude à la plongée, exigée par la
              réglementation FFESM encadrant la pratique en club.
            </li>
            <li>
              <strong>Votre consentement</strong> : communications optionnelles
              (ex. e-mails groupés envoyés depuis « Communication ciblée »), que
              vous pouvez retirer à tout moment.
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

        <Section icon={FiShare2} title="Destinataires des données">
          <p>
            Vos données ne sont accessibles qu’au personnel habilité du club
            (président, moniteurs, trésorier), selon ce que leur rôle nécessite,
            et ne sont jamais vendues ni cédées à des fins commerciales.
            Quelques prestataires techniques y accèdent, dans la seule mesure
            nécessaire au fonctionnement du service :
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Cloudflare R2</strong> — hébergement des documents et
              photos que vous envoyez (licence FFESM, certificat médical, photos
              de sortie).
            </li>
            <li>
              <strong>Gmail (Google)</strong> — envoi des e-mails de
              l’application (confirmations, notifications, communications du
              club).
            </li>
            <li>
              <strong>Groq</strong> — lecture automatique d’une licence FFESM ou
              d’une attestation d’assurance que vous soumettez vous-même, pour
              pré-remplir le formulaire ; seule la photo du document est
              transmise, jamais conservée par ce prestataire.
            </li>
            <li>
              <strong>Open-Meteo</strong> — prévisions météo des sorties ;
              seules les coordonnées du site de plongée sont transmises, aucune
              donnée personnelle.
            </li>
          </ul>
        </Section>

        <Section icon={FiLock} title="Sécurité">
          <ul className="list-disc pl-5 space-y-1">
            <li>Mots de passe hachés, jamais stockés en clair.</li>
            <li>
              Authentification renforcée (code à usage unique par email) pour
              les comptes présidents.
            </li>
            <li>Certificats médicaux chiffrés au repos (AES-256).</li>
            <li>Déconnexion automatique après 15 minutes d’inactivité.</li>
          </ul>
        </Section>

        <Section icon={FiHardDrive} title="Cookies et traceurs">
          <p>
            L’application n’utilise aucun cookie publicitaire ou de suivi. Seul
            le stockage local de votre navigateur (localStorage) conserve votre
            session de connexion ; il est supprimé en vous déconnectant ou en
            vidant les données de navigation.
          </p>
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
              <a
                href="/profile"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
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
              <strong>Effacement</strong> : la suppression d’un compte anonymise
              vos données identifiantes (nom, email, téléphone, adresse) ;
              l’historique comptable et de sécurité du club (déjà
              dépersonnalisé) est conservé.
            </li>
            <li>
              <strong>Opposition / limitation</strong> : vous pouvez vous
              opposer aux communications optionnelles (désinscription possible
              depuis votre profil) ou demander la limitation d’un traitement en
              contactant le président.
            </li>
            <li>
              <strong>Réclamation</strong> : si vous estimez que vos droits ne
              sont pas respectés, vous pouvez saisir la CNIL (
              <a
                href="https://www.cnil.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                cnil.fr
              </a>
              ).
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
    </div>
  );
};

export default PrivacyPolicyPage;
