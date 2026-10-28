import React from "react";
import { FiMapPin } from "react-icons/fi";
import FormModal from "../Common/FormModal";
import { useFormModal } from "../../hooks/useFormModal";
import SortieForm from "./SortieForm";

// Coquille de modale pour la création/édition d'une sortie — calcule
// elle-même isOpen/id/close depuis l'URL (useFormModal), donc réutilisable
// telle quelle aussi bien dans SortiesPage.jsx (modale par-dessus la liste)
// que dans les routes "modale seule" d'App.jsx (modale par-dessus une AUTRE
// page, ex. SortieDetails) : aucun state/prop à faire transiter depuis
// l'appelant, jamais deux définitions des props visuelles
// (titre/icône/couleur/taille) à tenir synchronisées.
const SortieFormModal = () => {
  const modal = useFormModal("/sorties");
  return (
    <FormModal
      isOpen={modal.isOpen}
      onClose={modal.close}
      title={modal.id ? "Modifier la sortie" : "Nouvelle sortie"}
      subtitle={
        modal.id
          ? "Mettez à jour les informations de la sortie"
          : "Planifiez une nouvelle sortie de plongée"
      }
      icon={FiMapPin}
      iconColor="blue"
      size="xl"
    >
      <SortieForm />
    </FormModal>
  );
};

export default SortieFormModal;
