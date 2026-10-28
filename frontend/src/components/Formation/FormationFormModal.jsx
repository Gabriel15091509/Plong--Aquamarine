import React from "react";
import { FiBookOpen } from "react-icons/fi";
import FormModal from "../Common/FormModal";
import { useFormModal } from "../../hooks/useFormModal";
import FormationForm from "./FormationForm";

// Coquille de modale pour la création/édition d'une formation — calcule
// elle-même isOpen/id/close depuis l'URL (useFormModal), donc réutilisable
// telle quelle aussi bien dans FormationList.jsx (modale par-dessus la
// liste) que dans les routes "modale seule" d'App.jsx (modale par-dessus une
// AUTRE page) : aucun state/prop à faire transiter depuis l'appelant, jamais
// deux définitions des props visuelles (titre/icône/couleur/taille) à tenir
// synchronisées.
const FormationFormModal = () => {
  const modal = useFormModal("/formations");
  return (
    <FormModal
      isOpen={modal.isOpen}
      onClose={modal.close}
      title={modal.id ? "Modifier la formation" : "Nouvelle formation"}
      subtitle={
        modal.id
          ? "Mettez à jour les informations de la formation"
          : "Créez un nouveau programme de formation"
      }
      icon={FiBookOpen}
      size="xl"
      iconColor="blue"
    >
      <FormationForm />
    </FormModal>
  );
};

export default FormationFormModal;
