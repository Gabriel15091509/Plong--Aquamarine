# Déploiement Render + Cloudflare Pages — runbook d'amorçage

Remplace le pipeline `k8s/` + ArgoCD (voir [DEPLOY.md](DEPLOY.md), qui reste
la référence pour un cluster Kubernetes local/démo) par une cible publique :
backend sur Render (7 microservices + passerelle + Postgres managé), frontend
sur Cloudflare Pages. Ce document couvre les étapes **manuelles, à faire une
seule fois** — ensuite Render redéploie automatiquement sur chaque
`git push` sur `main` (auto-deploy activé par défaut), et le frontend est
publié par `.github/workflows/deploy-cloudflare.yml` (voir ce fichier pour le
détail : ce dépôt n'est volontairement pas relié au projet Pages via
l'intégration GitHub native de Cloudflare, pour que le seul chemin de
publication soit ce workflow — pas de divergence possible entre `main` et ce
qui est en ligne).

> Migré de Netlify le 2026-08-23 : le jeton `NETLIFY_AUTH_TOKEN` s'est mis à
> échouer en `JSONHTTPError: Forbidden` de façon persistante (build OK,
> seul l'appel à l'API Netlify était rejeté), même après régénération —
> cause non identifiable sans accès au compte Netlify. Cloudflare Pages
> couvre le même besoin (plan gratuit, sous-domaine `*.pages.dev`, pas de
> domaine personnalisé en jeu ici) avec un chemin de déploiement plus simple
> à déboguer (`wrangler pages deploy` en ligne de commande).

> Correctif le même jour : le proxy `/api`/`/uploads` a d'abord été tenté via
> `frontend/public/_redirects` (même syntaxe que Netlify) — mais le "proxy"
> `_redirects` (status 200 vers une URL externe) ne relaie que GET/HEAD sur
> Cloudflare Pages, contrairement à Netlify qui relayait aussi POST/PUT/
> DELETE/PATCH de la même façon. Conséquence en prod : `/api/health` (GET)
> répondait, `/api/auth/login` (POST) renvoyait 405 — connexion impossible.
> Remplacé par deux Cloudflare Pages Functions (`frontend/functions/api/
> [[path]].js`, `frontend/functions/uploads/[[path]].js`), qui relaient
> l'intégralité de la requête (méthode, headers, corps) sans cette limite.

