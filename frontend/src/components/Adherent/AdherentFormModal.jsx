import React from "react";
import { FiUserPlus } from "react-icons/fi";
import FormModal from "../Common/FormModal";
import { useFormModal } from "../../hooks/useFormModal";
import AdherentForm from "./AdherentForm";

// Coquille de modale pour la création/édition d'un adhérent — calcule
// elle-même isOpen/id/close depuis l'URL (useFormModal), donc réutilisable
// telle quelle aussi bien dans AdherentList.jsx (modale par-dessus la
// liste) que dans les routes "modale seule" d'App.jsx (modale par-dessus une
// AUTRE page, ex. UserCreatePage) : aucun state/prop à faire transiter
// depuis l'appelant, jamais deux définitions des props visuelles
// (titre/icône/couleur/taille) à tenir synchronisées.
const AdherentFormModal = () => {
  const modal = useFormModal("/adherents");
  return (
    <FormModal
      isOpen={modal.isOpen}
      onClose={modal.close}
      title={modal.id ? "Modifier l'adhérent" : "Nouvel adhérent"}
      subtitle={
        modal.id
          ? "Mettez à jour les informations de l'adhérent"
          : "Ajoutez un nouveau membre au club"
      }
      icon={FiUserPlus}
      iconColor="blue"
      size="xl"
    >
      <AdherentForm />
    </FormModal>
  );
};

export default AdherentFormModal;
