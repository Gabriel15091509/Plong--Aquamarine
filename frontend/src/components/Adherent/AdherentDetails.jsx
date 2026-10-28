import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import ModalLink from "../Common/ModalLink";
import {
  FiUser,
  FiMail,
  FiMapPin,
  FiCalendar,
  FiAward,
  FiUserCheck,
  FiEdit,
  FiHeart,
  FiSmartphone,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiFileText,
  FiDroplet,
  FiAnchor,
  FiHash,
  FiClock,
  FiDownload,
  FiBookOpen,
  FiCompass,
  FiPackage,
  FiCreditCard,
  FiInbox,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useAdhesions } from "../../hooks/Adhesion/useAdhesions";
import { useCertificats } from "../../hooks/CertificatMedical/useCertificats";
import { useFormations } from "../../hooks/Formation/useFormations";
import { useInscriptions } from "../../hooks/Inscription/useInscriptions";
import { useAttributions } from "../../hooks/Attribution/useAttributions";
import { usePaiements } from "../../hooks/Paiement/usePaiements";
import { useMateriels } from "../../hooks/Materiel/useMateriels";
import { useUsers } from "../../hooks/User/useUsers";
import { useAuth } from "../../context/AuthContext";
import { useDetailsModal } from "../../hooks/useFormModal";
import { useScrollToHash } from "../../hooks/useScrollToHash";
import DetailsModal from "../Common/DetailsModal";
import LoadingSpinner from "../Common/LoadingSpinner";
import StatusBadge from "../Common/StatusBadge";
import PdfPreviewModal from "../Common/PdfPreviewModal";
import ConfirmModal from "../Common/ConfirmModal";
import InfoItem from "../Common/InfoItem";
import Pagination from "../Common/Pagination";
import AccountManagementCard from "../User/AccountManagementCard";
import {
  formatDate,
  formatDateTime,
  formatDuration,
  formatCurrency,
} from "../../utils/helpers";
import { photoUrl } from "../../utils/photoUrl";
import plongeeService from "../../services/Plongee/plongeeService";

