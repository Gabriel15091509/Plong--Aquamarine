import React from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiMail, FiUser, FiClock, FiSend, FiExternalLink } from "react-icons/fi";
import { formatDateTime } from "../../utils/helpers";
import { useAlertes } from "../../hooks/Alerte/useAlertes";
import { useAuth } from "../../context/AuthContext";

const ALERT_DESCRIPTIONS = {
  "Certificat expiré": "Le certificat médical a expiré",
  "Certificat expire bientot": "Le certificat médical expire dans moins de 30 jours",
  "Adhésion expirée": "L'adhésion est arrivée à expiration",
  "Adhesion expire bientot": "L'adhésion expire dans moins de 30 jours",
  "Paiement en retard": "Un paiement est en attente",
  Formation: "Une formation est disponible",
  "Materiel en retard": "Du matériel emprunté n'a pas été retourné à temps",
  "Inactivite plongee": "Aucune plongée enregistrée depuis longtemps",
};

const AlerteDetailsModal = ({ alerte, onClose }) => {
  const { useRelancer } = useAlertes();
  const relancer = useRelancer();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!alerte) return null;

  const nom = alerte.adherent_nom || alerte.num_adherent;
  const description = ALERT_DESCRIPTIONS[alerte.type] || alerte.type;
  // La relance par email est une action de gestion (président/moniteur/
  // trésorier) : un adhérent qui ouvre sa propre alerte n'a pas à se
  // relancer lui-même.
  const canRelancer = user?.role !== "adherent";

  const handleVoirFiche = () => {
    onClose();
    if (alerte.type === "Materiel en retard") {
      // Direct vers la section "matériel attribué" plutôt que le haut de
      // la fiche : c'est le prêt en retard qu'on veut voir, pas la fiche
      // dans sa globalité. Un adhérent ouvrant sa propre alerte n'a pas de
      // fiche /adherents/:id (réservée au staff) — direction "Mon profil".
      const target =
        user?.role === "adherent" ? "/profile" : `/adherents/${alerte.num_adherent}`;
      navigate(`${target}#materiel-attribue`);
      return;
    }
    navigate(`/adherents/${alerte.num_adherent}`);
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
                Relancer par email
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
};

export default AlerteDetailsModal;
