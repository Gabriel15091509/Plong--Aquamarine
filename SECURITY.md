# Sécurité applicative

## Activation locale

Redémarrer les sept services backend et le frontend après ces changements.
Utiliser `https://localhost:3000` pour la session web : le cookie est
`HttpOnly`, `Secure`, `SameSite=Strict`, avec le préfixe `__Host-`.
Les anciens JWT non enregistrés sont refusés : chaque utilisateur doit se reconnecter.

Le service identité crée au démarrage le schéma `security` et sa table
`auth_sessions`, sans supprimer les données métier. Le compte PostgreSQL doit
avoir les droits correspondants ; si cette initialisation échoue, le service
ne doit pas accepter de connexions.

## Sessions

Les sessions sont enregistrées en base sous forme d'empreintes des jetons.
Chaque requête protégée vérifie leur état auprès du service identité, sans
cache d'autorisation. Une déconnexion révoque le jeton, même s'il a été copié.
Les sessions expirent après 15 minutes d'inactivité côté serveur et à
l'expiration du JWT. Un changement de mot de passe ou de rôle invalide les
sessions précédentes ; la désactivation du compte les révoque également.
Un changement de mot de passe émet ensuite une nouvelle session.

Si le service identité est indisponible, les autres services refusent l'accès
avec une erreur temporaire 503, sans accepter une session non vérifiée.
Le schéma `security` est exclu des sauvegardes applicatives pour ne pas
réactiver des sessions lors d'une restauration.

## Authentification du président

La connexion du président nécessite un code email à six chiffres, généré
cryptographiquement, haché en base, valable cinq minutes et utilisable une
seule fois. Cinq essais incorrects au maximum sont admis par code.
La réinitialisation du mot de passe renvoie le président à la connexion,
afin de ne pas contourner cette étape.

Configurer un véritable serveur SMTP dans `backend/identite-service/.env`
avec `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD` et, si nécessaire,
`EMAIL_FROM` et `EMAIL_SECURE`. Les emails de sécurité sont envoyés de manière
synchrone : l'absence de configuration ou un échec d'envoi ne donne aucun accès.
Ne jamais journaliser les codes ni utiliser une simulation en remplacement.

## CORS et CSP

Configurer `CORS_ORIGIN` ou `FRONTEND_URL` sur chaque service. Plusieurs origines
exactes peuvent être séparées par des virgules. Le joker `*` n'autorise aucune
origine. Hors production, les origines HTTP/HTTPS locales sur le port 3000
sont ajoutées pour le développement sur le réseau local.

La CSP est appliquée aux API et au frontend, y compris dans le HTML compilé.
Les scripts inline sont bloqués dans la version compilée. En développement,
une exception permet le préambule React Refresh de Vite. Les styles inline
restent autorisés pour React et Leaflet ; les services cartographiques et les
médias utilisés par l'interface sont explicitement pris en compte.

## Appels internes

Les clients HTTP internes ajoutent une preuve de service signée et de courte
durée, tout en conservant le jeton utilisateur lorsqu'il est fourni. Les tâches
automatiques utilisent une identité système signée. Les services partagent
`JWT_SECRET` ; sa valeur doit rester privée et identique entre eux.

Les routes de modification du niveau, du compteur de plongées et du statut de
formation des adhérents nécessitent une preuve d'appel interne. Les résolutions
de profils par compte sont limitées au propriétaire ou au personnel autorisé.

## Vérifications

Les tests `backend/identite-service/tests/browserSession.test.js` couvrent les
cookies, CSRF, OTP, la révocation et les six vrais middlewares distants via HTTP.
`securityPolicy.test.js` couvre CORS, CSP et les preuves de service.
Les tests utilisent des doubles pour la persistance des sessions et le SMTP :
ils n'envoient pas d'emails et ne modifient pas la base métier.
