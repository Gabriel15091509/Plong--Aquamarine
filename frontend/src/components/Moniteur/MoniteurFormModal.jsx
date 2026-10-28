import React from "react";
import { FiAward } from "react-icons/fi";
import FormModal from "../Common/FormModal";
import { useFormModal } from "../../hooks/useFormModal";
import MoniteurForm from "./MoniteurForm";

// Coquille de modale pour la création/édition d'un moniteur — calcule
// elle-même isOpen/id/close depuis l'URL (useFormModal), donc réutilisable
// telle quelle aussi bien dans MoniteurList.jsx (modale par-dessus la liste)
// que dans les routes "modale seule" d'App.jsx (modale par-dessus une AUTRE
// page, ex. UserCreatePage) : aucun state/prop à faire transiter depuis
// l'appelant, jamais deux définitions des props visuelles
// (titre/icône/couleur/taille) à tenir synchronisées.
const MoniteurFormModal = () => {
  const modal = useFormModal("/moniteurs");
  return (
    <FormModal
      isOpen={modal.isOpen}
      onClose={modal.close}
      title={modal.id ? "Modifier le moniteur" : "Nouveau moniteur"}
      subtitle={
        modal.id
          ? "Mettez à jour la fiche du moniteur"
          : "Ajoutez un nouveau moniteur au club"
      }
      icon={FiAward}
      size="xl"
      iconColor="blue"
    >
      <MoniteurForm />
    </FormModal>
  );
};

export default MoniteurFormModal;
