import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiSettings,
  FiKey,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
} from "react-icons/fi";
import { useUsers } from "../../hooks/User/useUsers";
import { useAuth } from "../../context/AuthContext";
import ConfirmModal from "../Common/ConfirmModal";

// Bouton engrenage + menu déroulant (statut, mot de passe, suppression du
// compte de connexion) — extrait d'AccountManagementCard.jsx
// pour être posé tel quel dans un cluster d'icônes d'action (Voir/
// Modifier/Supprimer) sur les listages Moniteur/Président/Trésorier/
// Adhérent, en plus de la fiche Détails. Même mécanique de menu déroulant
// que le dropdown profil de Header.jsx (ref + écoute mousedown).
//
// `user` : le compte déjà résolu par l'appelant (mêmes `userMap`/lookups
// que ceux déjà construits par ces listages pour afficher nom/photo).
// `buttonClassName` : pour matcher le style des boutons Voir/Modifier/
// Supprimer déjà présents sur chaque ligne (icônes compactes `p-2
// rounded-lg` en liste, vs le bouton plus grand `p-2.5 rounded-xl` de la
// fiche Détails).
const AccountActionsMenu = ({
  user,
  buttonClassName = "p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 rounded-lg transition-colors",
}) => {
  const { user: currentUser } = useAuth();
  const {
    useDisableAccount,
    useEnableAccount,
    useResetPassword,
    useDeleteAccount,
  } = useUsers();
  const disableAccount = useDisableAccount();
  const enableAccount = useEnableAccount();
  const resetPassword = useResetPassword();
  const deleteAccount = useDeleteAccount();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Le menu s'ouvre replié SOUS le bouton (`absolute right-0 mt-2`) — sur une
  // fiche Détails où AccountManagementCard est proche du bas d'une modale
  // (voir FormModal.jsx, `overflow-y-auto`), il peut se retrouver coupé par
  // le bas du panneau tant que l'utilisateur n'a pas fait défiler lui-même.
  // `block: "nearest"` fait défiler le conteneur juste assez pour révéler le
  // menu, sans bouger la page si déjà visible.
  useEffect(() => {
    if (menuOpen && menuRef.current) {
      menuRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [menuOpen]);

  // Compte pas encore chargé, ou fiche sans compte de connexion résolu :
  // rien à afficher. Jamais d'action sur son propre compte depuis ce menu.
  if (!user || user.id === currentUser?.id) return null;

  const actionLoading =
    disableAccount.isPending ||
    enableAccount.isPending ||
    resetPassword.isPending ||
    deleteAccount.isPending;

  const handleToggleActive = () => {
    const mutation = user.active ? disableAccount : enableAccount;
    mutation.mutate(user.id);
    setMenuOpen(false);
  };

  const handleResetPassword = () => {
    setMenuOpen(false);
    setShowResetPasswordModal(true);
  };

  const handleConfirmResetPassword = () => {
    resetPassword.mutate(user.id, {
      onSuccess: () => setShowResetPasswordModal(false),
    });
  };

  const handleDeleteAccount = () => {
    deleteAccount.mutate(user.id, {
      onSuccess: () => setShowDeleteModal(false),
    });
  };

  const menuItemClass =
    "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-colors text-left disabled:opacity-50";

  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        disabled={actionLoading}
        title="Compte de connexion"
        className={buttonClassName}
      >
        <FiSettings className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20"
          >
            <div className="p-2">
              <button
                onClick={handleToggleActive}
                disabled={actionLoading}
                className={`${menuItemClass} ${
                  user.active
                    ? "text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
                    : "text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                }`}
              >
                {user.active ? (
                  <FiToggleRight className="w-4 h-4" />
                ) : (
                  <FiToggleLeft className="w-4 h-4" />
                )}
                {user.active ? "Désactiver le compte" : "Activer le compte"}
              </button>

              <button
                onClick={handleResetPassword}
                disabled={actionLoading}
                className={`${menuItemClass} text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20`}
              >
                <FiKey className="w-4 h-4" />
                Réinitialiser le mot de passe
              </button>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700" />

            <div className="p-2">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setShowDeleteModal(true);
                }}
                disabled={actionLoading}
                className={`${menuItemClass} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20`}
              >
                <FiTrash2 className="w-4 h-4" />
                Supprimer le compte
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showResetPasswordModal}
        icon={FiKey}
        title="Réinitialiser le mot de passe"
        message={
          <>
            Réinitialiser le mot de passe de{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {user.name}
            </span>{" "}
            ?
          </>
        }
        warningText="L'ancien mot de passe ne sera plus valide."
        confirmLabel="Réinitialiser"
        onConfirm={handleConfirmResetPassword}
        onCancel={() => setShowResetPasswordModal(false)}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Supprimer le compte de connexion"
        message={
          <>
            Êtes-vous sûr de vouloir supprimer le compte de connexion de{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {user.name}
            </span>{" "}
            ? (nom, email et téléphone seront anonymisés)
          </>
        }
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

export default AccountActionsMenu;
