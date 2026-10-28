import React from "react";
import { FiCreditCard } from "react-icons/fi";
import FormModal from "../Common/FormModal";
import { useFormModal } from "../../hooks/useFormModal";
import { useAuth } from "../../context/AuthContext";
import AdhesionForm from "./AdhesionForm";

// Coquille de modale pour la création/édition d'une adhésion — calcule
// elle-même isOpen/id/close depuis l'URL (useFormModal) et le rôle
// (canManageAdhesion, même règle que AdhesionList.jsx : hasRole(["president",
// "tresorier"])) pour choisir le bon titre — donc réutilisable telle quelle
// aussi bien dans AdhesionList.jsx (modale par-dessus la liste) que dans les
// routes "modale seule" d'App.jsx (modale par-dessus une AUTRE page) : aucun
// state/prop à faire transiter depuis l'appelant, jamais deux définitions
// des props visuelles (titre/icône/couleur/taille) à tenir synchronisées.
const AdhesionFormModal = () => {
  const modal = useFormModal("/adhesions");
  const { hasRole } = useAuth();
  const canManageAdhesion = hasRole(["president", "tresorier"]);
  return (
    <FormModal
      isOpen={modal.isOpen}
      onClose={modal.close}
      title={
        modal.id
          ? "Modifier l'adhésion"
          : canManageAdhesion
            ? "Nouvelle adhésion"
            : "Soumettre ma licence / assurance"
      }
      subtitle={
        modal.id
          ? "Mettez à jour les informations d'adhésion"
          : canManageAdhesion
            ? "Ajoutez une nouvelle adhésion au club"
            : "En attente de validation par le président/trésorier avant d'être prise en compte."
      }
      icon={FiCreditCard}
      size="xl"
      iconColor="blue"
    >
      <AdhesionForm />
    </FormModal>
  );
};

export default AdhesionFormModal;
