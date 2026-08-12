import React from "react";

// Écran de chargement générique (composants gris qui pulsent), dont la
// forme reflète ce qui va réellement apparaître une fois les données
// chargées — même langage visuel que l'aperçu du tableau de bord affiché
// pendant la transition de connexion (src/pages/Auth/LoginPage.jsx).
//
// variant :
//   - "list"    : barre de filtres + lignes de tableau (pages de liste)
//   - "form"    : paires label/champ + boutons d'action (formulaires)
//   - "details" : en-tête + sections d'informations (fiches détail)
//   - "dashboard" (défaut) : cartes de statistiques + graphiques
const ListSkeleton = () => (
  <div className="w-full space-y-3">
    <div className="flex flex-wrap gap-3">
      <div className="h-10 flex-1 min-w-[200px] rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
      <div className="h-10 w-28 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
      <div className="h-10 w-28 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
    </div>
    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800">
          <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
            <div className="h-2.5 w-1/2 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
          </div>
          <div className="h-5 w-16 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse hidden sm:block flex-shrink-0" />
        </div>
      ))}
    </div>
  </div>
);

const FormSkeleton = () => (
  <div className="w-full max-w-2xl space-y-5">
    {[0, 1, 2, 3, 4].map((i) => (
      <div key={i} className="space-y-2">
        <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
        <div className="h-11 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 animate-pulse" />
      </div>
    ))}
    <div className="flex justify-end gap-3 pt-2">
      <div className="h-10 w-24 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
      <div className="h-10 w-32 rounded-xl bg-gray-200 dark:bg-gray-600 animate-pulse" />
    </div>
  </div>
);

const DetailsSkeleton = () => (
  <div className="w-full space-y-6">
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 animate-pulse flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-5 w-1/3 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
        <div className="h-3 w-1/4 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
      </div>
    </div>
    {[0, 1].map((s) => (
      <div
        key={s}
        className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 space-y-4"
      >
        <div className="h-4 w-32 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="h-2.5 w-1/3 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const DashboardSkeleton = () => (
  <div className="w-full space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5 space-y-3"
        >
          <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse" />
          <div className="h-6 w-2/3 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
          <div className="h-2.5 w-1/2 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 h-56 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 animate-pulse" />
      <div className="h-56 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 animate-pulse" />
    </div>
    <div className="h-40 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 animate-pulse" />
  </div>
);

const VARIANTS = {
  list: ListSkeleton,
  form: FormSkeleton,
  details: DetailsSkeleton,
  dashboard: DashboardSkeleton,
};

const LoadingSpinner = ({ size = "md", variant = "dashboard" }) => {
  if (size === "sm") {
    return (
      <div className="w-full max-w-xs space-y-2" role="status" aria-label="Chargement en cours">
        <div className="h-3 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
        <div className="h-3 w-4/5 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
        <div className="h-3 w-3/5 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
      </div>
    );
  }

  const Skeleton = VARIANTS[variant] || DashboardSkeleton;

  return (
    <div className="w-full py-2" role="status" aria-label="Chargement en cours">
      <Skeleton />
    </div>
  );
};

export default LoadingSpinner;
