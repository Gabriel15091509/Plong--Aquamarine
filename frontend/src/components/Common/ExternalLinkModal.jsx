import React from "react";
import { motion } from "framer-motion";
import { FiX, FiExternalLink } from "react-icons/fi";
import ModalOverlay from "./ModalOverlay";

// Aperçu d'un lien externe quelconque (ex. lien_photos de PlongeeDetails.jsx,
// une URL collée par le moniteur vers un album Google Photos/Drive, Facebook...)
// dans une iframe plutôt qu'un `target="_blank"` qui quitte l'app.
//
// Contrairement à PdfPreviewModal, l'URL n'est pas un blob qu'on contrôle :
// c'est un lien tiers arbitraire, et de nombreux hébergeurs de photos
// (Google Photos, Facebook...) renvoient X-Frame-Options/CSP frame-ancestors
// refusant l'affichage en iframe — sans qu'on puisse fiablement détecter cet
// échec depuis une iframe cross-origin (onLoad se déclenche même quand le
// contenu est bloqué). Le bouton "Ouvrir dans un nouvel onglet" reste donc
// toujours visible à côté de l'aperçu, jamais relégué à un état d'erreur.
const ExternalLinkModal = ({ isOpen, onClose, url, title = "Aperçu" }) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 25 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-4xl h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate pr-4">
            {title}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-colors"
            >
              <FiExternalLink className="w-4 h-4" />
              Ouvrir dans un nouvel onglet
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              aria-label="Fermer l'aperçu"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Note discrète : certains hébergeurs (Google Photos, Facebook...)
            bloquent l'affichage en iframe — le bouton ci-dessus reste le
            recours si rien ne s'affiche ci-dessous. */}
        <p className="px-5 py-2 text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800 shrink-0">
          Si l&apos;aperçu ne s&apos;affiche pas, ouvrez le lien dans un nouvel onglet.
        </p>
        <iframe src={url} title={title} className="flex-1 w-full bg-gray-100 dark:bg-gray-800" />
      </motion.div>
    </ModalOverlay>
  );
};

export default ExternalLinkModal;
