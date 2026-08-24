import React from "react";

// Écran de chargement générique (composants gris qui pulsent), dont la
// forme ET la taille reflètent ce qui va réellement apparaître une fois
// les données chargées (mêmes dimensions que StatsCard, InfoItem,
// RecentActivity, les cartes de recharts, etc.) — même langage visuel que
// l'aperçu du tableau de bord affiché pendant la transition de connexion
// (src/pages/Auth/LoginPage.jsx).
//
// variant :
//   - "list"    : barre de filtres + lignes de tableau (pages de liste)
//   - "grid"    : barre de filtres + cartes en grille (pages de liste en
//                 vue grille par défaut, ex. SortiesPage)
//   - "form"    : paires label/champ + boutons d'action (formulaires)
//   - "details" : en-tête + sections d'informations (fiches détail)
//   - "dashboard" (défaut) : cartes de statistiques + graphiques
const ListSkeleton = () => (
  <div className="w-full space-y-4">
    <div className="flex flex-wrap gap-3">
      <div className="h-11 flex-1 min-w-[220px] rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
      <div className="h-11 w-32 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
      <div className="h-11 w-32 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
    </div>
    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-3.5 w-1/3 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
          </div>
          <div className="h-6 w-20 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse hidden sm:block flex-shrink-0" />
          <div className="h-8 w-16 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse hidden md:block flex-shrink-0" />
        </div>
      ))}
    </div>
  </div>
);

// Reprend la barre de filtres de ListSkeleton (même largeur/hauteur) puis
// des cartes reflétant la forme réelle des cartes en grille (bandeau photo
// h-40, lignes de titre/infos, barre d'actions en pied) — mêmes proportions
// que la grille grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 des pages en vue
// grille par défaut (ex. SortiesPage).
const GridSkeleton = () => (
  <div className="w-full space-y-4">
    <div className="flex flex-wrap gap-3">
      <div className="h-11 flex-1 min-w-[220px] rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
      <div className="h-11 w-32 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
      <div className="h-11 w-32 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800"
        >
          <div className="h-40 bg-gray-100 dark:bg-gray-700 animate-pulse" />
          <div className="p-4 space-y-2.5">
            <div className="h-3.5 w-2/3 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
            <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
            <div className="flex items-center gap-2 pt-2">
              <div className="h-7 w-7 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse" />
              <div className="h-7 w-7 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse" />
              <div className="h-7 w-7 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const FormSkeleton = () => (
  <div className="w-full max-w-2xl space-y-6">
    {[0, 1, 2, 3, 4].map((i) => (
      <div key={i} className="space-y-2">
        <div className="h-3.5 w-28 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
        <div className="h-11 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 animate-pulse" />
      </div>
    ))}
    <div className="flex justify-end gap-3 pt-4">
      <div className="h-11 w-28 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
      <div className="h-11 w-36 rounded-xl bg-gray-200 dark:bg-gray-600 animate-pulse" />
    </div>
  </div>
);

// Sections reprenant les classes exactes de SectionCard.jsx / InfoItem.jsx
// (mêmes paddings, marges, tailles d'icône) pour que la hauteur du
// squelette corresponde précisément à celle du vrai contenu, pas à une
// approximation.
const DetailsSkeleton = () => (
  <div className="w-full space-y-6">
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 animate-pulse flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2.5">
        <div className="h-6 w-1/3 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
        <div className="h-3.5 w-1/4 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
      </div>
      <div className="h-9 w-24 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse hidden sm:block flex-shrink-0" />
    </div>
    {[0, 1].map((s) => (
      <div
        key={s}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/20">
            <span className="block w-5 h-5 rounded bg-cyan-200/60 dark:bg-cyan-800/40 animate-pulse" />
          </span>
          <div className="h-5 w-40 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4 p-4">
              <div className="mt-0.5 p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                <span className="block w-5 h-5 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
                <div className="h-4 w-2/3 rounded bg-gray-100 dark:bg-gray-700 animate-pulse mt-1.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Reprend les classes exactes de StatsCard.jsx (mêmes p-5 / mt-4 / mt-2 /
// mt-1) et de la mise en page de DashboardPage.jsx (mêmes cartes p-6,
// mêmes hauteurs de ResponsiveContainer 300/260 pour Bar/PieChart), pour
// que le squelette occupe précisément la même place que le vrai contenu.
const DashboardSkeleton = () => (
  <div className="w-full space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-slate-700 animate-pulse flex-shrink-0" />
            <div className="h-3.5 flex-1 rounded bg-gray-100 dark:bg-slate-700 animate-pulse" />
          </div>
          <div className="h-7 w-2/3 rounded bg-gray-100 dark:bg-slate-700 animate-pulse mt-4" />
          <div className="h-3.5 w-1/3 rounded bg-gray-100 dark:bg-slate-700 animate-pulse mt-2" />
          <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-slate-700 animate-pulse mt-1" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 rounded bg-gray-100 dark:bg-slate-700 animate-pulse" />
            <div className="h-3 w-40 rounded bg-gray-100 dark:bg-slate-700 animate-pulse" />
          </div>
        </div>
        <div className="flex gap-4 mb-4">
          <div className="h-3 w-16 rounded bg-gray-100 dark:bg-slate-700 animate-pulse" />
          <div className="h-3 w-14 rounded bg-gray-100 dark:bg-slate-700 animate-pulse" />
          <div className="h-3 w-16 rounded bg-gray-100 dark:bg-slate-700 animate-pulse" />
        </div>
        <div className="h-[300px] rounded-2xl bg-gray-50 dark:bg-slate-900/40 animate-pulse" />
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 rounded bg-gray-100 dark:bg-slate-700 animate-pulse" />
            <div className="h-3 w-28 rounded bg-gray-100 dark:bg-slate-700 animate-pulse" />
          </div>
        </div>
        <div className="h-[260px] w-[260px] max-w-full mx-auto rounded-full bg-gray-50 dark:bg-slate-900/40 animate-pulse" />
        <div className="flex justify-center gap-4 mt-4">
          <div className="h-3 w-14 rounded bg-gray-100 dark:bg-slate-700 animate-pulse" />
          <div className="h-3 w-16 rounded bg-gray-100 dark:bg-slate-700 animate-pulse" />
          <div className="h-3 w-14 rounded bg-gray-100 dark:bg-slate-700 animate-pulse" />
        </div>
      </div>
    </div>
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 animate-pulse" />
        <div className="space-y-1.5">
          <div className="h-4 w-36 rounded bg-gray-100 dark:bg-slate-700 animate-pulse" />
          <div className="h-3 w-48 rounded bg-gray-100 dark:bg-slate-700 animate-pulse" />
        </div>
      </div>
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-700/30 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-600 animate-pulse flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="h-3.5 w-1/3 rounded bg-gray-200 dark:bg-slate-600 animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-slate-600 animate-pulse" />
            </div>
            <div className="h-3 w-10 rounded bg-gray-200 dark:bg-slate-600 animate-pulse flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const VARIANTS = {
  list: ListSkeleton,
  grid: GridSkeleton,
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