// Fiche adhérent, modale par-dessus la liste (voir MoniteurDetails.jsx pour
// le prototype d'origine et DetailsModal.jsx pour la coquille commune) —
// dernière des 15 fiches Détails généralisées à ce modèle, et la plus
// riche : plafonnée à 3 pages (voir DetailsModal.jsx) — "Identité",
// "Historique & dossier" (brevets + statut administratif + dossier
// adhésion/certificat) et "Dossier complet" (formations, sorties, matériel,
// paiements, en grille 2×2) — les deux dernières absentes pour qui n'a pas
// canViewDossier.
const AdherentDetails = () => {
  const modal = useDetailsModal("/adherents");
  const { id } = modal;
  // AlerteDetailsModal.jsx (alerte "Matériel en retard") renvoie ici via
  // `/adherents/:id#materiel-attribue` — repris plus bas pour ouvrir
  // directement sur la page "Matériel & paiements" plutôt que sur la
  // première page (voir initialPageIndex, DetailsModal.jsx).
  const { hash } = useLocation();
  const { hasRole } = useAuth();
  const canManageAdherent = hasRole(["president"]);
  const canViewDossier = hasRole(["president", "moniteur", "tresorier"]);
  const { useGetById, useRemove } = useAdherents();
  const { data, isLoading } = useGetById(id);
  // Arrivée via #materiel-attribue (voir plus haut) : sélectionner la bonne
  // PAGE ("Dossier complet") ne suffit pas — c'est une grille 2×2
  // (formations/sorties/matériel/paiements), le matériel peut donc
  // s'ouvrir hors champ — même hook que ProfilePage.jsx pour le
  // défilement fin jusqu'à la carte elle-même.
  useScrollToHash(!isLoading && !!data?.data);
  const remove = useRemove();
  // Gestion du compte de connexion (ex-page "Utilisateurs") : `GET /users`
  // est réservé président côté backend — `enabled` évite un 403 pour un
  // moniteur/trésorier qui consulte aussi cette fiche (canViewDossier).
  const { useGetAll: useGetAllUsers } = useUsers();
  const { data: usersData } = useGetAllUsers({}, { enabled: !!id && canManageAdherent });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [downloadingCarnet, setDownloadingCarnet] = useState(false);
  const [downloadingAttestation, setDownloadingAttestation] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  // Listes du "Dossier complet" (formations, inscriptions, matériel,
  // paiements) : un adhérent actif depuis longtemps peut en accumuler des
  // dizaines dans chacune. Un bouton "Afficher tout" avait été essayé,
  // mais ça ne fait que déplacer le problème : une fois cliqué, tout
  // s'affiche quand même et le scroll interminable revient. Vraie
  // pagination à la place (même composant que "Mon matériel attribué",
  // ProfilePage.jsx) : chaque liste reste bornée à 4 éléments, quelle que
  // soit la page consultée.
  const DOSSIER_PAR_PAGE = 4;
  const [formationsPage, setFormationsPage] = useState(1);
  const [inscriptionsPage, setInscriptionsPage] = useState(1);
  const [attributionsPage, setAttributionsPage] = useState(1);
  const [paiementsPage, setPaiementsPage] = useState(1);

  const adherent = data?.data;
  const compteUtilisateur = usersData?.data?.find(
    (u) => u.id === adherent?.user_id,
  );

  const closePdfPreview = () => {
    if (pdfPreview?.blobUrl) window.URL.revokeObjectURL(pdfPreview.blobUrl);
    setPdfPreview(null);
  };

  const handlePreviewCarnet = async () => {
    setDownloadingCarnet(true);
    try {
      const { blobUrl, filename } = await plongeeService.previewCarnet(adherent.num_adherent);
      setPdfPreview({ blobUrl, filename });
    } catch (error) {
      toast.error("Erreur lors du chargement du carnet");
    } finally {
      setDownloadingCarnet(false);
    }
  };

  const handlePreviewAttestationSuivi = async () => {
    setDownloadingAttestation(true);
    try {
      const { blobUrl, filename } = await plongeeService.previewAttestationSuivi(
        adherent.num_adherent,
      );
      setPdfPreview({ blobUrl, filename });
    } catch (error) {
      toast.error("Erreur lors du chargement de l'attestation");
    } finally {
      setDownloadingAttestation(false);
    }
  };

  // Même calcul que ProfilePage.jsx (anneesMembre) : différence en années
  // pleines depuis l'inscription.
  const anciennete = adherent?.date_inscription
    ? `${new Date().getFullYear() - new Date(adherent.date_inscription).getFullYear()} an(s)`
    : "-";

  const { useDossierStatus } = useAdhesions();
  const { useStatus } = useCertificats();
  // Dossier allégé pour un Baptême : pas encore licencié FFESM ni assuré à
  // l'année (Club uniquement) — même règle que InscriptionService.js
  // (activites-service) pour l'inscription aux sorties.
  const requiredAdhesionTypes = adherent?.niveau === "Baptême" ? ["Club"] : undefined;
  const { data: dossierData } = useDossierStatus(
    canViewDossier ? adherent?.num_adherent : undefined,
    requiredAdhesionTypes,
  );
  const { data: certStatusData } = useStatus(
    canViewDossier ? adherent?.num_adherent : undefined,
  );
  const dossier = dossierData?.data;
  const certStatus = certStatusData?.data;

  // Dossier complet de l'adhérent (formations, sorties, matériel, paiements) —
  // réservé au même public que le dossier adhésion ci-dessus.
  const { useGetByAdherent: useFormationsByAdherent } = useFormations();
  const { useGetByAdherent: useInscriptionsByAdherent } = useInscriptions();
  const { useGetByAdherent: useAttributionsByAdherent } = useAttributions();
  const { useGetByAdherent: usePaiementsByAdherent } = usePaiements();
  const { useGetAll: useGetAllMateriels } = useMateriels();

  const { data: formationsData } = useFormationsByAdherent(
    canViewDossier ? adherent?.num_adherent : undefined,
  );
  const { data: inscriptionsData } = useInscriptionsByAdherent(
    canViewDossier ? adherent?.num_adherent : undefined,
  );
  const { data: attributionsData } = useAttributionsByAdherent(
    canViewDossier ? adherent?.num_adherent : undefined,
  );
  const { data: paiementsData } = usePaiementsByAdherent(
    canViewDossier ? adherent?.num_adherent : undefined,
  );
  const { data: materielsData } = useGetAllMateriels({}, { enabled: !!id && canViewDossier });

  const formations = formationsData?.data || [];
  const inscriptions = inscriptionsData?.data || [];
  const attributionsEnCours = (attributionsData?.data || []).filter(
    (a) => !a.date_retour_reel,
  );
  const paiements = paiementsData?.data || [];
  const materielMap = (materielsData?.data || []).reduce((map, m) => {
    map[m.num_inventaire] = `${m.marque} ${m.modele}`;
    return map;
  }, {});

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      setShowDeleteModal(false);
      modal.close();
    } catch (error) {
      console.error("Échec de la suppression de l'adhérent :", error);
    }
  };

  const headerExtra = adherent && (
    <>
      <button
        onClick={handlePreviewCarnet}
        disabled={downloadingCarnet}
        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors disabled:opacity-60"
        title="Carnet de plongée"
      >
        <FiDownload className="w-4 h-4" />
      </button>
      <button
        onClick={handlePreviewAttestationSuivi}
        disabled={downloadingAttestation}
        className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors disabled:opacity-60"
        title="Attestation de suivi"
      >
        <FiAward className="w-4 h-4" />
      </button>
      {canManageAdherent && (
        <>
          <ModalLink
            to={`/adherents/edit/${adherent.num_adherent}`}
            className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
            title="Modifier"
          >
            <FiEdit className="w-4 h-4" />
          </ModalLink>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            title="Supprimer"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </>
      )}
    </>
  );

  if (isLoading || !adherent) {
    return (
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={isLoading ? "Chargement…" : "Adhérent non trouvé"}
        icon={FiUser}
        pages={[
          {
            label: "",
            content: isLoading ? (
              <div className="flex items-center justify-center py-10">
                <LoadingSpinner variant="details" />
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">
                L&apos;adhérent que vous recherchez n&apos;existe pas ou a été
                supprimé.
              </p>
            ),
          },
        ]}
      />
    );
  }

  const pages = [
    {
      label: "Identité",
      icon: FiUser,
      content: (
        <div className="space-y-3">
          {/* Bandeau statut, compact */}
          <div className="rounded-xl p-2.5 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <StatusBadge status={adherent.statut} />
              {adherent.est_invite && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  title="Fiche invité : facturé au tarif non-adhérent, hors communications ciblées"
                >
                  Invité (non-adhérent)
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{adherent.niveau || "Non défini"}</span>
              <span>Ancienneté : {anciennete}</span>
              <span>{adherent.nb_plongees_total ?? 0} plongées club</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            <div className="space-y-1">
              <InfoItem
                icon={FiUserCheck}
                label="Nom complet"
                value={`${adherent.nom} ${adherent.prenom}`}
                avatarUrl={photoUrl(adherent.photo)}
                highlight
              />
              <InfoItem icon={FiUser} label="Civilité" value={adherent.civilite} />
              <InfoItem
                icon={FiCalendar}
                label="Date de naissance"
                value={formatDate(adherent.date_naissance)}
              />
              <InfoItem icon={FiMail} label="Email" value={adherent.email} />
              <InfoItem
                icon={FiSmartphone}
                label="Téléphone"
                value={adherent.telephone || "Non renseigné"}
              />
              <InfoItem
                icon={FiMapPin}
                label="Adresse"
                value={adherent.adresse || "Non renseignée"}
              />
            </div>
            <div className="space-y-1">
              <InfoItem
                icon={FiAward}
                label="Niveau de plongée"
                value={adherent.niveau || "Non défini"}
                highlight
              />
              <InfoItem
                icon={FiCalendar}
                label="Date d'obtention"
                value={
                  adherent.niveau === "Baptême"
                    ? "Non applicable"
                    : adherent.date_obtention_niveau
                      ? formatDate(adherent.date_obtention_niveau)
                      : "Non défini"
                }
              />
              <InfoItem
                icon={FiFileText}
                label="Brevet délivré"
                value={
                  adherent.niveau === "Baptême"
                    ? "Non applicable"
                    : adherent.num_brevet || "Non renseigné"
                }
              />
              <InfoItem
                icon={FiHash}
                label="N° Licence FFESM"
                value={
                  adherent.niveau === "Baptême"
                    ? "Non applicable"
                    : adherent.num_licence_ffesm || "Non renseigné"
                }
              />
              <InfoItem
                icon={FiCalendar}
                label="Date d'inscription"
                value={formatDate(adherent.date_inscription)}
              />
              {/* Gestion du compte de connexion (ex-page "Utilisateurs") —
                  président uniquement (comme le reste de la gestion sur
                  cette fiche, canManageAdherent) ; distincte du badge de
                  statut ci-dessus qui parle du statut d'adhésion, pas du
                  compte de connexion. Nichée ici plutôt qu'en ligne à part
                  sur toute la largeur (col-span-2) : une carte avec juste
                  un badge + un bouton engrenage sur toute la largeur de la
                  modale, c'est un grand vide entre les deux. */}
              {canManageAdherent && (
                <AccountManagementCard user={compteUtilisateur} className="mt-2" />
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      // Historique des brevets (une ligne par passage de niveau, jamais
      // écrasée contrairement au niveau courant ci-dessus), statut
      // administratif et dossier adhésion/certificat : regroupés sur une
      // même page (plutôt que sur 2 pages à part) pour rester sous la
      // limite de 3 pages (voir DetailsModal.jsx).
      label: "Historique & dossier",
      icon: FiBookOpen,
      content: (
        <div className="space-y-3">
          {canViewDossier && (dossier || certStatus) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div
                className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                  dossier?.valid
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                }`}
              >
                {dossier?.valid ? (
                  <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <FiXCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    Adhésion {dossier?.valid ? "complète" : "incomplète"}
                  </p>
                  {!dossier?.valid && dossier?.missing?.length > 0 && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Manquant : {dossier.missing.join(", ")}
                    </p>
                  )}
                </div>
              </div>
              <div
                className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                  certStatus?.hasValidCertificate
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                }`}
              >
                {certStatus?.hasValidCertificate ? (
                  <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <FiXCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                )}
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  Certificat médical{" "}
                  {certStatus?.hasValidCertificate ? "valide" : "expiré ou manquant"}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              Historique des brevets
            </p>
            {!adherent.brevets || adherent.brevets.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aucun passage de niveau enregistré.
              </p>
            ) : (
              <div className="space-y-1">
                {/* ModalLink (pas Link) : on ouvre la fiche brevet PAR-DESSUS
                    cette fiche adhérent, sans la remplacer — voir
                    BrevetList.jsx pour le même lien en <Link> simple depuis
                    la liste propriétaire de /brevets/:id, qui elle ne
                    démonte jamais en l'ouvrant. */}
                {adherent.brevets.map((brevet) => (
                  <ModalLink
                    key={brevet.id_brevet}
                    to={`/brevets/${brevet.id_brevet}`}
                    className="flex items-center justify-between gap-3 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {brevet.niveau}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(brevet.date_obtention)}
                        {brevet.num_brevet ? ` — Brevet n° ${brevet.num_brevet}` : ""}
                      </p>
                    </div>
                  </ModalLink>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <InfoItem
              icon={FiUserCheck}
              label="Statut"
              value={<StatusBadge status={adherent.statut} />}
            />
            <InfoItem
              icon={FiHeart}
              label="Contact d'urgence"
              value={adherent.contact_urgence || "Non renseigné"}
            />
            <InfoItem
              icon={FiDroplet}
              label="Nombre de plongées club"
              value={String(adherent.nb_plongees_total ?? 0)}
            />
            <InfoItem
              icon={FiDroplet}
              label="Plongées réellement enregistrées"
              value={
                adherent.nb_plongees_reelles === null ||
                adherent.nb_plongees_reelles === undefined
                  ? "Indisponible"
                  : String(adherent.nb_plongees_reelles)
              }
            />
            <InfoItem
              icon={FiAnchor}
              label="Profondeur max réalisée"
              value={
                adherent.profondeur_max_reelle === null ||
                adherent.profondeur_max_reelle === undefined
                  ? "Indisponible"
                  : `${adherent.profondeur_max_reelle} m`
              }
            />
            <InfoItem
              icon={FiClock}
              label="Temps total sous l'eau"
              value={
                adherent.duree_totale_reelle === null ||
                adherent.duree_totale_reelle === undefined
                  ? "Indisponible"
                  : formatDuration(adherent.duree_totale_reelle)
              }
            />
          </div>
          </div>
        </div>
      ),
    },
  ];

  const dossierEstVide =
    formations.length === 0 &&
    inscriptions.length === 0 &&
    attributionsEnCours.length === 0 &&
    paiements.length === 0;

  if (canViewDossier) {
    pages.push({
      // Formations, sorties, matériel et paiements : les 4 vraies
      // sous-listes du dossier complet, regroupées sur une même page en
      // grille 2×2 (plutôt que sur 2 pages à part) pour rester sous la
      // limite de 3 pages (voir DetailsModal.jsx). Si les 4 sont vides
      // (adhérent tout juste inscrit), un message unique et centré
      // remplace la grille : 4 quadrants réduits chacun à une ligne
      // "Aucun·e..." aurait laissé la page visiblement à moitié vide.
      label: "Dossier complet",
      icon: FiCompass,
      content: dossierEstVide ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
            <FiInbox className="w-6 h-6" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            Rien à afficher pour l&apos;instant : aucune formation, aucune
            inscription à une sortie, aucun matériel attribué et aucun
            paiement enregistré pour cet adhérent.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 flex items-center gap-2">
              <FiBookOpen className="w-3.5 h-3.5" />
              Formations en cours
            </p>
            {formations.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aucune formation en cours.
              </p>
            ) : (
              <div className="space-y-1">
                {formations
                  .slice(
                    (formationsPage - 1) * DOSSIER_PAR_PAGE,
                    formationsPage * DOSSIER_PAR_PAGE,
                  )
                  .map((formation) => (
                    <ModalLink
                      key={formation.id_formation}
                      to={`/formations/${formation.id_formation}`}
                      className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {formation.niveau_vise}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCurrency(formation.montant_paye)} /{" "}
                          {formatCurrency(formation.montant_total)}
                        </p>
                      </div>
                      <StatusBadge status={formation.statut} />
                    </ModalLink>
                  ))}
                <Pagination
                  currentPage={formationsPage}
                  totalPages={Math.ceil(formations.length / DOSSIER_PAR_PAGE)}
                  onPageChange={setFormationsPage}
                  scrollToTop={false}
                />
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 flex items-center gap-2">
              <FiCompass className="w-3.5 h-3.5" />
              Inscriptions à des sorties
            </p>
            {inscriptions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aucune inscription à une sortie.
              </p>
            ) : (
              <div className="space-y-1">
                {inscriptions
                  .slice(
                    (inscriptionsPage - 1) * DOSSIER_PAR_PAGE,
                    inscriptionsPage * DOSSIER_PAR_PAGE,
                  )
                  .map((inscription) => (
                    <ModalLink
                      key={inscription.id_inscription}
                      to={`/sorties/${inscription.id_sortie}`}
                      className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {inscription.sortie
                            ? `${inscription.sortie.type} — ${inscription.sortie.lieu}`
                            : `Sortie #${inscription.id_sortie}`}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {inscription.sortie?.date_heure
                            ? formatDateTime(inscription.sortie.date_heure)
                            : "Date inconnue"}
                        </p>
                      </div>
                      <StatusBadge status={inscription.statut} />
                    </ModalLink>
                  ))}
                <Pagination
                  currentPage={inscriptionsPage}
                  totalPages={Math.ceil(inscriptions.length / DOSSIER_PAR_PAGE)}
                  onPageChange={setInscriptionsPage}
                  scrollToTop={false}
                />
              </div>
            )}
          </div>

          <div id="materiel-attribue">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 flex items-center gap-2">
              <FiPackage className="w-3.5 h-3.5" />
              Matériel attribué
            </p>
            {attributionsEnCours.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aucun matériel actuellement attribué.
              </p>
            ) : (
              <div className="space-y-1">
                {attributionsEnCours
                  .slice(
                    (attributionsPage - 1) * DOSSIER_PAR_PAGE,
                    attributionsPage * DOSSIER_PAR_PAGE,
                  )
                  .map((attribution) => (
                    <ModalLink
                      key={attribution.id_attribution}
                      to={`/attributions/${attribution.id_attribution}`}
                      className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {materielMap[attribution.num_inventaire] ||
                            `Matériel #${attribution.num_inventaire}`}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Depuis le {formatDate(attribution.date_attribution)}
                        </p>
                      </div>
                      <span className="text-xs font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        En cours
                      </span>
                    </ModalLink>
                  ))}
                <Pagination
                  currentPage={attributionsPage}
                  totalPages={Math.ceil(
                    attributionsEnCours.length / DOSSIER_PAR_PAGE,
                  )}
                  onPageChange={setAttributionsPage}
                  scrollToTop={false}
                />
              </div>
            )}
          </div>

          <div id="paiements">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 flex items-center gap-2">
              <FiCreditCard className="w-3.5 h-3.5" />
              Paiements
            </p>
            {paiements.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aucun paiement enregistré.
              </p>
            ) : (
              <div className="space-y-1">
                {paiements
                  .slice(
                    (paiementsPage - 1) * DOSSIER_PAR_PAGE,
                    paiementsPage * DOSSIER_PAR_PAGE,
                  )
                  .map((paiement) => (
                    <ModalLink
                      key={paiement.id_paiement}
                      to={`/paiements/${paiement.id_paiement}`}
                      className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {paiement.type_paiement} — {formatCurrency(paiement.montant)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(paiement.date_paiement)}
                        </p>
                      </div>
                      <StatusBadge status={paiement.statut} />
                    </ModalLink>
                  ))}
                <Pagination
                  currentPage={paiementsPage}
                  totalPages={Math.ceil(paiements.length / DOSSIER_PAR_PAGE)}
                  onPageChange={setPaiementsPage}
                  scrollToTop={false}
                />
              </div>
            )}
          </div>
        </div>
      ),
    });
  }

  const materielPageIndex = pages.findIndex((p) => p.label === "Dossier complet");
  const initialPageIndex =
    (hash === "#materiel-attribue" || hash === "#paiements") && materielPageIndex !== -1
      ? materielPageIndex
      : 0;

  return (
    <>
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        initialPageIndex={initialPageIndex}
        title={`${adherent.nom} ${adherent.prenom}`}
        subtitle={`N°${adherent.num_adherent} • ${adherent.email}`}
        icon={FiUser}
        headerExtra={headerExtra}
        pages={pages}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        message={
          <>
            Êtes-vous sûr de vouloir supprimer l&apos;adhérent{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {adherent.nom} {adherent.prenom}
            </span>
            ?
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      <PdfPreviewModal
        isOpen={!!pdfPreview}
        onClose={closePdfPreview}
        blobUrl={pdfPreview?.blobUrl}
        filename={pdfPreview?.filename}
      />
    </>
  );
};

export default AdherentDetails;
