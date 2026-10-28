import React from "react";
import { FiDollarSign } from "react-icons/fi";
import FormModal from "../Common/FormModal";
import { useFormModal } from "../../hooks/useFormModal";
import TresorierForm from "./TresorierForm";

// Coquille de modale pour la création/édition d'un trésorier — calcule
// elle-même isOpen/id/close depuis l'URL (useFormModal), donc réutilisable
// telle quelle aussi bien dans TresorierList.jsx (modale par-dessus la
// liste) que dans les routes "modale seule" d'App.jsx (modale par-dessus une
// AUTRE page, ex. UserCreatePage) : aucun state/prop à faire transiter
// depuis l'appelant, jamais deux définitions des props visuelles
// (titre/icône/couleur/taille) à tenir synchronisées.
const TresorierFormModal = () => {
  const modal = useFormModal("/tresoriers");
  return (
    <FormModal
      isOpen={modal.isOpen}
      onClose={modal.close}
      title={modal.id ? "Modifier le trésorier" : "Nouveau trésorier"}
      subtitle={
        modal.id
          ? "Mettez à jour la fiche du trésorier"
          : "Ajoutez un nouveau trésorier au club"
      }
      icon={FiDollarSign}
      size="xl"
      iconColor="emerald"
    >
      <TresorierForm />
    </FormModal>
  );
};

export default TresorierFormModal;
