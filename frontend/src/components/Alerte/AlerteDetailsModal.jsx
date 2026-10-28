import React from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiMail, FiUser, FiClock, FiSend, FiExternalLink, FiMessageSquare } from "react-icons/fi";
import { formatDateTime } from "../../utils/helpers";
import { useAlertes } from "../../hooks/Alerte/useAlertes";
import { useAuth } from "../../context/AuthContext";
import { useModalNavigate } from "../../hooks/useModalNavigate";

const ALERT_DESCRIPTIONS = {
  "Certificat expiré": "Le certificat médical a expiré",
  "Certificat expire bientot": "Le certificat médical expire dans moins de 30 jours",
  "Adhésion expirée": "L'adhésion est arrivée à expiration",
  "Adhesion expire bientot": "L'adhésion expire dans moins de 30 jours",
  "Paiement en retard": "Un paiement est en attente",
  Formation: "Une formation est disponible",
  "Materiel en retard": "Du matériel emprunté n'a pas été retourné à temps",
  "Inactivite plongee": "Aucune plongée enregistrée depuis longtemps",
  "Sortie modifiée": "Une sortie où vous êtes inscrit(e) a été modifiée",
};

const AlerteDetailsModal = ({ alerte, onClose }) => {
  const { useRelancer, useRelancerSms } = useAlertes();
  const relancer = useRelancer();
  const relancerSms = useRelancerSms();
  const { user } = useAuth();
  const navigate = useNavigate();
  // Cette modale (portée sur document.body, hors de l'arbre de routes — voir
  // NotificationsPage.jsx/Header.jsx) peut être ouverte depuis N'IMPORTE
  // QUELLE page de l'appli. Un simple navigate() vers une fiche qui s'ouvre
  // normalement EN MODALE (sorties/:id, adherents/:id, inscriptions/:id —
  // voir les routes "modale seule" de App.jsx) écraserait alors la page
  // d'origine au lieu de garder cette fiche par-dessus (voir ModalLink.jsx) :
  // modalNavigate pose le state.backgroundLocation attendu. /profile n'est
  // PAS une de ces routes modale (page à part entière) — reste sur
  // `navigate` normal, ci-dessous.
  const modalNavigate = useModalNavigate();

  if (!alerte) return null;

  const nom = alerte.adherent_nom || alerte.num_adherent;
  const description = ALERT_DESCRIPTIONS[alerte.type] || alerte.type;
  // La relance par email est une action de gestion (président/moniteur/
  // trésorier) : un adhérent qui ouvre sa propre alerte n'a pas à se
  // relancer lui-même.
  const canRelancer = user?.role !== "adherent";

  // "Voir plus de détails" mène directement à la section concernée par
  // l'alerte, selon son type — jamais à une fiche adhérent générique :
  //  - Certificat / Adhésion : la fiche de la ligne source précise quand
  //    l'alerte la référence (reference_type/reference_id, posés par
  //    AlerteService.syncExpirationAlertes), sinon la liste correspondante.
  //  - Paiement en retard : la section Paiements de la fiche de l'adhérent.
  //  - Formation : la liste des formations.
  //  - Matériel en retard : la section "matériel attribué".
  //  - Inactivité plongée : les plongées de l'adhérent (son carnet).
  //  - Sortie modifiée : la sortie, ou l'inscription à reconfirmer.
  // Fiches qui s'ouvrent en modale par-dessus la page d'origine
  // (modalNavigate, voir plus haut) vs pages entières (navigate).
  const handleVoirFiche = () => {
    onClose();
    const isAdherent = user?.role === "adherent";
    const refId = alerte.reference_id;

    switch (alerte.type) {
      case "Certificat expiré":
      case "Certificat expire bientot":
        if (refId && alerte.reference_type === "CertificatMedical") {
          modalNavigate(`/certificats/${refId}`);
        } else {
          navigate("/certificats");
        }
        return;

      case "Adhésion expirée":
      case "Adhesion expire bientot":
        if (refId && alerte.reference_type === "Adhesion") {
          modalNavigate(`/adhesions/${refId}`);
        } else {
          navigate("/adhesions");
        }
        return;

      case "Paiement en retard":
        // Section "Paiements" de la fiche adhérent (page "Dossier complet",
        // même mécanisme que #materiel-attribue). Un adhérent n'a pas de
        // fiche /adherents/:id (réservée au staff) : sa propre liste de
        // paiements.
        if (isAdherent) {
          navigate("/paiements");
        } else {
          modalNavigate(`/adherents/${alerte.num_adherent}#paiements`);
        }
        return;

      case "Formation":
        navigate("/formations");
        return;

      case "Materiel en retard":
        // Direct vers la section "matériel attribué" plutôt que le haut de
        // la fiche : c'est le prêt en retard qu'on veut voir. Un adhérent
        // n'a pas de fiche /adherents/:id (réservée au staff) — direction
        // "Mon profil" (page à part entière : navigate normal).
        if (isAdherent) {
          navigate("/profile#materiel-attribue");
        } else {
          modalNavigate(`/adherents/${alerte.num_adherent}#materiel-attribue`);
        }
        return;

      case "Inactivite plongee":
        if (isAdherent) {
          navigate("/plongees?filtre=mes-plongees");
        } else {
          modalNavigate(`/adherents/${alerte.num_adherent}`);
        }
        return;

      case "Sortie modifiée":
        // C'est la sortie modifiée qu'on veut voir (SortieService.
        // notifierModificationSortie pose reference_type="Sortie"/
        // reference_id=id_sortie) — accessible aussi à l'adhérent. Cas
        // particulier : reconfirmation attendue après une replanification
        // météo (reference_type="Inscription") — direction la fiche
        // inscription, où se trouve le bouton "Reconfirmer".
        if (refId) {
          modalNavigate(
            alerte.reference_type === "Inscription"
              ? `/inscriptions/${refId}`
              : `/sorties/${refId}`,
          );
          return;
        }
        navigate("/sorties");
        return;

      default:
        if (isAdherent) navigate("/profile");
        else modalNavigate(`/adherents/${alerte.num_adherent}`);
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-white">
              Détail de l&apos;alerte
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiX className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                Type
              </p>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                {alerte.type}
                {alerte.detail && (
                  <span className="font-normal text-gray-500 dark:text-gray-400">
                    {" "}
                    · {alerte.detail}
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {description}
              </p>
            </div>

            <div className="flex items-start gap-2">
              <FiUser className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">
                  Concerné
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{nom}</p>
                {alerte.adherent_email && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {alerte.adherent_email}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <FiClock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">
                  Dernier envoi
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {formatDateTime(alerte.date_envoi)} · {alerte.canal} ·{" "}
                  {alerte.statut}
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center gap-2">
            <button
              onClick={handleVoirFiche}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-xl transition-colors"
            >
              <FiExternalLink className="w-4 h-4" />
              Voir plus de détails
            </button>

            {canRelancer && (
              <div className="flex gap-2">
                <button
                  onClick={() => relancer.mutate(alerte.id_alerte)}
                  disabled={relancer.isPending || !alerte.adherent_email}
                  title={
                    !alerte.adherent_email
                      ? "Adresse email de l'adhérent introuvable"
                      : undefined
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
                >
                  {relancer.isPending ? (
                    <FiSend className="w-4 h-4 animate-pulse" />
                  ) : (
                    <FiMail className="w-4 h-4" />
                  )}
                  Email
                </button>
                <button
                  onClick={() => relancerSms.mutate(alerte.id_alerte)}
                  disabled={relancerSms.isPending || !alerte.adherent_telephone}
                  title={
                    !alerte.adherent_telephone
                      ? "Numéro de téléphone de l'adhérent introuvable"
                      : undefined
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200 text-sm font-medium rounded-xl transition-colors"
                >
                  {relancerSms.isPending ? (
                    <FiSend className="w-4 h-4 animate-pulse" />
                  ) : (
                    <FiMessageSquare className="w-4 h-4" />
                  )}
                  SMS
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
};

export default AlerteDetailsModal;
