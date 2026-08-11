import React, { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiFileText,
  FiUser,
  FiCalendar,
  FiClock,
  FiCheck,
  FiAlertCircle,
  FiX,
} from "react-icons/fi";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";
import { useCertificats } from "../../hooks/CertificatMedical/useCertificats";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../Common/StatusBadge";
import { formatDate } from "../../utils/helpers";
import { photoUrl } from "../../utils/photoUrl";

// Fonctions utilitaires hors du composant
const isExpired = (date) => new Date(date) < new Date();
const getDaysRemaining = (date) => {
  const diffTime = new Date(date) - new Date();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const CertificatList = () => {
  const { hasRole } = useAuth();
  const canManageCertificat = hasRole(["president"]);
  // Un adhérent peut soumettre son propre certificat médical — CTA
  // distincte de "Nouveau certificat" (même schéma que AdhesionList.jsx).
  const canSubmitOwn = hasRole(["adherent"]);
  const { useGetAll, useRemove, useValider } = useCertificats();
  const { useGetAll: useGetAllAdherents } = useAdherents();

  const { data, isLoading, error, refetch } = useGetAll();
  const { data: adherentsData, isLoading: loadingAdherents } =
    useGetAllAdherents();
  const remove = useRemove();
  const valider = useValider();

  // "Validation" : activé depuis ?validation=soumis (lien du sous-menu
  // "Validation" dans la Sidebar) — affiche uniquement les auto-soumissions
  // (soumis_par_adherent), tous statuts confondus (en attente/validé/
  // rejeté, distingués par le badge sur chaque ligne). Ce n'est plus un
  // filtre réglable en page : c'est une vue dédiée, il n'y a donc pas de
  // <select> correspondant, seulement ce booléen dérivé de l'URL. `filter`
  // ci-dessous reste distinct : il porte sur `statut` (Valide/Expiré, la
  // péremption, pas la validation par le président).
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [showValidationOnly, setShowValidationOnly] = useState(
    searchParams.get("validation") === "soumis",
  );
  // Le lien de la Sidebar change juste ?validation=... sans démonter cette
  // page (même route /certificats) : l'état initial de useState ci-dessus
  // ne se ré-évalue pas tout seul dans ce cas, il faut le resynchroniser
  // explicitement à chaque changement d'URL, sinon le clic ne fait rien de
  // visible (l'URL change, la vue affichée reste l'ancienne).
  useEffect(() => {
    setShowValidationOnly(searchParams.get("validation") === "soumis");
  }, [searchParams]);
  const [deleteModal, setDeleteModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectMotif, setRejectMotif] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Map des adhérents avec toutes leurs infos
  const adherentMap = useMemo(() => {
    const map = {};
    if (adherentsData?.data) {
      adherentsData.data.forEach((adherent) => {
        map[adherent.num_adherent] = {
          nom: `${adherent.civilite} ${adherent.nom} ${adherent.prenom}`,
          photo: adherent.photo,
          num_adherent: adherent.num_adherent,
        };
      });
    }
    return map;
  }, [adherentsData]);

  const allCertificats = data?.data || [];

  const filteredCertificats = useMemo(() => {
    return allCertificats.filter((c) => {
      const adherentInfo = adherentMap[c.num_adherent] || {
        nom: `#${c.num_adherent}`,
        photo: null,
      };
      const adherentName = adherentInfo.nom;

      if (filter !== "all" && c.statut !== filter) return false;
      if (showValidationOnly && !c.soumis_par_adherent) return false;

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          c.type_certificat?.toLowerCase().includes(search) ||
          c.medecin?.toLowerCase().includes(search) ||
          adherentName.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [allCertificats, adherentMap, filter, showValidationOnly, searchTerm]);

  const totalPages = Math.ceil(filteredCertificats.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCertificats = filteredCertificats.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleDelete = async (id) => {
    try {
      await remove.mutateAsync(id);
      refetch();
      setDeleteModal(null);
    } catch (error) {
      console.error("Échec de la suppression du certificat médical :", error);
    }
  };

  const handleValider = async (id) => {
    try {
      await valider.mutateAsync({ id, decision: "Validé" });
      refetch();
    } catch (error) {
      console.error("Échec de la validation du certificat médical :", error);
    }
  };

  const handleRejeter = async () => {
    if (!rejectModal || !rejectMotif.trim()) return;
    try {
      await valider.mutateAsync({ id: rejectModal, decision: "Rejeté", motif: rejectMotif.trim() });
      refetch();
      setRejectModal(null);
      setRejectMotif("");
    } catch (error) {
      console.error("Échec du rejet du certificat médical :", error);
    }
  };

  if (isLoading || loadingAdherents) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  if (filteredCertificats.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <FiFileText className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aucun certificat trouvé
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm || filter !== "all" || showValidationOnly
            ? "Aucun résultat pour vos critères"
            : "Commencez par créer un nouveau certificat"}
        </p>
        {(canManageCertificat || canSubmitOwn) && (
          <Link
            to="/certificats/create"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <FiPlus className="w-4 h-4" />
            {canManageCertificat ? "Nouveau certificat" : "Soumettre mon certificat"}
          </Link>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher par type, médecin ou adhérent..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tous</option>
            <option value="Valide">Valides</option>
            <option value="Expiré">Expirés</option>
          </select>
          {(canManageCertificat || canSubmitOwn) && (
            <Link
              to="/certificats/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              <FiPlus className="w-4 h-4" />
              {canManageCertificat ? "Nouveau" : "Soumettre"}
            </Link>
          )}
        </div>
      </div>

      {/* Liste des certificats */}
      <AnimatePresence>
        {paginatedCertificats.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
          >
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Aucun certificat trouvé
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {searchTerm || filter !== "all" || showValidationOnly
                ? "Essayez de modifier vos filtres"
                : "Aucun certificat pour le moment"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-3"
          >
            {paginatedCertificats.map((certificat) => {
              const adherentInfo = adherentMap[certificat.num_adherent] || {
                nom: `#${certificat.num_adherent}`,
                photo: null,
              };
              const adherentName = adherentInfo.nom;
              const daysRemaining = getDaysRemaining(certificat.date_validite);

              return (
                <motion.div
                  key={certificat.id_certificat}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    {/* Photo en évidence */}
                    <div className="flex-shrink-0">
                      {adherentInfo.photo ? (
                        <img
                          src={photoUrl(adherentInfo.photo)}
                          alt={adherentName}
                          className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700 shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-700 shadow-sm">
                          <FiUser className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                        </div>
                      )}
                      <div className="text-center mt-1">
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                          #{certificat.num_adherent}
                        </span>
                      </div>
                    </div>

                    {/* Informations */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {adherentName}
                            </h3>
                            <span className="text-sm text-gray-400 dark:text-gray-500">
                              •
                            </span>
                            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                              {certificat.type_certificat}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <FiCalendar className="w-3.5 h-3.5" />
                              {formatDate(certificat.date_validite)}
                            </span>

                            {/* Afficher uniquement si moins de 30 jours restants */}
                            {daysRemaining <= 30 && daysRemaining > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 font-medium text-orange-600 dark:text-orange-400">
                                  <FiClock className="w-3.5 h-3.5" />
                                  {daysRemaining}{" "}
                                  {daysRemaining === 1 ? "jour" : "jours"}
                                </span>
                              </>
                            )}

                            {certificat.medecin && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <span className="text-gray-400">
                                    Médecin:
                                  </span>
                                  {certificat.medecin}
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <StatusBadge status={certificat.statut} />
                            {certificat.statut_validation !== "Validé" && (
                              <>
                                <span>•</span>
                                <StatusBadge status={certificat.statut_validation} />
                              </>
                            )}
                            {certificat.statut_validation === "Rejeté" &&
                              certificat.motif_rejet && (
                                <span className="text-xs text-red-500 dark:text-red-400 italic">
                                  ({certificat.motif_rejet})
                                </span>
                              )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Link
                            to={`/certificats/${certificat.id_certificat}`}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Voir"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          {canManageCertificat && certificat.statut_validation === "En attente" && (
                            <>
                              <button
                                onClick={() => handleValider(certificat.id_certificat)}
                                disabled={valider.isPending}
                                className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Valider"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setRejectModal(certificat.id_certificat)}
                                disabled={valider.isPending}
                                className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Rejeter"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {/* Verrouillé côté serveur uniquement pour une soumission
                              adhérent déjà validée (CertificatMedicalService.
                              update/delete) — un certificat créé par le staff
                              reste modifiable comme avant. */}
                          {canManageCertificat &&
                            !(certificat.soumis_par_adherent && certificat.statut_validation === "Validé") && (
                            <>
                              <Link
                                to={`/certificats/edit/${certificat.id_certificat}`}
                                className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <FiEdit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() =>
                                  setDeleteModal(certificat.id_certificat)
                                }
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </motion.div>
      )}

      {/* Modal de confirmation de suppression */}
      {deleteModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                <FiTrash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Confirmer la suppression</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer ce certificat ?
              <br />
              <span className="text-sm text-red-500 font-medium">
                Cette action est irréversible.
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteModal)}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                Supprimer
              </button>
            </div>
          </motion.div>
        </ModalOverlay>
      )}

      {/* Modal de rejet (motif obligatoire) */}
      {rejectModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400 mb-4">
              <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                <FiX className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Rejeter cette soumission</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">
              L&apos;adhérent verra ce motif et pourra soumettre un nouveau certificat corrigé.
            </p>
            <textarea
              value={rejectMotif}
              onChange={(e) => setRejectMotif(e.target.value)}
              placeholder="Ex. : document illisible, date de validité incohérente"
              rows={3}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-300 focus:outline-none"
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectMotif("");
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleRejeter}
                disabled={!rejectMotif.trim() || valider.isPending}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Rejeter
              </button>
            </div>
          </motion.div>
        </ModalOverlay>
      )}
    </div>
  );
};

export default CertificatList;
