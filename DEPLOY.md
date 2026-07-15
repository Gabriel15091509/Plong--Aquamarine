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
dans `k8s/kustomization.yaml` (namespace, configmap, postgres, les 7
services, l'ingress). Ne plus jamais lancer `kubectl apply -k k8s/` à la
main après ça — laisser ArgoCD le faire.

## 5. Rendre les images GHCR publiques

Après le premier `git push` qui déclenche la CI pour un service donné, son
image apparaît dans l'onglet **Packages** du dépôt GitHub. Pour chacune :
Package settings → Change visibility → **Public**.

Ceci évite d'avoir à gérer un `imagePullSecrets`/PAT sur la machine de
démo — les manifests utilisent déjà `imagePullPolicy: IfNotPresent` (correct
avec des tags `sha-` immuables).

## 6. Ensuite

Un simple `git push` sur `main` suffit :
`CI (lint → test → build → scan → push GHCR → bump tag) → ArgoCD sync → pods à jour`.

Voir le plan `shiny-rolling-teapot.md` pour le script de vérification complet
et le scénario de démonstration du `selfHeal` d'ArgoCD.
