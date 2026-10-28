import React from "react";
import { FiActivity } from "react-icons/fi";
import FormModal from "../Common/FormModal";
import { useFormModal } from "../../hooks/useFormModal";
import PlongeeForm from "./PlongeeForm";

// Coquille de modale pour la création/édition d'une plongée — calcule
// elle-même isOpen/id/close depuis l'URL (useFormModal), donc réutilisable
// telle quelle aussi bien dans PlongeeList.jsx (modale par-dessus la liste)
// que dans les routes "modale seule" d'App.jsx (modale par-dessus une AUTRE
// page, ex. PlongeeDetails) : aucun state/prop à faire transiter depuis
// l'appelant, jamais deux définitions des props visuelles
// (titre/icône/couleur/taille) à tenir synchronisées.
const PlongeeFormModal = () => {
  const modal = useFormModal("/plongees");
  return (
    <FormModal
      isOpen={modal.isOpen}
      onClose={modal.close}
      title={modal.id ? "Modifier la plongée" : "Nouvelle plongée"}
      subtitle={
        modal.id
          ? "Mettez à jour les informations de la plongée"
          : "Enregistrez une nouvelle plongée"
      }
      icon={FiActivity}
      size="xl"
      iconColor="blue"
    >
      <PlongeeForm />
    </FormModal>
  );
};

export default PlongeeFormModal;
