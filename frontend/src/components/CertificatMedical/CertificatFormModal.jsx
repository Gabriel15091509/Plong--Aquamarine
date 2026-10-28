import React from "react";
import { FiHeart } from "react-icons/fi";
import FormModal from "../Common/FormModal";
import { useFormModal } from "../../hooks/useFormModal";
import { useAuth } from "../../context/AuthContext";
import CertificatForm from "./CertificatForm";

// Coquille de modale pour la création/édition d'un certificat médical —
// calcule elle-même isOpen/id/close depuis l'URL (useFormModal) et le rôle
// (canManageCertificat, même règle que CertificatList.jsx : hasRole(["president"]))
// pour choisir le bon titre — donc réutilisable telle quelle aussi bien dans
// CertificatList.jsx (modale par-dessus la liste) que dans les routes
// "modale seule" d'App.jsx (modale par-dessus une AUTRE page) : aucun
// state/prop à faire transiter depuis l'appelant, jamais deux définitions
// des props visuelles (titre/icône/couleur/taille) à tenir synchronisées.
const CertificatFormModal = () => {
  const modal = useFormModal("/certificats");
  const { hasRole } = useAuth();
  const canManageCertificat = hasRole(["president"]);
  return (
    <FormModal
      isOpen={modal.isOpen}
      onClose={modal.close}
      title={
        modal.id
          ? "Modifier le certificat"
          : canManageCertificat
            ? "Nouveau certificat"
            : "Soumettre mon certificat médical"
      }
      subtitle={
        modal.id
          ? "Mettez à jour les informations du certificat"
          : canManageCertificat
            ? "Ajoutez un nouveau certificat médical"
            : "En attente de validation par le président avant d'être pris en compte."
      }
      icon={FiHeart}
      size="xl"
      iconColor="blue"
    >
      <CertificatForm />
    </FormModal>
  );
};

export default CertificatFormModal;
