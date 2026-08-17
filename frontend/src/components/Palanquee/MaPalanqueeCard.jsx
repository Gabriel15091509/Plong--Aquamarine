import React from "react";
import { FiUsers } from "react-icons/fi";
import { usePalanquees } from "../../hooks/Palanquee/usePalanquees";
import SectionCard from "../Common/SectionCard";
import LoadingSpinner from "../Common/LoadingSpinner";
import PalanqueeResponsables from "./PalanqueeResponsables";

// Vue adhérent, en lecture seule, de sa propre palanquée pour cette sortie.
// Pendant du PalanqueesManager (staff), mais sans aucune action de gestion —
// aucun filtrage à faire ici : PalanqueeService.getBySortie ne renvoie déjà
// que la ou les palanquées dont l'adhérent connecté est membre
// (filterForAdherent), donc si le tableau est vide c'est qu'aucune
// palanquée n'a encore été constituée pour lui (généralement fait au
// pointage de présence, le jour de la sortie) — pas une erreur, on
// n'affiche simplement rien.
const MaPalanqueeCard = ({ idSortie }) => {
  const { useGetBySortie } = usePalanquees();
  const { data, isLoading } = useGetBySortie(idSortie);
  const palanquees = data?.data || [];

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6">
        <LoadingSpinner variant="list" />
      </div>
    );
  }

  if (palanquees.length === 0) return null;

  return (
    <div className="space-y-4">
      {palanquees.map((palanquee) => (
        <SectionCard
          key={palanquee.id_palanquee}
          title={`Ma palanquée : ${palanquee.nom_palanquee}`}
          icon={FiUsers}
        >
          <PalanqueeResponsables palanquee={palanquee} />

          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            Membres
          </p>
          <div className="flex flex-wrap gap-2">
            {(palanquee.composers || []).map((membre) => (
              <span
                key={membre.num_adherent}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
              >
                {membre.adherent
                  ? `${membre.adherent.nom} ${membre.adherent.prenom}`
                  : `#${membre.num_adherent}`}
                {membre.num_adherent === palanquee.id_guide_palanquee && " · Guide"}
                {membre.num_adherent === palanquee.id_secouriste && " · Secouriste"}
              </span>
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  );
};

export default MaPalanqueeCard;
