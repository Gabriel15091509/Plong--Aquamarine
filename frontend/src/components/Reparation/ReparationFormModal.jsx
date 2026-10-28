import React from "react";
import { FiTool } from "react-icons/fi";
import FormModal from "../Common/FormModal";
import { useFormModal } from "../../hooks/useFormModal";
import ReparationForm from "./ReparationForm";

// Coquille de modale pour la création/édition d'une réparation — calcule
// elle-même isOpen/id/close depuis l'URL (useFormModal), donc réutilisable
// telle quelle aussi bien dans ReparationList.jsx (modale par-dessus la
// liste) que dans les routes "modale seule" d'App.jsx (modale par-dessus une
// AUTRE page, ex. MaterielDetails) : aucun state/prop à faire transiter
// depuis l'appelant, jamais deux définitions des props visuelles
// (titre/icône/couleur/taille) à tenir synchronisées.
const ReparationFormModal = () => {
  const modal = useFormModal("/reparations");
  return (
    <FormModal
      isOpen={modal.isOpen}
      onClose={modal.close}
      title={modal.id ? "Modifier la réparation" : "Nouvelle réparation"}
      subtitle={
        modal.id
          ? "Mettez à jour les informations de la réparation"
          : "Déclarez une panne et suivez sa réparation"
      }
      icon={FiTool}
      size="xl"
      iconColor="orange"
    >
      <ReparationForm />
    </FormModal>
  );
};

export default ReparationFormModal;
