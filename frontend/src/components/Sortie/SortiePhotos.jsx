import React, { useState } from "react";
import { FiImage, FiPlus, FiExternalLink, FiTrash2, FiLock } from "react-icons/fi";
import { useSorties } from "../../hooks/Sortie/useSorties";
import LoadingSpinner from "../Common/LoadingSpinner";
import ExternalLinkModal from "../Common/ExternalLinkModal";
import { formatDateTime } from "../../utils/helpers";

// Photos d'une sortie — déplacées depuis Plongee.lien_photos (un lien
// unique par plongée individuelle) : partagées par toute la sortie plutôt
// qu'éclatées entre les plongées de chacun, plusieurs à la fois (un lien
// par ligne), et réservées aux participants (voir SortieService
// .assertCanAccessPhotos côté backend — la restriction d'accès réelle est
// là, pas ici : ce composant se contente d'afficher le message renvoyé par
// un 403 plutôt que de retenter de deviner qui a le droit).
const SortiePhotos = ({ sortie }) => {
  const { useGetPhotos, useAddPhotos, useRemovePhoto } = useSorties();
  const { data, isLoading, error } = useGetPhotos(sortie?.id_sortie);
  const addPhotos = useAddPhotos();
  const removePhoto = useRemovePhoto();

  const [showForm, setShowForm] = useState(false);
  const [liens, setLiens] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  const photos = data?.data || [];
  const refuse = error?.response?.status === 403;

  const handleAdd = async (e) => {
    e.preventDefault();
    // Un lien par ligne : permet de coller d'un coup toute une série de
    // liens (album partagé, plusieurs photos isolées...) sans repasser par
    // le formulaire à chaque fois.
    const urls = liens.split("\n").map((l) => l.trim()).filter(Boolean);
    if (urls.length === 0) return;
    try {
      await addPhotos.mutateAsync({ id: sortie.id_sortie, urls });
      setLiens("");
      setShowForm(false);
    } catch (err) {
      // géré par le hook (toast)
    }
  };

  const handleRemove = (photoId) => {
    removePhoto.mutate({ id: sortie.id_sortie, photoId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <LoadingSpinner variant="details" />
      </div>
    );
  }

  if (refuse) {
    return (
      <div className="text-center py-10">
        <FiLock className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Réservé aux participants de cette sortie
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Seuls les adhérents inscrits (confirmés) et l&apos;encadrement
          peuvent voir et déposer des photos ici.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
          <FiImage className="w-3.5 h-3.5" />
          Photos ({photos.length})
        </p>
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          <FiPlus className="w-4 h-4" />
          Ajouter des photos
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mb-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 space-y-3"
        >
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Liens photos — un par ligne
            </label>
            <textarea
              value={liens}
              onChange={(e) => setLiens(e.target.value)}
              placeholder={"https://...\nhttps://...\nhttps://..."}
              rows={4}
              autoFocus
              className="w-full px-3 py-2 text-sm border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Collez autant de liens que vous voulez (album partagé, photos
              isolées...), un par ligne : tous seront ajoutés d&apos;un coup.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={addPhotos.isPending || !liens.trim()}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60"
            >
              Ajouter
            </button>
          </div>
        </form>
      )}

      {photos.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
          Aucune photo pour le moment — soyez le premier à en partager.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="flex items-center justify-between gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800"
            >
              <button
                type="button"
                onClick={() => setPreviewUrl(photo.url)}
                className="flex items-center gap-2 min-w-0 text-left flex-1"
                title="Aperçu"
              >
                <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shrink-0">
                  <FiImage className="w-4 h-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-900 dark:text-white truncate">
                    Ajoutée par {photo.ajoute_par_nom || "un participant"}
                  </span>
                  <span className="block text-xs text-gray-400 dark:text-gray-500">
                    {formatDateTime(photo.date_ajout)}
                  </span>
                </span>
              </button>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Ouvrir dans un nouvel onglet"
                >
                  <FiExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => handleRemove(photo.id)}
                  disabled={removePhoto.isPending}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Retirer cette photo"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ExternalLinkModal
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        url={previewUrl}
        title="Photo"
      />
    </div>
  );
};

export default SortiePhotos;
