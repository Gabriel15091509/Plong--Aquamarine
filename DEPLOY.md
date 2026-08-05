# Déploiement GitOps — runbook d'amorçage (à faire une seule fois par cluster)

Ce document couvre uniquement les étapes manuelles nécessaires **une seule
fois** pour amorcer le cycle GitOps. Une fois ces étapes faites, tout
déploiement suivant se résume à `git push` sur `main` : GitHub Actions
construit et pousse les images sur GHCR, met à jour
`k8s/kustomization.yaml`, et ArgoCD synchronise automatiquement le cluster.

Prérequis : Docker Desktop installé avec son Kubernetes intégré activé
(Settings → Kubernetes → Enable Kubernetes), `kubectl` pointant sur le
contexte `docker-desktop` (`kubectl config current-context`).

## 1. Contrôleur Ingress

Le Kubernetes intégré à Docker Desktop ne fournit pas de contrôleur Ingress
par défaut (contrairement à l'addon `minikube addons enable ingress`) :

```powershell
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.2/deploy/static/provider/cloud/deploy.yaml
kubectl -n ingress-nginx wait --for=condition=available deploy/ingress-nginx-controller --timeout=180s
```

## 2. Secret applicatif (JAMAIS géré par GitOps)

```powershell
Copy-Item k8s\secret.example.yaml k8s\secret.yaml
# éditer k8s/secret.yaml et remplacer les valeurs change_me (DB_PASSWORD,
# JWT_SECRET, EMAIL_USER, EMAIL_PASSWORD)
kubectl apply -f k8s/secret.yaml
```

`k8s/secret.yaml` est gitignoré et n'est jamais référencé dans
`k8s/kustomization.yaml` : ArgoCD ne le voit pas, ne le supprime jamais,
même avec `prune: true`.

## 3. ArgoCD

```powershell
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl -n argocd wait --for=condition=available deploy/argocd-server --timeout=300s
```

Mot de passe admin initial :

```powershell
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}'
# puis décoder le résultat en base64 (ex. via https://www.base64decode.org
# ou `[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String("..."))`)
```

Accès à l'UI (démo locale, pas d'Ingress/TLS pour ArgoCD lui-même) :

```powershell
kubectl port-forward svc/argocd-server -n argocd 8080:443
# puis ouvrir https://localhost:8080 (utilisateur "admin")
```

## 4. Brancher ArgoCD sur ce dépôt

```powershell
kubectl apply -f argocd/application.yaml
```

À partir de cette commande, ArgoCD prend en charge tout ce qui est listé
dans `k8s/overlays/production` (qui référence `k8s/base` : namespace,
configmap, postgres, les 7 services backend, le frontend, l'ingress). Ne
plus jamais lancer `kubectl apply -k k8s/overlays/production` à la main
après ça — laisser ArgoCD le faire.

Pour l'environnement de staging (namespace séparé, avec HPA — voir
section 8), c'est `argocd/application-staging.yaml` qu'il faut appliquer,
en plus et indépendamment de celui-ci.

## 4bis. Accélérer la détection des changements (optionnel mais recommandé)

Par défaut, ArgoCD ne relit le dépôt git que toutes les 3 minutes
(`timeout.reconciliation`) — pas de webhook possible ici puisque le
serveur ArgoCD n'est joignable qu'en local (`port-forward`), pas depuis
GitHub. Pour réduire ce délai à 30s :

```powershell
kubectl -n argocd patch cm argocd-cm --type merge -p '{"data":{"timeout.reconciliation":"30s"}}'
kubectl -n argocd rollout restart deployment argocd-repo-server argocd-server
kubectl -n argocd rollout restart statefulset argocd-application-controller
```

Pour forcer une resynchronisation immédiate sans attendre le polling (ex.
juste après avoir vu la CI terminer) :

```powershell
kubectl -n argocd annotate application plongee-app argocd.argoproj.io/refresh=hard --overwrite
```

## 5. Rendre les images GHCR publiques

Après le premier `git push` qui déclenche la CI pour un service donné, son
image apparaît dans l'onglet **Packages** du dépôt GitHub. Pour chacune :
Package settings → Change visibility → **Public**.

Ceci évite d'avoir à gérer un `imagePullSecrets`/PAT sur la machine de
démo — les manifests utilisent déjà `imagePullPolicy: IfNotPresent` (correct
avec des tags `sha-` immuables).

## 6. Accéder à l'application déployée

