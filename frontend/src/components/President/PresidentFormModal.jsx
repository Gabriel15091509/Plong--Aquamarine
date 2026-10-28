import React from "react";
import { FiShield } from "react-icons/fi";
import FormModal from "../Common/FormModal";
import { useFormModal } from "../../hooks/useFormModal";
import PresidentForm from "./PresidentForm";

// Coquille de modale pour la création/édition d'un président — calcule
// elle-même isOpen/id/close depuis l'URL (useFormModal), donc réutilisable
// telle quelle aussi bien dans PresidentList.jsx (modale par-dessus la
// liste) que dans les routes "modale seule" d'App.jsx (modale par-dessus une
// AUTRE page, ex. UserCreatePage) : aucun state/prop à faire transiter
// depuis l'appelant, jamais deux définitions des props visuelles
// (titre/icône/couleur/taille) à tenir synchronisées.
const PresidentFormModal = () => {
  const modal = useFormModal("/presidents");
  return (
    <FormModal
      isOpen={modal.isOpen}
      onClose={modal.close}
      title={modal.id ? "Modifier le président" : "Nouveau président"}
      subtitle={
        modal.id
          ? "Mettez à jour la fiche du président"
          : "Désignez un nouveau président du club"
      }
      icon={FiShield}
      size="xl"
      iconColor="amber"
    >
      <PresidentForm />
    </FormModal>
  );
};

export default PresidentFormModal;
