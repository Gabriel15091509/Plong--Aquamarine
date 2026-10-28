import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiSettings,
  FiUser,
  FiLock,
  FiSun,
  FiMoon,
  FiShield,
  FiUserPlus,
  FiDownload,
  FiChevronRight,
  FiDatabase,
  FiSave,
  FiRotateCcw,
  FiAlertTriangle,
  FiTrash2,
  FiInbox,
  FiInfo,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useBackups } from "../../hooks/Backup/useBackups";
import api from "../../services/api";
import backupService from "../../services/Backup/backupService";
import { formatDateTime } from "../../utils/helpers";
import ModalOverlay from "../../components/Common/ModalOverlay";
import ConfirmModal from "../../components/Common/ConfirmModal";
import Breadcrumb from "../../components/Common/Breadcrumb";
import ChangePasswordModal from "../../components/User/ChangePasswordModal";
import ToggleSwitch from "../../components/Common/ToggleSwitch";

// Ex. "3,2 Mo" — pas d'utilitaire partagé de ce type ailleurs dans
// l'appli (formatCurrency/formatDuration existent pour d'autres unités),
// gardé local le temps qu'un 2e usage justifie de le déplacer dans
// utils/helpers.js.
const formatBytes = (octets) => {
  if (!octets) return "0 o";
  const unites = ["o", "Ko", "Mo", "Go"];
  const i = Math.min(
    Math.floor(Math.log(octets) / Math.log(1024)),
    unites.length - 1,
  );
  return `${(octets / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${unites[i]}`;
};

// Une ligne de réglage : libellé + description à gauche, contrôle/action à
// droite — même schéma que "Account Settings" (maquette fournie), plutôt
// qu'un empilement de cartes comme l'ancienne version de cette page.
const SettingRow = ({ label, description, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
    <div className="min-w-0">
      <p className="font-medium text-gray-900 dark:text-white text-sm">{label}</p>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {description}
        </p>
      )}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const OUTLINE_BUTTON =
  "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors";

