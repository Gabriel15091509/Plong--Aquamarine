import React from "react";
import { motion } from "framer-motion";
import { FiX, FiDownload } from "react-icons/fi";
import ModalOverlay from "./ModalOverlay";

// Aperçu d'un PDF déjà récupéré en Blob (voir fetchPdfBlobUrl) — l'appelant
// reste propriétaire du blobUrl et doit le révoquer (window.URL.revokeObjectURL)
// à la fermeture pour ne pas fuiter de mémoire.
const PdfPreviewModal = ({ isOpen, onClose, blobUrl, filename }) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename || "document.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

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
            {filename}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-colors"
            >
              <FiDownload className="w-4 h-4" />
              Télécharger
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              aria-label="Fermer l'aperçu"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
        <iframe src={blobUrl} title={filename} className="flex-1 w-full bg-gray-100 dark:bg-gray-800" />
      </motion.div>
    </ModalOverlay>
  );
};

export default PdfPreviewModal;
