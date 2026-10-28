import { QueryClient } from "@tanstack/react-query";

// Centralisé ici (plutôt que défini localement dans App.jsx) pour qu'AuthContext.jsx
// puisse aussi l'importer (queryClient.clear() au login/logout).
//
// Une persistance localStorage du cache (via @tanstack/react-query-persist-client)
// a été essayée ici pour éviter l'attente au rechargement de page, avec un
// cacheTime relevé à 24h pour que les données restent disponibles longtemps.
// Retiré : ce club a un volume de données réel important (~2250 plongées et
// plus), et le cache accumulait au fil de la navigation toutes les listes
// consultées dans un même JSON réécrit en entier dans localStorage à chaque
// mise à jour — une opération SYNCHRONE (JSON.stringify + setItem) de plus en
// plus lourde à mesure que ce blob grossissait, au point de geler le fil
// JavaScript principal assez longtemps pour faire dépasser le timeout de 30s
// à des requêtes par ailleurs normales ("presque tout devient lent"). Un
// cacheTime de 24h aggravait aussi le problème même sans la persistance : les
// requêtes inactives n'étaient plus jamais nettoyées de la mémoire pendant
// une session. Si le besoin revient, prévoir une persistance sélective
// (seulement quelques requêtes légères, jamais des listes complètes) et un
// vrai test de charge contre le volume réel de données avant de la remettre.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});
