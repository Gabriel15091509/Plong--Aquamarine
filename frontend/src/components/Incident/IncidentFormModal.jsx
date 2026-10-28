import React from "react";
import { FiAlertTriangle } from "react-icons/fi";
import FormModal from "../Common/FormModal";
import { useFormModal } from "../../hooks/useFormModal";
import IncidentForm from "./IncidentForm";

// Coquille de modale pour la déclaration/édition d'un incident — calcule
// elle-même isOpen/id/close depuis l'URL (useFormModal), donc réutilisable
// telle quelle aussi bien dans IncidentList.jsx (modale par-dessus la liste)
// que dans les routes "modale seule" d'App.jsx (modale par-dessus une AUTRE
// page, ex. SortieDetails) : aucun state/prop à faire transiter depuis
// l'appelant, jamais deux définitions des props visuelles
// (titre/icône/couleur/taille) à tenir synchronisées.
const IncidentFormModal = () => {
  const modal = useFormModal("/incidents");
  return (
    <FormModal
      isOpen={modal.isOpen}
      onClose={modal.close}
      title={modal.id ? "Modifier l'incident" : "Déclarer un incident"}
      subtitle={
        modal.id
          ? "Mettez à jour les informations de l'incident"
          : "Signalez un incident survenu lors d'une sortie"
      }
      icon={FiAlertTriangle}
      size="xl"
      iconColor="red"
    >
      <IncidentForm />
    </FormModal>
  );
};

export default IncidentFormModal;
