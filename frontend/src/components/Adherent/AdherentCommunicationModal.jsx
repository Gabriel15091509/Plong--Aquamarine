import React from "react";
import { useLocation } from "react-router-dom";
import { FiSend } from "react-icons/fi";
import FormModal from "../Common/FormModal";
import { useCloseFormModal } from "../../hooks/useFormModal";
import CommunicationForm from "./CommunicationForm";

// Coquille de modale pour la communication ciblée — même principe que
// AdherentFormModal.jsx (isOpen calculé depuis l'URL, réutilisable telle
// quelle dans AdherentList.jsx), mais route fixe (pas de /create ni
// /edit/:id) : pas besoin de useFormModal, une simple comparaison de
// pathname suffit.
const AdherentCommunicationModal = () => {
  const location = useLocation();
  const isOpen = location.pathname === "/adherents/communication";
  const close = useCloseFormModal("/adherents");

  return (
    <FormModal
      isOpen={isOpen}
      onClose={close}
      title="Communication ciblée"
      subtitle="Envoie un email aux adhérents actifs correspondant aux critères"
      icon={FiSend}
      iconColor="indigo"
      size="xl"
    >
      <CommunicationForm />
    </FormModal>
  );
};

export default AdherentCommunicationModal;
