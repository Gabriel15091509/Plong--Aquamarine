import React from "react";
import { FiDollarSign } from "react-icons/fi";
import FormModal from "../Common/FormModal";
import { useFormModal } from "../../hooks/useFormModal";
import PaiementForm from "./PaiementForm";

// Coquille de modale pour la création/édition d'un paiement — calcule
// elle-même isOpen/id/close depuis l'URL (useFormModal), donc réutilisable
// telle quelle aussi bien dans PaiementList.jsx (modale par-dessus la liste)
// que dans les routes "modale seule" d'App.jsx (modale par-dessus une AUTRE
// page) : aucun state/prop à faire transiter depuis l'appelant, jamais deux
// définitions des props visuelles (titre/icône/couleur/taille) à tenir
// synchronisées.
const PaiementFormModal = () => {
  const modal = useFormModal("/paiements");
  return (
    <FormModal
      isOpen={modal.isOpen}
      onClose={modal.close}
      title={modal.id ? "Modifier le paiement" : "Nouveau paiement"}
      subtitle={
        modal.id
          ? "Mettez à jour les informations du paiement"
          : "Enregistrez un nouveau paiement"
      }
      icon={FiDollarSign}
      size="xl"
      iconColor="blue"
    >
      <PaiementForm />
    </FormModal>
  );
};

export default PaiementFormModal;
