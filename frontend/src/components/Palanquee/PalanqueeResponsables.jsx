import React from "react";

// Bloc "qui est responsable" d'une palanquée (moniteur encadrant, guide,
// secouriste) — lecture seule, réutilisé par PlongeeDetails.jsx (fiche d'une
// plongée individuelle) et MaPalanqueeCard.jsx (fiche sortie, vue adhérent).
// `palanquee` attend `.moniteur_encadrant`, `.id_guide_palanquee`,
// `.id_secouriste` et `.composers[].adherent` déjà enrichis côté backend
// (voir PalanqueeService.getBySortie / PlongeeService.getPlongeeWithDetails
// + utils/enrichAdherents.withMoniteurEncadrant).
const PalanqueeResponsables = ({ palanquee }) => {
  const composers = palanquee.composers || [];
  const guide = composers.find((c) => c.num_adherent === palanquee.id_guide_palanquee);
  const secouriste = composers.find((c) => c.num_adherent === palanquee.id_secouriste);

  const nomAdherent = (membre) =>
    membre?.adherent ? `${membre.adherent.nom} ${membre.adherent.prenom}` : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Moniteur encadrant
        </p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
          {palanquee.moniteur_encadrant?.name || "Non assigné"}
        </p>
      </div>
      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Guide de palanquée
        </p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
          {nomAdherent(guide) || "Non désigné"}
        </p>
      </div>
      <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Secouriste
        </p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
          {nomAdherent(secouriste) || "Non désigné"}
        </p>
      </div>
    </div>
  );
};

export default PalanqueeResponsables;