Une fois `frontend` synchronisé (`kubectl get pods -n plongee-app`), l'appli
complète est servie par l'Ingress sur **http://localhost** (port 80, exposé
directement par Docker Desktop) : le frontend statique sur `/`, chaque
`/api/...` routé vers le microservice propriétaire (voir
`k8s/overlays/production/08-ingress.yaml`). C'est différent du
`http://localhost:3000` du
serveur de dev Vite (`npm run dev`), qui reste utilisable en parallèle pour
développer sans repasser par le cluster à chaque changement.

## 7. Ensuite

Un simple `git push` sur `main` suffit :
`CI (lint → test → build → scan → push GHCR → bump tag) → ArgoCD sync → pods à jour`.

Voir le plan `shiny-rolling-teapot.md` pour le script de vérification complet
et le scénario de démonstration du `selfHeal` d'ArgoCD.

## 8. Environnement de staging + autoscaling horizontal (HPA)

En plus de l'environnement ci-dessus (namespace `plongee-app`, ci-après
« production »), un second environnement isolé existe pour tester une
release avant de la considérer stable : namespace `plongee-app-staging`,
mêmes images (mêmes tags `sha-`, bumpés par le même job CI que la
production — voir `k8s/base/kustomization.yaml`), mais avec un
`HorizontalPodAutoscaler` par service (`min=1`, `max=3` réplicas, cible
70% d'utilisation CPU) au lieu d'un nombre de réplicas fixe. Pas
d'Ingress/TLS en staging : environnement interne au cluster uniquement,
jamais exposé sur le nom de domaine public de production.

### 8.1. metrics-server (prérequis du HPA)

Le HPA a besoin de métriques CPU en temps réel, fournies par
`metrics-server` — absent par défaut sur le Kubernetes intégré à Docker
Desktop.

```powershell
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
# Les certificats du kubelet de Docker Desktop ne passent pas la
# vérification TLS stricte par défaut de metrics-server — contournement
# standard en environnement local/démo (à ne PAS faire sur un vrai cluster
# de production) :
kubectl -n kube-system patch deployment metrics-server --type='json' `
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
kubectl -n kube-system wait --for=condition=available deploy/metrics-server --timeout=120s
```

Vérification : `kubectl top pods -n plongee-app-staging` doit renvoyer des
valeurs CPU/mémoire (pas une erreur `Metrics API not available`) une fois
les pods de staging démarrés.

### 8.2. Secret applicatif (même principe qu'en production, section 2)

```powershell
Copy-Item k8s\secret.example.yaml k8s\secret-staging.yaml
# éditer k8s/secret-staging.yaml : remplacer namespace: plongee-app par
# plongee-app-staging, et les valeurs change_me
kubectl apply -f k8s\secret-staging.yaml
Remove-Item k8s\secret-staging.yaml   # copie temporaire, ne jamais committer
```

### 8.3. Brancher ArgoCD sur l'overlay staging

```powershell
kubectl apply -f argocd/application-staging.yaml
```

### 8.4. Vérifier le HPA

```powershell
kubectl get hpa -n plongee-app-staging
# TARGETS doit passer de "<unknown>/70%" à une vraie valeur (ex. "3%/70%")
# une fois metrics-server opérationnel et les pods up depuis 1-2 minutes.
```

Pour déclencher une montée en charge visible (démo) :

```powershell
kubectl run -n plongee-app-staging charge-cpu --image=busybox --restart=Never -- `
  sh -c "while true; do wget -q -O- http://gateway-service:5000/health; done"
kubectl get hpa -n plongee-app-staging -w
# nettoyage ensuite :
kubectl delete pod -n plongee-app-staging charge-cpu
```

## 9. Workflow Git et promotion staging → prod

- **`feature/**`** : chaque push déclenche lint + tests unitaires/
  intégration + build/scan d'image (job `build`/`build-frontend`), pour
  un feedback rapide — sans jamais toucher au GitOps (`e2e-smoke` et le
  bump des tags restent réservés à `main`).
- **`main`** (après merge d'une PR) : le pipeline complet tourne —
  build → bump immédiat du tag de **staging** → E2E (Playwright, stack
  éphémère miroir de la config staging) → si vert, bump du tag de
  **production**. Voir `k8s/base/kustomization.yaml` (source des tags de
  prod) et `k8s/overlays/staging/kustomization.yaml` (source des tags de
  staging, bumpée en premier et indépendamment).

Ce découpage n'appelle jamais l'API ArgoCD ni le cluster depuis la CI
(les runners GitHub Actions cloud n'ont aucune route vers le Docker
Desktop local) : c'est le contenu de Git lui-même qui encode le gate —
ArgoCD (qui tourne côté cluster) se contente de refléter, en pull, ce
que Git contient pour chaque environnement.
# demo 08/05/2026 14:06:05
