import React from "react";
import { FiPackage } from "react-icons/fi";
import FormModal from "../Common/FormModal";
import { useFormModal } from "../../hooks/useFormModal";
import AttributionForm from "./AttributionForm";

// Coquille de modale pour la création/édition d'une attribution — calcule
// elle-même isOpen/id/close depuis l'URL (useFormModal), donc réutilisable
// telle quelle aussi bien dans AttributionList.jsx (modale par-dessus la
// liste) que dans les routes "modale seule" d'App.jsx (modale par-dessus une
// AUTRE page, ex. MaterielDetails, SortieDetails) : aucun state/prop à faire
// transiter depuis l'appelant, jamais deux définitions des props visuelles
// (titre/icône/couleur/taille) à tenir synchronisées.
const AttributionFormModal = () => {
  const modal = useFormModal("/attributions");
  return (
    <FormModal
      isOpen={modal.isOpen}
      onClose={modal.close}
      title={modal.id ? "Modifier l'attribution" : "Nouvelle attribution"}
      subtitle={
        modal.id
          ? "Mettez à jour les informations de l'attribution"
          : "Attribuez du matériel à un adhérent pour une sortie, ou en prêt libre"
      }
      icon={FiPackage}
      size="xl"
      iconColor="blue"
    >
      <AttributionForm />
    </FormModal>
  );
};

export default AttributionFormModal;
