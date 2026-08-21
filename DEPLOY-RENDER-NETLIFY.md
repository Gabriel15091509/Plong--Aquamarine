# Déploiement Render + Netlify — runbook d'amorçage

Remplace le pipeline `k8s/` + ArgoCD (voir [DEPLOY.md](DEPLOY.md), qui reste
la référence pour un cluster Kubernetes local/démo) par une cible publique :
backend sur Render (7 microservices + passerelle + Postgres managé), frontend
sur Netlify. Ce document couvre les étapes **manuelles, à faire une seule
fois** — ensuite Render/Netlify redéploient automatiquement sur chaque
`git push` sur `main` (auto-deploy activé par défaut sur les deux).

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

`render.yaml` (racine du repo) et `netlify.toml` (racine du repo) décrivent
toute l'infrastructure — ce runbook ne fait que les brancher aux comptes.

## 1. Générer les deux jetons d'accès

**Render** : dashboard → icône de compte (haut droit) → *Account Settings* →
*API Keys* → *Create API Key*. Copier la valeur (affichée une seule fois).

**Netlify** : dashboard → icône de compte → *User settings* → *Applications*
→ *Personal access tokens* → *New access token*. Copier la valeur.

Donne-moi les deux valeurs (ou exporte-les dans ton shell avant de me le
dire) :

```powershell
$env:RENDER_API_KEY = "rnd_..."
$env:NETLIFY_AUTH_TOKEN = "nfp_..."
```

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

## 3. Autoriser Netlify à lire ce dépôt GitHub

Dashboard Netlify → *Add new site* → *Import an existing project* →
*Deploy with GitHub* → sélectionner ce repo. Netlify lit `netlify.toml`
(`base = "frontend"`, `command = "npm run build"`, `publish = "dist"`)
automatiquement — vérifier que ces trois champs sont bien pré-remplis avant
de cliquer *Deploy*. Renommer le site en `aquanature-plongee` (*Site
configuration* → *Change site name*) pour que son URL corresponde à celle
déjà câblée dans `render.yaml` (`CORS_ORIGIN`/`FRONTEND_URL`) et
`netlify.toml` (redirects `/api`, `/uploads`) — sinon voir l'étape 5.

## 4. Une fois les deux jetons fournis

Je peux alors, en ligne de commande :
- Vérifier l'état des 8 services Render (`render services list`, logs de
  build/déploiement, health checks).
- Renseigner les variables d'environnement secrètes (`EMAIL_*`,
  `GROQ_API_KEY`, `OVH_SMS_*`) via l'API Render sans passer par le dashboard.
- Builder le frontend en local (`npm run build`) et le déployer directement
  via `netlify deploy --prod --dir=frontend/dist` (ne nécessite pas que le
  site Netlify soit relié à GitHub — fonctionne uniquement avec le jeton).
- Lancer une vérification bout en bout (`curl` sur chaque `/health`, un
  scénario de connexion réel) et rapporter fidèlement ce qui fonctionne ou
  non.

## 5. Si l'URL Netlify réelle diffère de `aquanature-plongee.netlify.app`

Netlify ajoute un suffixe aléatoire si ce nom est déjà pris. Dans ce cas,
mettre à jour `CORS_ORIGIN` et `FRONTEND_URL` dans `render.yaml` (section
`aquanature-gateway`) avec l'URL réelle, et `netlify.toml` n'a lui besoin
d'aucun changement (il pointe vers Render, pas l'inverse). Un `git push`
suffit ensuite à répercuter le changement sur Render.

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
