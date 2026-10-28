import React from "react";
import { FiUsers } from "react-icons/fi";
import FormModal from "../Common/FormModal";
import { useFormModal } from "../../hooks/useFormModal";
import InscriptionForm from "./InscriptionForm";

// Coquille de modale pour la création/édition d'une inscription — calcule
// elle-même isOpen/id/close depuis l'URL (useFormModal), donc réutilisable
// telle quelle aussi bien dans InscriptionList.jsx (modale par-dessus la
// liste) que dans les routes "modale seule" d'App.jsx (modale par-dessus une
// AUTRE page, ex. SortiesPage) : aucun state/prop à faire transiter depuis
// l'appelant, jamais deux définitions des props visuelles
// (titre/icône/couleur/taille) à tenir synchronisées.
const InscriptionFormModal = () => {
  const modal = useFormModal("/inscriptions");
  return (
    <FormModal
      isOpen={modal.isOpen}
      onClose={modal.close}
      title={modal.id ? "Modifier l'inscription" : "Nouvelle inscription"}
      subtitle={
        modal.id
          ? "Mettez à jour les informations d'inscription"
          : "Inscrivez un adhérent à une sortie"
      }
      icon={FiUsers}
      size="xl"
      iconColor="blue"
    >
      <InscriptionForm />
    </FormModal>
  );
};

export default InscriptionFormModal;
