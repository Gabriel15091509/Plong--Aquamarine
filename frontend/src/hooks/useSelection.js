import { useState, useCallback } from "react";

// Sélection multiple générique pour une liste (adhérents, formations,
// sorties, etc.) — ne stocke que des ids dans un Set, jamais les objets
// complets, pour rester valide même si la liste sous-jacente se recharge
// (refetch) tant que les ids ne changent pas. Utilisé par toutes les
// pages de listage pour la barre d'actions groupées (voir BulkActionBar).
export function useSelection() {
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const isSelected = useCallback((id) => selectedIds.has(id), [selectedIds]);

  const toggle = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  // true seulement si `ids` est non vide et entièrement contenu dans la
  // sélection — sert à cocher la case "tout sélectionner" de la page
  // courante sans compter les éléments sélectionnés sur une autre page.
  const allSelected = useCallback(
    (ids) => ids.length > 0 && ids.every((id) => selectedIds.has(id)),
    [selectedIds],
  );

  // Coche/décoche l'ensemble des `ids` fournis (ex. la page affichée) —
  // désélectionne tout si déjà entièrement sélectionné, sélectionne sinon.
  const toggleAll = useCallback((ids) => {
    setSelectedIds((prev) => {
      const alreadyAllSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      if (alreadyAllSelected) {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    isSelected,
    toggle,
    clear,
    allSelected,
    toggleAll,
  };
}