Plan gratuit partout, ce qui implique deux limites acceptées pour ce
déploiement (voir échanges du 2026-08-21) :
- **Fichiers uploadés perdus à chaque redéploiement** d'`aquanature-identite`
  (avatars) et `aquanature-vie-associative` (certificats médicaux, documents
  d'adhésion) — pas de disque persistant sur le plan gratuit Render. Passer
  ces deux services en plan payant + `disk:` dans `render.yaml` si ça devient
  gênant.
- **Cold start** : un service Render gratuit inactif 15 min se met en veille ;
  la requête suivante attend son réveil (~30-60s). Avec 8 services gratuits
  qui s'endorment indépendamment, la toute première requête après une pause
  peut être lente, voire tomber en timeout si plusieurs services enchaînés
  doivent se réveiller en cascade (ex. gateway → identite → finance).

`render.yaml` (racine du repo) décrit toute l'infrastructure backend ;
`frontend/functions/{api,uploads}/[[path]].js` proxifient `/api/*` et
`/uploads/*` vers la passerelle Render (toutes méthodes HTTP) et
`frontend/public/_redirects` ne garde que le fallback SPA — ce runbook ne
fait que les brancher aux comptes.

## 1. Générer les deux jetons d'accès

**Render** : dashboard → icône de compte (haut droit) → *Account Settings* →
*API Keys* → *Create API Key*. Copier la valeur (affichée une seule fois).

**Cloudflare** : dashboard → *My Profile* → *API Tokens* → *Create Token* →
template "Edit Cloudflare Workers" (couvre Pages) ou un jeton personnalisé
avec la permission *Account > Cloudflare Pages > Edit*. Noter aussi
l'*Account ID*, visible dans la barre latérale droite de n'importe quelle
page du dashboard.

Un jeton d'API ne doit jamais être collé en clair dans une conversation —
le mettre directement en secret GitHub (étape 4).

## 2. Autoriser Render à lire ce dépôt GitHub

Étape obligatoirement manuelle (autorisation OAuth liée à ton compte
GitHub) : dashboard Render → *New +* → *Blueprint* → *Connect GitHub* →
sélectionner ce repo (`plongee-app`) → Render détecte `render.yaml` à la
racine et propose les 8 services + la base. Vérifier les noms proposés
(`aquanature-*`) puis *Apply* — Render crée tout et lance le premier build.

À ce stade, les variables marquées `sync: false` dans `render.yaml`
(`EMAIL_USER`, `EMAIL_PASSWORD`, `GROQ_API_KEY`, `OVH_SMS_*`) sont vides :
les fonctionnalités correspondantes dégradent proprement (email/SMS simulés,
validation automatique de documents désactivée) tant qu'elles ne sont pas
renseignées à la main, service par service, dans *Environment* sur le
dashboard Render (ou via l'API une fois le jeton fourni).

## 3. Créer le projet Cloudflare Pages

Dashboard Cloudflare → *Workers & Pages* → *Create* → *Pages* → *Upload
assets* (PAS "Connect to Git" : le déploiement passe par le workflow GitHub
Actions, pas par l'intégration Git native de Cloudflare) → nommer le projet
`aquanature-plongee` pour que son URL (`https://aquanature-plongee.pages.dev`)
corresponde à celle déjà câblée dans `render.yaml`
(`CORS_ORIGIN`/`FRONTEND_URL`) — sinon voir la section 5. Un premier upload
"à vide" (n'importe quel dossier, même un fichier `index.html` minimal)
suffit pour créer le projet ; le workflow le remplacera au prochain push.

## 4. Renseigner les secrets GitHub Actions

Repo → *Settings* → *Secrets and variables* → *Actions* → *New repository
secret* :
- `CLOUDFLARE_API_TOKEN` : le jeton de l'étape 1.
- `CLOUDFLARE_ACCOUNT_ID` : l'Account ID de l'étape 1.

C'est le seul endroit où ces valeurs doivent transiter.

## 5. Si le nom de projet Cloudflare réel diffère de `aquanature-plongee`

Cloudflare refuse un nom déjà pris (globalement, tous comptes confondus)
et n'ajoute pas de suffixe automatique comme le faisait Netlify — il faut
choisir un autre nom directement à la création. Dans ce cas, mettre à jour
trois endroits :
- `--project-name=` dans `.github/workflows/deploy-cloudflare.yml`.
- `CORS_ORIGIN` et `FRONTEND_URL` dans `render.yaml` (section
  `aquanature-gateway`) avec l'URL réelle.
- Rien à changer dans `frontend/functions/{api,uploads}/[[path]].js` ni
  `frontend/public/_redirects` (ils pointent vers Render, pas l'inverse).

Un `git push` suffit ensuite à répercuter le changement sur Render et sur
le prochain déploiement Cloudflare Pages.

## 6. Sécurité — points à trancher avant d'ouvrir l'accès publiquement

- `PRESIDENT_2FA_DISABLED=true` existe dans `k8s/base/plongee-config.env`
  (désactivation temporaire, déjà commentée comme un risque assumé
  uniquement pour le cluster local) — **volontairement pas repris** dans
  `render.yaml` : le 2FA du président reste actif sur ce déploiement public.
- Les 8 services Render sont chacun exposés publiquement en HTTPS (pas
  d'ingress unique équivalent à celui de k8s) : `IDENTITE_SERVICE_URL`,
  `FINANCE_SERVICE_URL`, etc. répondent directement sur internet, pas
  seulement via la passerelle. Chaque service applique déjà son propre
  `authMiddleware` (JWT), mais ça vaut la peine de vérifier qu'aucune route
  interne (ex. `/paiements/linked`, les endpoints `identiteClient`
  inter-services) n'est accessible sans authentification avant d'annoncer
  l'URL publiquement.