// Point d'entrée unique pour tout ce qui EST du paramétrage (lié depuis le
// dropdown profil de Header.jsx) — thème, mot de passe, confidentialité/
// RGPD, création de compte — plutôt que dispersé entre le pied de la
// Sidebar, ce dropdown et ProfilePage. ProfilePage reste, lui, l'identité
// (nom/photo/téléphone) et l'activité (stats, dernières plongées, matériel
// attribué) : pas un réglage, d'où l'onglet "Profil" ci-dessous qui n'y fait
// que renvoyer plutôt que de dupliquer le formulaire.
//
// Navigation à onglets verticale (comme la maquette "Account Settings")
// plutôt que les cartes empilées de l'ancienne version : plus lisible dès
// qu'on dépasse 3-4 sections, et ça laisse de la place pour en ajouter sans
// que la page s'allonge indéfiniment. Repasse en rangée horizontale
// défilante sous md (pas de place pour une colonne à côté du contenu sur
// mobile).
const ParametresPage = () => {
  const { user, hasPermission, hasRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [exportingData, setExportingData] = useState(false);
  // Réservé président sans exception, même garde que backupRoutes.js côté
  // identite-service : une sauvegarde contient les données personnelles de
  // tous les adhérents, une restauration remplace la base en direct.
  const canManageBackups = hasRole(["president"]);

  const TABS = [
    { key: "profil", label: "Profil", icon: FiUser },
    { key: "securite", label: "Sécurité", icon: FiLock },
    { key: "apparence", label: "Apparence", icon: theme === "dark" ? FiMoon : FiSun },
    { key: "confidentialite", label: "Confidentialité", icon: FiShield },
    { key: "apropos", label: "À propos", icon: FiInfo },
    hasPermission("manage_users") && {
      key: "comptes",
      label: "Comptes",
      icon: FiUserPlus,
    },
    canManageBackups && {
      key: "sauvegarde",
      label: "Sauvegarde",
      icon: FiDatabase,
    },
  ].filter(Boolean);

  const [activeTab, setActiveTab] = useState("profil");
  // Changement de mot de passe volontaire : en modale plutôt qu'une
  // navigation vers /change-password (cette route reste utilisée telle
  // quelle pour le changement FORCÉ à la connexion, voir
  // ChangePasswordModal.jsx).
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const { useGetAll: useGetAllBackups, useCreate: useCreateBackup, useRestore: useRestoreBackup, useRemove: useRemoveBackup } =
    useBackups();
  const { data: backupsData, isLoading: loadingBackups } = useGetAllBackups({
    enabled: canManageBackups,
  });
  const backups = backupsData?.data || [];
  const createBackup = useCreateBackup();
  const restoreBackup = useRestoreBackup();
  const removeBackup = useRemoveBackup();
  const [downloadingId, setDownloadingId] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleDownloadBackup = async (backup) => {
    setDownloadingId(backup.id);
    try {
      const blob = await backupService.download(backup.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sauvegarde-${backup.id}-${new Date(backup.created_at).toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Impossible de télécharger la sauvegarde",
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const handleConfirmRestore = async () => {
    if (!restoreTarget || restoreConfirmText !== "RESTAURER") return;
    try {
      await restoreBackup.mutateAsync({
        id: restoreTarget.id,
        confirmation: restoreConfirmText,
      });
      setRestoreTarget(null);
      setRestoreConfirmText("");
    } catch (error) {
      // toast déjà géré par le hook useRestore
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeBackup.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      // toast déjà géré par le hook useRemove
    }
  };

  // RGPD (droit d'accès/portabilité, exigence 4.4) — logique inchangée
  // depuis l'ancienne version de cette page.
  const handleExportData = async () => {
    setExportingData(true);
    try {
      const response = await api.get("/users/me/export");
      const blob = new Blob([JSON.stringify(response.data.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mes-donnees-${user?.id || "compte"}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Impossible d'exporter vos données",
      );
    } finally {
      setExportingData(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 pb-6"
    >
      <Breadcrumb current="Paramètres" />

      <div className="flex items-center gap-3 mb-6">
        <span className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400">
          <FiSettings className="w-6 h-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Paramètres
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Compte, affichage et confidentialité
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation des onglets */}
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0 md:w-56 shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              } ${tab.key === "comptes" ? "md:mt-2 md:pt-2 md:border-t md:border-gray-100 dark:md:border-gray-800" : ""}`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Contenu de l'onglet actif */}
        <div className="flex-1 min-w-0 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6">
          {activeTab === "profil" && (
            <>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Profil
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Nom, photo et coordonnées se modifient depuis votre fiche
                profil.
              </p>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <SettingRow
                  label={user?.name || "Mon profil"}
                  description={user?.email}
                >
                  <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className={OUTLINE_BUTTON}
                  >
                    Voir mon profil
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </SettingRow>
              </div>
            </>
          )}

          {activeTab === "securite" && (
            <>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Sécurité
              </h2>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <SettingRow
                  label="Adresse e-mail"
                  description="L'adresse associée à votre compte."
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.email}
                  </span>
                </SettingRow>
                <SettingRow
                  label="Mot de passe"
                  description="Définissez un mot de passe unique pour protéger votre compte."
                >
                  <button
                    type="button"
                    onClick={() => setShowChangePasswordModal(true)}
                    className={OUTLINE_BUTTON}
                  >
                    Changer le mot de passe
                  </button>
                </SettingRow>
              </div>
            </>
          )}

          {activeTab === "apparence" && (
            <>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Apparence
              </h2>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <SettingRow
                  label="Mode sombre"
                  description="Bascule l'affichage entre thème clair et thème sombre."
                >
                  <ToggleSwitch
                    checked={theme === "dark"}
                    onChange={toggleTheme}
                    label="Mode sombre"
                  />
                </SettingRow>
              </div>
            </>
          )}

          {activeTab === "confidentialite" && (
            <>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Confidentialité
              </h2>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <SettingRow
                  label="Exporter mes données"
                  description="Téléchargez une copie de vos données personnelles (RGPD)."
                >
                  <button
                    type="button"
                    onClick={handleExportData}
                    disabled={exportingData}
                    className={`${OUTLINE_BUTTON} disabled:opacity-50`}
                  >
                    <FiDownload className="w-4 h-4" />
                    {exportingData ? "Export en cours..." : "Télécharger"}
                  </button>
                </SettingRow>
                <SettingRow
                  label="Politique de confidentialité"
                  description="Comment vos données sont utilisées et protégées."
                >
                  <Link to="/confidentialite" className={OUTLINE_BUTTON}>
                    Consulter
                  </Link>
                </SettingRow>
              </div>
            </>
          )}

          {activeTab === "apropos" && (
            <>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                À propos
              </h2>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <SettingRow
                  label="À propos de l'application"
                  description="Présentation de Plongée Club, de ses fonctionnalités et de sa version."
                >
                  <Link to="/about" className={OUTLINE_BUTTON}>
                    Consulter
                  </Link>
                </SettingRow>
              </div>
            </>
          )}

          {activeTab === "comptes" && (
            <>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Comptes
              </h2>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <SettingRow
                  label="Créer un utilisateur"
                  description="Ouvrez un nouveau compte de connexion pour un membre du club."
                >
                  <Link to="/users/create" className={OUTLINE_BUTTON}>
                    <FiUserPlus className="w-4 h-4" />
                    Créer
                  </Link>
                </SettingRow>
              </div>
            </>
          )}

          {activeTab === "sauvegarde" && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Sauvegarde des données
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Une sauvegarde automatique est prise chaque nuit à 3h
                    (les 14 dernières sont conservées, en plus de toutes
                    celles créées manuellement ci-dessous).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => createBackup.mutate()}
                  disabled={createBackup.isPending}
                  className={`${OUTLINE_BUTTON} disabled:opacity-50 shrink-0`}
                >
                  <FiSave className="w-4 h-4" />
                  {createBackup.isPending
                    ? "Sauvegarde en cours..."
                    : "Sauvegarder maintenant"}
                </button>
              </div>

              {loadingBackups ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent" />
                </div>
              ) : backups.length === 0 ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  <FiInbox className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p>Aucune sauvegarde pour le moment</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {backups.map((backup) => (
                    <SettingRow
                      key={backup.id}
                      label={formatDateTime(backup.created_at)}
                      description={`${backup.type === "automatique" ? "Automatique" : "Manuelle"} • ${formatBytes(backup.taille_octets)}`}
                    >
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDownloadBackup(backup)}
                          disabled={downloadingId === backup.id}
                          title="Télécharger"
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <FiDownload className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRestoreTarget(backup)}
                          title="Restaurer"
                          className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                        >
                          <FiRotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(backup)}
                          title="Supprimer"
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </SettingRow>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Restauration : action la plus dangereuse de toute la page (remplace
          la base en direct) — confirmation renforcée par phrase à retaper,
          en plus du ConfirmModal générique utilisé pour la suppression
          ci-dessous, jugé insuffisant pour un clic aux conséquences aussi
          larges. La même phrase est revérifiée côté serveur (voir
          BackupController.restore), une requête forgée sans passer par ce
          formulaire ne suffit donc pas non plus. */}
      {restoreTarget && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-4">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <FiAlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Restaurer cette sauvegarde ?
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Toutes les données actuelles seront remplacées par celles du{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatDateTime(restoreTarget.created_at)}
              </span>
              .{" "}
              <span className="text-sm text-red-500 font-medium">
                Cette action est irréversible.
              </span>
            </p>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Tapez <span className="font-mono font-bold">RESTAURER</span> pour
              confirmer
            </label>
            <input
              type="text"
              value={restoreConfirmText}
              onChange={(e) => setRestoreConfirmText(e.target.value)}
              autoComplete="off"
              className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setRestoreTarget(null);
                  setRestoreConfirmText("");
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={restoreConfirmText !== "RESTAURER" || restoreBackup.isPending}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {restoreBackup.isPending ? "Restauration..." : "Restaurer"}
              </button>
            </div>
          </motion.div>
        </ModalOverlay>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Supprimer cette sauvegarde ?"
        message={
          deleteTarget
            ? `La sauvegarde du ${formatDateTime(deleteTarget.created_at)} sera définitivement supprimée.`
            : ""
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </motion.div>
  );
};

export default ParametresPage;
