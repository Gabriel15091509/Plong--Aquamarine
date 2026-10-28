import React from "react";
import { FiBookOpen } from "react-icons/fi";
import FormModal from "../Common/FormModal";
import { useFormModal } from "../../hooks/useFormModal";
import SpecialiteFormationForm from "./SpecialiteFormationForm";

// Coquille de modale pour la création/édition d'une spécialité de
// formation — calcule elle-même isOpen/id/close depuis l'URL (useFormModal),
// donc réutilisable telle quelle aussi bien dans SpecialiteFormationList.jsx
// (modale par-dessus la liste) que dans les routes "modale seule" d'App.jsx :
// aucun state/prop à faire transiter depuis l'appelant, jamais deux
// définitions des props visuelles (titre/icône/couleur/taille) à tenir
// synchronisées.
const SpecialiteFormationFormModal = () => {
  const modal = useFormModal("/specialites-formation");
  return (
    <FormModal
      isOpen={modal.isOpen}
      onClose={modal.close}
      title={modal.id ? "Modifier la spécialité" : "Nouvelle spécialité"}
      subtitle={
        modal.id
          ? "Mettez à jour cette formation de spécialité"
          : "Inscrivez un adhérent à une formation de spécialité"
      }
      icon={FiBookOpen}
      size="xl"
      iconColor="blue"
    >
      <SpecialiteFormationForm />
    </FormModal>
  );
};

export default SpecialiteFormationFormModal;
