import React from "react";
import { FiPackage } from "react-icons/fi";
import FormModal from "../Common/FormModal";
import { useFormModal } from "../../hooks/useFormModal";
import MaterielForm from "./MaterielForm";

// Coquille de modale pour la création/édition d'un matériel — calcule
// elle-même isOpen/id/close depuis l'URL (useFormModal), donc réutilisable
// telle quelle aussi bien dans MaterielList.jsx (modale par-dessus la liste)
// que dans les routes "modale seule" d'App.jsx (modale par-dessus une AUTRE
// page) : aucun state/prop à faire transiter depuis l'appelant, jamais deux
// définitions des props visuelles (titre/icône/couleur/taille) à tenir
// synchronisées.
const MaterielFormModal = () => {
  const modal = useFormModal("/materiels");
  return (
    <FormModal
      isOpen={modal.isOpen}
      onClose={modal.close}
      title={modal.id ? "Modifier le matériel" : "Nouveau matériel"}
      subtitle={
        modal.id
          ? "Mettez à jour les informations du matériel"
          : "Ajoutez un nouvel équipement"
      }
      icon={FiPackage}
      size="xl"
      iconColor="blue"
    >
      <MaterielForm />
    </FormModal>
  );
};

export default MaterielFormModal;
