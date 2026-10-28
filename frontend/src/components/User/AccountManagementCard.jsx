import React from "react";
import { FiShield, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import SectionCard from "../Common/SectionCard";
import AccountActionsMenu from "./AccountActionsMenu";

// Carte "Gestion du compte" pour les fiches Détails (Moniteur/Président/
// Trésorier/Adhérent) — statut affiché en clair + bouton engrenage
// (AccountActionsMenu.jsx, qui porte toute la logique : activer/
// désactiver, réinitialiser le mot de passe, supprimer le compte —
// changer le rôle n'y figure plus, un rôle se fixe à la création du
// compte et ne se change plus a posteriori). Ce même bouton engrenage
// est aussi posé directement sur
// les listages (voir MoniteurList.jsx/PresidentList.jsx/
// TresorierList.jsx/AdherentList.jsx), sans la carte autour.
//
// `user` : le compte déjà résolu par l'appelant
// (usersData.data.find(u => u.id === <fiche>.user_id)) — même lookup que
// la section "Informations du compte" déjà présente sur ces pages.
const AccountManagementCard = ({ user, className }) => {
  const { user: currentUser } = useAuth();

  // AccountActionsMenu rend déjà `null` dans ces mêmes cas (garde-fou
  // dupliqué ici pour ne pas afficher un badge de statut sans aucune
  // action possible en dessous, la carte entière disparaît).
  if (!user || user.id === currentUser?.id) return null;

  return (
    <SectionCard title="Gestion du compte" icon={FiShield} className={className}>
      {/* `gap-3` sans `justify-between` : le badge et le bouton d'action
          restent groupés au lieu d'être écartés aux deux bouts de la carte
          (qui peut prendre toute la largeur de la modale, voir les
          appelants) — sinon tout ce vide au milieu pour 2 petits éléments. */}
      <div className="flex items-center gap-3 p-2">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${
            user.active
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {user.active ? (
            <FiCheckCircle className="w-4 h-4" />
          ) : (
            <FiXCircle className="w-4 h-4" />
          )}
          {user.active ? "Compte actif" : "Compte inactif"}
        </span>

        <AccountActionsMenu
          user={user}
          buttonClassName="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
        />
      </div>
    </SectionCard>
  );
};

export default AccountManagementCard;
